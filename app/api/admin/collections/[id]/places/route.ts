// app/api/admin/collections/[id]/places/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

function isValidAdminSecret(secret: string | undefined) {
  const expected = process.env.ADMIN_SECRET;
  return !!expected && secret === expected;
}

type RouteContext = { params: Promise<{ id: string }> };

// POST add place to collection
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id: collectionId } = await params;
  const body = await req.json();

  if (!isValidAdminSecret(body.adminSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { placeId } = body;

  if (!placeId) {
    return new Response("Missing placeId", { status: 400 });
  }

  // Check if already in collection
  const existing = await prisma.collectionPlace.findUnique({
    where: {
      collectionId_placeId: { collectionId, placeId },
    },
  });

  if (existing) {
    return new Response("Place already in collection", { status: 409 });
  }

  const entry = await prisma.collectionPlace.create({
    data: { collectionId, placeId },
    include: { place: true },
  });

  return Response.json(entry, { status: 201 });
}

// DELETE remove place from collection
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { id: collectionId } = await params;
  const body = await req.json();

  if (!isValidAdminSecret(body.adminSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { placeId } = body;

  if (!placeId) {
    return new Response("Missing placeId", { status: 400 });
  }

  await prisma.collectionPlace.delete({
    where: {
      collectionId_placeId: { collectionId, placeId },
    },
  });

  return new Response(null, { status: 204 });
}
