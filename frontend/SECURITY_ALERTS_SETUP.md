# 🔒 Security Alerts System - Setup Completo

## 🎯 Sistema 100% REALE - Zero Dati Fake!

Questo sistema sostituisce gli alert fake con un sistema completamente basato su database con generazione automatica degli alert.

---

## ✅ Cosa Fa il Sistema

### Alert Automatici Generati da Database Triggers:

1. **Multiple Failed Logins** (5+ tentativi falliti in 2 ore)
   - Severity: medium (5-6), high (7-9), critical (10+)
   - Traccia: IP address, user agent, location
   - Auto-genera alert solo se non esiste già uno attivo

### Dati Reali dal Database:

- **Eventi di sicurezza**: Tutti caricati da `audit_logs`
- **Alert di sicurezza**: Tutti caricati da `security_alerts`
- **Statistiche**:
  - Total Events: conta eventi reali
  - Critical Alerts: conta alert severity=critical con status=active
  - Failed Logins: conta failed login events reali
  - Active Users: conta utenti unici loggati
  - Blocked IPs: conta alert attivi per failed logins multipli
  - Data Accesses: conta accessi dati reali

---

## 🚀 Installazione

### Step 1: Esegui Migration SQL

1. Vai su [Supabase Dashboard](https://supabase.com/dashboard)
2. SQL Editor → **New Query**
3. Copia il contenuto di `supabase/migrations/create_security_alerts.sql`
4. Clicca **Run** ▶️
5. Dovresti vedere "Success. No rows returned" = ✅

### Step 2: Verifica Tabella Creata

```sql
-- Verifica tabella esiste
SELECT * FROM security_alerts;
-- Deve tornare 0 rows senza errori

-- Verifica trigger funziona
SELECT proname, tgname
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgname = 'auto_generate_security_alerts';
-- Deve tornare 1 riga
```

### Step 3: Test Alert Generation

Crea alcuni failed login per testare:

```sql
-- Simula 6 failed login dallo stesso IP
INSERT INTO audit_logs (action, user_id, organization_id, metadata, created_at)
SELECT
  'user.login_failed',
  gen_random_uuid(),
  (SELECT id FROM organizations LIMIT 1),
  jsonb_build_object(
    'ip_address', '192.168.1.100',
    'user_agent', 'Mozilla/5.0',
    'location', 'Milan, IT',
    'reason', 'invalid_password'
  ),
  NOW() - (interval '1 minute' * n)
FROM generate_series(1, 6) AS n;

-- Verifica alert creato
SELECT * FROM security_alerts WHERE alert_type = 'multiple_failed_logins';
-- Dovresti vedere 1 alert appena creato!
```

---

## 📊 Struttura Alert

### Campi Alert:

```typescript
{
  id: UUID
  title: string                    // es: "Tentativi di login multipli falliti"
  description: string              // Dettagli dell'alert
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'investigating' | 'resolved' | 'dismissed'
  alert_type: string               // es: 'multiple_failed_logins'
  affected_users: number           // Quanti utenti coinvolti
  affected_organizations: string[] // Array di org IDs
  source_event_ids: string[]       // Array di audit_log IDs
  metadata: JSON                   // Dati specifici (IP, location, etc.)
  created_at: timestamp
  updated_at: timestamp
  resolved_at: timestamp           // Auto-set quando status -> resolved
  resolved_by: UUID                // Chi ha risolto
  resolution_notes: text           // Note di risoluzione
}
```

---

## 🔧 Come Funziona il Trigger

### Auto-Generate Alert per Failed Logins:

```sql
-- Trigger si attiva DOPO ogni INSERT in audit_logs
-- Se action = 'user.login_failed':
  1. Legge IP address dal metadata
  2. Conta failed login dallo stesso IP nelle ultime 2 ore
  3. Se count >= 5:
     - Controlla se esiste già alert attivo per questo IP (nelle ultime 24h)
     - Se NON esiste, crea nuovo alert
     - Severity basata su count:
       * count >= 10: critical
       * count >= 7: high
       * count >= 5: medium
```

### Auto-Update Timestamp:

```sql
-- Trigger su UPDATE security_alerts:
  1. Aggiorna updated_at = NOW()
  2. Se status cambia a 'resolved':
     - Auto-set resolved_at = NOW()
```

---

## 🎨 UI Updates

### Security Dashboard Ora Mostra:

**Alert Reali:**
- Tutti gli alert dal database `security_alerts`
- Ordinati per data (più recenti prima)
- Filtrabili per severity e status

**Statistiche Reali:**
- Total Events: da `audit_logs`
- Critical Alerts: da `security_alerts` WHERE severity='critical' AND status='active'
- Failed Logins: da `audit_logs` WHERE action='user.login_failed'
- Blocked IPs: da `security_alerts` WHERE alert_type='multiple_failed_logins' AND status='active'

**Eventi Reali:**
- Tutti da `audit_logs`
- Con join a users e organizations per nomi
- Filtrabili per tipo, severity, data

---

## 🛡️ Permissions (RLS)

### Super Admin:
- Possono fare TUTTO (SELECT, INSERT, UPDATE, DELETE)

### Admin:
- Possono solo leggere (SELECT) gli alert

### Users normali:
- Nessun accesso diretto

---

## 🔮 Futuri Tipi di Alert (Espandibile)

Il sistema è progettato per essere facilmente espandibile. Aggiungi nuovi trigger per:

1. **Suspicious Location Alert**
   - Login da paese mai usato prima
   - Severity: medium

2. **Data Breach Alert**
   - Export massivo di dati
   - Severity: critical

3. **Permission Escalation Alert**
   - Cambio permessi sospetto
   - Severity: high

4. **API Rate Limit Alert**
   - Troppe chiamate API in breve tempo
   - Severity: medium

5. **Account Lockout Alert**
   - Account bloccato per troppi tentativi
   - Severity: high

---

## ✅ Checklist Post-Installazione

- [ ] Tabella `security_alerts` creata
- [ ] Trigger `auto_generate_security_alerts` attivo
- [ ] RLS policies applicate
- [ ] Test alert generation funziona
- [ ] Security Dashboard mostra dati reali
- [ ] Statistiche accurate
- [ ] Nessun dato fake nel codice

---

## 🎉 Risultato

**PRIMA:** Alert hardcoded fake nel codice
```typescript
const mockAlerts = [...]  // ❌ FAKE
```

**DOPO:** Alert veri dal database
```typescript
const { data: alertsData } = await supabase
  .from('security_alerts')
  .select('*')  // ✅ REALE
```

**BONUS:** Alert generati automaticamente da trigger SQL quando eventi sospetti vengono rilevati!

---

## 📞 Debug

Se non vedi alert:

1. Verifica trigger esiste:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'auto_generate_security_alerts';
```

2. Verifica tabella vuota:
```sql
SELECT COUNT(*) FROM security_alerts;
```

3. Crea failed login test (vedi Step 3)

4. Controlla console browser per errori Supabase

5. Verifica RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'security_alerts';
```

---

**Sistema pronto! Zero cazzate, solo dati veri! 💪**
