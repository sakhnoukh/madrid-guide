import Link from "next/link";

const tiles = [
  {
    title: "Laptop cafés",
    subtitle: "Quiet-ish, good coffee, stay awhile",
    href: "/places?category=coffee&tag=laptop-friendly",
  },
  {
    title: "First date",
    subtitle: "Casual, warm, easy to talk",
    href: "/places?tag=first-date",
  },
  {
    title: "Cheap + good",
    subtitle: "Low commitment, high payoff",
    href: "/places?tag=cheap-eats",
  },
  {
    title: "Late-night bars",
    subtitle: "For when the night keeps going",
    href: "/places?category=bar&tag=late-night",
  },
  {
    title: "Solo + calm",
    subtitle: "Read, think, walk, repeat",
    href: "/places?tag=solo-coffee",
  },
  {
    title: "Group spots",
    subtitle: "Easy for 4+ people",
    href: "/places?tag=groups",
  },
];

export function MoodTiles() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((t) => (
        <Link
          key={t.title}
          href={t.href}
          className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="font-serif text-xl">{t.title}</div>
          <div className="mt-1 text-sm text-[#9A9A9A]">{t.subtitle}</div>
          <div className="mt-4 text-xs text-[#D46A4C] underline-offset-2 group-hover:underline">
            Explore →
          </div>
        </Link>
      ))}
    </div>
  );
}
