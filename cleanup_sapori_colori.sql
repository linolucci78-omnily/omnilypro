-- ============================================================================
-- CLEANUP COMPLETO per "Sapori e Colori" - Pronti per produzione
-- ============================================================================

-- Step 1: Elimina tutte le conversioni referral
DELETE FROM referral_conversions
WHERE organization_id = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29';

-- Step 2: Elimina tutti i programmi referral
DELETE FROM referral_programs
WHERE organization_id = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29';

-- Step 3: Elimina tutte le redemptions
DELETE FROM reward_redemptions
WHERE organization_id = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29';

-- Step 4: Elimina tutti i clienti
DELETE FROM customers
WHERE organization_id = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29';

-- Step 5: Verifica che tutto sia stato eliminato
SELECT COUNT(*) as remaining_customers
FROM customers
WHERE organization_id = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29';

SELECT COUNT(*) as remaining_referral_programs
FROM referral_programs
WHERE organization_id = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29';

SELECT COUNT(*) as remaining_conversions
FROM referral_conversions
WHERE organization_id = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29';

SELECT COUNT(*) as remaining_redemptions
FROM reward_redemptions
WHERE organization_id = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29';

-- ============================================================================
-- RISULTATI ATTESI:
-- - remaining_customers: 0
-- - remaining_referral_programs: 0
-- - remaining_conversions: 0
-- - remaining_redemptions: 0
--
-- Sistema pronto per clienti reali domani mattina
-- ============================================================================
