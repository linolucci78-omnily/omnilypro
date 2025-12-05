-- Create notification_templates table for storing reusable notification templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template Details
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('welcome', 'tier_upgrade', 'rewards', 'promotions', 'points', 'general')),
  description TEXT,

  -- Notification Content (supports variables)
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  deep_link TEXT,
  icon TEXT,

  -- Default Configuration
  default_channels TEXT[] DEFAULT ARRAY['push'],
  default_segments TEXT[] DEFAULT ARRAY['all'],

  -- Variables used in this template (for documentation)
  variables JSONB DEFAULT '[]'::jsonb,

  -- Usage Statistics
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Template Status
  is_active BOOLEAN DEFAULT true,
  is_predefined BOOLEAN DEFAULT false, -- System templates vs user-created

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_notification_templates_org ON notification_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_templates_created ON notification_templates(created_at DESC);

-- Add RLS policies
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their own templates"
  ON notification_templates FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users WHERE user_id = auth.uid()
    )
    OR is_predefined = true -- Everyone can see predefined templates
  );

CREATE POLICY "Organizations can insert their own templates"
  ON notification_templates FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT org_id FROM organization_users WHERE user_id = auth.uid()
    )
    AND is_predefined = false -- Can't create predefined templates
  );

CREATE POLICY "Organizations can update their own templates"
  ON notification_templates FOR UPDATE
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users WHERE user_id = auth.uid()
    )
    AND is_predefined = false -- Can't edit predefined templates
  );

CREATE POLICY "Organizations can delete their own templates"
  ON notification_templates FOR DELETE
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users WHERE user_id = auth.uid()
    )
    AND is_predefined = false -- Can't delete predefined templates
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_notification_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_templates_updated_at();

-- Insert some predefined templates
INSERT INTO notification_templates (organization_id, name, category, description, title, body, subtitle, is_predefined, variables)
SELECT
  (SELECT id FROM organizations LIMIT 1), -- Use first org as template owner
  'Benvenuto Nuovo Cliente',
  'welcome',
  'Template di benvenuto per nuovi clienti registrati',
  'Benvenuto in {{business_name}}!',
  'Ciao {{customer_name}}, grazie per esserti registrato. Inizia a guadagnare punti con ogni acquisto!',
  'Il tuo viaggio fedelt� inizia qui',
  true,
  '[{"name": "business_name", "description": "Nome dell''attivit�"}, {"name": "customer_name", "description": "Nome del cliente"}]'::jsonb
WHERE EXISTS (SELECT 1 FROM organizations LIMIT 1);

INSERT INTO notification_templates (organization_id, name, category, description, title, body, is_predefined, variables)
SELECT
  (SELECT id FROM organizations LIMIT 1),
  'Avanzamento Tier',
  'tier_upgrade',
  'Notifica di avanzamento a un nuovo tier di fedelt�',
  'Congratulazioni! Nuovo livello raggiunto <�',
  'Hai raggiunto il livello {{tier_name}}! Ora hai accesso a vantaggi esclusivi e sconti maggiori.',
  true,
  '[{"name": "tier_name", "description": "Nome del nuovo tier"}, {"name": "tier_benefits", "description": "Benefici del tier"}]'::jsonb
WHERE EXISTS (SELECT 1 FROM organizations LIMIT 1);

INSERT INTO notification_templates (organization_id, name, category, description, title, body, is_predefined, variables)
SELECT
  (SELECT id FROM organizations LIMIT 1),
  'Ricompensa Disponibile',
  'rewards',
  'Avviso di nuova ricompensa sbloccata',
  'Nuova Ricompensa Disponibile! <�',
  'Hai sbloccato "{{reward_name}}"! Riscattala ora nel tuo profilo fedelt�.',
  true,
  '[{"name": "reward_name", "description": "Nome della ricompensa"}, {"name": "reward_points", "description": "Punti necessari"}]'::jsonb
WHERE EXISTS (SELECT 1 FROM organizations LIMIT 1);

INSERT INTO notification_templates (organization_id, name, category, description, title, body, is_predefined, variables)
SELECT
  (SELECT id FROM organizations LIMIT 1),
  'Promozione Speciale',
  'promotions',
  'Template per promozioni e offerte speciali',
  'Offerta Esclusiva Solo per Te! =%',
  '{{promotion_description}} - Valido fino al {{expiry_date}}. Non perdere questa occasione!',
  true,
  '[{"name": "promotion_description", "description": "Descrizione della promozione"}, {"name": "expiry_date", "description": "Data di scadenza"}]'::jsonb
WHERE EXISTS (SELECT 1 FROM organizations LIMIT 1);

INSERT INTO notification_templates (organization_id, name, category, description, title, body, is_predefined, variables)
SELECT
  (SELECT id FROM organizations LIMIT 1),
  'Punti Guadagnati',
  'points',
  'Notifica di punti guadagnati dopo un acquisto',
  'Hai guadagnato {{points}} punti! P',
  'Grazie per il tuo acquisto! Hai guadagnato {{points}} punti. Saldo totale: {{total_points}} punti.',
  true,
  '[{"name": "points", "description": "Punti guadagnati"}, {"name": "total_points", "description": "Totale punti"}]'::jsonb
WHERE EXISTS (SELECT 1 FROM organizations LIMIT 1);
