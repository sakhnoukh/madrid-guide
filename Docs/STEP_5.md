# STEP_5 – Real Database + API (Prisma) + Wire Pages to DB

Goal of this step:
- Stop relying on `data/places.ts`
- Store places in a real DB (SQLite locally)
- Expose simple API routes:
  - `GET /api/places`
  - `GET /api/places/[id]`
- Update `/places` and `/places/[id]` to read from the DB

This sets you up cleanly for Step 6 (admin + Telegram ingestion).

---

## 0) Install Prisma + setup

From your project root:

```bash
npm i prisma @prisma/client
npx prisma init --datasource-provider sqlite
This creates:

prisma/schema.prisma

.env

1) Define the schema
Open prisma/schema.prisma and replace contents with:

prisma
Copy code
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

enum PlaceCategory {
  coffee
  restaurant
  bar
}

model Place {
  id          String        @id
  name        String
  neighborhood String
  category    PlaceCategory
  tags        Json          // string[]
  goodFor     Json?         // string[] (optional)
  rating      Float
  shortBlurb  String
  longReview  String?
  priceLevel  Int?
  googleMapsUrl String?

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}
In .env, keep the default:

env
Copy code
DATABASE_URL="file:./dev.db"
2) Create the DB + migration
bash
Copy code
npx prisma migrate dev --name init
3) Seed the DB with your dummy places
3.1 Install a runner for TypeScript seed scripts
bash
Copy code
npm i -D tsx
3.2 Create prisma/seed.ts
ts
Copy code
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.place.createMany({
    data: [
      {
        id: "hanso",
        name: "HanSo Café",
        neighborhood: "Malasaña",
        category: "coffee",
        tags: ["laptop-friendly", "solo"],
        goodFor: ["solo-coffee", "laptop-work", "quick-stop"],
        rating: 4.5,
        shortBlurb:
          "Good flat white, busy on weekends. Nice for a solo work session.",
        longReview:
          "One of those spots where you can sit by the window with a laptop or a book and lose track of time. It does get loud on weekend afternoons, so I like it more on weekday mornings. Coffee is consistently good; pastries are fine but not the main reason to come.",
        priceLevel: 2,
        googleMapsUrl: "https://maps.google.com/...",
      },
      {
        id: "acid",
        name: "Acid Café",
        neighborhood: "Centro",
        category: "coffee",
        tags: ["quiet", "solo"],
        goodFor: ["solo-coffee", "quick-stop", "long-conversations"],
        rating: 4.2,
        shortBlurb: "Calm vibe, solid pour-over. Great spot after a walk.",
        longReview:
          "Feels like a small escape right in the center. It’s usually calmer than most cafés nearby, which makes it good for reading or just decompressing after walking around. Coffee leans more towards specialty vibes. Not a place for big groups.",
        priceLevel: 2,
        googleMapsUrl: "https://maps.google.com/...",
      },
      {
        id: "sala-equis",
        name: "Sala Equis",
        neighborhood: "Centro",
        category: "bar",
        tags: ["groups", "first-date"],
        goodFor: ["groups", "first-date", "long-conversations"],
        rating: 4.0,
        shortBlurb:
          "Fun space, good for a casual drink and people-watching.",
        longReview:
          "Big, lively space that feels more like a hangout than a classic bar. It’s easy to spend a few hours here without noticing. Great for a first date if you want something informal and not too quiet. Not where you go for serious cocktails, more for the overall vibe.",
        priceLevel: 2,
        googleMapsUrl: "https://maps.google.com/...",
      },
      {
        id: "terraza-xx",
        name: "Random Terraza",
        neighborhood: "La Latina",
        category: "bar",
        tags: ["groups", "cheap"],
        goodFor: ["groups", "quick-stop"],
        rating: 3.6,
        shortBlurb:
          "Nice for a big group, drinks are fine but it’s more about the vibe.",
        longReview:
          "One of those terraces you end up in with friends because there’s space. It’s not mind-blowing, but it works if you just want to sit outside and talk. Drinks are standard and prices are reasonable. I wouldn’t cross the city for it, but it’s good if you’re already in the area.",
        priceLevel: 1,
        googleMapsUrl: "https://maps.google.com/...",
      },
      {
        id: "bodega-yy",
        name: "Small Bodega",
        neighborhood: "Lavapiés",
        category: "restaurant",
        tags: ["cheap", "quiet"],
        goodFor: ["long-conversations", "first-date", "solo-coffee"],
        rating: 4.3,
        shortBlurb:
          "Simple, honest food. Good if you’re nearby and want something cozy.",
        longReview:
          "Feels like eating at someone’s home in the best way. The menu is small but done with care. It’s not a place for a rushed meal; it’s more for a slow lunch or dinner where you actually talk. Great to bring one or two people, less ideal for big groups.",
        priceLevel: 2,
        googleMapsUrl: "https://maps.google.com/...",
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
3.3 Tell Prisma how to run the seed
In package.json, add:

json
Copy code
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
Run:

bash
Copy code
npx prisma db seed
4) Add a Prisma helper
Create lib/prisma.ts:

ts
Copy code
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
5) Create API routes
5.1 GET /api/places
Create app/api/places/route.ts:

ts
Copy code
import { prisma } from "@/lib/prisma";

export async function GET() {
  const places = await prisma.place.findMany({
    orderBy: { createdAt: "desc" },
  });

  return Response.json(places);
}
5.2 GET /api/places/[id]
Create app/api/places/[id]/route.ts:

ts
Copy code
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const place = await prisma.place.findUnique({
    where: { id: params.id },
  });

  if (!place) {
    return new Response("Not found", { status: 404 });
  }

  return Response.json(place);
}
6) Refactor /places to use DB data (server fetch + client filters)
Instead of doing Prisma queries inside a client component, do:

Server page fetches from Prisma

Passes places to a client component that handles filtering UI

6.1 Create components/PlacesClient.tsx
tsx
Copy code
"use client";

import { useMemo, useState } from "react";
import { PlaceCard } from "@/components/PlaceCard";

type PlaceDTO = {
  id: string;
  name: string;
  neighborhood: string;
  category: "coffee" | "restaurant" | "bar";
  tags: string[];
  goodFor?: string[] | null;
  rating: number;
  shortBlurb: string;
  longReview?: string | null;
  priceLevel?: number | null;
  googleMapsUrl?: string | null;
};

export function PlacesClient({ places }: { places: PlaceDTO[] }) {
  const [activeCategory, setActiveCategory] = useState<
    "all" | "coffee" | "restaurant" | "bar"
  >("all");
  const [activeTag, setActiveTag] = useState<string>("all");

  const allTags = useMemo(() => {
    const s = new Set<string>();
    places.forEach((p) => p.tags?.forEach((t) => s.add(t)));
    return Array.from(s);
  }, [places]);

  const filtered = useMemo(() => {
    return places.filter((p) => {
      const categoryOk = activeCategory === "all" || p.category === activeCategory;
      const tagOk = activeTag === "all" || p.tags?.includes(activeTag);
      return categoryOk && tagOk;
    });
  }, [places, activeCategory, activeTag]);

  return (
    <>
      {/* FILTERS */}
      <section className="mb-8 space-y-3">
        {/* Category */}
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

        {/* Tags */}
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

      {/* GRID */}
      {filtered.length === 0 ? (
        <p className="text-sm text-textMuted">No places match this filter yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((place) => (
            <PlaceCard key={place.id} place={place as any} />
          ))}
        </div>
      )}
    </>
  );
}
Note: PlaceCard currently imports Place from data/places.ts. In the next sub-step we’ll make PlaceCard accept a plain object type so it works with DB data.

6.2 Update app/places/page.tsx to be a server component again
Replace app/places/page.tsx with:

tsx
Copy code
import { prisma } from "@/lib/prisma";
import { PlacesClient } from "@/components/PlacesClient";

export default async function PlacesPage() {
  const places = await prisma.place.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Prisma Json fields are already plain JS values; just pass through.
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-16 sm:py-20">
      <header className="mb-8">
        <h1 className="mb-3 font-serif text-3xl sm:text-4xl">Places in Madrid</h1>
        <p className="max-w-xl text-sm text-textMuted">
          Cafés, restaurants, and bars I actually go to. This list will grow as I keep exploring.
        </p>
      </header>

      <PlacesClient places={places as any} />
    </div>
  );
}
7) Update PlaceCard to use a simple prop type (not data/places.ts)
Open components/PlaceCard.tsx and replace the import of Place with an inline type:

tsx
Copy code
type PlaceCardPlace = {
  id: string;
  name: string;
  neighborhood: string;
  category: "coffee" | "restaurant" | "bar";
  tags: string[];
  rating: number;
  shortBlurb: string;
  googleMapsUrl?: string | null;
};
Then update props:

tsx
Copy code
type PlaceCardProps = {
  place: PlaceCardPlace;
};
Everything else can stay the same.

Now PlaceCard works for DB rows.

8) Refactor /places/[id] to fetch from DB
Open app/places/[id]/page.tsx and replace PLACES.find(...) with Prisma.

At top:

tsx
Copy code
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
Then in the component:

tsx
Copy code
export default async function PlaceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const place = await prisma.place.findUnique({
    where: { id: params.id },
  });

  if (!place) return notFound();

  const priceText =
    place.priceLevel !== null && place.priceLevel !== undefined
      ? "€".repeat(place.priceLevel)
      : undefined;

  // place.tags is Json → treat as string[]
  const tags = (place.tags ?? []) as string[];
  const goodFor = (place.goodFor ?? []) as string[];

  // KEEP your Step 4 layout, but swap the old fields for:
  // place.name, place.neighborhood, place.category, place.rating,
  // place.shortBlurb, place.longReview, place.googleMapsUrl,
  // tags, goodFor, priceText
}
Use the same UI you built in STEP_4; just replace the source of data.

9) Clean up old dummy modules (optional but recommended)
Once /places and /places/[id] are working from DB:

Delete data/places.ts (or keep only for reference)

Remove any imports that still point to it

10) Checklist for end of STEP_5
 npx prisma migrate dev succeeded

 npx prisma db seed inserted sample places

 GET /api/places returns JSON list

 GET /api/places/hanso returns one record

 /places shows cards from DB and filters work

 /places/[id] loads from DB and renders your richer detail layout

