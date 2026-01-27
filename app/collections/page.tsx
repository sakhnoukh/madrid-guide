// app/collections/page.tsx

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CollectionCard } from "@/components/CollectionCard";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const collections = await prisma.collection.findMany({
    include: {
      places: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-16 sm:py-20">
      <header className="mb-8">
        <h1 className="mb-3 font-serif text-3xl sm:text-4xl">
          Collections
        </h1>
        <p className="max-w-xl text-sm text-[#9A9A9A]">
          Curated sets of spots for different moods and situations.
        </p>
      </header>

      {collections.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-sm text-[#9A9A9A] shadow-sm ring-1 ring-black/5">
          No collections yet.
        </div>
      ) : (
        <section>
          <div className="grid gap-6 md:grid-cols-2">
            {collections.map((collection) => (
              <Link key={collection.id} href={`/collections/${collection.slug}`}>
                <CollectionCard
                  collection={{
                    id: collection.id,
                    title: collection.title,
                    description: collection.description,
                  }}
                />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
