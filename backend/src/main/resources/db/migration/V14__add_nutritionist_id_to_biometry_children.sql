-- V14: Add nutritionist_id to biometry child tables for tenant isolation defense-in-depth
-- Denormalized from parent biometry_assessment to allow scoped repository queries

ALTER TABLE biometry_skinfold ADD COLUMN nutritionist_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE biometry_perimetry ADD COLUMN nutritionist_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Backfill from parent assessment
UPDATE biometry_skinfold s
SET nutritionist_id = a.nutritionist_id
FROM biometry_assessment a
WHERE s.assessment_id = a.id;

UPDATE biometry_perimetry p
SET nutritionist_id = a.nutritionist_id
FROM biometry_assessment a
WHERE p.assessment_id = a.id;

-- Add FK constraints and indexes
ALTER TABLE biometry_skinfold ADD CONSTRAINT fk_skinfold_nutritionist
    FOREIGN KEY (nutritionist_id) REFERENCES nutritionist(id) ON DELETE CASCADE;
ALTER TABLE biometry_perimetry ADD CONSTRAINT fk_perimetry_nutritionist
    FOREIGN KEY (nutritionist_id) REFERENCES nutritionist(id) ON DELETE CASCADE;

CREATE INDEX idx_biometry_skinfold_nutritionist ON biometry_skinfold(nutritionist_id);
CREATE INDEX idx_biometry_perimetry_nutritionist ON biometry_perimetry(nutritionist_id);