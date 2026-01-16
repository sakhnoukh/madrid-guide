-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "goodFor" TEXT,
    "rating" REAL NOT NULL,
    "shortBlurb" TEXT NOT NULL,
    "longReview" TEXT,
    "priceLevel" INTEGER,
    "googleMapsUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
