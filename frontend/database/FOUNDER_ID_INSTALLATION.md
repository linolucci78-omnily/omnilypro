# 🔐 Installazione Founder ID - Guida Completa

## ✅ Cosa è stato fatto

### 1. Database Migration
**File:** `database/add_founder_id_field.sql`

Questo script SQL:
- ✅ Aggiunge campo `founder_id` VARCHAR(12) UNIQUE alla tabella `users`
- ✅ Crea funzione `generate_founder_id()` per generare ID univoci
- ✅ Genera automaticamente Founder ID per tutti gli utenti esistenti
- ✅ Configura trigger per auto-generazione su nuovi utenti
- ✅ Crea indice per performance
- ✅ Aggiunge commenti per documentazione

### 2. TypeScript Interfaces Aggiornate
**File:** `src/services/usersService.ts`

- ✅ Aggiunto `founder_id?: string` a `SystemUser`
- ✅ Aggiunto `bio?: string` a `SystemUser` e `UpdateUserInput`
- ✅ Documentato che `founder_id` è read-only

### 3. ProfileSettings Component
**File:** `src/components/Admin/ProfileSettings.tsx`

- ✅ Modificato per leggere `founder_id` dal database
- ✅ Fallback a generazione temporanea se migration non ancora applicata
- ✅ Funzione `getFounderId()` invece di `generateFounderId()`

---

## 📋 Istruzioni per l'Installazione

### STEP 1: Backup Database (Importante!)

Prima di applicare la migration, fai un backup:

```bash
# Via Supabase Dashboard
# Settings → Database → Backups → Create Backup
```

### STEP 2: Applicare SQL Migration

1. **Accedi a Supabase Dashboard**
   - Vai su [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Seleziona il progetto OmnilyPro

2. **Apri SQL Editor**
   - Nel menu laterale, clicca su **SQL Editor**
   - Clicca su **New Query**

3. **Copia e Incolla lo Script**
   - Apri il file `database/add_founder_id_field.sql`
   - Copia TUTTO il contenuto
   - Incolla nell'editor SQL

4. **Esegui la Query**
   - Clicca su **Run** (o premi `Ctrl+Enter`)
   - Attendi il completamento (dovrebbe richiedere 2-5 secondi)

5. **Verifica Risultati**
   - Alla fine dello script vedrai una query SELECT
   - Dovresti vedere tutti gli utenti con il loro nuovo `founder_id`
   - Formato: `FD-XXXX-XX` (es. `FD-4A2B-C3`)

### STEP 3: Verifica Installation

Dopo aver eseguito lo script, verifica che tutto funzioni:

#### Test 1: Verifica Campo nel Database

```sql
SELECT id, email, founder_id, created_at
FROM public.users
WHERE founder_id IS NOT NULL
LIMIT 10;
```

**Risultato atteso:** Tutti gli utenti hanno un `founder_id` univoco

#### Test 2: Verifica Trigger su Nuovo Utente

```sql
-- Crea un utente di test
INSERT INTO public.users (email, role, status, is_active)
VALUES ('test@omnilypro.com', 'organization_staff', 'pending', false);

-- Verifica che abbia ricevuto un founder_id automaticamente
SELECT email, founder_id FROM public.users WHERE email = 'test@omnilypro.com';

-- Pulisci il test
DELETE FROM public.users WHERE email = 'test@omnilypro.com';
```

**Risultato atteso:** Il nuovo utente ha ricevuto automaticamente un `founder_id`

#### Test 3: Verifica UI

1. Login nell'admin panel di OmnilyPro
2. Vai a `/admin/profile`
3. Scorri fino alla sezione **Founder ID Card**
4. Verifica che mostri un ID nel formato `FD-XXXX-XX`
5. Clicca su **Copia ID** e verifica che venga copiato negli appunti

**Risultato atteso:** Il Founder ID è visibile e copiabile

### STEP 4: Test Avanzati (Opzionale)

#### Test Unicità

```sql
-- Questo dovrebbe fallire (duplicato)
INSERT INTO public.users (email, founder_id, role, status, is_active)
VALUES ('test2@omnilypro.com', 'FD-TEST-01', 'organization_staff', 'pending', false);

-- Verifica errore: duplicate key value violates unique constraint
```

#### Test Read-Only

```sql
-- Prova a modificare un founder_id esistente
UPDATE public.users
SET founder_id = 'FD-HACK-01'
WHERE email = 'pako.lucci@gmail.com';

-- Questo DOVREBBE funzionare (nessuna protezione a livello DB per ora)
-- Ma non dovrebbe essere permesso dal frontend
```

**Nota:** Se vuoi rendere `founder_id` completamente immutabile, possiamo aggiungere un trigger che blocca gli UPDATE.

---

## 🎯 Formato Founder ID

### Struttura
```
FD-XXXX-XX
│  │    │
│  │    └─ 2 caratteri alfanumerici (66-ZZ)
│  └────── 4 caratteri alfanumerici (A000-ZZZZ)
└───────── Prefisso "FD" (Founder)
```

### Esempi Reali
- `FD-4A2B-C3` ✅
- `FD-9F1E-D7` ✅
- `FD-2C8A-B1` ✅
- `FD-TEST-01` ❌ (formalmente valido ma non generato da funzione)

### Caratteristiche
- **Lunghezza:** 10 caratteri fissi
- **Univoco:** Non ci possono essere duplicati
- **Permanente:** Una volta assegnato, non cambia mai
- **Casuale:** Generato da MD5 hash casuale
- **Maiuscolo:** Sempre in uppercase

---

## 🔧 Troubleshooting

### Problema: "Column founder_id already exists"

**Causa:** Lo script è già stato eseguito in precedenza

**Soluzione:** Salta la parte di creazione colonna o usa:
```sql
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS founder_id VARCHAR(12);
```

### Problema: "Function generate_founder_id already exists"

**Causa:** La funzione esiste già

**Soluzione:** Usa `CREATE OR REPLACE FUNCTION` (già presente nello script)

### Problema: UI mostra ancora ID temporaneo

**Causa:** Il browser potrebbe avere cache

**Soluzione:**
1. Hard refresh: `Ctrl+Shift+R` (Windows) o `Cmd+Shift+R` (Mac)
2. Logout e login di nuovo
3. Verifica che la migration sia stata applicata correttamente nel database

### Problema: Founder ID duplicati

**Causa:** Estremamente raro, ma possibile se la funzione random fallisce

**Soluzione:**
```sql
-- Trova duplicati
SELECT founder_id, COUNT(*)
FROM public.users
GROUP BY founder_id
HAVING COUNT(*) > 1;

-- Rigenera ID per utenti con duplicati
UPDATE public.users
SET founder_id = generate_founder_id()
WHERE founder_id IN (
  SELECT founder_id FROM public.users
  GROUP BY founder_id HAVING COUNT(*) > 1
);
```

---

## 📊 Statistiche Post-Installation

Dopo l'installazione, puoi raccogliere queste statistiche:

```sql
-- Totale utenti con Founder ID
SELECT COUNT(*) as total_users_with_founder_id
FROM public.users
WHERE founder_id IS NOT NULL;

-- Distribuzione Founder ID per ruolo
SELECT role, COUNT(*) as count
FROM public.users
GROUP BY role
ORDER BY count DESC;

-- Primi 10 Founder ID creati
SELECT email, founder_id, created_at
FROM public.users
ORDER BY created_at ASC
LIMIT 10;

-- Ultimi 10 Founder ID creati
SELECT email, founder_id, created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🚀 Prossimi Passi (Roadmap)

### FASE 2: Security & Critical Operations
- [ ] Implementare protezioni per operazioni critiche
- [ ] UI per conferma Founder ID su azioni pericolose
- [ ] Logging base delle azioni

### FASE 3: Audit Trail
- [ ] Creare tabella `founder_audit_logs`
- [ ] Dashboard per visualizzare log
- [ ] Alert automatici per azioni sospette

### FASE 4: Account Recovery
- [ ] Sistema recovery account via Founder ID
- [ ] Supporto ticket management
- [ ] Documentazione per support team

### FASE 5: Compliance
- [ ] Privacy Policy update
- [ ] Terms of Service update
- [ ] Security audit documentation

---

## 📞 Support

Per problemi o domande:
1. Verifica prima il **Troubleshooting** section
2. Controlla i log in Supabase Dashboard → Logs
3. Contatta il team di sviluppo OmnilyPro

---

## ✅ Checklist Installazione

- [ ] Backup database effettuato
- [ ] Script SQL eseguito senza errori
- [ ] Tutti gli utenti hanno `founder_id`
- [ ] Test UI completato
- [ ] Founder ID visibile in `/admin/profile`
- [ ] Copia ID funziona correttamente
- [ ] Nuovo utente riceve auto founder_id
- [ ] Documentazione letta e compresa

**Data installazione:** _____________

**Installato da:** _____________

**Note:** _____________________________________________

---

**Versione:** 1.0.0
**Data:** 2025-11-26
**Autore:** Claude Code Assistant
