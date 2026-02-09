// app/api/admin/collections/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

function isValidAdminSecret(secret: string | undefined) {
  const expected = process.env.ADMIN_SECRET;
  return !!expected && secret === expected;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET all collections
export async function GET() {
  const collections = await prisma.collection.findMany({
    include: {
      places: {
        include: { place: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(collections);
}

// POST create new collection
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!isValidAdminSecret(body.adminSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { title, description } = body;

  if (!title || !description) {
    return new Response("Missing title or description", { status: 400 });
  }

  const slug = slugify(title);

  // Check if slug already exists
  const existing = await prisma.collection.findUnique({ where: { slug } });
  if (existing) {
    return new Response("Collection with this name already exists", { status: 409 });
  }

  const collection = await prisma.collection.create({
    data: { title, description, slug },
  });

  return Response.json(collection, { status: 201 });
}
