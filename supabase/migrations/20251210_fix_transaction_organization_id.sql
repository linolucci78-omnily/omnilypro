-- Fix transaction organization_id mismatch
-- Update transactions to use the correct organization_id from their associated customer

-- First, show how many transactions will be updated
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO affected_count
  FROM transaction t
  INNER JOIN customers c ON t.customer_id = c.id
  WHERE t.organization_id != c.organization_id OR t.organization_id IS NULL;

  RAISE NOTICE 'Transactions to update: %', affected_count;
END $$;

-- Update transactions to match their customer's organization_id
UPDATE transaction t
SET organization_id = c.organization_id
FROM customers c
WHERE t.customer_id = c.id
  AND (t.organization_id != c.organization_id OR t.organization_id IS NULL);

-- Verify the update
DO $$
DECLARE
  remaining_issues INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_issues
  FROM transaction t
  INNER JOIN customers c ON t.customer_id = c.id
  WHERE t.organization_id != c.organization_id OR t.organization_id IS NULL;

  RAISE NOTICE 'Remaining mismatches after update: %', remaining_issues;
END $$;
