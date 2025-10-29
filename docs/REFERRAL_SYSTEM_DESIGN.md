# 🎯 OMNILY PRO - Referral System Design

## 📋 Overview

Sistema completo di referral/invito per incentivare i clienti esistenti a portare nuovi clienti, con ricompense automatiche e tracking dettagliato.

**Data Progettazione**: 29 Ottobre 2025
**Versione**: 1.0
**Status**: Design Phase

---

## 🎨 Concept & Value Proposition

### **Problema da Risolvere**
Le aziende vogliono crescere attraverso il passaparola (word-of-mouth) dei clienti soddisfatti, ma manca un sistema strutturato per:
- Incentivare i clienti a invitare amici
- Tracciare chi ha portato nuovi clienti
- Ricompensare automaticamente chi porta clienti
- Misurare l'efficacia del programma referral

### **Soluzione OMNILY**
Sistema referral universale che permette a ogni organizzazione di:
1. **Configurare il proprio programma referral** con regole personalizzate
2. **Dare ai clienti codici referral univoci** da condividere
3. **Tracciare automaticamente** quando un nuovo cliente usa un codice
4. **Ricompensare automaticamente** sia chi invita che chi viene invitato
5. **Analytics completo** per misurare ROI del programma

---

## 🏗️ Architettura Sistema

### **Tipi di Referral Supportati**

#### **1. Double-Sided Reward (Consigliato)**
- **Referrer** (chi invita): ottiene ricompensa quando l'amico completa azione
- **Referee** (chi è invitato): ottiene ricompensa di benvenuto
- **Esempio**: "Invita un amico, ottieni 5€ di credito e lui ottiene 5€"

#### **2. Referrer-Only Reward**
- Solo **Referrer** ottiene ricompensa
- **Referee** non ottiene nulla (oltre al servizio)
- **Esempio**: "Porta un amico e ottieni 10% di sconto"

#### **3. Referee-Only Reward**
- Solo **Referee** ottiene ricompensa di benvenuto
- **Referrer** non ottiene nulla
- **Esempio**: "Usa codice AMICO e ottieni 20% sul primo acquisto"

#### **4. Tiered Rewards (Multi-livello)**
- Ricompense crescenti in base al numero di referral
- **Esempio**:
  - 1-5 amici: 5€ per amico
  - 6-10 amici: 7€ per amico
  - 11+ amici: 10€ per amico

#### **5. Milestone Rewards**
- Bonus extra quando raggiungi determinati traguardi
- **Esempio**: "Invita 10 amici e ottieni membership gratuita per 1 mese"

---

## 💎 Tipi di Ricompense

### **1. Points (Punti Loyalty)**
```typescript
{
  type: 'points',
  amount: 100,
  multiplier: 1.5  // optional: moltiplicatore punti
}
```

### **2. Discount (Sconto %)**
```typescript
{
  type: 'discount_percentage',
  value: 20,  // 20% di sconto
  max_amount: 50,  // massimo 50€ di sconto
  valid_days: 30  // valido per 30 giorni
}
```

### **3. Fixed Amount (Credito Fisso)**
```typescript
{
  type: 'fixed_amount',
  value: 10,  // 10€ di credito
  currency: 'EUR',
  valid_days: 60
}
```

### **4. Free Item (Prodotto/Servizio Gratis)**
```typescript
{
  type: 'free_item',
  item_id: 'product_123',
  item_name: 'Caffè gratis',
  quantity: 1,
  valid_days: 30
}
```

### **5. Gift Certificate**
```typescript
{
  type: 'gift_certificate',
  amount: 25,
  currency: 'EUR',
  expiry_days: 90
}
```

### **6. Membership Upgrade**
```typescript
{
  type: 'membership_upgrade',
  template_id: 'premium_monthly',
  duration_months: 1  // 1 mese gratis
}
```

### **7. Loyalty Tier Boost**
```typescript
{
  type: 'tier_boost',
  tier_id: 'gold',
  duration_days: 30  // Gold tier per 30 giorni
}
```

---

## 🎯 Trigger Events (Quando Ricompensare)

### **Trigger per Referrer**

1. **on_signup**: Quando referee completa registrazione
2. **on_first_purchase**: Quando referee fa primo acquisto (più comune)
3. **on_purchase_amount**: Quando referee spende X€
4. **on_first_visit**: Quando referee visita per la prima volta
5. **on_points_earned**: Quando referee guadagna X punti
6. **on_membership_purchase**: Quando referee compra membership

### **Trigger per Referee**

1. **on_signup**: Subito alla registrazione (benvenuto immediato)
2. **on_first_login**: Al primo accesso
3. **on_profile_complete**: Quando completa il profilo

---

## 📊 Database Schema

### **Tabella: `referral_programs`**
```sql
CREATE TABLE referral_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Program Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,

  -- Program Type
  program_type VARCHAR(50) NOT NULL,
    -- 'double_sided', 'referrer_only', 'referee_only', 'tiered', 'milestone'

  -- Referrer Rewards
  referrer_reward_type VARCHAR(50),
    -- 'points', 'discount_percentage', 'fixed_amount', 'free_item',
    -- 'gift_certificate', 'membership_upgrade', 'tier_boost'
  referrer_reward_config JSONB,
    -- Configurazione specifica per tipo reward
  referrer_trigger VARCHAR(50),
    -- 'on_signup', 'on_first_purchase', 'on_purchase_amount', etc.
  referrer_trigger_condition JSONB,
    -- Condizioni trigger (es: {min_amount: 50} per on_purchase_amount)

  -- Referee Rewards
  referee_reward_type VARCHAR(50),
  referee_reward_config JSONB,
  referee_trigger VARCHAR(50),

  -- Tiered Rewards (optional)
  tier_config JSONB,
    -- [{min: 1, max: 5, reward: {...}}, {min: 6, max: 10, reward: {...}}]

  -- Milestone Rewards (optional)
  milestone_config JSONB,
    -- [{count: 10, reward: {...}}, {count: 25, reward: {...}}]

  -- Limits & Rules
  max_referrals_per_customer INT,  -- NULL = unlimited
  max_total_referrals INT,  -- Limite globale programma
  min_referee_purchase_amount DECIMAL(10,2),
  referee_must_be_new_customer BOOLEAN DEFAULT true,

  -- Validity
  start_date TIMESTAMP,
  end_date TIMESTAMP,

  -- Restrictions
  allowed_customer_segments JSONB,  -- Array di segmenti ammessi
  excluded_customer_ids JSONB,  -- Array di customer_id esclusi

  -- Sharing Options
  share_url_template TEXT,  -- Template URL per condivisione
  share_message_template TEXT,  -- Template messaggio per condivisione
  social_sharing_enabled BOOLEAN DEFAULT true,

  -- Tracking
  total_referrals INT DEFAULT 0,
  successful_referrals INT DEFAULT 0,
  total_rewards_given INT DEFAULT 0,
  total_revenue_generated DECIMAL(10,2) DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_referral_programs_org ON referral_programs(organization_id);
CREATE INDEX idx_referral_programs_active ON referral_programs(is_active);
```

### **Tabella: `referral_codes`**
```sql
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  program_id UUID REFERENCES referral_programs(id) ON DELETE CASCADE,

  -- Code Info
  code VARCHAR(50) UNIQUE NOT NULL,
  code_type VARCHAR(20) DEFAULT 'auto',  -- 'auto', 'custom', 'vanity'

  -- Owner (Referrer)
  referrer_customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  referrer_name VARCHAR(255),
  referrer_email VARCHAR(255),

  -- Status
  status VARCHAR(20) DEFAULT 'active',  -- 'active', 'paused', 'expired', 'exhausted'
  is_active BOOLEAN DEFAULT true,

  -- Usage Tracking
  total_uses INT DEFAULT 0,
  successful_conversions INT DEFAULT 0,
  pending_conversions INT DEFAULT 0,

  -- Limits
  max_uses INT,  -- NULL = unlimited
  expires_at TIMESTAMP,

  -- Sharing Stats
  times_shared INT DEFAULT 0,
  click_count INT DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,

  UNIQUE(organization_id, code)
);

CREATE INDEX idx_referral_codes_org ON referral_codes(organization_id);
CREATE INDEX idx_referral_codes_program ON referral_codes(program_id);
CREATE INDEX idx_referral_codes_referrer ON referral_codes(referrer_customer_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_active ON referral_codes(is_active, status);
```

### **Tabella: `referral_conversions`**
```sql
CREATE TABLE referral_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  program_id UUID REFERENCES referral_programs(id) ON DELETE CASCADE,
  code_id UUID REFERENCES referral_codes(id) ON DELETE CASCADE,

  -- Referrer (Chi ha invitato)
  referrer_customer_id UUID REFERENCES customers(id),
  referrer_name VARCHAR(255),

  -- Referee (Chi è stato invitato)
  referee_customer_id UUID REFERENCES customers(id),
  referee_name VARCHAR(255),
  referee_email VARCHAR(255),
  referee_phone VARCHAR(50),

  -- Conversion Info
  conversion_status VARCHAR(30) DEFAULT 'pending',
    -- 'pending', 'qualified', 'rewarded', 'cancelled', 'expired'

  -- Trigger Tracking
  signup_at TIMESTAMP,
  first_purchase_at TIMESTAMP,
  qualifying_purchase_amount DECIMAL(10,2),
  qualifying_transaction_id UUID,

  -- Rewards Given
  referrer_reward_given BOOLEAN DEFAULT false,
  referrer_reward_type VARCHAR(50),
  referrer_reward_details JSONB,
  referrer_reward_given_at TIMESTAMP,

  referee_reward_given BOOLEAN DEFAULT false,
  referee_reward_type VARCHAR(50),
  referee_reward_details JSONB,
  referee_reward_given_at TIMESTAMP,

  -- Attribution
  referral_source VARCHAR(50),  -- 'link', 'code_manual', 'qr', 'email', 'sms'
  referral_medium VARCHAR(50),  -- 'whatsapp', 'facebook', 'instagram', 'direct'
  landing_page_url TEXT,
  user_agent TEXT,
  ip_address VARCHAR(45),

  -- Revenue Impact
  total_revenue_generated DECIMAL(10,2) DEFAULT 0,
  lifetime_value DECIMAL(10,2) DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  converted_at TIMESTAMP
);

CREATE INDEX idx_referral_conversions_org ON referral_conversions(organization_id);
CREATE INDEX idx_referral_conversions_program ON referral_conversions(program_id);
CREATE INDEX idx_referral_conversions_code ON referral_conversions(code_id);
CREATE INDEX idx_referral_conversions_referrer ON referral_conversions(referrer_customer_id);
CREATE INDEX idx_referral_conversions_referee ON referral_conversions(referee_customer_id);
CREATE INDEX idx_referral_conversions_status ON referral_conversions(conversion_status);
CREATE INDEX idx_referral_conversions_date ON referral_conversions(created_at);
```

### **Tabella: `referral_rewards`**
```sql
CREATE TABLE referral_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  conversion_id UUID REFERENCES referral_conversions(id) ON DELETE CASCADE,

  -- Reward Info
  reward_type VARCHAR(20) NOT NULL,  -- 'referrer', 'referee'
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255),

  -- Reward Details
  reward_category VARCHAR(50),
    -- 'points', 'discount', 'credit', 'item', 'certificate', 'membership', 'tier'
  reward_config JSONB,
  reward_value DECIMAL(10,2),

  -- Status
  status VARCHAR(20) DEFAULT 'pending',
    -- 'pending', 'issued', 'redeemed', 'expired', 'cancelled'

  -- Redemption
  issued_at TIMESTAMP,
  redeemed_at TIMESTAMP,
  expires_at TIMESTAMP,

  -- Tracking
  redemption_code VARCHAR(100),  -- Per reward che richiedono codice
  redemption_details JSONB,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_referral_rewards_org ON referral_rewards(organization_id);
CREATE INDEX idx_referral_rewards_conversion ON referral_rewards(conversion_id);
CREATE INDEX idx_referral_rewards_customer ON referral_rewards(customer_id);
CREATE INDEX idx_referral_rewards_status ON referral_rewards(status);
```

### **Tabella: `referral_analytics`**
```sql
CREATE TABLE referral_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  program_id UUID REFERENCES referral_programs(id) ON DELETE CASCADE,

  -- Date Aggregation
  date DATE NOT NULL,
  hour INT,  -- NULL per daily aggregation, 0-23 per hourly

  -- Metrics
  new_codes_created INT DEFAULT 0,
  codes_shared INT DEFAULT 0,
  link_clicks INT DEFAULT 0,
  signups INT DEFAULT 0,
  conversions INT DEFAULT 0,

  -- Rewards
  referrer_rewards_issued INT DEFAULT 0,
  referee_rewards_issued INT DEFAULT 0,
  total_reward_value DECIMAL(10,2) DEFAULT 0,

  -- Revenue
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0,

  -- Conversion Funnel
  click_to_signup_rate DECIMAL(5,2),
  signup_to_conversion_rate DECIMAL(5,2),
  overall_conversion_rate DECIMAL(5,2),

  -- ROI
  cost_per_acquisition DECIMAL(10,2),
  return_on_investment DECIMAL(10,2),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(organization_id, program_id, date, hour)
);

CREATE INDEX idx_referral_analytics_org ON referral_analytics(organization_id);
CREATE INDEX idx_referral_analytics_program ON referral_analytics(program_id);
CREATE INDEX idx_referral_analytics_date ON referral_analytics(date);
```

---

## 🎨 Frontend Components

### **1. Admin Dashboard: Referral Programs Management**

**Route**: `/admin/referrals`

**Features**:
- Lista tutti i programmi referral di tutte le organizzazioni
- Statistiche globali (conversion rate, revenue, top performers)
- Filtri per organizzazione, status, performance
- Export report CSV/PDF

**Components**:
```
AdminReferralDashboard/
├── AdminReferralDashboard.tsx
├── AdminReferralDashboard.css
├── ProgramsTable.tsx
├── GlobalStatsCards.tsx
├── TopReferrersTable.tsx
└── PerformanceCharts.tsx
```

### **2. Organization Dashboard: Referral Management**

**Location**: `OrganizationsDashboard` → Tab "Programma Referral"

**Features**:
- **Gestione Programmi**:
  - Create/Edit/Delete programmi referral
  - Configurazione rewards e trigger
  - Impostazioni condivisione

- **Codici Referral**:
  - Assegna codici a clienti
  - Genera codici bulk
  - Gestisci codici custom/vanity

- **Conversioni**:
  - Tracking conversioni in tempo reale
  - Approvazione manuale conversioni (se richiesto)
  - Gestione rewards pending

- **Analytics**:
  - Dashboard metriche programma
  - Top referrers leaderboard
  - Conversion funnel
  - ROI calculator

**Components**:
```
ReferralManagementPanel/
├── ReferralManagementPanel.tsx
├── ReferralManagementPanel.css
├── CreateProgramModal.tsx
├── ProgramConfigForm.tsx
├── CodesManager.tsx
├── ConversionsTable.tsx
├── RewardsQueue.tsx
└── ReferralAnalytics.tsx
```

### **3. Customer App: My Referral Dashboard**

**Location**: Customer Dashboard → "Invita Amici"

**Features**:
- **Il Mio Codice**:
  - Display codice referral personale
  - QR code per scan rapido
  - Share buttons (WhatsApp, Facebook, Email, SMS, Copy)

- **I Miei Inviti**:
  - Lista amici invitati
  - Status conversioni (pending, qualified, rewarded)
  - Rewards guadagnate

- **Progressi**:
  - Progress bar verso milestone
  - Tier attuale e prossimo tier
  - Rewards sbloccate e da sbloccare

- **Analytics Personali**:
  - Totale amici invitati
  - Conversion rate
  - Rewards totali ricevute

**Components**:
```
CustomerReferralDashboard/
├── CustomerReferralDashboard.tsx
├── CustomerReferralDashboard.css
├── MyReferralCodeCard.tsx
├── ShareButtons.tsx
├── InvitedFriendsList.tsx
├── ProgressTracker.tsx
└── RewardsEarnedList.tsx
```

### **4. Public Landing Page: Referral Signup**

**Route**: `/r/:code` o `/join/:code`

**Features**:
- Mostra chi ti ha invitato (nome + foto se permesso)
- Display reward di benvenuto
- Form registrazione pre-compilato con codice
- Trust indicators (reviews, testimonials)

**Components**:
```
ReferralLandingPage/
├── ReferralLandingPage.tsx
├── ReferralLandingPage.css
├── ReferrerInfoCard.tsx
├── WelcomeRewardCard.tsx
└── SignupFormWithCode.tsx
```

---

## 🔄 User Flows

### **Flow 1: Organization Setup Referral Program**

```
1. Admin accede a "Programma Referral" nel dashboard
2. Clicca "Crea Nuovo Programma"
3. Configura:
   - Nome programma (es: "Porta un Amico")
   - Tipo programma (Double-sided)
   - Reward referrer (10€ di credito al primo acquisto amico)
   - Reward referee (5€ di benvenuto alla registrazione)
   - Limiti (max 20 amici per persona)
   - Periodo validità
4. Preview messaggio condivisione
5. Attiva programma
6. Sistema genera automaticamente codici per clienti esistenti
```

### **Flow 2: Customer Invita Amico**

```
1. Cliente vede banner "Invita un amico e guadagna 10€"
2. Clicca "Invita Amici"
3. Vede il suo codice personale "MARIO2024"
4. Opzioni condivisione:
   - WhatsApp: messaggio pre-compilato con link
   - Facebook: post con immagine
   - Email: email template professionale
   - SMS: messaggio con codice
   - Copy link: copia link diretto
5. Condivide via WhatsApp con amico
```

### **Flow 3: Amico Riceve Invito e Si Registra**

```
1. Amico riceve messaggio WhatsApp con link
2. Clicca link → arriva su landing page personalizzata
3. Vede: "Mario ti ha invitato! Iscriviti e ricevi 5€ di benvenuto"
4. Compila form registrazione (email pre-compilata dal link)
5. Il codice "MARIO2024" è automaticamente applicato
6. Completa registrazione
7. Riceve subito reward 5€ di credito sul suo account
8. Sistema marca conversione come "pending" per Mario
```

### **Flow 4: Conversione Qualificata e Reward**

```
1. Amico fa il primo acquisto di 25€
2. Sistema verifica trigger "on_first_purchase"
3. Conversione passa da "pending" a "qualified"
4. Sistema eroga automaticamente:
   - 10€ di credito a Mario (referrer)
   - Notifica push a Mario: "Hai guadagnato 10€! Grazie per aver invitato [Nome Amico]"
5. Conversione passa a "rewarded"
6. Aggiorna statistiche programma
```

---

## 📱 Notification System

### **Eventi che Triggherano Notifiche**

#### **Per Referrer**:
1. ✅ **Amico si è registrato**: "🎉 [Nome] ha usato il tuo codice! Conversione pending..."
2. ✅ **Conversione qualificata**: "🎁 Hai guadagnato [reward]! [Nome] ha completato il primo acquisto"
3. 🏆 **Milestone raggiunto**: "🏆 Congratulazioni! Hai invitato 10 amici e sbloccato [bonus]"
4. 📈 **Tier upgrade**: "🚀 Sei passato al livello successivo! Ora guadagni [nuovo reward]"

#### **Per Referee**:
1. 👋 **Benvenuto**: "Benvenuto! Hai [reward] da usare sul tuo primo acquisto"
2. ⏰ **Reminder reward**: "Non dimenticare! Hai [reward] che scade tra 7 giorni"
3. 🎉 **Reward utilizzata**: "Hai usato il tuo reward! Risparmio: [amount]€"

#### **Per Organization Admin**:
1. 📊 **Daily summary**: "Ieri: 5 nuovi inviti, 3 conversioni, 150€ di revenue"
2. 🎯 **Program milestone**: "Il tuo programma referral ha raggiunto 100 conversioni!"
3. ⚠️ **Budget alert**: "Budget rewards al 80%"

---

## 🎯 Analytics & Reports

### **Dashboard Metrics**

#### **Overview KPIs**
- **Total Referrals**: Numero totale inviti inviati
- **Conversion Rate**: % inviti → clienti paganti
- **Revenue Generated**: Ricavi totali da referral
- **ROI**: Return on investment del programma
- **Avg. Reward Cost**: Costo medio per conversione
- **Customer LTV from Referrals**: Lifetime value clienti referral

#### **Funnel Metrics**
```
Link Shared → Click → Signup → First Purchase → Qualified
  1000      →  600  →  300   →      150       →    120
                60%     50%         50%              80%
```

#### **Top Performers**
- Leaderboard referrers (top 10-20)
- Best performing programs
- Highest converting channels (WhatsApp vs Email vs Direct)
- Best timeframes (ore/giorni con più conversioni)

#### **Segmentation Analysis**
- Performance per customer segment
- Performance per città/regione
- Performance per tipo di reward
- Performance per trigger type

### **Report Export**

**Formati**: CSV, PDF, Excel

**Report Disponibili**:
1. **Referral Activity Report**: Tutte le conversioni in periodo
2. **Rewards Issued Report**: Tutte le rewards erogate
3. **Top Referrers Report**: Classifica referrers
4. **Revenue Impact Report**: Analisi impatto su revenue
5. **ROI Analysis Report**: Costi vs benefici programma

---

## 🔐 Security & Fraud Prevention

### **Anti-Fraud Measures**

1. **Email Verification Obbligatoria**
   - Referee deve verificare email prima di qualificarsi
   - Previene fake accounts

2. **Device Fingerprinting**
   - Traccia device ID e browser fingerprint
   - Previene self-referral con account multipli

3. **IP Tracking & Limits**
   - Max 3 registrazioni dallo stesso IP in 24h
   - Flag conversioni sospette da stesso IP

4. **Purchase Verification**
   - Prima conversione richiede acquisto reale con pagamento
   - Previene fake purchases

5. **Manual Review Queue**
   - Conversioni sospette vanno in review manuale
   - Admin può approvare/rifiutare

6. **Referrer Limits**
   - Max referrals per customer (es: 50)
   - Rate limiting (es: max 5 nuovi codici/giorno)

7. **Blacklist**
   - Email domains blacklist (mailinator, temp-mail, etc)
   - Customer ID blacklist per abusers

### **Validation Rules**

```typescript
interface FraudCheck {
  // Device & Network
  sameIPAsReferrer: boolean;
  sameDeviceFingerprint: boolean;
  vpnDetected: boolean;

  // Account
  emailDomainSuspicious: boolean;
  accountAgeHours: number;
  emailVerified: boolean;
  phoneVerified: boolean;

  // Behavior
  timeBetweenSignupAndPurchase: number; // seconds
  purchaseAmountUnusual: boolean;
  userAgentSuspicious: boolean;

  // Scoring
  fraudScore: number; // 0-100
  requiresManualReview: boolean;
}
```

---

## 🚀 Implementation Phases

### **Phase 1: MVP (Settimana 1-2)**
- [ ] Database schema completo
- [ ] TypeScript types
- [ ] Basic referral program CRUD
- [ ] Code generation e assignment
- [ ] Tracking conversions base
- [ ] Reward issuance (solo points)
- [ ] Admin dashboard base
- [ ] Organization dashboard base

### **Phase 2: Customer Experience (Settimana 3)**
- [ ] Customer referral dashboard
- [ ] Share functionality (WhatsApp, Email, Copy)
- [ ] QR code generation
- [ ] Landing page `/r/:code`
- [ ] Welcome rewards
- [ ] Notifications system

### **Phase 3: Advanced Rewards (Settimana 4)**
- [ ] Multi-reward types support
- [ ] Tiered rewards
- [ ] Milestone rewards
- [ ] Discount coupons integration
- [ ] Gift certificate integration
- [ ] Membership integration

### **Phase 4: Analytics & Optimization (Settimana 5)**
- [ ] Complete analytics dashboard
- [ ] Conversion funnel visualization
- [ ] Top performers leaderboard
- [ ] ROI calculator
- [ ] A/B testing framework
- [ ] Report export (CSV, PDF)

### **Phase 5: Security & Scaling (Settimana 6)**
- [ ] Fraud detection system
- [ ] Manual review queue
- [ ] Rate limiting
- [ ] Email verification flow
- [ ] Blacklist management
- [ ] Performance optimization

---

## 💡 Use Cases per Business Type

### **🍕 Ristorante**
**Programma**: "Pranzo Gratis per 2"
- Referrer: Invita 5 amici → pranzo gratis per 2 persone
- Referee: 10% sconto primo ordine
- Trigger: on_first_purchase > 20€

### **💇 Salone Bellezza**
**Programma**: "Amiche Belle Insieme"
- Referrer: 15€ credito per ogni amica che prenota
- Referee: Primo taglio -20%
- Trigger: on_first_purchase

### **🏋️ Palestra**
**Programma**: "Allena un Amico"
- Referrer: 1 mese gratis ogni 3 amici
- Referee: Prova gratuita 7 giorni
- Trigger: on_membership_purchase

### **🛒 Negozio**
**Programma**: "Shopping Friends"
- Referrer: 10€ ogni acquisto amico > 50€
- Referee: Benvenuto 5€
- Trigger: on_purchase_amount > 50€

### **☕ Bar/Caffetteria**
**Programma**: "Caffè per Tutti"
- Referrer: Caffè gratis ogni 2 amici
- Referee: Primo caffè gratis
- Trigger: on_first_visit

---

## 🎨 UI/UX Best Practices

### **Referral Code Design**
```
✅ GOOD:
- MARIO2024
- SARA-CAFE
- LUCA10

❌ BAD:
- X7KP9QW2 (troppo complesso)
- a (troppo corto)
- 1234567890 (troppo lungo)
```

### **Share Message Template**
```
Ciao! 👋

Uso [Nome Business] e mi trovo benissimo!

Iscriviti con il mio codice MARIO2024 e ricevi [Reward] 🎁

👉 [Link]

A presto!
[Nome Referrer]
```

### **Landing Page Elements**
1. Hero con foto referrer (se permesso)
2. Clear value proposition (reward di benvenuto)
3. Social proof (reviews, testimonials)
4. Simple form (solo essenziale)
5. Trust badges (sicurezza, privacy)
6. Clear CTA ("Inizia Ora e Ricevi [Reward]")

---

## 📈 Success Metrics

### **Program Health**
- Conversion Rate > 10%
- ROI > 3x (revenue vs reward cost)
- Avg. referrals per customer > 2
- Referee retention rate > 60%

### **Engagement**
- % customers with referral code > 40%
- % customers who shared > 15%
- Avg. shares per customer > 2
- Click-through rate > 20%

### **Revenue Impact**
- % revenue from referrals > 15%
- Referee LTV vs regular customer LTV
- CAC reduction (vs paid ads)
- Organic growth rate

---

## 🔄 Integration Points

### **Con Altri Moduli OMNILY**

1. **Loyalty System**
   - Reward in punti loyalty
   - Tier boost come reward

2. **Gift Certificates**
   - Gift certificate come reward

3. **Membership**
   - Membership upgrade come reward
   - Trigger: membership purchase

4. **CRM**
   - Segmentazione referrers vs non-referrers
   - Campaigns targeted per top referrers

5. **Email Marketing**
   - Email automation per referral program
   - Reminder email per share code

6. **POS**
   - Apply referral code al checkout
   - Scan QR code per applicare referral

---

## 🎯 Next Steps

1. **Review questo documento** con team
2. **Validazione business requirements** con stakeholders
3. **Prioritize features** per MVP
4. **Database schema review** e ottimizzazioni
5. **UI mockups** per dashboard principale
6. **Start Phase 1 implementation**

---

**Document Version**: 1.0
**Last Updated**: 29 Ottobre 2025
**Status**: Ready for Implementation
**Estimated Effort**: 6 settimane full-time
