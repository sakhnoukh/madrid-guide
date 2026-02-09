import { prisma } from "@/lib/prisma";
import { isValidAdminSecret } from "@/lib/adminAuth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const adminSecret = url.searchParams.get("adminSecret");

  if (!isValidAdminSecret(adminSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const places = await prisma.place.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return Response.json(
    {
      exportedAt: new Date().toISOString(),
      count: places.length,
      places,
    },
    {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    }
  );
}
