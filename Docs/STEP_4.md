# STEP_4 – Richer Place Detail Page (“Good for” + Longer Review)

Goal of this step:  
Make each place detail page feel **like a real mini review**, not just a stub.

- Extend the `Place` data model with:
  - `goodFor` flags (solo coffee, first date, etc.)
  - Optional `longReview` text
  - Optional `priceLevel`
- Upgrade `/places/[id]` layout:
  - Nicer header + “Good for” checklist
  - Longer review section
  - Right-hand info card (price, category, neighborhood, map link)
  - “Back to places” link

Still no backend – just richer static data and layout.

---

## 1. Extend the `Place` type to support richer detail

Open `data/places.ts` and update the types.

### 1.1 Add a `GoodForFlag` type and optional fields

At the top, extend with:

```ts
export type GoodForFlag =
  | "solo-coffee"
  | "laptop-work"
  | "first-date"
  | "groups"
  | "quick-stop"
  | "long-conversations";

export type PlaceCategory = "coffee" | "restaurant" | "bar";

export type PlaceTag =
  | "laptop-friendly"
  | "first-date"
  | "cheap"
  | "fancy"
  | "quiet"
  | "groups"
  | "solo";

export type Place = {
  id: string;
  name: string;
  neighborhood: string;
  category: PlaceCategory;
  tags: PlaceTag[];
  rating: number; // your rating, 1–5
  shortBlurb: string;
  longReview?: string; // optional longer text for detail page
  priceLevel?: 1 | 2 | 3 | 4; // optional € level
  goodFor?: GoodForFlag[]; // optional flags for detail page
  googleMapsUrl?: string;
};
1.2 Add goodFor, longReview, and priceLevel to dummy data
Update each item in PLACES to include these new fields.

Example (you can adjust text to be more “you” later):

ts
Copy code
export const PLACES: Place[] = [
  {
    id: "hanso",
    name: "HanSo Café",
    neighborhood: "Malasaña",
    category: "coffee",
    tags: ["laptop-friendly", "solo"],
    rating: 4.5,
    shortBlurb: "Good flat white, busy on weekends. Nice for a solo work session.",
    longReview:
      "One of those spots where you can sit by the window with a laptop or a book and lose track of time. It does get loud on weekend afternoons, so I like it more on weekday mornings. Coffee is consistently good; pastries are fine but not the main reason to come.",
    priceLevel: 2,
    goodFor: ["solo-coffee", "laptop-work", "quick-stop"],
    googleMapsUrl: "https://maps.google.com/...",
  },
  {
    id: "acid",
    name: "Acid Café",
    neighborhood: "Centro",
    category: "coffee",
    tags: ["quiet", "solo"],
    rating: 4.2,
    shortBlurb: "Calm vibe, solid pour-over. Great spot after a walk.",
    longReview:
      "Feels like a small escape right in the center. It’s usually calmer than most cafés nearby, which makes it good for reading or just decompressing after walking around. Coffee leans more towards specialty vibes. Not a place for big groups.",
    priceLevel: 2,
    goodFor: ["solo-coffee", "quick-stop", "long-conversations"],
    googleMapsUrl: "https://maps.google.com/...",
  },
  {
    id: "sala-equis",
    name: "Sala Equis",
    neighborhood: "Centro",
    category: "bar",
    tags: ["groups", "first-date"],
    rating: 4.0,
    shortBlurb: "Fun space, good for a casual drink and people-watching.",
    longReview:
      "Big, lively space that feels more like a hangout than a classic bar. It’s easy to spend a few hours here without noticing. Great for a first date if you want something informal and not too quiet. Not where you go for serious cocktails, more for the overall vibe.",
    priceLevel: 2,
    goodFor: ["groups", "first-date", "long-conversations"],
    googleMapsUrl: "https://maps.google.com/...",
  },
  {
    id: "terraza-xx",
    name: "Random Terraza",
    neighborhood: "La Latina",
    category: "bar",
    tags: ["groups", "cheap"],
    rating: 3.6,
    shortBlurb:
      "Nice for a big group, drinks are fine but it’s more about the vibe.",
    longReview:
      "One of those terraces you end up in with friends because there’s space. It’s not mind-blowing, but it works if you just want to sit outside and talk. Drinks are standard and prices are reasonable. I wouldn’t cross the city for it, but it’s good if you’re already in the area.",
    priceLevel: 1,
    goodFor: ["groups", "quick-stop"],
    googleMapsUrl: "https://maps.google.com/...",
  },
  {
    id: "bodega-yy",
    name: "Small Bodega",
    neighborhood: "Lavapiés",
    category: "restaurant",
    tags: ["cheap", "quiet"],
    rating: 4.3,
    shortBlurb:
      "Simple, honest food. Good if you’re nearby and want something cozy.",
    longReview:
      "Feels like eating at someone’s home in the best way. The menu is small but done with care. It’s not a place for a rushed meal; it’s more for a slow lunch or dinner where you actually talk. Great to bring one or two people, less ideal for big groups.",
    priceLevel: 2,
    goodFor: ["long-conversations", "first-date", "solo-coffee"],
    googleMapsUrl: "https://maps.google.com/...",
  },
];
Don’t worry about being perfect with these; just get something in so you can see the layout.

2. Make the detail page layout feel more “designed”
We’ll:

Add a subtle “Back to places” link

Create a two-column layout on desktop:

Left: text (review)

Right: info card (“good for”, price, map button)

Open app/places/[id]/page.tsx.

2.1 Import types if needed
At top:

tsx
Copy code
import { notFound } from "next/navigation";
import { PLACES, GoodForFlag } from "@/data/places";
import Link from "next/link";
2.2 Helper to map GoodForFlag → friendly label
Right above the component, add:

tsx
Copy code
const GOOD_FOR_LABELS: Record<GoodForFlag, string> = {
  "solo-coffee": "Solo coffee",
  "laptop-work": "Working with laptop",
  "first-date": "First dates",
  groups: "Groups",
  "quick-stop": "Quick stop",
  "long-conversations": "Long conversations",
};
2.3 Replace the component with a richer layout
Replace the existing PlaceDetailPage with:

tsx
Copy code
export default function PlaceDetailPage({ params }: PlaceDetailPageProps) {
  const place = PLACES.find((p) => p.id === params.id);

  if (!place) {
    return notFound();
  }

  const priceText =
    place.priceLevel !== undefined
      ? "€".repeat(place.priceLevel)
      : undefined;

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-16 sm:py-20">
      {/* Back link */}
      <div className="mb-4 text-xs text-textMuted">
        <Link
          href="/places"
          className="inline-flex items-center gap-1 text-textMuted underline-offset-2 hover:text-primary hover:underline"
        >
          <span>←</span>
          <span>Back to places</span>
        </Link>
      </div>

      {/* Header */}
      <header className="mb-6">
        <p className="mb-1 text-xs uppercase tracking-[0.2em] text-textMuted">
          {place.neighborhood} ·{" "}
          {place.category === "coffee" && "Coffee"}
          {place.category === "restaurant" && "Restaurant"}
          {place.category === "bar" && "Bar"}
          {priceText && ` · ${priceText}`}
        </p>
        <h1 className="mb-3 font-serif text-3xl sm:text-4xl">
          {place.name}
        </h1>
      </header>

      {/* Main two-column layout */}
      <div className="grid gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        {/* LEFT: review text */}
        <section className="space-y-4 text-sm sm:text-base text-textMain">
          <p className="font-medium">{place.shortBlurb}</p>
          <p className="text-textMain">
            {place.longReview ??
              "Longer review coming soon. For now: it’s on this site, which already means I’d happily bring a friend here."}
          </p>
        </section>

        {/* RIGHT: info card */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            {/* Rating */}
            <div className="mb-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-textMuted">
                <span className="text-[15px]">★</span>
                <span className="font-medium">{place.rating.toFixed(1)}</span>
              </div>
              {priceText && (
                <span className="text-xs text-textMuted">
                  Price: <span className="font-medium">{priceText}</span>
                </span>
              )}
            </div>

            {/* Tags */}
            <div className="mb-4 flex flex-wrap gap-1">
              {place.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#F0E1D7] px-3 py-1 text-[10px] uppercase tracking-wide text-[#7A4A35]"
                >
                  {tag.replace("-", " ")}
                </span>
              ))}
            </div>

            {/* Good for */}
            {place.goodFor && place.goodFor.length > 0 && (
              <div className="mb-4">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-textMuted">
                  Good for
                </h2>
                <ul className="space-y-1 text-xs text-textMain">
                  {place.goodFor.map((flag) => (
                    <li key={flag} className="flex items-center gap-2">
                      <span className="text-[13px]">✓</span>
                      <span>{GOOD_FOR_LABELS[flag]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Map button */}
            {place.googleMapsUrl && (
              <div className="mt-4">
                <a
                  href={place.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary/90"
                >
                  Open in Google Maps →
                </a>
              </div>
            )}
          </div>

          {/* Future slot: hours / notes */}
          <div className="rounded-2xl border border-[#D8C7B8]/60 bg-[#FDF8F3] p-4 text-xs text-textMuted">
            <p>
              Later this box can show opening hours, a small note like
              &quot;better in the morning&quot; or &quot;avoid Sunday
              evenings&quot;, and maybe a photo.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
Now /places/[id] should look a lot more like a real review page.

3. Sanity check + small polish
Make sure:

 /places/hanso (and others) load without TS errors.

 “Back to places” link takes you to /places.

 On desktop:

 Review text is on the left, info card on the right.

 On mobile:

 The layout stacks nicely (text then info card).

 “Good for” list only appears when goodFor is set for a place.

 Price level shows as €, €€, etc., when provided.

If spacing feels tight or loose, you can tweak:

gap-10 in the grid container

py-16 / py-20 on the page wrapper

p-4 / p-5 inside cards

