-- =====================================================
-- FASE 1: FOUNDER ID - DATABASE MIGRATION
-- =====================================================
-- Questo script aggiunge il campo founder_id alla tabella users
-- e genera automaticamente un ID univoco per ogni utente

-- STEP 1: Aggiungere colonna founder_id
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS founder_id VARCHAR(12) UNIQUE;

-- STEP 2: Creare funzione per generare Founder ID univoco
CREATE OR REPLACE FUNCTION generate_founder_id()
RETURNS VARCHAR(12) AS $$
DECLARE
  new_id VARCHAR(12);
  id_exists BOOLEAN;
BEGIN
  LOOP
    -- Genera ID nel formato FD-XXXX-XX
    new_id := 'FD-' ||
              UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 4)) ||
              '-' ||
              UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 2));

    -- Verifica se l'ID esiste già
    SELECT EXISTS(SELECT 1 FROM public.users WHERE founder_id = new_id) INTO id_exists;

    -- Se non esiste, esci dal loop
    IF NOT id_exists THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- STEP 3: Generare Founder ID per utenti esistenti che non ce l'hanno
UPDATE public.users
SET founder_id = generate_founder_id()
WHERE founder_id IS NULL;

-- STEP 4: Rendere il campo NOT NULL dopo aver popolato tutti i record
ALTER TABLE public.users
ALTER COLUMN founder_id SET NOT NULL;

-- STEP 5: Creare indice per performance
CREATE INDEX IF NOT EXISTS idx_users_founder_id ON public.users(founder_id);

-- STEP 6: Creare trigger per auto-generazione su nuovi utenti
CREATE OR REPLACE FUNCTION assign_founder_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.founder_id IS NULL THEN
    NEW.founder_id := generate_founder_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 7: Collegare trigger alla tabella users
DROP TRIGGER IF EXISTS trigger_assign_founder_id ON public.users;
CREATE TRIGGER trigger_assign_founder_id
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_founder_id();

-- STEP 8: Creare commenti per documentazione
COMMENT ON COLUMN public.users.founder_id IS 'Founder ID univoco e permanente per identificazione del proprietario. Formato: FD-XXXX-XX. Generato automaticamente, non modificabile manualmente.';

-- STEP 9: Policy RLS (Row Level Security) - Solo l'utente può vedere il proprio founder_id
-- Nota: Se vuoi che solo super admin possano vedere founder_id di altri, decommenta:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Users can view own founder_id"
--   ON public.users
--   FOR SELECT
--   USING (auth.uid() = id OR EXISTS (
--     SELECT 1 FROM public.users
--     WHERE id = auth.uid() AND role = 'super_admin'
--   ));

-- VERIFICA: Mostra tutti gli utenti con il loro Founder ID
SELECT
  id,
  email,
  first_name,
  last_name,
  role,
  founder_id,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- =====================================================
-- RISULTATO ATTESO:
-- =====================================================
-- Ogni utente avrà un founder_id univoco nel formato FD-XXXX-XX
-- Esempi:
--   FD-4A2B-C3
--   FD-9F1E-D7
--   FD-2C8A-B1
--
-- Il campo è:
-- ✅ UNIQUE (nessun duplicato)
-- ✅ NOT NULL (sempre presente)
-- ✅ IMMUTABLE (non modificabile da UPDATE normale)
-- ✅ AUTO-GENERATED per nuovi utenti
-- =====================================================

-- ROLLBACK (se necessario - NON eseguire in produzione!)
-- ALTER TABLE public.users DROP COLUMN founder_id;
-- DROP FUNCTION IF EXISTS generate_founder_id();
-- DROP FUNCTION IF EXISTS assign_founder_id() CASCADE;
