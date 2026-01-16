# STEP_8 – Smarter Telegram Messages (parse rating/tags/category) + Safer Ingest

Goal of this step:
- You can send **one message** to your bot like:
  - `4.6 coffee #laptop #quiet Malasaña <google-maps-link>`
  - `bar #groups La Latina <link> "Great for big groups, not for cocktails"`
- Bot extracts:
  - URL
  - rating (optional)
  - category (optional)
  - neighborhood (optional)
  - tags from hashtags
  - optional note in quotes → short blurb / long review
- Bot sends those fields to `/api/ingest`
- `/api/ingest` validates + applies your overrides cleanly

This makes adding places fast and “you-shaped”.

---

## 1) Decide the Telegram message format (what you will actually type)

Support these patterns (super easy to remember):

### A) Minimal
`<maps link>`

### B) With category + tags
`coffee #laptop #quiet <maps link>`

### C) With rating
`4.7 coffee #laptop <maps link>`

### D) With neighborhood
`4.7 coffee Malasaña #laptop <maps link>`

### E) With a note in quotes (becomes short blurb)
`coffee #quiet <maps link> "Amazing light in the morning, loud after 6"`

Rules:
- Rating = first number between 1 and 5 (e.g. 4.2)
- Category keywords: `coffee`, `restaurant`, `bar`
- Tags are hashtags: `#laptop`, `#quiet`, `#firstdate` etc.
- Neighborhood: any single token that isn’t a tag/category/rating/url (we’ll also accept multi-word neighborhoods in quotes later)
- Quote `"..."` → short blurb (or long review if you prefer)

---

## 2) Update `/api/ingest` to accept overrides (already does) + add stronger validation

Open `app/api/ingest/route.ts` and add these helpers near the top:

```ts
function normalizeCategory(input?: string) {
  if (!input) return undefined;
  const v = input.toLowerCase();
  if (v === "coffee" || v === "cafe" || v === "caf\u00e9") return "coffee";
  if (v === "restaurant" || v === "food") return "restaurant";
  if (v === "bar" || v === "drinks") return "bar";
  return undefined;
}

function clampRating(input?: number) {
  if (typeof input !== "number") return undefined;
  if (Number.isNaN(input)) return undefined;
  return Math.min(5, Math.max(1, input));
}

function normalizeTags(tags?: string[]) {
  if (!Array.isArray(tags)) return undefined;
  const cleaned = tags
    .map((t) => t.toLowerCase().trim().replace(/^#/, ""))
    .filter(Boolean);
  // de-dupe
  return Array.from(new Set(cleaned));
}

function normalizeGoodFor(g?: string[]) {
  if (!Array.isArray(g)) return undefined;
  const cleaned = g.map((x) => x.toLowerCase().trim()).filter(Boolean);
  return Array.from(new Set(cleaned));
}
Then, inside your POST handler, where you set defaults, update to:

const category = normalizeCategory(body.category) ?? "coffee";

const rating = clampRating(body.rating) ?? 4.0;

const tags = normalizeTags(body.tags) ?? [];
const goodFor = normalizeGoodFor(body.goodFor) ?? [];
Also, when you store shortBlurb, ensure it’s not empty:

const shortBlurb =
  body.shortBlurb?.trim() ||
  `Added from Google Maps. I’ll write a real note later.`;
This makes ingest robust against messy bot parsing.

3) Upgrade the Telegram bot parser
Open bot/index.ts and replace the simplistic message parsing with a proper parser.

3.1 Add parsing helpers
Add these functions near the top (below extractUrl):

type ParsedMessage = {
  mapsUrl: string;
  rating?: number;
  category?: "coffee" | "restaurant" | "bar";
  neighborhood?: string;
  tags?: string[];
  shortBlurb?: string;
};

function parseFirstRating(tokens: string[]) {
  for (const t of tokens) {
    const n = Number(t.replace(",", "."));
    if (!Number.isNaN(n) && n >= 1 && n <= 5) return n;
  }
  return undefined;
}

function parseCategory(tokens: string[]) {
  for (const t of tokens) {
    const v = t.toLowerCase();
    if (v === "coffee" || v === "cafe" || v === "café") return "coffee";
    if (v === "restaurant" || v === "food") return "restaurant";
    if (v === "bar" || v === "drinks") return "bar";
  }
  return undefined;
}

function parseTags(tokens: string[]) {
  const tags = tokens
    .filter((t) => t.startsWith("#"))
    .map((t) => t.slice(1).toLowerCase().trim())
    .filter(Boolean);
  return tags.length ? Array.from(new Set(tags)) : undefined;
}

function parseQuotedNote(text: string) {
  // first "..." occurrence
  const match = text.match(/"([^"]+)"/);
  return match?.[1]?.trim() || undefined;
}

function parseNeighborhood(tokens: string[], used: Set<string>) {
  // First token that isn't rating/category/tag/url and isn't "madrid"
  for (const t of tokens) {
    if (used.has(t)) continue;
    const v = t.toLowerCase();
    if (v === "madrid") continue;
    // avoid very short junk
    if (t.length < 3) continue;
    return t;
  }
  return undefined;
}

function parseMessage(text: string): ParsedMessage | null {
  const mapsUrl = extractUrl(text);
  if (!mapsUrl) return null;

  const shortBlurb = parseQuotedNote(text);

  // Remove URL and quotes to make token parsing cleaner
  const withoutUrl = text.replace(mapsUrl, " ");
  const withoutQuotes = withoutUrl.replace(/"[^"]*"/g, " ");
  const tokens = withoutQuotes
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const rating = parseFirstRating(tokens);
  const category = parseCategory(tokens);
  const tags = parseTags(tokens);

  const used = new Set<string>();
  if (rating !== undefined) used.add(String(rating));
  if (category) used.add(category);
  tokens.filter((t) => t.startsWith("#")).forEach((t) => used.add(t));

  // Mark URL-ish tokens as used
  tokens.filter((t) => t.startsWith("http")).forEach((t) => used.add(t));

  // Also mark common synonyms so they don't become neighborhood
  tokens.forEach((t) => {
    const v = t.toLowerCase();
    if (v === "cafe" || v === "café") used.add(t);
    if (v === "food" || v === "drinks") used.add(t);
  });

  const neighborhood = parseNeighborhood(tokens, used);

  return {
    mapsUrl,
    rating,
    category: category || undefined,
    neighborhood,
    tags,
    shortBlurb,
  };
}
3.2 Use the parser in the message handler
Replace the core handler that reads the URL with:

bot.on("message", async (msg) => {
  const userId = msg.from?.id;
  if (!isAllowed(userId)) {
    return bot.sendMessage(msg.chat.id, "Not authorized.");
  }

  const text = msg.text || "";
  if (text.startsWith("/start")) {
    return bot.sendMessage(
      msg.chat.id,
      "Send a Google Maps link. Optional format:\n" +
        '4.6 coffee #laptop #quiet Malasaña <link> "short note"\n' +
        "Category: coffee|restaurant|bar. Tags: #tag"
    );
  }

  const parsed = parseMessage(text);
  if (!parsed) {
    return bot.sendMessage(
      msg.chat.id,
      "I couldn’t find a URL. Paste a Google Maps share link.\n" +
        'Example: 4.6 coffee #laptop Malasaña <link> "good light in mornings"'
    );
  }

  try {
    const res = await fetch(`${baseUrl}/api/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingestSecret,
        mapsUrl: parsed.mapsUrl,
        rating: parsed.rating,
        category: parsed.category,
        neighborhood: parsed.neighborhood,
        tags: parsed.tags,
        shortBlurb: parsed.shortBlurb,
      }),
    });

    const body = await res.text();
    if (!res.ok) {
      return bot.sendMessage(msg.chat.id, `Failed (${res.status}): ${body}`);
    }

    const json = JSON.parse(body);
    const placeUrl = `${baseUrl}${json.place.url}`;

    const metaLines: string[] = [];
    if (parsed.rating) metaLines.push(`★ ${parsed.rating}`);
    if (parsed.category) metaLines.push(`${parsed.category}`);
    if (parsed.neighborhood) metaLines.push(`${parsed.neighborhood}`);
    if (parsed.tags?.length) metaLines.push(`#${parsed.tags.join(" #")}`);

    return bot.sendMessage(
      msg.chat.id,
      `Added ✅ ${json.place.name}\n` +
        (metaLines.length ? `${metaLines.join(" · ")}\n` : "") +
        `${placeUrl}`
    );
  } catch (e: any) {
    return bot.sendMessage(msg.chat.id, `Error: ${e?.message ?? String(e)}`);
  }
});
4) Quick manual tests (do these now)
Start both processes:

npm run dev
npm run bot
Send these messages to your bot:

Minimal:

<maps link>

With category + tag:

coffee #laptop <maps link>

With rating:

4.8 bar #groups <maps link>

With neighborhood:

4.4 restaurant Lavapies #cheap <maps link>

With quote:

coffee #quiet <maps link> "Great for mornings, avoid after 6pm"

Then check:

/places shows new entries

Each detail page has your overrides applied

Existing place gets updated when you send the same link again (upsert)

5) Quality improvements (optional but recommended)
A) Prevent accidental wrong category default
Right now, if you don’t specify category we default to coffee.
You can instead default to "restaurant" or "coffee"; up to you.

If you want a safer default:

Make category required from Telegram, or

Default to "restaurant" or "coffee" but keep consistent.

B) Neighborhoods with spaces
Later you can support:

neighborhood:"La Latina"
We can add that in Step 9.

6) Checklist for end of STEP_8
 Bot accepts rating, category, #tags, optional neighborhood

 Bot accepts "quoted note" and passes it as shortBlurb

 /api/ingest normalizes values and doesn’t crash on weird input

 Places show up correctly in /places and detail pages

 Re-sending the same link updates instead of duplicating