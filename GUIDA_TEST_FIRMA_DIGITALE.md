# 🔐 Guida Completa Test Sistema Firma Digitale

## 📋 Prerequisiti

✅ Database migration 015 eseguita su Supabase
✅ Frontend in esecuzione (`npm run dev`)
✅ Utente loggato come admin
✅ Almeno un lead nel CRM

---

## 🧪 Test Flow Completo

### **STEP 1: Creare un Contratto da un Lead**

1. **Vai al CRM**
   ```
   http://localhost:5174/admin/crm
   ```

2. **Apri un Lead**
   - Clicca su una card lead nella pipeline
   - Si apre il LeadDetailModal

3. **Vai al Tab Contratti**
   - Clicca sul tab "Contratti" (icona FileText)
   - Vedrai "Nessun contratto"

4. **Crea Nuovo Contratto**
   - Clicca "Nuovo Contratto"
   - Si apre il form di creazione

5. **Compila il Form**
   ```
   Titolo: Contratto di Servizio POS
   Tipo: Contratto di Servizio
   Valore: 1500.00
   Scadenza Firma: 30 giorni

   Fornitore (La tua azienda):
   - Nome Azienda: OmnilyPro SRL
   - P.IVA: IT12345678901
   - Email: contratti@omnilypro.com
   - Indirizzo: Via Roma 123, 00100 Roma (RM)

   Contenuto:
   CONTRATTO DI FORNITURA SERVIZIO POS

   Tra {{vendor_info.company}} (Fornitore)
   e {{client_info.company}} (Cliente)

   Il presente contratto regola la fornitura di:
   - Sistema POS Z108
   - Software di gestione
   - Supporto tecnico 24/7

   Valore totale: €{{contract_value}}

   Firma:
   ___________________
   {{client_info.name}}
   ```

6. **Salva**
   - Clicca "Crea Contratto"
   - Vedrai toast di successo
   - Il contratto apparirà nella lista

---

### **STEP 2: Creare Richiesta di Firma**

1. **Vai alla Dashboard Contratti**
   ```
   http://localhost:5174/admin/contracts
   ```

2. **Trova il Contratto**
   - Vedrai il contratto appena creato
   - Status: "Bozza" (draft)

3. **Crea Signature Request**
   - Clicca "Richiedi Firma"
   - Inserisci dati firmatario:
     ```
     Nome: Mario Rossi
     Email: mario@example.com
     Telefono: +39 333 1234567
     Ruolo: client
     ```

4. **Genera Link Firma**
   - Il sistema crea un UUID per la signature
   - Viene generato link tipo:
     ```
     http://localhost:5174/contract-sign/abc-123-def-456
     ```

---

### **STEP 3: Processo di Firma (Lato Cliente)**

1. **Apri Link di Firma**
   - Apri in incognito/nuovo browser
   - Vai al link generato

2. **STEP 1: Verifica Identità**

   **Visualizzi:**
   - Nome firmatario
   - Email
   - Telefono

   **Scegli metodo OTP:**
   - [ ] Email
   - [ ] SMS

   **Clicca "Invia Codice OTP"**

   ⚠️ **IMPORTANTE:** L'OTP viene loggato in console:
   ```
   📧 OTP Code for mario@example.com: 123456
   ```

3. **Inserisci OTP**
   - Digita il codice a 6 cifre
   - Clicca "Verifica Codice"
   - ✅ Se corretto → avanza a STEP 2

4. **STEP 2: Firma Contratto**

   **Visualizzi:**
   - ✅ Anteprima contratto
   - Dettagli cliente e fornitore
   - Contenuto completo

   **Apponi Firma:**
   - Tipo: "Firma Digitata"
   - Inserisci nome completo: "Mario Rossi"

   **Accetta Termini:**
   - ✅ Check "Confermo di aver letto..."

   **Clicca "Firma il Contratto"**

5. **STEP 3: Completato**

   **Visualizzi:**
   - ✅ Icona successo
   - Data/ora firma
   - Numero contratto
   - Messaggio conferma email

---

### **STEP 4: Verifica nel CRM**

1. **Torna al CRM**
   ```
   http://localhost:5174/admin/crm
   ```

2. **Apri il Lead**
   - Vai al tab "Contratti"

3. **Verifica Status**
   - Status contratto: "Firmato" (signed)
   - Badge verde
   - Data firma visibile

4. **Vai a Dashboard Contratti**
   ```
   http://localhost:5174/admin/contracts
   ```

   - Filtra per "Firmati"
   - Vedi il contratto con status aggiornato

---

## 🔍 Verifica Database

### Query Supabase per Audit Trail

```sql
-- Vedi tutti i contratti
SELECT
  contract_number,
  title,
  status,
  created_at,
  sent_at,
  signed_at
FROM contracts
ORDER BY created_at DESC;

-- Vedi tutte le firme
SELECT
  cs.signer_name,
  cs.signer_email,
  cs.status,
  cs.otp_verified_at,
  cs.signed_at,
  c.contract_number
FROM contract_signatures cs
JOIN contracts c ON c.id = cs.contract_id
ORDER BY cs.created_at DESC;

-- Vedi audit trail completo
SELECT
  sal.event_type,
  sal.event_description,
  sal.actor_type,
  sal.created_at,
  c.contract_number
FROM signature_audit_log sal
JOIN contracts c ON c.id = sal.contract_id
ORDER BY sal.created_at DESC;

-- Vedi notifiche OTP inviate
SELECT
  notification_type,
  channel,
  recipient_email,
  status,
  sent_at,
  content
FROM contract_notifications
ORDER BY created_at DESC;
```

---

## 🎯 Checklist Test

### ✅ Funzionalità Base
- [ ] Creazione contratto da lead
- [ ] Visualizzazione lista contratti
- [ ] Form validazione campi obbligatori
- [ ] Toast invece di alert()

### ✅ Processo OTP
- [ ] Invio OTP via email
- [ ] Invio OTP via SMS (se telefono presente)
- [ ] Verifica codice corretto
- [ ] Blocco dopo 3 tentativi falliti
- [ ] Scadenza OTP dopo 15 minuti

### ✅ Firma Digitale
- [ ] Anteprima contratto completo
- [ ] Firma digitata funzionante
- [ ] Checkbox consenso legale obbligatorio
- [ ] Cattura IP e user agent
- [ ] Timestamp preciso

### ✅ Audit Trail
- [ ] Log creazione contratto
- [ ] Log invio OTP
- [ ] Log verifica OTP
- [ ] Log firma completata
- [ ] Tutti i dati immutabili

### ✅ UI/UX
- [ ] Modale dimensioni corrette (1000px)
- [ ] Design professionale
- [ ] Progress steps visuali
- [ ] Messaggi errore chiari
- [ ] Toast notifications

---

## 🐛 Debug Common Issues

### **Problema: OTP non arriva**
**Causa:** Sistema non integrato con provider email/SMS
**Soluzione:** Controlla console browser per il codice OTP

### **Problema: Errore "organization_id not found"**
**Causa:** User non ha organization_id
**Soluzione:**
```sql
UPDATE users
SET organization_id = (SELECT id FROM organizations LIMIT 1)
WHERE id = 'YOUR_USER_ID';
```

### **Problema: Contract number già esistente**
**Causa:** Funzione generate_contract_number() già chiamata
**Soluzione:** Normale, il sistema genera automaticamente

### **Problema: Signature link 404**
**Causa:** Route non configurata
**Soluzione:** Verifica App.tsx ha route `/contract-sign/:signatureId`

---

## 📊 Conformità Legale

Il sistema implementa:

✅ **eIDAS (EU) Compliance:**
- Identificazione firmatario (OTP)
- Timestamp RFC 3161
- Audit trail immutabile
- Consenso esplicito

✅ **ESIGN Act (US) Compliance:**
- Intent to sign (checkbox)
- Consent to electronic records
- Attribution (IP + user agent)
- Retention of records

✅ **GDPR:**
- Dati crittografati
- Audit trail completo
- Diritto accesso dati
- Conservazione sicura

---

## 🚀 Next Steps

Dopo il test di base, puoi implementare:

1. **Integrazione Email/SMS reale**
   - SendGrid per email
   - Twilio per SMS

2. **Generazione PDF**
   - Libreria: `pdfmake` o `react-pdf`
   - PDF con firma visibile
   - Upload su Supabase Storage

3. **Firma Disegnata**
   - Canvas per firma a mano
   - Salvataggio come immagine base64

4. **Multi-firma**
   - Contratti con più firmatari
   - Workflow sequenziale

5. **Promemoria automatici**
   - Email reminder se non firmato
   - Scadenza contratto

---

## 📝 Note Finali

**Ambiente di Test:** Development
**Database:** Supabase (staging)
**OTP:** Console logging (non email reali)

Per **produzione**:
- Configurare SMTP/SMS provider
- Attivare SSL/TLS
- Configurare rate limiting OTP
- Setup backup database
- Monitoring errori

---

**Buon Test! 🎉**
