ALTER TABLE "Dish"
  ALTER COLUMN "imageUrl" DROP NOT NULL,
  ALTER COLUMN "category" DROP NOT NULL;

UPDATE "Dish" SET "imageUrl" = NULL WHERE "imageUrl" = '';
