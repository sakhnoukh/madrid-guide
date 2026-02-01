import { prisma } from "@/lib/prisma";
import { isValidAdminSecret } from "@/lib/adminAuth";

type CreatePlaceBody = {
  adminSecret?: string;

  id: string;
  name: string;
  neighborhood: string;
  category: string;

  tags?: string[];
  goodFor?: string[];

  rating: number;
  review: string;

  priceLevel?: number;
  googleMapsUrl?: string;
};

export async function GET() {
  const places = await prisma.place.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Parse JSON strings back to arrays
  const parsed = places.map((p) => ({
    ...p,
    tags: JSON.parse(p.tags),
    goodFor: p.goodFor ? JSON.parse(p.goodFor) : null,
  }));

  return Response.json(parsed);
}

export async function POST(req: Request) {
  let body: CreatePlaceBody;

  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Auth
  if (!isValidAdminSecret(body.adminSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Basic validation
  const required = ["id", "name", "neighborhood", "category", "rating", "review"] as const;
  for (const key of required) {
    if ((body as any)[key] === undefined || (body as any)[key] === "") {
      return new Response(`Missing field: ${key}`, { status: 400 });
    }
  }

  const validCategories = ["Restaurant", "Bar", "Café", "Club", "Brunch", "Other"];
  if (!validCategories.includes(body.category)) {
    return new Response("Invalid category", { status: 400 });
  }

  if (typeof body.rating !== "number" || body.rating < 1 || body.rating > 5) {
    return new Response("Rating must be a number between 1 and 5", { status: 400 });
  }

  if (body.priceLevel !== undefined) {
    if (
      typeof body.priceLevel !== "number" ||
      body.priceLevel < 1 ||
      body.priceLevel > 4
    ) {
      return new Response("priceLevel must be 1..4", { status: 400 });
    }
  }

  // Normalize
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => t.trim()).filter(Boolean)
    : [];

  const goodFor = Array.isArray(body.goodFor)
    ? body.goodFor.map((g) => g.trim()).filter(Boolean)
    : [];

  try {
    const created = await prisma.place.create({
      data: {
        id: body.id.trim(),
        name: body.name.trim(),
        neighborhood: body.neighborhood.trim(),
        category: body.category,
        tags: JSON.stringify(tags),
        goodFor: goodFor.length ? JSON.stringify(goodFor) : undefined,
        rating: body.rating,
        review: body.review.trim(),
        priceLevel: body.priceLevel ?? undefined,
        googleMapsUrl: body.googleMapsUrl?.trim() || undefined,
      },
    });

    // Return parsed response
    const parsed = {
      ...created,
      tags: JSON.parse(created.tags),
      goodFor: created.goodFor ? JSON.parse(created.goodFor) : null,
    };

    return Response.json(parsed, { status: 201 });
  } catch (e: any) {
    // Common failure: duplicate id
    return new Response(e?.message ?? "Failed to create place", { status: 500 });
  }
}
