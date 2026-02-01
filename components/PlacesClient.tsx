"use client";

import { useMemo, useState } from "react";
import { PlaceCard } from "@/components/PlaceCard";

type PlaceDTO = {
  id: string;
  name: string;
  neighborhood: string;
  category: "Restaurant" | "Bar" | "Café" | "Club" | "Brunch" | "Other";
  tags: string[];
  goodFor?: string[] | null;
  rating: number;
  review: string;
  priceLevel?: number | null;
  googleMapsUrl?: string | null;
};

type CategoryValue = "all" | "Restaurant" | "Bar" | "Café" | "Club" | "Brunch" | "Other";
type RatingFilter = "all" | "4+" | "4.5+";

type PlacesClientProps = {
  places: PlaceDTO[];
  initialCategory?: CategoryValue;
  initialTag?: string;
  initialQuery?: string;
};

export function PlacesClient({
  places,
  initialCategory = "all",
  initialTag = "all",
  initialQuery = "",
}: PlacesClientProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryValue>(initialCategory);
  const [activeTag, setActiveTag] = useState<string>(initialTag);
  const [activeNeighborhood, setActiveNeighborhood] = useState<string>("all");
  const [activeRating, setActiveRating] = useState<RatingFilter>("all");
  const [query, setQuery] = useState(initialQuery);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    places.forEach((p) => p.tags?.forEach((t) => s.add(t.toLowerCase().trim())));
    return Array.from(s).sort();
  }, [places]);

  const allNeighborhoods = useMemo(() => {
    const s = new Set<string>();
    places.forEach((p) => s.add(p.neighborhood));
    return Array.from(s).sort();
  }, [places]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return places.filter((p) => {
      const categoryOk = activeCategory === "all" || p.category === activeCategory;
      const tagOk = activeTag === "all" || p.tags?.some((t) => t.toLowerCase().trim() === activeTag);
      const neighborhoodOk = activeNeighborhood === "all" || p.neighborhood === activeNeighborhood;
      const ratingOk =
        activeRating === "all" ||
        (activeRating === "4+" && p.rating >= 4) ||
        (activeRating === "4.5+" && p.rating >= 4.5);

      const queryOk =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q));

      return categoryOk && tagOk && neighborhoodOk && ratingOk && queryOk;
    });
  }, [places, activeCategory, activeTag, activeNeighborhood, activeRating, query]);

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
            { label: "All", value: "all" as CategoryValue },
            { label: "Restaurant", value: "Restaurant" as CategoryValue },
            { label: "Bar", value: "Bar" as CategoryValue },
            { label: "Café", value: "Café" as CategoryValue },
            { label: "Club", value: "Club" as CategoryValue },
            { label: "Brunch", value: "Brunch" as CategoryValue },
            { label: "Other", value: "Other" as CategoryValue },
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

        {/* Neighborhood */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
          <span className="mr-1 text-[#9A9A9A]">Neighborhood:</span>
          <button
            onClick={() => setActiveNeighborhood("all")}
            className={[
              "rounded-full border px-3 py-1 transition",
              activeNeighborhood === "all"
                ? "border-[#1E3A5F] bg-[#1E3A5F] text-white"
                : "border-[#D8C7B8] bg-[#FDF8F3] text-[#4B4B4B] hover:bg-[#F1E4D7]",
            ].join(" ")}
          >
            All
          </button>
          {allNeighborhoods.map((hood) => {
            const isActive = activeNeighborhood === hood;
            return (
              <button
                key={hood}
                onClick={() => setActiveNeighborhood(hood)}
                className={[
                  "rounded-full border px-3 py-1 transition",
                  isActive
                    ? "border-[#1E3A5F] bg-[#1E3A5F] text-white"
                    : "border-[#D8C7B8] bg-[#FDF8F3] text-[#4B4B4B] hover:bg-[#F1E4D7]",
                ].join(" ")}
              >
                {hood}
              </button>
            );
          })}
        </div>

        {/* Rating */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
          <span className="mr-1 text-[#9A9A9A]">Rating:</span>
          {[
            { label: "All", value: "all" as RatingFilter },
            { label: "4+", value: "4+" as RatingFilter },
            { label: "4.5+", value: "4.5+" as RatingFilter },
          ].map((item) => {
            const isActive = activeRating === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setActiveRating(item.value)}
                className={[
                  "rounded-full border px-3 py-1 transition",
                  isActive
                    ? "border-[#1E3A5F] bg-[#1E3A5F] text-white"
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
