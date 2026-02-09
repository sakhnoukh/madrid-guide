"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { PlaceCard } from "@/components/PlaceCard";

const PlacesMap = dynamic(() => import("@/components/PlacesMap").then((m) => m.PlacesMap), {
  ssr: false,
  loading: () => <div className="h-[70vh] min-h-[520px] rounded-2xl bg-white animate-pulse" />,
});

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
  lat?: number | null;
  lng?: number | null;
};

type CategoryValue = "all" | "Restaurant" | "Bar" | "Café" | "Club" | "Brunch" | "Other";
type RatingSort = "none" | "asc" | "desc";

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
  const [ratingSort, setRatingSort] = useState<RatingSort>("none");
  const [query, setQuery] = useState(initialQuery);
  const [view, setView] = useState<"list" | "map">("list");

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

    const result = places.filter((p) => {
      const categoryOk = activeCategory === "all" || p.category === activeCategory;
      const tagOk = activeTag === "all" || p.tags?.some((t) => t.toLowerCase().trim() === activeTag);
      const neighborhoodOk = activeNeighborhood === "all" || p.neighborhood === activeNeighborhood;

      const queryOk =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q));

      return categoryOk && tagOk && neighborhoodOk && queryOk;
    });

    // Sort by rating if enabled
    if (ratingSort === "asc") {
      result.sort((a, b) => a.rating - b.rating);
    } else if (ratingSort === "desc") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [places, activeCategory, activeTag, activeNeighborhood, ratingSort, query]);

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

      {/* GRID HEADER with view toggle + sort */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-[#9A9A9A]">
          {filtered.length} {filtered.length === 1 ? "place" : "places"}
        </p>
        <div className="flex items-center gap-2">
          {/* List/Map toggle */}
          <div className="flex items-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
            <button
              onClick={() => setView("list")}
              className={[
                "px-3 py-1 text-xs transition rounded-full",
                view === "list" ? "bg-[#D46A4C] text-white" : "text-[#4B4B4B] hover:bg-black/5",
              ].join(" ")}
              type="button"
            >
              List
            </button>
            <button
              onClick={() => setView("map")}
              className={[
                "px-3 py-1 text-xs transition rounded-full",
                view === "map" ? "bg-[#D46A4C] text-white" : "text-[#4B4B4B] hover:bg-black/5",
              ].join(" ")}
              type="button"
            >
              Map
            </button>
          </div>
          {/* Rating sort */}
          <button
            onClick={() => {
              if (ratingSort === "none") setRatingSort("desc");
              else if (ratingSort === "desc") setRatingSort("asc");
              else setRatingSort("none");
            }}
            className={[
              "flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition",
              ratingSort !== "none"
                ? "border-[#D46A4C] bg-[#D46A4C] text-white"
                : "border-[#D8C7B8] bg-[#FDF8F3] text-[#4B4B4B] hover:bg-[#F1E4D7]",
            ].join(" ")}
          >
            <span>Rating</span>
            {ratingSort === "desc" && <span>↓</span>}
            {ratingSort === "asc" && <span>↑</span>}
            {ratingSort === "none" && <span>–</span>}
          </button>
        </div>
      </div>

      {/* GRID or MAP */}
      {filtered.length === 0 ? (
        <p className="text-sm text-[#9A9A9A]">No places match this filter yet.</p>
      ) : view === "map" ? (
        <PlacesMap places={filtered} />
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
