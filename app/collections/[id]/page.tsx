// app/collections/[id]/page.tsx

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PlaceCard } from "@/components/PlaceCard";

export const dynamic = "force-dynamic";

type CollectionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { id } = await params;

  // Try to find by ID first, then by slug
  const collection = await prisma.collection.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
    include: {
      places: {
        include: { place: true },
        orderBy: { addedAt: "desc" },
      },
    },
  });

  if (!collection) {
    notFound();
  }

  // Parse JSON fields for places
  const places = collection.places
    .map((cp) => cp.place)
    .filter((p) => p.published)
    .map((p) => ({
      ...p,
      tags: JSON.parse(p.tags) as string[],
      goodFor: p.goodFor ? (JSON.parse(p.goodFor) as string[]) : null,
    }));

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

      {places.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-sm text-[#9A9A9A] shadow-sm ring-1 ring-black/5">
          No places in this collection yet.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((p) => (
            <PlaceCard key={p.id} place={p as any} />
          ))}
        </div>
      )}
    </div>
  );
}
