-- V19: Add retry_count to whatsapp_message for failed message retry logic
ALTER TABLE whatsapp_message ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0;

-- Index for efficient lookup of failed messages eligible for retry
CREATE INDEX idx_wa_message_retry ON whatsapp_message(processed, retry_count);
