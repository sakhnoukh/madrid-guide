"use client";

import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo } from "react";
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

function dotIcon(colorClass: string) {
  return L.divIcon({
    className: "",
    html: `<div class="map-dot ${colorClass}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function categoryDot(category: string) {
  const cat = category.toLowerCase();
  if (cat === "café" || cat === "cafe" || cat === "coffee") return dotIcon("dot-coffee");
  if (cat === "bar" || cat === "club") return dotIcon("dot-bar");
  return dotIcon("dot-restaurant");
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

export function PlacesMap({ places }: { places: PlaceForMap[] }) {
  const mappable = useMemo(
    () => places.filter((p) => typeof p.lat === "number" && typeof p.lng === "number"),
    [places]
  );

  // Madrid center fallback
  const center: [number, number] = useMemo(() => {
    if (mappable.length > 0) return [mappable[0].lat as number, mappable[0].lng as number];
    return [40.4168, -3.7038];
  }, [mappable]);

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <div className="h-[70vh] min-h-[520px] w-full">
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

          <FitBounds points={mappable.map((p) => ({ lat: p.lat!, lng: p.lng! }))} />

          {mappable.map((p) => (
            <Marker
              key={p.id}
              position={[p.lat as number, p.lng as number]}
              icon={categoryDot(p.category)}
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
        Tip: pinch/scroll to zoom. Click pins for details.
      </div>
    </div>
  );
}
