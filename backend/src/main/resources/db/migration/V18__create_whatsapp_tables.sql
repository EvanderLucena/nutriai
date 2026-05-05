-- V18: Create WhatsApp Intelligence tables
-- Inbound messages, AI responses, meal extractions, and extraction items

-- 1. whatsapp_message — inbound messages from Evolution API
CREATE TABLE whatsapp_message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id VARCHAR(100) NOT NULL UNIQUE,
    instance_id VARCHAR(100) NOT NULL,
    sender_phone VARCHAR(30) NOT NULL,
    sender_phone_normalized VARCHAR(20) NOT NULL,
    patient_id UUID REFERENCES patient(id),
    nutritionist_id UUID REFERENCES nutritionist(id),
    message_type VARCHAR(20) NOT NULL DEFAULT 'text',
    message_content TEXT,
    media_url VARCHAR(500),
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    processed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wa_message_sender_phone ON whatsapp_message(sender_phone_normalized);
CREATE INDEX idx_wa_message_patient_id ON whatsapp_message(patient_id);
CREATE INDEX idx_wa_message_nutritionist_id ON whatsapp_message(nutritionist_id);
CREATE INDEX idx_wa_message_processed ON whatsapp_message(processed);

-- 2. whatsapp_response — AI responses sent back to patient
CREATE TABLE whatsapp_response (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES whatsapp_message(id),
    nutritionist_id UUID NOT NULL REFERENCES nutritionist(id),
    patient_id UUID NOT NULL REFERENCES patient(id),
    response_type VARCHAR(30) NOT NULL,
    response_content TEXT NOT NULL,
    sent_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. meal_extraction — extracted meal data from WhatsApp messages
CREATE TABLE meal_extraction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES whatsapp_message(id),
    nutritionist_id UUID NOT NULL REFERENCES nutritionist(id),
    patient_id UUID NOT NULL REFERENCES patient(id),
    episode_id UUID NOT NULL REFERENCES episode(id),
    extraction_raw TEXT NOT NULL,
    meal_label VARCHAR(100),
    total_kcal DECIMAL(6,1),
    total_prot DECIMAL(5,1),
    total_carb DECIMAL(5,1),
    total_fat DECIMAL(5,1),
    extracted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meal_extraction_patient_nutritionist ON meal_extraction(patient_id, nutritionist_id);
CREATE INDEX idx_meal_extraction_episode ON meal_extraction(episode_id);

-- 4. extraction_item — individual food items in an extraction
CREATE TABLE extraction_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    extraction_id UUID NOT NULL REFERENCES meal_extraction(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    kcal DECIMAL(6,1) NOT NULL DEFAULT 0,
    prot DECIMAL(5,1) NOT NULL DEFAULT 0,
    carb DECIMAL(5,1) NOT NULL DEFAULT 0,
    fat DECIMAL(5,1) NOT NULL DEFAULT 0,
    grams DECIMAL(6,1),
    sort_order INTEGER NOT NULL DEFAULT 0
);