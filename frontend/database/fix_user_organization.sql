-- ============================================================================
-- FIX: Assegna organizzazione all'utente
-- ============================================================================
-- ISTRUZIONI: Esegui le query UNA ALLA VOLTA nell'ordine indicato
-- ============================================================================

-- ============================================================================
-- STEP 1: Verifica organizzazioni esistenti
-- ============================================================================
-- Copia e incolla questa query nel SQL Editor di Supabase e esegui
SELECT
  id as organization_id,
  name,
  created_at
FROM organizations
ORDER BY created_at ASC;

-- Se questa query ritorna dei risultati, ANNOTA il primo 'organization_id'
-- Se non ritorna risultati, passa allo STEP 2


-- ============================================================================
-- STEP 2: Verifica utenti senza organizzazione
-- ============================================================================
SELECT
  id as user_id,
  email,
  full_name,
  organization_id,
  role
FROM users
WHERE organization_id IS NULL;

-- Se ci sono utenti con organization_id = NULL, devi assegnarli a un'organizzazione


-- ============================================================================
-- STEP 3: Crea organizzazione (SOLO se STEP 1 non ha ritornato risultati)
-- ============================================================================
-- Esegui SOLO se non esiste nessuna organizzazione
INSERT INTO organizations (name)
VALUES ('OmnilyPro Default Organization')
RETURNING id;

-- ANNOTA l'ID ritornato da questa query


-- ============================================================================
-- STEP 4: Assegna organizzazione a tutti gli utenti
-- ============================================================================
-- Questa query assegna automaticamente la prima organizzazione disponibile
-- a tutti gli utenti che non hanno organization_id
UPDATE users
SET organization_id = (
  SELECT id FROM organizations ORDER BY created_at ASC LIMIT 1
)
WHERE organization_id IS NULL
RETURNING id, email, organization_id;


-- ============================================================================
-- STEP 5: Verifica finale
-- ============================================================================
-- Controlla che tutti gli utenti abbiano ora un'organizzazione
SELECT
  u.id as user_id,
  u.email,
  u.full_name,
  u.organization_id,
  o.name as organization_name,
  u.role
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
ORDER BY u.created_at;

-- TUTTI gli utenti devono avere organization_id NON NULL
-- Se vedi ancora NULL, ripeti STEP 4


-- ============================================================================
-- BONUS: Promuovi primo admin a super_admin (opzionale)
-- ============================================================================
-- Esegui solo se vuoi che il primo admin diventi super_admin
UPDATE users
SET role = 'super_admin'
WHERE id = (
  SELECT id
  FROM users
  WHERE role IN ('admin', 'manager')
  ORDER BY created_at ASC
  LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 FROM users WHERE role = 'super_admin'
)
RETURNING id, email, role;
