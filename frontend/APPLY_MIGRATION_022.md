# 🔧 ISTRUZIONI: Applicare Migrazione 022

## ⚠️ IMPORTANTE
Le colonne GrapeJS non esistono ancora nel database. Devi applicare questa migrazione **manualmente** tramite il SQL Editor di Supabase.

## 📋 Passi da Seguire

### Passo 1: Accedi a Supabase Dashboard
Vai su: https://supabase.com/dashboard/project/sjvatdnvewohvswfrdiv

### Passo 2: Apri SQL Editor
- Clicca su "SQL Editor" nel menu laterale
- Clicca su "New Query"

### Passo 3: Copia e Incolla questo SQL

```sql
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
    (regexp_matches(html_body, '<style[^>]*>(.*?)</style>', 'is'))[1]
  ELSE NULL
END
WHERE css_styles IS NULL;
```

### Passo 4: Esegui la Query
- Clicca sul pulsante "RUN" (o premi Ctrl+Enter / Cmd+Enter)
- Attendi il messaggio di successo

### Passo 5: Verifica
Torna al terminale ed esegui:
```bash
node check-grapesjs-columns.js
```

Dovresti vedere "✅ Le colonne GrapeJS esistono!"

## 🎯 Cosa Fa Questa Migrazione

1. **Aggiunge 3 nuove colonne** alla tabella `email_templates`:
   - `css_styles` (TEXT) - CSS separato dall'HTML
   - `gjs_components` (JSONB) - Struttura componenti GrapeJS
   - `gjs_styles` (JSONB) - Stili GrapeJS

2. **Estrae il CSS esistente** dai template che hanno `<style>` nel loro `html_body`

3. **Risolve il problema** dei template che perdono l'aspetto grafico quando riaperti nell'editor

## ❓ Perché Non Posso Farlo Automaticamente?

Il client JavaScript di Supabase non può eseguire comandi DDL (Data Definition Language) come `ALTER TABLE`.
Questi comandi richiedono accesso diretto al database tramite SQL Editor o CLI.

---

**Dopo aver applicato la migrazione, torna qui e continueremo con il testing! 🚀**
