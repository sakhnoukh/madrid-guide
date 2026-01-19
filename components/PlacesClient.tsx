"use client";

import { useMemo, useState } from "react";
import { PlaceCard } from "@/components/PlaceCard";

type PlaceDTO = {
  id: string;
  name: string;
  neighborhood: string;
  category: "coffee" | "restaurant" | "bar";
  tags: string[];
  goodFor?: string[] | null;
  rating: number;
  shortBlurb: string;
  longReview?: string | null;
  priceLevel?: number | null;
  googleMapsUrl?: string | null;
};

type PlacesClientProps = {
  places: PlaceDTO[];
  initialCategory?: "all" | "coffee" | "restaurant" | "bar";
  initialTag?: string;
  initialQuery?: string;
};

export function PlacesClient({
  places,
  initialCategory = "all",
  initialTag = "all",
  initialQuery = "",
}: PlacesClientProps) {
  const [activeCategory, setActiveCategory] = useState<
    "all" | "coffee" | "restaurant" | "bar"
  >(initialCategory);
  const [activeTag, setActiveTag] = useState<string>(initialTag);
  const [query, setQuery] = useState(initialQuery);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    places.forEach((p) => p.tags?.forEach((t) => s.add(t)));
    return Array.from(s);
  }, [places]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return places.filter((p) => {
      const categoryOk = activeCategory === "all" || p.category === activeCategory;
      const tagOk = activeTag === "all" || p.tags?.includes(activeTag);

      const queryOk =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q));

      return categoryOk && tagOk && queryOk;
    });
  }, [places, activeCategory, activeTag, query]);

  return (
    <>
      {/* SEARCH */}
      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, neighborhood, tag..."
          className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-[#D46A4C]"
        />
      </div>

      {/* FILTERS */}
      <section className="mb-8 space-y-3">
        {/* Category */}
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          {[
            { label: "All", value: "all" as const },
            { label: "Coffee", value: "coffee" as const },
            { label: "Restaurants", value: "restaurant" as const },
            { label: "Bars", value: "bar" as const },
          ].map((item) => {
            const isActive = activeCategory === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setActiveCategory(item.value)}
                className={[
                  "rounded-full border px-3 py-1 transition",
                  isActive
                    ? "border-[#D46A4C] bg-[#D46A4C] text-white"
                    : "border-[#D8C7B8] bg-[#FDF8F3] text-[#4B4B4B] hover:bg-[#F1E4D7]",
                ].join(" ")}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
          <span className="mr-1 text-[#9A9A9A]">Tags:</span>
          <button
            onClick={() => setActiveTag("all")}
            className={[
              "rounded-full border px-3 py-1 transition",
              activeTag === "all"
                ? "border-[#1E3A5F] bg-[#1E3A5F] text-white"
                : "border-[#D8C7B8] bg-[#FDF8F3] text-[#4B4B4B] hover:bg-[#F1E4D7]",
            ].join(" ")}
          >
            All
          </button>
          {allTags.map((tag) => {
            const isActive = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={[
                  "rounded-full border px-3 py-1 transition capitalize",
                  isActive
                    ? "border-[#1E3A5F] bg-[#1E3A5F] text-white"
                    : "border-[#D8C7B8] bg-[#FDF8F3] text-[#4B4B4B] hover:bg-[#F1E4D7]",
                ].join(" ")}
              >
                {tag.replace("-", " ")}
              </button>
            );
          })}
        </div>
      </section>

      {/* GRID */}
      {filtered.length === 0 ? (
        <p className="text-sm text-[#9A9A9A]">No places match this filter yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      )}
    </>
  );
}
