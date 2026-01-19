import { prisma } from "@/lib/prisma";
import { isValidAdminSecret } from "@/lib/adminAuth";

type Body = {
  adminSecret?: string;
  published?: boolean;
  featured?: boolean;
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as Body;

  if (!isValidAdminSecret(body.adminSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const data: { published?: boolean; featured?: boolean } = {};
  if (typeof body.published === "boolean") data.published = body.published;
  if (typeof body.featured === "boolean") data.featured = body.featured;

  if (Object.keys(data).length === 0) {
    return new Response("No flags to update", { status: 400 });
  }

  try {
    const updated = await prisma.place.update({
      where: { id },
      data,
    });

    console.log("[FLAGS] Updated:", { id: updated.id, published: updated.published, featured: updated.featured });

    return Response.json({
      ok: true,
      id: updated.id,
      published: updated.published,
      featured: updated.featured,
    });
  } catch (err) {
    console.error("[FLAGS] Error:", err);
    return new Response("Place not found", { status: 404 });
  }
}
