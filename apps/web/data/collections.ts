// data/collections.ts

export type Collection = {
  id: string;
  title: string;
  description: string;
  // Later: maybe a list of place IDs
};

export const COLLECTIONS: Collection[] = [
  {
    id: "first-dates",
    title: "First date spots",
    description:
      "Places where you can actually hear each other, with enough atmosphere to break the ice.",
  },
  {
    id: "laptop-cafes",
    title: "Laptop cafés",
    description:
      "Spots where you can open a laptop without feeling weird about it.",
  },
  {
    id: "near-retiro",
    title: "Near Retiro",
    description:
      "Good places to land after a slow walk around the park.",
  },
  {
    id: "late-night",
    title: "Late-night bars",
    description:
      "For when Madrid decides to keep you out later than planned.",
  },
];
