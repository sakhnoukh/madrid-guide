import { prisma } from "@/lib/prisma";

export async function GET() {
  const all = await prisma.place.findMany({
    select: {
      id: true,
      name: true,
      published: true,
      featured: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return Response.json({
    total: all.length,
    published: all.filter((p) => p.published).length,
    drafts: all.filter((p) => !p.published).length,
    places: all,
  });
}
