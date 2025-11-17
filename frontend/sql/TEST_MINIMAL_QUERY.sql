-- ============================================
-- TEST QUERY MINIMALE
-- Esegui questo per vedere se la query base funziona
-- ============================================

-- Test 1: Verifica che l'organizzazione esista
SELECT id, name, slug, website_enabled, website_maintenance_mode
FROM organizations
WHERE slug = 'saporiecolori';

-- Test 2: Query con SOLO le colonne base (come fa websiteService.ts)
SELECT
  id, name, slug, logo_url, primary_color, secondary_color, tagline, slogan,
  email, phone, address, website_enabled
FROM organizations
WHERE slug = 'saporiecolori'
  AND website_enabled = true;

-- Test 3: Prova ad aggiungere una colonna website_ alla volta
SELECT
  id, name, slug,
  website_enabled,
  website_template,
  website_description,
  website_hero_image
FROM organizations
WHERE slug = 'saporiecolori'
  AND website_enabled = true;
