-- ========================================
-- FASE 1, STEP 2: Creazione tabella website_content
-- Contiene i valori dei singoli campi modificabili dal cliente (es. il testo di un titolo, l'URL di un'immagine).
-- ========================================

CREATE TABLE website_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID REFERENCES organization_websites(id) ON DELETE CASCADE,

  -- Identificativo campo, es. 'hero.title', 'products.0.name'
  field_name TEXT NOT NULL, 
  field_type TEXT NOT NULL, -- 'text', 'textarea', 'image', 'number', etc.

  -- Valore effettivo del contenuto
  field_value JSONB NOT NULL, 

  -- Stato bozza/pubblicato per singola modifica
  is_draft BOOLEAN DEFAULT false,

  -- Audit
  updated_by UUID REFERENCES users(id), -- L'utente dell'organizzazione che ha modificato
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Un solo valore per ogni campo specifico di un sito web
  UNIQUE(website_id, field_name)
);

CREATE INDEX idx_content_website ON website_content(website_id);
CREATE INDEX idx_content_field ON website_content(field_name);

COMMENT ON TABLE website_content IS 'Conserva i contenuti specifici inseriti dal cliente, separati dalla struttura del sito gestita dall\'admin.';

