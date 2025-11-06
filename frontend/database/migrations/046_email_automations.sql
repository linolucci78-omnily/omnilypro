-- =====================================================
-- 046: Email Automations System
-- =====================================================
-- Sistema per email automatiche: welcome, tier upgrade, birthday, special events
-- Author: Claude Code
-- Date: 2025-01-06
-- =====================================================

-- DROP existing table if exists (for clean migration)
DROP TABLE IF EXISTS email_automations CASCADE;

-- =====================================================
-- 1. CREATE email_automations TABLE
-- =====================================================
CREATE TABLE email_automations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Automation Type
  automation_type TEXT NOT NULL CHECK (automation_type IN ('welcome', 'tier_upgrade', 'birthday', 'special_event')),
  name TEXT NOT NULL, -- Es: "Email Benvenuto", "Auguri Compleanno"
  description TEXT,

  -- Configuration
  enabled BOOLEAN DEFAULT true,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,

  -- Timing Configuration (per birthday principalmente)
  send_days_before INTEGER DEFAULT 0, -- 0 = stesso giorno, 1 = 1 giorno prima, ecc.
  send_time TIME DEFAULT '09:00', -- Ora di invio

  -- Subject Override (opzionale, se vuoi override del template)
  subject_override TEXT,

  -- Statistics
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  last_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: una sola automazione per tipo per organizzazione
  UNIQUE(organization_id, automation_type)
);

-- Indici per performance
CREATE INDEX idx_email_automations_org ON email_automations(organization_id);
CREATE INDEX idx_email_automations_type ON email_automations(automation_type);
CREATE INDEX idx_email_automations_enabled ON email_automations(enabled) WHERE enabled = true;

-- Commenti
COMMENT ON TABLE email_automations IS 'Configurazione email automatiche per ogni organizzazione';
COMMENT ON COLUMN email_automations.automation_type IS 'Tipo: welcome, tier_upgrade, birthday, special_event';
COMMENT ON COLUMN email_automations.send_days_before IS 'Giorni prima dell''evento (0 = stesso giorno)';
COMMENT ON COLUMN email_automations.send_time IS 'Ora di invio (formato 24h)';

-- =====================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE email_automations ENABLE ROW LEVEL SECURITY;

-- Super Admin: full access
CREATE POLICY "Super Admin full access email_automations" ON email_automations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'superadmin@omnilypro.com'
    )
  );

-- Organization users: can view and edit their org's automations
CREATE POLICY "Org users manage own email_automations" ON email_automations
  FOR ALL
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 3. TRIGGER: Update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_email_automations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_email_automations_updated_at
  BEFORE UPDATE ON email_automations
  FOR EACH ROW
  EXECUTE FUNCTION update_email_automations_updated_at();

-- =====================================================
-- 4. INSERT DEFAULT AUTOMATION TEMPLATES
-- =====================================================
-- Questi sono template di default per le email automatiche
-- Le organizzazioni possono poi personalizzarli

-- Template: Welcome Email
INSERT INTO email_templates (
  organization_id,
  template_type,
  name,
  description,
  subject,
  html_body,
  text_body,
  variables,
  is_active,
  is_default
) VALUES (
  NULL, -- Template globale
  'welcome',
  'Benvenuto nel Programma Fedeltà',
  'Email di benvenuto inviata automaticamente ai nuovi clienti',
  'Benvenuto in {{store_name}}! 🎉',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .header { background: {{primary_color}}; color: white; padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; }
    .welcome-icon { font-size: 64px; text-align: center; margin: 20px 0; }
    .tier-badge { display: inline-block; padding: 12px 24px; background: {{primary_color}}; color: white; border-radius: 24px; font-weight: bold; margin: 20px 0; }
    .points-box { background: #f0f9ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; }
    .points-box .number { font-size: 48px; font-weight: bold; color: #1e40af; }
    .benefits { margin: 30px 0; }
    .benefit-item { display: flex; align-items: center; gap: 12px; margin: 16px 0; padding: 16px; background: #f9fafb; border-radius: 8px; }
    .benefit-icon { font-size: 24px; }
    .cta-button { display: inline-block; padding: 16px 32px; background: {{primary_color}}; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 24px; text-align: center; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Benvenuto in {{store_name}}!</h1>
    </div>

    <div class="content">
      <div class="welcome-icon">👋</div>

      <p style="font-size: 18px; color: #111827; text-align: center;">
        Ciao <strong>{{customer_name}}</strong>!
      </p>

      <p style="font-size: 16px; color: #374151; line-height: 1.6; text-align: center;">
        Siamo felicissimi di averti con noi! Grazie per esserti iscritto al nostro programma fedeltà.
      </p>

      <div style="text-align: center;">
        <span class="tier-badge">{{tier}} 🏆</span>
      </div>

      <div class="points-box">
        <div style="font-size: 18px; color: #1e40af; margin-bottom: 8px;">I tuoi punti attuali</div>
        <div class="number">{{current_points}}</div>
        <div style="font-size: 14px; color: #6b7280; margin-top: 8px;">Inizia subito ad accumulare punti!</div>
      </div>

      <h2 style="color: #111827; font-size: 22px; margin-top: 40px;">I tuoi vantaggi:</h2>

      <div class="benefits">
        <div class="benefit-item">
          <div class="benefit-icon">⭐</div>
          <div>
            <div style="font-weight: 600; color: #111827;">Accumula Punti</div>
            <div style="font-size: 14px; color: #6b7280;">Guadagna {{points_per_euro}} punti per ogni euro speso</div>
          </div>
        </div>

        <div class="benefit-item">
          <div class="benefit-icon">🎁</div>
          <div>
            <div style="font-weight: 600; color: #111827;">Premi Esclusivi</div>
            <div style="font-size: 14px; color: #6b7280;">Sblocca premi e sconti speciali</div>
          </div>
        </div>

        <div class="benefit-item">
          <div class="benefit-icon">🚀</div>
          <div>
            <div style="font-weight: 600; color: #111827;">Sali di Livello</div>
            <div style="font-size: 14px; color: #6b7280;">Più acquisti, più vantaggi ottieni!</div>
          </div>
        </div>

        <div class="benefit-item">
          <div class="benefit-icon">🎂</div>
          <div>
            <div style="font-weight: 600; color: #111827;">Sorpresa Compleanno</div>
            <div style="font-size: 14px; color: #6b7280;">Un regalo speciale per il tuo giorno</div>
          </div>
        </div>
      </div>

      <div style="text-align: center; margin-top: 40px;">
        <p style="font-size: 16px; color: #374151;">Pronto per iniziare?</p>
        <a href="{{store_url}}" class="cta-button">Inizia ad Accumulare Punti!</a>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 8px 0;">Powered by <strong>Omnily PRO</strong></p>
      <p style="margin: 0; font-size: 12px;">
        Hai domande? <a href="mailto:{{reply_to_email}}" style="color: {{primary_color}};">Contattaci</a>
      </p>
    </div>
  </div>
</body>
</html>',
  'Benvenuto in {{store_name}}!

Ciao {{customer_name}}!

Siamo felicissimi di averti con noi! Grazie per esserti iscritto al nostro programma fedeltà.

Tier: {{tier}}
Punti Attuali: {{current_points}}

I tuoi vantaggi:
- Accumula Punti: Guadagna {{points_per_euro}} punti per ogni euro speso
- Premi Esclusivi: Sblocca premi e sconti speciali
- Sali di Livello: Più acquisti, più vantaggi ottieni!
- Sorpresa Compleanno: Un regalo speciale per il tuo giorno

Inizia ad accumulare punti su: {{store_url}}

---
Powered by Omnily PRO
Hai domande? Contattaci: {{reply_to_email}}',
  ARRAY['store_name', 'customer_name', 'tier', 'current_points', 'points_per_euro', 'store_url', 'reply_to_email', 'primary_color'],
  true,
  true
) ON CONFLICT (organization_id, template_type, name) DO NOTHING;

-- Template: Tier Upgrade Email
INSERT INTO email_templates (
  organization_id,
  template_type,
  name,
  description,
  subject,
  html_body,
  text_body,
  variables,
  is_active,
  is_default
) VALUES (
  NULL, -- Template globale
  'tier_upgrade',
  'Congratulazioni! Nuovo Livello Raggiunto',
  'Email inviata automaticamente quando un cliente sale di tier',
  '🎉 Congratulazioni {{customer_name}}! Sei {{new_tier}}!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
    .header { background: linear-gradient(135deg, {{new_tier_color}} 0%, {{new_tier_color}}dd 100%); color: white; padding: 50px 20px; text-align: center; }
    .trophy { font-size: 80px; margin: 20px 0; animation: bounce 1s ease-in-out infinite; }
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    .content { padding: 40px 30px; }
    .tier-comparison { display: flex; justify-content: space-around; align-items: center; margin: 40px 0; }
    .tier-box { text-align: center; padding: 20px; }
    .tier-box.old { opacity: 0.6; }
    .tier-box.new { background: linear-gradient(135deg, {{new_tier_color}}20 0%, {{new_tier_color}}10 100%); border: 2px solid {{new_tier_color}}; border-radius: 12px; }
    .tier-name { font-size: 24px; font-weight: bold; margin: 12px 0; }
    .arrow { font-size: 48px; color: {{new_tier_color}}; }
    .benefits-grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin: 30px 0; }
    .benefit-card { padding: 20px; background: #f0f9ff; border-left: 4px solid {{new_tier_color}}; border-radius: 8px; }
    .benefit-title { font-weight: bold; color: #111827; margin-bottom: 8px; }
    .stats { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 24px; margin: 30px 0; }
    .stat-row { display: flex; justify-content: space-between; margin: 12px 0; }
    .footer { background: #f9fafb; padding: 24px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="trophy">👑</div>
      <h1 style="margin: 0; font-size: 32px;">Fantastico!</h1>
      <p style="margin: 12px 0 0 0; font-size: 18px; opacity: 0.95;">Hai raggiunto un nuovo livello</p>
    </div>

    <div class="content">
      <p style="font-size: 18px; color: #111827; text-align: center;">
        Ciao <strong>{{customer_name}}</strong>!
      </p>

      <p style="font-size: 16px; color: #374151; line-height: 1.6; text-align: center;">
        La tua fedeltà è stata premiata! Hai raggiunto un nuovo traguardo nel nostro programma fedeltà.
      </p>

      <div class="tier-comparison">
        <div class="tier-box old">
          <div style="font-size: 40px;">{{old_tier_icon}}</div>
          <div class="tier-name" style="color: #6b7280;">{{old_tier}}</div>
        </div>

        <div class="arrow">→</div>

        <div class="tier-box new">
          <div style="font-size: 48px;">{{new_tier_icon}}</div>
          <div class="tier-name" style="color: {{new_tier_color}};">{{new_tier}}</div>
        </div>
      </div>

      <div class="stats">
        <h3 style="margin: 0 0 20px 0; color: #1e40af; text-align: center;">Le tue statistiche</h3>
        <div class="stat-row">
          <span style="color: #6b7280;">Punti Totali</span>
          <strong style="color: #111827;">{{current_points}} punti</strong>
        </div>
        <div class="stat-row">
          <span style="color: #6b7280;">Moltiplicatore Punti</span>
          <strong style="color: {{new_tier_color}};">{{multiplier}}x</strong>
        </div>
        <div class="stat-row">
          <span style="color: #6b7280;">Totale Speso</span>
          <strong style="color: #111827;">€{{total_spent}}</strong>
        </div>
      </div>

      <h2 style="color: #111827; font-size: 22px; margin-top: 40px; text-align: center;">I tuoi nuovi vantaggi:</h2>

      <div class="benefits-grid">
        <div class="benefit-card">
          <div class="benefit-title">⭐ Moltiplicatore Punti {{multiplier}}x</div>
          <div style="font-size: 14px; color: #6b7280;">Guadagni più punti ad ogni acquisto!</div>
        </div>

        <div class="benefit-card">
          <div class="benefit-title">🎁 Sconti Esclusivi</div>
          <div style="font-size: 14px; color: #6b7280;">Accesso a offerte riservate al tuo livello</div>
        </div>

        <div class="benefit-card">
          <div class="benefit-title">🚀 Priorità nel Servizio</div>
          <div style="font-size: 14px; color: #6b7280;">Assistenza prioritaria e vantaggi speciali</div>
        </div>
      </div>

      <div style="text-align: center; margin-top: 40px; padding: 24px; background: linear-gradient(135deg, {{new_tier_color}}15 0%, {{new_tier_color}}05 100%); border-radius: 12px;">
        <p style="font-size: 18px; color: #111827; margin: 0 0 12px 0; font-weight: 600;">
          Continua così!
        </p>
        <p style="font-size: 14px; color: #6b7280; margin: 0;">
          Ogni acquisto ti avvicina a premi ancora più esclusivi
        </p>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 8px 0; color: #111827;">Grazie per la tua fedeltà!</p>
      <p style="margin: 0; font-size: 14px; color: #6b7280;">{{store_name}}</p>
      <p style="margin: 12px 0 0 0; font-size: 12px; color: #9ca3af;">
        Powered by <strong>Omnily PRO</strong>
      </p>
    </div>
  </div>
</body>
</html>',
  'Congratulazioni {{customer_name}}!

Hai raggiunto un nuovo livello: {{new_tier}} 👑

Da: {{old_tier}} {{old_tier_icon}}
A: {{new_tier}} {{new_tier_icon}}

Le tue statistiche:
- Punti Totali: {{current_points}}
- Moltiplicatore: {{multiplier}}x
- Totale Speso: €{{total_spent}}

I tuoi nuovi vantaggi:
- Moltiplicatore Punti {{multiplier}}x
- Sconti Esclusivi
- Priorità nel Servizio

Continua così! Ogni acquisto ti avvicina a premi ancora più esclusivi.

Grazie per la tua fedeltà!
{{store_name}}

---
Powered by Omnily PRO',
  ARRAY['customer_name', 'old_tier', 'old_tier_icon', 'new_tier', 'new_tier_icon', 'new_tier_color', 'current_points', 'multiplier', 'total_spent', 'store_name', 'primary_color'],
  true,
  true
) ON CONFLICT (organization_id, template_type, name) DO NOTHING;

-- Template: Birthday Email
INSERT INTO email_templates (
  organization_id,
  template_type,
  name,
  description,
  subject,
  html_body,
  text_body,
  variables,
  is_active,
  is_default
) VALUES (
  NULL, -- Template globale
  'birthday',
  'Buon Compleanno! Regalo Speciale',
  'Email inviata automaticamente per il compleanno del cliente',
  '🎂 Buon Compleanno {{customer_name}}! Regalo da {{store_name}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 50px 20px; text-align: center; position: relative; overflow: hidden; }
    .confetti { position: absolute; font-size: 24px; animation: fall 3s linear infinite; }
    @keyframes fall { 0% { transform: translateY(-100px) rotate(0deg); opacity: 1; } 100% { transform: translateY(600px) rotate(360deg); opacity: 0; } }
    .birthday-cake { font-size: 100px; margin: 20px 0; animation: bounce 2s ease-in-out infinite; }
    @keyframes bounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
    .content { padding: 40px 30px; }
    .gift-box { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%); border: 3px dashed #f59e0b; border-radius: 16px; padding: 32px; margin: 30px 0; text-align: center; }
    .bonus-points { font-size: 64px; font-weight: bold; color: #d97706; margin: 16px 0; }
    .cta-button { display: inline-block; padding: 18px 36px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 18px; margin: 24px 0; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); }
    .footer { background: #fffbeb; padding: 24px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="confetti" style="left: 10%; animation-delay: 0s;">🎉</div>
      <div class="confetti" style="left: 30%; animation-delay: 0.5s;">🎈</div>
      <div class="confetti" style="left: 50%; animation-delay: 1s;">🎊</div>
      <div class="confetti" style="left: 70%; animation-delay: 1.5s;">✨</div>
      <div class="confetti" style="left: 90%; animation-delay: 2s;">🎁</div>

      <div class="birthday-cake">🎂</div>
      <h1 style="margin: 0; font-size: 36px;">Buon Compleanno!</h1>
      <p style="margin: 12px 0 0 0; font-size: 20px; opacity: 0.95;">{{customer_name}}</p>
    </div>

    <div class="content">
      <p style="font-size: 20px; color: #111827; text-align: center; margin: 0 0 24px 0;">
        Tanti auguri per il tuo giorno speciale! 🎉
      </p>

      <p style="font-size: 16px; color: #374151; line-height: 1.6; text-align: center;">
        Il team di <strong>{{store_name}}</strong> ti augura un felicissimo compleanno!
        Per festeggiare con te, abbiamo un regalo speciale!
      </p>

      <div class="gift-box">
        <div style="font-size: 48px; margin-bottom: 16px;">🎁</div>
        <h2 style="color: #d97706; margin: 0 0 12px 0;">Il tuo Regalo di Compleanno</h2>
        <p style="color: #92400e; font-size: 18px; margin: 0 0 24px 0;">Abbiamo un regalo speciale per te!</p>

        <div class="bonus-points">+{{bonus_points}}</div>
        <p style="color: #92400e; font-size: 16px; font-weight: 600; margin: 0;">Punti Bonus!</p>

        <div style="margin-top: 24px; padding: 20px; background: rgba(255, 255, 255, 0.7); border-radius: 12px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            I punti sono già stati aggiunti al tuo account!<br>
            Validi fino al {{expiry_date}}
          </p>
        </div>
      </div>

      <div style="background: #f0f9ff; border-radius: 12px; padding: 24px; margin: 30px 0; border-left: 4px solid #3b82f6;">
        <h3 style="margin: 0 0 16px 0; color: #1e40af;">📊 Il tuo riepilogo:</h3>
        <div style="display: flex; justify-content: space-between; margin: 12px 0;">
          <span style="color: #6b7280;">Punti Totali</span>
          <strong style="color: #111827;">{{current_points}} punti</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 12px 0;">
          <span style="color: #6b7280;">Livello</span>
          <strong style="color: #f59e0b;">{{tier}} 🏆</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 12px 0;">
          <span style="color: #6b7280;">Cliente dal</span>
          <strong style="color: #111827;">{{member_since}}</strong>
        </div>
      </div>

      <div style="text-align: center; margin-top: 40px;">
        <p style="font-size: 16px; color: #374151; margin: 0 0 16px 0;">
          Vieni a trovarci e festeggia con noi!
        </p>
        <a href="{{store_url}}" class="cta-button">Usa i Tuoi Punti Ora!</a>
      </div>

      <div style="text-align: center; margin-top: 40px; padding: 24px; background: #fffbeb; border-radius: 12px;">
        <p style="font-size: 16px; color: #92400e; margin: 0; font-style: italic;">
          "Grazie per essere parte della nostra famiglia!<br>
          Ti auguriamo un anno fantastico! 🌟"
        </p>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px;">
        Con affetto dal team di <strong>{{store_name}}</strong>
      </p>
      <p style="margin: 0; font-size: 12px; color: #d97706;">
        Powered by <strong>Omnily PRO</strong>
      </p>
    </div>
  </div>
</body>
</html>',
  'Buon Compleanno {{customer_name}}! 🎂

Tanti auguri per il tuo giorno speciale!

Il team di {{store_name}} ti augura un felicissimo compleanno!

IL TUO REGALO DI COMPLEANNO:
+{{bonus_points}} Punti Bonus! 🎁

I punti sono già stati aggiunti al tuo account.
Validi fino al {{expiry_date}}

Il tuo riepilogo:
- Punti Totali: {{current_points}}
- Livello: {{tier}}
- Cliente dal: {{member_since}}

Vieni a trovarci e festeggia con noi!
{{store_url}}

"Grazie per essere parte della nostra famiglia!
Ti auguriamo un anno fantastico!"

Con affetto dal team di {{store_name}}

---
Powered by Omnily PRO',
  ARRAY['customer_name', 'store_name', 'bonus_points', 'expiry_date', 'current_points', 'tier', 'member_since', 'store_url'],
  true,
  true
) ON CONFLICT (organization_id, template_type, name) DO NOTHING;

-- =====================================================
-- 5. SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 046_email_automations completed successfully!';
  RAISE NOTICE '📧 Email automations table created';
  RAISE NOTICE '🎨 3 default templates added: welcome, tier_upgrade, birthday';
  RAISE NOTICE '🔒 RLS policies configured';
  RAISE NOTICE '⚡ Indexes and triggers created';
END $$;
