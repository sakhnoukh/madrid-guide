import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const places = await prisma.place.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-16 sm:py-20">
      <header className="mb-8">
        <h1 className="mb-2 font-serif text-3xl sm:text-4xl">Admin</h1>
        <p className="text-sm text-[#9A9A9A]">Edit and manage your places.</p>
        <div className="mt-4">
          <Link
            href="/admin/add"
            className="inline-flex rounded-full bg-[#D46A4C] px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#D46A4C]/90"
          >
            Add new place
          </Link>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="divide-y divide-black/5">
          {places.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-serif text-lg">{p.name}</div>
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
          {places.length === 0 && (
            <div className="p-4 text-sm text-[#9A9A9A]">No places yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
