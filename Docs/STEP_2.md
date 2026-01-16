# STEP_2 – Place Cards + Dummy Data + Collections

Goal of this step:  
Make the page feel **alive** by adding:

- A grid of **place cards** in the `Places` section using dummy data  
- Simple **collection cards** in the `Collections` section  
- Basic hover + responsive behavior  

Still no backend or real API – just static data.

---

## 0. Folder structure (suggested)

To keep stuff tidy, add:

- `components/PlaceCard.tsx`
- `components/CollectionCard.tsx`
- `data/places.ts`
- `data/collections.ts`

You can adapt names/paths if you prefer, but I’ll assume this.

---

## 1. Define TypeScript types + dummy data for places

Create `data/places.ts`:

```ts
// data/places.ts

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
  googleMapsUrl?: string;
};

export const PLACES: Place[] = [
  {
    id: "hanso",
    name: "HanSo Café",
    neighborhood: "Malasaña",
    category: "coffee",
    tags: ["laptop-friendly", "solo"],
    rating: 4.5,
    shortBlurb: "Good flat white, busy on weekends. Nice for a solo work session.",
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
    googleMapsUrl: "https://maps.google.com/...",
  },
  {
    id: "terraza-xx",
    name: "Random Terraza",
    neighborhood: "La Latina",
    category: "bar",
    tags: ["groups", "cheap"],
    rating: 3.6,
    shortBlurb: "Nice for a big group, drinks are fine but it’s more about the vibe.",
    googleMapsUrl: "https://maps.google.com/...",
  },
  {
    id: "bodega-yy",
    name: "Small Bodega",
    neighborhood: "Lavapiés",
    category: "restaurant",
    tags: ["cheap", "quiet"],
    rating: 4.3,
    shortBlurb: "Simple, honest food. Good if you’re nearby and want something cozy.",
    googleMapsUrl: "https://maps.google.com/...",
  },
];
You can tweak names/blurbs to be more “you” later.

2. Create the PlaceCard component
Create components/PlaceCard.tsx:

tsx
Copy code
// components/PlaceCard.tsx
"use client";

import { Place } from "@/data/places";
import { cn } from "@/lib/utils"; // optional helper, see note below

type PlaceCardProps = {
  place: Place;
};

export function PlaceCard({ place }: PlaceCardProps) {
  return (
    <article
      className="flex h-full flex-col justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-md"
    >
      {/* Top: name + neighborhood */}
      <div>
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <h3 className="font-serif text-lg leading-snug">{place.name}</h3>
          <span className="text-xs uppercase tracking-wide text-textMuted">
            {place.neighborhood}
          </span>
        </div>

        {/* Category */}
        <p className="mb-2 text-xs text-textMuted">
          {place.category === "coffee" && "Coffee"}
          {place.category === "restaurant" && "Restaurant"}
          {place.category === "bar" && "Bar"}
        </p>

        {/* Tags */}
        <div className="mb-3 flex flex-wrap gap-1">
          {place.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#F0E1D7] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#7A4A35]"
            >
              {tag.replace("-", " ")}
            </span>
          ))}
        </div>

        {/* Short blurb */}
        <p className="text-sm text-textMain">{place.shortBlurb}</p>
      </div>

      {/* Bottom: rating + map link */}
      <div className="mt-4 flex items-center justify-between text-xs text-textMuted">
        <div className="flex items-center gap-1">
          <span className="text-[13px]">★</span>
          <span>{place.rating.toFixed(1)}</span>
        </div>
        {place.googleMapsUrl ? (
          <a
            href={place.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-medium text-primary underline-offset-2 hover:underline"
          >
            View on map →
          </a>
        ) : (
          <span className="text-[11px]">Map coming soon</span>
        )}
      </div>
    </article>
  );
}
🔎 Note: If you don’t have a cn helper or @/lib/utils, just remove that import; it’s not used above.

3. Render place cards in the Places section
Open app/page.tsx and update the Places section.

At the top of the file:

tsx
Copy code
import { PLACES } from "@/data/places";
import { PlaceCard } from "@/components/PlaceCard";
Then replace the placeholder box in #places with a grid:

tsx
Copy code
        {/* PLACES SECTION */}
        <section
          id="places"
          className="mx-auto max-w-6xl px-4 py-16 sm:py-20"
        >
          <h2 className="mb-4 font-serif text-2xl sm:text-3xl">
            Latest places
          </h2>
          <p className="mb-8 max-w-xl text-sm text-textMuted">
            A few spots I&apos;ve been to recently and would actually recommend.
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PLACES.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </section>
Now you should see real cards instead of the dashed placeholder.

4. Dummy data + cards for Collections
4.1 Create data/collections.ts
ts
Copy code
// data/collections.ts

export type Collection = {
  id: string;
  title: string;
  description: string;
  // Later: maybe a list of place IDs
};

export const COLLECTIONS: Collection[] = [
  {
    id: "first-dates",
    title: "First date spots",
    description:
      "Places where you can actually hear each other, with enough atmosphere to break the ice.",
  },
  {
    id: "laptop-cafes",
    title: "Laptop cafés",
    description:
      "Spots where you can open a laptop without feeling weird about it.",
  },
  {
    id: "near-retiro",
    title: "Near Retiro",
    description:
      "Good places to land after a slow walk around the park.",
  },
  {
    id: "late-night",
    title: "Late-night bars",
    description:
      "For when Madrid decides to keep you out later than planned.",
  },
];
4.2 Create CollectionCard component
Create components/CollectionCard.tsx:

tsx
Copy code
// components/CollectionCard.tsx
"use client";

import { Collection } from "@/data/collections";

type CollectionCardProps = {
  collection: Collection;
};

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <article className="flex h-full flex-col justify-between rounded-2xl border border-[#D8C7B8] bg-[#FDF8F3] p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <h3 className="mb-2 font-serif text-lg">{collection.title}</h3>
      <p className="mb-4 text-sm text-textMain">{collection.description}</p>
      <span className="text-xs font-medium text-primary">
        View places in this collection →
      </span>
    </article>
  );
}
4.3 Render collection cards in the Collections section
In app/page.tsx:

tsx
Copy code
import { COLLECTIONS } from "@/data/collections";
import { CollectionCard } from "@/components/CollectionCard";
Then replace the dashed placeholder in #collections:

tsx
Copy code
        {/* COLLECTIONS SECTION */}
        <section
          id="collections"
          className="mx-auto max-w-6xl px-4 py-16 sm:py-20"
        >
          <h2 className="mb-4 font-serif text-2xl sm:text-3xl">
            Collections
          </h2>
          <p className="mb-8 max-w-xl text-sm text-textMuted">
            Curated sets of places for different moods and situations.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {COLLECTIONS.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        </section>
Now the Collections section should show 3–4 nice cards.

5. Small polish: hover + spacing
You already have some hover transitions. Quick things to check:

Place cards and collection cards both:

Slightly lift (hover:-translate-y-1)

Increase shadow (hover:shadow-md)

Ensure spacing is consistent:

Sections have py-16 / py-20

Cards have p-4 or p-5 (don’t mix too much)

You can also slightly tweak the nav so it has a subtle background (optional):

tsx
Copy code
<header className="fixed top-0 left-0 right-0 z-20 bg-gradient-to-b from-[#0C0C0C]/60 to-transparent backdrop-blur">
  ...
</header>
This helps the nav stay readable on top of the hero video.

6. Checklist for end of STEP_2
By the end of this step, verify:

 Latest places section shows real-looking cards with:

 Name

 Neighborhood

 Category

 Tags

 Your rating

 One-line blurb

 “View on map →” link (even if dummy URL)

 Cards look decent on:

 Mobile (1 column)

 Medium screens (~2 columns)

 Large screens (~3 columns)

 Collections section has:

 3–4 collection cards

 Title + short description

 A CTA line like “View places in this collection →”

 Hover effects feel subtle, not aggressive.

