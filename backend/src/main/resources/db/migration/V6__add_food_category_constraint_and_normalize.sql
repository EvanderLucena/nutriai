ALTER TABLE food_catalog ADD CONSTRAINT fk_food_category
    CHECK (category IS NULL OR category IN ('PROTEINA', 'CARBOIDRATO', 'GORDURA', 'VEGETAL', 'FRUTA', 'BEBIDA', 'OUTRO'));

UPDATE food_catalog SET type = UPPER(type) WHERE type != UPPER(type);
UPDATE food_catalog SET category = UPPER(category) WHERE category IS NOT NULL AND category != UPPER(category);