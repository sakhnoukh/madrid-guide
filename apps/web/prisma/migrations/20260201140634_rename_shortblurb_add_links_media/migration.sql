-- Rename shortBlurb to review (preserving data)
ALTER TABLE "Place" RENAME COLUMN "shortBlurb" TO "review";

-- Drop longReview column
ALTER TABLE "Place" DROP COLUMN "longReview";

-- Add new columns for links and media
ALTER TABLE "Place" ADD COLUMN "links" TEXT;
ALTER TABLE "Place" ADD COLUMN "media" TEXT;
