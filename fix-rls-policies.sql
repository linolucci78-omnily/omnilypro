-- Fix RLS Policies per permettere accesso da frontend

-- 1. TEMPORANEO: Disabilita RLS su devices per testare se è quello il problema
-- (Riabiliteremo dopo con policies corrette)
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE setup_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE device_commands DISABLE ROW LEVEL SECURITY;

-- NOTA: Questo è SOLO per testare!
-- Non lasciare RLS disabilitato in produzione!

-- Se questo risolve il problema, significa che le policies RLS sono troppo restrittive
-- e dobbiamo aggiustarle invece di disabilitare RLS
