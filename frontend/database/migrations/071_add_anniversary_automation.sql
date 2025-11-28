-- Migration: Add Anniversary Email Automation
-- Date: 2025-01-29
-- Description: Adds anniversary automation type and default template

-- 1. Update email_automations constraint to include 'anniversary'
ALTER TABLE email_automations DROP CONSTRAINT IF EXISTS email_automations_automation_type_check;

ALTER TABLE email_automations ADD CONSTRAINT email_automations_automation_type_check
CHECK (automation_type IN ('welcome', 'birthday', 'tier_upgrade', 'special_event', 'winback', 'anniversary'));

COMMENT ON CONSTRAINT email_automations_automation_type_check ON email_automations
IS 'Allowed automation types: welcome, birthday, tier_upgrade, special_event, winback, anniversary';

-- 2. Create index for anniversary automations
CREATE INDEX IF NOT EXISTS idx_email_automations_anniversary
ON email_automations(organization_id, automation_type, enabled)
WHERE automation_type = 'anniversary' AND enabled = true;

-- 3. Create index on customers.created_at for efficient anniversary queries
CREATE INDEX IF NOT EXISTS idx_customers_created_at_active
ON customers(organization_id, created_at, is_active)
WHERE is_active = true;

-- 4. Insert default global anniversary email template
INSERT INTO email_templates (
  id,
  organization_id,
  name,
  template_type,
  subject,
  html_content,
  is_active,
  created_at,
  updated_at
) VALUES (
  uuid_generate_v4(),
  NULL, -- Global template
  'Anniversary Email - Default',
  'anniversary',
  '🎉 Buon Anniversario {{customer_name}}! Festeggia con noi i tuoi {{years_of_membership}} anni!',
  '<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🎉 Buon Anniversario!</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, {{primary_color}} 0%, #ef4444 100%);
      color: white;
      padding: 48px 32px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 800;
    }
    .header .emoji {
      font-size: 64px;
      margin-bottom: 16px;
      display: block;
    }
    .header .years-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      padding: 12px 24px;
      border-radius: 50px;
      font-size: 24px;
      font-weight: 700;
      margin-top: 16px;
      backdrop-filter: blur(10px);
    }
    .content {
      padding: 40px 32px;
    }
    .greeting {
      font-size: 20px;
      margin-bottom: 24px;
      color: #1f2937;
    }
    .message {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 32px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin: 32px 0;
    }
    .stat-card {
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .stat-value {
      font-size: 28px;
      font-weight: 800;
      color: {{primary_color}};
      margin-bottom: 4px;
    }
    .stat-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .bonus-section {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 3px solid #f59e0b;
      border-radius: 16px;
      padding: 32px;
      text-align: center;
      margin: 32px 0;
    }
    .bonus-section .gift-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .bonus-section h2 {
      margin: 0 0 8px 0;
      color: #92400e;
      font-size: 24px;
    }
    .bonus-points {
      font-size: 48px;
      font-weight: 800;
      color: #b45309;
      margin: 16px 0;
    }
    .bonus-description {
      color: #78350f;
      font-size: 14px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, {{primary_color}} 0%, #ef4444 100%);
      color: white;
      padding: 16px 48px;
      border-radius: 50px;
      text-decoration: none;
      font-weight: 700;
      font-size: 16px;
      margin: 24px 0;
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: scale(1.05);
    }
    .yearly-recap {
      background: #f9fafb;
      border-radius: 12px;
      padding: 24px;
      margin: 32px 0;
    }
    .yearly-recap h3 {
      margin: 0 0 20px 0;
      color: #1f2937;
      font-size: 18px;
    }
    .recap-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .recap-item:last-child {
      border-bottom: none;
    }
    .recap-label {
      color: #6b7280;
      font-size: 14px;
    }
    .recap-value {
      font-weight: 700;
      color: #1f2937;
      font-size: 14px;
    }
    .footer {
      background: #f9fafb;
      padding: 32px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .footer a {
      color: {{primary_color}};
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <span class="emoji">🎉</span>
      <h1>Buon Anniversario!</h1>
      <div class="years-badge">
        {{years_of_membership}} {{#if (eq years_of_membership 1)}}Anno{{else}}Anni{{/if}} Insieme
      </div>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="greeting">
        Caro <strong>{{customer_name}}</strong>,
      </div>

      <div class="message">
        Oggi è un giorno speciale! Sono già passati <strong>{{years_of_membership}} {{#if (eq years_of_membership 1)}}anno{{else}}anni{{/if}}</strong>
        da quando sei entrato a far parte della famiglia <strong>{{store_name}}</strong>! 🎊
      </div>

      <div class="message">
        Vogliamo ringraziarti per la tua fedeltà e per aver scelto di essere con noi in questo viaggio.
        Sei un membro prezioso della nostra community e vogliamo celebrare insieme a te!
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{total_spent}}€</div>
          <div class="stat-label">Spesa Totale</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{total_visits}}</div>
          <div class="stat-label">Visite Totali</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{current_points}}</div>
          <div class="stat-label">Punti Attuali</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{tier}}</div>
          <div class="stat-label">Livello</div>
        </div>
      </div>

      <!-- Yearly Recap -->
      <div class="yearly-recap">
        <h3>📊 Il Tuo Anno in Sintesi</h3>
        <div class="recap-item">
          <span class="recap-label">💰 Speso nell''ultimo anno</span>
          <span class="recap-value">{{yearly_spent}}€</span>
        </div>
        <div class="recap-item">
          <span class="recap-label">⭐ Punti guadagnati</span>
          <span class="recap-value">{{yearly_points_earned}} punti</span>
        </div>
        <div class="recap-item">
          <span class="recap-label">🏪 Visite effettuate</span>
          <span class="recap-value">{{yearly_visits}} visite</span>
        </div>
      </div>

      <!-- Bonus Section -->
      <div class="bonus-section">
        <div class="gift-icon">🎁</div>
        <h2>Il Tuo Regalo Speciale</h2>
        <div class="bonus-points">+{{bonus_points}} PUNTI</div>
        <div class="bonus-description">
          Abbiamo aggiunto un bonus speciale al tuo account per celebrare questo anniversario!
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align: center;">
        <a href="{{store_url}}" class="cta-button">
          🛍️ Usa i Tuoi Punti Ora
        </a>
      </div>

      <div class="message" style="margin-top: 32px; text-align: center; color: #6b7280;">
        Grazie per essere parte della famiglia <strong>{{store_name}}</strong>!
        Non vediamo l''ora di continuare questo viaggio insieme. ❤️
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>{{store_name}}</strong></p>
      <p>
        <a href="{{store_url}}">Visita il nostro sito</a>
      </p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
        Questa è un''email automatica. Per qualsiasi domanda, contattaci tramite il nostro sito.
      </p>
    </div>
  </div>
</body>
</html>',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- 5. Enable anniversary automation for all active organizations (disabled by default)
-- Organizations can enable it manually from the Email Automations Hub
INSERT INTO email_automations (
  organization_id,
  automation_type,
  enabled,
  template_id,
  total_sent,
  total_opened,
  total_clicked,
  total_failed,
  created_at,
  updated_at
)
SELECT
  o.id,
  'anniversary',
  false, -- Disabled by default, organizations enable manually
  (SELECT id FROM email_templates WHERE template_type = 'anniversary' AND organization_id IS NULL LIMIT 1),
  0,
  0,
  0,
  0,
  NOW(),
  NOW()
FROM organizations o
WHERE o.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM email_automations ea
    WHERE ea.organization_id = o.id
    AND ea.automation_type = 'anniversary'
  );

COMMENT ON TABLE email_automations IS 'Tracks all automated email campaigns including welcome, birthday, tier upgrades, win-back, and anniversary campaigns';
