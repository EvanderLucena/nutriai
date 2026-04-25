-- V13: Create biometry and episode history tables
-- Biometric assessments tied to episodes (D-09), scoped by nutritionist (D-10)
-- Skinfold and perimetry as child tables with CASCADE delete
-- Episode history events as read-model for closed-cycle snapshots

CREATE TABLE biometry_assessment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID NOT NULL REFERENCES episode(id) ON DELETE CASCADE,
    nutritionist_id UUID NOT NULL REFERENCES nutritionist(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,
    weight DECIMAL(6,2) NOT NULL,
    body_fat_percent DECIMAL(5,2) NOT NULL,
    lean_mass_kg DECIMAL(6,2),
    water_percent DECIMAL(5,2),
    visceral_fat_level INTEGER,
    bmr_kcal INTEGER,
    device VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_biometry_assessment_episode_date ON biometry_assessment(episode_id, assessment_date);
CREATE INDEX idx_biometry_assessment_nutritionist ON biometry_assessment(nutritionist_id);

CREATE TABLE biometry_skinfold (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES biometry_assessment(id) ON DELETE CASCADE,
    measure_key VARCHAR(50) NOT NULL,
    value_mm DECIMAL(5,2) NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_biometry_skinfold_assessment_sort ON biometry_skinfold(assessment_id, sort_order);

CREATE TABLE biometry_perimetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES biometry_assessment(id) ON DELETE CASCADE,
    measure_key VARCHAR(50) NOT NULL,
    value_cm DECIMAL(5,2) NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_biometry_perimetry_assessment_sort ON biometry_perimetry(assessment_id, sort_order);

CREATE TABLE episode_history_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID NOT NULL REFERENCES episode(id) ON DELETE CASCADE,
    nutritionist_id UUID NOT NULL REFERENCES nutritionist(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_at TIMESTAMPTZ NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    source_ref VARCHAR(200),
    metadata_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_episode_history_episode_at ON episode_history_event(episode_id, event_at);
CREATE INDEX idx_episode_history_nutritionist ON episode_history_event(nutritionist_id);