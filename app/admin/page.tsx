import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const drafts = await prisma.place.findMany({
    where: { published: false },
    orderBy: { updatedAt: "desc" },
  });

  const published = await prisma.place.findMany({
    where: { published: true },
    orderBy: { updatedAt: "desc" },
  });

  const collections = await prisma.collection.findMany({
    include: {
      places: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-16 sm:py-20">
      <header className="mb-8">
        <h1 className="mb-2 font-serif text-3xl sm:text-4xl">Admin</h1>
        <p className="text-sm text-[#9A9A9A]">Edit and manage your places and collections.</p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/admin/add"
            className="inline-flex rounded-full bg-[#D46A4C] px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#D46A4C]/90"
          >
            Add new place
          </Link>
          <Link
            href="/admin/collections/new"
            className="inline-flex rounded-full border border-[#D46A4C] px-5 py-2 text-sm font-medium text-[#D46A4C] hover:bg-[#D46A4C]/10"
          >
            New collection
          </Link>
        </div>
      </header>

      {/* Drafts Section */}
      <h2 className="mb-3 font-serif text-2xl">Drafts ({drafts.length})</h2>
      <div className="mb-10 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="divide-y divide-black/5">
          {drafts.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-serif text-lg">{p.name}</div>
                <div className="text-xs text-[#9A9A9A]">
                  {p.neighborhood} · {p.category} · ★ {p.rating.toFixed(1)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                  Draft
                </span>
                <Link
                  href={`/admin/edit/${p.id}`}
                  className="text-xs text-[#D46A4C] underline-offset-2 hover:underline"
                >
                  Review →
                </Link>
              </div>
            </div>
          ))}
          {drafts.length === 0 && (
            <div className="p-4 text-sm text-[#9A9A9A]">No drafts. All caught up!</div>
          )}
        </div>
      </div>

      {/* Published Section */}
      <h2 className="mb-3 font-serif text-2xl">Published ({published.length})</h2>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="divide-y divide-black/5">
          {published.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-serif text-lg">
                  {p.name}
                  {p.featured && (
                    <span className="ml-2 text-xs text-[#D46A4C]">★ Featured</span>
                  )}
                </div>
                <div className="text-xs text-[#9A9A9A]">
                  {p.neighborhood} · {p.category} · ★ {p.rating.toFixed(1)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/places/${p.id}`}
                  className="text-xs text-[#9A9A9A] underline-offset-2 hover:underline"
                >
                  View
                </Link>
                <Link
                  href={`/admin/edit/${p.id}`}
                  className="text-xs text-[#D46A4C] underline-offset-2 hover:underline"
                >
                  Edit →
                </Link>
              </div>
            </div>
          ))}
          {published.length === 0 && (
            <div className="p-4 text-sm text-[#9A9A9A]">No published places yet.</div>
          )}
        </div>
      </div>

      {/* Collections Section */}
      <h2 className="mb-3 mt-10 font-serif text-2xl">Collections ({collections.length})</h2>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="divide-y divide-black/5">
          {collections.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-serif text-lg">{c.title}</div>
                <div className="text-xs text-[#9A9A9A]">
                  {c.places.length} place{c.places.length !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/collections/${c.slug}`}
                  className="text-xs text-[#9A9A9A] underline-offset-2 hover:underline"
                >
                  View
                </Link>
                <Link
                  href={`/admin/collections/${c.id}`}
                  className="text-xs text-[#D46A4C] underline-offset-2 hover:underline"
                >
                  Manage →
                </Link>
              </div>
            </div>
          ))}
          {collections.length === 0 && (
            <div className="p-4 text-sm text-[#9A9A9A]">No collections yet. Create one to get started.</div>
          )}
        </div>
      </div>
    </div>
  );
}
