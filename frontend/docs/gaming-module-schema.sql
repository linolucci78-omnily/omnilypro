-- ============================================
-- OMNILYPRO GAMING MODULE - MVP DATABASE SCHEMA
-- Features: Badge System, Challenges, Spin the Wheel
-- ============================================

-- ============================================
-- GAMING CONFIGURATION (per organization)
-- ============================================
CREATE TABLE gaming_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT FALSE,
  -- Badge settings
  badges_enabled BOOLEAN DEFAULT TRUE,
  auto_badge_unlock BOOLEAN DEFAULT TRUE,
  -- Challenges settings
  challenges_enabled BOOLEAN DEFAULT TRUE,
  daily_challenges_count INTEGER DEFAULT 3,
  weekly_challenges_count INTEGER DEFAULT 2,
  -- Spin settings
  spin_enabled BOOLEAN DEFAULT TRUE,
  spin_trigger_rules JSONB DEFAULT '{"on_purchase": true, "min_amount": 10}',
  max_spins_per_day INTEGER DEFAULT 3,
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- ============================================
-- BADGE SYSTEM
-- ============================================

-- Badge definitions (template badge)
CREATE TABLE gaming_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  -- Badge info
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  icon_emoji VARCHAR(10), -- Fallback se no icon_url
  category VARCHAR(50), -- 'firstSteps', 'loyalty', 'spending', 'frequency', 'social', 'seasonal', 'special'
  rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  -- Auto-unlock rules (se null = badge manuale)
  auto_unlock_rule JSONB,
  /* Esempi auto_unlock_rule:
    {"type": "first_purchase", "threshold": 1}
    {"type": "total_spent", "threshold": 100}
    {"type": "visit_count", "threshold": 10}
    {"type": "points_reached", "threshold": 500}
    {"type": "referrals", "threshold": 5}
    {"type": "streak_days", "threshold": 7}
    {"type": "tier_reached", "tier_name": "Platinum"}
    {"type": "challenge_completed", "count": 10}
  */
  -- Rewards per unlock
  unlock_rewards JSONB,
  /* Esempio:
    {"points": 50, "discount": 10, "free_spins": 1}
  */
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_predefined BOOLEAN DEFAULT FALSE, -- Badge di sistema vs custom admin
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Customer badges (badge sbloccati dai clienti)
CREATE TABLE customer_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES gaming_badges(id) ON DELETE CASCADE,
  -- Unlock info
  unlocked_at TIMESTAMP DEFAULT NOW(),
  unlock_method VARCHAR(50), -- 'auto', 'manual', 'admin_granted'
  -- Progress tracking (per badge che richiedono steps)
  progress JSONB,
  /* Esempio progress:
    {"current": 7, "target": 10, "percentage": 70}
  */
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(customer_id, badge_id) -- Un cliente può avere un badge una sola volta
);

CREATE INDEX idx_customer_badges_customer ON customer_badges(customer_id);
CREATE INDEX idx_customer_badges_badge ON customer_badges(badge_id);
CREATE INDEX idx_customer_badges_unlocked_at ON customer_badges(unlocked_at DESC);

-- ============================================
-- CHALLENGES SYSTEM
-- ============================================

-- Challenge templates
CREATE TABLE gaming_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  -- Challenge info
  title VARCHAR(200) NOT NULL,
  description TEXT,
  icon_emoji VARCHAR(10),
  -- Challenge type & difficulty
  type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'special'
  difficulty VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  -- Requirements (cosa fare per completare)
  requirements JSONB NOT NULL,
  /* Esempi requirements:
    {"type": "make_purchases", "count": 3}
    {"type": "spend_amount", "amount": 50}
    {"type": "earn_points", "points": 100}
    {"type": "redeem_rewards", "count": 2}
    {"type": "visit_count", "count": 5}
    {"type": "referrals", "count": 1}
  */
  -- Rewards
  rewards JSONB NOT NULL,
  /* Esempio rewards:
    {"points": 100, "badge_id": "uuid", "free_spins": 2}
  */
  -- Timing
  duration_hours INTEGER, -- Durata challenge (24 per daily, 168 per weekly)
  start_time TIME, -- Ora inizio (null = subito)
  end_time TIME, -- Ora fine (null = dopo duration)
  -- Auto-recurring
  is_recurring BOOLEAN DEFAULT TRUE, -- Si auto-rigenera?
  recurrence_pattern VARCHAR(50), -- 'daily', 'weekly_monday', 'monthly_1st'
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_template BOOLEAN DEFAULT TRUE, -- Template vs istanza specifica
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Customer challenges (istanze attive per clienti)
CREATE TABLE customer_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES gaming_challenges(id) ON DELETE CASCADE,
  -- Progress
  progress JSONB DEFAULT '{}',
  /* Esempio progress:
    {"current": 2, "target": 3, "percentage": 67}
    Per requirements complessi:
    {"purchases_made": 2, "purchases_needed": 3, "amount_spent": 35, "amount_needed": 50}
  */
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'failed', 'expired'
  -- Timing
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  -- Rewards claimed
  rewards_claimed BOOLEAN DEFAULT FALSE,
  rewards_claimed_at TIMESTAMP,
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_customer_challenges_customer ON customer_challenges(customer_id);
CREATE INDEX idx_customer_challenges_status ON customer_challenges(status);
CREATE INDEX idx_customer_challenges_expires ON customer_challenges(expires_at);

-- ============================================
-- SPIN THE WHEEL
-- ============================================

-- Wheel configuration (per organization)
CREATE TABLE gaming_wheel_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  -- Wheel settings
  name VARCHAR(100) DEFAULT 'Ruota della Fortuna',
  sectors JSONB NOT NULL,
  /* Esempio sectors - array di 8-12 settori:
  [
    {
      "id": 1,
      "label": "10 Punti",
      "type": "points",
      "value": 10,
      "color": "#3b82f6",
      "probability": 25
    },
    {
      "id": 2,
      "label": "Sconto 10%",
      "type": "discount",
      "value": 10,
      "color": "#10b981",
      "probability": 20
    },
    {
      "id": 3,
      "label": "Riprova",
      "type": "nothing",
      "value": 0,
      "color": "#6b7280",
      "probability": 15
    },
    ...
  ]
  Prize types: 'points', 'discount', 'free_spin', 'badge', 'reward', 'nothing'
  */
  -- Trigger rules
  trigger_rules JSONB DEFAULT '{}',
  /* Esempio:
    {
      "on_purchase": true,
      "min_purchase_amount": 10,
      "on_points_milestone": [100, 500, 1000],
      "manual_grant": true
    }
  */
  -- Limits
  max_spins_per_day INTEGER DEFAULT 3,
  max_spins_per_week INTEGER,
  cooldown_hours INTEGER DEFAULT 0, -- Ore tra spin
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Customer spins (storico spin)
CREATE TABLE customer_wheel_spins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  wheel_config_id UUID REFERENCES gaming_wheel_configs(id) ON DELETE SET NULL,
  -- Spin result
  sector_landed JSONB NOT NULL, -- Il settore su cui è finita la ruota
  prize_won JSONB NOT NULL,
  /* Esempio prize_won:
    {"type": "points", "value": 50, "label": "50 Punti Bonus"}
    {"type": "discount", "value": 15, "label": "Sconto 15%", "code": "SPIN15"}
  */
  -- Rewards claimed
  rewards_claimed BOOLEAN DEFAULT FALSE,
  rewards_claimed_at TIMESTAMP,
  -- Metadata
  spun_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wheel_spins_customer ON customer_wheel_spins(customer_id);
CREATE INDEX idx_wheel_spins_organization ON customer_wheel_spins(organization_id);
CREATE INDEX idx_wheel_spins_date ON customer_wheel_spins(spun_at DESC);

-- ============================================
-- GAMING ANALYTICS & STATS
-- ============================================

-- Gaming stats aggregati per analytics
CREATE TABLE gaming_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  -- Badge stats
  badges_unlocked_today INTEGER DEFAULT 0,
  badges_unlocked_total INTEGER DEFAULT 0,
  -- Challenge stats
  challenges_completed_today INTEGER DEFAULT 0,
  challenges_active INTEGER DEFAULT 0,
  -- Spin stats
  spins_today INTEGER DEFAULT 0,
  prizes_won JSONB DEFAULT '{}',
  -- Engagement
  active_gamers_today INTEGER DEFAULT 0,
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, date)
);

-- ============================================
-- GAMING NOTIFICATIONS
-- ============================================

-- Notifiche gaming (badge unlock, challenge complete, spin available)
CREATE TABLE gaming_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'badge_unlocked', 'challenge_completed', 'spin_available', 'challenge_expiring'
  title VARCHAR(200) NOT NULL,
  message TEXT,
  data JSONB, -- Dati aggiuntivi tipo-specifici
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_gaming_notifications_customer ON gaming_notifications(customer_id);
CREATE INDEX idx_gaming_notifications_read ON gaming_notifications(is_read, created_at DESC);

-- ============================================
-- PREDEFINED BADGES (badge di sistema)
-- ============================================

-- Inserimento badge predefiniti (da eseguire dopo la creazione delle tabelle)
-- Nota: Questi verranno inseriti automaticamente dal seeder

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_gaming_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER gaming_config_updated_at
  BEFORE UPDATE ON gaming_config
  FOR EACH ROW EXECUTE FUNCTION update_gaming_timestamp();

CREATE TRIGGER gaming_badges_updated_at
  BEFORE UPDATE ON gaming_badges
  FOR EACH ROW EXECUTE FUNCTION update_gaming_timestamp();

CREATE TRIGGER gaming_challenges_updated_at
  BEFORE UPDATE ON gaming_challenges
  FOR EACH ROW EXECUTE FUNCTION update_gaming_timestamp();

CREATE TRIGGER customer_challenges_updated_at
  BEFORE UPDATE ON customer_challenges
  FOR EACH ROW EXECUTE FUNCTION update_gaming_timestamp();

-- ============================================
-- VIEWS UTILI
-- ============================================

-- View: Customer gaming stats
CREATE OR REPLACE VIEW customer_gaming_overview AS
SELECT
  c.id AS customer_id,
  c.name AS customer_name,
  c.organization_id,
  -- Badge stats
  COUNT(DISTINCT cb.id) AS badges_earned,
  -- Challenge stats
  COUNT(DISTINCT CASE WHEN cc.status = 'completed' THEN cc.id END) AS challenges_completed,
  COUNT(DISTINCT CASE WHEN cc.status = 'active' THEN cc.id END) AS challenges_active,
  -- Spin stats
  COUNT(DISTINCT cws.id) AS total_spins,
  COUNT(DISTINCT CASE WHEN DATE(cws.spun_at) = CURRENT_DATE THEN cws.id END) AS spins_today,
  -- Latest activity
  MAX(GREATEST(
    COALESCE(cb.unlocked_at, '1970-01-01'::timestamp),
    COALESCE(cc.completed_at, '1970-01-01'::timestamp),
    COALESCE(cws.spun_at, '1970-01-01'::timestamp)
  )) AS last_gaming_activity
FROM customers c
LEFT JOIN customer_badges cb ON c.id = cb.customer_id
LEFT JOIN customer_challenges cc ON c.id = cc.customer_id
LEFT JOIN customer_wheel_spins cws ON c.id = cws.customer_id
GROUP BY c.id, c.name, c.organization_id;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_gaming_config_org ON gaming_config(organization_id);
CREATE INDEX idx_gaming_badges_org ON gaming_badges(organization_id);
CREATE INDEX idx_gaming_badges_category ON gaming_badges(category);
CREATE INDEX idx_gaming_challenges_org ON gaming_challenges(organization_id);
CREATE INDEX idx_gaming_challenges_type ON gaming_challenges(type);
CREATE INDEX idx_gaming_stats_org_date ON gaming_stats(organization_id, date DESC);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE gaming_config IS 'Gaming module configuration per organization';
COMMENT ON TABLE gaming_badges IS 'Badge definitions/templates';
COMMENT ON TABLE customer_badges IS 'Badges unlocked by customers';
COMMENT ON TABLE gaming_challenges IS 'Challenge templates and definitions';
COMMENT ON TABLE customer_challenges IS 'Active/completed challenges for customers';
COMMENT ON TABLE gaming_wheel_configs IS 'Spin the wheel configuration';
COMMENT ON TABLE customer_wheel_spins IS 'Spin history and results';
COMMENT ON TABLE gaming_stats IS 'Daily gaming analytics aggregated';
COMMENT ON TABLE gaming_notifications IS 'Gaming notifications for customers';

-- ============================================
-- END OF SCHEMA
-- ============================================
