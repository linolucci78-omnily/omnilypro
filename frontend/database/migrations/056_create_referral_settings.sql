-- Migration 056: Create Referral Settings Table
-- Configurazioni globali per il sistema referral per organizzazione

-- =====================================================
-- 1. REFERRAL SETTINGS (Configurazioni Globali)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.referral_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Punti e Rewards
  points_per_referral INTEGER DEFAULT 100 NOT NULL,
  welcome_bonus_points INTEGER DEFAULT 50 NOT NULL,
  first_purchase_bonus INTEGER DEFAULT 150 NOT NULL,

  -- Configurazione Codici
  code_format VARCHAR(20) DEFAULT 'auto' NOT NULL, -- 'auto', 'name', 'custom'
  code_prefix VARCHAR(10) DEFAULT '',
  code_length INTEGER DEFAULT 8 NOT NULL,
  code_validity_days INTEGER DEFAULT 0, -- 0 = illimitato

  -- Automazioni Email
  email_welcome_enabled BOOLEAN DEFAULT true NOT NULL,
  auto_assign_points BOOLEAN DEFAULT true NOT NULL,
  auto_upgrade_tiers BOOLEAN DEFAULT true NOT NULL,
  notify_conversions BOOLEAN DEFAULT true NOT NULL,

  -- Stato Programma
  program_active BOOLEAN DEFAULT true NOT NULL,
  max_referrals_per_user INTEGER DEFAULT 0, -- 0 = illimitato
  require_first_purchase BOOLEAN DEFAULT true NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT valid_points_per_referral CHECK (points_per_referral >= 0),
  CONSTRAINT valid_welcome_bonus CHECK (welcome_bonus_points >= 0),
  CONSTRAINT valid_first_purchase_bonus CHECK (first_purchase_bonus >= 0),
  CONSTRAINT valid_code_format CHECK (code_format IN ('auto', 'name', 'custom')),
  CONSTRAINT valid_code_length CHECK (code_length >= 4 AND code_length <= 20),
  CONSTRAINT valid_code_validity CHECK (code_validity_days >= 0),
  CONSTRAINT valid_max_referrals CHECK (max_referrals_per_user >= 0)
);

CREATE INDEX idx_referral_settings_org ON public.referral_settings(organization_id);

COMMENT ON TABLE public.referral_settings IS 'Configurazioni globali sistema referral per organizzazione';
COMMENT ON COLUMN public.referral_settings.code_format IS 'Formato codice: auto=generato automaticamente, name=basato su nome, custom=inserito manualmente';
COMMENT ON COLUMN public.referral_settings.code_validity_days IS 'Giorni validità codice, 0 = illimitato';
COMMENT ON COLUMN public.referral_settings.max_referrals_per_user IS 'Massimo numero referral per utente, 0 = illimitato';

-- =====================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view referral settings"
  ON public.referral_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage referral settings"
  ON public.referral_settings FOR ALL
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 3. FUNCTIONS & TRIGGERS
-- =====================================================

-- Trigger: Auto-update timestamp
CREATE TRIGGER trigger_referral_settings_timestamp
  BEFORE UPDATE ON public.referral_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_referral_timestamp();

-- Function: Create default settings for new organization
CREATE OR REPLACE FUNCTION public.create_default_referral_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default referral settings when a new organization is created
  INSERT INTO public.referral_settings (
    organization_id,
    points_per_referral,
    welcome_bonus_points,
    first_purchase_bonus,
    code_format,
    code_prefix,
    code_length,
    code_validity_days,
    email_welcome_enabled,
    auto_assign_points,
    auto_upgrade_tiers,
    notify_conversions,
    program_active,
    max_referrals_per_user,
    require_first_purchase
  )
  VALUES (
    NEW.id,
    100, -- default points per referral
    50,  -- default welcome bonus
    150, -- default first purchase bonus
    'auto',
    '',
    8,
    0,   -- unlimited validity
    true,
    true,
    true,
    true,
    true,
    0,   -- unlimited referrals
    true
  )
  ON CONFLICT (organization_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create settings for new organizations
DROP TRIGGER IF EXISTS trigger_create_referral_settings ON public.organizations;

CREATE TRIGGER trigger_create_referral_settings
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_referral_settings();

-- =====================================================
-- 4. SEED DEFAULT SETTINGS FOR EXISTING ORGANIZATIONS
-- =====================================================

-- Create default settings for any existing organizations that don't have them yet
INSERT INTO public.referral_settings (
  organization_id,
  points_per_referral,
  welcome_bonus_points,
  first_purchase_bonus,
  code_format,
  code_prefix,
  code_length,
  code_validity_days,
  email_welcome_enabled,
  auto_assign_points,
  auto_upgrade_tiers,
  notify_conversions,
  program_active,
  max_referrals_per_user,
  require_first_purchase
)
SELECT
  o.id,
  100,
  50,
  150,
  'auto',
  '',
  8,
  0,
  true,
  true,
  true,
  true,
  true,
  0,
  true
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.referral_settings rs
  WHERE rs.organization_id = o.id
);

COMMENT ON FUNCTION public.create_default_referral_settings IS 'Crea impostazioni referral di default per nuove organizzazioni';
