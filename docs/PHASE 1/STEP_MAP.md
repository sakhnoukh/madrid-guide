# STEP_MAP – Add “Map View” toggle on /places (Leaflet + OpenStreetMap, no API key)

Goal:
- On `/places`, add a toggle: **List** / **Map**
- Map view shows all **published** places as markers
- Clicking a marker shows a popup with name + neighborhood + link to detail page
- No Google/Mapbox API keys. Use **Leaflet + OpenStreetMap tiles**.

Notes:
- This uses free OSM tiles (fine for low traffic/personal projects).
- Map must be a **client component** in Next.js (Leaflet uses `window`).

---

## 1) Install dependencies

```bash
npm i leaflet react-leaflet
2) Add Leaflet CSS (required)
Option A (recommended): import in app/layout.tsx
Open app/layout.tsx and add:

import "leaflet/dist/leaflet.css";
near the top (with your other global imports).

If your project has a app/globals.css setup and you prefer CSS import there, you can, but importing in layout is simplest.

3) Fix default marker icons (common gotcha in bundlers)
Leaflet’s default marker icons often break in Next builds unless you configure them.

Create: lib/leafletFix.ts

import L from "leaflet";

// Fix missing marker icons in bundlers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

export function applyLeafletIconFix() {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x.src ?? markerIcon2x,
    iconUrl: markerIcon.src ?? markerIcon,
    shadowUrl: markerShadow.src ?? markerShadow,
  });
}
4) Create the Map component (client-only)
Create: components/PlacesMap.tsx

"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { applyLeafletIconFix } from "@/lib/leafletFix";

type PlaceForMap = {
  id: string;
  name: string;
  neighborhood: string;
  lat: number | null;
  lng: number | null;
  category: "coffee" | "restaurant" | "bar";
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
                    className="inline-block text-xs text-blue-600 underline underline-offset-2"
                  >
                    View →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="p-3 text-xs text-textMuted">
        Tip: pinch/scroll to zoom. Click pins for details.
      </div>
    </div>
  );
}
5) Add a List/Map toggle to /places
Open components/PlacesClient.tsx and add:

a toggle state

render either the grid list or the map

5.1 Update props type to include lat/lng (if not already)
Ensure your PlaceDTO includes:

lat?: number | null;
lng?: number | null;
5.2 Add a view state + toggle UI
At top of component:

import { PlacesMap } from "@/components/PlacesMap";
Then inside the component:

const [view, setView] = useState<"list" | "map">("list");
Add this UI above your list/grid:

<div className="mb-4 flex items-center justify-between gap-3">
  <div className="text-sm text-textMuted">
    Showing <span className="text-textMain">{filtered.length}</span> places
  </div>

  <div className="flex items-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
    <button
      onClick={() => setView("list")}
      className={[
        "px-4 py-2 text-sm transition rounded-full",
        view === "list" ? "bg-primary text-white" : "text-textMain hover:bg-black/5",
      ].join(" ")}
      type="button"
    >
      List
    </button>
    <button
      onClick={() => setView("map")}
      className={[
        "px-4 py-2 text-sm transition rounded-full",
        view === "map" ? "bg-primary text-white" : "text-textMain hover:bg-black/5",
      ].join(" ")}
      type="button"
    >
      Map
    </button>
  </div>
</div>
5.3 Conditionally render list vs map
Where you currently render the list/grid of cards, replace with:

{view === "map" ? (
  <PlacesMap places={filtered as any} />
) : (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {filtered.map((p) => (
      <PlaceCard key={p.id} place={p} />
    ))}
  </div>
)}
Important: filtered should include lat/lng. If your PlaceCard type strips fields, just ensure the filtered array keeps them.

6) Make sure /places server query includes lat/lng
Open app/places/page.tsx and ensure Prisma returns lat/lng.
If you use select, include them:

select: {
  id: true,
  name: true,
  neighborhood: true,
  category: true,
  rating: true,
  tags: true,
  lat: true,
  lng: true,
  // plus whatever PlaceCard needs
}
If you don’t use select, Prisma returns them by default.

7) Quick tests
Go to /places

Toggle Map

Confirm:

map renders

markers appear for places that have lat/lng

click marker → popup shows → link works

If no markers show:

your places might have null lat/lng (ingest didn’t save them) → check a record in DB.

8) Known issues + fixes
“window is not defined” error
You accidentally rendered the map in a server component.

Make sure PlacesMap.tsx starts with "use client" and is only used inside a client component (PlacesClient).

Markers not showing (broken icon)
Ensure you added leafletFix.ts + applyLeafletIconFix().

Styling: map looks square / harsh
The wrapper has rounded-2xl + overflow-hidden. Keep it. Looks premium.

