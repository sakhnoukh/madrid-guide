// bot/index.ts
import TelegramBot from "node-telegram-bot-api";
import "dotenv/config";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const INGEST_SECRET = process.env.INGEST_SECRET;
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ALLOWED_USER_IDS = (process.env.TELEGRAM_ALLOWED_USER_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

if (!BOT_TOKEN) {
  console.error("Missing TELEGRAM_BOT_TOKEN in .env");
  process.exit(1);
}

if (!INGEST_SECRET) {
  console.error("Missing INGEST_SECRET in .env");
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log("🤖 Telegram bot started...");

function isAllowed(userId: number): boolean {
  // If no user IDs are specified, allow all (for easier testing)
  if (ALLOWED_USER_IDS.length === 0) return true;
  return ALLOWED_USER_IDS.includes(String(userId));
}

function extractMapsUrl(text: string): string | null {
  // Match Google Maps URLs (various formats)
  const patterns = [
    /https?:\/\/maps\.app\.goo\.gl\/[^\s]+/i,
    /https?:\/\/goo\.gl\/maps\/[^\s]+/i,
    /https?:\/\/(?:www\.)?google\.[a-z.]+\/maps\/[^\s]+/i,
    /https?:\/\/maps\.google\.[a-z.]+\/[^\s]+/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return null;
}

type ParsedMessage = {
  mapsUrl: string;
  rating?: number;
  category?: "coffee" | "restaurant" | "bar";
  neighborhood?: string;
  tags?: string[];
  shortBlurb?: string;
};

function parseFirstRating(tokens: string[]): number | undefined {
  for (const t of tokens) {
    const n = Number(t.replace(",", "."));
    if (!Number.isNaN(n) && n >= 1 && n <= 5) return n;
  }
  return undefined;
}

function parseCategory(tokens: string[]): "coffee" | "restaurant" | "bar" | undefined {
  for (const t of tokens) {
    const v = t.toLowerCase();
    if (v === "coffee" || v === "cafe" || v === "café") return "coffee";
    if (v === "restaurant" || v === "food") return "restaurant";
    if (v === "bar" || v === "drinks") return "bar";
  }
  return undefined;
}

function parseTags(tokens: string[]): string[] | undefined {
  const tags = tokens
    .filter((t) => t.startsWith("#"))
    .map((t) => t.slice(1).toLowerCase().trim())
    .filter(Boolean);
  return tags.length ? Array.from(new Set(tags)) : undefined;
}

function parseQuotedNote(text: string): string | undefined {
  const match = text.match(/"([^"]+)"/);
  return match?.[1]?.trim() || undefined;
}

function parseNeighborhoodQuoted(text: string): string | undefined {
  const m =
    text.match(/neighborhood:"([^"]+)"/i) ||
    text.match(/nb:"([^"]+)"/i);
  return m?.[1]?.trim() || undefined;
}

function parseNeighborhoodSingleToken(tokens: string[], used: Set<string>): string | undefined {
  for (const t of tokens) {
    if (used.has(t)) continue;
    const v = t.toLowerCase();
    if (v === "madrid") continue;
    if (t.length < 3) continue;
    return t;
  }
  return undefined;
}

function parseMessage(text: string): ParsedMessage | null {
  const mapsUrl = extractMapsUrl(text);
  if (!mapsUrl) return null;

  const shortBlurb = parseQuotedNote(text);
  const neighborhoodQuoted = parseNeighborhoodQuoted(text);

  // Remove URL, quotes, and neighborhood:"..." to make token parsing cleaner
  const stripped = text
    .replace(mapsUrl, " ")
    .replace(/neighborhood:"[^"]*"/gi, " ")
    .replace(/nb:"[^"]*"/gi, " ")
    .replace(/"[^"]*"/g, " ");

  const tokens = stripped
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
  tokens.filter((t) => t.startsWith("http")).forEach((t) => used.add(t));

  // Mark common synonyms so they don't become neighborhood
  tokens.forEach((t) => {
    const v = t.toLowerCase();
    if (v === "cafe" || v === "café") used.add(t);
    if (v === "food" || v === "drinks") used.add(t);
  });

  const neighborhoodSingleToken = parseNeighborhoodSingleToken(tokens, used);

  return {
    mapsUrl,
    rating,
    category: category || undefined,
    neighborhood: neighborhoodQuoted || neighborhoodSingleToken,
    tags,
    shortBlurb,
  };
}

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const text = msg.text || "";

  if (!userId) return;

  // Check if user is allowed
  if (!isAllowed(userId)) {
    bot.sendMessage(chatId, "⛔ You're not authorized to use this bot.");
    return;
  }

  // Handle /start command
  if (text.startsWith("/start")) {
    bot.sendMessage(
      chatId,
      "👋 Send a Google Maps link. Optional format:\n" +
        '4.6 coffee #laptop #quiet Malasaña <link> "short note"\n\n' +
        "Category: coffee | restaurant | bar\n" +
        "Tags: #laptop #quiet #groups etc."
    );
    return;
  }

  // Parse the message
  const parsed = parseMessage(text);

  if (!parsed) {
    bot.sendMessage(
      chatId,
      "🤔 I couldn't find a Google Maps link.\n\n" +
        'Example: 4.6 coffee #laptop Malasaña <link> "great light"'
    );
    return;
  }

  // Call the ingest API
  bot.sendMessage(chatId, "⏳ Processing...");

  try {
    const res = await fetch(`${BASE_URL}/api/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingestSecret: INGEST_SECRET,
        mapsUrl: parsed.mapsUrl,
        rating: parsed.rating,
        category: parsed.category,
        neighborhood: parsed.neighborhood,
        tags: parsed.tags,
        shortBlurb: parsed.shortBlurb,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      bot.sendMessage(chatId, `❌ Error: ${errorText}`);
      return;
    }

    const data = await res.json();

    if (data.ok && data.place) {
      const placeUrl = `${BASE_URL}${data.place.url}`;

      const metaLines: string[] = [];
      if (parsed.rating) metaLines.push(`★ ${parsed.rating}`);
      if (parsed.category) metaLines.push(parsed.category);
      if (parsed.neighborhood) metaLines.push(parsed.neighborhood);
      if (parsed.tags?.length) metaLines.push(`#${parsed.tags.join(" #")}`);

      bot.sendMessage(
        chatId,
        `✅ Added: ${data.place.name}\n` +
          (metaLines.length ? `${metaLines.join(" · ")}\n` : "") +
          `🔗 ${placeUrl}`
      );
    } else {
      bot.sendMessage(chatId, "❌ Something went wrong. Check the server logs.");
    }
  } catch (err) {
    console.error("Ingest error:", err);
    bot.sendMessage(chatId, `❌ Failed to reach the server. Is it running?`);
  }
});

bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});
