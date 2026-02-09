import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.place.createMany({
    data: [
      {
        id: "hanso",
        name: "HanSo Café",
        neighborhood: "Malasaña",
        category: "Café",
        tags: JSON.stringify(["laptop-friendly", "solo"]),
        goodFor: JSON.stringify(["solo-coffee", "laptop-work", "quick-stop"]),
        rating: 4.5,
        review: "Good flat white, busy on weekends. Nice for a solo work session. One of those spots where you can sit by the window with a laptop or a book and lose track of time.",
        priceLevel: 2,
        googleMapsUrl: "https://maps.google.com/...",
      },
      {
        id: "acid",
        name: "Acid Café",
        neighborhood: "Centro",
        category: "Café",
        tags: JSON.stringify(["quiet", "solo"]),
        goodFor: JSON.stringify(["solo-coffee", "quick-stop", "long-conversations"]),
        rating: 4.2,
        review: "Calm vibe, solid pour-over. Great spot after a walk. Feels like a small escape right in the center.",
        priceLevel: 2,
        googleMapsUrl: "https://maps.google.com/...",
      },
      {
        id: "sala-equis",
        name: "Sala Equis",
        neighborhood: "Centro",
        category: "Bar",
        tags: JSON.stringify(["groups", "first-date"]),
        goodFor: JSON.stringify(["groups", "first-date", "long-conversations"]),
        rating: 4.0,
        review: "Fun space, good for a casual drink and people-watching. Big, lively space that feels more like a hangout than a classic bar.",
        priceLevel: 2,
        googleMapsUrl: "https://maps.google.com/...",
      },
      {
        id: "terraza-xx",
        name: "Random Terraza",
        neighborhood: "La Latina",
        category: "Bar",
        tags: JSON.stringify(["groups", "cheap"]),
        goodFor: JSON.stringify(["groups", "quick-stop"]),
        rating: 3.6,
        review: "Nice for a big group, drinks are fine but it's more about the vibe. One of those terraces you end up in with friends because there's space.",
        priceLevel: 1,
        googleMapsUrl: "https://maps.google.com/...",
      },
      {
        id: "bodega-yy",
        name: "Small Bodega",
        neighborhood: "Lavapiés",
        category: "Restaurant",
        tags: JSON.stringify(["cheap", "quiet"]),
        goodFor: JSON.stringify(["long-conversations", "first-date", "solo-coffee"]),
        rating: 4.3,
        review: "Simple, honest food. Good if you're nearby and want something cozy. Feels like eating at someone's home in the best way.",
        priceLevel: 2,
        googleMapsUrl: "https://maps.google.com/...",
      },
    ],
  });
}

main()
  .then(async () => {
    console.log("Seed completed");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
