"use client";

import L, { type LatLngBounds as LeafletLatLngBounds, type Marker as LeafletMarker } from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

type PlaceForMap = {
  id: string;
  name: string;
  neighborhood: string;
  lat?: number | null;
  lng?: number | null;
  category: string;
  rating: number;
};

type PlacesMapProps = {
  places: PlaceForMap[];
  selectedPlaceId: string | null;
  hoveredPlaceId: string | null;
  onSelect: (placeId: string) => void;
  onHover: (placeId: string | null) => void;
  onBoundsChange: (bounds: LeafletLatLngBounds) => void;
  heightClassName?: string;
};

function dotIcon(colorClass: string, stateClass?: string) {
  return L.divIcon({
    className: "",
    html: `<div class="map-dot ${colorClass} ${stateClass ?? ""}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function categoryDot(category: string, state: "default" | "hover" | "selected") {
  const cat = category.toLowerCase();
  const stateClass = state === "selected" ? "map-dot-selected" : state === "hover" ? "map-dot-hover" : "";

  if (cat === "café" || cat === "cafe" || cat === "coffee") return dotIcon("dot-coffee", stateClass);
  if (cat === "club" || cat === "nightclub") return dotIcon("dot-club", stateClass);
  if (cat === "bar" || cat === "drinks") return dotIcon("dot-bar", stateClass);
  return dotIcon("dot-restaurant", stateClass);
}

function FitBounds({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, points]);

  return null;
}

function BoundsWatcher({ onBoundsChange }: { onBoundsChange: (bounds: LeafletLatLngBounds) => void }) {
  const map = useMap();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const emitDebounced = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onBoundsChange(map.getBounds());
      }, 200);
    };

    emitDebounced();
    map.on("moveend", emitDebounced);
    map.on("zoomend", emitDebounced);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      map.off("moveend", emitDebounced);
      map.off("zoomend", emitDebounced);
    };
  }, [map, onBoundsChange]);

  return null;
}

function SelectionSync({
  selectedPlace,
  markerRefs,
}: {
  selectedPlace: PlaceForMap | null;
  markerRefs: React.MutableRefObject<Record<string, LeafletMarker | null>>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedPlace || typeof selectedPlace.lat !== "number" || typeof selectedPlace.lng !== "number") {
      return;
    }

    const target: [number, number] = [selectedPlace.lat, selectedPlace.lng];
    map.flyTo(target, Math.max(map.getZoom(), 14), { duration: 0.45 });

    const marker = markerRefs.current[selectedPlace.id];
    if (marker) marker.openPopup();
  }, [map, markerRefs, selectedPlace]);

  return null;
}

export function PlacesMap({
  places,
  selectedPlaceId,
  hoveredPlaceId,
  onSelect,
  onHover,
  onBoundsChange,
  heightClassName,
}: PlacesMapProps) {
  const mappable = useMemo(
    () => places.filter((p) => typeof p.lat === "number" && typeof p.lng === "number"),
    [places]
  );
  const points = useMemo(() => mappable.map((p) => ({ lat: p.lat as number, lng: p.lng as number })), [mappable]);
  const markerRefs = useRef<Record<string, LeafletMarker | null>>({});

  const selectedPlace = useMemo(
    () => mappable.find((p) => p.id === selectedPlaceId) ?? null,
    [mappable, selectedPlaceId]
  );

  // Madrid center fallback
  const center: [number, number] = useMemo(() => {
    if (mappable.length > 0) return [mappable[0].lat as number, mappable[0].lng as number];
    return [40.4168, -3.7038];
  }, [mappable]);

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <div className={`${heightClassName ?? "h-[70vh] min-h-[520px]"} w-full`}>
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          <FitBounds points={points} />
          <BoundsWatcher onBoundsChange={onBoundsChange} />
          <SelectionSync selectedPlace={selectedPlace} markerRefs={markerRefs} />

          {mappable.map((p) => (
            <Marker
              key={p.id}
              position={[p.lat as number, p.lng as number]}
              ref={(marker) => {
                markerRefs.current[p.id] = marker;
              }}
              icon={categoryDot(
                p.category,
                selectedPlaceId === p.id ? "selected" : hoveredPlaceId === p.id ? "hover" : "default"
              )}
              eventHandlers={{
                click: () => onSelect(p.id),
                mouseover: () => onHover(p.id),
                mouseout: () => onHover(null),
              }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <div className="font-serif text-base leading-tight">{p.name}</div>
                  <div className="mt-1 text-xs text-black/60">
                    {p.neighborhood} · ★ {p.rating.toFixed(1)}
                  </div>
                  <Link
                    href={`/places/${p.id}`}
                    className="mt-3 inline-block text-xs text-[#D46A4C] underline underline-offset-2"
                  >
                    View →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="p-3 text-xs text-[#9A9A9A]">
        Tip: pinch/scroll to zoom. Click pins or list cards to sync both panes.
      </div>
    </div>
  );
}
