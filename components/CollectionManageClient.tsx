// components/CollectionManageClient.tsx
"use client";

import { useState } from "react";

type Place = {
  id: string;
  name: string;
  neighborhood: string;
  category: string;
};

type Props = {
  collectionId: string;
  initialPlaces: Place[];
  availablePlaces: Place[];
};

export function CollectionManageClient({
  collectionId,
  initialPlaces,
  availablePlaces: initialAvailable,
}: Props) {
  const [adminSecret, setAdminSecret] = useState("");
  const [places, setPlaces] = useState<Place[]>(initialPlaces);
  const [available, setAvailable] = useState<Place[]>(initialAvailable);
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function addPlace() {
    if (!selectedPlaceId || !adminSecret) {
      setStatus("Select a place and enter admin secret");
      return;
    }

    setBusy(true);
    setStatus(null);

    const res = await fetch(`/api/admin/collections/${collectionId}/places`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminSecret, placeId: selectedPlaceId }),
    });

    setBusy(false);

    if (!res.ok) {
      const text = await res.text();
      setStatus(`Error: ${text}`);
      return;
    }

    // Move place from available to places
    const place = available.find((p) => p.id === selectedPlaceId);
    if (place) {
      setPlaces((prev) => [place, ...prev]);
      setAvailable((prev) => prev.filter((p) => p.id !== selectedPlaceId));
    }
    setSelectedPlaceId("");
    setStatus("Added ✅");
  }

  async function removePlace(placeId: string) {
    if (!adminSecret) {
      setStatus("Enter admin secret first");
      return;
    }

    setBusy(true);
    setStatus(null);

    const res = await fetch(`/api/admin/collections/${collectionId}/places`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminSecret, placeId }),
    });

    setBusy(false);

    if (!res.ok) {
      const text = await res.text();
      setStatus(`Error: ${text}`);
      return;
    }

    // Move place from places to available
    const place = places.find((p) => p.id === placeId);
    if (place) {
      setAvailable((prev) => [...prev, place].sort((a, b) => a.name.localeCompare(b.name)));
      setPlaces((prev) => prev.filter((p) => p.id !== placeId));
    }
    setStatus("Removed ✅");
  }

  return (
    <div className="space-y-6">
      {/* Admin Secret */}
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

      {/* Add Place */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <h3 className="mb-3 font-serif text-lg">Add place to collection</h3>
        <div className="flex gap-3">
          <select
            value={selectedPlaceId}
            onChange={(e) => setSelectedPlaceId(e.target.value)}
            className="flex-1 rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-[#D46A4C]"
          >
            <option value="">Select a place...</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.neighborhood})
              </option>
            ))}
          </select>
          <button
            onClick={addPlace}
            disabled={busy || !selectedPlaceId}
            className="rounded-full bg-[#D46A4C] px-5 py-2 text-sm font-medium text-white hover:bg-[#D46A4C]/90 disabled:opacity-60"
          >
            Add
          </button>
        </div>
        {available.length === 0 && (
          <p className="mt-2 text-xs text-[#9A9A9A]">All published places are already in this collection.</p>
        )}
      </div>

      {/* Status */}
      {status && (
        <p className={`text-sm ${status.includes("Error") ? "text-red-600" : "text-green-600"}`}>
          {status}
        </p>
      )}

      {/* Places in Collection */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="border-b border-black/5 px-4 py-3">
          <h3 className="font-serif text-lg">Places in collection ({places.length})</h3>
        </div>
        <div className="divide-y divide-black/5">
          {places.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-[#9A9A9A]">
                  {p.neighborhood} · {p.category}
                </div>
              </div>
              <button
                onClick={() => removePlace(p.id)}
                disabled={busy}
                className="text-xs text-red-600 hover:underline disabled:opacity-60"
              >
                Remove
              </button>
            </div>
          ))}
          {places.length === 0 && (
            <div className="p-4 text-sm text-[#9A9A9A]">No places in this collection yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
