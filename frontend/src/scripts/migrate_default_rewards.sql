-- Script per migrare i default_rewards dalla tabella organizations alla tabella rewards
-- Esegui questo script una volta per creare i premi dalla configurazione esistente

-- Inserisci i premi dalla configurazione default_rewards dell'organizzazione
INSERT INTO rewards (
  organization_id,
  name,
  description,
  type,
  value,
  points_required,
  required_tier,
  stock_quantity,
  is_active,
  created_at,
  updated_at
)
SELECT
  o.id AS organization_id,
  COALESCE(reward->>'description', 'Premio ' || (reward->>'points') || ' punti') AS name,
  COALESCE(reward->>'description', '') AS description,
  COALESCE(reward->>'type', 'discount') AS type,
  COALESCE(reward->>'value', '0') AS value,
  CAST(COALESCE(reward->>'points', '100') AS INTEGER) AS points_required,
  reward->>'requiredTier' AS required_tier,
  NULL AS stock_quantity,
  true AS is_active,
  NOW() AS created_at,
  NOW() AS updated_at
FROM
  organizations o,
  jsonb_array_elements(o.default_rewards) AS reward
WHERE
  o.default_rewards IS NOT NULL
  AND jsonb_array_length(o.default_rewards) > 0
  -- Evita duplicati - esegui solo se non esistono già premi per questa org
  AND NOT EXISTS (
    SELECT 1 FROM rewards r WHERE r.organization_id = o.id
  );

-- Verifica i premi creati
SELECT
  o.name AS organization_name,
  COUNT(r.id) AS rewards_count
FROM
  organizations o
LEFT JOIN
  rewards r ON r.organization_id = o.id
GROUP BY
  o.id, o.name
ORDER BY
  o.name;
