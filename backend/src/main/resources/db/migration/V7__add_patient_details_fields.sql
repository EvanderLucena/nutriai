-- V7: Add birth_date, sex, height_cm, whatsapp to patient table

ALTER TABLE patient ADD COLUMN birth_date DATE;
ALTER TABLE patient ADD COLUMN sex VARCHAR(1);
ALTER TABLE patient ADD COLUMN height_cm INTEGER;
ALTER TABLE patient ADD COLUMN whatsapp VARCHAR(30);

-- Migrate existing age values to approximate birth_date (assume birthday already passed this year)
-- Only for rows where age is not null
UPDATE patient SET birth_date = MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::int - age, EXTRACT(MONTH FROM CURRENT_DATE)::int, EXTRACT(DAY FROM CURRENT_DATE)::int)
WHERE age IS NOT NULL AND birth_date IS NULL;