-- V15: Add patient_id to biometry_assessment for patient-scoped assessment queries

ALTER TABLE biometry_assessment ADD COLUMN IF NOT EXISTS patient_id UUID;

UPDATE biometry_assessment a
SET patient_id = e.patient_id
FROM episode e
WHERE a.episode_id = e.id
  AND a.patient_id IS NULL;

ALTER TABLE biometry_assessment ALTER COLUMN patient_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_biometry_assessment_patient') THEN
        ALTER TABLE biometry_assessment ADD CONSTRAINT fk_biometry_assessment_patient
            FOREIGN KEY (patient_id) REFERENCES patient(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_biometry_assessment_patient_nutritionist_date
    ON biometry_assessment(patient_id, nutritionist_id, assessment_date);
