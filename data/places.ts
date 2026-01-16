// data/places.ts

export type GoodForFlag =
  | "solo-coffee"
  | "laptop-work"
  | "first-date"
  | "groups"
  | "quick-stop"
  | "long-conversations";

export type PlaceCategory = "coffee" | "restaurant" | "bar";

export type PlaceTag =
  | "laptop-friendly"
  | "first-date"
  | "cheap"
  | "fancy"
  | "quiet"
  | "groups"
  | "solo";

export type Place = {
  id: string;
  name: string;
  neighborhood: string;
  category: PlaceCategory;
  tags: PlaceTag[];
  rating: number; // your rating, 1–5
  shortBlurb: string;
  longReview?: string; // optional longer text for detail page
  priceLevel?: 1 | 2 | 3 | 4; // optional € level
  goodFor?: GoodForFlag[]; // optional flags for detail page
  googleMapsUrl?: string;
};

export const PLACES: Place[] = [
  {
    id: "hanso",
    name: "HanSo Café",
    neighborhood: "Malasaña",
    category: "coffee",
    tags: ["laptop-friendly", "solo"],
    rating: 4.5,
    shortBlurb: "Good flat white, busy on weekends. Nice for a solo work session.",
    longReview:
      "One of those spots where you can sit by the window with a laptop or a book and lose track of time. It does get loud on weekend afternoons, so I like it more on weekday mornings. Coffee is consistently good; pastries are fine but not the main reason to come.",
    priceLevel: 2,
    goodFor: ["solo-coffee", "laptop-work", "quick-stop"],
    googleMapsUrl: "https://maps.google.com/...",
  },
  {
    id: "acid",
    name: "Acid Café",
    neighborhood: "Centro",
    category: "coffee",
    tags: ["quiet", "solo"],
    rating: 4.2,
    shortBlurb: "Calm vibe, solid pour-over. Great spot after a walk.",
    longReview:
      "Feels like a small escape right in the center. It's usually calmer than most cafés nearby, which makes it good for reading or just decompressing after walking around. Coffee leans more towards specialty vibes. Not a place for big groups.",
    priceLevel: 2,
    goodFor: ["solo-coffee", "quick-stop", "long-conversations"],
    googleMapsUrl: "https://maps.google.com/...",
  },
  {
    id: "sala-equis",
    name: "Sala Equis",
    neighborhood: "Centro",
    category: "bar",
    tags: ["groups", "first-date"],
    rating: 4.0,
    shortBlurb: "Fun space, good for a casual drink and people-watching.",
    longReview:
      "Big, lively space that feels more like a hangout than a classic bar. It's easy to spend a few hours here without noticing. Great for a first date if you want something informal and not too quiet. Not where you go for serious cocktails, more for the overall vibe.",
    priceLevel: 2,
    goodFor: ["groups", "first-date", "long-conversations"],
    googleMapsUrl: "https://maps.google.com/...",
  },
  {
    id: "terraza-xx",
    name: "Random Terraza",
    neighborhood: "La Latina",
    category: "bar",
    tags: ["groups", "cheap"],
    rating: 3.6,
    shortBlurb:
      "Nice for a big group, drinks are fine but it's more about the vibe.",
    longReview:
      "One of those terraces you end up in with friends because there's space. It's not mind-blowing, but it works if you just want to sit outside and talk. Drinks are standard and prices are reasonable. I wouldn't cross the city for it, but it's good if you're already in the area.",
    priceLevel: 1,
    goodFor: ["groups", "quick-stop"],
    googleMapsUrl: "https://maps.google.com/...",
  },
  {
    id: "bodega-yy",
    name: "Small Bodega",
    neighborhood: "Lavapiés",
    category: "restaurant",
    tags: ["cheap", "quiet"],
    rating: 4.3,
    shortBlurb:
      "Simple, honest food. Good if you're nearby and want something cozy.",
    longReview:
      "Feels like eating at someone's home in the best way. The menu is small but done with care. It's not a place for a rushed meal; it's more for a slow lunch or dinner where you actually talk. Great to bring one or two people, less ideal for big groups.",
    priceLevel: 2,
    goodFor: ["long-conversations", "first-date", "solo-coffee"],
    googleMapsUrl: "https://maps.google.com/...",
  },
];
