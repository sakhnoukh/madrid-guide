// app/places/page.tsx

import { prisma } from "@/lib/prisma";
import { PlacesClient } from "@/components/PlacesClient";

export const dynamic = "force-dynamic";

type PlacesPageProps = {
  searchParams: Promise<{ category?: string; tag?: string; q?: string }>;
};

export default async function PlacesPage({ searchParams }: PlacesPageProps) {
  const params = await searchParams;
  const category = params?.category;
  const tag = params?.tag;
  const q = params?.q;

  const rawPlaces = await prisma.place.findMany({
    where: {
      published: true,
      ...(category && category !== "all" ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  // Parse JSON strings back to arrays
  const places = rawPlaces.map((p) => ({
    ...p,
    tags: JSON.parse(p.tags) as string[],
    goodFor: p.goodFor ? (JSON.parse(p.goodFor) as string[]) : null,
  }));

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-16 sm:py-20">
      <div className="mb-4 text-xs text-[#9A9A9A]">
        <a
          href="/"
          className="inline-flex items-center gap-1 text-[#9A9A9A] underline-offset-2 hover:text-[#D46A4C] hover:underline"
        >
          <span>←</span>
          <span>Back to home</span>
        </a>
      </div>

      <header className="mb-8">
        <h1 className="mb-3 font-serif text-3xl sm:text-4xl">Places in Madrid</h1>
        <p className="max-w-xl text-sm text-[#9A9A9A]">
          Cafés, restaurants, and bars I have/want to go to. This list will keep growing as I find new places.
        </p>
      </header>

      <PlacesClient
        places={places as any}
        initialCategory={(category as "all" | "Restaurant" | "Bar" | "Café" | "Club" | "Brunch" | "Other") || "all"}
        initialTag={tag || "all"}
        initialQuery={q || ""}
      />
    </div>
  );
}
