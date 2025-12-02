import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, Mail, FileText, Shield, Printer, Download, ArrowLeft, X, QrCode, Calendar, Phone, MapPin, MessageSquare, Gift, Check } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { customersApi, supabase } from '../lib/supabase';
import { sendWelcomeEmail } from '../services/emailAutomationService';
import { emailService } from '../services/emailService';
import referralService from '../services/referralService';
import GDPRConsent from './GDPRConsent';
import AddressAutocomplete from './AddressAutocomplete';
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
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [isCheckingReferral, setIsCheckingReferral] = useState(false);

  const checkReferralCode = async (code: string) => {
    if (!code || code.length < 3) {
      setReferrerName(null);
      return;
    }

    setIsCheckingReferral(true);
    try {
      const { data, error } = await supabase
        .from('referral_programs')
        .select(`
          customer_id,
          customers (
            name
          )
        `)
        .eq('referral_code', code)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setReferrerName(null);
      } else {
        // Handle nested data correctly
        const customerData = data.customers as any;
        const name = customerData?.name || 'Cliente OMNILY';
        setReferrerName(name);
      }
    } catch (err) {
      console.error('Error checking referral code:', err);
      setReferrerName(null);
    } finally {
      setIsCheckingReferral(false);
    }
  };
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [organization, setOrganization] = useState<any>(null);
  const [loadingOrganization, setLoadingOrganization] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const debugMessage = `${timestamp}: ${message}`;
    setDebugInfo(prev => [...prev.slice(-4), debugMessage]); // Keep last 5 messages
    console.log(debugMessage);
  };

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000); // Auto-hide after 4 seconds
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

  // Recupera dati salvati da localStorage se presenti
  const getSavedFormData = (): FormData => {
    try {
      const saved = localStorage.getItem('registrationWizardData');
      if (saved) {
        console.log('📦 Dati wizard recuperati da localStorage');
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Errore recupero dati da localStorage:', error);
    }
    return {
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
    };
  };

  const [formData, setFormData] = useState<FormData>(getSavedFormData());

  const steps = [
    { number: 1, title: 'Dati Personali', icon: User },
    { number: 2, title: 'Contatti', icon: Mail },
    { number: 3, title: 'Note', icon: FileText },
    { number: 4, title: 'Privacy & Consensi', icon: Shield }
  ];

  // Warning quando prova a chiudere/ricaricare la pagina se ci sono dati compilati
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Controlla se ci sono dati compilati
      const hasData = formData.firstName || formData.lastName || formData.email || formData.phone;

      if (hasData && !isLoading) {
        e.preventDefault();
        e.returnValue = 'Hai dati non salvati. Sei sicuro di voler uscire?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formData, isLoading]);

  useEffect(() => {
    if (isOpen) {
      // Solo resetta se NON ci sono dati salvati in localStorage
      const savedData = localStorage.getItem('registrationWizardData');
      const savedStep = localStorage.getItem('registrationWizardStep');

      if (!savedData) {
        console.log('🔄 Nessun dato salvato, resetto il form');
        resetForm();
      } else {
        console.log('📦 Dati trovati in localStorage, mantengo il form');
        // Recupera anche lo step salvato
        if (savedStep) {
          const step = parseInt(savedStep, 10);
          console.log(`📍 Step recuperato: ${step}`);
          setCurrentStep(step);
        }
      }
      initCanvas();
      fetchOrganization(); // Fetch latest organization data from DB
    }
  }, [isOpen, organizationId]);

  // Handle input focus/blur to hide/show header
  useEffect(() => {
    const handleFocus = () => setIsInputFocused(true);
    const handleBlur = () => setIsInputFocused(false);

    // Add listeners to all input, select, and textarea elements
    const inputs = document.querySelectorAll('.wizard-modal input, .wizard-modal select, .wizard-modal textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', handleFocus);
      input.addEventListener('blur', handleBlur);
    });

    return () => {
      inputs.forEach(input => {
        input.removeEventListener('focus', handleFocus);
        input.removeEventListener('blur', handleBlur);
      });
    };
  }, [currentStep]); // Re-run when step changes

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
    // Pulisci localStorage
    localStorage.removeItem('registrationWizardData');
    localStorage.removeItem('registrationWizardStep');
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

      // Salva automaticamente in localStorage (dati + step corrente)
      try {
        localStorage.setItem('registrationWizardData', JSON.stringify(newData));
        localStorage.setItem('registrationWizardStep', currentStep.toString());
        console.log('💾 Dati e step salvati in localStorage');
      } catch (error) {
        console.error('Errore salvataggio localStorage:', error);
      }

      return newData;
    });

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    if (field === 'email' || field === 'phone') {
      checkDuplicates(field, value as string);
    }

    if (field === 'referralCode') {
      // Debounce check
      const timeoutId = setTimeout(() => {
        checkReferralCode(value as string);
      }, 500);
      return () => clearTimeout(timeoutId);
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
      // Show toast with all error messages
      const errorMessages = Object.values(newErrors).join(', ');
      showToast(`Campi obbligatori mancanti: ${errorMessages}`, 'error');

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
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      localStorage.setItem('registrationWizardStep', newStep.toString());
    }
  };

  const prevStep = () => {
    const newStep = currentStep - 1;
    setCurrentStep(newStep);
    localStorage.setItem('registrationWizardStep', newStep.toString());
  };

  // Check if current step is valid for disabling "Avanti" button
  // useMemo ensures this recalculates whenever formData or currentStep changes
  const isCurrentStepValid = useMemo(() => {
    const newErrors: { [key: string]: string } = {};

    switch (currentStep) {
      case 1:
        if (!formData.firstName.trim()) newErrors.firstName = 'Nome richiesto';
        if (!formData.lastName.trim()) newErrors.lastName = 'Cognome richiesto';
        if (!formData.gender) newErrors.gender = 'Genere richiesto';
        break;
      case 2:
        if (!formData.email.trim()) newErrors.email = 'Email richiesta';
        if (!formData.phone.trim()) newErrors.phone = 'Telefono richiesto';
        break;
      case 3:
        // Note step - always valid (no required fields)
        break;
      case 4:
        if (!formData.privacyConsent) newErrors.privacyConsent = 'Consenso privacy richiesto';
        if (!formData.signature) newErrors.signature = 'Firma richiesta';
        break;
    }

    return Object.keys(newErrors).length === 0;
  }, [formData, currentStep]);

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

  // QR Scanner Functions
  const startQrScanner = async () => {
    console.log('📱 startQrScanner chiamato');

    // Prima prova ad usare il bridge Android (dispositivo POS)
    if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
      const bridge = (window as any).OmnilyPOS;

      if (bridge.readQRCode) {
        console.log('📱 Usando bridge Android per QR scan');

        // Setup callback handler globale
        (window as any).registrationWizardQRHandler = (result: any) => {
          console.log('✅ QR Code scanned via bridge:', result);
          console.log('🔍 Type of result:', typeof result);
          console.log('🔍 Result stringified:', JSON.stringify(result));

          // Android bridge passa un oggetto JSON: {success: true, content: "url", qrCode: "url"}
          // Estraiamo l'URL dal campo content o qrCode
          let url = '';
          if (typeof result === 'object' && result !== null) {
            url = result.content || result.qrCode || '';
            console.log('📦 Extracted URL from object:', url);
          } else if (typeof result === 'string') {
            url = result;
            console.log('📦 URL is a string:', url);
          }

          // Extract referral code from URL or use direct code
          let referralCode = url;
          if (url.includes('ref=')) {
            console.log('📌 Found ref= pattern in URL');

            // IMPORTANT: For old QR codes with unencoded & character (e.g., ref=S&C123),
            // we need to extract everything after ref= until end of URL
            const refIndex = url.indexOf('ref=');
            if (refIndex !== -1) {
              // Extract everything after ref=
              const afterRef = url.substring(refIndex + 4);
              console.log('📌 Raw value after ref=:', afterRef);

              // Try to decode (in case it's a new encoded QR code)
              try {
                referralCode = decodeURIComponent(afterRef);
                console.log('📌 Decoded referral code:', referralCode);
              } catch (e) {
                // If decode fails, use raw value
                referralCode = afterRef;
                console.log('📌 Using raw referral code:', referralCode);
              }
            }
          } else if (url.includes('/referral/')) {
            console.log('📌 Found /referral/ pattern in URL');
            // Extract from URL pattern like /referral/CODE
            // Capture everything after /referral/ until the next / or ? or end of string
            const match = url.match(/\/referral\/([^/?]+)/i);
            if (match) {
              // Decode in case the path segment is encoded
              referralCode = decodeURIComponent(match[1]);
              console.log('📌 Extracted referral code:', referralCode);
            }
          }

          console.log('🎯 Setting referral code:', referralCode);
          // Set the referral code
          handleInputChange('referralCode', referralCode);
          console.log('✅ handleInputChange called');

          // Cleanup
          delete (window as any).registrationWizardQRHandler;
        };

        // Chiama il bridge Android
        bridge.readQRCode('registrationWizardQRHandler');
        return;
      }
    }

    // Fallback: usa html5-qrcode per browser web
    try {
      setScannerError('');
      setShowQrScanner(true);

      // Wait for the DOM element to be available
      await new Promise(resolve => setTimeout(resolve, 100));

      const html5QrCode = new Html5Qrcode('qr-reader');
      qrScannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          console.log('✅ QR Code scanned:', decodedText);

          // Extract referral code from URL or use direct code
          let referralCode = decodedText;
          if (decodedText.includes('ref=')) {
            const urlParams = new URLSearchParams(decodedText.split('?')[1]);
            referralCode = urlParams.get('ref') || decodedText;
          } else if (decodedText.includes('/referral/')) {
            // Match any characters after /referral/ until next separator
            const match = decodedText.match(/\/referral\/([^/?]+)/i);
            if (match) referralCode = decodeURIComponent(match[1]);
          }

          // Set the referral code
          handleInputChange('referralCode', referralCode);

          // Stop scanner and close modal
          stopQrScanner();
        },
        (errorMessage) => {
          // Errors during scanning (not critical)
        }
      );
    } catch (err: any) {
      console.error('❌ Error starting QR scanner:', err);
      setScannerError('Impossibile avviare la fotocamera. Verifica i permessi.');
      setShowQrScanner(false);
    }
  };

  const stopQrScanner = async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
        qrScannerRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setShowQrScanner(false);
    setScannerError('');
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

      // Genera token di attivazione unico
      const activationToken = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      console.log('🔑 Token di attivazione generato:', activationToken);
      addDebugInfo(`🔑 Token generato: ${activationToken.substring(0, 20)}...`);

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
        last_visit: undefined,
        // Campi per attivazione
        is_activated: false,
        activation_token: activationToken,
        activated_at: null
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

      // 🎁 Crea programma referral per il nuovo cliente
      try {
        console.log('🎁 Creazione programma referral per il nuovo cliente...');
        const customerName = `${formData.firstName} ${formData.lastName}`.trim();
        const referralProgram = await referralService.programs.create(
          organizationId,
          createdCustomer.id,
          customerName
        );
        console.log('✅ Programma referral creato:', referralProgram);
        addDebugInfo(`✅ Codice referral: ${referralProgram.referral_code}`);
      } catch (referralErr) {
        console.error('❌ Errore creazione programma referral:', referralErr);
        // Non blocca la registrazione se fallisce la creazione del programma referral
        addDebugInfo('⚠️ Programma referral non creato');
      }

      // 📝 LOG WELCOME BONUS (50 punti)
      try {
        const { logActivity } = await import('../lib/activityLogger');
        await logActivity({
          organizationId,
          action: 'added_points',
          entityType: 'customer',
          entityId: createdCustomer.id,
          details: {
            customer_name: `${formData.firstName} ${formData.lastName}`,
            points: 50,
            reason: 'welcome_bonus'
          }
        });
        console.log('📝 Welcome bonus (50 punti) loggato nello storico');
      } catch (logErr) {
        console.error('❌ Errore logging welcome bonus:', logErr);
        // Non blocca la registrazione
      }

      // 🎁 Gestisci referral se presente
      if (formData.referralCode && formData.referralCode.trim()) {
        try {
          console.log('🎁 Processamento referral code:', formData.referralCode);
          addDebugInfo(`🎁 Referral code: ${formData.referralCode}`);

          // 1. Trova il referrer dal codice con tier info
          const { data: referralProgram, error: referralError } = await supabase
            .from('referral_programs')
            .select(`
              id,
              customer_id,
              organization_id,
              current_tier_id,
              referral_tiers!referral_programs_current_tier_id_fkey (
                id,
                name,
                points_per_referral,
                points_for_referee
              )
            `)
            .eq('referral_code', formData.referralCode.trim())
            .eq('organization_id', organizationId)
            .eq('is_active', true)
            .single();

          if (referralError || !referralProgram) {
            console.warn('⚠️ Codice referral non trovato o non valido');
            addDebugInfo('⚠️ Codice referral non valido');
          } else if (referralProgram.customer_id === createdCustomer.id) {
            console.warn('⚠️ Non puoi usare il tuo stesso codice referral');
            addDebugInfo('⚠️ Codice referral non valido (stesso utente)');
          } else {
            console.log('✅ Referrer trovato:', referralProgram);
            addDebugInfo(`✅ Referrer trovato: ${referralProgram.customer_id}`);

            // Ottieni i punti dalla tier del referrer
            // Fix: Handle potential array response from Supabase join
            const tierData = referralProgram.referral_tiers as any;
            const tier = Array.isArray(tierData) ? tierData[0] : tierData;

            const referrerPoints = tier?.points_per_referral || 20;
            const refereePoints = tier?.points_for_referee || 20;

            console.log(`🎁 Punti da assegnare - Referrer: ${referrerPoints}, Referee: ${refereePoints}`);

            // 2. Chiama RPC sicura per processare il referral
            const { data: rpcResult, error: rpcError } = await supabase.rpc('process_referral_conversion', {
              p_organization_id: organizationId,
              p_referrer_id: referralProgram.customer_id,
              p_referee_id: createdCustomer.id,
              p_referral_program_id: referralProgram.id,
              p_referral_code: formData.referralCode.trim(),
              p_points_referrer: referrerPoints,
              p_points_referee: refereePoints
            });

            if (rpcError) {
              console.error('❌ Errore RPC referral:', rpcError);
              addDebugInfo(`❌ Errore RPC: ${rpcError.message}`);
            } else if (rpcResult && !rpcResult.success) {
              console.error('❌ Errore logico referral:', rpcResult.error);
              addDebugInfo(`❌ Errore referral: ${rpcResult.error}`);
            } else {
              console.log('✅ Referral processato con successo via RPC:', rpcResult);
              addDebugInfo('✅ Referral registrato con successo (RPC)!');
              addDebugInfo(`✅ ${referrerPoints} punti al referrer`);
              addDebugInfo(`✅ ${refereePoints} punti al nuovo cliente`);
            }
          }
        } catch (referralErr) {
          // Non-blocking error - don't fail registration if referral fails
          console.error('❌ Errore processamento referral:', referralErr);
          addDebugInfo('⚠️ Errore processamento referral (ignorato)');
        }
      }

      // 📧 Invia email di attivazione (non-blocking)
      if (createdCustomer.email && organization && organization.slug) {
        try {
          console.log('📧 Invio email di attivazione a:', createdCustomer.email);
          addDebugInfo('📧 Invio email di attivazione...');

          const emailResult = await emailService.sendActivationEmail(
            createdCustomer.email,
            createdCustomer.name,
            organizationId,
            organization.name,
            activationToken,
            organization.slug
          );

          if (emailResult.success) {
            console.log('✅ Email di attivazione inviata con successo');
            addDebugInfo('✅ Email di attivazione inviata!');
          } else {
            console.error('⚠️ Errore invio email di attivazione:', emailResult.error);
            addDebugInfo('⚠️ Email non inviata (errore)');
          }
        } catch (emailError) {
          // Non-blocking error - don't fail registration if email fails
          console.error('⚠️ Errore invio email di attivazione:', emailError);
          addDebugInfo('⚠️ Email non inviata (errore ignorato)');
        }
      } else {
        if (!createdCustomer.email) {
          console.log('⏭️  Email non fornita, skip activation email');
          addDebugInfo('⏭️  Email non fornita');
        }
        if (!organization) {
          console.log('⏭️  Dati organizzazione non disponibili, skip activation email');
          addDebugInfo('⏭️  Org non disponibile');
        }
        if (!organization?.slug) {
          console.log('⏭️  Slug organizzazione non disponibile, skip activation email');
          addDebugInfo('⏭️  Slug non disponibile');
        }
      }

      console.log('🔄 Ricarico lista clienti...');

      onCustomerCreated();

      // Mostra messaggio di conferma
      showToast('✅ Cliente registrato con successo! Invio email per accedere all\'app', 'success');

      // Pulisci localStorage dopo registrazione completata
      localStorage.removeItem('registrationWizardData');
      console.log('🧹 Dati wizard rimossi da localStorage');

      console.log('❌ Chiudo modal...');
      // Ritarda la chiusura per mostrare il messaggio
      setTimeout(() => {
        onClose();
      }, 2000);

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
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#0f172a' }}>
              <User size={24} color="#ef4444" />
              Dati Personali
            </h3>

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
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={errors.firstName ? 'error' : ''}
                    placeholder="Inserisci nome"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Cognome *</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={errors.lastName ? 'error' : ''}
                    placeholder="Inserisci cognome"
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Data di Nascita</label>
                <div className="input-with-icon">
                  <Calendar size={18} className="input-icon" />
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Genere *</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className={errors.gender ? 'error' : ''}
                  >
                    <option value="">Seleziona...</option>
                    <option value="male">Maschio</option>
                    <option value="female">Femmina</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="wizard-step-content">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#0f172a' }}>
              <Mail size={24} color="#ef4444" />
              Informazioni di Contatto
            </h3>
            <div className="form-group">
              <label>Email *</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
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
                  placeholder="esempio@email.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Telefono *</label>
              <div className="input-with-icon">
                <Phone size={18} className="input-icon" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={errors.phone ? 'error' : ''}
                  placeholder="+39 123 456 7890"
                />
              </div>
            </div>

            {duplicateWarning && (
              <div className="duplicate-warning">{duplicateWarning}</div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Indirizzo</label>
                <AddressAutocomplete
                  value={formData.address}
                  onChange={(address) => handleInputChange('address', address)}
                  placeholder="Via, numero civico"
                />
              </div>
              <div className="form-group">
                <label>Città</label>
                <div className="input-with-icon">
                  <MapPin size={18} className="input-icon" />
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Nome città"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>CAP</label>
                <div className="input-with-icon">
                  <MapPin size={18} className="input-icon" />
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="00100"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="wizard-step-content">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#0f172a' }}>
              <FileText size={24} color="#ef4444" />
              Note e Referral
            </h3>
            <div className="form-group">
              <label>
                <MessageSquare size={16} />
                Note Aggiuntive
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                placeholder="Inserisci eventuali note sul cliente..."
              />
            </div>

            <div className="form-group">
              <label>
                <Gift size={16} />
                Codice Referral
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div className="input-with-icon" style={{ flex: 1 }}>
                  <Gift size={18} className="input-icon" />
                  <input
                    type="text"
                    value={formData.referralCode}
                    onChange={(e) => handleInputChange('referralCode', e.target.value)}
                    placeholder="Inserisci il codice referral"
                    className={referrerName ? 'success-input' : ''}
                  />
                </div>
                <button
                  type="button"
                  onClick={startQrScanner}
                  style={{
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.2s'
                  }}
                >
                  <QrCode size={18} />
                  Scansiona QR
                </button>
              </div>

              {isCheckingReferral && (
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="spinner-small"></span> Verifica codice...
                </p>
              )}

              {referrerName && !isCheckingReferral && (
                <p style={{ fontSize: '13px', color: '#10b981', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                  <Check size={14} />
                  Sei stato invitato da: <strong>{referrerName}</strong>
                </p>
              )}

              {formData.referralCode && !referrerName && !isCheckingReferral && formData.referralCode.length > 3 && (
                <p style={{ fontSize: '13px', color: '#ef4444', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <X size={14} />
                  Codice non valido o scaduto
                </p>
              )}

              {scannerError && (
                <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>
                  {scannerError}
                </p>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="wizard-step-content">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#0f172a', marginBottom: '20px' }}>
              <Shield size={24} color="#ef4444" />
              Privacy & Consensi
            </h3>
            <GDPRConsent
              onConsentChange={(consents) => {
                console.log('🔐 GDPR Consents changed:', consents);
                handleInputChange('privacyConsent', consents.privacyAccepted);
                handleInputChange('marketingConsent', consents.marketing);
              }}
              showDetailed={true}
            />

            {/* Pulsante Leggi Privacy */}
            <div style={{ marginTop: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: organization?.primary_color || '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <FileText size={20} />
                Leggi Privacy Policy Completa
              </button>
            </div>

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
        <div className={`wizard-header ${isInputFocused ? 'header-hidden' : ''}`}>
          <button className="back-btn" onClick={onClose}>
            <ArrowLeft size={20} />
            Torna Indietro
          </button>
          <h2>Registrazione Nuovo Cliente</h2>
          <div style={{ width: '120px' }}></div>
        </div>

        <div className={`wizard-progress ${isInputFocused ? 'progress-hidden' : ''}`}>
          {steps.map((step) => {
            const IconComponent = step.icon;
            return (
              <div
                key={step.number}
                className={`step-indicator ${currentStep === step.number ? 'active' :
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
              disabled={!isCurrentStepValid}
              style={{
                opacity: !isCurrentStepValid ? 0.5 : 1,
                cursor: !isCurrentStepValid ? 'not-allowed' : 'pointer'
              }}
            >
              Avanti →
            </button>
          ) : (
            <button
              type="button"
              className="btn-success"
              onClick={handleSubmit}
              disabled={isLoading || !isCurrentStepValid}
              style={{
                opacity: (isLoading || !isCurrentStepValid) ? 0.5 : 1,
                cursor: (isLoading || !isCurrentStepValid) ? 'not-allowed' : 'pointer'
              }}
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

      {/* QR Scanner Modal */}
      {showQrScanner && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
          onClick={stopQrScanner}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={stopQrScanner}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280'
              }}
            >
              <X size={24} />
            </button>

            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 600 }}>
              Scansiona QR Code Referral
            </h3>
            <p style={{ margin: '0 0 20px 0', color: '#6b7280', fontSize: '14px' }}>
              Posiziona il QR code davanti alla fotocamera
            </p>

            <div
              id="qr-reader"
              style={{
                width: '100%',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            />
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={() => setShowPrivacyModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '24px 32px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#111827', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileText size={28} color="#111827" />
                  Privacy Policy Completa
                </h2>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                  Informativa sul Trattamento dei Dati Personali - GDPR
                </p>
              </div>
              <button
                onClick={() => setShowPrivacyModal(false)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e5e7eb';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <X size={24} color="#374151" />
              </button>
            </div>

            {/* Content */}
            <div style={{
              padding: '32px',
              overflowY: 'auto',
              fontSize: '15px',
              lineHeight: '1.8',
              color: '#374151'
            }}>
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>
                  I. Identificazione del Titolare del Trattamento
                </h3>
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', borderLeft: '4px solid ' + (organization?.primary_color || '#ef4444') }}>
                  <strong>{organization?.legal_name || organization?.name || 'Nome Azienda'}</strong><br/>
                  Sede Legale: {organization?.address_street || 'Indirizzo non specificato'}, {organization?.address_zip || ''} {organization?.address_city || ''} ({organization?.address_province || ''})<br/>
                  {organization?.vat_number && <>P.IVA: {organization.vat_number}</>}
                  {organization?.tax_code && <> - C.F.: {organization.tax_code}</>}<br/>
                  Email: {organization?.privacy_email || organization?.company_email || organization?.email || 'email@example.com'} - Tel: {organization?.company_phone || organization?.phone || 'N/A'}<br/>
                  {organization?.legal_representative && <><strong>Rappresentante Legale:</strong> {organization.legal_representative}</>}
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>
                  II. Finalità e Base Giuridica del Trattamento
                </h3>
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    A) Trattamenti Necessari (Art. 6, par. 1, lett. b) GDPR)
                  </h4>
                  <ul style={{ paddingLeft: '24px', margin: 0 }}>
                    <li><strong>Gestione del rapporto contrattuale:</strong> Erogazione dei servizi di loyalty management</li>
                    <li><strong>Adempimenti di legge:</strong> Obblighi fiscali, contabili e amministrativi</li>
                    <li><strong>Sicurezza:</strong> Prevenzione frodi e attività illecite</li>
                  </ul>
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    B) Trattamenti basati sul consenso (Art. 6, par. 1, lett. a) GDPR)
                  </h4>
                  <ul style={{ paddingLeft: '24px', margin: 0 }}>
                    <li><strong>Marketing diretto:</strong> Invio comunicazioni commerciali e promozionali</li>
                    <li><strong>Profilazione:</strong> Analisi preferenze per offerte personalizzate</li>
                    <li><strong>Newsletter:</strong> Invio periodico di informazioni sui servizi</li>
                  </ul>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>
                  III. Categorie di Dati Trattati
                </h3>
                <ul style={{ paddingLeft: '24px', margin: 0 }}>
                  <li><strong>Dati anagrafici:</strong> Nome, cognome, data di nascita</li>
                  <li><strong>Dati di contatto:</strong> Email, telefono, indirizzo postale</li>
                  <li><strong>Dati comportamentali:</strong> Preferenze, cronologia acquisti, interazioni</li>
                  <li><strong>Dati tecnici:</strong> Indirizzo IP, cookies, dati di navigazione</li>
                </ul>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>
                  IV. Periodo di Conservazione
                </h3>
                <ul style={{ paddingLeft: '24px', margin: 0 }}>
                  <li><strong>Dati contrattuali:</strong> 10 anni dalla cessazione del rapporto</li>
                  <li><strong>Dati marketing:</strong> Fino a revoca del consenso o 2 anni dall'ultima interazione</li>
                  <li><strong>Dati tecnici:</strong> 12 mesi dalla raccolta</li>
                </ul>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>
                  V. Diritti dell'Interessato
                </h3>
                <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <p style={{ margin: '0 0 16px 0', fontWeight: '600' }}>L'interessato ha diritto di ottenere dal Titolare del trattamento:</p>
                  <ul style={{ paddingLeft: '24px', margin: 0 }}>
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
              </div>

              <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                <strong style={{ display: 'block', marginBottom: '12px' }}>Per esercitare i tuoi diritti contatta:</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Mail size={18} color="#92400e" />
                  <span>Email: {organization?.privacy_email || organization?.company_email || organization?.email || 'privacy@example.com'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Phone size={18} color="#92400e" />
                  <span>Telefono: {organization?.company_phone || organization?.phone || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <MapPin size={18} color="#92400e" />
                  <span>Posta: {organization?.legal_name || organization?.name || 'Nome Azienda'}, {organization?.address_street || 'Indirizzo'}, {organization?.address_zip || ''} {organization?.address_city || ''} ({organization?.address_province || ''})</span>
                </div>
                <strong>Autorità Garante:</strong> www.gpdp.it - garante@gpdp.it
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '20px 32px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              flexShrink: 0
            }}>
              <button
                onClick={() => setShowPrivacyModal(false)}
                style={{
                  background: organization?.primary_color || '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Ho letto e compreso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#10b981' : '#3b82f6',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '400px',
            zIndex: 10001,
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'white',
            flexShrink: 0
          }} />
          <span style={{
            fontSize: '14px',
            fontWeight: 500,
            lineHeight: 1.5
          }}>
            {toast.message}
          </span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              marginLeft: 'auto',
              opacity: 0.8,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default RegistrationWizard;