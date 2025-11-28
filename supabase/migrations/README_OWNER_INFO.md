# Migration: Owner Information for Organizations

## Descrizione
Questa migrazione aggiunge i campi per memorizzare le informazioni del proprietario dell'azienda nella tabella `organizations`.

## Campi Aggiunti
- `owner_first_name` - Nome del proprietario
- `owner_last_name` - Cognome del proprietario
- `owner_email` - Email del proprietario
- `owner_phone` - Telefono del proprietario
- `owner_avatar_url` - URL avatar/foto profilo del proprietario

## Come Eseguire la Migrazione

### Opzione 1: Supabase Dashboard (Consigliato)
1. Apri Supabase Dashboard
2. Vai su "SQL Editor"
3. Copia e incolla il contenuto di `20250127_add_owner_info_to_organizations.sql`
4. Clicca "Run"

### Opzione 2: Supabase CLI
```bash
cd /Users/pasqualelucci/omnilypro-clean
supabase db push
```

### Opzione 3: npx supabase
```bash
npx supabase migration up
```

## Verifica
Dopo l'esecuzione, verifica che le colonne siano state create:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'organizations'
AND column_name LIKE 'owner_%';
```

Dovresti vedere 5 righe con i nuovi campi.

## Rollback
Se necessario, puoi rimuovere le colonne con:

```sql
ALTER TABLE organizations
DROP COLUMN IF EXISTS owner_first_name,
DROP COLUMN IF EXISTS owner_last_name,
DROP COLUMN IF EXISTS owner_email,
DROP COLUMN IF EXISTS owner_phone,
DROP COLUMN IF EXISTS owner_avatar_url;

DROP INDEX IF EXISTS idx_organizations_owner_email;
```

## Impatto
- ✅ Non rompe dati esistenti (le colonne sono opzionali)
- ✅ Le organizzazioni esistenti avranno valori NULL per questi campi
- ✅ Il wizard Enterprise popolerà automaticamente questi campi
- ✅ Index aggiunto per ricerche veloci via email proprietario
