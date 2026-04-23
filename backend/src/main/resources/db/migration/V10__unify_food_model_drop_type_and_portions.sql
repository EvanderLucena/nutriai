-- V10: Unify food model — remove BASE/PRESET type system, add unit/referenceAmount
-- Drops: type, per100_*, preset_*, food_portion table
-- Adds: unit, reference_amount, kcal, prot, carb, fat, fiber, prep to food_catalog
-- Renames: meal_food.grams → amount, adds meal_food.unit

-- 1. Food catalog: add new columns
ALTER TABLE food_catalog ADD COLUMN unit VARCHAR(20) NOT NULL DEFAULT 'GRAMAS';
ALTER TABLE food_catalog ADD COLUMN reference_amount DECIMAL(10,1) NOT NULL DEFAULT 100;
ALTER TABLE food_catalog ADD COLUMN prep VARCHAR(200);

-- 2. Migrate existing BASE food data into unified columns
-- BASE foods: kcal/prot/carb/fat come from per100_* (reference is 100g by definition)
UPDATE food_catalog
SET reference_amount = 100,
    unit = 'GRAMAS'
WHERE type = 'BASE';

-- PRESET foods: their preset_* values become the unified macro values, reference is preset_grams
UPDATE food_catalog
SET reference_amount = COALESCE(preset_grams, 100),
    unit = 'GRAMAS'
WHERE type = 'PRESET';

-- Note: We cannot directly rename columns in PostgreSQL while they have constraints.
-- The Food.java entity already maps "reference_grams" to the old columns which we'll drop.
-- We need a different approach: add the new unified macro columns, populate them, then drop old ones.

-- Add unified macro columns
ALTER TABLE food_catalog ADD COLUMN kcal_val DECIMAL(10,1) NOT NULL DEFAULT 0;
ALTER TABLE food_catalog ADD COLUMN prot_val DECIMAL(10,1) NOT NULL DEFAULT 0;
ALTER TABLE food_catalog ADD COLUMN carb_val DECIMAL(10,1) NOT NULL DEFAULT 0;
ALTER TABLE food_catalog ADD COLUMN fat_val DECIMAL(10,1) NOT NULL DEFAULT 0;
ALTER TABLE food_catalog ADD COLUMN fiber_val DECIMAL(10,1);

-- Populate unified macros from BASE data
UPDATE food_catalog
SET kcal_val = COALESCE(per100_kcal, 0),
    prot_val = COALESCE(per100_prot, 0),
    carb_val = COALESCE(per100_carb, 0),
    fat_val = COALESCE(per100_fat, 0),
    fiber_val = per100_fiber
WHERE type = 'BASE';

-- Populate unified macros from PRESET data
UPDATE food_catalog
SET kcal_val = COALESCE(preset_kcal, 0),
    prot_val = COALESCE(preset_prot, 0),
    carb_val = COALESCE(preset_carb, 0),
    fat_val = COALESCE(preset_fat, 0)
WHERE type = 'PRESET';

-- Rename _val columns to final names (cannot use ALTER TABLE RENAME COLUMN with same name as existing)
-- Drop old columns first, then rename
ALTER TABLE food_catalog DROP COLUMN per100_kcal;
ALTER TABLE food_catalog DROP COLUMN per100_prot;
ALTER TABLE food_catalog DROP COLUMN per100_carb;
ALTER TABLE food_catalog DROP COLUMN per100_fat;
ALTER TABLE food_catalog DROP COLUMN per100_fiber;
ALTER TABLE food_catalog DROP COLUMN preset_grams;
ALTER TABLE food_catalog DROP COLUMN preset_kcal;
ALTER TABLE food_catalog DROP COLUMN preset_prot;
ALTER TABLE food_catalog DROP COLUMN preset_carb;
ALTER TABLE food_catalog DROP COLUMN preset_fat;
ALTER TABLE food_catalog DROP COLUMN type;

ALTER TABLE food_catalog RENAME COLUMN kcal_val TO kcal;
ALTER TABLE food_catalog RENAME COLUMN prot_val TO prot;
ALTER TABLE food_catalog RENAME COLUMN carb_val TO carb;
ALTER TABLE food_catalog RENAME COLUMN fat_val TO fat;
ALTER TABLE food_catalog RENAME COLUMN fiber_val TO fiber;

-- Drop the old reference_grams column if it was added by a prior migration
-- (Food.java currently maps referenceGrams → this column)
-- We need it renamed to reference_amount
-- Check if reference_grams exists from an earlier partial migration:
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_catalog' AND column_name = 'reference_grams') THEN
        ALTER TABLE food_catalog DROP COLUMN reference_grams;
    END IF;
END $$;

-- 3. Meal food: grams → amount + unit
ALTER TABLE meal_food ADD COLUMN amount DECIMAL(10,1);
ALTER TABLE meal_food ADD COLUMN unit VARCHAR(20) NOT NULL DEFAULT 'GRAMAS';
UPDATE meal_food SET amount = grams WHERE amount IS NULL;
ALTER TABLE meal_food DROP COLUMN grams;

-- 4. Drop food_portion table
DROP TABLE IF EXISTS food_portion;