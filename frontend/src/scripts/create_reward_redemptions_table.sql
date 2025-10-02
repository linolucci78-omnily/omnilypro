-- Tabella per tracciare i riscatti dei premi
-- Ogni riga rappresenta un premio riscattato da un cliente

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE RESTRICT,

  -- Snapshot dei dati del premio al momento del riscatto (per storico)
  reward_name TEXT NOT NULL,
  reward_type TEXT NOT NULL,
  reward_value TEXT NOT NULL,
  points_spent INTEGER NOT NULL,

  -- Customer info al momento del riscatto
  customer_points_before INTEGER NOT NULL,
  customer_points_after INTEGER NOT NULL,
  customer_tier TEXT,

  -- Stato del riscatto
  status TEXT NOT NULL DEFAULT 'redeemed' CHECK (status IN ('redeemed', 'used', 'expired', 'cancelled')),

  -- Metadata
  notes TEXT,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_customer ON reward_redemptions(customer_id, redeemed_at DESC);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_organization ON reward_redemptions(organization_id, redeemed_at DESC);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_reward ON reward_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON reward_redemptions(status);

-- RLS (Row Level Security) - I clienti vedono solo i propri riscatti
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti dell'organizzazione possono vedere tutti i riscatti della loro org
CREATE POLICY "Users can view their organization's redemptions"
  ON reward_redemptions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Policy: Gli utenti dell'organizzazione possono creare riscatti
CREATE POLICY "Users can create redemptions for their organization"
  ON reward_redemptions
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Policy: Gli utenti dell'organizzazione possono aggiornare i loro riscatti
CREATE POLICY "Users can update their organization's redemptions"
  ON reward_redemptions
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Commenti per documentazione
COMMENT ON TABLE reward_redemptions IS 'Traccia tutti i premi riscattati dai clienti';
COMMENT ON COLUMN reward_redemptions.reward_name IS 'Snapshot del nome del premio al momento del riscatto';
COMMENT ON COLUMN reward_redemptions.status IS 'redeemed = appena riscattato, used = utilizzato, expired = scaduto, cancelled = annullato';
COMMENT ON COLUMN reward_redemptions.points_spent IS 'Punti spesi per riscattare il premio';
COMMENT ON COLUMN reward_redemptions.customer_points_before IS 'Punti del cliente prima del riscatto';
COMMENT ON COLUMN reward_redemptions.customer_points_after IS 'Punti del cliente dopo il riscatto';
