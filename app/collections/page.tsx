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
        <p className="max-w-xl text-sm text-[#9A9A9A]">
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
