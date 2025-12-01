# 📋 CHECKLIST TEST PRODUZIONE - Sapori e Colori
**Data lancio: Domani mattina**

---

## 1️⃣ CONFIGURAZIONE SUPABASE (DA FARE SUBITO)

### Supabase Dashboard → Authentication → URL Configuration

**Site URL:**
```
https://omnilypro.com
```
(lascia così, NON cambiare)

**Redirect URLs** - Aggiungi questa riga:
```
https://card.omnilypro.com/**
```

### Cleanup Database
Esegui il file `cleanup_sapori_colori.sql` in Supabase SQL Editor

✅ Risultati attesi: Tutti i contatori a 0

---

## 2️⃣ TEST REGISTRAZIONE NUOVO CLIENTE

1. [ ] Vai a `https://omnilypro.com`
2. [ ] Login POS con credenziali Sapori e Colori
3. [ ] Clicca bottone **"Nuovo Cliente"**
4. [ ] Compila form:
   - Nome: Mario
   - Cognome: Rossi
   - Email: mario.rossi@test.com
   - Telefono: 3331234567
5. [ ] Firma privacy
6. [ ] Clicca "Registra"
7. [ ] **VERIFICA:**
   - ✅ Cliente creato con successo
   - ✅ 50 punti di benvenuto assegnati
   - ✅ Codice referral generato (es. S&C123ABC)
   - ✅ Email di attivazione inviata

---

## 3️⃣ TEST EMAIL ATTIVAZIONE

1. [ ] Apri casella email `mario.rossi@test.com`
2. [ ] Trova email "Attiva il tuo account - Sapori e Colori"
3. [ ] Clicca sul link di attivazione
4. [ ] **VERIFICA URL:**
   - ✅ URL è `https://card.omnilypro.com/saporiecolori/activate?token=...`
   - ❌ NON deve essere `https://app.omnilypro.com/...`
5. [ ] Conferma attivazione
6. [ ] **VERIFICA:** Account attivato con successo

---

## 4️⃣ TEST SISTEMA REFERRAL COMPLETO

### Step 1: Prepara Cliente A (Referrer)
1. [ ] Registra **Cliente A** (es. Luca Bianchi)
2. [ ] Annota il **codice referral** di Cliente A (es. S&C456DEF)
3. [ ] Salva QR code referral di Cliente A (screenshot o stampa)

### Step 2: Registra Cliente B con Referral
1. [ ] Clicca **"Nuovo Cliente"**
2. [ ] Compila dati **Cliente B** (es. Anna Verdi)
3. [ ] Arriva al campo **"Codice Referral"**
4. [ ] Clicca bottone **scanner QR** 📱
5. [ ] Scansiona QR code di Cliente A
   - **Oppure** inserisci manualmente: S&C456DEF
6. [ ] Completa registrazione

### Step 3: Verifica Punti Assegnati
1. [ ] Cerca **Cliente B** (Anna Verdi)
2. [ ] **VERIFICA:** 70 punti totali
   - 50 punti benvenuto
   - 20 punti referral
3. [ ] Cerca **Cliente A** (Luca Bianchi)
4. [ ] **VERIFICA:** +20 punti aggiunti

### Step 4: Verifica Statistiche Referral
1. [ ] Apri card **Cliente A**
2. [ ] Vai su tab **Referral** 🎁
3. [ ] **VERIFICA:**
   - ✅ 1 referral completato
   - ✅ 20 punti guadagnati
   - ✅ Mostra nome "Anna Verdi" (NON "unknown")
   - ✅ Data registrazione corretta

---

## 5️⃣ TEST GENERAZIONE PREMI AI

1. [ ] Vai su **Rewards Hub**
2. [ ] Clicca **"Genera con AI"** ✨
3. [ ] Compila prompt:
```
Genera 25 premi per una panetteria/gastronomia.
70% prodotti da forno (focaccia, pane, pizza, brioche).
30% gastronomia generica.
Partenza: 50 punti di benvenuto.
Distribuzione su 4 tier di fedeltà.
```
4. [ ] Clicca **"Genera"**
5. [ ] **VERIFICA:**
   - ✅ 25 premi generati
   - ✅ Tutte le immagini caricate da Unsplash
   - ✅ Nessun errore di generazione
   - ✅ Premi distribuiti su più tier

### Verifica AI Tracking
1. [ ] Vai su **Admin → AI Tracking**
2. [ ] **VERIFICA:**
   - ✅ Token utilizzati mostrati (es. 5.3K)
   - ✅ Costo calcolato (es. $0.02)
   - ✅ Data e ora corrette
   - ✅ 25 premi nella colonna "Rewards"

---

## 6️⃣ TEST CUSTOMER APP

### Login Cliente
1. [ ] Apri browser **privato/incognito**
2. [ ] Vai a `https://card.omnilypro.com/saporiecolori`
3. [ ] Clicca **"Accedi"**
4. [ ] Inserisci credenziali Mario Rossi:
   - Email: mario.rossi@test.com
   - Password: (quella impostata in registrazione)
5. [ ] **VERIFICA:**
   - ✅ Login effettuato
   - ✅ Dashboard cliente caricata

### Verifica Dashboard
1. [ ] **VERIFICA visualizzazione:**
   - ✅ Punti attuali (es. 50 o 70)
   - ✅ Tier assegnato (es. "Base" o "Bronze")
   - ✅ Lista premi disponibili
   - ✅ Barra progresso tier

### Verifica Referral Personale
1. [ ] Clicca tab **"Invita Amici"** o **"Referral"**
2. [ ] **VERIFICA:**
   - ✅ Codice referral personale visibile (es. S&C789GHI)
   - ✅ QR code generato
   - ✅ Pulsanti condivisione (WhatsApp, Email, Copia)
   - ✅ Contatore referral (0 se nuovo cliente)

---

## 7️⃣ TEST RISCATTO PREMIO

### Cliente Riscatta Premio
1. [ ] Login cliente su `card.omnilypro.com/saporiecolori`
2. [ ] Assicurati che il cliente abbia punti sufficienti
   - Se necessario, aggiungi punti manualmente dal POS
3. [ ] Seleziona un premio disponibile
4. [ ] Clicca **"Riscatta"**
5. [ ] Conferma riscatto
6. [ ] **VERIFICA:**
   - ✅ Punti sottratti correttamente
   - ✅ QR code premio generato
   - ✅ Premio in lista "I Miei Premi"

### POS Valida Premio
1. [ ] Torna al POS `https://omnilypro.com`
2. [ ] Vai a sezione **Rewards** o **Validazione**
3. [ ] Clicca **"Scansiona QR"** 📱
4. [ ] Scansiona QR code premio del cliente
5. [ ] **VERIFICA:**
   - ✅ Premio riconosciuto
   - ✅ Dettagli cliente mostrati
   - ✅ Pulsante "Conferma Utilizzo"
6. [ ] Clicca **"Conferma Utilizzo"**
7. [ ] **VERIFICA:**
   - ✅ Premio segnato come utilizzato
   - ✅ Non più riscattabile

---

## 8️⃣ TEST COMPLETO CUSTOMER JOURNEY

**Scenario**: Nuovo cliente che usa referral e riscatta premio

1. [ ] **Registrazione con referral**
   - Cliente B registrato con codice Cliente A
   - Cliente B ha 70 punti (50+20)
   - Cliente A guadagna 20 punti

2. [ ] **Attivazione email**
   - Email ricevuta su card.omnilypro.com
   - Account attivato con successo

3. [ ] **Primo login customer app**
   - Login funzionante
   - Dashboard mostra 70 punti
   - Tier corretto assegnato

4. [ ] **Riscatto primo premio**
   - Seleziona premio da 50 punti
   - Riscatta con successo
   - Rimangono 20 punti

5. [ ] **Validazione POS**
   - QR code scansionato
   - Premio consegnato
   - Sistema aggiornato

---

## 9️⃣ CHECKLIST FINALE PRE-LANCIO

### Database
- [ ] Tutti i clienti di test eliminati
- [ ] Tutti i referral di test eliminati
- [ ] Tutti i premi generati e configurati correttamente

### Configurazione
- [ ] Supabase Redirect URLs aggiornati
- [ ] Email activation funzionante
- [ ] Customer app accessibile

### Funzionalità Core
- [ ] Registrazione nuovo cliente ✅
- [ ] Sistema referral funzionante ✅
- [ ] Assegnazione punti corretta ✅
- [ ] Generazione premi AI ✅
- [ ] Riscatto premi ✅
- [ ] Validazione POS ✅

### Comunicazioni
- [ ] Email activation template corretto
- [ ] Link customer app corretti
- [ ] QR code funzionanti

---

## 🚨 PROBLEMI COMUNI E SOLUZIONI

### Email va a dominio sbagliato
**Problema:** Email va a `app.omnilypro.com`
**Soluzione:** Verifica Redirect URLs in Supabase Dashboard

### Referral non assegna punti
**Problema:** Cliente B ha solo 50 punti invece di 70
**Soluzione:** Controlla console browser per errori, verifica tier referral configurata

### QR Scanner non si apre
**Problema:** Scanner non parte nel Registration Wizard
**Soluzione:** Usa su dispositivo POS Android, non browser web

### "Unknown" in statistiche referral
**Problema:** Nome cliente non appare
**Soluzione:** Verifica foreign key in referral_conversions

---

## 📞 CONTATTI SUPPORTO

Se incontri problemi durante i test, annota:
1. Cosa stavi facendo
2. Messaggio di errore (screenshot)
3. Browser/dispositivo usato
4. Console log (F12 → Console)

---

✅ **CHECKLIST COMPLETATA - SISTEMA PRONTO PER PRODUZIONE**

Data completamento test: _______________
Firma: _______________
