-- ============================================================================
-- CONTROLLA STRUTTURA TABELLA CUSTOMERS
-- ============================================================================

-- Mostra tutte le colonne della tabella customers
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;