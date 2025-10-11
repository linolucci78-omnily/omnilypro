-- Migration 022: Aggiunge colonne per dati strutturati GrapeJS
-- Risolve problema: template perdono aspetto grafico quando caricati nell'editor
-- Data: 2025-01-11

-- ============================================
-- Aggiungi colonne per dati GrapeJS
-- ============================================

ALTER TABLE email_templates
ADD COLUMN IF NOT EXISTS css_styles TEXT,
ADD COLUMN IF NOT EXISTS gjs_components JSONB,
ADD COLUMN IF NOT EXISTS gjs_styles JSONB;

-- Commenti per le nuove colonne
COMMENT ON COLUMN email_templates.css_styles IS 'CSS estratto da GrapeJS (separato dall''HTML)';
COMMENT ON COLUMN email_templates.gjs_components IS 'Componenti GrapeJS in formato JSON per ricostruire l''editor';
COMMENT ON COLUMN email_templates.gjs_styles IS 'Stili GrapeJS in formato JSON per ricostruire l''editor';

-- ============================================
-- Migrazione dati esistenti
-- ============================================

-- Per i template esistenti, estrai il CSS dal tag <style> nell'html_body
-- e salvalo nella nuova colonna css_styles
UPDATE email_templates
SET css_styles = CASE
  WHEN html_body ~ '<style[^>]*>(.*?)</style>' THEN
    (regexp_match(html_body, '<style[^>]*>(.*?)</style>', 'is'))[1]
  ELSE NULL
END
WHERE css_styles IS NULL;

-- ============================================
-- FINE MIGRATION 022
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 022 completata con successo!';
  RAISE NOTICE '📝 Colonne aggiunte: css_styles, gjs_components, gjs_styles';
  RAISE NOTICE '🔄 Dati CSS estratti dai template esistenti';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ IMPORTANTE: I template esistenti hanno ora il CSS separato,';
  RAISE NOTICE '   ma non hanno ancora i dati GrapeJS (gjs_components, gjs_styles).';
  RAISE NOTICE '   Dovranno essere ri-modificati nell''editor per salvare questi dati.';
END $$;
