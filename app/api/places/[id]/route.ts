import { prisma } from "@/lib/prisma";
import { isValidAdminSecret } from "@/lib/adminAuth";

type UpdatePlaceBody = {
  adminSecret?: string;
  name?: string;
  neighborhood?: string;
  category?: "coffee" | "restaurant" | "bar";
  tags?: string[];
  goodFor?: string[];
  rating?: number;
  shortBlurb?: string;
  longReview?: string;
  priceLevel?: number | null;
  googleMapsUrl?: string | null;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const place = await prisma.place.findUnique({
    where: { id },
  });

  if (!place) {
    return new Response("Not found", { status: 404 });
  }

  // Parse JSON strings back to arrays
  const parsed = {
    ...place,
    tags: JSON.parse(place.tags),
    goodFor: place.goodFor ? JSON.parse(place.goodFor) : null,
  };

  return Response.json(parsed);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as UpdatePlaceBody;

  if (!isValidAdminSecret(body.adminSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const data: Record<string, unknown> = {};

  if (body.name !== undefined) data.name = body.name.trim();
  if (body.neighborhood !== undefined) data.neighborhood = body.neighborhood.trim();
  if (body.category !== undefined) data.category = body.category;
  if (body.tags !== undefined) data.tags = JSON.stringify(body.tags.map((t) => t.trim()).filter(Boolean));
  if (body.goodFor !== undefined) data.goodFor = JSON.stringify(body.goodFor.map((g) => g.trim()).filter(Boolean));
  if (body.rating !== undefined) data.rating = body.rating;
  if (body.shortBlurb !== undefined) data.shortBlurb = body.shortBlurb.trim();
  if (body.longReview !== undefined) data.longReview = body.longReview.trim();
  if (body.priceLevel !== undefined) data.priceLevel = body.priceLevel;
  if (body.googleMapsUrl !== undefined) data.googleMapsUrl = body.googleMapsUrl;

  const updated = await prisma.place.update({
    where: { id },
    data,
  });

  return Response.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { adminSecret?: string };

  if (!isValidAdminSecret(body.adminSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  await prisma.place.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
