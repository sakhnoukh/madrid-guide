# STEP_9 – Admin: List + Edit + Delete, Photos, and Better Telegram Neighborhood Parsing

Goal of this step:
1) Add a real admin workflow:
   - `/admin` → list places
   - `/admin/edit/[id]` → edit + delete
2) Add photo support from Google Places (store a primary photo and render it)
3) Improve Telegram parsing to support multi-word neighborhoods:
   - `neighborhood:"La Latina"` or `nb:"La Latina"`

---

## 1) Prisma: add photo fields

### 1.1 Update `prisma/schema.prisma`

Add these fields to `Place`:

```prisma
model Place {
  id            String   @id
  name          String
  neighborhood  String
  category      PlaceCategory

  tags          Json
  goodFor       Json?
  rating        Float
  shortBlurb    String
  longReview    String?
  priceLevel    Int?
  googleMapsUrl String?

  googlePlaceId String?  @unique
  address       String?
  lat           Float?
  lng           Float?
  googleMapsUri String?

  // NEW: photos (store one “primary” photo)
  primaryPhotoName String? // e.g. "places/ChIJ.../photos/..."
  primaryPhotoUrl  String? // optional cached URL or proxy path (we’ll use proxy route)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
1.2 Migrate
npx prisma migrate dev --name add_place_photos
2) Google Places: fetch photo name during ingest
2.1 Update lib/googlePlaces.ts to return primaryPhotoName
In getPlaceDetails, expand the field mask to include photos:

fieldMask:
  "id,displayName,formattedAddress,location,googleMapsUri,priceLevel,photos",
Then in the return object, extract the first photo name:

const photoName = data?.photos?.[0]?.name;

return {
  placeId: data?.id,
  name: data?.displayName?.text || "Unknown place",
  address: data?.formattedAddress,
  lat: data?.location?.latitude,
  lng: data?.location?.longitude,
  googleMapsUri: data?.googleMapsUri,
  priceLevel: typeof data?.priceLevel === "number" ? data.priceLevel : undefined,
  primaryPhotoName: typeof photoName === "string" ? photoName : undefined,
};
Also update the PlaceDetails type to include it:

type PlaceDetails = {
  placeId: string;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  googleMapsUri?: string;
  priceLevel?: number;
  primaryPhotoName?: string;
};
2.2 Store primaryPhotoName in /api/ingest
In app/api/ingest/route.ts, when creating/updating:

On create:

primaryPhotoName: details.primaryPhotoName,
primaryPhotoUrl: details.primaryPhotoName ? `/api/photos/${encodeURIComponent(details.primaryPhotoName)}` : undefined,
On update:

primaryPhotoName: details.primaryPhotoName ?? existing.primaryPhotoName,
primaryPhotoUrl:
  details.primaryPhotoName
    ? `/api/photos/${encodeURIComponent(details.primaryPhotoName)}`
    : existing.primaryPhotoUrl,
3) Add a photo proxy route (hide your API key)
We’ll serve photos via your backend so the client never needs the Google API key.

Create: app/api/photos/[...photoName]/route.ts

// app/api/photos/[...photoName]/route.ts
export async function GET(
  _req: Request,
  { params }: { params: { photoName: string[] } }
) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return new Response("Missing GOOGLE_MAPS_API_KEY", { status: 500 });

  const photoName = params.photoName.join("/"); // reconstruct "places/.../photos/..."
  const url =
    `https://places.googleapis.com/v1/${encodeURIComponent(photoName)}/media` +
    `?maxWidthPx=1600`;

  // Fetch the binary image and stream it back
  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": apiKey,
    },
    redirect: "follow",
  });

  if (!res.ok) {
    const text = await res.text();
    return new Response(`Photo fetch failed: ${text}`, { status: res.status });
  }

  const contentType = res.headers.get("content-type") || "image/jpeg";
  return new Response(res.body, {
    headers: {
      "content-type": contentType,
      // Cache a bit (tweak later)
      "cache-control": "public, max-age=86400",
    },
  });
}
Now you can render the place photo using:

place.primaryPhotoUrl (which is /api/photos/...)

4) Render the photo on the place detail page
In app/places/[id]/page.tsx, after the header, add:

const photoSrc = place.primaryPhotoUrl || null;

{photoSrc && (
  <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
    {/* Use plain <img> first; later you can switch to next/image */}
    <img
      src={photoSrc}
      alt={place.name}
      className="h-[260px] w-full object-cover sm:h-[340px]"
      loading="lazy"
    />
  </div>
)}
5) Admin: add edit + delete endpoints
5.1 Add PATCH + DELETE to app/api/places/[id]/route.ts
Open app/api/places/[id]/route.ts and add:

import { prisma } from "@/lib/prisma";
import { isValidAdminSecret } from "@/lib/adminAuth";

type UpdatePlaceBody = {
  adminSecret?: string;
  name?: string;
  neighborhood?: string;
  category?: "coffee" | "restaurant" | "bar";
  tags?: string[];
  goodFor?: string[];
  rating?: number;
  shortBlurb?: string;
  longReview?: string;
  priceLevel?: number | null;
  googleMapsUrl?: string | null;
};

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const place = await prisma.place.findUnique({ where: { id: params.id } });
  if (!place) return new Response("Not found", { status: 404 });
  return Response.json(place);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = (await req.json()) as UpdatePlaceBody;

  if (!isValidAdminSecret(body.adminSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const data: any = {};

  if (body.name !== undefined) data.name = body.name.trim();
  if (body.neighborhood !== undefined) data.neighborhood = body.neighborhood.trim();
  if (body.category !== undefined) data.category = body.category;
  if (body.tags !== undefined) data.tags = body.tags.map((t) => t.trim()).filter(Boolean);
  if (body.goodFor !== undefined) data.goodFor = body.goodFor.map((g) => g.trim()).filter(Boolean);
  if (body.rating !== undefined) data.rating = body.rating;
  if (body.shortBlurb !== undefined) data.shortBlurb = body.shortBlurb.trim();
  if (body.longReview !== undefined) data.longReview = body.longReview.trim();
  if (body.priceLevel !== undefined) data.priceLevel = body.priceLevel;
  if (body.googleMapsUrl !== undefined) data.googleMapsUrl = body.googleMapsUrl;

  const updated = await prisma.place.update({
    where: { id: params.id },
    data,
  });

  return Response.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = (await req.json().catch(() => ({}))) as { adminSecret?: string };

  if (!isValidAdminSecret(body.adminSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  await prisma.place.delete({ where: { id: params.id } });
  return new Response(null, { status: 204 });
}
6) Admin pages: list + edit
6.1 Create /admin list page
Create app/admin/page.tsx (server component):

import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminHome() {
  const places = await prisma.place.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-16 sm:py-20">
      <header className="mb-8">
        <h1 className="mb-2 font-serif text-3xl sm:text-4xl">Admin</h1>
        <p className="text-sm text-textMuted">Edit and manage your places.</p>
        <div className="mt-4">
          <Link
            href="/admin/add"
            className="inline-flex rounded-full bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90"
          >
            Add new place
          </Link>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="divide-y divide-black/5">
          {places.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-serif text-lg">{p.name}</div>
                <div className="text-xs text-textMuted">
                  {p.neighborhood} · {p.category} · ★ {p.rating.toFixed(1)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/places/${p.id}`}
                  className="text-xs text-secondary underline-offset-2 hover:underline"
                >
                  View
                </Link>
                <Link
                  href={`/admin/edit/${p.id}`}
                  className="text-xs text-primary underline-offset-2 hover:underline"
                >
                  Edit →
                </Link>
              </div>
            </div>
          ))}
          {places.length === 0 && (
            <div className="p-4 text-sm text-textMuted">No places yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
6.2 Create /admin/edit/[id] edit page
Create app/admin/edit/[id]/page.tsx:

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminEditClient } from "@/components/AdminEditClient";

export default async function AdminEditPage({ params }: { params: { id: string } }) {
  const place = await prisma.place.findUnique({ where: { id: params.id } });
  if (!place) return notFound();

  return <AdminEditClient place={place as any} />;
}
6.3 Create the client editor component
Create components/AdminEditClient.tsx:

"use client";

import Link from "next/link";
import { useState } from "react";

type PlaceDTO = {
  id: string;
  name: string;
  neighborhood: string;
  category: "coffee" | "restaurant" | "bar";
  tags: any; // Json
  goodFor: any; // Json?
  rating: number;
  shortBlurb: string;
  longReview?: string | null;
  priceLevel?: number | null;
  googleMapsUrl?: string | null;
};

export function AdminEditClient({ place }: { place: PlaceDTO }) {
  const [adminSecret, setAdminSecret] = useState("");

  const [name, setName] = useState(place.name);
  const [neighborhood, setNeighborhood] = useState(place.neighborhood);
  const [category, setCategory] = useState(place.category);
  const [rating, setRating] = useState(place.rating);
  const [priceLevel, setPriceLevel] = useState<number | "">(place.priceLevel ?? "");
  const [tags, setTags] = useState(((place.tags ?? []) as string[]).join(", "));
  const [goodFor, setGoodFor] = useState(((place.goodFor ?? []) as string[]).join(", "));
  const [shortBlurb, setShortBlurb] = useState(place.shortBlurb);
  const [longReview, setLongReview] = useState(place.longReview ?? "");
  const [googleMapsUrl, setGoogleMapsUrl] = useState(place.googleMapsUrl ?? "");

  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setStatus(null);

    const payload = {
      adminSecret,
      name,
      neighborhood,
      category,
      rating: Number(rating),
      priceLevel: priceLevel === "" ? null : Number(priceLevel),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      goodFor: goodFor.split(",").map((g) => g.trim()).filter(Boolean),
      shortBlurb,
      longReview,
      googleMapsUrl: googleMapsUrl || null,
    };

    const res = await fetch(`/api/places/${place.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    setBusy(false);

    if (!res.ok) {
      setStatus(`Error (${res.status}): ${text}`);
      return;
    }
    setStatus("Saved ✅");
  }

  async function remove() {
    if (!confirm("Delete this place? This cannot be undone.")) return;

    setBusy(true);
    setStatus(null);

    const res = await fetch(`/api/places/${place.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminSecret }),
    });

    setBusy(false);

    if (res.status !== 204) {
      const text = await res.text();
      setStatus(`Delete failed (${res.status}): ${text}`);
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-16 sm:py-20">
      <header className="mb-6">
        <Link href="/admin" className="text-xs text-textMuted hover:text-primary hover:underline underline-offset-2">
          ← Back to admin
        </Link>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Edit place</h1>
        <p className="text-sm text-textMuted">{place.id}</p>
      </header>

      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-textMuted">
            Admin secret
          </label>
          <input
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary"
            type="password"
            placeholder="Enter ADMIN_SECRET"
          />
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Neighborhood</label>
              <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as any)}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="coffee">Coffee</option>
                <option value="restaurant">Restaurant</option>
                <option value="bar">Bar</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Rating</label>
              <input type="number" min={1} max={5} step={0.1}
                value={rating} onChange={(e) => setRating(Number(e.target.value))}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Price level</label>
              <input type="number" min={1} max={4} step={1}
                value={priceLevel} onChange={(e) => setPriceLevel(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="optional" />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Tags (comma-separated)</label>
              <input value={tags} onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Good for (comma-separated)</label>
              <input value={goodFor} onChange={(e) => setGoodFor(e.target.value)}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Short blurb</label>
              <textarea value={shortBlurb} onChange={(e) => setShortBlurb(e.target.value)}
                className="min-h-[90px] w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Long review</label>
              <textarea value={longReview} onChange={(e) => setLongReview(e.target.value)}
                className="min-h-[140px] w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Google Maps URL</label>
              <input value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={busy}
            className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Saving..." : "Save changes"}
          </button>

          <button
            onClick={remove}
            disabled={busy}
            className="rounded-full border border-red-300 bg-white px-6 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            Delete
          </button>

          {status && <p className="text-sm text-textMuted">{status}</p>}
        </div>
      </div>
    </div>
  );
}
7) Improve Telegram neighborhood parsing (multi-word)
Update your bot parser to support:

neighborhood:"La Latina"

nb:"La Latina"

7.1 Add this function in bot/index.ts
function parseNeighborhoodQuoted(text: string) {
  const m =
    text.match(/neighborhood:"([^"]+)"/i) ||
    text.match(/nb:"([^"]+)"/i);
  return m?.[1]?.trim() || undefined;
}
7.2 In parseMessage, before tokenizing, do:
const neighborhoodQuoted = parseNeighborhoodQuoted(text);
const stripped = text
  .replace(/neighborhood:"[^"]*"/gi, " ")
  .replace(/nb:"[^"]*"/gi, " ");
Then tokenize stripped instead of text. In your returned object:

Prefer neighborhoodQuoted if present, else fallback to single-token neighborhood logic.

return {
  mapsUrl,
  rating,
  category,
  neighborhood: neighborhoodQuoted || neighborhoodSingleToken,
  tags,
  shortBlurb,
};
Now you can send:
4.6 bar #groups neighborhood:"La Latina" <link> "Perfect for group drinks"

8) Final checklist for STEP_9
 npx prisma migrate dev runs successfully

 /places/[id] shows an image if Places returns photos

 /admin lists places with Edit links

 /admin/edit/[id] can save changes via PATCH

 Delete works and returns to /admin

 Telegram supports neighborhood:"..." and passes it through to ingest

