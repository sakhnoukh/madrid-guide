# STEP_14 – Homepage Upgrade: Featured Picks + Newest Published + Mood Tiles (links into /places)

Goal:
Make the homepage feel like a real guide instead of a blank landing:
- Hero (keep your video hero)
- Featured picks (from DB: `featured=true` AND `published=true`)
- Newest published (latest 6)
- Mood tiles that link into `/places` with query params (category/tag)

End result:
- Your homepage becomes the “entry point” to explore your taste.

---

## 0) Prereq: confirm `published` + `featured` exist
This step assumes STEP_12 is merged:
- Place has `published:boolean`, `featured:boolean`
- `/places` only shows `published=true`

If not, merge STEP_12 first.

---

## 1) Add query support to `/places` (minimal)

Right now `/places` likely filters client-side only.
We want a simple way for mood tiles to link like:
- `/places?category=coffee&tag=laptop`
- `/places?tag=firstdate`

### 1.1 Update `app/places/page.tsx` to read searchParams
Replace your `PlacesPage` signature with:

```tsx
import { prisma } from "@/lib/prisma";
import { PlacesClient } from "@/components/PlacesClient";

export default async function PlacesPage({
  searchParams,
}: {
  searchParams?: { category?: string; tag?: string; q?: string; sort?: string };
}) {
  const category = searchParams?.category;
  const tag = searchParams?.tag;
  const q = searchParams?.q;

  const places = await prisma.place.findMany({
    where: {
      published: true,
      ...(category && category !== "all"
        ? { category: category as any }
        : {}),
      // Note: tags are Json; Prisma filtering depends on DB.
      // We'll do tag/q filtering in client for now (fast + safe).
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-16 sm:py-20">
      <header className="mb-8">
        <h1 className="mb-3 font-serif text-3xl sm:text-4xl">Places in Madrid</h1>
        <p className="max-w-xl text-sm text-textMuted">
          Cafés, restaurants, and bars I actually go to.
        </p>
      </header>

      <PlacesClient
        places={places as any}
        initialCategory={(category as any) || "all"}
        initialTag={tag || "all"}
        initialQuery={q || ""}
      />
    </div>
  );
}
1.2 Update components/PlacesClient.tsx to accept initial values
At the top, change the signature:

export function PlacesClient({
  places,
  initialCategory = "all",
  initialTag = "all",
  initialQuery = "",
}: {
  places: PlaceDTO[];
  initialCategory?: "all" | "coffee" | "restaurant" | "bar";
  initialTag?: string;
  initialQuery?: string;
}) {
Then initialize state from those:

const [activeCategory, setActiveCategory] = useState(initialCategory);
const [activeTag, setActiveTag] = useState(initialTag);
const [query, setQuery] = useState(initialQuery);
Add a search input above filters:

<div className="mb-4">
  <input
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="Search by name, neighborhood, tag..."
    className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary"
  />
</div>
Update filtered useMemo to include query:

const filtered = useMemo(() => {
  const q = query.trim().toLowerCase();

  return places.filter((p) => {
    const categoryOk = activeCategory === "all" || p.category === activeCategory;
    const tagOk = activeTag === "all" || p.tags?.includes(activeTag);

    const queryOk =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.neighborhood.toLowerCase().includes(q) ||
      (p.tags || []).some((t) => t.toLowerCase().includes(q));

    return categoryOk && tagOk && queryOk;
  });
}, [places, activeCategory, activeTag, query]);
✅ Now mood links can pre-set the filters.

2) Build homepage sections that pull from DB
We’ll keep your existing Hero and add sections below it.

2.1 Create a “Homepage” page that queries Prisma
Open app/page.tsx.

Make it a server component that fetches:

featured published places (limit 6)

newest published places (limit 6)

Example:

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PlaceCard } from "@/components/PlaceCard";
import { Hero } from "@/components/Hero";
import { MoodTiles } from "@/components/MoodTiles";

export default async function HomePage() {
  const featured = await prisma.place.findMany({
    where: { published: true, featured: true },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });

  const newest = await prisma.place.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return (
    <main className="min-h-screen">
      <Hero />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl">Start here</h2>
            <p className="mt-1 text-sm text-textMuted">
              Browse by mood. No overthinking.
            </p>
          </div>
          <Link
            href="/places"
            className="text-sm text-primary underline-offset-2 hover:underline"
          >
            View all →
          </Link>
        </div>

        <MoodTiles />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:pb-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl">Featured picks</h2>
            <p className="mt-1 text-sm text-textMuted">
              The spots I’d send a friend to first.
            </p>
          </div>
          <Link
            href="/places?sort=featured"
            className="text-sm text-primary underline-offset-2 hover:underline"
          >
            Browse →
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-textMuted shadow-sm ring-1 ring-black/5">
            No featured places yet — mark a few as Featured in /admin.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <PlaceCard key={p.id} place={p as any} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl">Newest</h2>
            <p className="mt-1 text-sm text-textMuted">
              Recently added and published.
            </p>
          </div>
          <Link
            href="/places"
            className="text-sm text-primary underline-offset-2 hover:underline"
          >
            See all →
          </Link>
        </div>

        {newest.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-textMuted shadow-sm ring-1 ring-black/5">
            Nothing published yet — add places via bot and publish them in /admin.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {newest.map((p) => (
              <PlaceCard key={p.id} place={p as any} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
This assumes you already have components/Hero.tsx as a standalone component.
If your hero is currently embedded in page.tsx, extract it into components/Hero.tsx.

3) Create MoodTiles component (links into /places)
Create components/MoodTiles.tsx:

import Link from "next/link";

const tiles = [
  {
    title: "Laptop cafés",
    subtitle: "Quiet-ish, good coffee, stay awhile",
    href: "/places?category=coffee&tag=laptop",
  },
  {
    title: "First date",
    subtitle: "Casual, warm, easy to talk",
    href: "/places?tag=firstdate",
  },
  {
    title: "Cheap + good",
    subtitle: "Low commitment, high payoff",
    href: "/places?tag=cheap",
  },
  {
    title: "Late-night bars",
    subtitle: "For when the night keeps going",
    href: "/places?category=bar&tag=latenight",
  },
  {
    title: "Solo + calm",
    subtitle: "Read, think, walk, repeat",
    href: "/places?tag=solo",
  },
  {
    title: "Group spots",
    subtitle: "Easy for 4+ people",
    href: "/places?tag=groups",
  },
];

export function MoodTiles() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((t) => (
        <Link
          key={t.title}
          href={t.href}
          className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="font-serif text-xl">{t.title}</div>
          <div className="mt-1 text-sm text-textMuted">{t.subtitle}</div>
          <div className="mt-4 text-xs text-primary underline-offset-2 group-hover:underline">
            Explore →
          </div>
        </Link>
      ))}
    </div>
  );
}
Important:

This assumes your tag strings are consistent (laptop, firstdate, latenight, etc.)

If your existing tags are laptop-friendly style, adjust the hrefs.

4) Optional polish: Make Featured cards feel special
(Only if you want)

Add a tiny “Featured” badge in PlaceCard if place.featured is true.
This requires passing featured in the card props; safe to do later.

5) Checklist for STEP_14
 Homepage loads with Hero + Mood Tiles + Featured + Newest sections

 Mood tiles link to /places with query params and pre-filter correctly

 Featured list pulls from featured=true + published=true

 Newest pulls from published=true

 If no featured exist, homepage shows a helpful empty state

