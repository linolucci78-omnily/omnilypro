-- Migrazione per popolare first_name e last_name dai clienti esistenti
-- Splitta il campo 'name' in first_name e last_name

UPDATE customers
SET
  first_name = CASE
    -- Se il name contiene uno spazio, prendi la prima parte
    WHEN name IS NOT NULL AND name != '' AND POSITION(' ' IN name) > 0 THEN
      SPLIT_PART(name, ' ', 1)
    -- Altrimenti usa tutto il name come first_name
    WHEN name IS NOT NULL AND name != '' THEN
      name
    ELSE
      NULL
  END,
  last_name = CASE
    -- Se il name contiene uno spazio, prendi tutto dopo il primo spazio
    WHEN name IS NOT NULL AND name != '' AND POSITION(' ' IN name) > 0 THEN
      SUBSTRING(name FROM POSITION(' ' IN name) + 1)
    ELSE
      NULL
  END
WHERE
  -- Solo per clienti che hanno 'name' ma non hanno first_name o last_name
  (first_name IS NULL OR last_name IS NULL OR first_name = '' OR last_name = '')
  AND name IS NOT NULL
  AND name != '';

-- Verifica risultati
SELECT
  id,
  name,
  first_name,
  last_name,
  email
FROM customers
WHERE organization_id = (SELECT id FROM organizations LIMIT 1)
LIMIT 10;
