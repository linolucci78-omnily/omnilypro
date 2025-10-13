-- ========================================
-- FASE 1, STEP 1: Creazione tabella organization_websites
-- Contiene la struttura e il design di ogni sito, gestito dall'Admin.
-- ========================================

CREATE TABLE organization_websites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template e struttura (solo Admin modifica)
  template_name TEXT NOT NULL, -- 'restaurant', 'retail', 'services', 'beauty', 'corporate'
  template_version INTEGER DEFAULT 1,

  -- Design GrapesJS (JSON)
  page_structure JSONB NOT NULL, -- Layout GrapesJS completo
  compiled_html TEXT, -- HTML compilato cache
  compiled_css TEXT, -- CSS compilato cache

  -- Configurazione campi modificabili dal cliente
  editable_fields JSONB NOT NULL, -- Schema campi che cliente può modificare
  
  -- SEO (configurato da Admin, alcuni campi editabili da Cliente)
  seo_config JSONB, -- Meta tags, schema.org, etc

  -- Publishing
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  published_by UUID REFERENCES users(id), -- Admin che ha pubblicato

  -- Custom domain (opzionale)
  custom_domain TEXT UNIQUE,
  domain_verified BOOLEAN DEFAULT false,
  domain_verified_at TIMESTAMP,

  -- Analytics
  total_visits INTEGER DEFAULT 0,
  total_leads INTEGER DEFAULT 0,
  last_visit_at TIMESTAMP,

  -- Audit
  created_by UUID REFERENCES users(id), -- Admin creator
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(organization_id) -- Una sola struttura per organizzazione
);

-- Indici per migliorare le performance delle query
CREATE INDEX idx_websites_org ON organization_websites(organization_id);
CREATE INDEX idx_websites_published ON organization_websites(is_published);
CREATE INDEX idx_websites_custom_domain ON organization_websites(custom_domain);

COMMENT ON TABLE organization_websites IS 'Contiene la struttura, il design (GrapesJS) e la configurazione SEO di ogni sito vetrina, gestita a livello di Super Admin.';
