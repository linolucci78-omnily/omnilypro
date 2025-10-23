-- ============================================================================
-- FIX RAPIDO: Crea organizzazione e assegna utenti
-- ============================================================================
-- Esegui questa query INTERA nel SQL Editor di Supabase
-- ============================================================================

-- Crea organizzazione e assegna utenti in un colpo solo
DO $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Inserisci organizzazione
  INSERT INTO organizations (name, slug, billing_email)
  VALUES ('OmnilyPro', 'omnilypro', 'admin@omnilypro.com')
  RETURNING id INTO new_org_id;

  -- Stampa ID organizzazione creata
  RAISE NOTICE 'Organizzazione creata con ID: %', new_org_id;

  -- Assegna organizzazione a tutti gli utenti
  UPDATE users
  SET organization_id = new_org_id
  WHERE organization_id IS NULL;

  -- Stampa risultato
  RAISE NOTICE 'Utenti aggiornati con successo!';
END $$;

-- Verifica risultato
SELECT
  u.id,
  u.email,
  u.full_name,
  u.organization_id,
  o.name as organization_name
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
ORDER BY u.created_at;
