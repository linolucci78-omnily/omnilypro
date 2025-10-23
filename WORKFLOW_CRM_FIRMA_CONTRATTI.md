# 🎯 Workflow Completo CRM con Firma Contratti

## 📋 Panoramica

Il sistema CRM ora include un workflow completo dalla gestione lead fino alla firma del contratto con OTP.

---

## 🔄 Workflow Completo

### **FASE 1: Lead Management**
1. **Agente crea un nuovo lead** → Stage: `lead`
2. **Agente contatta il cliente** → Stage: `contacted`
3. **Demo fissata** → Stage: `demo_scheduled`
4. **Demo completata** → Stage: `demo_completed`
5. **Proposta inviata** → Stage: `proposal_sent`
6. **Negoziazione** → Stage: `negotiation`
7. **Contratto pronto** → Stage: `contract_ready`

### **FASE 2: Creazione Contratto**
Quando il lead è in stage `contract_ready`:

1. **Agente apre il lead** (clicca sulla card)
2. **Va al tab "Contratti"**
3. **Clicca "Nuovo Contratto"**
4. **Compila il form**:
   - Titolo (es. "Contratto POS Z108")
   - Tipo (Service Agreement, Subscription, NDA, Custom)
   - Valore (€)
   - Scadenza firma (giorni)
   - **Vendor Info** (la tua azienda):
     - Nome Azienda
     - P.IVA
     - Email
     - Indirizzo
   - Contenuto del contratto
5. **Salva il contratto** → Stato: `draft`

### **FASE 3: Preparazione Firma**
1. **Agente clicca "Procedi a Firma"** nella card del lead
2. **Lead si sposta allo stage** `sign_contract` (verde scuro)
3. **Appare il pulsante "Firma Contratto OTP"**

### **FASE 4: Invio Link Firma**
1. **Agente clicca "Firma Contratto OTP"**
2. **Sistema verifica** che esista un contratto
3. **Sistema naviga** a `/admin/contracts`
4. **Nella dashboard contratti**:
   - Trova il contratto del lead
   - Clicca "Richiedi Firma"
   - Inserisce i dati del firmatario:
     - Nome
     - Email
     - Telefono
     - Ruolo (client)
5. **Sistema genera link OTP** tipo:
   ```
   http://localhost:5175/contract-sign/abc-123-def-456
   ```

### **FASE 5: Firma Cliente (con OTP)**
1. **Cliente apre il link** (via email/SMS)
2. **STEP 1: Verifica Identità**
   - Sceglie metodo OTP (Email o SMS)
   - Clicca "Invia Codice OTP"
   - Riceve codice a 6 cifre (in dev: check console)
   - Inserisce il codice
   - Clicca "Verifica Codice"

3. **STEP 2: Firma Contratto**
   - Visualizza anteprima contratto completo
   - Legge tutti i termini
   - Tipo firma: "Firma Digitata"
   - Inserisce nome completo
   - ✅ Check "Confermo di aver letto..."
   - Clicca "Firma il Contratto"

4. **STEP 3: Completato**
   - ✅ Icona successo
   - Data/ora firma
   - Numero contratto
   - Messaggio conferma

### **FASE 6: Finalizzazione**
1. **Contratto passa a stato** `signed`
2. **Audit trail completo**:
   - OTP inviato
   - OTP verificato
   - Contratto firmato
   - IP address
   - User agent
   - Timestamp
3. **Lead può essere spostato** a stage `won`

---

## 🎨 Nuove Features UI/UX

### **1. Dashboard Personale Agente**
Accesso: Toggle "La Mia Dashboard" nel CRM

**Visualizza**:
- ✅ **Welcome Section** con data
- ✅ **6 Card Statistiche**:
  - Lead Attivi
  - Task Scaduti (urgente - rosso)
  - Task Oggi
  - Appuntamenti Oggi
  - Chiamate da Fare
  - Email da Inviare

- ✅ **4 Sezioni Azione**:
  - **Task Scaduti** (evidenziati rosso)
  - **Task di Oggi** con orari
  - **Appuntamenti Oggi** con orari
  - **I Miei Lead Principali** (top 5)

### **2. Kanban con Stage Firma Contratto**

**Nuovo Stage**: `sign_contract` (verde scuro)
- Posizione: Dopo `contract_ready`, prima di `won`
- Colore: #16a34a (verde scuro)
- Label: "Firma Contratto"

**Pulsanti nelle Card**:
1. **Stage `contract_ready`**:
   - Pulsante: "Procedi a Firma" (arancione)
   - Azione: Sposta lead a `sign_contract`

2. **Stage `sign_contract`**:
   - Pulsante: "Firma Contratto OTP" (verde)
   - Azione: Apre dashboard contratti per inviare link OTP

### **3. Design Migliorato (Krayin Style)**

**Modal Lead Detail**:
- Dimensioni: 1100px max-width, 88vh height
- Border radius: 20px
- Animazioni: fade-in overlay, slide-up modal
- Backdrop blur: 8px

**Kanban Cards**:
- Larghezza: 280px (era 240px)
- Padding: 1.25rem
- Hover: shadow elevata + trasformazione
- Transizioni: cubic-bezier smooth

**Colori**:
- Sfumature gradient per header
- Colori soft e professionali
- Badge arrotondati

---

## 📊 Stages CRM Completi

| Stage | Colore | Label | Descrizione |
|-------|--------|-------|-------------|
| `lead` | #94a3b8 | Lead | Nuovo lead inserito |
| `contacted` | #60a5fa | Contattato | Primo contatto effettuato |
| `demo_scheduled` | #3b82f6 | Demo Fissata | Demo/presentazione fissata |
| `demo_completed` | #8b5cf6 | Demo Completata | Demo effettuata |
| `proposal_sent` | #a855f7 | Proposta Inviata | Proposta commerciale inviata |
| `negotiation` | #ec4899 | Negoziazione | In fase di trattativa |
| `contract_ready` | #f59e0b | Contratto Pronto | Contratto creato, pronto per firma |
| **`sign_contract`** | **#16a34a** | **Firma Contratto** | **NUOVO: In attesa firma OTP** |
| `won` | #10b981 | Vinto | Deal chiuso con successo |
| `lost` | #ef4444 | Perso | Deal perso |

---

## 🧪 Come Testare

### **Test 1: Workflow Completo Lead → Firma**

1. **Crea un nuovo lead**
   - Vai a `/admin/crm`
   - Clicca "Nuovo Lead"
   - Compila form e salva

2. **Sposta attraverso gli stage**
   - Drag & drop la card attraverso le colonne
   - Oppure: apri lead → cambia stage

3. **Arriva a "Contratto Pronto"**
   - Apri il lead (clicca card)
   - Tab "Contratti"
   - "Nuovo Contratto"
   - Compila tutti i campi
   - Salva

4. **Procedi a Firma**
   - Nella card del lead in Kanban
   - Clicca "Procedi a Firma"
   - Lead si sposta a colonna "Firma Contratto" (verde)

5. **Prepara Firma OTP**
   - Clicca "Firma Contratto OTP"
   - Vai a dashboard contratti
   - Clicca "Richiedi Firma" sul contratto
   - Inserisci dati firmatario
   - Copia link generato

6. **Simula Firma Cliente**
   - Apri link in incognito
   - Richiedi OTP (check console per codice)
   - Verifica OTP
   - Firma contratto
   - ✅ Successo!

### **Test 2: Dashboard Agente**

1. **Toggle vista**
   - Vai a `/admin/crm`
   - Clicca "La Mia Dashboard"

2. **Verifica visualizzazione**
   - Statistiche aggiornate
   - Task scaduti evidenziati
   - Task oggi con orari
   - Appuntamenti oggi
   - Lead principali

3. **Interazione**
   - Clicca task → vai a dettaglio
   - Clicca appuntamento → vai a dettaglio
   - Clicca lead → apre modal

---

## 🎯 Best Practices per Agenti

### **Gestione Giornaliera**
1. ✅ **Mattina**: Controlla "La Mia Dashboard"
2. ✅ **Prima cosa**: Risolvi task scaduti (rossi)
3. ✅ **Pianifica**: Guarda task e appuntamenti oggi
4. ✅ **Follow-up**: Chiama lead in lista "Top 5"

### **Processo Vendita**
1. ✅ Lead → Contacted: Entro 24h
2. ✅ Demo: Fissa entro 1 settimana
3. ✅ Proposta: Invia entro 48h da demo
4. ✅ Contratto: Prepara quando cliente conferma
5. ✅ Firma: Invia link OTP immediatamente

### **Contratti**
- ✅ Crea contratto solo quando cliente è pronto
- ✅ Compila TUTTI i campi Vendor Info
- ✅ Controlla contenuto prima di inviare
- ✅ Imposta scadenza firma realistica (7-15 giorni)
- ✅ Follow-up se non firma entro 3 giorni

---

## 🔐 Sicurezza e Compliance

Il sistema implementa:

### **eIDAS (EU)**
- ✅ Identificazione firmatario via OTP
- ✅ Timestamp RFC 3161
- ✅ Audit trail immutabile
- ✅ Consenso esplicito

### **ESIGN Act (US)**
- ✅ Intent to sign (checkbox)
- ✅ Consent to electronic records
- ✅ Attribution (IP + user agent)
- ✅ Retention of records

### **GDPR**
- ✅ Dati crittografati
- ✅ Audit trail completo
- ✅ Diritto accesso dati
- ✅ Conservazione sicura

---

## 📱 URL Importanti

- **CRM**: `http://localhost:5175/admin/crm`
- **Dashboard Contratti**: `http://localhost:5175/admin/contracts`
- **Link Firma** (esempio): `http://localhost:5175/contract-sign/{uuid}`

---

## 🐛 Troubleshooting

### Problema: "Nessun contratto trovato"
**Soluzione**: Crea prima un contratto nel tab "Contratti" del lead

### Problema: OTP non arriva
**Soluzione**: In dev, controlla la console del browser per il codice

### Problema: Lead non si sposta
**Soluzione**: Ricarica la pagina, verifica permessi utente

### Problema: Dashboard agente vuota
**Soluzione**: Assicurati che l'utente abbia task/appuntamenti/lead assegnati

---

## 🚀 Prossimi Sviluppi

1. ✅ Integrazione email provider (SendGrid)
2. ✅ Integrazione SMS provider (Twilio)
3. ✅ Generazione PDF firmato
4. ✅ Multi-firma (più firmatari)
5. ✅ Promemoria automatici
6. ✅ Template contratti predefiniti

---

**Sistema Pronto per il Test! 🎉**

Accedi a: `http://localhost:5175/admin/crm`
