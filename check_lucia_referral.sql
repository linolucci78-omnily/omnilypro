-- ========================================
-- CONTROLLA CODICE REFERRAL DI LUCIA
-- ========================================

-- 1. Codice nella tabella customers
SELECT
  id,
  first_name,
  last_name,
  email,
  referral_code as codice_in_customers
FROM customers
WHERE email = 'lucia.procope47@gmail.com';

-- 2. Codice nella tabella referral_programs
SELECT
  customer_id,
  referral_code as codice_in_referral_programs,
  successful_referrals,
  total_referrals,
  is_active
FROM referral_programs
WHERE customer_id = (
  SELECT id FROM customers WHERE email = 'lucia.procope47@gmail.com'
);

-- 3. Verifica se esistono entrambi e se corrispondono
SELECT
  c.first_name,
  c.last_name,
  c.referral_code as codice_customers,
  rp.referral_code as codice_referral_programs,
  CASE
    WHEN c.referral_code = rp.referral_code THEN '✅ MATCH'
    ELSE '❌ DIVERSI!'
  END as confronto
FROM customers c
LEFT JOIN referral_programs rp ON rp.customer_id = c.id
WHERE c.email = 'lucia.procope47@gmail.com';
