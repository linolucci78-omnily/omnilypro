-- Migra le vendite storiche da customer_activities a transaction
-- Questo permette a Omny di analizzare anche le vendite passate

-- Prima, mostra quanti record verranno migrati
DO $$
DECLARE
  activities_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO activities_count
  FROM customer_activities
  WHERE activity_type = 'transaction'
    AND monetary_value IS NOT NULL
    AND monetary_value > 0;

  RAISE NOTICE 'Vendite da migrare: %', activities_count;
END $$;

-- Inserisci le transazioni storiche dalla tabella customer_activities
-- Usa INSERT ... ON CONFLICT DO NOTHING per evitare duplicati
INSERT INTO transaction (
  customer_id,
  organization_id,
  amount,
  points,
  type,
  description,
  created_at
)
SELECT
  ca.customer_id,
  ca.organization_id,
  ca.monetary_value,
  COALESCE(ca.points_earned, 0) as points,
  'sale' as type,
  COALESCE(ca.activity_description, 'Vendita POS (migrata)') as description,
  ca.created_at
FROM customer_activities ca
WHERE ca.activity_type = 'transaction'
  AND ca.monetary_value IS NOT NULL
  AND ca.monetary_value > 0
  -- Evita di inserire duplicati se questa migration viene eseguita più volte
  AND NOT EXISTS (
    SELECT 1
    FROM transaction t
    WHERE t.customer_id = ca.customer_id
      AND t.amount = ca.monetary_value
      AND t.created_at = ca.created_at
  )
ORDER BY ca.created_at ASC;

-- Mostra quanti record sono stati migrati
DO $$
DECLARE
  migrated_count INTEGER;
  oldest_tx TIMESTAMPTZ;
  newest_tx TIMESTAMPTZ;
BEGIN
  SELECT COUNT(*), MIN(created_at), MAX(created_at)
  INTO migrated_count, oldest_tx, newest_tx
  FROM transaction;

  RAISE NOTICE 'Transazioni totali nella tabella: %', migrated_count;
  RAISE NOTICE 'Prima transazione: %', oldest_tx;
  RAISE NOTICE 'Ultima transazione: %', newest_tx;
END $$;
