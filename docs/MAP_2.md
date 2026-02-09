# MAP_REDESIGN.md — Make the /places map match Sami’s Guide aesthetic

Goal:
Redesign the Leaflet map so it feels consistent with the site:
- calmer, minimal basemap (less “loud” colors)
- replace default blue pins with small category dots (coffee/restaurant/bar)
- popups styled like site cards (rounded, soft shadow, serif title)
- optional: auto-fit bounds to markers

Scope:
- Files touched: `components/PlacesMap.tsx`, `app/globals.css`
- No API keys required.

---

## 1) Swap to a calmer tile style (basemap)

In `components/PlacesMap.tsx`, replace the current TileLayer URL:

**Before**
```tsx
<TileLayer
  attribution='&copy; OpenStreetMap'
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>
After (light/minimal)

<TileLayer
  attribution='&copy; OpenStreetMap contributors'
  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
/>
Note:

This is a big style improvement immediately.

If we ever hit provider limits, we can swap tile source later.

2) Replace pin markers with small “category dot” markers
We want dots like:

coffee → warm terracotta

restaurant → warm near-black

bar → warm brown

2.1 Add Leaflet import for DivIcon
At top of components/PlacesMap.tsx, add:

import L from "leaflet";
2.2 Add helper functions (inside file, above component)
function dotIcon(colorClass: string) {
  return L.divIcon({
    className: "",
    html: `<div class="map-dot ${colorClass}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function categoryDot(category: string) {
  if (category === "coffee") return dotIcon("dot-coffee");
  if (category === "bar") return dotIcon("dot-bar");
  return dotIcon("dot-restaurant");
}
2.3 Use the icon on markers
In the map markers loop, update Marker:

Before

<Marker key={p.id} position={[p.lat as number, p.lng as number]}>
After

<Marker
  key={p.id}
  position={[p.lat as number, p.lng as number]}
  icon={categoryDot(p.category)}
>
3) Style dots + popup to match the site
In app/globals.css, append:

/* === Map Dot Markers === */
.map-dot {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(255,255,255,0.9);
  box-shadow: 0 10px 22px rgba(0,0,0,0.18);
}

.dot-coffee { background: #C97B63; }      /* warm terracotta */
.dot-restaurant { background: #2B2623; }  /* warm near-black */
.dot-bar { background: #6B5B4B; }         /* warm brown */

/* === Leaflet popup styling === */
.leaflet-popup-content-wrapper {
  border-radius: 16px !important;
  box-shadow: 0 14px 34px rgba(0,0,0,0.18) !important;
}

.leaflet-popup-content {
  margin: 12px 14px !important;
}

.leaflet-container a {
  color: #C97B63; /* match accent */
}
(We can later align these colors to the exact primary/brand palette.)

4) Make popup content look like site cards
In components/PlacesMap.tsx, update the Popup content to:

<Popup>
  <div className="min-w-[180px]">
    <div className="font-serif text-base leading-tight">{p.name}</div>
    <div className="mt-1 text-xs text-black/60">
      {p.neighborhood} · ★ {p.rating.toFixed(1)}
    </div>
    <Link
      href={`/places/${p.id}`}
      className="mt-3 inline-block text-xs text-primary underline underline-offset-2"
    >
      View →
    </Link>
  </div>
</Popup>
5) Optional (recommended): auto-fit bounds to all markers
5.1 Add useMap helper component inside components/PlacesMap.tsx
Add imports:

import { useEffect } from "react";
import { useMap } from "react-leaflet";
Add helper component:

function FitBounds({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, points]);

  return null;
}
5.2 Render FitBounds inside MapContainer
Inside MapContainer, add:

<FitBounds points={mappable.map(p => ({ lat: p.lat!, lng: p.lng! }))} />
This makes the initial view always “frame” your places nicely.

Done criteria
Map uses a calmer light basemap

Markers are small category dots (not default pins)

Popup looks like a site card (rounded, soft shadow, serif)

(Optional) map auto-zooms to show all pins

