import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, FileText, Shield, Printer, Download, ArrowLeft, X } from 'lucide-react';
import { customersApi, supabase } from '../lib/supabase';
import { sendWelcomeEmail } from '../services/emailAutomationService';
import GDPRConsent from './GDPRConsent';
import './RegistrationWizard.css';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: 'male' | 'female' | '';
  address: string;
  city: string;
  zipCode: string;
  notes: string;
  referralCode: string;
  referredBy: string;
  privacyConsent: boolean;
  marketingConsent: boolean;
  signature: string;
}

interface RegistrationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onCustomerCreated: () => void;
}

const RegistrationWizard: React.FC<RegistrationWizardProps> = ({
  isOpen,
  onClose,
  organizationId,
  onCustomerCreated
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [organization, setOrganization] = useState<any>(null);
  const [loadingOrganization, setLoadingOrganization] = useState(false);

  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const debugMessage = `${timestamp}: ${message}`;
    setDebugInfo(prev => [...prev.slice(-4), debugMessage]); // Keep last 5 messages
    console.log(debugMessage);
  };

  // Fetch organization data dynamically from database
  const fetchOrganization = async () => {
    if (!organizationId) return;

    setLoadingOrganization(true);
    try {
      console.log('🏢 Fetching organization data for:', organizationId);

      const { data: orgData, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (error) {
        console.error('❌ Error fetching organization:', error);
        addDebugInfo(`❌ Error loading organization: ${error.message}`);
        return;
      }

      console.log('✅ Organization data loaded:', orgData);
      console.log('🏆 Loyalty tiers from DB:', orgData.loyalty_tiers);

      setOrganization(orgData);
      addDebugInfo(`✅ Organization loaded: ${orgData.name}`);

      if (orgData.loyalty_tiers && orgData.loyalty_tiers.length > 0) {
        addDebugInfo(`🏆 Found ${orgData.loyalty_tiers.length} custom loyalty tiers`);
      } else {
        addDebugInfo('⚠️ No custom loyalty tiers found, using defaults');
      }

    } catch (error: any) {
      console.error('❌ Exception fetching organization:', error);
      addDebugInfo(`❌ Exception: ${error.message}`);
    } finally {
      setLoadingOrganization(false);
    }
  };

  // Smoothing helpers for better signature quality
  const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const getMidPoint = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    address: '',
    city: '',
    zipCode: '',
    notes: '',
    referralCode: '',
    referredBy: '',
    privacyConsent: false,
    marketingConsent: false,
    signature: ''
  });

  const steps = [
    { number: 1, title: 'Dati Personali', icon: User },
    { number: 2, title: 'Contatti', icon: Mail },
    { number: 3, title: 'Note', icon: FileText },
    { number: 4, title: 'Privacy & Consensi', icon: Shield }
  ];

  useEffect(() => {
    if (isOpen) {
      resetForm();
      initCanvas();
      fetchOrganization(); // Fetch latest organization data from DB
    }
  }, [isOpen, organizationId]);

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthDate: '',
      gender: '',
      address: '',
      city: '',
      zipCode: '',
      notes: '',
      referralCode: '',
      referredBy: '',
      privacyConsent: false,
      marketingConsent: false,
      signature: ''
    });
    setErrors({});
    setDuplicateWarning('');
  };

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Detect POS mode for larger canvas
    const isPOSMode = window.innerWidth <= 1024;

    // Dimensioni dinamiche basate sulla modalità
    if (isPOSMode) {
      canvas.width = 800;
      canvas.height = 400;
      canvas.style.width = '100%';
      canvas.style.height = '400px';
    } else {
      canvas.width = 600;
      canvas.height = 200;
      canvas.style.width = '100%';
      canvas.style.height = '200px';
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = isPOSMode ? 5 : 3; // Linea più spessa per POS

    // Sfondo bianco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e);
    setLastPoint({ x, y });

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentPoint = getCanvasCoordinates(e);
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Use quadratic curves for smoother lines
      const distance = getDistance(lastPoint, currentPoint);

      // Only draw if the distance is significant (reduces noise)
      if (distance > 2) {
        const midPoint = getMidPoint(lastPoint, currentPoint);

        ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midPoint.x, midPoint.y);
        ctx.stroke();

        // Start new path from current position for continuous drawing
        ctx.beginPath();
        ctx.moveTo(midPoint.x, midPoint.y);

        setLastPoint(currentPoint);
      }
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setLastPoint(null); // Reset for next stroke

    const canvas = canvasRef.current;
    if (canvas) {
      const signatureData = canvas.toDataURL();
      console.log('✍️ Firma mouse salvata:', signatureData ? 'presente' : 'vuota');
      console.log('✍️ Mouse signature data length:', signatureData?.length || 0);
      setFormData(prev => {
        const newData = { ...prev, signature: signatureData };
        console.log('✍️ FormData aggiornato con mouse signature:', newData.signature?.length || 0);
        return newData;
      });
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      console.log('🗑️ Firma cancellata');
      setFormData(prev => ({ ...prev, signature: '' }));
    }
  };

  // Supporto touch ottimizzato per POS con smoothing
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    setLastPoint({ x, y });

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isDrawing || !lastPoint) return;

    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const currentPoint = {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY
    };

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Use same smoothing as mouse events
      const distance = getDistance(lastPoint, currentPoint);

      // Only draw if distance is significant (reduces jitter on touch)
      if (distance > 3) { // Slightly higher threshold for touch
        const midPoint = getMidPoint(lastPoint, currentPoint);

        ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midPoint.x, midPoint.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(midPoint.x, midPoint.y);

        setLastPoint(currentPoint);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isDrawing) return;
    setIsDrawing(false);
    setLastPoint(null); // Reset for next stroke

    const canvas = canvasRef.current;
    if (canvas) {
      const signatureData = canvas.toDataURL();
      const signatureLength = signatureData?.length || 0;
      addDebugInfo(`✍️ FIRMA TOUCH: ${signatureLength} caratteri salvati`);
      setFormData(prev => {
        const newData = { ...prev, signature: signatureData };
        return newData;
      });
    }
  };

  const generateConsentDocument = () => {
    const timestamp = new Date().toLocaleString('it-IT');
    const customerName = `${formData.firstName} ${formData.lastName}`;
    const documentId = `GDPR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MODULO CONSENSO PRIVACY GDPR - OMNILY PRO</title>
    <style>
        @page { 
            margin: 2cm; 
            size: A4;
            @top-center { content: "OMNILY PRO - Modulo Consenso Privacy GDPR"; }
            @bottom-center { content: "Pagina " counter(page) " di " counter(pages); }
        }
        body { 
            font-family: 'Times New Roman', serif; 
            margin: 0; 
            line-height: 1.8; 
            color: #000;
            font-size: 11pt;
        }
        .header { 
            text-align: center; 
            border-bottom: 3px solid #ef4444; 
            padding-bottom: 25px; 
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        .company-logo { 
            color: #ef4444; 
            font-size: 28px; 
            font-weight: bold; 
            letter-spacing: 2px;
            margin-bottom: 10px;
        }
        .document-title {
            font-size: 20px;
            font-weight: bold;
            margin: 15px 0;
            text-transform: uppercase;
        }
        .document-subtitle {
            font-size: 14px;
            color: #666;
            font-style: italic;
        }
        .document-id {
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 9pt;
            color: #888;
        }
        .section { 
            margin: 30px 0; 
            page-break-inside: avoid;
        }
        .section h3 {
            background: #f5f5f5;
            padding: 10px 15px;
            margin: 20px 0 15px 0;
            border-left: 4px solid #ef4444;
            font-size: 14pt;
            text-transform: uppercase;
            font-weight: bold;
        }
        .subsection {
            margin: 20px 0;
            padding-left: 15px;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .data-table th, .data-table td {
            border: 1px solid #ddd;
            padding: 12px 15px;
            text-align: left;
        }
        .data-table th {
            background: #f8f9fa;
            font-weight: bold;
        }
        .checkbox-row {
            margin: 15px 0;
            padding: 10px;
            border: 1px solid #ddd;
            background: #fafafa;
            display: flex;
            align-items: flex-start;
        }
        .checkbox-row input {
            margin-right: 10px;
            transform: scale(1.2);
            margin-top: 3px;
        }
        .checkbox-text {
            flex: 1;
            line-height: 1.6;
        }
        .required { 
            color: #ef4444; 
            font-weight: bold; 
        }
        .optional {
            color: #666;
            font-style: italic;
        }
        .signature-section {
            border: 2px solid #333;
            margin: 30px 0;
            padding: 20px;
            page-break-inside: avoid;
        }
        .signature-box { 
            border: 2px dashed #ccc; 
            height: 180px; 
            margin: 20px 0; 
            position: relative;
            background: #fafafa;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .signature-image { 
            max-width: 95%; 
            max-height: 95%; 
            border: 1px solid #ddd;
        }
        .signature-details {
            margin-top: 15px;
            font-size: 10pt;
            border-top: 1px solid #eee;
            padding-top: 15px;
        }
        .legal-text {
            background: #f9f9f9;
            padding: 20px;
            margin: 20px 0;
            border-left: 5px solid #ef4444;
            font-size: 10pt;
            line-height: 1.6;
        }
        .footer { 
            margin-top: 60px; 
            font-size: 9pt; 
            color: #666; 
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            page-break-inside: avoid;
        }
        .privacy-rights {
            background: #e8f4fd;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid #bee5eb;
            border-radius: 5px;
        }
        .rights-list {
            columns: 2;
            column-gap: 30px;
            list-style-type: none;
            padding: 0;
        }
        .rights-list li {
            margin: 10px 0;
            padding-left: 20px;
            position: relative;
            break-inside: avoid;
        }
        .rights-list li::before {
            content: "⚖";
            position: absolute;
            left: 0;
            color: #ef4444;
        }
        .contact-info {
            background: #fff3cd;
            padding: 15px;
            margin: 20px 0;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
        }
        .timestamps {
            font-family: monospace;
            background: #f8f9fa;
            padding: 10px;
            margin: 10px 0;
            font-size: 10pt;
        }
    </style>
</head>
<body>
    <div class="document-id">ID: ${documentId}</div>
    
    <div class="header">
        <div class="company-logo">OMNILY PRO</div>
        <div class="document-title">Modulo Consenso al Trattamento dei Dati Personali</div>
        <div class="document-subtitle">Ai sensi del Regolamento UE 2016/679 (GDPR) e del Codice Privacy D.Lgs. 196/2003</div>
    </div>

    <div class="section">
        <h3>I. Identificazione del Titolare del Trattamento</h3>
        <div class="legal-text">
            <strong>OMNILY PRO S.r.l.</strong><br>
            Sede Legale: Via Roma 123, 00100 Roma (RM)<br>
            P.IVA: 12345678901 - C.F.: 12345678901<br>
            Email: privacy@omnilypro.com - Tel: +39 06 1234567<br>
            <strong>Data Protection Officer (DPO):</strong> dpo@omnilypro.com
        </div>
    </div>

    <div class="section">
        <h3>II. Dati dell'Interessato</h3>
        <table class="data-table">
            <tr>
                <th>Nome e Cognome</th>
                <td>${customerName}</td>
            </tr>
            <tr>
                <th>Indirizzo Email</th>
                <td>${formData.email || 'Non fornito'}</td>
            </tr>
            <tr>
                <th>Numero di Telefono</th>
                <td>${formData.phone || 'Non fornito'}</td>
            </tr>
            <tr>
                <th>Data di Nascita</th>
                <td>${formData.birthDate || 'Non fornita'}</td>
            </tr>
            <tr>
                <th>Indirizzo</th>
                <td>${formData.address && formData.city ? `${formData.address}, ${formData.city} ${formData.zipCode}` : 'Non fornito'}</td>
            </tr>
            <tr>
                <th>Data Registrazione</th>
                <td>${timestamp}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h3>III. Finalità e Base Giuridica del Trattamento</h3>
        
        <div class="subsection">
            <h4>A) Trattamenti Necessari (Base Giuridica: Art. 6, par. 1, lett. b) GDPR)</h4>
            <ul>
                <li><strong>Gestione del rapporto contrattuale:</strong> Erogazione dei servizi di loyalty management</li>
                <li><strong>Adempimenti di legge:</strong> Obblighi fiscali, contabili e amministrativi</li>
                <li><strong>Sicurezza:</strong> Prevenzione frodi e attività illecite</li>
            </ul>
        </div>

        <div class="subsection">
            <h4>B) Trattamenti basati sul consenso (Base Giuridica: Art. 6, par. 1, lett. a) GDPR)</h4>
            <ul>
                <li><strong>Marketing diretto:</strong> Invio comunicazioni commerciali e promozionali</li>
                <li><strong>Profilazione:</strong> Analisi preferenze per offerte personalizzate</li>
                <li><strong>Newsletter:</strong> Invio periodico di informazioni sui servizi</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <h3>IV. Consensi Espressi dall'Interessato</h3>
        
        <div class="checkbox-row">
            <input type="checkbox" checked disabled>
            <div class="checkbox-text">
                <strong class="required">[CONSENSO OBBLIGATORIO]</strong><br>
                <strong>Acconsento al trattamento dei miei dati personali</strong> per le finalità necessarie all'erogazione dei servizi richiesti, 
                alla gestione del rapporto contrattuale e agli adempimenti di legge, 
                ai sensi dell'Art. 6, par. 1, lett. b) GDPR.
                <div class="timestamps"><strong>Consenso espresso il:</strong> ${timestamp}</div>
            </div>
        </div>

        <div class="checkbox-row">
            <input type="checkbox" ${formData.marketingConsent ? 'checked' : ''} disabled>
            <div class="checkbox-text">
                <strong class="optional">[CONSENSO FACOLTATIVO]</strong><br>
                <strong>Acconsento al trattamento dei miei dati personali per finalità di marketing</strong>, 
                incluso l'invio di comunicazioni commerciali, newsletter, offerte promozionali e profilazione 
                per la personalizzazione dei servizi, ai sensi dell'Art. 6, par. 1, lett. a) GDPR.
                <div class="timestamps"><strong>Consenso ${formData.marketingConsent ? 'PRESTATO' : 'NON PRESTATO'} il:</strong> ${timestamp}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h3>V. Categorie di Dati Trattati</h3>
        <ul>
            <li><strong>Dati anagrafici:</strong> Nome, cognome, data di nascita</li>
            <li><strong>Dati di contatto:</strong> Email, telefono, indirizzo postale</li>
            <li><strong>Dati comportamentali:</strong> Preferenze, cronologia acquisti, interazioni</li>
            <li><strong>Dati tecnici:</strong> Indirizzo IP, cookies, dati di navigazione</li>
        </ul>
    </div>

    <div class="section">
        <h3>VI. Modalità del Trattamento</h3>
        <div class="legal-text">
            I dati personali sono trattati con strumenti automatizzati e non, con modalità e logiche 
            strettamente correlate alle finalità indicate e, comunque, in modo da garantire la sicurezza 
            e la riservatezza dei dati stessi mediante appropriate misure tecniche e organizzative.
        </div>
    </div>

    <div class="section">
        <h3>VII. Periodo di Conservazione</h3>
        <ul>
            <li><strong>Dati contrattuali:</strong> 10 anni dalla cessazione del rapporto</li>
            <li><strong>Dati marketing:</strong> Fino a revoca del consenso o 2 anni dall'ultima interazione</li>
            <li><strong>Dati tecnici:</strong> 12 mesi dalla raccolta</li>
        </ul>
    </div>

    <div class="section">
        <h3>VIII. Comunicazione e Diffusione</h3>
        <div class="legal-text">
            I dati potranno essere comunicati a soggetti terzi solo per finalità strettamente connesse 
            all'erogazione dei servizi (fornitori tecnologici, consulenti, autorità competenti) 
            e nel rispetto delle prescrizioni di legge. I dati non saranno mai diffusi.
        </div>
    </div>

    <div class="section">
        <h3>IX. Trasferimento Extra-UE</h3>
        <div class="legal-text">
            Alcuni dati potrebbero essere trasferiti verso paesi terzi o organizzazioni internazionali 
            solo in presenza di una decisione di adeguatezza della Commissione Europea o mediante 
            l'adozione di garanzie appropriate (Standard Contractual Clauses, Binding Corporate Rules).
        </div>
    </div>

    <div class="section">
        <h3>X. Diritti dell'Interessato</h3>
        <div class="privacy-rights">
            <p><strong>L'interessato ha diritto di ottenere dal Titolare del trattamento:</strong></p>
            <ul class="rights-list">
                <li><strong>Accesso (Art. 15):</strong> Conferma che sia in corso un trattamento e informazioni sui dati</li>
                <li><strong>Rettifica (Art. 16):</strong> Correzione dei dati inesatti o integrazione di quelli incompleti</li>
                <li><strong>Cancellazione (Art. 17):</strong> Cancellazione dei dati (diritto all'oblio)</li>
                <li><strong>Limitazione (Art. 18):</strong> Limitazione del trattamento in specifiche circostanze</li>
                <li><strong>Portabilità (Art. 20):</strong> Ricevere i propri dati in formato strutturato</li>
                <li><strong>Opposizione (Art. 21):</strong> Opporsi al trattamento per motivi legittimi</li>
                <li><strong>Revoca consenso:</strong> Revocare il consenso in qualsiasi momento</li>
                <li><strong>Reclamo (Art. 77):</strong> Presentare reclamo all'Autorità di controllo</li>
            </ul>
        </div>
        
        <div class="contact-info">
            <strong>Per esercitare i tuoi diritti contatta:</strong><br>
            📧 Email: privacy@omnilypro.com<br>
            📞 Telefono: +39 06 1234567<br>
            📮 Posta: OMNILY PRO S.r.l., Via Roma 123, 00100 Roma (RM)<br>
            <strong>Autorità Garante:</strong> www.gpdp.it - garante@gpdp.it
        </div>
    </div>

    <div class="signature-section">
        <h3>XI. Firma Digitale e Validità del Consenso</h3>
        <div class="signature-box">
            <img src="${formData.signature}" class="signature-image" alt="Firma digitale del cliente" />
        </div>
        <div class="signature-details">
            <table class="data-table">
                <tr>
                    <th>Firma apposta in data</th>
                    <td>${timestamp}</td>
                </tr>
                <tr>
                    <th>Modalità di firma</th>
                    <td>Firma elettronica avanzata tracciata su dispositivo digitale</td>
                </tr>
                <tr>
                    <th>Validità legale</th>
                    <td>Conforme agli artt. 20-21 del Regolamento eIDAS (UE) 910/2014</td>
                </tr>
                <tr>
                    <th>Hash documento</th>
                    <td>${documentId}</td>
                </tr>
                <tr>
                    <th>Sistema di raccolta</th>
                    <td>OMNILY PRO Loyalty Management Platform v.1.0</td>
                </tr>
            </table>
        </div>
        
        <div class="legal-text">
            <strong>DICHIARAZIONE DI CONSENSO INFORMATO</strong><br>
            Il sottoscritto dichiara di aver ricevuto l'informativa sul trattamento dei dati personali 
            ai sensi dell'Art. 13 GDPR, di averla letta e compresa, e di esprimere liberamente i consensi 
            sopra indicati con piena consapevolezza delle conseguenze.
        </div>
    </div>

    <div class="footer">
        <p><strong>OMNILY PRO S.r.l.</strong> - Sistema di Gestione Clienti e Loyalty Program</p>
        <p>📄 <strong>Documento ID:</strong> ${documentId} | 📅 <strong>Generato il:</strong> ${timestamp}</p>
        <p>✅ <strong>Validità legale:</strong> Documento conforme al GDPR (UE) 2016/679 e al Codice Privacy D.Lgs. 196/2003</p>
        <p>🔐 <strong>Firma elettronica:</strong> Conforme al Regolamento eIDAS (UE) 910/2014</p>
        <p><em>Questo documento è stato generato automaticamente dal sistema e costituisce prova del consenso espresso dall'interessato.</em></p>
    </div>
</body>
</html>`;
  };

  const printConsentForm = () => {
    const consentDocument = generateConsentDocument();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(consentDocument);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const downloadConsentPDF = () => {
    const consentDocument = generateConsentDocument();
    const blob = new Blob([consentDocument], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consenso-privacy-${formData.firstName}-${formData.lastName}-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    console.log(`📝 Campo ${field} aggiornato da:`, formData[field], 'a:', value);
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log(`📊 FormData aggiornato:`, newData);
      return newData;
    });
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    if (field === 'email' || field === 'phone') {
      checkDuplicates(field, value as string);
    }
  };

  const checkDuplicates = async (field: 'email' | 'phone', value: string) => {
    if (!value.trim()) {
      setDuplicateWarning('');
      return;
    }

    try {
      const customers = await customersApi.getAll(organizationId);
      const duplicate = customers.find(c => 
        field === 'email' ? c.email === value : c.phone === value
      );

      if (duplicate) {
        setDuplicateWarning(`Cliente già registrato con ${field === 'email' ? 'questa email' : 'questo telefono'}: ${duplicate.name}`);
      } else {
        setDuplicateWarning('');
      }
    } catch (error: any) {
      // Se la tabella non existe ancora, ignora l'errore
      if (error?.message?.includes('table') || error?.message?.includes('customers')) {
        console.warn('Tabella customers non trovata - skippo controllo duplicati');
        setDuplicateWarning('');
        return;
      }
      console.error('Error checking duplicates:', error);
      setDuplicateWarning('');
    }
  };

  const validateStep = (step: number): boolean => {
    console.log(`🔍 Validazione step ${step}...`);
    console.log('📋 FormData corrente:', formData);
    
    const newErrors: { [key: string]: string } = {};

    switch (step) {
      case 1:
        if (!formData.firstName.trim()) newErrors.firstName = 'Nome richiesto';
        if (!formData.lastName.trim()) newErrors.lastName = 'Cognome richiesto';
        if (!formData.gender) newErrors.gender = 'Genere richiesto';
        break;

      case 2:
        if (!formData.email.trim()) {
          newErrors.email = 'Email richiesta';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Email non valida';
        }
        if (!formData.phone.trim()) newErrors.phone = 'Telefono richiesto';
        break;

      case 4:
        console.log('🔐 Controllo privacy consent:', formData.privacyConsent);
        console.log('✍️ Controllo signature:', formData.signature ? `presente (${formData.signature.length} caratteri)` : 'mancante');
        console.log('📋 Signature value:', formData.signature.substring(0, 50) + '...');
        
        if (!formData.privacyConsent) {
          console.log('❌ Privacy consent mancante');
          newErrors.privacyConsent = 'Consenso privacy obbligatorio';
        }
        // Controllo firma più intelligente - un canvas vuoto ha circa 2000-3000 caratteri
        const hasValidSignature = formData.signature &&
                                  formData.signature.length > 3000 &&
                                  formData.signature.startsWith('data:image/');

        if (!hasValidSignature) {
          const length = formData.signature?.length || 0;
          const isValidFormat = formData.signature?.startsWith('data:image/') || false;
          addDebugInfo(`❌ FIRMA INVALIDA: ${length} caratteri, formato OK: ${isValidFormat}`);
          newErrors.signature = 'Firma digitale richiesta - firmare nel riquadro bianco';
        } else {
          addDebugInfo(`✅ FIRMA VALIDA: ${formData.signature.length} caratteri`);
        }
        break;
    }

    console.log('❌ Errori trovati:', JSON.stringify(newErrors, null, 2));
    console.log('📊 Numero errori:', Object.keys(newErrors).length);
    
    if (Object.keys(newErrors).length > 0) {
      Object.entries(newErrors).forEach(([field, error]) => {
        console.log(`   ❌ ${field}: ${error}`);
      });
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log(`✅ Validazione ${isValid ? 'superata' : 'fallita'}`);
    return isValid;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const calculateTier = (points: number) => {
    console.log('🏆 calculateTier called with points:', points);
    console.log('🏆 organization.loyalty_tiers:', organization?.loyalty_tiers);

    // Use organization's loyalty_tiers from wizard if available
    if (organization?.loyalty_tiers && organization.loyalty_tiers.length > 0) {
      console.log('✅ Using organization loyalty tiers from wizard');

      // Sort tiers by threshold (highest first)
      const sortedTiers = [...organization.loyalty_tiers].sort((a, b) =>
        parseInt(b.threshold) - parseInt(a.threshold)
      );

      console.log('🏆 Sorted tiers:', sortedTiers);

      // Find the appropriate tier for the points
      for (const tier of sortedTiers) {
        if (points >= parseInt(tier.threshold)) {
          console.log(`✅ Found tier: ${tier.name} for ${points} points (threshold: ${tier.threshold})`);
          return tier.name;
        }
      }

      // If no tier matches, return the first tier (lowest threshold)
      const defaultTier = sortedTiers[sortedTiers.length - 1]?.name || sortedTiers[0]?.name;
      console.log(`🏆 Using default tier: ${defaultTier}`);
      return defaultTier;
    }

    // Fallback: if no organization tiers configured, return first available or undefined
    console.log('⚠️ No organization loyalty tiers configured');
    return undefined;
  };

  const handleSubmit = async () => {
    addDebugInfo('🚀 INIZIO REGISTRAZIONE CLIENTE');
    addDebugInfo(`📋 Privacy: ${formData.privacyConsent ? 'OK' : 'MANCANTE'}`);
    addDebugInfo(`📋 Firma: ${formData.signature?.length || 0} caratteri`);

    if (!validateStep(4)) {
      addDebugInfo('❌ VALIDAZIONE FALLITA - vedi errori sopra');
      return;
    }

    console.log('✅ Validazione completata');
    setIsLoading(true);

    try {
      console.log('📦 Preparazione dati cliente...');
      const customerData = {
        organization_id: organizationId,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address ? `${formData.address}, ${formData.city} ${formData.zipCode}` : undefined,
        gender: formData.gender as 'male' | 'female',
        birth_date: formData.birthDate || undefined,
        points: 50,
        tier: calculateTier(50) || 'Base', // Usa il tier dinamico dall'organizzazione o 'Base' come fallback
        total_spent: 0,
        visits: 0,
        is_active: true,
        notifications_enabled: formData.marketingConsent,
        marketing_consent: formData.marketingConsent,
        privacy_consent: true, // Required to reach this point
        signature_data: formData.signature,
        privacy_signed_at: new Date().toISOString(),
        last_visit: undefined
      };

      console.log('📊 Dati da inviare:', customerData);
      addDebugInfo(`📊 DATI CLIENTE: ${customerData.name}`);
      addDebugInfo(`📧 Email: ${customerData.email}`);
      addDebugInfo(`🏢 Org ID: ${customerData.organization_id}`);
      console.log('🌐 Chiamata API create...');
      addDebugInfo('🌐 CHIAMATA API IN CORSO...');

      const createdCustomer = await customersApi.create(customerData);
      addDebugInfo('✅ CLIENTE CREATO CON SUCCESSO!');

      console.log('✅ Cliente creato con successo:', createdCustomer);

      // 📧 Invia email di benvenuto automatica (non-blocking)
      if (createdCustomer.email && organization) {
        try {
          console.log('📧 Invio email di benvenuto a:', createdCustomer.email);
          await sendWelcomeEmail(
            organizationId,
            {
              email: createdCustomer.email,
              name: createdCustomer.name,
              points: createdCustomer.points,
              tier: createdCustomer.tier
            },
            {
              name: organization.name,
              pointsPerEuro: organization.points_per_euro || 1,
              website: organization.website
            }
          );
          console.log('✅ Email di benvenuto inviata con successo');
          addDebugInfo('📧 Email di benvenuto inviata!');
        } catch (emailError) {
          // Non-blocking error - don't fail registration if email fails
          console.error('⚠️ Errore invio email di benvenuto:', emailError);
          addDebugInfo('⚠️ Email non inviata (errore ignorato)');
        }
      } else {
        if (!createdCustomer.email) {
          console.log('⏭️  Email non fornita, skip welcome email');
        }
        if (!organization) {
          console.log('⏭️  Dati organizzazione non disponibili, skip welcome email');
        }
      }

      console.log('🔄 Ricarico lista clienti...');
      
      onCustomerCreated();
      
      console.log('❌ Chiudo modal...');
      onClose();
      
    } catch (error: any) {
      console.error('❌ Errore durante la registrazione:', error);
      addDebugInfo(`❌ ERRORE API: ${error?.message || 'Unknown'}`);
      addDebugInfo(`📋 Code: ${error?.code || 'N/A'}`);
      addDebugInfo(`📋 Details: ${error?.details || 'N/A'}`);
      addDebugInfo(`📋 Hint: ${error?.hint || 'N/A'}`);

      console.error('📋 Dettagli errore completi:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack,
        response: error?.response,
        status: error?.status,
        statusText: error?.statusText,
        name: error?.name,
        cause: error?.cause
      });
      
      // Controllo specifico per tabella mancante
      if (error?.code === 'PGRST204' || error?.message?.includes('customers')) {
        setErrors({ 
          submit: '⚠️ Database non configurato. È necessario eseguire la migrazione per creare la tabella customers. Contatta l\'amministratore.' 
        });
      } else {
        setErrors({ 
          submit: `Errore durante la registrazione: ${error?.message || 'Errore sconosciuto'}` 
        });
      }
    } finally {
      console.log('🏁 Fine processo registrazione');
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="wizard-step-content">
            <h3>Dati Personali</h3>

            {/* Loading indicator for organization data */}
            {loadingOrganization && (
              <div style={{
                padding: '10px',
                backgroundColor: '#f0f9ff',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #bae6fd',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #3b82f6',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span style={{ color: '#1e40af', fontSize: '14px' }}>
                  Caricamento dati organizzazione...
                </span>
              </div>
            )}

            {/* Show organization info when loaded */}
            {organization && !loadingOrganization && (
              <div style={{
                padding: '10px',
                backgroundColor: '#f0f9ff',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #bae6fd'
              }}>
                <div style={{ color: '#1e40af', fontSize: '14px', fontWeight: '600' }}>
                  🏢 {organization.name}
                </div>
                {organization.loyalty_tiers && organization.loyalty_tiers.length > 0 && (
                  <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
                    🏆 {organization.loyalty_tiers.length} livelli loyalty personalizzati
                  </div>
                )}
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label>Nome *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={errors.firstName ? 'error' : ''}
                />
                {errors.firstName && <span className="error-text">{errors.firstName}</span>}
              </div>
              <div className="form-group">
                <label>Cognome *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={errors.lastName ? 'error' : ''}
                />
                {errors.lastName && <span className="error-text">{errors.lastName}</span>}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Data di Nascita</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Genere *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className={errors.gender ? 'error' : ''}
                >
                  <option value="">Seleziona...</option>
                  <option value="male">Maschio</option>
                  <option value="female">Femmina</option>
                </select>
                {errors.gender && <span className="error-text">{errors.gender}</span>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="wizard-step-content">
            <h3>Informazioni di Contatto</h3>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? 'error' : ''}
                autoComplete="off"
                name="customer-email-registration"
                form="customer-registration-form"
                data-form="customer-wizard"
                spellCheck="false"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
            
            <div className="form-group">
              <label>Telefono *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>

            {duplicateWarning && (
              <div className="duplicate-warning">{duplicateWarning}</div>
            )}
            
            <div className="form-row">
              <div className="form-group">
                <label>Indirizzo</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Città</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>CAP</label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="wizard-step-content">
            <h3>Note e Referral</h3>
            <div className="form-group">
              <label>Note Aggiuntive</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                placeholder="Inserisci eventuali note sul cliente..."
              />
            </div>
            
            <div className="form-group">
              <label>Codice Referral</label>
              <input
                type="text"
                value={formData.referralCode}
                onChange={(e) => handleInputChange('referralCode', e.target.value)}
                placeholder="Se il cliente è stato invitato, inserisci il codice"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="wizard-step-content">
            <GDPRConsent
              onConsentChange={(consents) => {
                console.log('🔐 GDPR Consents changed:', consents);
                handleInputChange('privacyConsent', consents.privacyAccepted);
                handleInputChange('marketingConsent', consents.marketing);
              }}
              showDetailed={true}
            />

            <div className="signature-section">
              <label>Firma Digitale *</label>
              <p className="signature-help">Firma nel riquadro sottostante usando il mouse o il dito su dispositivi touch</p>
              <div className="signature-container">
                <canvas
                  ref={canvasRef}
                  className="signature-canvas"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />
                <button
                  type="button"
                  className="clear-signature"
                  onClick={clearSignature}
                >
                  Cancella
                </button>
              </div>
              {errors.signature && <span className="error-text">{errors.signature}</span>}
            </div>

            {/* Debug Panel for POS - only show on step 4 */}
            {window.innerWidth <= 1024 && debugInfo.length > 0 && (
              <div className="debug-panel">
                <h4>🔧 Debug Info (POS)</h4>
                <div className="debug-messages">
                  {debugInfo.map((info, index) => (
                    <div key={index} className="debug-message">
                      {info}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.signature && formData.privacyConsent && (
              <div className="document-actions">
                <h4>Documento Consensi Privacy</h4>
                <p>Una volta completata la registrazione, potrai stampare o scaricare il modulo firmato.</p>
                <div className="action-buttons">
                  <button
                    type="button"
                    className="btn-print"
                    onClick={printConsentForm}
                  >
                    <Printer size={16} />
                    Stampa Modulo
                  </button>
                  <button
                    type="button"
                    className="btn-download"
                    onClick={downloadConsentPDF}
                  >
                    <Download size={16} />
                    Scarica HTML
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="wizard-overlay">
      <div className="wizard-modal">
        <div className="wizard-header">
          <button className="back-btn" onClick={onClose}>
            <ArrowLeft size={20} />
            Torna Indietro
          </button>
          <h2>Registrazione Nuovo Cliente [v2-FULL-PAGE]</h2>
          <div style={{ width: '120px' }}></div>
        </div>

        <div className="wizard-progress">
          {steps.map((step) => {
            const IconComponent = step.icon;
            return (
              <div
                key={step.number}
                className={`step-indicator ${
                  currentStep === step.number ? 'active' : 
                  currentStep > step.number ? 'completed' : ''
                }`}
              >
                <div className="step-circle">
                  {currentStep > step.number ? '✓' : <IconComponent size={20} />}
                </div>
                <span className="step-title">{step.title}</span>
              </div>
            );
          })}
        </div>

        <div className="wizard-content">
          {renderStepContent()}
        </div>

        <div className="wizard-actions">
          {currentStep > 1 && (
            <button
              type="button"
              className="btn-secondary"
              onClick={prevStep}
            >
              ← Indietro
            </button>
          )}
          
          <div className="flex-spacer" />
          
          {currentStep < 4 ? (
            <button
              type="button"
              className="btn-primary"
              onClick={nextStep}
            >
              Avanti →
            </button>
          ) : (
            <button
              type="button"
              className="btn-success"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Registrazione...' : 'Completa Registrazione'}
            </button>
          )}
        </div>

        {errors.submit && (
          <div className="error-message">
            <div>{errors.submit}</div>
            <button 
              className="btn-secondary" 
              onClick={onClose}
              style={{ marginTop: '12px' }}
            >
              Chiudi Modal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationWizard;