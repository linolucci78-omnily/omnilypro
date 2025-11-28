-- Tabella per configurazione Stripe
CREATE TABLE IF NOT EXISTS stripe_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Stripe Keys
  stripe_publishable_key TEXT,
  stripe_secret_key TEXT,
  stripe_webhook_secret TEXT,

  -- Configuration
  mode TEXT DEFAULT 'test' CHECK (mode IN ('test', 'live')),
  enabled BOOLEAN DEFAULT false,

  -- Webhook URL (auto-generated)
  webhook_url TEXT,

  -- Metadata
  configured_by UUID REFERENCES auth.users(id),
  configured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Notes
  notes TEXT
);

-- Solo una configurazione globale
CREATE UNIQUE INDEX IF NOT EXISTS stripe_config_singleton ON stripe_config ((1));

-- RLS Policies
ALTER TABLE stripe_config ENABLE ROW LEVEL SECURITY;

-- Solo admin possono vedere/modificare
CREATE POLICY "Admin can view stripe config" ON stripe_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin'
           OR auth.users.raw_user_meta_data->>'role' = 'super_admin')
    )
  );

CREATE POLICY "Admin can update stripe config" ON stripe_config
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin'
           OR auth.users.raw_user_meta_data->>'role' = 'super_admin')
    )
  );

CREATE POLICY "Admin can insert stripe config" ON stripe_config
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin'
           OR auth.users.raw_user_meta_data->>'role' = 'super_admin')
    )
  );

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_stripe_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS stripe_config_updated_at ON stripe_config;

CREATE TRIGGER stripe_config_updated_at
  BEFORE UPDATE ON stripe_config
  FOR EACH ROW
  EXECUTE FUNCTION update_stripe_config_updated_at();

-- Insert default config se non esiste
INSERT INTO stripe_config (mode, enabled, notes)
VALUES ('test', false, 'Configurazione Stripe iniziale - inserire le chiavi API')
ON CONFLICT DO NOTHING;
