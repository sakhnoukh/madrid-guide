// app/admin/collections/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CollectionManageClient } from "@/components/CollectionManageClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ManageCollectionPage({ params }: PageProps) {
  const { id } = await params;

  const collection = await prisma.collection.findUnique({
    where: { id },
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

  // Get all published places for the "add" dropdown
  const allPlaces = await prisma.place.findMany({
    where: { published: true },
    orderBy: { name: "asc" },
  });

  // IDs of places already in collection
  const inCollectionIds = new Set(collection.places.map((cp) => cp.placeId));

  // Places not yet in collection
  const availablePlaces = allPlaces.filter((p) => !inCollectionIds.has(p.id));

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-16 sm:py-20">
      <header className="mb-6">
        <Link
          href="/admin"
          className="text-xs text-[#9A9A9A] hover:text-[#D46A4C] hover:underline underline-offset-2"
        >
          ← Back to admin
        </Link>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl">{collection.title}</h1>
        <p className="mt-1 text-sm text-[#9A9A9A]">{collection.description}</p>
      </header>

      <CollectionManageClient
        collectionId={collection.id}
        initialPlaces={collection.places.map((cp) => cp.place)}
        availablePlaces={availablePlaces}
      />
    </div>
  );
}
