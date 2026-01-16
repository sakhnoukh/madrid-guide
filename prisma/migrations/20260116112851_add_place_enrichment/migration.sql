/*
  Warnings:

  - A unique constraint covering the columns `[googlePlaceId]` on the table `Place` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Place" ADD COLUMN "address" TEXT;
ALTER TABLE "Place" ADD COLUMN "googleMapsUri" TEXT;
ALTER TABLE "Place" ADD COLUMN "googlePlaceId" TEXT;
ALTER TABLE "Place" ADD COLUMN "lat" REAL;
ALTER TABLE "Place" ADD COLUMN "lng" REAL;

-- CreateIndex
CREATE UNIQUE INDEX "Place_googlePlaceId_key" ON "Place"("googlePlaceId");
