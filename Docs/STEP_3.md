# STEP_3 – Filters on `/places` + Basic Place Detail Page

Goal of this step:  
Make `/places` actually interactive and give each place its own detail page.

- Add **category filters** (All / Coffee / Restaurants / Bars).  
- Add a simple **tag filter** (optional but recommended).  
- Create `/places/[id]` detail pages and link cards to them.

---

## 0. Assumptions

- You’re still on **Next.js app router**, TypeScript, Tailwind.
- `PLACES` and `PlaceCard` already exist from STEP_2.
- Folders:
  - `app/page.tsx`
  - `app/places/page.tsx`
  - `app/collections/page.tsx`
  - `data/places.ts`
  - `components/PlaceCard.tsx`

---

## 1. Add category filters to `/places`

We’ll make `/places` a **client component** so it can use React state for filters.

### 1.1 Turn `app/places/page.tsx` into a client component

Open `app/places/page.tsx` and add `"use client";` at the top and `useState` import.

```tsx
// app/places/page.tsx
"use client";

import { useState } from "react";
import { PLACES, PlaceCategory, Place } from "@/data/places";
import { PlaceCard } from "@/components/PlaceCard";
Now update the component:

tsx
Copy code
export default function PlacesPage() {
  const [activeCategory, setActiveCategory] = useState<PlaceCategory | "all">(
    "all"
  );

  const filteredPlaces: Place[] =
    activeCategory === "all"
      ? PLACES
      : PLACES.filter((place) => place.category === activeCategory);

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-16 sm:py-20">
      <header className="mb-8">
        <h1 className="mb-3 font-serif text-3xl sm:text-4xl">
          Places in Madrid
        </h1>
        <p className="max-w-xl text-sm text-textMuted">
          Cafés, restaurants, and bars I actually go to. This list will grow as
          I keep exploring.
        </p>
      </header>

      {/* CATEGORY FILTERS */}
      <section className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          {[
            { label: "All", value: "all" as const },
            { label: "Coffee", value: "coffee" as const },
            { label: "Restaurants", value: "restaurant" as const },
            { label: "Bars", value: "bar" as const },
          ].map((item) => {
            const isActive = activeCategory === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setActiveCategory(item.value)}
                className={[
                  "rounded-full border px-3 py-1 transition",
                  isActive
                    ? "border-primary bg-primary text-white"
                    : "border-[#D8C7B8] bg-[#FDF8F3] text-textMain hover:bg-[#F1E4D7]",
                ].join(" ")}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* PLACES GRID */}
      <section>
        {filteredPlaces.length === 0 ? (
          <p className="text-sm text-textMuted">
            No places match this filter yet.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
Now /places should let you click between All / Coffee / Restaurants / Bars and update the grid.

2. Add a simple tag filter (optional but nice)
We’ll add a small row of tag chips under the category filters.

2.1 Get unique tags from the data
Still in app/places/page.tsx, add tag state and derive a unique tag list.

Update the imports:

tsx
Copy code
import { PLACES, PlaceCategory, Place, PlaceTag } from "@/data/places";
Then inside the component, under const [activeCategory, ...]:

tsx
Copy code
  const [activeTag, setActiveTag] = useState<PlaceTag | "all">("all");

  const allTags: PlaceTag[] = Array.from(
    new Set(
      PLACES.flatMap((place) => place.tags)
    )
  ) as PlaceTag[];
Now update the filtering logic:

tsx
Copy code
  const filteredPlaces: Place[] = PLACES.filter((place) => {
    const categoryMatch =
      activeCategory === "all" || place.category === activeCategory;
    const tagMatch = activeTag === "all" || place.tags.includes(activeTag);
    return categoryMatch && tagMatch;
  });
2.2 Add tag filter UI under category filters
Replace the filters section with this:

tsx
Copy code
      {/* FILTERS */}
      <section className="mb-8 space-y-3">
        {/* Category filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          {[
            { label: "All", value: "all" as const },
            { label: "Coffee", value: "coffee" as const },
            { label: "Restaurants", value: "restaurant" as const },
            { label: "Bars", value: "bar" as const },
          ].map((item) => {
            const isActive = activeCategory === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setActiveCategory(item.value)}
                className={[
                  "rounded-full border px-3 py-1 transition",
                  isActive
                    ? "border-primary bg-primary text-white"
                    : "border-[#D8C7B8] bg-[#FDF8F3] text-textMain hover:bg-[#F1E4D7]",
                ].join(" ")}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Tag filters */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
          <span className="mr-1 text-textMuted">Tags:</span>
          <button
            onClick={() => setActiveTag("all")}
            className={[
              "rounded-full border px-3 py-1 transition",
              activeTag === "all"
                ? "border-secondary bg-secondary text-white"
                : "border-[#D8C7B8] bg-[#FDF8F3] text-textMain hover:bg-[#F1E4D7]",
            ].join(" ")}
          >
            All
          </button>
          {allTags.map((tag) => {
            const isActive = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={[
                  "rounded-full border px-3 py-1 transition capitalize",
                  isActive
                    ? "border-secondary bg-secondary text-white"
                    : "border-[#D8C7B8] bg-[#FDF8F3] text-textMain hover:bg-[#F1E4D7]",
                ].join(" ")}
              >
                {tag.replace("-", " ")}
              </button>
            );
          })}
        </div>
      </section>
Now you can combine category + tag filters (e.g. Coffee + laptop-friendly).

3. Link each card to a detail page
We’ll create /places/[id] and make each PlaceCard clickable.

3.1 Wrap PlaceCard content in a <Link>
Open components/PlaceCard.tsx and import Link:

tsx
Copy code
import Link from "next/link";
import { Place } from "@/data/places";
Now wrap the main content in a link. One clean way is:

tsx
Copy code
export function PlaceCard({ place }: PlaceCardProps) {
  return (
    <article className="flex h-full flex-col justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-md">
      <Link href={`/places/${place.id}`} className="flex-1">
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
      </Link>

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
            onClick={(e) => e.stopPropagation()}
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
The onClick={(e) => e.stopPropagation()} is just to keep the map link from accidentally triggering the card navigation; not critical, but nice.

Now clicking most of the card will navigate to /places/[id].

4. Create the place detail route: /places/[id]
4.1 Add app/places/[id]/page.tsx
Create app/places/[id]/page.tsx:

tsx
Copy code
// app/places/[id]/page.tsx

import { notFound } from "next/navigation";
import { PLACES } from "@/data/places";

type PlaceDetailPageProps = {
  params: {
    id: string;
  };
};

export default function PlaceDetailPage({ params }: PlaceDetailPageProps) {
  const place = PLACES.find((p) => p.id === params.id);

  if (!place) {
    return notFound();
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-16 sm:py-20">
      <header className="mb-6">
        <p className="mb-1 text-xs uppercase tracking-[0.2em] text-textMuted">
          {place.neighborhood} ·{" "}
          {place.category === "coffee" && "Coffee"}
          {place.category === "restaurant" && "Restaurant"}
          {place.category === "bar" && "Bar"}
        </p>
        <h1 className="mb-3 font-serif text-3xl sm:text-4xl">
          {place.name}
        </h1>
      </header>

      {/* TAGS + RATING */}
      <section className="mb-6 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex flex-wrap gap-1">
          {place.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#F0E1D7] px-3 py-1 text-[10px] uppercase tracking-wide text-[#7A4A35]"
            >
              {tag.replace("-", " ")}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 text-textMuted">
          <span className="text-[14px]">★</span>
          <span className="text-sm">{place.rating.toFixed(1)}</span>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="mb-8 space-y-4 text-sm sm:text-base">
        <p>
          {place.shortBlurb}
        </p>
        <p className="text-textMuted">
          This page will eventually have a longer review with sections like
          &quot;Why I like it&quot;, &quot;Good for&quot;, and more details.
        </p>
      </section>

      {/* MAP / EXTERNAL LINKS */}
      <section className="mb-10">
        {place.googleMapsUrl && (
          <a
            href={place.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary/90"
          >
            Open in Google Maps →
          </a>
        )}
      </section>

      {/* FUTURE: Good for / info */}
      <section className="border-t border-[#D8C7B8]/60 pt-6 text-xs text-textMuted">
        <p>
          Later, this page can show: hours, price level, &quot;good for&quot;
          checklist, and maybe photos.
        </p>
      </section>
    </div>
  );
}
Now /places/hanso, /places/acid, etc. should render.

5. Quick checklist for STEP_3
By the end of STEP_3, check:

/places

 Has category filter buttons (All / Coffee / Restaurants / Bars).

 Has tag filter chips (All + tags from your data).

 Filters combine correctly (Coffee + laptop-friendly, etc.).

Place cards

 Are clickable and navigate to /places/[id].

 Still show rating + “View on map →”.

/places/[id]

 Shows name, neighborhood, category.

 Shows tags + rating.

 Has “Open in Google Maps” button if URL present.

 Returns a 404-style page if ID not found (Next notFound()).

