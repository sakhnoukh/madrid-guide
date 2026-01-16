import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminEditClient } from "@/components/AdminEditClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditPage({ params }: PageProps) {
  const { id } = await params;
  const place = await prisma.place.findUnique({ where: { id } });
  if (!place) return notFound();

  // Parse JSON fields for the client
  const parsed = {
    ...place,
    tags: JSON.parse(place.tags) as string[],
    goodFor: place.goodFor ? (JSON.parse(place.goodFor) as string[]) : [],
  };

  return <AdminEditClient place={parsed} />;
}
