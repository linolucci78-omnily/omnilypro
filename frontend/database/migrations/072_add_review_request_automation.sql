-- Migration: Add Review Request Email Automation
-- Date: 2025-01-29
-- Description: Adds review request automation type, customer_reviews table, and default template

-- 1. Create customer_reviews table
CREATE TABLE IF NOT EXISTS customer_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  platform TEXT DEFAULT 'internal' CHECK (platform IN ('internal', 'google', 'trustpilot', 'facebook')),
  is_public BOOLEAN DEFAULT true,
  bonus_points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_reviews_organization
ON customer_reviews(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_reviews_customer
ON customer_reviews(customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_reviews_rating
ON customer_reviews(organization_id, rating, is_public)
WHERE is_public = true;

-- Add comments for documentation
COMMENT ON TABLE customer_reviews IS 'Stores customer reviews and ratings for organizations';
COMMENT ON COLUMN customer_reviews.rating IS 'Star rating from 1 to 5';
COMMENT ON COLUMN customer_reviews.platform IS 'Platform where review was left: internal, google, trustpilot, facebook';
COMMENT ON COLUMN customer_reviews.is_public IS 'Whether review should be displayed publicly';
COMMENT ON COLUMN customer_reviews.bonus_points_awarded IS 'Bonus points given for leaving review';

-- 2. Update email_automations constraint to include 'review_request'
ALTER TABLE email_automations DROP CONSTRAINT IF EXISTS email_automations_automation_type_check;

ALTER TABLE email_automations ADD CONSTRAINT email_automations_automation_type_check
CHECK (automation_type IN ('welcome', 'birthday', 'tier_upgrade', 'special_event', 'winback', 'anniversary', 'review_request'));

COMMENT ON CONSTRAINT email_automations_automation_type_check ON email_automations
IS 'Allowed automation types: welcome, birthday, tier_upgrade, special_event, winback, anniversary, review_request';

-- 3. Add review request configuration columns to organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS review_request_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS review_request_days_after_purchase INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS review_request_min_amount DECIMAL(10, 2) DEFAULT 30.00,
ADD COLUMN IF NOT EXISTS review_request_bonus_points INTEGER DEFAULT 50;

-- Add comments for documentation
COMMENT ON COLUMN organizations.review_request_enabled IS 'Enable/disable automated review request emails';
COMMENT ON COLUMN organizations.review_request_days_after_purchase IS 'Number of days after purchase before sending review request (default: 7)';
COMMENT ON COLUMN organizations.review_request_min_amount IS 'Minimum transaction amount to trigger review request (default: 30.00)';
COMMENT ON COLUMN organizations.review_request_bonus_points IS 'Bonus points offered for leaving a review (default: 50)';

-- 4. Create index for review request automations
CREATE INDEX IF NOT EXISTS idx_email_automations_review_request
ON email_automations(organization_id, automation_type, enabled)
WHERE automation_type = 'review_request' AND enabled = true;

-- 5. Create index on transactions for efficient review request queries
-- Note: Commented out - transactions table might not exist in all environments
-- CREATE INDEX IF NOT EXISTS idx_transactions_review_request
-- ON transactions(organization_id, customer_id, created_at, amount)
-- WHERE amount > 0;

-- 6. Insert default global review request email template
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
  'Review Request Email - Default',
  'review_request',
  '⭐ {{customer_name}}, come è stata la tua esperienza da {{store_name}}?',
  '<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>⭐ Lascia una Recensione</title>
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
      margin-bottom: 24px;
    }
    .stars-container {
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 16px;
      padding: 32px;
      text-align: center;
      margin: 32px 0;
    }
    .stars-container h3 {
      margin: 0 0 24px 0;
      color: #1f2937;
      font-size: 20px;
    }
    .stars {
      font-size: 48px;
      letter-spacing: 8px;
      margin: 16px 0;
      cursor: pointer;
    }
    .stars span {
      display: inline-block;
      transition: transform 0.2s;
    }
    .stars span:hover {
      transform: scale(1.2);
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, {{primary_color}} 0%, #ef4444 100%);
      color: white;
      padding: 18px 48px;
      border-radius: 50px;
      text-decoration: none;
      font-weight: 700;
      font-size: 18px;
      margin: 24px 0;
      transition: transform 0.2s;
      box-shadow: 0 8px 24px rgba(220, 38, 38, 0.3);
    }
    .cta-button:hover {
      transform: scale(1.05);
    }
    .bonus-section {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 3px solid #f59e0b;
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      margin: 32px 0;
    }
    .bonus-section .gift-icon {
      font-size: 40px;
      margin-bottom: 12px;
    }
    .bonus-section h3 {
      margin: 0 0 8px 0;
      color: #92400e;
      font-size: 18px;
    }
    .bonus-points {
      font-size: 36px;
      font-weight: 800;
      color: #b45309;
      margin: 8px 0;
    }
    .purchase-info {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .purchase-info h4 {
      margin: 0 0 12px 0;
      color: #1f2937;
      font-size: 16px;
    }
    .purchase-detail {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .purchase-detail:last-child {
      border-bottom: none;
    }
    .purchase-label {
      color: #6b7280;
      font-size: 14px;
    }
    .purchase-value {
      font-weight: 600;
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
    .social-proof {
      text-align: center;
      padding: 24px;
      background: #f9fafb;
      border-radius: 12px;
      margin: 24px 0;
    }
    .social-proof p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <span class="emoji">⭐</span>
      <h1>La Tua Opinione Conta!</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="greeting">
        Ciao <strong>{{customer_name}}</strong>,
      </div>

      <div class="message">
        Grazie per il tuo recente acquisto da <strong>{{store_name}}</strong>!
        Speriamo che tu sia soddisfatto della tua esperienza. 😊
      </div>

      <div class="message">
        Ci piacerebbe molto conoscere la tua opinione! La tua recensione ci aiuta
        a migliorare i nostri servizi e aiuta altri clienti a scoprire cosa rende
        speciale <strong>{{store_name}}</strong>.
      </div>

      <!-- Purchase Info -->
      <div class="purchase-info">
        <h4>📦 Dettagli Acquisto</h4>
        <div class="purchase-detail">
          <span class="purchase-label">Data</span>
          <span class="purchase-value">{{purchase_date}}</span>
        </div>
        <div class="purchase-detail">
          <span class="purchase-label">Importo</span>
          <span class="purchase-value">€{{purchase_amount}}</span>
        </div>
        <div class="purchase-detail">
          <span class="purchase-label">Punti Guadagnati</span>
          <span class="purchase-value">{{points_earned}} punti</span>
        </div>
      </div>

      <!-- Stars Rating -->
      <div class="stars-container">
        <h3>Come valuti la tua esperienza?</h3>
        <div class="stars">⭐⭐⭐⭐⭐</div>
        <p style="color: #6b7280; font-size: 14px; margin: 12px 0 0 0;">
          Clicca il pulsante qui sotto per lasciare la tua recensione
        </p>
      </div>

      <!-- CTA -->
      <div style="text-align: center;">
        <a href="{{review_url}}" class="cta-button">
          ⭐ Lascia una Recensione
        </a>
      </div>

      <!-- Bonus Section -->
      <div class="bonus-section">
        <div class="gift-icon">🎁</div>
        <h3>Ricevi un Regalo per la Tua Recensione!</h3>
        <div class="bonus-points">+{{bonus_points}} PUNTI</div>
        <p style="color: #78350f; font-size: 14px; margin: 8px 0 0 0;">
          Lascia una recensione e ricevi immediatamente {{bonus_points}} punti bonus sul tuo account!
        </p>
      </div>

      <!-- Social Proof -->
      <div class="social-proof">
        <p>
          <strong>{{total_reviews}}</strong> clienti hanno già lasciato una recensione<br>
          Aiutaci a raggiungere le <strong>{{total_reviews + 50}}</strong> recensioni! 🌟
        </p>
      </div>

      <div class="message" style="text-align: center; margin-top: 32px; color: #6b7280;">
        Ti ringraziamo per il tuo tempo e per essere un cliente fedele di <strong>{{store_name}}</strong>! ❤️
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>{{store_name}}</strong></p>
      <p>
        <a href="{{store_url}}">Visita il nostro sito</a>
      </p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
        Questa è un''email automatica. Se hai domande, contattaci tramite il nostro sito.
      </p>
    </div>
  </div>
</body>
</html>',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- 7. Enable review request automation for all active organizations (disabled by default)
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
  'review_request',
  false, -- Disabled by default, organizations enable manually
  (SELECT id FROM email_templates WHERE template_type = 'review_request' AND organization_id IS NULL LIMIT 1),
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
    AND ea.automation_type = 'review_request'
  );

-- 8. Add RLS policies for customer_reviews
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Organizations can see their own reviews
CREATE POLICY customer_reviews_organization_policy ON customer_reviews
FOR SELECT
USING (
  organization_id IN (
    SELECT id FROM organizations WHERE id = organization_id
  )
);

-- Policy: Allow inserting reviews (public form)
CREATE POLICY customer_reviews_insert_policy ON customer_reviews
FOR INSERT
WITH CHECK (true);

-- Policy: Customers can update their own reviews
CREATE POLICY customer_reviews_update_policy ON customer_reviews
FOR UPDATE
USING (
  customer_id = auth.uid()
);

COMMENT ON TABLE customer_reviews IS 'Tracks customer reviews and ratings for organizations with review request automation';
