"use client";

import Link from "next/link";
import { useState } from "react";

type PlaceDTO = {
  id: string;
  name: string;
  neighborhood: string;
  category: string;
  tags: string[];
  goodFor: string[];
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
  const [tags, setTags] = useState(place.tags.join(", "));
  const [goodFor, setGoodFor] = useState(place.goodFor.join(", "));
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
        <Link href="/admin" className="text-xs text-[#9A9A9A] hover:text-[#D46A4C] hover:underline underline-offset-2">
          ← Back to admin
        </Link>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Edit place</h1>
        <p className="text-sm text-[#9A9A9A]">{place.id}</p>
      </header>

      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#9A9A9A]">
            Admin secret
          </label>
          <input
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-[#D46A4C]"
            type="password"
            placeholder="Enter ADMIN_SECRET"
          />
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-[#D46A4C]" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Neighborhood</label>
              <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-[#D46A4C]" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-[#D46A4C]">
                <option value="coffee">Coffee</option>
                <option value="restaurant">Restaurant</option>
                <option value="bar">Bar</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Rating</label>
              <input type="number" min={1} max={5} step={0.1}
                value={rating} onChange={(e) => setRating(Number(e.target.value))}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-[#D46A4C]" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Price level</label>
              <input type="number" min={1} max={4} step={1}
                value={priceLevel} onChange={(e) => setPriceLevel(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-[#D46A4C]"
                placeholder="optional" />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Tags (comma-separated)</label>
              <input value={tags} onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-[#D46A4C]" />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Good for (comma-separated)</label>
              <input value={goodFor} onChange={(e) => setGoodFor(e.target.value)}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-[#D46A4C]" />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Short blurb</label>
              <textarea value={shortBlurb} onChange={(e) => setShortBlurb(e.target.value)}
                className="min-h-[90px] w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-[#D46A4C]" />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Long review</label>
              <textarea value={longReview} onChange={(e) => setLongReview(e.target.value)}
                className="min-h-[140px] w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-[#D46A4C]" />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Google Maps URL</label>
              <input value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-[#D46A4C]" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={busy}
            className="rounded-full bg-[#D46A4C] px-6 py-2 text-sm font-medium text-white hover:bg-[#D46A4C]/90 disabled:opacity-60"
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

          {status && <p className="text-sm text-[#9A9A9A]">{status}</p>}
        </div>
      </div>
    </div>
  );
}
