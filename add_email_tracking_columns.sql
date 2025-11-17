-- Add email tracking columns to email_logs table
ALTER TABLE email_logs
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS complained_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_event TEXT,
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_resend_email_id ON email_logs(resend_email_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_delivered_at ON email_logs(delivered_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_opened_at ON email_logs(opened_at);

-- Add comments
COMMENT ON COLUMN email_logs.delivered_at IS 'Timestamp when email was successfully delivered';
COMMENT ON COLUMN email_logs.opened_at IS 'First time the email was opened';
COMMENT ON COLUMN email_logs.clicked_at IS 'First time a link in the email was clicked';
COMMENT ON COLUMN email_logs.bounced_at IS 'Timestamp when email bounced';
COMMENT ON COLUMN email_logs.complained_at IS 'Timestamp when recipient marked as spam';
COMMENT ON COLUMN email_logs.last_event IS 'Last webhook event received';
COMMENT ON COLUMN email_logs.click_count IS 'Total number of clicks';
COMMENT ON COLUMN email_logs.open_count IS 'Total number of opens';
