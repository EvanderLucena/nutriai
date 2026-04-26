-- V14: Add nutritionist_id to biometry child tables for tenant isolation defense-in-depth
-- Denormalized from parent biometry_assessment to allow scoped repository queries

ALTER TABLE biometry_skinfold ADD COLUMN IF NOT EXISTS nutritionist_id UUID;
ALTER TABLE biometry_perimetry ADD COLUMN IF NOT EXISTS nutritionist_id UUID;

-- Backfill from parent assessment
UPDATE biometry_skinfold s
SET nutritionist_id = a.nutritionist_id
FROM biometry_assessment a
WHERE s.assessment_id = a.id
  AND s.nutritionist_id IS NULL;

UPDATE biometry_perimetry p
SET nutritionist_id = a.nutritionist_id
FROM biometry_assessment a
WHERE p.assessment_id = a.id
  AND p.nutritionist_id IS NULL;

ALTER TABLE biometry_skinfold ALTER COLUMN nutritionist_id SET NOT NULL;
ALTER TABLE biometry_perimetry ALTER COLUMN nutritionist_id SET NOT NULL;

-- Add FK constraints and indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_skinfold_nutritionist') THEN
        ALTER TABLE biometry_skinfold ADD CONSTRAINT fk_skinfold_nutritionist
            FOREIGN KEY (nutritionist_id) REFERENCES nutritionist(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_perimetry_nutritionist') THEN
        ALTER TABLE biometry_perimetry ADD CONSTRAINT fk_perimetry_nutritionist
            FOREIGN KEY (nutritionist_id) REFERENCES nutritionist(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_biometry_skinfold_nutritionist ON biometry_skinfold(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_biometry_perimetry_nutritionist ON biometry_perimetry(nutritionist_id);
