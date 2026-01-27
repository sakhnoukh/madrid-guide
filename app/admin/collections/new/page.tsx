// app/admin/collections/new/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCollectionPage() {
  const router = useRouter();
  const [adminSecret, setAdminSecret] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);

    const res = await fetch("/api/admin/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminSecret, title, description }),
    });

    setBusy(false);

    if (!res.ok) {
      const text = await res.text();
      setStatus(`Error (${res.status}): ${text}`);
      return;
    }

    const data = await res.json();
    router.push(`/admin/collections/${data.id}`);
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-16 sm:py-20">
      <header className="mb-6">
        <Link
          href="/admin"
          className="text-xs text-[#9A9A9A] hover:text-[#D46A4C] hover:underline underline-offset-2"
        >
          ← Back to admin
        </Link>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl">New Collection</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
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
            required
          />
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-[#D46A4C]"
                placeholder="e.g. First date spots"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] w-full rounded-xl border border-[#D8C7B8] bg-[#FDF8F3] px-3 py-2 text-sm outline-none focus:border-[#D46A4C]"
                placeholder="A short description of this collection..."
                required
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-[#D46A4C] px-6 py-2 text-sm font-medium text-white hover:bg-[#D46A4C]/90 disabled:opacity-60"
          >
            {busy ? "Creating..." : "Create collection"}
          </button>

          {status && <p className="text-sm text-red-600">{status}</p>}
        </div>
      </form>
    </div>
  );
}
