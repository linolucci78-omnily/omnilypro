-- =====================================================
-- Migration 055: Create Staff Activity Logs System
-- =====================================================
-- Descrizione: Sistema completo per tracciare tutte le azioni degli operatori
-- Registra vendite, modifiche, riscatti, login, logout, ecc.
-- =====================================================

-- Drop existing table if exists
DROP TABLE IF EXISTS public.staff_activity_logs CASCADE;

-- Create staff_activity_logs table
CREATE TABLE public.staff_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  staff_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  staff_name VARCHAR(255) NOT NULL,

  -- Tipo di azione
  action_type VARCHAR(100) NOT NULL,
  -- Possibili valori:
  -- 'login', 'logout', 'sale', 'refund', 'reward_redeem',
  -- 'customer_create', 'customer_update', 'customer_delete',
  -- 'gift_certificate_issue', 'gift_certificate_redeem', 'gift_certificate_validate',
  -- 'settings_update', 'price_override', 'discount_apply', ecc.

  -- Descrizione dell'azione
  description TEXT NOT NULL,

  -- Riferimenti opzionali
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),

  -- Dati dell'azione (JSON flessibile)
  action_data JSONB DEFAULT '{}',
  -- Esempi:
  -- Sale: { "amount": 50.00, "points": 5, "payment_method": "cash" }
  -- Reward: { "reward_id": "...", "reward_name": "...", "points_spent": 100 }
  -- Customer: { "field_changed": "email", "old_value": "...", "new_value": "..." }

  -- Metadata
  ip_address INET,
  user_agent TEXT,
  device_id VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX idx_staff_activity_logs_org ON public.staff_activity_logs(organization_id);
CREATE INDEX idx_staff_activity_logs_staff ON public.staff_activity_logs(staff_user_id);
CREATE INDEX idx_staff_activity_logs_customer ON public.staff_activity_logs(customer_id);
CREATE INDEX idx_staff_activity_logs_action_type ON public.staff_activity_logs(action_type);
CREATE INDEX idx_staff_activity_logs_created ON public.staff_activity_logs(created_at DESC);
CREATE INDEX idx_staff_activity_logs_org_date ON public.staff_activity_logs(organization_id, created_at DESC);
CREATE INDEX idx_staff_activity_logs_staff_date ON public.staff_activity_logs(staff_user_id, created_at DESC);

-- Indice GIN per ricerche nel JSONB
CREATE INDEX idx_staff_activity_logs_action_data ON public.staff_activity_logs USING GIN (action_data);

-- =====================================================
-- RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE public.staff_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Super Admin può vedere tutto
CREATE POLICY "Super admins can view all activity logs"
  ON public.staff_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_users.user_id = auth.uid()
      AND organization_users.role = 'super_admin'
    )
  );

-- Policy 2: Org admin può vedere i log della propria organizzazione
CREATE POLICY "Org admins can view their organization activity logs"
  ON public.staff_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_users.user_id = auth.uid()
      AND organization_users.org_id = staff_activity_logs.organization_id
      AND organization_users.role IN ('org_admin', 'super_admin')
    )
  );

-- Policy 3: Tutti gli staff possono inserire log (serve per registrare le loro azioni)
CREATE POLICY "Staff can insert their own activity logs"
  ON public.staff_activity_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_users.user_id = auth.uid()
      AND organization_users.org_id = staff_activity_logs.organization_id
    )
  );

-- Policy 4: Solo admin possono eliminare log (per GDPR o cleanup)
CREATE POLICY "Admins can delete activity logs"
  ON public.staff_activity_logs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_users.user_id = auth.uid()
      AND organization_users.org_id = staff_activity_logs.organization_id
      AND organization_users.role IN ('org_admin', 'super_admin')
    )
  );

-- =====================================================
-- Helper Functions
-- =====================================================

-- Funzione per ottenere statistiche attività staff
CREATE OR REPLACE FUNCTION public.get_staff_activity_stats(
  p_organization_id UUID,
  p_staff_user_id UUID DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  action_type VARCHAR,
  count BIGINT,
  last_action TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sal.action_type::VARCHAR,
    COUNT(*)::BIGINT,
    MAX(sal.created_at)::TIMESTAMPTZ
  FROM public.staff_activity_logs sal
  WHERE sal.organization_id = p_organization_id
    AND (p_staff_user_id IS NULL OR sal.staff_user_id = p_staff_user_id)
    AND (p_start_date IS NULL OR sal.created_at >= p_start_date)
    AND (p_end_date IS NULL OR sal.created_at <= p_end_date)
  GROUP BY sal.action_type
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.get_staff_activity_stats(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- Funzione per ottenere top operatori per vendite
CREATE OR REPLACE FUNCTION public.get_top_staff_by_sales(
  p_organization_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  staff_user_id UUID,
  staff_name VARCHAR,
  sales_count BIGINT,
  total_amount NUMERIC,
  total_points BIGINT,
  last_sale TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sal.staff_user_id,
    sal.staff_name::VARCHAR,
    COUNT(*)::BIGINT as sales_count,
    COALESCE(SUM((sal.action_data->>'amount')::NUMERIC), 0) as total_amount,
    COALESCE(SUM((sal.action_data->>'points')::BIGINT), 0) as total_points,
    MAX(sal.created_at) as last_sale
  FROM public.staff_activity_logs sal
  WHERE sal.organization_id = p_organization_id
    AND sal.action_type = 'sale'
    AND (p_start_date IS NULL OR sal.created_at >= p_start_date)
    AND (p_end_date IS NULL OR sal.created_at <= p_end_date)
  GROUP BY sal.staff_user_id, sal.staff_name
  ORDER BY sales_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.get_top_staff_by_sales(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT) TO authenticated;

-- =====================================================
-- Commenti
-- =====================================================

COMMENT ON TABLE public.staff_activity_logs IS 'Log completo di tutte le azioni degli operatori per audit e reporting';
COMMENT ON COLUMN public.staff_activity_logs.action_type IS 'Tipo di azione: login, sale, reward_redeem, customer_update, ecc.';
COMMENT ON COLUMN public.staff_activity_logs.action_data IS 'Dati JSON flessibili specifici per ogni tipo di azione';
COMMENT ON COLUMN public.staff_activity_logs.staff_name IS 'Nome operatore salvato per mantenere storico anche se utente viene eliminato';
COMMENT ON FUNCTION public.get_staff_activity_stats IS 'Statistiche attività staff per tipo di azione';
COMMENT ON FUNCTION public.get_top_staff_by_sales IS 'Top operatori per numero vendite e importi';
