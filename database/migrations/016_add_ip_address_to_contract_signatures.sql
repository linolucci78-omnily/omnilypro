-- Add ip_address column to contract_signatures
-- This is needed for the signature completion process

ALTER TABLE contract_signatures
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);

-- Also add user_agent and geolocation if missing
ALTER TABLE contract_signatures
ADD COLUMN IF NOT EXISTS user_agent TEXT;

ALTER TABLE contract_signatures
ADD COLUMN IF NOT EXISTS geolocation JSONB;

-- Create index for IP lookups
CREATE INDEX IF NOT EXISTS idx_contract_signatures_ip ON contract_signatures(ip_address);
