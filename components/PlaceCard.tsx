// components/PlaceCard.tsx
"use client";

import Link from "next/link";

type PlaceCardPlace = {
  id: string;
  name: string;
  neighborhood: string;
  category: "Café" | "Restaurant" | "Bar" | "Brunch" | "Club";
  tags: string[];
  rating: number;
  shortBlurb: string;
  googleMapsUrl?: string | null;
};

type PlaceCardProps = {
  place: PlaceCardPlace;
};

export function PlaceCard({ place }: PlaceCardProps) {
  return (
    <article className="flex h-full flex-col justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-md">
      <Link href={`/places/${place.id}`} className="flex-1">
        {/* Top: name + neighborhood */}
        <div>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <h3 className="font-serif text-lg leading-snug">{place.name}</h3>
            <span className="text-xs uppercase tracking-wide text-[#9A9A9A]">
              {place.neighborhood}
            </span>
          </div>

          {/* Category */}
          <p className="mb-2 text-xs text-[#9A9A9A]">
            {place.category}
          </p>

          {/* Tags */}
          <div className="mb-3 flex flex-wrap gap-1">
            {place.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#F0E1D7] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#7A4A35]"
              >
                {tag.replace("-", " ")}
              </span>
            ))}
          </div>

          {/* Short blurb */}
          <p className="text-sm text-[#4B4B4B]">{place.shortBlurb}</p>
        </div>
      </Link>

      {/* Bottom: rating + map link */}
      <div className="mt-4 flex items-center justify-between text-xs text-[#9A9A9A]">
        <div className="flex items-center gap-1">
          <span className="text-[13px]">★</span>
          <span>{place.rating.toFixed(1)}</span>
        </div>
        {place.googleMapsUrl ? (
          <a
            href={place.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-medium text-[#D46A4C] underline-offset-2 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            View on map →
          </a>
        ) : (
          <span className="text-[11px]">Map coming soon</span>
        )}
      </div>
    </article>
  );
}
