import { prisma } from "@/lib/prisma";
import { isValidAdminSecret } from "@/lib/adminAuth";

type LinkItem = { label: string; url: string };

type UpdatePlaceBody = {
  adminSecret?: string;
  name?: string;
  neighborhood?: string;
  category?: string;
  tags?: string[];
  goodFor?: string[];
  rating?: number;
  review?: string;
  priceLevel?: number | null;
  googleMapsUrl?: string | null;
  links?: LinkItem[];
  media?: string[];
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
    links: place.links ? JSON.parse(place.links) : null,
    media: place.media ? JSON.parse(place.media) : null,
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
  if (body.review !== undefined) data.review = body.review.trim();
  if (body.priceLevel !== undefined) data.priceLevel = body.priceLevel;
  if (body.googleMapsUrl !== undefined) data.googleMapsUrl = body.googleMapsUrl;
  if (body.links !== undefined) data.links = JSON.stringify(body.links.filter((l) => l.label && l.url));
  if (body.media !== undefined) data.media = JSON.stringify(body.media.filter(Boolean));

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
