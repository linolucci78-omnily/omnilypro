# 🗓️ OMNILY PRO + OMNYCOIN - Roadmap 12 Settimane

**Obiettivo:** Lancio pilota Napoli con 50 merchant e 500 clienti attivi

**Budget:** €150k seed round  
**Timeline:** Gennaio - Marzo 2025  
**Team:** 1 Developer FT, 1 Sales FT, Founder (Lino)

---

## 📊 Overview Fasi

| Fase | Settimane | Focus | Budget | Output |
|------|-----------|-------|--------|--------|
| **Setup** | 1-2 | Legal, Tech, Team | €40k | SRL costituita, team hired |
| **Build** | 3-6 | Integrazione OMNY | €50k | App production-ready |
| **Launch** | 7-8 | Pilota Napoli | €20k | 50 merchant onboarded |
| **Scale** | 9-12 | Crescita & Funding | €40k | 500 clienti, Series A ready |

---

## 🔥 SETTIMANA 1: Legal & Company Setup

**Date:** 6-12 Gennaio 2025  
**Budget:** €15k  
**Owner:** Lino (Founder)

### Obiettivi
- ✅ Costituire OMNILY PRO SRL
- ✅ Consulenza legale crypto
- ✅ Contratti base pronti

### Task Dettagliati

#### Lunedì 6 Gen - Costituzione SRL
- [ ] Appuntamento commercialista (€500)
- [ ] Deposito capitale sociale €10k
- [ ] Firma atto costitutivo
- [ ] Richiesta P.IVA
- **Output:** OMNILY PRO SRL costituita

#### Martedì 7 Gen - Legal Crypto
- [ ] Call con Lexia Avvocati (€5k retainer)
- [ ] Brief su OmnyCoin e modello business
- [ ] Richiesta opinion letter classificazione token
- **Output:** Legal counsel ingaggiato

#### Mercoledì 8 Gen - Contratti
- [ ] Draft Terms & Conditions merchant (€2k)
- [ ] Draft Privacy Policy GDPR (€1.5k)
- [ ] Draft Cookie Policy (€500)
- **Output:** Contratti base v1

#### Giovedì 9 Gen - Compliance Setup
- [ ] Setup KYC provider (Onfido trial)
- [ ] Registrazione Stripe Business account
- [ ] Setup Supabase production project
- **Output:** Infrastruttura compliance

#### Venerdì 10 Gen - Banking
- [ ] Apertura conto business (Revolut Business)
- [ ] Setup accounting software (Fatture in Cloud)
- [ ] Prima fattura emessa (test)
- **Output:** Banking operativo

### KPI Settimana 1
- ✅ SRL costituita: Sì/No
- ✅ Legal counsel: Ingaggiato
- ✅ Contratti: 3/3 draft completati
- ✅ Budget speso: €15k / €15k

---

## 👥 SETTIMANA 2: Team Hiring

**Date:** 13-19 Gennaio 2025  
**Budget:** €25k (primi stipendi + onboarding)  
**Owner:** Lino

### Obiettivi
- ✅ Assumere 1 Full-time Developer
- ✅ Assumere 1 Sales/BizDev
- ✅ Onboarding team

### Task Dettagliati

#### Lunedì 13 Gen - Job Posting
- [ ] Pubblicare annuncio Developer (LinkedIn, Indeed)
  - React/TypeScript expert
  - Blockchain experience (nice to have)
  - €50k/anno
- [ ] Pubblicare annuncio Sales (LinkedIn)
  - B2B sales experience
  - Napoli-based
  - €40k/anno + commission
- **Output:** 2 job posting live

#### Martedì-Mercoledì 14-15 Gen - Screening
- [ ] Review 50+ CV Developer
- [ ] Review 30+ CV Sales
- [ ] Shortlist 10 candidati per ruolo
- [ ] Call screening (30min ciascuno)
- **Output:** 5 candidati finali per ruolo

#### Giovedì 16 Gen - Interviste
- [ ] Technical interview Developer (3 candidati)
  - Coding challenge (2h)
  - System design OmnilyPro
- [ ] Sales interview (3 candidati)
  - Role play pitch merchant
  - Motivazione e fit culturale
- **Output:** 2 finalisti per ruolo

#### Venerdì 17 Gen - Offer & Onboarding
- [ ] Offer letter Developer (€50k)
- [ ] Offer letter Sales (€40k)
- [ ] Contratti CCNL Commercio
- [ ] Setup email aziendale (@omnilypro.app)
- [ ] Access a GitHub, Supabase, tools
- **Output:** Team completo

### Onboarding Week (18-19 Gen)
- [ ] Developer: Setup ambiente dev, review codebase
- [ ] Sales: Training prodotto, CRM setup (HubSpot free)
- [ ] Team meeting: Roadmap 12 settimane
- **Output:** Team operativo

### KPI Settimana 2
- ✅ Developer hired: Sì/No
- ✅ Sales hired: Sì/No
- ✅ Onboarding completato: 100%
- ✅ Budget speso: €25k

---

## 💻 SETTIMANA 3-4: OmnyCoin Integration (Fase 1)

**Date:** 20 Gen - 2 Feb 2025  
**Budget:** €10k (developer salary + tools)  
**Owner:** Developer + Lino (review)

### Obiettivi
- ✅ Wallet custodial per clienti
- ✅ Dashboard "Compra OMNY" per merchant
- ✅ Meta-transactions (gasless)

### Settimana 3 (20-26 Gen)

#### Sprint Planning (Lunedì 20 Gen)
- [ ] Review Integration Guide
- [ ] Setup Jira/Linear per task tracking
- [ ] Sprint goal: Wallet custodial + Buy OMNY
- **Output:** Sprint backlog definito

#### Development (Martedì-Venerdì)
- [ ] Implementa `CustodialWalletService.ts`
  - Wallet creation con encryption
  - Recovery via email
  - Database schema update
- [ ] Implementa `BuyOMNYDashboard.tsx`
  - Stripe Checkout integration
  - Webhook handler
  - Transaction logging
- [ ] Testing locale
- **Output:** 2 feature complete (local)

### Settimana 4 (27 Gen - 2 Feb)

#### Development (Lunedì-Mercoledì)
- [ ] Implementa `GasRelayer.ts`
  - Meta-transaction signing
  - Relayer execution
  - Nonce management
- [ ] Smart contract upgrade (se necessario)
  - Aggiungere `executeMetaTransaction` function
  - Deploy su Polygon testnet
  - Test con 10 transazioni
- **Output:** Gasless transactions funzionanti

#### Testing & QA (Giovedì-Venerdì)
- [ ] Test end-to-end flow completo
  - Merchant compra 10k OMNY
  - Cliente riceve wallet automatico
  - Merchant regala OMNY (gasless)
  - Cliente spende OMNY
- [ ] Fix bugs critici
- [ ] Code review Lino
- **Output:** MVP OmnyCoin integration

### KPI Settimana 3-4
- ✅ Features completate: 3/3
- ✅ Test passed: 100%
- ✅ Bugs critici: 0
- ✅ Code coverage: >80%

---

## 🧪 SETTIMANA 5-6: Testing & Compliance

**Date:** 3-16 Febbraio 2025  
**Budget:** €15k (audit + legal)  
**Owner:** Developer (tech) + Lino (legal)

### Settimana 5 (3-9 Feb)

#### Smart Contract Audit
- [ ] Ingaggiare CertiK o Quantstamp (€8k)
- [ ] Fornire documentazione contratto
- [ ] Review findings
- [ ] Fix vulnerabilità (se presenti)
- **Output:** Audit report + fixes

#### Security Testing
- [ ] Penetration test app (€2k)
- [ ] Vulnerability scan (OWASP Top 10)
- [ ] Fix security issues
- **Output:** Security report

### Settimana 6 (10-16 Feb)

#### Legal Finalization
- [ ] Ricevere opinion letter Lexia (€5k)
- [ ] Finalizzare Terms & Conditions
- [ ] Finalizzare Privacy Policy
- [ ] DPIA con DPO
- **Output:** Compliance completa

#### Production Deploy
- [ ] Deploy su Vercel production
- [ ] Setup monitoring (Sentry)
- [ ] Setup analytics (PostHog)
- [ ] Smoke test production
- **Output:** App live su omnilypro.com

### KPI Settimana 5-6
- ✅ Audit completato: Sì
- ✅ Vulnerabilità critiche: 0
- ✅ Legal docs: Finalizzati
- ✅ Production deploy: Live

---

## 🚀 SETTIMANA 7-8: Lancio Pilota Napoli

**Date:** 17 Feb - 2 Mar 2025  
**Budget:** €20k (marketing + incentivi)  
**Owner:** Sales + Lino

### Obiettivo
**50 merchant onboarded in 2 settimane**

### Settimana 7 (17-23 Feb)

#### Preparazione Lancio (Lunedì-Martedì)
- [ ] Stampare 500 flyer (€200)
- [ ] Preparare demo kit (tablet + materiali)
- [ ] Training Sales su pitch (2 giorni)
- [ ] Lista 200 merchant target (Google Maps)
- **Output:** Sales kit pronto

#### Outreach Massivo (Mercoledì-Venerdì)
- [ ] Cold calling 100 merchant/giorno
- [ ] Visite porta-a-porta quartiere Vomero
- [ ] Demo live a 20 merchant
- [ ] Chiudere primi 10 merchant
- **Incentivo:** Primi 50 merchant → 3 mesi gratis
- **Output:** 10 merchant signed

### Settimana 8 (24 Feb - 2 Mar)

#### Scale Outreach
- [ ] Calling 150 merchant/giorno
- [ ] Espandere a Chiaia e Centro Storico
- [ ] Demo a 30 merchant
- [ ] Chiudere altri 40 merchant
- **Output:** 50 merchant totali

#### Onboarding Merchant
- [ ] Spedire POS ZCS108S (50 unità × €150 = €7.5k)
- [ ] Setup account per ciascun merchant
- [ ] Training remoto (video call 30min)
- [ ] Primo acquisto OMNY (10k OMNY × €0.10 = €1k cad)
- **Output:** 50 merchant operativi

### KPI Settimana 7-8
- ✅ Merchant signed: 50
- ✅ POS spediti: 50
- ✅ Merchant attivi: 45+ (90% activation)
- ✅ OMNY venduti: 500k (€50k revenue)

---

## 📈 SETTIMANA 9-10: Crescita Clienti

**Date:** 3-16 Marzo 2025  
**Budget:** €15k (marketing clienti)  
**Owner:** Sales + Developer (analytics)

### Obiettivo
**500 clienti attivi con wallet OMNY**

### Settimana 9 (3-9 Mar)

#### Marketing Locale
- [ ] Campagna Facebook Ads Napoli (€3k)
  - Target: 25-45 anni, Napoli
  - Messaggio: "Guadagna OMNY gratis"
  - Landing: omnilypro.com/napoli
- [ ] Volantinaggio quartieri (€1k)
- [ ] Partnership influencer locali (€2k)
- **Output:** 200 download app

#### In-Store Activation
- [ ] Merchant promuovono OMNY in negozio
- [ ] QR code su vetrina "Scarica app"
- [ ] Incentivo: 50 OMNY gratis al signup
- **Output:** 150 signup organici

### Settimana 10 (10-16 Mar)

#### Referral Program
- [ ] Implementare referral (Developer)
  - Invita amico → 20 OMNY per entrambi
- [ ] Merchant incentivano referral
- **Output:** 150 clienti da referral

#### Analytics & Optimization
- [ ] Analizzare funnel conversione
- [ ] A/B test messaging
- [ ] Ottimizzare onboarding app
- **Output:** Conversion rate +30%

### KPI Settimana 9-10
- ✅ Clienti totali: 500
- ✅ Wallet creati: 500
- ✅ OMNY distribuiti: 25k (€2.5k valore)
- ✅ Transazioni: 1000+

---

## 💰 SETTIMANA 11-12: Metriche & Series A Prep

**Date:** 17-30 Marzo 2025  
**Budget:** €10k (pitch materials)  
**Owner:** Lino + Team

### Obiettivo
**Preparare Series A (€2M) con traction solida**

### Settimana 11 (17-23 Mar)

#### Data Room Preparation
- [ ] Financial model aggiornato con dati reali
- [ ] Pitch deck v2 con traction
- [ ] Metrics dashboard (Grafana)
- [ ] Customer testimonials (video)
- **Output:** Data room completo

#### Metrics Review
**Target KPI Fine Pilota:**
- MRR: €4.5k (50 merchant × €99 - 3 mesi gratis)
- Clienti attivi: 500
- OMNY in circolazione: 50k
- Redemption rate: 15%
- NPS merchant: >50
- Churn merchant: <5%

### Settimana 12 (24-30 Mar)

#### Investor Outreach
- [ ] Lista 30 VC Italia/EU (€2M+ ticket)
- [ ] Email intro warm (via network)
- [ ] 10 pitch meeting schedulati
- [ ] Demo day preparation
- **Output:** Pipeline investitori

#### Team Retrospective
- [ ] Review 12 settimane
- [ ] Lessons learned
- [ ] Roadmap Q2 2025
- [ ] Celebration! 🎉
- **Output:** Plan Q2

### KPI Settimana 11-12
- ✅ Data room: Completo
- ✅ Investor meetings: 10
- ✅ Series A target: €2M
- ✅ Valuation: €10-15M

---

## 📊 Budget Breakdown Totale

| Categoria | Settimana | Costo | Dettaglio |
|-----------|-----------|-------|-----------|
| **Legal & Setup** | 1 | €15k | SRL, legal, contratti |
| **Team Hiring** | 2 | €25k | Stipendi + onboarding |
| **Development** | 3-4 | €10k | Salary developer |
| **Testing & Compliance** | 5-6 | €15k | Audit + legal finalization |
| **Lancio Pilota** | 7-8 | €20k | Marketing + POS hardware |
| **Crescita Clienti** | 9-10 | €15k | Marketing clienti |
| **Series A Prep** | 11-12 | €10k | Pitch materials |
| **Operativo** | 1-12 | €40k | Salari mensili, tools, misc |
| **TOTALE** | | **€150k** | Seed round completo |

---

## 🎯 Milestone Critiche

### M1: Legal & Team (Fine Settimana 2)
- ✅ SRL costituita
- ✅ Team completo (2 persone)
- ✅ Contratti legali pronti
- **Go/No-Go:** Se non raggiunto → ritardo 2 settimane

### M2: Tech Ready (Fine Settimana 6)
- ✅ OmnyCoin integration completa
- ✅ Audit security passed
- ✅ Production deploy live
- **Go/No-Go:** Se non raggiunto → no lancio pilota

### M3: Pilota Launched (Fine Settimana 8)
- ✅ 50 merchant onboarded
- ✅ 45+ merchant attivi
- ✅ €50k revenue OMNY venduti
- **Go/No-Go:** Se <30 merchant → pivot strategia

### M4: Traction Validated (Fine Settimana 12)
- ✅ 500 clienti attivi
- ✅ €4.5k MRR
- ✅ 10 investor meetings
- **Go/No-Go:** Se non raggiunto → extend runway

---

## 🚨 Risk Management

### Rischio: Developer non trova in tempo
- **Probabilità:** Media
- **Impatto:** Alto (ritardo 4 settimane)
- **Mitigazione:**
  - Iniziare recruiting SUBITO
  - Backup: Freelance agency (più costoso)
  - Lino fa pair programming

### Rischio: Merchant non adottano
- **Probabilità:** Media
- **Impatto:** Critico (no business)
- **Mitigazione:**
  - Incentivo 3 mesi gratis
  - POS hardware incluso
  - Onboarding white-glove
  - Pivot pricing se necessario

### Rischio: Legal blocker
- **Probabilità:** Bassa
- **Impatto:** Alto (stop deployment)
- **Mitigazione:**
  - Opinion letter preventiva
  - Legal counsel on retainer
  - Fallback: Solo punti tradizionali (no OMNY)

### Rischio: Budget overrun
- **Probabilità:** Media
- **Impatto:** Medio
- **Mitigazione:**
  - Buffer €20k (non allocato)
  - Monthly burn review
  - Cut marketing se necessario

---

## 📞 Weekly Sync

**Ogni Lunedì 9:00 - Team Standup (30min):**
- Review KPI settimana precedente
- Blockers e rischi
- Priorità settimana corrente
- Budget check

**Ogni Venerdì 17:00 - Retrospective (1h):**
- Wins della settimana
- Lessons learned
- Adjust roadmap se necessario

---

## 🎉 Success Criteria (Fine 12 Settimane)

✅ **Product:**
- OmnyCoin integration production-ready
- 0 bugs critici
- Audit security passed

✅ **Business:**
- 50 merchant paganti (post trial)
- 500 clienti attivi
- €4.5k MRR
- €50k revenue one-time (OMNY sales)

✅ **Funding:**
- 10 investor meetings
- 2 term sheets
- Series A €2M secured

✅ **Team:**
- 3 persone full-time
- Low churn (<10%)
- High morale

**Se raggiunti → OMNILY PRO è validato e pronto per scale nazionale! 🚀**

---

*Roadmap creata: 25 Novembre 2024*  
*Owner: Lino Lucci, Founder & CEO*  
*Next review: Ogni Lunedì*
