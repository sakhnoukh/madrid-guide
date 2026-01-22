// scripts/migrate-categories.ts
// Run with: npx tsx scripts/migrate-categories.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categoryMap: Record<string, string> = {
  coffee: "Café",
  Coffee: "Café",
  cafe: "Café",
  Cafe: "Café",
  bar: "Bar",
  Bar: "Bar",
  restaurant: "Restaurant",
  Restaurant: "Restaurant",
  club: "Club",
  Club: "Club",
  brunch: "Brunch",
  Brunch: "Brunch",
};

async function main() {
  const places = await prisma.place.findMany();
  
  let updated = 0;
  for (const place of places) {
    const newCategory = categoryMap[place.category];
    if (newCategory && newCategory !== place.category) {
      await prisma.place.update({
        where: { id: place.id },
        data: { category: newCategory },
      });
      console.log(`Updated "${place.name}": ${place.category} → ${newCategory}`);
      updated++;
    }
  }
  
  console.log(`\nDone! Updated ${updated} places.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
