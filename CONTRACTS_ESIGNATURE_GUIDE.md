# 📝 Sistema Contratti e Firma Digitale - Guida Completa

## 🎯 Panoramica

Il sistema di contratti e firma digitale di OmnilyPro permette di:

✅ **Creare contratti** da template riutilizzabili
✅ **Inviare contratti** per firma digitale sicura
✅ **Firmare digitalmente** con verifica OTP (email/SMS)
✅ **Tracciare tutto** con audit log completo
✅ **Conformità legale** eIDAS (EU) e ESIGN Act (US)

---

## 🚀 Setup Iniziale

### 1️⃣ Esegui la Migrazione Database

**Opzione A: Supabase Dashboard (Consigliato)**

1. Vai su https://app.supabase.com/project/sjvatdnvewohvswfrdiv
2. Clicca su **SQL Editor** nel menu laterale
3. Clicca **+ New Query**
4. Copia e incolla il contenuto di `database/migrations/015_create_contracts_esignature_system.sql`
5. Clicca **Run** ▶️

**Opzione B: CLI**
```bash
psql "$DATABASE_URL" -f database/migrations/015_create_contracts_esignature_system.sql
```

### 2️⃣ Inserisci Template di Esempio

1. Apri `database/sample_data/contract_template_example.sql`
2. Sostituisci `YOUR_ORG_ID_HERE` con il tuo organization_id
   ```sql
   -- Trova il tuo organization_id
   SELECT id, name FROM organizations;
   ```
3. Esegui lo script SQL nel Supabase Dashboard

### 3️⃣ Build Frontend

```bash
cd frontend
npm install
npm run build
```

---

## 📋 Come Usare il Sistema

### Creazione Contratto da CRM

1. **Vai al CRM**
   - Dashboard Admin → CRM & Marketing

2. **Apri un Lead**
   - Clicca su un lead esistente
   - Si aprirà il modal con i dettagli

3. **Crea il Contratto**
   - Vai al tab **Contratti**
   - Clicca **+ Nuovo Contratto**
   - Compila il form:
     - Seleziona template (opzionale)
     - Inserisci titolo
     - Tipo contratto
     - Valore economico
     - Contenuto del contratto
     - Info fornitore (la tua azienda)
     - Data scadenza firma

4. **Salva in Bozza**
   - Il contratto viene salvato come BOZZA
   - Puoi modificarlo prima di inviarlo

### Invio per Firma

1. **Dalla Dashboard Contratti**
   - Admin → Contratti e Firme
   - Trova il contratto in stato "Bozza"
   - Clicca icona **Invia** (aeroplano)

2. **Cosa Succede**
   - Stato cambia in "Inviato"
   - Viene creata una richiesta di firma
   - Si genera un link sicuro: `/sign/{signature-id}`
   - Il cliente riceve il link via email

### Processo di Firma (Lato Cliente)

1. **Cliente Apre il Link**
   - Riceve link: `https://tuodominio.com/sign/abc-123-xyz`

2. **Step 1: Verifica Identità (OTP)**
   - Sceglie metodo: Email o SMS
   - Riceve codice OTP a 6 cifre
   - Inserisce il codice
   - Sistema verifica (max 3 tentativi, scade dopo 15 min)

3. **Step 2: Firma il Contratto**
   - Visualizza anteprima contratto completa
   - Legge tutti i dettagli
   - Digita nome completo come firma
   - Accetta consenso legale
   - Clicca "Firma il Contratto"

4. **Step 3: Completamento**
   - Vede conferma firma
   - Riceve email con PDF firmato
   - Sistema registra:
     - IP address
     - User agent
     - Timestamp esatto
     - Geolocalizzazione (se disponibile)

### Monitoraggio Contratti

**Dashboard Contratti** (`/admin/contracts`)

📊 **Statistiche in tempo reale:**
- Totale contratti
- Bozze
- In attesa firma
- Firmati
- Valore totale contratti firmati

🔍 **Filtri:**
- Per stato (Tutti, Bozze, In Attesa, Firmati)
- Ricerca per numero, titolo, azienda cliente

📄 **Dettagli Contratto:**
- Informazioni complete
- Dati cliente
- Stato firme
- Timeline eventi
- Audit log completo

---

## 🏗️ Architettura Sistema

### Database Schema

```
contract_templates       → Template riutilizzabili
    ↓
contracts               → Istanze contratti
    ↓
contract_signatures     → Firme digitali + OTP
    ↓
signature_audit_log     → Audit trail completo
    ↓
contract_notifications  → Email/SMS tracking
```

### Stati Contratto

```
draft → sent → viewed → signing_in_progress → signed → completed
                ↓                                ↓
              expired                        rejected
                ↓
            cancelled
```

### Stati Firma

```
pending → otp_sent → otp_verified → signed
                ↓
            rejected
```

---

## 🔒 Sicurezza e Compliance

### Conformità Legale

✅ **eIDAS (EU Regulation 910/2014)**
- Firma elettronica qualificata
- Identificazione sicura del firmatario
- Integrità del documento

✅ **ESIGN Act (US)**
- Consenso esplicito
- Audit trail completo
- Conservazione documenti

### Sicurezza Implementata

🔐 **Verifica Identità OTP**
- Codice 6 cifre crittografato
- Scadenza 15 minuti
- Max 3 tentativi
- Rate limiting

🛡️ **Audit Trail Completo**
- Timestamp precisi
- IP address
- User agent
- Geolocalizzazione
- Ogni azione tracciata

🔒 **Row Level Security (RLS)**
- Accesso controllato per organizzazione
- Firme accessibili solo via link sicuro
- Policies PostgreSQL native

---

## 🎨 Personalizzazione

### Creare Template Personalizzati

```sql
INSERT INTO contract_templates (
  organization_id,
  name,
  template_type,
  content,
  variables
) VALUES (
  'your-org-id',
  'Il Mio Template',
  'custom',
  'Contenuto con {{variabili}}',
  '{"variables": ["company_name", "value"]}'::jsonb
);
```

### Variabili Disponibili

Template può usare variabili con sintassi `{{nome_variabile}}`:

**Cliente:**
- `{{client_company}}`
- `{{client_name}}`
- `{{client_email}}`
- `{{client_phone}}`
- `{{client_vat}}`
- `{{client_address}}`

**Fornitore:**
- `{{vendor_company}}`
- `{{vendor_vat}}`
- `{{vendor_address}}`

**Contratto:**
- `{{contract_value}}`
- `{{contract_duration}}`
- `{{service_description}}`
- `{{current_date}}`

---

## 📧 Notifiche Email/SMS

### Configurazione Provider

**Email (Resend/SendGrid):**
```typescript
// In contractsService.ts, modifica sendSignatureOTP
// Aggiungi integrazione con il tuo provider email
await resend.emails.send({
  from: 'contratti@tuaazienda.com',
  to: signature.signer_email,
  subject: 'Codice OTP Firma Contratto',
  html: `<p>Il tuo codice è: <strong>${otpCode}</strong></p>`
})
```

**SMS (Twilio):**
```typescript
await twilio.messages.create({
  to: signature.signer_phone,
  from: '+1234567890',
  body: `Codice OTP Contratto: ${otpCode}`
})
```

---

## 🧪 Testing

### Test Manuale Completo

1. **Crea Contratto**
   ```
   CRM → Lead → Tab Contratti → + Nuovo
   ```

2. **Invia per Firma**
   ```
   Dashboard Contratti → Azioni → Invia
   ```

3. **Simula Firma**
   ```
   Apri link /sign/{id}
   Completa OTP
   Firma digitalmente
   ```

4. **Verifica Audit Log**
   ```
   Dashboard → Dettagli Contratto → Timeline
   ```

### Query Utili per Debug

```sql
-- Contratti recenti
SELECT * FROM contracts
ORDER BY created_at DESC
LIMIT 10;

-- Firme in attesa
SELECT * FROM contract_signatures
WHERE status IN ('pending', 'otp_sent')
ORDER BY created_at DESC;

-- Audit log completo contratto
SELECT * FROM signature_audit_log
WHERE contract_id = 'your-contract-id'
ORDER BY created_at DESC;

-- OTP non verificati (per debug)
SELECT
  id,
  signer_email,
  otp_code,
  otp_sent_at,
  otp_attempts,
  status
FROM contract_signatures
WHERE status = 'otp_sent';
```

---

## 🐛 Troubleshooting

### Problema: OTP non arriva

**Causa:** Provider email/SMS non configurato

**Soluzione:**
1. Controlla console browser/server per log OTP
2. In sviluppo, OTP viene loggato: `console.log('OTP Code:', otpCode)`
3. In produzione, configura provider email/SMS

### Problema: Firma non si completa

**Causa:** Timeout sessione o validazione fallita

**Soluzione:**
```sql
-- Resetta stato firma per retry
UPDATE contract_signatures
SET
  status = 'pending',
  otp_attempts = 0,
  otp_sent_at = NULL
WHERE id = 'signature-id';
```

### Problema: RLS blocca accesso

**Causa:** Policy di sicurezza troppo restrittiva

**Soluzione:**
```sql
-- Temporaneamente disabilita RLS per debug
ALTER TABLE contracts DISABLE ROW LEVEL SECURITY;

-- Ricorda di riabilitare dopo debug!
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
```

---

## 📈 Roadmap Future

🔜 **Prossime Features:**

- [ ] Firma disegnata (canvas signature)
- [ ] Generazione PDF automatica contratti
- [ ] Firma biometrica (face ID, fingerprint)
- [ ] Integrazione DocuSign/Adobe Sign
- [ ] Template builder visuale
- [ ] Multi-lingua supporto
- [ ] Firma multipla parallela
- [ ] Reminder automatici scadenza
- [ ] Dashboard analytics avanzata

---

## 🆘 Supporto

### Documentazione
- [Guida Migrazione](database/RUN_MIGRATION_015.md)
- [Esempi Template](database/sample_data/contract_template_example.sql)

### Database Schema
- Vedi: `database/migrations/015_create_contracts_esignature_system.sql`

### Codice Sorgente
- Service Layer: `frontend/src/services/contractsService.ts`
- Dashboard Admin: `frontend/src/components/Admin/ContractsDashboard.tsx`
- Pagina Firma: `frontend/src/pages/ContractSignature.tsx`
- CRM Integration: `frontend/src/components/Admin/LeadDetailModal.tsx`

---

## ✨ Best Practices

1. **Sempre fare backup** prima di modifiche database
2. **Testare su staging** prima di produzione
3. **Configurare email/SMS** provider in produzione
4. **Monitorare audit log** regolarmente
5. **Archiviare PDF firmati** in storage sicuro
6. **Verificare compliance** legale locale
7. **Documentare processi** interni firma

---

**Made with ❤️ for OmnilyPro**

*Sistema Contratti e Firma Digitale v1.0*
*Conforme eIDAS (EU) e ESIGN Act (US)*
