-- Migration 055: Create Advanced Referral System with Dynamic Tiers
-- Sistema referral professionale con livelli configurabili, gamification, e tracking completo

-- =====================================================
-- 1. REFERRAL TIERS (Livelli Configurabili)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.referral_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Configurazione Livello
  name VARCHAR(100) NOT NULL,
  description TEXT,
  threshold INTEGER NOT NULL DEFAULT 0, -- Numero minimo di referral completati

  -- Visual Customization
  color VARCHAR(7) DEFAULT '#ef4444', -- Hex color
  icon VARCHAR(50) DEFAULT 'star', -- Nome icona
  badge_url TEXT, -- URL immagine badge personalizzato

  -- Rewards per questo livello
  points_per_referral INTEGER DEFAULT 0, -- Punti extra per referral a questo livello
  discount_percentage DECIMAL(5,2) DEFAULT 0, -- Sconto % per chi è a questo livello
  special_perks JSONB DEFAULT '[]'::jsonb, -- Array di vantaggi speciali

  -- Metadata
  position INTEGER DEFAULT 0, -- Ordine visualizzazione
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_org_tier_name UNIQUE(organization_id, name),
  CONSTRAINT valid_threshold CHECK (threshold >= 0),
  CONSTRAINT valid_discount CHECK (discount_percentage >= 0 AND discount_percentage <= 100)
);

CREATE INDEX idx_referral_tiers_org ON public.referral_tiers(organization_id);
CREATE INDEX idx_referral_tiers_threshold ON public.referral_tiers(threshold);

COMMENT ON TABLE public.referral_tiers IS 'Livelli referral configurabili per organizzazione con gamification';
COMMENT ON COLUMN public.referral_tiers.special_perks IS 'Array di vantaggi: [{type: "free_product", description: "Prodotto omaggio"}]';

-- =====================================================
-- 2. REFERRAL PROGRAMS (Programmi Referral Clienti)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.referral_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,

  -- Codice Referral Univoco
  referral_code VARCHAR(20) NOT NULL UNIQUE,

  -- Statistiche Real-time
  total_referrals INTEGER DEFAULT 0, -- Totale inviti inviati
  successful_referrals INTEGER DEFAULT 0, -- Conversioni completate
  pending_referrals INTEGER DEFAULT 0, -- In attesa di conversione
  conversion_rate DECIMAL(5,2) DEFAULT 0, -- % conversione

  -- Gamification
  current_tier_id UUID REFERENCES public.referral_tiers(id) ON DELETE SET NULL,
  total_points_earned INTEGER DEFAULT 0,
  total_rewards_claimed INTEGER DEFAULT 0,

  -- Social Sharing Stats
  shares_whatsapp INTEGER DEFAULT 0,
  shares_email INTEGER DEFAULT 0,
  shares_social INTEGER DEFAULT 0,
  qr_code_scans INTEGER DEFAULT 0,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_referral_at TIMESTAMPTZ,

  CONSTRAINT unique_org_customer_referral UNIQUE(organization_id, customer_id)
);

CREATE INDEX idx_referral_programs_org ON public.referral_programs(organization_id);
CREATE INDEX idx_referral_programs_customer ON public.referral_programs(customer_id);
CREATE INDEX idx_referral_programs_code ON public.referral_programs(referral_code);
CREATE INDEX idx_referral_programs_tier ON public.referral_programs(current_tier_id);

COMMENT ON TABLE public.referral_programs IS 'Programmi referral dei clienti con tracking completo';
COMMENT ON COLUMN public.referral_programs.referral_code IS 'Codice univoco condivisibile (es: MARIO2024)';

-- =====================================================
-- 3. REFERRAL CONVERSIONS (Tracking Conversioni)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.referral_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Relazioni
  referrer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE, -- Chi ha invitato
  referee_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE, -- Chi è stato invitato
  referral_program_id UUID NOT NULL REFERENCES public.referral_programs(id) ON DELETE CASCADE,

  -- Tracking
  referral_code VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, rewarded, expired

  -- Rewards
  points_awarded_referrer INTEGER DEFAULT 0,
  points_awarded_referee INTEGER DEFAULT 0,
  reward_type VARCHAR(50), -- points, discount, free_product, cash
  reward_value DECIMAL(10,2) DEFAULT 0,
  reward_claimed BOOLEAN DEFAULT false,

  -- Analytics
  source VARCHAR(50), -- whatsapp, email, social, qr_code, direct
  device_type VARCHAR(50), -- mobile, tablet, desktop
  converted_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_conversion_status CHECK (status IN ('pending', 'completed', 'rewarded', 'expired', 'cancelled')),
  CONSTRAINT different_users CHECK (referrer_id != referee_id)
);

CREATE INDEX idx_referral_conversions_org ON public.referral_conversions(organization_id);
CREATE INDEX idx_referral_conversions_referrer ON public.referral_conversions(referrer_id);
CREATE INDEX idx_referral_conversions_referee ON public.referral_conversions(referee_id);
CREATE INDEX idx_referral_conversions_status ON public.referral_conversions(status);
CREATE INDEX idx_referral_conversions_date ON public.referral_conversions(created_at DESC);

COMMENT ON TABLE public.referral_conversions IS 'Tracking completo conversioni referral con analytics';
COMMENT ON COLUMN public.referral_conversions.source IS 'Canale di provenienza del referral';

-- =====================================================
-- 4. REFERRAL REWARDS HISTORY (Storico Premi)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  conversion_id UUID REFERENCES public.referral_conversions(id) ON DELETE SET NULL,

  -- Tipo Reward
  reward_type VARCHAR(50) NOT NULL, -- points, discount_coupon, free_product, cash, custom
  reward_name VARCHAR(200) NOT NULL,
  reward_description TEXT,
  reward_value DECIMAL(10,2) DEFAULT 0,

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, available, claimed, expired

  -- Expiration
  expires_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_reward_status CHECK (status IN ('pending', 'available', 'claimed', 'expired', 'cancelled'))
);

CREATE INDEX idx_referral_rewards_org ON public.referral_rewards(organization_id);
CREATE INDEX idx_referral_rewards_customer ON public.referral_rewards(customer_id);
CREATE INDEX idx_referral_rewards_status ON public.referral_rewards(status);

COMMENT ON TABLE public.referral_rewards IS 'Storico premi referral assegnati e riscattati';

-- =====================================================
-- 5. REFERRAL ANALYTICS (Metriche Aggregate)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.referral_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type VARCHAR(20) DEFAULT 'daily', -- daily, weekly, monthly, yearly

  -- Metrics
  total_referrals INTEGER DEFAULT 0,
  successful_conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  total_points_awarded INTEGER DEFAULT 0,
  total_rewards_value DECIMAL(10,2) DEFAULT 0,

  -- Top Performers
  top_referrer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  top_referrer_count INTEGER DEFAULT 0,

  -- Channel Performance
  whatsapp_conversions INTEGER DEFAULT 0,
  email_conversions INTEGER DEFAULT 0,
  social_conversions INTEGER DEFAULT 0,
  qr_code_conversions INTEGER DEFAULT 0,

  -- ROI Metrics
  total_revenue_generated DECIMAL(10,2) DEFAULT 0,
  cost_per_acquisition DECIMAL(10,2) DEFAULT 0,
  roi_percentage DECIMAL(5,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_org_period UNIQUE(organization_id, period_start, period_type)
);

CREATE INDEX idx_referral_analytics_org ON public.referral_analytics(organization_id);
CREATE INDEX idx_referral_analytics_period ON public.referral_analytics(period_start DESC);

COMMENT ON TABLE public.referral_analytics IS 'Metriche aggregate per analytics dashboard';

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Referral Tiers
ALTER TABLE public.referral_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view referral tiers of their organization"
  ON public.referral_tiers FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage referral tiers"
  ON public.referral_tiers FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Referral Programs
ALTER TABLE public.referral_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view referral programs of their organization"
  ON public.referral_programs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage referral programs"
  ON public.referral_programs FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Referral Conversions
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversions of their organization"
  ON public.referral_conversions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage conversions"
  ON public.referral_conversions FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Referral Rewards
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rewards of their organization"
  ON public.referral_rewards FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Referral Analytics
ALTER TABLE public.referral_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics of their organization"
  ON public.referral_analytics FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 7. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Generate Unique Referral Code
CREATE OR REPLACE FUNCTION public.generate_referral_code(
  p_customer_name TEXT,
  p_organization_id UUID
)
RETURNS TEXT AS $$
DECLARE
  v_base_code TEXT;
  v_final_code TEXT;
  v_counter INTEGER := 0;
  v_exists BOOLEAN;
BEGIN
  -- Create base code from customer name
  v_base_code := UPPER(REGEXP_REPLACE(p_customer_name, '[^a-zA-Z0-9]', '', 'g'));
  v_base_code := SUBSTRING(v_base_code FROM 1 FOR 8);

  -- If too short, add organization prefix
  IF LENGTH(v_base_code) < 4 THEN
    v_base_code := v_base_code || SUBSTRING(p_organization_id::TEXT FROM 1 FOR 4);
  END IF;

  v_final_code := v_base_code;

  -- Check uniqueness and add counter if needed
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM public.referral_programs
      WHERE referral_code = v_final_code
    ) INTO v_exists;

    EXIT WHEN NOT v_exists;

    v_counter := v_counter + 1;
    v_final_code := v_base_code || v_counter::TEXT;
  END LOOP;

  RETURN v_final_code;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate Referral Tier
CREATE OR REPLACE FUNCTION public.calculate_referral_tier(
  p_program_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_organization_id UUID;
  v_successful_referrals INTEGER;
  v_tier_id UUID;
BEGIN
  -- Get program details
  SELECT organization_id, successful_referrals
  INTO v_organization_id, v_successful_referrals
  FROM public.referral_programs
  WHERE id = p_program_id;

  -- Find appropriate tier
  SELECT id INTO v_tier_id
  FROM public.referral_tiers
  WHERE organization_id = v_organization_id
    AND threshold <= v_successful_referrals
    AND is_active = true
  ORDER BY threshold DESC
  LIMIT 1;

  RETURN v_tier_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update referral program stats on conversion change
CREATE OR REPLACE FUNCTION public.update_referral_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_tier_id UUID;
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status != OLD.status) THEN
    -- Update referral program statistics
    UPDATE public.referral_programs rp
    SET
      total_referrals = (
        SELECT COUNT(*) FROM public.referral_conversions
        WHERE referral_program_id = rp.id
      ),
      successful_referrals = (
        SELECT COUNT(*) FROM public.referral_conversions
        WHERE referral_program_id = rp.id AND status = 'completed'
      ),
      pending_referrals = (
        SELECT COUNT(*) FROM public.referral_conversions
        WHERE referral_program_id = rp.id AND status = 'pending'
      ),
      conversion_rate = CASE
        WHEN (SELECT COUNT(*) FROM public.referral_conversions WHERE referral_program_id = rp.id) > 0
        THEN (
          SELECT COUNT(*)::DECIMAL FROM public.referral_conversions
          WHERE referral_program_id = rp.id AND status = 'completed'
        ) * 100.0 / (
          SELECT COUNT(*) FROM public.referral_conversions WHERE referral_program_id = rp.id
        )
        ELSE 0
      END,
      last_referral_at = NOW(),
      updated_at = NOW()
    WHERE id = NEW.referral_program_id;

    -- Calculate and update tier
    v_tier_id := public.calculate_referral_tier(NEW.referral_program_id);

    IF v_tier_id IS NOT NULL THEN
      UPDATE public.referral_programs
      SET current_tier_id = v_tier_id
      WHERE id = NEW.referral_program_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_referral_stats
  AFTER INSERT OR UPDATE ON public.referral_conversions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_referral_stats();

-- Trigger: Auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_referral_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_referral_tiers_timestamp
  BEFORE UPDATE ON public.referral_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_referral_timestamp();

CREATE TRIGGER trigger_referral_programs_timestamp
  BEFORE UPDATE ON public.referral_programs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_referral_timestamp();

CREATE TRIGGER trigger_referral_conversions_timestamp
  BEFORE UPDATE ON public.referral_conversions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_referral_timestamp();

-- =====================================================
-- 8. DEFAULT REFERRAL TIERS (Optional Seed Data)
-- =====================================================
-- Organizations can customize these or create their own

COMMENT ON FUNCTION public.generate_referral_code IS 'Genera codice referral univoco basato sul nome cliente';
COMMENT ON FUNCTION public.calculate_referral_tier IS 'Calcola il tier appropriato basato sui referral completati';
