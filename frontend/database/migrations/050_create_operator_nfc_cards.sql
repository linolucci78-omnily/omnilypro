-- =====================================================
-- Migration 050: Create Operator NFC Cards System
-- =====================================================
-- Descrizione: Sistema per autenticazione operatori via NFC
-- Permette agli operatori POS di fare login con tessera NFC
-- invece di email/password
-- =====================================================

-- Drop existing table if exists
DROP TABLE IF EXISTS public.operator_nfc_cards CASCADE;

-- Create operator_nfc_cards table
CREATE TABLE public.operator_nfc_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  nfc_uid VARCHAR(255) NOT NULL UNIQUE,
  operator_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Constraint: un operatore può avere solo una tessera attiva per organizzazione
  UNIQUE(user_id, organization_id, is_active)
);

-- Indici per performance
CREATE INDEX idx_operator_nfc_cards_user_id ON public.operator_nfc_cards(user_id);
CREATE INDEX idx_operator_nfc_cards_org_id ON public.operator_nfc_cards(organization_id);
CREATE INDEX idx_operator_nfc_cards_nfc_uid ON public.operator_nfc_cards(nfc_uid);
CREATE INDEX idx_operator_nfc_cards_active ON public.operator_nfc_cards(is_active) WHERE is_active = true;

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_operator_nfc_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_operator_nfc_cards_updated_at
  BEFORE UPDATE ON public.operator_nfc_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_operator_nfc_cards_updated_at();

-- =====================================================
-- RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE public.operator_nfc_cards ENABLE ROW LEVEL SECURITY;

-- Policy 1: Super Admin può vedere tutto
CREATE POLICY "Super admins can view all operator cards"
  ON public.operator_nfc_cards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_users.user_id = auth.uid()
      AND organization_users.role = 'super_admin'
    )
  );

-- Policy 2: Org admin può vedere le tessere della propria organizzazione
CREATE POLICY "Org admins can view their organization operator cards"
  ON public.operator_nfc_cards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_users.user_id = auth.uid()
      AND organization_users.org_id = operator_nfc_cards.organization_id
      AND organization_users.role IN ('org_admin', 'super_admin')
    )
  );

-- Policy 3: Super admin e org admin possono inserire tessere
CREATE POLICY "Admins can insert operator cards"
  ON public.operator_nfc_cards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_users.user_id = auth.uid()
      AND organization_users.org_id = operator_nfc_cards.organization_id
      AND organization_users.role IN ('org_admin', 'super_admin')
    )
  );

-- Policy 4: Super admin e org admin possono aggiornare tessere
CREATE POLICY "Admins can update operator cards"
  ON public.operator_nfc_cards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_users.user_id = auth.uid()
      AND organization_users.org_id = operator_nfc_cards.organization_id
      AND organization_users.role IN ('org_admin', 'super_admin')
    )
  );

-- Policy 5: Super admin e org admin possono eliminare tessere
CREATE POLICY "Admins can delete operator cards"
  ON public.operator_nfc_cards
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_users.user_id = auth.uid()
      AND organization_users.org_id = operator_nfc_cards.organization_id
      AND organization_users.role IN ('org_admin', 'super_admin')
    )
  );

-- Policy 6: IMPORTANTE - Accesso pubblico in lettura per autenticazione NFC
-- Questo permette di cercare la tessera NFC PRIMA del login
CREATE POLICY "Public can read active operator cards for authentication"
  ON public.operator_nfc_cards
  FOR SELECT
  USING (is_active = true);

-- =====================================================
-- Funzione per autenticare operatore via NFC
-- =====================================================

CREATE OR REPLACE FUNCTION public.authenticate_operator_via_nfc(
  p_nfc_uid VARCHAR(255)
)
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  operator_name VARCHAR(255),
  organization_id UUID,
  card_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    onc.user_id,
    u.email,
    onc.operator_name,
    onc.organization_id,
    onc.id as card_id
  FROM public.operator_nfc_cards onc
  JOIN auth.users u ON u.id = onc.user_id
  WHERE onc.nfc_uid = p_nfc_uid
  AND onc.is_active = true
  LIMIT 1;

  -- Aggiorna last_used_at
  UPDATE public.operator_nfc_cards
  SET last_used_at = NOW()
  WHERE nfc_uid = p_nfc_uid
  AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute sulla funzione
GRANT EXECUTE ON FUNCTION public.authenticate_operator_via_nfc(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.authenticate_operator_via_nfc(VARCHAR) TO anon;

-- =====================================================
-- Tabella per log degli accessi NFC
-- =====================================================

CREATE TABLE IF NOT EXISTS public.operator_nfc_login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_card_id UUID REFERENCES public.operator_nfc_cards(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  nfc_uid VARCHAR(255) NOT NULL,
  success BOOLEAN DEFAULT true,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_operator_nfc_login_logs_user_id ON public.operator_nfc_login_logs(user_id);
CREATE INDEX idx_operator_nfc_login_logs_org_id ON public.operator_nfc_login_logs(organization_id);
CREATE INDEX idx_operator_nfc_login_logs_created_at ON public.operator_nfc_login_logs(created_at DESC);

-- RLS per logs
ALTER TABLE public.operator_nfc_login_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view login logs"
  ON public.operator_nfc_login_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_users.user_id = auth.uid()
      AND organization_users.org_id = operator_nfc_login_logs.organization_id
      AND organization_users.role IN ('org_admin', 'super_admin')
    )
  );

-- =====================================================
-- Commenti
-- =====================================================

COMMENT ON TABLE public.operator_nfc_cards IS 'Tessere NFC associate agli operatori per login rapido';
COMMENT ON COLUMN public.operator_nfc_cards.nfc_uid IS 'UID univoco della tessera NFC';
COMMENT ON COLUMN public.operator_nfc_cards.is_active IS 'Se false, la tessera è disabilitata e non può essere usata per il login';
COMMENT ON COLUMN public.operator_nfc_cards.last_used_at IS 'Ultimo utilizzo della tessera per login';

COMMENT ON TABLE public.operator_nfc_login_logs IS 'Log degli accessi tramite tessera NFC per audit';
COMMENT ON FUNCTION public.authenticate_operator_via_nfc IS 'Verifica e autentica un operatore tramite NFC UID';
