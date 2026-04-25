-- V16: Add nutritionist_id to episode for explicit tenant scoping

ALTER TABLE episode ADD COLUMN nutritionist_id UUID;

UPDATE episode e
SET nutritionist_id = p.nutritionist_id
FROM patient p
WHERE e.patient_id = p.id
  AND e.nutritionist_id IS NULL;

ALTER TABLE episode ALTER COLUMN nutritionist_id SET NOT NULL;

ALTER TABLE episode ADD CONSTRAINT fk_episode_nutritionist
    FOREIGN KEY (nutritionist_id) REFERENCES nutritionist(id) ON DELETE CASCADE;

CREATE INDEX idx_episode_nutritionist ON episode(nutritionist_id);
