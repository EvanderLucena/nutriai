-- V2: Add auth, onboarding, and trial columns to nutritionist; create refresh_token table

ALTER TABLE nutritionist ADD COLUMN IF NOT EXISTS crn VARCHAR(20);
ALTER TABLE nutritionist ADD COLUMN IF NOT EXISTS crn_regional VARCHAR(2);
ALTER TABLE nutritionist ADD COLUMN IF NOT EXISTS specialty VARCHAR(50);
ALTER TABLE nutritionist ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);
ALTER TABLE nutritionist ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE nutritionist ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '30 days');
ALTER TABLE nutritionist ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) NOT NULL DEFAULT 'TRIAL';
ALTER TABLE nutritionist ADD COLUMN IF NOT EXISTS patient_limit INT NOT NULL DEFAULT 15;

CREATE TABLE IF NOT EXISTS refresh_token (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    nutritionist_id UUID NOT NULL REFERENCES nutritionist(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_token_nutritionist ON refresh_token(nutritionist_id);
CREATE INDEX idx_refresh_token_hash ON refresh_token(token_hash);