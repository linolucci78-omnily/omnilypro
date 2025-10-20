import React, { useState, useEffect } from 'react'
import { X, FileText, Building2, Euro, Calendar, User, Eye } from 'lucide-react'
import { contractsService } from '../../services/contractsService'
import { crmLeadsService, type CRMLead } from '../../services/crmLeadsService'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import './CreateContractModal.css'

interface CreateContractModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  preSelectedLeadId?: string
}

const CreateContractModal: React.FC<CreateContractModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preSelectedLeadId
}) => {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [leads, setLeads] = useState<CRMLead[]>([])
  const [loadingLeads, setLoadingLeads] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [formData, setFormData] = useState({
    lead_id: preSelectedLeadId || '',
    title: '',
    contract_type: 'service_agreement' as const,
    contract_value: '',
    currency: 'EUR',
    start_date: '',
    end_date: '',
    payment_terms: ''
  })

  // Live contract preview
  const [contractPreview, setContractPreview] = useState('')
  const [showFullscreenPreview, setShowFullscreenPreview] = useState(false)

  // Get current user and organization when modal opens
  useEffect(() => {
    if (!isOpen) return

    const getCurrentUser = async () => {
      try {
        setLoadingUser(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          setCurrentUserId(user.id)
          console.log('✅ User ID loaded:', user.id)

          // Get organization
          const { data: userData, error } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', user.id)
            .single()

          if (error) {
            console.error('❌ Error loading organization:', error)
            toast.showError('Errore', 'Impossibile caricare i dati dell\'organizzazione')
          } else if (userData) {
            setOrganizationId(userData.organization_id)
            console.log('✅ Organization ID loaded:', userData.organization_id)
          }
        }
      } catch (error) {
        console.error('❌ Error in getCurrentUser:', error)
        toast.showError('Errore', 'Impossibile caricare i dati utente')
      } finally {
        setLoadingUser(false)
      }
    }
    getCurrentUser()
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      loadLeads()
    }
  }, [isOpen])

  useEffect(() => {
    if (preSelectedLeadId) {
      setFormData(prev => ({ ...prev, lead_id: preSelectedLeadId }))
    }
  }, [preSelectedLeadId])

  // Update contract preview whenever form data or selected lead changes
  useEffect(() => {
    if (formData.lead_id && leads.length > 0) {
      const selectedLead = leads.find(l => l.id === formData.lead_id)
      if (selectedLead) {
        const preview = generateContractContent(formData, selectedLead)
        setContractPreview(preview)
      }
    } else {
      // Show template with placeholders
      setContractPreview(generateContractContent(formData, {
        id: '',
        company_name: '[Nome Azienda]',
        contact_name: '[Nome Rappresentante Legale]',
        email: '[Email]',
        phone: '[Telefono]',
        address: '[Indirizzo]',
        vat_number: '[P.IVA]',
        stage: 'lead',
        probability: 0,
        estimated_monthly_value: 0,
        created_at: '',
        updated_at: ''
      } as CRMLead))
    }
  }, [formData, leads])

  const loadLeads = async () => {
    try {
      setLoadingLeads(true)
      const data = await crmLeadsService.getLeads()
      setLeads(data.filter(l => l.stage !== 'lost' && l.stage !== 'won'))
    } catch (error) {
      console.error('Error loading leads:', error)
      toast.showError('Errore', 'Impossibile caricare i lead')
    } finally {
      setLoadingLeads(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.lead_id) {
      toast.showError('Errore', 'Seleziona un lead')
      return
    }

    if (!formData.title || !formData.contract_value) {
      toast.showError('Errore', 'Compila tutti i campi obbligatori')
      return
    }

    try {
      setLoading(true)

      // Get fresh user data if not loaded
      let userId = currentUserId
      let orgId = organizationId

      if (!userId || !orgId) {
        console.log('🔄 Loading user data on submit...')
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          userId = user.id
          const { data: userData } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', user.id)
            .single()
          if (userData) {
            orgId = userData.organization_id
          }
        }
      }

      if (!userId || !orgId) {
        toast.showError('Errore', 'Utente o organizzazione non trovati')
        return
      }

      console.log('📝 Creating contract with:', { userId, orgId })

      // Trova i dati del lead selezionato
      const selectedLead = leads.find(l => l.id === formData.lead_id)
      if (!selectedLead) {
        toast.showError('Errore', 'Lead non trovato')
        return
      }

      // Prepara i dati del contratto
      const contractData = {
        lead_id: formData.lead_id,
        title: formData.title,
        contract_type: formData.contract_type,
        contract_value: parseFloat(formData.contract_value),
        currency: formData.currency,
        client_info: {
          name: selectedLead.contact_name,
          email: selectedLead.email || '',
          phone: selectedLead.phone || '',
          company: selectedLead.company_name,
          vat_number: selectedLead.vat_number || '',
          address: selectedLead.address || ''
        },
        vendor_info: {
          name: 'Omnily Pro',
          email: 'info@omnilypro.com',
          company: 'Omnily Pro SRL',
          vat_number: 'IT12345678901',
          address: 'Via Roma 1, 00100 Roma, Italia'
        },
        content: generateContractContent(formData, selectedLead),
        metadata: {
          start_date: formData.start_date,
          end_date: formData.end_date,
          payment_terms: formData.payment_terms
        }
      }

      await contractsService.createContract(contractData, orgId, userId)

      toast.showSuccess('Successo', 'Contratto creato correttamente')
      onSuccess()
      onClose()
      resetForm()
    } catch (error: any) {
      console.error('Error creating contract:', error)
      toast.showError('Errore', error.message || 'Impossibile creare il contratto')
    } finally {
      setLoading(false)
    }
  }

  const generateContractContent = (data: typeof formData, lead: CRMLead): string => {
    const contractNumber = `CNT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })

    return `
# CONTRATTO DI FORNITURA SERVIZI DI FIDELIZZAZIONE

**Numero Contratto:** ${contractNumber}
**Data di stipula:** ${today}

---

## PREMESSE

**TRA**

**Omnily Pro SRL**
Sede legale: Via Roma 1, 00100 Roma, Italia
P.IVA: IT12345678901
PEC: info@pec.omnilypro.com
Nel prosieguo denominata "**Fornitore**"

**E**

**${lead.company_name || '[Nome Azienda]'}**
Rappresentata da: ${lead.contact_name || '[Nome Rappresentante Legale]'}
Sede legale: ${lead.address || '[Indirizzo]'}
Email: ${lead.email || '[Email]'}
Telefono: ${lead.phone || '[Telefono]'}
P.IVA/CF: ${lead.vat_number || '[P.IVA]'}
Nel prosieguo denominata "**Cliente**"

---

## ARTICOLO 1 - OGGETTO DEL CONTRATTO

1.1. Il presente contratto ha per oggetto la fornitura da parte del Fornitore al Cliente di:
   - **Software Omnily Pro**: piattaforma di gestione della fidelizzazione clienti in modalità SaaS
   - **Dispositivo POS Android**: terminale hardware in comodato d'uso gratuito con:
     - Schermo merchant da 8 pollici
     - Schermo cliente da 4 pollici
     - Lettore NFC per carte fidelity
     - Scanner QR Code per riconoscimento clienti
     - Tutte le funzionalità necessarie preinstallate

1.2. Il Cliente potrà utilizzare le funzionalità del software in base al piano di abbonamento sottoscritto come dettagliato nell'**Allegato A**.

---

## ARTICOLO 2 - DURATA DEL CONTRATTO

2.1. Il presente contratto ha durata di **${data.end_date && data.start_date ? Math.ceil((new Date(data.end_date).getTime() - new Date(data.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)) : '12'} mesi** a decorrere dal ${data.start_date ? new Date(data.start_date).toLocaleDateString('it-IT') : 'giorno della firma'}.

2.2. Salvo disdetta con preavviso di almeno 30 giorni prima della scadenza, il contratto si intende tacitamente rinnovato per ulteriori 12 mesi alle medesime condizioni.

---

## ARTICOLO 3 - CORRISPETTIVO E MODALITÀ DI PAGAMENTO

3.1. Il corrispettivo per i servizi oggetto del presente contratto è pari a:

**€ ${parseFloat(data.contract_value).toLocaleString('it-IT', { minimumFractionDigits: 2 })} (IVA esclusa)**

3.2. Modalità di pagamento:
${data.payment_terms || 'Pagamento anticipato con cadenza annuale tramite bonifico bancario entro 30 giorni dalla data di fatturazione.'}

3.3. L'IVA sarà applicata nella misura vigente al momento dell'emissione della fattura.

3.4. In caso di ritardato pagamento, verranno applicati gli interessi di mora nella misura prevista dal D.Lgs. 231/2002.

---

## ARTICOLO 4 - COMODATO D'USO DEL DISPOSITIVO POS

4.1. Il dispositivo POS Android fornito al Cliente è concesso in **comodato d'uso gratuito** per tutta la durata del contratto.

4.2. Il Cliente si impegna a:
   - Custodire con diligenza il dispositivo
   - Utilizzarlo esclusivamente per le finalità previste dal contratto
   - Non manomettere, modificare o rimuovere software/hardware
   - Restituirlo alla cessazione del contratto in buone condizioni d'uso

4.3. In caso di danneggiamento o smarrimento imputabile al Cliente, quest'ultimo sarà tenuto al risarcimento pari al valore commerciale del dispositivo (€ 450,00 + IVA).

4.4. La manutenzione ordinaria e gli aggiornamenti software sono a carico del Fornitore. Gli interventi di assistenza tecnica sono regolati secondo quanto previsto nel SLA (**Allegato A**).

---

## ARTICOLO 5 - LIVELLI DI SERVIZIO (SLA)

5.1. Il Fornitore garantisce i livelli di servizio specificati nell'**Allegato A - Descrizione Piano e SLA**.

5.2. Il Fornitore si impegna a fornire:
   - Disponibilità del servizio: 99,5% su base mensile
   - Supporto tecnico via email/ticket: risposta entro 24h lavorative
   - Supporto telefonico (piani Business e Enterprise): orario 9:00-18:00, lun-ven

---

## ARTICOLO 6 - OBBLIGHI DEL FORNITORE

6.1. Il Fornitore si impegna a:
   - Fornire accesso alla piattaforma software Omnily Pro
   - Garantire la disponibilità e funzionalità del servizio secondo gli SLA
   - Fornire aggiornamenti e manutenzione del software
   - Fornire supporto tecnico secondo il piano sottoscritto
   - Garantire la sicurezza e protezione dei dati secondo normativa GDPR (vedi **Allegato B - DPA**)
   - Sostituire il dispositivo POS in caso di malfunzionamento non imputabile al Cliente

---

## ARTICOLO 7 - OBBLIGHI DEL CLIENTE

7.1. Il Cliente si impegna a:
   - Utilizzare i servizi in conformità alla legge e ai termini contrattuali
   - Non cedere a terzi le credenziali di accesso
   - Comunicare tempestivamente eventuali malfunzionamenti
   - Effettuare i pagamenti alle scadenze concordate
   - Custodire il dispositivo POS con diligenza
   - Consentire eventuali interventi di manutenzione remota o on-site
   - Rispettare la normativa GDPR nella gestione dei dati dei propri clienti finali

---

## ARTICOLO 8 - PROPRIETÀ INTELLETTUALE

8.1. Tutti i diritti di proprietà intellettuale relativi al software Omnily Pro e ai dispositivi restano di esclusiva proprietà del Fornitore.

8.2. Al Cliente è concessa una licenza d'uso non esclusiva e non trasferibile per la durata del contratto.

---

## ARTICOLO 9 - FIRMA DIGITALE E VALIDITÀ

9.1. Il presente contratto è sottoscritto mediante **procedura di firma digitale con autenticazione OTP** (One-Time Password).

9.2. Al momento della sottoscrizione, il Cliente riceverà una email/SMS contenente un codice OTP univoco da inserire nella piattaforma di firma.

9.3. La procedura di firma prevede:
   - Registrazione dell'indirizzo IP del firmatario
   - Timestamp certificato della firma
   - User-agent del browser utilizzato
   - Codice OTP con validità di 10 minuti
   - Conferma via email dell'avvenuta sottoscrizione

9.4. La firma digitale così apposta ha piena validità legale ai sensi dell'art. 20 del D.Lgs. 82/2005 (Codice dell'Amministrazione Digitale) e successive modifiche.

---

## ARTICOLO 10 - TRATTAMENTO DATI PERSONALI (GDPR)

10.1. Le parti si impegnano a trattare i dati personali in conformità al Regolamento UE 2016/679 (GDPR).

10.2. Il Fornitore agisce in qualità di **Responsabile del Trattamento** dei dati conferiti dal Cliente nell'ambito della gestione della piattaforma, come dettagliato nel **Data Processing Agreement (DPA)** allegato al presente contratto (**Allegato B**).

10.3. Il Cliente, in qualità di **Titolare del Trattamento**, si impegna a fornire adeguata informativa ai propri clienti finali e a raccogliere i relativi consensi ove necessario.

---

## ARTICOLO 11 - RECESSO E RISOLUZIONE

11.1. Ciascuna parte può recedere dal contratto con preavviso scritto di almeno 60 giorni prima della scadenza naturale.

11.2. Il Fornitore può risolvere il contratto in caso di:
   - Mancato pagamento superiore a 30 giorni dalla scadenza
   - Violazione grave degli obblighi contrattuali da parte del Cliente
   - Utilizzo improprio o illecito dei servizi

11.3. In caso di risoluzione anticipata:
   - Il Cliente non ha diritto al rimborso dei canoni già corrisposti
   - Il Cliente deve restituire il dispositivo POS entro 15 giorni
   - Il Fornitore disattiverà l'accesso alla piattaforma

---

## ARTICOLO 12 - LIMITAZIONE DI RESPONSABILITÀ

12.1. Il Fornitore non sarà responsabile per:
   - Danni indiretti, lucro cessante o perdita di dati
   - Interruzioni del servizio dovute a causa di forza maggiore
   - Malfunzionamenti imputabili a rete internet del Cliente
   - Uso improprio della piattaforma da parte del Cliente

12.2. La responsabilità massima del Fornitore è in ogni caso limitata all'importo dei canoni pagati dal Cliente negli ultimi 12 mesi.

---

## ARTICOLO 13 - RISERVATEZZA

13.1. Le parti si impegnano a mantenere riservate tutte le informazioni commerciali, tecniche e riservate di cui vengano a conoscenza in esecuzione del contratto.

13.2. L'obbligo di riservatezza permane anche dopo la cessazione del contratto per un periodo di 3 anni.

---

## ARTICOLO 14 - COMUNICAZIONI

14.1. Tutte le comunicazioni tra le parti devono essere inviate:
   - Via PEC agli indirizzi indicati in premessa
   - Via email ordinaria per comunicazioni operative
   - Via raccomandata A/R per comunicazioni formali

---

## ARTICOLO 15 - MODIFICHE CONTRATTUALI

15.1. Eventuali modifiche al presente contratto devono essere concordate per iscritto tra le parti.

15.2. Il Fornitore si riserva il diritto di aggiornare le funzionalità della piattaforma, previa comunicazione al Cliente con almeno 30 giorni di anticipo.

---

## ARTICOLO 16 - LEGGE APPLICABILE E FORO COMPETENTE

16.1. Il presente contratto è regolato dalla legge italiana.

16.2. Per qualsiasi controversia derivante dal presente contratto sarà competente il Foro di Roma, con esclusione di ogni altro foro alternativo.

---

## ARTICOLO 17 - ALLEGATI

Costituiscono parte integrante del presente contratto:

- **Allegato A**: Descrizione Piano di Abbonamento e Livelli di Servizio (SLA)
- **Allegato B**: Data Processing Agreement (DPA) - Nomina Responsabile del Trattamento

---

## DICHIARAZIONI FINALI

Le parti dichiarano di aver letto e compreso tutte le clausole del presente contratto e di accettarle integralmente.

Il presente contratto è stato sottoscritto in forma digitale ed è composto da n. ____ pagine.

---

**PER OMNILY PRO SRL**
Rappresentante Legale

**Firma Digitale**
_[Firma apposta digitalmente]_

---

**PER ${lead.company_name?.toUpperCase() || '[NOME AZIENDA]'}**
${lead.contact_name || '[Nome Rappresentante Legale]'}

**Firma Digitale**
_[Firma da apporre tramite procedura OTP]_

Data firma: _________________
IP: _________________
Codice Verifica: _________________

---

# ALLEGATO A - DESCRIZIONE PIANO E SLA

## Piano Sottoscritto: ${data.contract_type === 'subscription' ? 'BUSINESS' : 'PROFESSIONAL'}

### Funzionalità Incluse:

#### **Modulo Fidelity Card Base**
✓ Gestione carte fidelity fisiche con NFC
✓ Gestione QR Code personali clienti
✓ Accumulo punti per acquisto
✓ Premi configurabili
✓ App mobile per clienti (iOS/Android)

#### **Modulo Marketing** (Piano Business e superiori)
✓ Invio campagne email
✓ Invio SMS promozionali (costi SMS a parte)
✓ Notifiche push nell'app
✓ Segmentazione clienti
✓ Statistiche campagne

#### **Modulo Analytics** (Piano Business e superiori)
✓ Dashboard statistiche avanzate
✓ Report vendite e fidelity
✓ Analisi comportamento clienti
✓ Export dati in Excel/CSV

#### **Integrazioni POS** (Piano Enterprise)
✓ Integrazione con registratore di cassa
✓ Sincronizzazione vendite automatica
✓ Collegamento sistemi gestionali

### Limiti Piano:

| Risorsa | Limite |
|---------|--------|
| Carte fidelity attive | Fino a 5.000 clienti |
| SMS mensili inclusi | 500 SMS |
| Email mensili incluse | 10.000 email |
| Notifiche push | Illimitate |
| Spazio archiviazione | 10 GB |
| Utenti operatore | Fino a 5 |

### SLA - Livelli di Servizio Garantiti:

**Uptime del servizio:** 99,5% mensile
- Esclusioni: manutenzioni programmate (comunicate con 7gg anticipo)
- Finestra manutenzione: Domenica 02:00-06:00

**Supporto Tecnico:**
- **Email/Ticket**: Risposta entro 24h lavorative
- **Telefono**: Lun-Ven 9:00-18:00, risposta immediata
- **Emergenze critiche** (servizio down): Intervento entro 2h, 24/7

**Backup dei dati:**
- Backup automatico giornaliero
- Retention: 30 giorni
- Possibilità di ripristino entro 4h dalla richiesta

**Aggiornamenti Software:**
- Aggiornamenti di sicurezza: Automatici
- Nuove funzionalità: Rollout graduale con preavviso
- Possibilità di test su ambiente staging

**Assistenza On-Site:**
- Disponibile su richiesta (costi da concordare)
- Intervento per installazione/configurazione POS
- Formazione operatori in sede

---

# ALLEGATO B - DATA PROCESSING AGREEMENT (DPA)

## NOMINA A RESPONSABILE DEL TRATTAMENTO DATI
*ai sensi dell'art. 28 del Regolamento UE 2016/679*

### PREMESSE

Il presente Data Processing Agreement (DPA) disciplina il trattamento dei dati personali effettuato da **Omnily Pro SRL** (di seguito "**Responsabile**") per conto di **${lead.company_name || '[Nome Azienda]'}** (di seguito "**Titolare**") nell'ambito della fornitura della piattaforma software di gestione fidelizzazione clienti.

---

### ART. 1 - DEFINIZIONI

Ai fini del presente accordo si intende per:
- **Titolare del Trattamento**: ${lead.company_name || '[Nome Azienda]'}, che determina finalità e mezzi del trattamento
- **Responsabile del Trattamento**: Omnily Pro SRL, che tratta i dati per conto del Titolare
- **Dati Personali**: i dati dei clienti finali del Titolare inseriti nella piattaforma
- **GDPR**: Regolamento UE 2016/679

---

### ART. 2 - OGGETTO E FINALITÀ DEL TRATTAMENTO

2.1. Il Responsabile tratta i seguenti dati personali per conto del Titolare:
   - Dati anagrafici clienti (nome, cognome, email, telefono)
   - Dati di acquisto e transazioni
   - Storico punti fidelity e premi
   - Preferenze e consensi marketing

2.2. Finalità del trattamento:
   - Erogazione servizi della piattaforma Omnily Pro
   - Gestione programma fedeltà del Titolare
   - Invio comunicazioni promozionali (su istruzione del Titolare)
   - Analisi statistiche aggregate

---

### ART. 3 - DURATA DEL TRATTAMENTO

3.1. Il Responsabile tratterà i dati per tutta la durata del contratto di fornitura.

3.2. Alla cessazione del contratto, il Responsabile:
   - Restituirà tutti i dati al Titolare in formato machine-readable (CSV/JSON)
   - Cancellerà definitivamente tutte le copie dei dati entro 30 giorni
   - Fornirà attestazione scritta dell'avvenuta cancellazione

---

### ART. 4 - OBBLIGHI DEL RESPONSABILE

4.1. Il Responsabile si impegna a:

a) Trattare i dati solo su istruzione documentata del Titolare
b) Garantire che le persone autorizzate al trattamento si siano impegnate alla riservatezza
c) Adottare misure tecniche e organizzative adeguate per garantire la sicurezza:
   - Cifratura dati in transito (TLS 1.3) e a riposo (AES-256)
   - Autenticazione multifattore per accessi amministrativi
   - Controllo accessi basato su ruoli (RBAC)
   - Log di audit immutabili
   - Firewall e sistemi IDS/IPS
   - Vulnerability assessment periodici

d) Rispettare le condizioni per il ricorso a sub-responsabili
e) Assistere il Titolare nell'evasione di richieste degli interessati (diritto di accesso, rettifica, cancellazione, portabilità, ecc.)
f) Assistere il Titolare nel garantire il rispetto degli obblighi GDPR
g) Cancellare o restituire i dati al termine del contratto
h) Mettere a disposizione tutte le informazioni per dimostrare la conformità

---

### ART. 5 - SUB-RESPONSABILI

5.1. Il Titolare autorizza il Responsabile a ricorrere ai seguenti sub-responsabili:

| Sub-responsabile | Servizio | Sede |
|------------------|----------|------|
| Amazon Web Services (AWS) | Cloud hosting | Irlanda (UE) |
| Twilio | Invio SMS | USA (con SCCs) |
| SendGrid | Invio email | USA (con SCCs) |

5.2. Il Responsabile informerà il Titolare di eventuali modifiche con almeno 30 giorni di anticipo. Il Titolare potrà opporsi per motivi legittimi.

---

### ART. 6 - MISURE DI SICUREZZA

6.1. Il Responsabile adotta le seguenti misure tecniche e organizzative:

**Misure Tecniche:**
- Cifratura AES-256 per dati a riposo
- TLS 1.3 per dati in transito
- Backup cifrati giornalieri con retention 30gg
- Pseudonimizzazione dei dati ove possibile
- Segregazione ambienti (produzione/test)

**Misure Organizzative:**
- Politiche di accesso least-privilege
- Formazione annuale del personale sul GDPR
- Procedura di gestione data breach
- Audit di sicurezza semestrali
- Certificazione ISO 27001 (in corso)

---

### ART. 7 - DATA BREACH

7.1. In caso di violazione dei dati personali (data breach), il Responsabile:
   - Notifica il Titolare entro **24 ore** dalla scoperta
   - Fornisce tutte le informazioni rilevanti per valutare l'incidente
   - Collabora con il Titolare per mitigare le conseguenze
   - Documenta l'incidente e le misure adottate

7.2. Resta a carico del Titolare la notifica al Garante Privacy e agli interessati, se dovuta.

---

### ART. 8 - DIRITTI DEGLI INTERESSATI

8.1. Il Responsabile assiste il Titolare nell'evasione delle richieste degli interessati:
   - Diritto di accesso (Art. 15 GDPR)
   - Diritto di rettifica (Art. 16 GDPR)
   - Diritto alla cancellazione (Art. 17 GDPR)
   - Diritto di limitazione (Art. 18 GDPR)
   - Diritto alla portabilità (Art. 20 GDPR)
   - Diritto di opposizione (Art. 21 GDPR)

8.2. Il Responsabile fornirà i dati richiesti al Titolare entro 5 giorni lavorativi dalla richiesta.

---

### ART. 9 - AUDIT E ISPEZIONI

9.1. Il Titolare ha diritto di:
   - Richiedere documentazione sulle misure di sicurezza adottate
   - Effettuare audit periodici (previo accordo sulle modalità)
   - Nominare un revisore indipendente per verifiche

9.2. Il Responsabile fornirà piena collaborazione e accesso alle informazioni necessarie.

---

### ART. 10 - TRASFERIMENTI EXTRA-UE

10.1. I dati sono ospitati esclusivamente su server AWS nell'Unione Europea (regione eu-south-1, Milano).

10.2. Eventuali trasferimenti extra-UE verso sub-responsabili USA sono regolati da:
   - Standard Contractual Clauses (SCCs) approvate dalla Commissione Europea
   - Misure supplementari di sicurezza (cifratura end-to-end)

---

### ART. 11 - RESPONSABILITÀ E PENALI

11.1. Il Responsabile è responsabile dei danni causati dal trattamento non conforme al GDPR.

11.2. In caso di violazioni gravi e accertate:
   - Penale pari al 10% del valore annuo del contratto
   - Diritto del Titolare di risolvere il contratto senza preavviso
   - Obbligo di risarcimento degli ulteriori danni

---

### ART. 12 - MODIFICHE AL DPA

12.1. Il presente DPA può essere modificato solo per iscritto e con accordo di entrambe le parti.

12.2. In caso di modifiche legislative significative, le parti si impegnano a rinegoziare in buona fede.

---

**SOTTOSCRIZIONE**

Il presente Data Processing Agreement è sottoscritto congiuntamente al contratto principale e ne costituisce parte integrante.

**Omnily Pro SRL**
Responsabile del Trattamento

_[Firma Digitale]_

**${lead.company_name || '[Nome Azienda]'}**
Titolare del Trattamento

_[Firma Digitale tramite OTP]_

---

*Fine Allegato B - DPA*

---

*Documento generato automaticamente da Omnily Pro CRM - ${today}*
*Contratto valido e vincolante ai sensi della firma digitale con procedura OTP*
    `.trim()
  }

  const resetForm = () => {
    setFormData({
      lead_id: '',
      title: '',
      contract_type: 'service_agreement',
      contract_value: '',
      currency: 'EUR',
      start_date: '',
      end_date: '',
      payment_terms: ''
    })
  }

  if (!isOpen) return null

  return (
    <>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-contract-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FileText size={24} />
            <h2>Crea Nuovo Contratto</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body-split">
          {/* Top: Form */}
          <form onSubmit={handleSubmit} className="modal-form">
          {/* Lead Selection */}
          <div className="form-group full-width">
            <label>
              <Building2 size={16} />
              Lead / Cliente *
            </label>
            <select
              value={formData.lead_id}
              onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
              required
              disabled={!!preSelectedLeadId || loadingLeads}
            >
              <option value="">Seleziona un lead...</option>
              {leads.map(lead => (
                <option key={lead.id} value={lead.id}>
                  {lead.company_name} - {lead.contact_name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="form-group full-width">
            <label>
              <FileText size={16} />
              Titolo Contratto *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="es: Abbonamento Annuale POS"
              required
            />
          </div>

          {/* Contract Type */}
          <div className="form-group">
            <label>Tipo Contratto *</label>
            <select
              value={formData.contract_type}
              onChange={(e) => setFormData({ ...formData, contract_type: e.target.value as any })}
              required
            >
              <option value="service_agreement">Contratto di Servizi</option>
              <option value="subscription">Abbonamento</option>
              <option value="nda">NDA</option>
              <option value="custom">Personalizzato</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <Euro size={16} />
              Valore Contratto *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.contract_value}
              onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-group">
            <label>Valuta</label>
            <input
              type="text"
              value={formData.currency}
              disabled
            />
          </div>

          {/* Dates */}
          <div className="form-group">
            <label>
              <Calendar size={16} />
              Data Inizio
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>
              <Calendar size={16} />
              Data Fine
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>

          <div className="form-group full-width">
            <label>Termini di Pagamento (opzionale)</label>
            <input
              type="text"
              value={formData.payment_terms}
              onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              placeholder="Default: Pagamento anticipato annuale entro 30gg"
            />
            <small style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              ℹ️ Se vuoto, verrà usato il termine standard
            </small>
          </div>

          <div className="modal-actions full-width">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Annulla
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creazione...' : 'Crea Contratto'}
            </button>
          </div>
        </form>

        {/* Bottom: Contract Preview */}
        <div className="contract-preview-panel">
          <div className="preview-header">
            <FileText size={18} />
            <h3>Anteprima Contratto ({contractPreview.length} caratteri, {contractPreview.split('\n').length} righe)</h3>
            <button
              type="button"
              className="btn-preview-fullscreen"
              onClick={() => setShowFullscreenPreview(true)}
              disabled={!contractPreview}
            >
              <Eye size={16} />
              Anteprima Schermo Pieno
            </button>
          </div>
          <div className="preview-content">
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif', margin: 0 }}>
              {contractPreview}
            </pre>
          </div>
        </div>
      </div>
      </div>
    </div>

      {/* Fullscreen Preview Modal */}
      {showFullscreenPreview && (
        <div className="fullscreen-preview-overlay" onClick={() => setShowFullscreenPreview(false)}>
          <div className="fullscreen-preview-container" onClick={(e) => e.stopPropagation()}>
            <div className="fullscreen-preview-header">
              <h2>
                <FileText size={24} />
                Anteprima Contratto Completo
              </h2>
              <button
                className="fullscreen-preview-close"
                onClick={() => setShowFullscreenPreview(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="fullscreen-preview-content">
              <pre style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'Georgia, serif',
                fontSize: '14px',
                lineHeight: '1.8',
                margin: 0,
                padding: '2rem',
                maxWidth: '900px',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}>
                {contractPreview}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CreateContractModal
