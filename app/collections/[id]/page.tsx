// app/collections/[id]/page.tsx

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { COLLECTIONS } from "@/data/collections";
import { PlaceCard } from "@/components/PlaceCard";

export const dynamic = "force-dynamic";

type CollectionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { id } = await params;
  
  const collection = COLLECTIONS.find((c) => c.id === id);
  if (!collection) {
    notFound();
  }

  // Map collection IDs to tag filters
  const tagMap: Record<string, string> = {
    "first-dates": "first-date",
    "laptop-cafes": "laptop-friendly",
    "near-retiro": "retiro",
    "late-night": "late-night",
  };

  const tagFilter = tagMap[id];

  const rawPlaces = await prisma.place.findMany({
    where: {
      published: true,
      ...(tagFilter ? { tags: { contains: tagFilter } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const places = rawPlaces.map((p) => ({
    ...p,
    tags: JSON.parse(p.tags) as string[],
    goodFor: p.goodFor ? (JSON.parse(p.goodFor) as string[]) : null,
  }));

  // Filter by tag in parsed tags array (since JSON contains isn't perfect)
  const filteredPlaces = tagFilter
    ? places.filter((p) => p.tags.some((t) => t.toLowerCase().includes(tagFilter.toLowerCase())))
    : places;

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-16 sm:py-20">
      <header className="mb-8">
        <Link
          href="/collections"
          className="mb-4 inline-block text-sm text-[#D46A4C] hover:underline"
        >
          ← Back to Collections
        </Link>
        <h1 className="mb-3 font-serif text-3xl sm:text-4xl">
          {collection.title}
        </h1>
        <p className="max-w-xl text-sm text-[#9A9A9A]">
          {collection.description}
        </p>
      </header>

      {filteredPlaces.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-sm text-[#9A9A9A] shadow-sm ring-1 ring-black/5">
          No places in this collection yet.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlaces.map((p) => (
            <PlaceCard key={p.id} place={p as any} />
          ))}
        </div>
      )}
    </div>
  );
}
