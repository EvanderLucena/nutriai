-- V4: Create patient and episode tables
-- Patient entity with nutritionist FK for data isolation (D-10)
-- Episode entity for activation cycle tracking (D-08)

CREATE TABLE patient (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nutritionist_id UUID NOT NULL REFERENCES nutritionist(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    initials VARCHAR(5),
    age INTEGER,
    objective VARCHAR(30) NOT NULL DEFAULT 'SAUDE_GERAL',
    status VARCHAR(15) NOT NULL DEFAULT 'ONTRACK',
    adherence INTEGER DEFAULT 80,
    weight DECIMAL(5,2),
    weight_delta DECIMAL(5,2) DEFAULT 0,
    tag VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patient_nutritionist ON patient(nutritionist_id);
CREATE INDEX idx_patient_status ON patient(status);
CREATE INDEX idx_patient_active ON patient(active);

CREATE TABLE episode (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    start_date TIMESTAMP NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_episode_patient ON episode(patient_id);

-- Same nutritionist shouldn't have duplicate patient names
ALTER TABLE patient ADD CONSTRAINT uk_patient_name_nutri UNIQUE (name, nutritionist_id);