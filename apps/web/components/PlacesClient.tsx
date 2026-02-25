"use client";

import type { LatLngBounds as LeafletLatLngBounds } from "leaflet";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<LeafletLatLngBounds | null>(null);
  const [layoutMode, setLayoutMode] = useState<"list" | "split">("list");
  const [splitMobilePane, setSplitMobilePane] = useState<"list" | "map">("list");
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  const mappableFiltered = useMemo(
    () => filtered.filter((p) => typeof p.lat === "number" && typeof p.lng === "number"),
    [filtered]
  );

  const visiblePlaces = useMemo(() => {
    if (!mapBounds) return mappableFiltered;

    return mappableFiltered.filter((p) => mapBounds.contains([p.lat as number, p.lng as number]));
  }, [mappableFiltered, mapBounds]);

  const handleBoundsChange = useCallback((bounds: LeafletLatLngBounds) => {
    setMapBounds(bounds);
  }, []);

  const handleSelect = useCallback((placeId: string) => {
    setSelectedPlaceId(placeId);
  }, []);

  const handleHover = useCallback((placeId: string | null) => {
    setHoveredPlaceId(placeId);
  }, []);

  const resolvedSelectedPlaceId = useMemo(() => {
    if (!selectedPlaceId) return null;
    return mappableFiltered.some((place) => place.id === selectedPlaceId) ? selectedPlaceId : null;
  }, [mappableFiltered, selectedPlaceId]);

  const resolvedHoveredPlaceId = useMemo(() => {
    if (!hoveredPlaceId) return null;
    return mappableFiltered.some((place) => place.id === hoveredPlaceId) ? hoveredPlaceId : null;
  }, [mappableFiltered, hoveredPlaceId]);

  useEffect(() => {
    if (!resolvedSelectedPlaceId) return;
    const node = cardRefs.current[resolvedSelectedPlaceId];
    if (!node) return;

    node.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [resolvedSelectedPlaceId]);

  const mapPane = mappableFiltered.length ? (
    <PlacesMap
      places={mappableFiltered}
      selectedPlaceId={resolvedSelectedPlaceId}
      hoveredPlaceId={resolvedHoveredPlaceId}
      onSelect={handleSelect}
      onHover={handleHover}
      onBoundsChange={handleBoundsChange}
      heightClassName="h-[65vh] min-h-[460px] lg:h-[calc(100vh-14rem)] lg:min-h-[560px]"
    />
  ) : (
    <div className="rounded-2xl bg-white p-6 text-sm text-[#9A9A9A] shadow-sm ring-1 ring-black/5">
      No mappable places for this filter yet. Places without coordinates are excluded from the map.
    </div>
  );

  const listPane = (
    <>
      {visiblePlaces.length === 0 ? (
        <p className="text-sm text-[#9A9A9A]">No places are in the current map area. Move the map to explore more.</p>
      ) : (
        <div className="space-y-4">
          {visiblePlaces.map((place) => (
            <div
              key={place.id}
              id={`place-${place.id}`}
              ref={(node) => {
                cardRefs.current[place.id] = node;
              }}
            >
              <PlaceCard
                place={place}
                mode="select"
                isSelected={resolvedSelectedPlaceId === place.id}
                isHovered={resolvedHoveredPlaceId === place.id}
                onSelect={handleSelect}
                onHover={handleHover}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );

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
          {layoutMode === "split"
            ? `${visiblePlaces.length} in view · ${mappableFiltered.length} mappable`
            : `${filtered.length} ${filtered.length === 1 ? "place" : "places"}`}
          {layoutMode === "split" && filtered.length !== mappableFiltered.length
            ? ` (${filtered.length - mappableFiltered.length} without coordinates)`
            : ""}
        </p>
        <div className="flex items-center gap-2">
          {/* List/Split toggle */}
          <div className="flex items-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
            <button
              onClick={() => setLayoutMode("list")}
              className={[
                "px-3 py-1 text-xs transition rounded-full",
                layoutMode === "list" ? "bg-[#D46A4C] text-white" : "text-[#4B4B4B] hover:bg-black/5",
              ].join(" ")}
              type="button"
            >
              List
            </button>
            <button
              onClick={() => setLayoutMode("split")}
              className={[
                "px-3 py-1 text-xs transition rounded-full",
                layoutMode === "split" ? "bg-[#D46A4C] text-white" : "text-[#4B4B4B] hover:bg-black/5",
              ].join(" ")}
              type="button"
            >
              Split
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

      {/* MOBILE */}
      {filtered.length === 0 ? (
        <p className="text-sm text-[#9A9A9A]">No places match this filter yet.</p>
      ) : layoutMode === "list" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2 lg:hidden">
            <div className="flex items-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
              <button
                onClick={() => setSplitMobilePane("list")}
                className={[
                  "px-3 py-1 text-xs transition rounded-full",
                  splitMobilePane === "list" ? "bg-[#1E3A5F] text-white" : "text-[#4B4B4B] hover:bg-black/5",
                ].join(" ")}
                type="button"
              >
                List pane
              </button>
              <button
                onClick={() => setSplitMobilePane("map")}
                className={[
                  "px-3 py-1 text-xs transition rounded-full",
                  splitMobilePane === "map" ? "bg-[#1E3A5F] text-white" : "text-[#4B4B4B] hover:bg-black/5",
                ].join(" ")}
                type="button"
              >
                Map pane
              </button>
            </div>
          </div>

          <div className="lg:hidden">
            {splitMobilePane === "map" ? mapPane : listPane}
          </div>

          {/* DESKTOP SPLIT */}
          <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:gap-6">
            <section className="h-[calc(100vh-14rem)] overflow-y-auto pr-2">
              {listPane}
            </section>

            <aside className="sticky top-24 h-[calc(100vh-8rem)] self-start">
              {mapPane}
            </aside>
          </div>
        </>
      )}

      {mappableFiltered.length > 0 && visiblePlaces.length === 0 && (
        <div className="mt-4 rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-4 py-2 text-xs text-[#7A6A60]">
          Tip: pan or zoom the map to update the visible list.
        </div>
      )}
    </>
  );
}
