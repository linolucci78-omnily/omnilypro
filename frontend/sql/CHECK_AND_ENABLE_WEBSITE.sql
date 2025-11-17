-- ============================================
-- VERIFICA E ABILITA SITO WEB
-- ============================================

-- 1. Verifica lo stato attuale
SELECT
  id,
  name,
  slug,
  website_enabled,
  website_maintenance_mode
FROM organizations
WHERE slug = 'saporiecolori';

-- 2. Se il sito esiste, abilitalo
UPDATE organizations
SET website_enabled = true,
    website_maintenance_mode = false
WHERE slug = 'saporiecolori';

-- 3. Verifica di nuovo
SELECT
  id,
  name,
  slug,
  website_enabled,
  website_maintenance_mode,
  website_show_hero,
  website_show_contact_form
FROM organizations
WHERE slug = 'saporiecolori';
