-- Rimuovi il check constraint che limita i tier a valori fissi (Bronze, Silver, Gold, Platinum)
-- Questo permette di usare tier dinamici configurati dall'organizzazione

-- 1. Rimuovi il constraint esistente
ALTER TABLE customers
DROP CONSTRAINT IF EXISTS customers_tier_check;

-- 2. (Opzionale) Aggiungi un nuovo constraint che permette qualsiasi stringa non vuota
ALTER TABLE customers
ADD CONSTRAINT customers_tier_not_empty CHECK (tier IS NOT NULL AND tier != '');

-- Verifica che il constraint sia stato rimosso
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'customers'::regclass
AND conname LIKE '%tier%';
