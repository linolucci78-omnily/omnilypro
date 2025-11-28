# Migration: Business Owners Relational Structure

## 🎯 Obiettivo
Creare una struttura relazionale corretta per gestire proprietari di aziende che possono avere **multiple organizzazioni**.

## 📋 Cosa fa questa migrazione

### 1. Crea tabella `business_owners`
```sql
business_owners (
  id UUID PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at, updated_at
)
```

### 2. Aggiunge relazione in `organizations`
- Aggiunge colonna `owner_id UUID` (FK → business_owners.id)
- Relazione: **1 owner → N organizations**

### 3. Migra dati esistenti
- Sposta dati embedded (owner_first_name, etc.) → tabella business_owners
- Collega organizations esistenti ai loro owner tramite FK

### 4. Crea funzione helper
- `get_owner_organizations(email)` - Per lo **switcher aziende**

### 5. Abilita RLS
- Security policies per proteggere i dati

## 🚀 Come Eseguire

### Metodo 1: Supabase Dashboard (Raccomandato)
1. Apri **Supabase Dashboard**
2. Vai su **SQL Editor**
3. Copia/incolla: `20250127_create_business_owners_relation.sql`
4. Click **Run**

### Metodo 2: Supabase CLI
```bash
cd /Users/pasqualelucci/omnilypro-clean
supabase db push
```

## ✅ Benefici

### Prima (Embedded Data)
```
organizations
├─ owner_first_name: "Mario"
├─ owner_last_name: "Rossi"
├─ owner_email: "mario@example.com"
└─ ... (dati duplicati se stesso owner ha più aziende)
```

❌ **Problemi:**
- Dati duplicati
- Non puoi fare query "tutte le aziende di Mario"
- Non puoi fare switcher aziende

### Dopo (Relational)
```
business_owners
├─ id: uuid-123
├─ email: "mario@example.com"
└─ first_name: "Mario"

organizations
├─ owner_id: uuid-123 (FK)
├─ owner_id: uuid-123 (FK)  ← Stesso owner, 2 aziende!
└─ owner_id: uuid-123 (FK)
```

✅ **Vantaggi:**
- Dati normalizzati (no duplicazioni)
- Query facili: `SELECT * FROM organizations WHERE owner_id = ?`
- **Organization Switcher** funziona!

## 🔄 Organization Switcher

Dopo la migrazione puoi fare:

```typescript
// Ottieni tutte le aziende di un proprietario
const orgs = await organizationService.getOwnerOrganizations('mario@example.com')

// Risultato:
[
  { org_name: "Pizzeria Mario", org_slug: "pizzeriamario", ... },
  { org_name: "Bar Centrale", org_slug: "barcentrale", ... },
  { org_name: "Ristorante La Torre", org_slug: "ristorantelatorre", ... }
]
```

## 📊 Query Utili

### Trova tutte le aziende di un proprietario
```sql
SELECT * FROM get_owner_organizations('mario@example.com');
```

### Conta aziende per owner
```sql
SELECT
  bo.email,
  bo.first_name || ' ' || bo.last_name as full_name,
  COUNT(o.id) as organization_count
FROM business_owners bo
LEFT JOIN organizations o ON o.owner_id = bo.id
GROUP BY bo.id, bo.email, bo.first_name, bo.last_name
ORDER BY organization_count DESC;
```

### Trova owner di un'organizzazione
```sql
SELECT bo.*
FROM business_owners bo
INNER JOIN organizations o ON o.owner_id = bo.id
WHERE o.slug = 'pizzeriamario';
```

## 🔐 Sicurezza (RLS)

Le policy RLS garantiscono:
- ✅ Un owner può vedere solo i SUOI dati
- ✅ Un owner può aggiornare solo i SUOI dati
- ✅ Service role (backend) può fare tutto

## 🧪 Test

Dopo la migrazione, testa:

```sql
-- 1. Crea un test owner
INSERT INTO business_owners (first_name, last_name, email)
VALUES ('Test', 'Owner', 'test@example.com')
RETURNING id;

-- 2. Crea 2 organizzazioni per questo owner
INSERT INTO organizations (name, slug, owner_id)
VALUES
  ('Azienda 1', 'azienda1', '<owner_id_from_step_1>'),
  ('Azienda 2', 'azienda2', '<owner_id_from_step_1>');

-- 3. Verifica lo switcher
SELECT * FROM get_owner_organizations('test@example.com');
-- Dovrebbe tornare 2 organizzazioni!
```

## ⚠️ Note Importanti

1. **Backward Compatible**: Organizzazioni esistenti continueranno a funzionare
2. **owner_id è NULL per vecchi dati**: Ok, la migrazione li popola automaticamente
3. **Email unica**: Un owner = un email (constraint UNIQUE)
4. **Soft delete**: ON DELETE SET NULL (org non viene cancellata se owner viene rimosso)

## 🔄 Rollback

Se necessario:

```sql
-- Rimuovi FK
ALTER TABLE organizations DROP COLUMN owner_id;

-- Elimina tabella
DROP TABLE business_owners CASCADE;

-- Rimuovi funzione
DROP FUNCTION get_owner_organizations;
```

## 📱 UI Implementation

Dopo la migrazione, implementa lo switcher UI:

```typescript
// In AdminLayout o TopBar
const ownerEmail = user?.email
const organizations = await organizationService.getOwnerOrganizations(ownerEmail)

// Mostra dropdown menu
<OrganizationSwitcher organizations={organizations} />
```

## ✨ Prossimi Step

Dopo questa migrazione puoi:
1. ✅ Implementare UI organization switcher
2. ✅ Dashboard "Le mie aziende"
3. ✅ Analytics aggregate per owner
4. ✅ Fatturazione consolidata per owner
