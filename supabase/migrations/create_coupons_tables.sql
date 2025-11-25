-- ============================================================================
-- COUPONS SYSTEM - Database Tables
-- ============================================================================
-- Creates tables for managing promotional coupons (both flash and standard)
-- Includes validation, usage tracking, and analytics support
-- ============================================================================

-- ============================================================================
-- TABLE: coupons
-- ============================================================================
-- Stores all coupons with their rules, validity, and usage limits
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Identificatori
  code VARCHAR(50) NOT NULL,
  qr_code_data TEXT,

  -- Tipo e valore
  type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_product', 'buy_x_get_y', 'free_shipping')),
  value TEXT NOT NULL, -- Può essere numero o descrizione

  -- Durata
  duration_type VARCHAR(20) NOT NULL CHECK (duration_type IN ('flash', 'short', 'standard', 'long')),

  -- Validità
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'used')),

  -- Dettagli
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  terms_conditions TEXT,

  -- Limitazioni
  min_purchase_amount DECIMAL(10, 2),
  max_discount_amount DECIMAL(10, 2),
  usage_limit INTEGER, -- Limite totale di utilizzi
  usage_per_customer INTEGER, -- Limite per singolo cliente
  current_usage INTEGER NOT NULL DEFAULT 0, -- Contatore utilizzi

  -- Targeting
  customer_tier_required VARCHAR(50),
  first_purchase_only BOOLEAN DEFAULT FALSE,

  -- Metadata
  image_url TEXT,
  background_color VARCHAR(7),
  text_color VARCHAR(7),
  is_flash BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_user_id UUID REFERENCES auth.users(id),

  -- Constraints
  UNIQUE(organization_id, code)
);

-- Indexes per performance
CREATE INDEX IF NOT EXISTS idx_coupons_organization ON public.coupons(organization_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON public.coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON public.coupons(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupons_is_flash ON public.coupons(is_flash) WHERE is_flash = TRUE;
CREATE INDEX IF NOT EXISTS idx_coupons_type ON public.coupons(type);

-- ============================================================================
-- TABLE: coupon_usages
-- ============================================================================
-- Tracks every coupon usage with customer and transaction details
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Dettagli utilizzo
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transaction_id VARCHAR(100), -- ID transazione POS (opzionale)
  discount_applied DECIMAL(10, 2) NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes per performance
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon ON public.coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_customer ON public.coupon_usages(customer_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_organization ON public.coupon_usages(organization_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_used_at ON public.coupon_usages(used_at);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_transaction ON public.coupon_usages(transaction_id) WHERE transaction_id IS NOT NULL;

-- ============================================================================
-- FUNCTION: increment_coupon_usage
-- ============================================================================
-- Incrementa il contatore di utilizzi per un coupon
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.coupons
  SET
    current_usage = current_usage + 1,
    updated_at = NOW()
  WHERE id = coupon_id_param;
END;
$$;

-- ============================================================================
-- FUNCTION: update_coupon_updated_at
-- ============================================================================
-- Trigger function per aggiornare updated_at automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_coupon_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger per coupons
DROP TRIGGER IF EXISTS set_coupon_updated_at ON public.coupons;
CREATE TRIGGER set_coupon_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_coupon_updated_at();

-- ============================================================================
-- FUNCTION: auto_expire_coupons
-- ============================================================================
-- Aggiorna automaticamente lo status dei coupon scaduti
-- Da eseguire periodicamente tramite cron job o scheduled function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_expire_coupons()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.coupons
  SET
    status = 'expired',
    updated_at = NOW()
  WHERE
    status = 'active'
    AND valid_until < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;

  RETURN expired_count;
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

-- Policy: Organizations can manage their own coupons
CREATE POLICY "Organizations can manage their coupons"
  ON public.coupons
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Organizations can view their coupon usages
CREATE POLICY "Organizations can view their coupon usages"
  ON public.coupon_usages
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Policy: System can insert coupon usages (per transazioni POS)
CREATE POLICY "System can insert coupon usages"
  ON public.coupon_usages
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT SELECT, INSERT ON public.coupon_usages TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_coupon_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_expire_coupons TO authenticated;

-- ============================================================================
-- SAMPLE DATA (optional - per testing)
-- ============================================================================

-- Uncomment below to insert sample coupons for testing
/*
INSERT INTO public.coupons (
  organization_id,
  code,
  type,
  value,
  duration_type,
  valid_from,
  valid_until,
  title,
  description,
  usage_limit,
  is_flash
) VALUES (
  'YOUR_ORG_ID_HERE',
  'SUMMER2024',
  'percentage',
  '20',
  'standard',
  NOW(),
  NOW() + INTERVAL '30 days',
  'Sconto Estivo',
  'Sconto del 20% su tutti i prodotti',
  100,
  FALSE
);
*/

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.coupons IS 'Stores promotional coupons with validation rules and usage tracking';
COMMENT ON TABLE public.coupon_usages IS 'Tracks every coupon redemption by customers';
COMMENT ON COLUMN public.coupons.type IS 'Type of discount: percentage, fixed_amount, free_product, buy_x_get_y, free_shipping';
COMMENT ON COLUMN public.coupons.duration_type IS 'Duration category: flash (hours), short (days), standard (weeks), long (months)';
COMMENT ON COLUMN public.coupons.is_flash IS 'Marks if this is a flash/time-limited coupon';
COMMENT ON FUNCTION public.increment_coupon_usage IS 'Increments the usage counter for a coupon';
COMMENT ON FUNCTION public.auto_expire_coupons IS 'Updates status to expired for coupons past their valid_until date';
