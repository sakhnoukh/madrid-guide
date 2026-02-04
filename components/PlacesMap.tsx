"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { applyLeafletIconFix } from "@/lib/leafletFix";

type PlaceForMap = {
  id: string;
  name: string;
  neighborhood: string;
  lat?: number | null;
  lng?: number | null;
  category: string;
  rating: number;
};

export function PlacesMap({ places }: { places: PlaceForMap[] }) {
  useEffect(() => {
    applyLeafletIconFix();
  }, []);

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
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {mappable.map((p) => (
            <Marker key={p.id} position={[p.lat as number, p.lng as number]}>
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs opacity-75">
                    {p.neighborhood} · {p.category} · ★ {p.rating.toFixed(1)}
                  </div>
                  <Link
                    href={`/places/${p.id}`}
                    className="inline-block text-xs text-[#D46A4C] underline underline-offset-2"
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
