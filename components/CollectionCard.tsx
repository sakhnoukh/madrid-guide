// components/CollectionCard.tsx
"use client";

import { Collection } from "@/data/collections";

type CollectionCardProps = {
  collection: Collection;
};

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <article className="flex h-full flex-col justify-between rounded-2xl border border-[#D8C7B8] bg-[#FDF8F3] p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <h3 className="mb-2 font-serif text-lg">{collection.title}</h3>
      <p className="mb-4 text-sm text-[#4B4B4B]">{collection.description}</p>
      <span className="text-xs font-medium text-[#D46A4C]">
        View places in this collection →
      </span>
    </article>
  );
}
