-- V11: Remove qty column from meal_food and fix category type
-- qty is redundant — amount + unit already represent the quantity

-- Drop qty column
ALTER TABLE meal_food DROP COLUMN IF EXISTS qty;

-- Fix category column type if it drifted to bytea
DO $$
BEGIN
    ALTER TABLE food_catalog DROP CONSTRAINT IF EXISTS fk_food_category;
END $$;

ALTER TABLE food_catalog ALTER COLUMN category TYPE VARCHAR(50) USING category::VARCHAR(50);