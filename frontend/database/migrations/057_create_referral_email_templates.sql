-- Migration 057: Create Referral Email Templates
-- Template email per il sistema referral

-- =====================================================
-- REFERRAL EMAIL TEMPLATES
-- =====================================================

-- 1. TEMPLATE: Email di Benvenuto per Nuovo Utente Referral
INSERT INTO email_templates (
  organization_id,
  template_type,
  name,
  description,
  subject,
  html_body,
  text_body,
  is_default,
  is_active
)
VALUES (
  NULL, -- Template globale
  'referral_welcome',
  'Benvenuto Referral',
  'Email di benvenuto per utenti che si iscrivono tramite codice referral',
  '🎉 Benvenuto {{customer_name}}! Ti aspettano {{welcome_bonus}} punti',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, {{primary_color}} 0%, {{secondary_color}} 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; }
    .header p { margin: 0; font-size: 18px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .content p { color: #333; line-height: 1.8; font-size: 16px; margin: 15px 0; }
    .bonus-card { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center; }
    .bonus-card h2 { margin: 0 0 10px 0; font-size: 48px; font-weight: bold; }
    .bonus-card p { margin: 0; font-size: 18px; opacity: 0.95; }
    .referrer-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid {{primary_color}}; }
    .referrer-info p { margin: 8px 0; color: #4b5563; }
    .cta-button { display: inline-block; background: {{primary_color}}; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; font-size: 16px; }
    .footer { background: #f9fafb; padding: 30px 20px; text-align: center; color: #6b7280; font-size: 14px; }
    .footer a { color: {{primary_color}}; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Benvenuto in {{store_name}}!</h1>
      <p>Sei stato invitato da {{referrer_name}}</p>
    </div>

    <div class="content">
      <p>Ciao <strong>{{customer_name}}</strong>,</p>

      <p>Che bella sorpresa! <strong>{{referrer_name}}</strong> ti ha invitato a unirti alla nostra community e noi siamo felicissimi di darti il benvenuto! 🌟</p>

      <div class="bonus-card">
        <h2>{{welcome_bonus}}</h2>
        <p>Punti di Benvenuto</p>
      </div>

      <p>Per ringraziarti di essere qui, abbiamo già aggiunto <strong>{{welcome_bonus}} punti</strong> al tuo account. Usali subito per ottenere sconti e premi esclusivi!</p>

      <div class="referrer-info">
        <p><strong>💝 Chi ti ha invitato:</strong> {{referrer_name}}</p>
        <p><strong>🎫 Codice usato:</strong> {{referral_code}}</p>
      </div>

      <p><strong>Come funziona il programma fedeltà:</strong></p>
      <ul style="color: #4b5563; line-height: 1.8;">
        <li>Accumula punti ad ogni acquisto</li>
        <li>Riscatta premi e sconti esclusivi</li>
        <li>Scala i livelli fedeltà per vantaggi sempre maggiori</li>
        <li>Invita i tuoi amici e guadagna ancora più punti!</li>
      </ul>

      <center>
        <a href="{{dashboard_url}}" class="cta-button">Vai al Tuo Account</a>
      </center>

      <p style="margin-top: 30px;">Non vediamo l''ora di vederti! 💚</p>

      <p style="margin-top: 25px; color: #6b7280; font-size: 14px;">
        P.S. Anche {{referrer_name}} ha ricevuto punti per averti invitato. È un win-win! 🎉
      </p>
    </div>

    <div class="footer">
      <p><strong>{{store_name}}</strong></p>
      <p>{{store_address}} | {{store_phone}}</p>
      <p style="margin-top: 15px;">
        <a href="{{website_url}}">Visita il nostro sito</a>
      </p>
    </div>
  </div>
</body>
</html>',
  'Ciao {{customer_name}},

Benvenuto in {{store_name}}! Sei stato invitato da {{referrer_name}} e siamo felici di averti qui!

🎉 PUNTI DI BENVENUTO: {{welcome_bonus}}

Per ringraziarti, abbiamo aggiunto {{welcome_bonus}} punti al tuo account. Usali per ottenere sconti e premi esclusivi!

Chi ti ha invitato: {{referrer_name}}
Codice usato: {{referral_code}}

COME FUNZIONA:
- Accumula punti ad ogni acquisto
- Riscatta premi e sconti esclusivi
- Scala i livelli fedeltà per vantaggi sempre maggiori
- Invita i tuoi amici e guadagna ancora più punti

Vai al tuo account: {{dashboard_url}}

Non vediamo l''ora di vederti!

{{store_name}}
{{store_address}} | {{store_phone}}
{{website_url}}',
  true,
  true
)
ON CONFLICT (organization_id, template_type, name) DO NOTHING;

-- 2. TEMPLATE: Notifica Conversione per Referrer
INSERT INTO email_templates (
  organization_id,
  template_type,
  name,
  description,
  subject,
  html_body,
  text_body,
  is_default,
  is_active
)
VALUES (
  NULL,
  'referral_notification',
  'Notifica Conversione Referral',
  'Email inviata quando qualcuno usa il tuo codice referral',
  '🎊 Ottima notizia! {{referee_name}} ha usato il tuo codice',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, {{primary_color}} 0%, {{secondary_color}} 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; }
    .emoji { font-size: 64px; margin: 20px 0; }
    .content { padding: 40px 30px; }
    .content p { color: #333; line-height: 1.8; font-size: 16px; margin: 15px 0; }
    .success-card { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center; }
    .success-card h2 { margin: 0 0 5px 0; font-size: 20px; font-weight: normal; opacity: 0.9; }
    .success-card .name { font-size: 32px; font-weight: bold; margin: 10px 0; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
    .stat-box { background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-box .number { font-size: 32px; font-weight: bold; color: {{primary_color}}; margin: 0; }
    .stat-box .label { font-size: 14px; color: #6b7280; margin: 8px 0 0 0; }
    .cta-button { display: inline-block; background: {{primary_color}}; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; font-size: 16px; }
    .share-section { background: #fffbeb; border: 2px dashed #f59e0b; padding: 25px; border-radius: 8px; margin: 30px 0; text-align: center; }
    .share-section h3 { color: #d97706; margin: 0 0 15px 0; }
    .footer { background: #f9fafb; padding: 30px 20px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji">🎊</div>
      <h1>Ottima Notizia!</h1>
      <p>Qualcuno ha usato il tuo codice referral</p>
    </div>

    <div class="content">
      <p>Ciao <strong>{{customer_name}}</strong>,</p>

      <p>Abbiamo una fantastica notizia da condividere con te! 🎉</p>

      <div class="success-card">
        <h2>Ha usato il tuo codice</h2>
        <div class="name">{{referee_name}}</div>
        <p style="margin: 15px 0 0 0; opacity: 0.95;">Codice: <strong>{{referral_code}}</strong></p>
      </div>

      <p><strong>{{referee_name}}</strong> si è registrato usando il tuo codice referral. Grazie per aver condiviso {{store_name}} con i tuoi amici!</p>

      <div class="stats-grid">
        <div class="stat-box">
          <p class="number">{{total_referrals}}</p>
          <p class="label">Referral Totali</p>
        </div>
        <div class="stat-box">
          <p class="number">{{total_points}}</p>
          <p class="label">Punti Guadagnati</p>
        </div>
      </div>

      <p><strong>Cosa succede ora?</strong></p>
      <ul style="color: #4b5563; line-height: 1.8;">
        <li>Quando {{referee_name}} farà il primo acquisto, riceverai <strong>{{points_per_purchase}} punti extra</strong></li>
        <li>I tuoi punti attuali continuano ad accumularsi</li>
        <li>Più amici inviti, più benefici ottieni</li>
      </ul>

      <center>
        <a href="{{referral_dashboard_url}}" class="cta-button">Vedi il Tuo Programma Referral</a>
      </center>

      <div class="share-section">
        <h3>💡 Invita altri amici!</h3>
        <p style="color: #78350f; margin: 10px 0;">Continua a condividere il tuo codice <strong>{{referral_code}}</strong> e guadagna ancora più punti!</p>
      </div>

      <p style="margin-top: 30px;">Grazie per essere un ambassador di {{store_name}}! 🌟</p>
    </div>

    <div class="footer">
      <p><strong>{{store_name}}</strong></p>
      <p>{{store_address}} | {{store_phone}}</p>
    </div>
  </div>
</body>
</html>',
  'Ciao {{customer_name}},

🎊 OTTIMA NOTIZIA!

{{referee_name}} ha usato il tuo codice referral!

Qualcuno si è registrato usando il tuo codice "{{referral_code}}". Grazie per aver condiviso {{store_name}} con i tuoi amici!

LE TUE STATISTICHE:
- Referral Totali: {{total_referrals}}
- Punti Guadagnati: {{total_points}}

COSA SUCCEDE ORA:
- Quando {{referee_name}} farà il primo acquisto, riceverai {{points_per_purchase}} punti extra
- I tuoi punti continuano ad accumularsi
- Più amici inviti, più benefici ottieni

Vedi il tuo programma referral: {{referral_dashboard_url}}

💡 INVITA ALTRI AMICI!
Continua a condividere il tuo codice {{referral_code}} e guadagna ancora più punti!

Grazie per essere un ambassador di {{store_name}}!

{{store_name}}
{{store_address}} | {{store_phone}}',
  true,
  true
)
ON CONFLICT (organization_id, template_type, name) DO NOTHING;

-- 3. TEMPLATE: Ricompensa Referral Completato
INSERT INTO email_templates (
  organization_id,
  template_type,
  name,
  description,
  subject,
  html_body,
  text_body,
  is_default,
  is_active
)
VALUES (
  NULL,
  'referral_reward',
  'Ricompensa Referral',
  'Email inviata quando un referral è completato e si ricevono punti',
  '💰 Hai guadagnato {{points_earned}} punti! Referral completato',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; }
    .emoji { font-size: 72px; margin: 20px 0; }
    .content { padding: 40px 30px; }
    .content p { color: #333; line-height: 1.8; font-size: 16px; margin: 15px 0; }
    .points-card { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; border-radius: 12px; margin: 30px 0; text-align: center; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3); }
    .points-card h2 { margin: 0 0 10px 0; font-size: 56px; font-weight: bold; }
    .points-card p { margin: 0; font-size: 20px; opacity: 0.95; }
    .balance-box { background: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center; border: 2px solid #e5e7eb; }
    .balance-box .label { color: #6b7280; margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .balance-box .amount { color: {{primary_color}}; margin: 0; font-size: 42px; font-weight: bold; }
    .tier-badge { display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 12px 24px; border-radius: 20px; margin: 20px 0; font-weight: bold; }
    .cta-button { display: inline-block; background: {{primary_color}}; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; font-size: 16px; }
    .footer { background: #f9fafb; padding: 30px 20px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji">💰</div>
      <h1>Referral Completato!</h1>
      <p>Hai appena guadagnato punti</p>
    </div>

    <div class="content">
      <p>Ciao <strong>{{customer_name}}</strong>,</p>

      <p>Fantastico! Il tuo amico <strong>{{referee_name}}</strong> ha completato il primo acquisto. 🎉</p>

      <div class="points-card">
        <h2>+{{points_earned}}</h2>
        <p>Punti Guadagnati</p>
      </div>

      <p>Come promesso, abbiamo aggiunto <strong>{{points_earned}} punti</strong> al tuo account per aver invitato {{referee_name}}.</p>

      <div class="balance-box">
        <p class="label">Saldo Punti Totale</p>
        <p class="amount">{{total_points}}</p>
      </div>

      {{#if new_tier}}
      <center>
        <div class="tier-badge">
          🏆 Nuovo Livello: {{new_tier}}
        </div>
      </center>
      <p style="text-align: center; color: #7c3aed; font-weight: bold;">Congratulazioni! Sei salito di livello!</p>
      {{/if}}

      <p><strong>Cosa puoi fare con i tuoi punti:</strong></p>
      <ul style="color: #4b5563; line-height: 1.8;">
        <li>Riscatta premi esclusivi</li>
        <li>Ottieni sconti sui tuoi acquisti</li>
        <li>Accedi a vantaggi riservati</li>
        <li>Continua a invitare amici per guadagnare ancora di più!</li>
      </ul>

      <center>
        <a href="{{rewards_url}}" class="cta-button">Scopri i Premi</a>
      </center>

      <p style="margin-top: 30px; padding: 20px; background: #fffbeb; border-radius: 8px; color: #78350f;">
        <strong>💡 Suggerimento:</strong> Continua a condividere il tuo codice <strong>{{referral_code}}</strong> con altri amici. Ogni nuovo referral completato ti farà guadagnare più punti!
      </p>
    </div>

    <div class="footer">
      <p><strong>{{store_name}}</strong></p>
      <p>{{store_address}} | {{store_phone}}</p>
    </div>
  </div>
</body>
</html>',
  'Ciao {{customer_name}},

💰 REFERRAL COMPLETATO!

Fantastico! Il tuo amico {{referee_name}} ha completato il primo acquisto.

HAI GUADAGNATO: +{{points_earned}} PUNTI

Come promesso, abbiamo aggiunto {{points_earned}} punti al tuo account.

SALDO PUNTI TOTALE: {{total_points}}

{{#if new_tier}}
🏆 NUOVO LIVELLO: {{new_tier}}
Congratulazioni! Sei salito di livello!
{{/if}}

COSA PUOI FARE:
- Riscatta premi esclusivi
- Ottieni sconti sui tuoi acquisti
- Accedi a vantaggi riservati
- Continua a invitare amici per guadagnare ancora di più

Scopri i premi: {{rewards_url}}

💡 SUGGERIMENTO: Continua a condividere il tuo codice {{referral_code}} con altri amici. Ogni nuovo referral completato ti farà guadagnare più punti!

{{store_name}}
{{store_address}} | {{store_phone}}',
  true,
  true
)
ON CONFLICT (organization_id, template_type, name) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN email_templates.template_type IS 'Tipi supportati: receipt, welcome, notification, password_reset, referral_welcome, referral_notification, referral_reward';
