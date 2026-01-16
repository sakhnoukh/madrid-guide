// app/places/page.tsx

import { prisma } from "@/lib/prisma";
import { PlacesClient } from "@/components/PlacesClient";

export const dynamic = "force-dynamic";

export default async function PlacesPage() {
  const rawPlaces = await prisma.place.findMany({
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
      <header className="mb-8">
        <h1 className="mb-3 font-serif text-3xl sm:text-4xl">Places in Madrid</h1>
        <p className="max-w-xl text-sm text-[#9A9A9A]">
          Cafés, restaurants, and bars I actually go to. This list will grow as I keep exploring.
        </p>
      </header>

      <PlacesClient places={places as any} />
    </div>
  );
}
