# STEP_6 – Admin “Add Place” Page + POST API (+ basic auth via shared secret)

Goal of this step:
- Create a simple **admin page** at `/admin/add` to add places
- Implement `POST /api/places` to insert into DB
- Protect the endpoint (and admin page) with a **shared secret** in `.env`

This is the foundation for Step 7 (Telegram bot / share-to-add ingestion).

---

## 0) Add an admin secret to `.env`

Open `.env` and add:

```env
ADMIN_SECRET="change-this-to-a-long-random-string"
Also keep your DB line:

env
Copy code
DATABASE_URL="file:./dev.db"
1) Create a tiny auth helper
Create lib/adminAuth.ts:

ts
Copy code
export function isValidAdminSecret(secret: string | null | undefined) {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return false;
  return secret === expected;
}
We’ll use this in:

the admin page (client-side gate)

the POST API route (real protection)

2) Add POST /api/places endpoint
Open app/api/places/route.ts.

You already have GET. Add a POST below it.

ts
Copy code
import { prisma } from "@/lib/prisma";
import { isValidAdminSecret } from "@/lib/adminAuth";

type CreatePlaceBody = {
  adminSecret?: string;

  id: string;
  name: string;
  neighborhood: string;
  category: "coffee" | "restaurant" | "bar";

  tags?: string[];
  goodFor?: string[];

  rating: number;
  shortBlurb: string;

  longReview?: string;
  priceLevel?: number;
  googleMapsUrl?: string;
};

export async function GET() {
  const places = await prisma.place.findMany({
    orderBy: { createdAt: "desc" },
  });
  return Response.json(places);
}

export async function POST(req: Request) {
  let body: CreatePlaceBody;

  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Auth
  if (!isValidAdminSecret(body.adminSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Basic validation
  const required = ["id", "name", "neighborhood", "category", "rating", "shortBlurb"] as const;
  for (const key of required) {
    if ((body as any)[key] === undefined || (body as any)[key] === "") {
      return new Response(`Missing field: ${key}`, { status: 400 });
    }
  }

  if (!["coffee", "restaurant", "bar"].includes(body.category)) {
    return new Response("Invalid category", { status: 400 });
  }

  if (typeof body.rating !== "number" || body.rating < 1 || body.rating > 5) {
    return new Response("Rating must be a number between 1 and 5", { status: 400 });
  }

  if (body.priceLevel !== undefined) {
    if (
      typeof body.priceLevel !== "number" ||
      body.priceLevel < 1 ||
      body.priceLevel > 4
    ) {
      return new Response("priceLevel must be 1..4", { status: 400 });
    }
  }

  // Normalize
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => t.trim()).filter(Boolean)
    : [];

  const goodFor = Array.isArray(body.goodFor)
    ? body.goodFor.map((g) => g.trim()).filter(Boolean)
    : [];

  try {
    const created = await prisma.place.create({
      data: {
        id: body.id.trim(),
        name: body.name.trim(),
        neighborhood: body.neighborhood.trim(),
        category: body.category,
        tags,
        goodFor: goodFor.length ? goodFor : undefined,
        rating: body.rating,
        shortBlurb: body.shortBlurb.trim(),
        longReview: body.longReview?.trim() || undefined,
        priceLevel: body.priceLevel ?? undefined,
        googleMapsUrl: body.googleMapsUrl?.trim() || undefined,
      },
    });

    return Response.json(created, { status: 201 });
  } catch (e: any) {
    // Common failure: duplicate id
    return new Response(e?.message ?? "Failed to create place", { status: 500 });
  }
}
✅ This gives you a real creation endpoint, protected by ADMIN_SECRET.

3) Create the admin page /admin/add
Create app/admin/add/page.tsx:

tsx
Copy code
"use client";

import { useState } from "react";

type Category = "coffee" | "restaurant" | "bar";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminAddPlacePage() {
  const [adminSecret, setAdminSecret] = useState("");

  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [category, setCategory] = useState<Category>("coffee");
  const [rating, setRating] = useState(4.0);
  const [priceLevel, setPriceLevel] = useState<number | "">("");
  const [tags, setTags] = useState(""); // comma-separated
  const [goodFor, setGoodFor] = useState(""); // comma-separated
  const [shortBlurb, setShortBlurb] = useState("");
  const [longReview, setLongReview] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");

  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function autoIdFromName() {
    const s = slugify(name);
    setId(s);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setIsSubmitting(true);

    const payload = {
      adminSecret,
      id,
      name,
      neighborhood,
      category,
      rating: Number(rating),
      priceLevel: priceLevel === "" ? undefined : Number(priceLevel),
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      goodFor: goodFor
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean),
      shortBlurb,
      longReview: longReview || undefined,
      googleMapsUrl: googleMapsUrl || undefined,
    };

    try {
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        setStatus(`Error (${res.status}): ${text}`);
      } else {
        const created = await res.json();
        setStatus(`Created: ${created.id}`);
        // Clear minimal fields
        setName("");
        setId("");
        setNeighborhood("");
        setCategory("coffee");
        setRating(4.0);
        setPriceLevel("");
        setTags("");
        setGoodFor("");
        setShortBlurb("");
        setLongReview("");
        setGoogleMapsUrl("");
      }
    } catch (err: any) {
      setStatus(`Request failed: ${err?.message ?? String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-16 sm:py-20">
      <header className="mb-8">
        <h1 className="mb-2 font-serif text-3xl sm:text-4xl">Admin – Add place</h1>
        <p className="text-sm text-textMuted">
          Adds a place into your database. This is temporary admin UX; we’ll make it nicer later.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Admin secret */}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-textMuted">
            Admin secret
          </label>
          <input
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            placeholder="Enter ADMIN_SECRET"
            className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary"
            type="password"
            required
          />
          <p className="mt-2 text-xs text-textMuted">
            This must match <code>ADMIN_SECRET</code> in your <code>.env</code>.
          </p>
        </div>

        {/* Main fields */}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => {
                  if (!id && name) autoIdFromName();
                }}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="e.g. HanSo Café"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">ID (slug)</label>
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="e.g. hanso-cafe"
                required
              />
              <button
                type="button"
                onClick={autoIdFromName}
                className="mt-2 text-xs text-primary underline-offset-2 hover:underline"
              >
                Auto-generate from name
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Neighborhood</label>
              <input
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="e.g. Malasaña"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="coffee">Coffee</option>
                <option value="restaurant">Restaurant</option>
                <option value="bar">Bar</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Rating (1–5)</label>
              <input
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                type="number"
                min={1}
                max={5}
                step={0.1}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Price level (1–4)</label>
              <input
                value={priceLevel}
                onChange={(e) => {
                  const v = e.target.value;
                  setPriceLevel(v === "" ? "" : Number(v));
                }}
                type="number"
                min={1}
                max={4}
                step={1}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="optional"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Tags (comma-separated)
              </label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="e.g. laptop-friendly, quiet, solo"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Good for (comma-separated)
              </label>
              <input
                value={goodFor}
                onChange={(e) => setGoodFor(e.target.value)}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="e.g. solo-coffee, laptop-work, first-date"
              />
              <p className="mt-1 text-xs text-textMuted">
                Use flags like: <code>solo-coffee</code>, <code>laptop-work</code>,{" "}
                <code>first-date</code>, <code>groups</code>, <code>quick-stop</code>,{" "}
                <code>long-conversations</code>
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Short blurb</label>
              <textarea
                value={shortBlurb}
                onChange={(e) => setShortBlurb(e.target.value)}
                className="min-h-[80px] w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="One punchy sentence you’d say to a friend."
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Long review (optional)</label>
              <textarea
                value={longReview}
                onChange={(e) => setLongReview(e.target.value)}
                className="min-h-[140px] w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="A short paragraph or two."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Google Maps URL (optional)</label>
              <input
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="Paste the Google Maps share link"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
          >
            {isSubmitting ? "Adding..." : "Add place"}
          </button>

          {status && (
            <p className="text-sm text-textMuted">{status}</p>
          )}
        </div>
      </form>
    </div>
  );
}
4) Optional: hide the admin page unless the secret is present
Right now, anyone can load /admin/add, but they can’t submit without the secret.

If you want a tiny extra gate:

show the form only after entering the secret (client-side)

still keep the server-side secret check (the real protection)

This is already “good enough” for a personal project.

5) Quick test plan
Start dev server:

bash
Copy code
npm run dev
Open /admin/add

Enter your .env ADMIN_SECRET

Fill out a new place with a unique id

Submit

Confirm:

The API returns 201 (you’ll see “Created: ...”)

The new place appears on /places

It opens at /places/<id>

6) Checklist for end of STEP_6
 POST /api/places works and validates input

 Endpoint rejects wrong or missing adminSecret (401)

 /admin/add lets you create a place

 New places show up on /places immediately

 Detail pages work for new entries

