import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PlaceCard } from "@/components/PlaceCard";
import { Hero } from "@/components/Hero";
import { MoodTiles } from "@/components/MoodTiles";

export const dynamic = "force-dynamic";

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

  // Parse JSON fields
  const parsedFeatured = featured.map((p) => ({
    ...p,
    tags: JSON.parse(p.tags) as string[],
    goodFor: p.goodFor ? (JSON.parse(p.goodFor) as string[]) : null,
  }));

  const parsedNewest = newest.map((p) => ({
    ...p,
    tags: JSON.parse(p.tags) as string[],
    goodFor: p.goodFor ? (JSON.parse(p.goodFor) as string[]) : null,
  }));

  return (
    <main className="min-h-screen">
      <Hero />

      {/* MOOD TILES */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl">Start here</h2>
            <p className="mt-1 text-sm text-[#9A9A9A]">
              Browse by mood. No overthinking.
            </p>
          </div>
          <Link
            href="/places"
            className="text-sm text-[#D46A4C] underline-offset-2 hover:underline"
          >
            View all →
          </Link>
        </div>

        <MoodTiles />
      </section>

      {/* FEATURED PICKS */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:pb-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl">Featured picks</h2>
            <p className="mt-1 text-sm text-[#9A9A9A]">
              The spots I&apos;d send a friend to first.
            </p>
          </div>
          <Link
            href="/places"
            className="text-sm text-[#D46A4C] underline-offset-2 hover:underline"
          >
            Browse →
          </Link>
        </div>

        {parsedFeatured.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-[#9A9A9A] shadow-sm ring-1 ring-black/5">
            No featured places yet — mark a few as Featured in /admin.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {parsedFeatured.map((p) => (
              <PlaceCard key={p.id} place={p as any} />
            ))}
          </div>
        )}
      </section>

      {/* NEWEST */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl">Newest</h2>
            <p className="mt-1 text-sm text-[#9A9A9A]">
              Recently added and published.
            </p>
          </div>
          <Link
            href="/places"
            className="text-sm text-[#D46A4C] underline-offset-2 hover:underline"
          >
            See all →
          </Link>
        </div>

        {parsedNewest.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-[#9A9A9A] shadow-sm ring-1 ring-black/5">
            Nothing published yet — add places via bot and publish them in /admin.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {parsedNewest.map((p) => (
              <PlaceCard key={p.id} place={p as any} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
