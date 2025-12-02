-- ========================================
-- CREA COUPON DI ESEMPIO PER SAPORI E COLORI
-- Include sia flash offers che coupon normali
-- ========================================

-- 1. Flash Offer - Sconto Caffè
INSERT INTO coupons (
  organization_id,
  code,
  type,
  value,
  duration_type,
  valid_from,
  valid_until,
  status,
  title,
  description,
  is_flash,
  background_color,
  text_color
) VALUES (
  'c06a8dcf-b209-40b1-92a5-c80facf2eb29',
  'CAFFE25',
  'percentage',
  25,
  'flash',
  NOW(),
  NOW() + INTERVAL '48 hours',
  'active',
  'La Tua Pausa Perfetta!',
  'Goditi uno sconto del 25% sul tuo prossimo caffè preferito. Un piccolo piacere, un grande risparmio!',
  true,
  '#ef4444',
  '#ffffff'
);

-- 2. Flash Offer - Combo Caffè e Pasticcino
INSERT INTO coupons (
  organization_id,
  code,
  type,
  value,
  duration_type,
  valid_from,
  valid_until,
  status,
  title,
  description,
  is_flash,
  background_color,
  text_color
) VALUES (
  'c06a8dcf-b209-40b1-92a5-c80facf2eb29',
  'COMBO30',
  'percentage',
  30,
  'flash',
  NOW(),
  NOW() + INTERVAL '96 hours',
  'active',
  'Pausa Perfetta - Caffè & Pasticcino',
  'Caffè e pasticcino: l''accoppiata vincente ti aspetta con uno sconto speciale del 30%!',
  true,
  '#f97316',
  '#ffffff'
);

-- 3. Coupon Normale - Colazione
INSERT INTO coupons (
  organization_id,
  code,
  type,
  value,
  duration_type,
  valid_from,
  valid_until,
  status,
  title,
  description,
  terms_conditions,
  min_purchase_amount,
  background_color,
  text_color,
  is_flash
) VALUES (
  'c06a8dcf-b209-40b1-92a5-c80facf2eb29',
  'MORNING20',
  'percentage',
  20,
  'standard',
  NOW(),
  NOW() + INTERVAL '30 days',
  'active',
  'Sconto Colazione',
  '20% di sconto su tutti i prodotti da colazione entro le 10:00.',
  'Valido solo per acquisti effettuati prima delle 10:00',
  5.00,
  '#dc2626',
  '#ffffff',
  false
);

-- 4. Coupon Normale - Caffè Omaggio
INSERT INTO coupons (
  organization_id,
  code,
  type,
  value,
  duration_type,
  valid_from,
  valid_until,
  status,
  title,
  description,
  min_purchase_amount,
  background_color,
  text_color,
  is_flash
) VALUES (
  'c06a8dcf-b209-40b1-92a5-c80facf2eb29',
  'FREECOFFEE',
  'free_product',
  'Caffè Espresso',
  'standard',
  NOW(),
  NOW() + INTERVAL '60 days',
  'active',
  'Caffè Omaggio',
  'Un caffè espresso in omaggio con qualsiasi acquisto di pasticceria.',
  3.00,
  '#10b981',
  '#ffffff',
  false
);

-- 5. Coupon Normale - Happy Hour
INSERT INTO coupons (
  organization_id,
  code,
  type,
  value,
  duration_type,
  valid_from,
  valid_until,
  status,
  title,
  description,
  terms_conditions,
  background_color,
  text_color,
  is_flash
) VALUES (
  'c06a8dcf-b209-40b1-92a5-c80facf2eb29',
  'HAPPYHOUR2X1',
  'buy_x_get_y',
  '2x1',
  'long',
  NOW(),
  NOW() + INTERVAL '90 days',
  'active',
  'Happy Hour',
  'Paghi 1 prendi 2 su tutti gli aperitivi dalle 18:00.',
  'Valido dalle 18:00 alle 20:00. Non cumulabile con altre promozioni.',
  '#8b5cf6',
  '#ffffff',
  false
);

-- Verifica coupon creati
SELECT
  id,
  code,
  title,
  type,
  value,
  is_flash,
  status,
  valid_until
FROM coupons
WHERE organization_id = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29'
ORDER BY is_flash DESC, created_at DESC;
