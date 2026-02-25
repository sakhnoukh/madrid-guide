# STEP_2 – Split Pages (Home / Places / Collections) + Cards

Goal of this step:
- Home page (`/`): **hero + about**  
- `/places`: list of **place cards**  
- `/collections`: list of **collection cards**  
- Shared top nav across all pages

---

## 1. Move the nav into `app/layout.tsx` and use real links

### 1.1 Open `app/layout.tsx` and update it

We’ll put the nav here so every page (home, places, collections) shares it.

```tsx
// app/layout.tsx
import "./globals.css";
import { Inter, Playfair_Display } from "next/font/google";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata = {
  title: "Sami's Guide to Madrid",
  description: "Places I actually go to in Madrid.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-[#F7F3EC] font-sans text-[#4B4B4B]">
        {/* NAVBAR (shared across all pages) */}
        <header className="fixed left-0 right-0 top-0 z-20 bg-gradient-to-b from-[#0C0C0C]/60 to-transparent backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="font-serif text-lg tracking-wide text-[#F7F3EC]">
              Sami&apos;s Guide
            </Link>

            <div className="hidden gap-6 text-sm text-[#F7F3EC] md:flex">
              <Link
                href="/places"
                className="hover:text-[#F0E1D7] transition-colors"
              >
                Places
              </Link>
              <Link
                href="/collections"
                className="hover:text-[#F0E1D7] transition-colors"
              >
                Collections
              </Link>
              <Link
                href="/#about"
                className="hover:text-[#F0E1D7] transition-colors"
              >
                About
              </Link>
            </div>
          </nav>
        </header>

        {/* PAGE CONTENT */}
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
pt-16 on <main> keeps page content from hiding under the fixed nav.

2. Make the home page just hero + about
2.1 Update app/page.tsx
Remove the Places + Collections sections from the home page. Keep only hero + about.

tsx
Copy code
// app/page.tsx

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section
        id="hero"
        className="relative flex min-h-[100vh] items-center justify-center overflow-hidden"
      >
        {/* Background video */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          {/* TEMP: replace with your real video later */}
          <source src="/videos/candle-placeholder.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Centered content */}
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 text-center text-[#F7F3EC]">
          <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#E4D3C2]">
            Sami&apos;s guide to Madrid
          </p>
          <h1 className="mb-4 font-serif text-4xl leading-tight sm:text-5xl md:text-6xl">
            Places I actually go to.
          </h1>
          <p className="mb-8 max-w-xl text-sm text-[#F1E4D7] sm:text-base">
            Cafés to read in, bars to talk in, and restaurants that feel worth
            the bill.
          </p>
        </div>
      </section>

      {/* ABOUT ON HOME */}
      <section
        id="about"
        className="mx-auto max-w-6xl px-4 py-16 sm:py-20"
      >
        <h2 className="mb-4 font-serif text-2xl sm:text-3xl">
          About this guide
        </h2>
        <div className="max-w-2xl space-y-3 text-sm text-[#4B4B4B] sm:text-base">
          <p>
            This is a personal map of Madrid: cafés, restaurants, and bars I
            actually spend time in.
          </p>
          <p>
            I only add places after I&apos;ve been there, and I try to be honest
            about what they&apos;re good for: studying, dates, long
            conversations, or just a quick coffee.
          </p>
          <p>
            If I wouldn&apos;t bring a friend here, it&apos;s probably not on
            this site.
          </p>
        </div>
      </section>
    </div>
  );
}
Now / is just your hero + about section.

Nav links will take you to /places, /collections, or scroll down to #about.

3. Create the Places page: /places
3.1 Ensure dummy data + PlaceCard exist
If you haven’t created these yet, add:

data/places.ts

ts
Copy code
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
components/PlaceCard.tsx

tsx
Copy code
// components/PlaceCard.tsx
"use client";

import { Place } from "@/data/places";

type PlaceCardProps = {
  place: Place;
};

export function PlaceCard({ place }: PlaceCardProps) {
  return (
    <article className="flex h-full flex-col justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-md">
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
3.2 Create app/places/page.tsx
tsx
Copy code
// app/places/page.tsx

import { PLACES } from "@/data/places";
import { PlaceCard } from "@/components/PlaceCard";

export default function PlacesPage() {
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

      {/* Later: filters will go here */}

      <section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PLACES.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      </section>
    </div>
  );
}
Now /places should show your cards as a full page, separate from the hero.

4. Create the Collections page: /collections
4.1 Ensure dummy data + CollectionCard exist
data/collections.ts

ts
Copy code
// data/collections.ts

export type Collection = {
  id: string;
  title: string;
  description: string;
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
components/CollectionCard.tsx

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
4.2 Create app/collections/page.tsx
tsx
Copy code
// app/collections/page.tsx

import { COLLECTIONS } from "@/data/collections";
import { CollectionCard } from "@/components/CollectionCard";

export default function CollectionsPage() {
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-16 sm:py-20">
      <header className="mb-8">
        <h1 className="mb-3 font-serif text-3xl sm:text-4xl">
          Collections
        </h1>
        <p className="max-w-xl text-sm text-textMuted">
          Curated sets of spots for different moods and situations. These will
          eventually link to filtered views of your places.
        </p>
      </header>

      <section>
        <div className="grid gap-6 md:grid-cols-2">
          {COLLECTIONS.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </section>
    </div>
  );
}
Now /collections is its own page.

5. Quick checklist
By the end of this step:

 / shows hero + about

 /places shows the places grid with cards

 /collections shows the collections grid with cards

 Top nav:

 Logo/title → /

 “Places” → /places

 “Collections” → /collections

 “About” → scroll to /#about on home

 Layout looks sane on mobile + desktop

