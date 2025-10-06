# Migration 019 - Sistema MDM Completo

## Descrizione
Questa migration crea tutte le tabelle necessarie per il sistema MDM (Mobile Device Management) completo.

## Tabelle Create

1. **devices** - Gestione dispositivi POS
2. **device_commands** - Comandi inviati ai dispositivi
3. **store_configs** - Configurazioni store
4. **setup_tokens** - Token per setup dispositivi
5. **app_repository** - Repository APK
6. **print_templates** - Template stampa scontrini
7. **mdm_activity_logs** - Log attività MDM

## Come Applicare la Migration

### Opzione 1: Supabase Dashboard (Consigliato)

1. Vai su [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Seleziona il tuo progetto
3. Vai su **SQL Editor** nel menu laterale
4. Clicca su **New Query**
5. Copia e incolla il contenuto di `019_verify_and_create_mdm_tables.sql`
6. Clicca su **Run** (o premi `Ctrl+Enter`)
7. Verifica che tutte le tabelle siano state create controllando i log

### Opzione 2: CLI Supabase

```bash
# Naviga nella directory del progetto
cd /Users/pasqualelucci/Desktop/omnilypro/frontend

# Applica la migration
supabase db push

# Oppure usa il file direttamente
supabase db execute -f database/migrations/019_verify_and_create_mdm_tables.sql
```

## Verifica Post-Migration

Dopo aver eseguito la migration, verifica che tutte le tabelle siano state create:

```sql
-- Verifica esistenza tabelle
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'devices',
  'device_commands',
  'store_configs',
  'setup_tokens',
  'app_repository',
  'print_templates',
  'mdm_activity_logs'
)
ORDER BY table_name;
```

Dovresti vedere tutte e 7 le tabelle elencate.

## Verifica RLS (Row Level Security)

Verifica che le politiche RLS siano attive:

```sql
-- Verifica RLS policies
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN (
  'devices',
  'device_commands',
  'store_configs',
  'setup_tokens',
  'app_repository',
  'print_templates',
  'mdm_activity_logs'
)
ORDER BY tablename, policyname;
```

## Dati di Test (Opzionale)

Se vuoi popolare il database con dati di test per sviluppo:

```sql
-- Inserisci dispositivo di test
INSERT INTO devices (name, android_id, device_model, organization_id, store_location, status)
VALUES
  ('POS-Test-01', 'android_test_001', 'Z108', (SELECT id FROM organizations LIMIT 1), 'Negozio Test', 'online'),
  ('POS-Test-02', 'android_test_002', 'Z108', (SELECT id FROM organizations LIMIT 1), 'Negozio Test 2', 'offline');

-- Inserisci app di test
INSERT INTO app_repository (package_name, app_name, version_name, version_code, apk_url, file_size_mb, is_active)
VALUES
  ('com.omnily.bridge', 'OMNILY Bridge POS', '1.0.0', 1, 'https://example.com/app.apk', 25.5, true);

-- Inserisci configurazione store di test
INSERT INTO store_configs (store_name, organization_id, pos_terminal_count, kiosk_auto_start)
VALUES
  ('Store Test', (SELECT id FROM organizations LIMIT 1), 2, true);
```

## Rollback (Se Necessario)

Se hai bisogno di fare rollback della migration:

```sql
-- ATTENZIONE: Questo cancellerà TUTTI i dati nelle tabelle MDM
DROP TABLE IF EXISTS mdm_activity_logs CASCADE;
DROP TABLE IF EXISTS print_templates CASCADE;
DROP TABLE IF EXISTS app_repository CASCADE;
DROP TABLE IF EXISTS setup_tokens CASCADE;
DROP TABLE IF EXISTS device_commands CASCADE;
DROP TABLE IF EXISTS store_configs CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
```

## Note Importanti

- ⚠️ La migration usa `IF NOT EXISTS`, quindi è sicuro eseguirla più volte
- ⚠️ Tutti i dati sono protetti da RLS (Row Level Security)
- ⚠️ Le foreign key hanno `ON DELETE CASCADE` dove appropriato
- ✅ Gli indici sono ottimizzati per le query più comuni
- ✅ I timestamp sono impostati automaticamente

## Troubleshooting

### Errore: "permission denied for schema public"
Soluzione: Esegui come superuser o verifica i permessi del tuo user

### Errore: "relation organizations does not exist"
Soluzione: Assicurati che la tabella `organizations` esista prima di eseguire questa migration

### Errore: "extension uuid-ossp is not available"
Soluzione: Abilita l'estensione:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Contatti

Per problemi o domande sulla migration, contatta il team di sviluppo.
