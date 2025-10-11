/**
 * Script per mostrare il SQL della migrazione 022
 * Copia l'output e incollalo nel SQL Editor di Supabase
 */

console.log('\n' + '='.repeat(80));
console.log('📋 MIGRAZIONE 022 - SQL DA ESEGUIRE');
console.log('='.repeat(80));
console.log('\n🔗 Vai su: https://supabase.com/dashboard/project/sjvatdnvewohvswfrdiv');
console.log('📝 Clicca: SQL Editor → New Query');
console.log('📋 Copia e incolla il SQL qui sotto:\n');
console.log('='.repeat(80));
console.log(`
-- Migration 022: Aggiunge colonne per dati strutturati GrapeJS
ALTER TABLE email_templates
ADD COLUMN IF NOT EXISTS css_styles TEXT,
ADD COLUMN IF NOT EXISTS gjs_components JSONB,
ADD COLUMN IF NOT EXISTS gjs_styles JSONB;

-- Commenti per le nuove colonne
COMMENT ON COLUMN email_templates.css_styles IS 'CSS estratto da GrapeJS (separato dall''HTML)';
COMMENT ON COLUMN email_templates.gjs_components IS 'Componenti GrapeJS in formato JSON per ricostruire l''editor';
COMMENT ON COLUMN email_templates.gjs_styles IS 'Stili GrapeJS in formato JSON per ricostruire l''editor';

-- Per i template esistenti, estrai il CSS dal tag <style> nell'html_body
UPDATE email_templates
SET css_styles = CASE
  WHEN html_body ~ '<style[^>]*>(.*?)</style>' THEN
    (regexp_match(html_body, '<style[^>]*>(.*?)</style>', 'is'))[1]
  ELSE NULL
END
WHERE css_styles IS NULL;
`);
console.log('='.repeat(80));
console.log('\n✅ Dopo aver eseguito il SQL, esegui:');
console.log('   node check-grapesjs-columns.js\n');
console.log('🎯 Per verificare che le colonne siano state create correttamente.\n');
