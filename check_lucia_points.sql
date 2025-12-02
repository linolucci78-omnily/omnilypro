-- ========================================
-- CONTROLLO PUNTI LUCIA
-- ========================================

-- 1. Trova Lucia e i suoi punti attuali
SELECT
  id,
  first_name || ' ' || last_name as nome_completo,
  email,
  phone,
  points as punti_attuali,
  referred_by as codice_referral_usato,
  created_at as data_registrazione
FROM customers
WHERE first_name ILIKE '%lucia%'
  AND organization_id = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29';

-- ========================================
-- 2. Storico transazioni punti di Lucia
-- (Sostituisci [ID_LUCIA] con l'ID che ottieni dalla query sopra)
-- ========================================

SELECT
  created_at as data,
  type as tipo,
  points as punti,
  description as descrizione,
  sale_id,
  referral_id
FROM point_transactions
WHERE customer_id = '[ID_LUCIA]'
ORDER BY created_at DESC;

-- ========================================
-- 3. Vendite di Lucia (se ha fatto acquisti)
-- ========================================

SELECT
  created_at as data,
  total as totale_spesa,
  points_earned as punti_guadagnati,
  status
FROM sales
WHERE customer_id = '[ID_LUCIA]'
ORDER BY created_at DESC;

-- ========================================
-- 4. Referral: chi ha invitato Lucia?
-- ========================================

SELECT
  c.first_name || ' ' || c.last_name as chi_ha_invitato_lucia,
  c.referral_code,
  c.points as punti_referrer
FROM customers c
WHERE c.referral_code = (
  SELECT referred_by
  FROM customers
  WHERE id = '[ID_LUCIA]'
);

-- ========================================
-- 5. Chi ha invitato Lucia (referral ricevuti)
-- ========================================

SELECT
  c.first_name || ' ' || c.last_name as persone_invitate_da_lucia,
  c.created_at as data_registrazione,
  c.points as loro_punti
FROM customers c
WHERE c.referred_by = (
  SELECT referral_code
  FROM customers
  WHERE id = '[ID_LUCIA]'
)
ORDER BY c.created_at DESC;
