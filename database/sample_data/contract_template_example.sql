-- ============================================
-- ESEMPIO: Template Contratto di Servizio
-- ============================================
-- Questo file contiene un esempio di template contratto
-- da inserire nel database per testare il sistema

-- IMPORTANTE: Sostituisci 'YOUR_ORG_ID_HERE' con l'ID della tua organizzazione
-- Puoi trovarlo eseguendo: SELECT id, name FROM organizations;

INSERT INTO contract_templates (
  organization_id,
  name,
  description,
  template_type,
  content,
  variables,
  requires_counter_signature,
  signature_positions,
  is_active
) VALUES (
  'YOUR_ORG_ID_HERE', -- Sostituisci con il tuo organization_id
  'Contratto di Servizio Standard',
  'Template standard per contratti di fornitura servizi',
  'service_agreement',

  -- Contenuto del contratto (HTML/Testo con variabili)
  '# CONTRATTO DI FORNITURA SERVIZI

## Tra

**FORNITORE:**
{{vendor_company}}
P.IVA: {{vendor_vat}}
Indirizzo: {{vendor_address}}

**CLIENTE:**
{{client_company}}
P.IVA: {{client_vat}}
Rappresentato da: {{client_name}}
Email: {{client_email}}
Telefono: {{client_phone}}
Indirizzo: {{client_address}}

## Art. 1 - Oggetto del Contratto

Il presente contratto ha per oggetto la fornitura dei seguenti servizi:

{{service_description}}

## Art. 2 - Durata

Il contratto ha durata di {{contract_duration}} a partire dalla data di firma.

## Art. 3 - Corrispettivo

Il Cliente si impegna a corrispondere al Fornitore l''importo totale di:

**€ {{contract_value}}** ({{contract_value_text}})

secondo le seguenti modalità di pagamento: {{payment_terms}}

## Art. 4 - Modalità di Esecuzione

Il Fornitore si impegna a:
- Fornire i servizi descritti con professionalità e competenza
- Rispettare i termini di consegna concordati
- Garantire assistenza tecnica per {{support_duration}}

Il Cliente si impegna a:
- Fornire tutte le informazioni necessarie per l''esecuzione del servizio
- Rispettare i termini di pagamento
- Collaborare attivamente con il Fornitore

## Art. 5 - Penali e Recesso

In caso di inadempimento contrattuale, la parte inadempiente sarà tenuta al risarcimento dei danni.

Ciascuna parte può recedere dal contratto con preavviso scritto di {{notice_period}} giorni.

## Art. 6 - Riservatezza

Entrambe le parti si impegnano a mantenere riservate le informazioni commerciali e tecniche scambiate durante l''esecuzione del contratto.

## Art. 7 - Trattamento dei Dati Personali

Il trattamento dei dati personali avverrà nel rispetto del GDPR (Regolamento UE 2016/679).

## Art. 8 - Legge Applicabile e Foro Competente

Il presente contratto è regolato dalla legge italiana. Per qualsiasi controversia è competente il Foro di {{jurisdiction}}.

## Firma Digitale

Il presente contratto viene sottoscritto mediante firma digitale in conformità al Regolamento eIDAS (EU) n. 910/2014.

Data: {{current_date}}

_____________________
Firma Cliente

_____________________
Firma Fornitore
',

  -- Variabili disponibili nel template
  jsonb_build_object(
    'variables', jsonb_build_array(
      'vendor_company',
      'vendor_vat',
      'vendor_address',
      'client_company',
      'client_vat',
      'client_name',
      'client_email',
      'client_phone',
      'client_address',
      'service_description',
      'contract_duration',
      'contract_value',
      'contract_value_text',
      'payment_terms',
      'support_duration',
      'notice_period',
      'jurisdiction',
      'current_date'
    )
  ),

  true, -- Richiede firma di entrambe le parti

  -- Posizioni delle firme
  jsonb_build_object(
    'client_signature', jsonb_build_object('page', 1, 'x', 100, 'y', 700),
    'vendor_signature', jsonb_build_object('page', 1, 'x', 400, 'y', 700)
  ),

  true -- Template attivo
) ON CONFLICT DO NOTHING;

-- ============================================
-- ESEMPIO: Template NDA (Non-Disclosure Agreement)
-- ============================================

INSERT INTO contract_templates (
  organization_id,
  name,
  description,
  template_type,
  content,
  variables,
  requires_counter_signature,
  signature_positions,
  is_active
) VALUES (
  'YOUR_ORG_ID_HERE', -- Sostituisci con il tuo organization_id
  'NDA - Accordo di Riservatezza',
  'Template per accordo di non divulgazione',
  'nda',

  '# ACCORDO DI RISERVATEZZA (NDA)

Tra {{vendor_company}} (di seguito "Parte Divulgante") e {{client_company}} (di seguito "Parte Ricevente")

## 1. Definizioni

Per "Informazioni Riservate" si intendono tutte le informazioni di natura tecnica, commerciale, finanziaria o strategica comunicate dalla Parte Divulgante alla Parte Ricevente.

## 2. Obblighi di Riservatezza

La Parte Ricevente si impegna a:
- Mantenere riservate le Informazioni Riservate
- Non divulgare a terzi senza autorizzazione scritta
- Utilizzare le informazioni solo per gli scopi concordati

## 3. Durata

Il presente accordo ha durata di {{agreement_duration}} dalla data di firma.

## 4. Firma Digitale

Firmato digitalmente in conformità al Regolamento eIDAS (EU).

Data: {{current_date}}

__________________
{{client_name}}
{{client_company}}
',

  jsonb_build_object(
    'variables', jsonb_build_array(
      'vendor_company',
      'client_company',
      'client_name',
      'agreement_duration',
      'current_date'
    )
  ),

  true,

  jsonb_build_object(
    'client_signature', jsonb_build_object('page', 1, 'x', 200, 'y', 600)
  ),

  true
) ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICA INSERIMENTO
-- ============================================
-- Esegui questa query per verificare che i template siano stati inseriti

-- SELECT
--   id,
--   name,
--   template_type,
--   is_active,
--   created_at
-- FROM contract_templates
-- ORDER BY created_at DESC;
