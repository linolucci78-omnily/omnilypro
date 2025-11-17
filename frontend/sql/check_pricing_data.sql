-- Verifica se i dati del listino sono salvati
SELECT
  id,
  name,
  website_show_pricing,
  website_price_list_categories,
  LENGTH(website_price_list_categories::text) as data_length
FROM organizations
WHERE slug = 'YOUR_ORGANIZATION_SLUG'; -- Sostituisci con il tuo slug

-- Se non sai lo slug, usa questa query per vedere tutte le organizzazioni:
-- SELECT id, name, slug, website_show_pricing FROM organizations;
