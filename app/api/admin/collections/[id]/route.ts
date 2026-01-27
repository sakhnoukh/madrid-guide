// app/api/admin/collections/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

function isValidAdminSecret(secret: string | undefined) {
  const expected = process.env.ADMIN_SECRET;
  return !!expected && secret === expected;
}

type RouteContext = { params: Promise<{ id: string }> };

// GET single collection with places
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      places: {
        include: { place: true },
        orderBy: { addedAt: "desc" },
      },
    },
  });

  if (!collection) {
    return new Response("Not found", { status: 404 });
  }

  return Response.json(collection);
}

// PATCH update collection
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await req.json();

  if (!isValidAdminSecret(body.adminSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { title, description } = body;

  const collection = await prisma.collection.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description && { description }),
    },
  });

  return Response.json(collection);
}

// DELETE collection
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await req.json();

  if (!isValidAdminSecret(body.adminSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  await prisma.collection.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
