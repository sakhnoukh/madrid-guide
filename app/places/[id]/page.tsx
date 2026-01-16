// app/places/[id]/page.tsx

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const GOOD_FOR_LABELS: Record<string, string> = {
  "solo-coffee": "Solo coffee",
  "laptop-work": "Working with laptop",
  "first-date": "First dates",
  groups: "Groups",
  "quick-stop": "Quick stop",
  "long-conversations": "Long conversations",
};

type PlaceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PlaceDetailPage({ params }: PlaceDetailPageProps) {
  const { id } = await params;
  const rawPlace = await prisma.place.findUnique({
    where: { id },
  });

  if (!rawPlace) {
    return notFound();
  }

  // Parse JSON strings
  const tags = JSON.parse(rawPlace.tags) as string[];
  const goodFor = rawPlace.goodFor ? (JSON.parse(rawPlace.goodFor) as string[]) : [];

  const priceText =
    rawPlace.priceLevel !== null && rawPlace.priceLevel !== undefined
      ? "€".repeat(rawPlace.priceLevel)
      : undefined;

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-16 sm:py-20">
      {/* Back link */}
      <div className="mb-4 text-xs text-[#9A9A9A]">
        <Link
          href="/places"
          className="inline-flex items-center gap-1 text-[#9A9A9A] underline-offset-2 hover:text-[#D46A4C] hover:underline"
        >
          <span>←</span>
          <span>Back to places</span>
        </Link>
      </div>

      {/* Header */}
      <header className="mb-6">
        <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[#9A9A9A]">
          {rawPlace.neighborhood} ·{" "}
          {rawPlace.category === "coffee" && "Coffee"}
          {rawPlace.category === "restaurant" && "Restaurant"}
          {rawPlace.category === "bar" && "Bar"}
          {priceText && ` · ${priceText}`}
        </p>
        <h1 className="mb-3 font-serif text-3xl sm:text-4xl">
          {rawPlace.name}
        </h1>
      </header>

      {/* Photo */}
      {rawPlace.primaryPhotoUrl && (
        <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={rawPlace.primaryPhotoUrl}
            alt={rawPlace.name}
            className="h-[260px] w-full object-cover sm:h-[340px]"
            loading="lazy"
          />
        </div>
      )}

      {/* Main two-column layout */}
      <div className="grid gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        {/* LEFT: review text */}
        <section className="space-y-4 text-sm sm:text-base text-[#4B4B4B]">
          <p className="font-medium">{rawPlace.shortBlurb}</p>
          <p className="text-[#4B4B4B]">
            {rawPlace.longReview ??
              "Longer review coming soon. For now: it's on this site, which already means I'd happily bring a friend here."}
          </p>
        </section>

        {/* RIGHT: info card */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            {/* Rating */}
            <div className="mb-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-[#9A9A9A]">
                <span className="text-[15px]">★</span>
                <span className="font-medium">{rawPlace.rating.toFixed(1)}</span>
              </div>
              {priceText && (
                <span className="text-xs text-[#9A9A9A]">
                  Price: <span className="font-medium">{priceText}</span>
                </span>
              )}
            </div>

            {/* Tags */}
            <div className="mb-4 flex flex-wrap gap-1">
              {tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#F0E1D7] px-3 py-1 text-[10px] uppercase tracking-wide text-[#7A4A35]"
                >
                  {tag.replace("-", " ")}
                </span>
              ))}
            </div>

            {/* Address */}
            {rawPlace.address && (
              <div className="mb-4 text-xs text-[#4B4B4B]">
                <span className="text-[#9A9A9A]">📍</span> {rawPlace.address}
              </div>
            )}

            {/* Good for */}
            {goodFor && goodFor.length > 0 && (
              <div className="mb-4">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9A9A9A]">
                  Good for
                </h2>
                <ul className="space-y-1 text-xs text-[#4B4B4B]">
                  {goodFor.map((flag: string) => (
                    <li key={flag} className="flex items-center gap-2">
                      <span className="text-[13px]">✓</span>
                      <span>{GOOD_FOR_LABELS[flag]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Map button */}
            {(rawPlace.googleMapsUri || rawPlace.googleMapsUrl) && (
              <div className="mt-4">
                <a
                  href={rawPlace.googleMapsUri || rawPlace.googleMapsUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#D46A4C] px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#D46A4C]/90"
                >
                  Open in Google Maps →
                </a>
              </div>
            )}
          </div>

          {/* Future slot: hours / notes */}
          <div className="rounded-2xl border border-[#D8C7B8]/60 bg-[#FDF8F3] p-4 text-xs text-[#9A9A9A]">
            <p>
              Later this box can show opening hours, a small note like
              &quot;better in the morning&quot; or &quot;avoid Sunday
              evenings&quot;, and maybe a photo.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
