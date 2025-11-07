import React, { useState, useEffect, useRef } from 'react'
import { supabase, organizationsApi, customersApi, nfcCardsApi, customerActivitiesApi } from '../lib/supabase'
import type { Organization, Customer, Reward } from '../lib/supabase'
import { rewardsService } from '../services/rewardsService'
import { ZCSPrintService } from '../services/printService'
import RewardModal from './RewardModal'
import { useAuth } from '../contexts/AuthContext'
import { BarChart3, Users, Gift, Target, TrendingUp, Settings, HelpCircle, LogOut, Search, QrCode, CreditCard, UserCheck, AlertTriangle, X, StopCircle, CheckCircle2, XCircle, Star, Award, Package, Mail, UserPlus, Zap, Bell, Globe, Palette, Building2, Crown, Lock, Plus, Edit2, Trash2, Megaphone, Wifi, Printer, Smartphone, Activity, RefreshCw, Terminal, BookOpen } from 'lucide-react'
import RegistrationWizard from './RegistrationWizard'
import CustomerSlidePanel from './CustomerSlidePanel'
import CardManagementPanel from './CardManagementPanel'
import CardManagementHub from './CardManagementHub'
import LoyaltyTiersConfigPanel from './LoyaltyTiersConfigPanel'
import AccountSettingsPanel from './AccountSettingsPanel'
import AccountSettingsHub from './AccountSettingsHub'
import EmailMarketingPanel from './EmailMarketingPanel'
import EmailMarketingHub from './EmailMarketingHub'
import EmailAutomationsPanel from './EmailAutomationsPanel'
import OrganizationBrandingPanel from './OrganizationBrandingPanel'
import AnalyticsDashboard from './AnalyticsDashboard'
import GiftCertificatesPanel from './GiftCertificatesPanel'
import GiftCertificatesStatsModal from './GiftCertificatesStatsModal'
import SubscriptionsPanel from './SubscriptionsPanel'
import SubscriptionStatsModal from './SubscriptionStatsModal'
import UpgradePrompt from './UpgradePrompt'
import WebsiteContentEditor from './POS/WebsiteContentEditor'
import TeamManagementHub from './TeamManagementHub'
import LoyaltyTiersDisplay from './LoyaltyTiersDisplay'
import ConfirmModal from './UI/ConfirmModal'
import { hasAccess, getUpgradePlan, PlanType } from '../utils/planPermissions'
import './OrganizationsDashboard.css'
import './RewardCard.css'

interface OrganizationsDashboardProps {
  onSectionChange?: (section: string) => void;
  activeSection?: string;
  onOrganizationChange?: (organization: Organization | null) => void;
}

const OrganizationsDashboard: React.FC<OrganizationsDashboardProps> = ({
  onSectionChange,
  activeSection: externalActiveSection,
  onOrganizationChange
}) => {
  // Detect POS mode
  const isPOSMode = typeof window !== 'undefined' &&
    window.location.search.includes('posomnily=true')
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerStats, setCustomerStats] = useState({
    total: 0,
    male: 0,
    female: 0,
    withNotifications: 0
  })
  const [loading, setLoading] = useState(true)
  const [customersLoading, setCustomersLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState(
    isPOSMode ? 'pos-integration' : (externalActiveSection || 'dashboard')
  )

  // Sync with external activeSection changes (from POS menu)
  useEffect(() => {
    if (externalActiveSection) {
      setActiveSection(externalActiveSection)
    }
  }, [externalActiveSection])

  // Handle section change and notify parent (POS layout)
  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    if (onSectionChange) {
      onSectionChange(section)
    }
  }


  const [showRegistrationWizard, setShowRegistrationWizard] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Plan-based access control
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState('')
  const [requiredPlan, setRequiredPlan] = useState<PlanType>(PlanType.BASIC)
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  
  const [nfcStatus, setNfcStatus] = useState<'idle' | 'reading' | 'success' | 'error'>('idle');
  const [nfcResult, setNfcResult] = useState<any>(null);
  const [qrStatus, setQrStatus] = useState<'idle' | 'reading' | 'success' | 'error'>('idle');
  const [qrResult, setQrResult] = useState<any>(null);
  const [nfcTimeoutId, setNfcTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Rewards management state
  const [rewards, setRewards] = useState<Reward[]>([])
  const [rewardsLoading, setRewardsLoading] = useState(false)
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [rewardModalLoading, setRewardModalLoading] = useState(false)
  const [showDocsModal, setShowDocsModal] = useState(false)

  // Hardware monitoring state
  const [hardwareStatus, setHardwareStatus] = useState({
    bridge: {
      status: 'checking' as 'connected' | 'disconnected' | 'checking',
      message: 'Verifica in corso...',
      version: undefined as string | undefined
    },
    system: {
      manufacturer: undefined as string | undefined,
      model: undefined as string | undefined,
      androidVersion: undefined as string | undefined,
      sdkVersion: undefined as string | undefined
    },
    printer: {
      status: 'checking' as 'ready' | 'error' | 'offline' | 'checking',
      message: 'Verifica in corso...',
      model: undefined as string | undefined
    },
    nfc: {
      status: 'checking' as 'available' | 'unavailable' | 'checking',
      message: 'Verifica in corso...'
    },
    network: {
      status: 'checking' as 'online' | 'offline' | 'checking',
      ip: 'Verifica in corso...',
      type: 'Verifica in corso...'
    },
    emv: {
      status: 'checking' as 'available' | 'unavailable' | 'checking',
      message: 'Verifica in corso...'
    }
  })

  // Matrix Monitor logs
  const [matrixLogs, setMatrixLogs] = useState<string[]>([])
  const [monitorEnabled, setMonitorEnabled] = useState(isPOSMode) // Auto-enable in POS mode
  const matrixLogsRef = React.useRef<HTMLDivElement>(null)
  const logCountRef = React.useRef({ count: 0, lastReset: Date.now() })

  const addMatrixLog = (message: string) => {
    if (!monitorEnabled) return; // Skip if monitor disabled

    // Throttling: max 10 logs per second
    const now = Date.now();
    if (now - logCountRef.current.lastReset > 1000) {
      logCountRef.current.count = 0;
      logCountRef.current.lastReset = now;
    }
    if (logCountRef.current.count >= 10) {
      return; // Skip this log, too many in 1 second
    }
    logCountRef.current.count++;

    // Truncate long messages
    const truncatedMessage = message.length > 500 ? message.substring(0, 500) + '...[TRONCATO]' : message;

    const timestamp = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 } as any)
    setMatrixLogs(prev => {
      const newLogs = [...prev.slice(-99), `[${timestamp}] ${truncatedMessage}`] // Keep last 100 logs
      // Auto-scroll to bottom
      setTimeout(() => {
        if (matrixLogsRef.current) {
          matrixLogsRef.current.scrollTop = matrixLogsRef.current.scrollHeight
        }
      }, 0)
      return newLogs
    })
  }

  // Confirm Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Chiudi',
    onConfirm: () => {},
    type: 'info' as 'warning' | 'danger' | 'info'
  })

  // Helper function to show confirm modal
  const showModal = (config: {
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void
    type?: 'warning' | 'danger' | 'info'
  }) => {
    setConfirmModalConfig({
      title: config.title || 'Informazione',
      message: config.message,
      confirmText: config.confirmText || 'OK',
      cancelText: config.cancelText || 'Chiudi',
      onConfirm: config.onConfirm || (() => setShowConfirmModal(false)),
      type: config.type || 'info'
    })
    setShowConfirmModal(true)
  }

  // FORCE RESET NFC STATE on component mount to prevent stuck states
  useEffect(() => {
    // Force reset any stuck NFC/QR states from previous sessions
    setNfcStatus('idle');
    setNfcResult(null);
    setQrStatus('idle');
    setQrResult(null);
    console.log('🔄 FORCE RESET: NFC/QR states cleared on component mount');
  }, []);

  // NFC Card Reading function - SOLO PER DASHBOARD (non CardManagementPanel)
  // Define the global callback function WITHOUT auto-registration
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
      // Definiamo i callback ma NON li registriamo automaticamente
      (window as any).omnilyNFCResultHandler = (result: any) => {
        console.log('🚀 NEW VERSION 16:26 - Risultato lettura NFC (da dashboard):', result);
        console.log('🚀 NEW VERSION 16:26 - Tipo result:', typeof result);
        console.log('🚀 NEW VERSION 16:26 - Result è string?', typeof result === 'string');

        // Parse JSON string if needed
        let parsedResult = result;
        if (typeof result === 'string') {
          try {
            parsedResult = JSON.parse(result);
            console.log('🔄 Parsed JSON result:', parsedResult);
            console.log('🔄 Parsed success:', parsedResult.success);
            console.log('🔄 Parsed cardNo:', parsedResult.cardNo);
          } catch (e) {
            console.error('❌ Failed to parse JSON result:', e);
            parsedResult = { success: false, error: 'Parse failed' };
          }
        }

        console.log('🎯 Final parsedResult:', parsedResult);
        console.log('🎯 Final parsedResult.success:', parsedResult?.success);
        console.log('🎯 Condition check:', parsedResult && parsedResult.success);

        setNfcResult(parsedResult);
        setNfcStatus('idle'); // Reset status after reading

        // Clear any active timeout
        if (nfcTimeoutId) {
          clearTimeout(nfcTimeoutId);
          setNfcTimeoutId(null);
        }

        // FORCE string parsing - Android always sends JSON as string
        if (typeof result === 'string') {
          try {
            parsedResult = JSON.parse(result);
          } catch (e) {
            parsedResult = { success: false, error: 'Parse failed' };
          }
        }

        if (parsedResult && parsedResult.success === true) {
          console.log('✅ Carta NFC letta:', parsedResult.cardNo);
          setNfcStatus('success');
          if ((window as any).OmnilyPOS.beep) {
            (window as any).OmnilyPOS.beep("1", "150");
          }

          // 🔍 CERCA IL CLIENTE ASSOCIATO ALLA TESSERA
          const cardUID = parsedResult.cardNo;
          console.log('🔍 Cercando cliente con tessera UID:', cardUID);

          // Cerca la tessera NFC nell'organizzazione corrente
          const organizationId = organizations.length > 0 ? organizations[0].id : 'c06a8dcf-b209-40b1-92a5-c80facf2eb29';

          // Funzione asincrona per cercare il cliente
          const findAndOpenCustomer = async () => {
            try {
              const matchingCard = await nfcCardsApi.getByUID(organizationId, cardUID);

              if (matchingCard && matchingCard.customer) {
                // ✅ CLIENTE TROVATO - Apri il panel automaticamente
                console.log('✅ Cliente trovato:', matchingCard.customer.name);
                setSelectedCustomer(matchingCard.customer);
                setIsSlidePanelOpen(true);

                // Incrementa visite per accesso tramite NFC
                incrementCustomerVisits(matchingCard.customer.id);

                if ((window as any).OmnilyPOS.showToast) {
                  (window as any).OmnilyPOS.showToast(`Cliente: ${matchingCard.customer.name}`);
                }
              } else {
                // ❌ CLIENTE NON TROVATO - Solo mostra UID
                console.log('❌ Nessun cliente associato alla tessera:', cardUID);
                if ((window as any).OmnilyPOS.showToast) {
                  (window as any).OmnilyPOS.showToast('Tessera non assegnata: ' + cardUID?.slice(0, 8) + '...');
                }
              }
            } catch (error) {
              console.error('❌ Errore ricerca tessera:', error);
              if ((window as any).OmnilyPOS.showToast) {
                (window as any).OmnilyPOS.showToast('Errore ricerca tessera');
              }
            }
          };

          // Esegui la ricerca in modo asincrono
          findAndOpenCustomer();
        } else {
          console.log('❌ Errore lettura NFC:', result?.error || 'Lettura fallita');
          setNfcStatus('error');
          if ((window as any).OmnilyPOS.beep) {
            (window as any).OmnilyPOS.beep("3", "50");
          }
          if ((window as any).OmnilyPOS.showToast) {
            (window as any).OmnilyPOS.showToast('Errore lettura tessera');
          }
        }
      };

      // Definiamo il callback QR per gestire la lettura QR code
      (window as any).omnilyQRResultHandler = (result: any) => {
        console.log('📱 QR callback ricevuto:', result);

        let parsedResult = result;
        if (typeof result === 'string') {
          try {
            parsedResult = JSON.parse(result);
          } catch (e) {
            parsedResult = { success: false, error: 'Parse failed' };
          }
        }

        setQrResult(parsedResult);

        // Gestisci annullamento
        if (parsedResult && parsedResult.cancelled) {
          console.log('📱 QR scan annullato dall\'utente');
          setQrStatus('idle');
          return;
        }

        setQrStatus('idle');

        if (parsedResult && parsedResult.success === true) {
          // Il contenuto QR può essere in diversi campi: content, qrCode, o data
          const qrContent = parsedResult.content || parsedResult.qrCode || parsedResult.data;
          console.log('✅ QR Code letto:', qrContent);
          setQrStatus('success');

          // Verifica se è un QR code cliente OMNILY
          if (qrContent && qrContent.startsWith('OMNILY_CUSTOMER:')) {
            const customerId = qrContent.replace('OMNILY_CUSTOMER:', '');

            const findAndOpenCustomer = async () => {
              try {
                const customer = await customersApi.getById(customerId);
                if (customer) {
                  setSelectedCustomer(customer);
                  setIsSlidePanelOpen(true);
                  console.log('✅ Cliente trovato e pannello aperto:', customer.name);

                  // Incrementa visite per accesso tramite QR
                  incrementCustomerVisits(customer.id);
                  if ((window as any).OmnilyPOS.beep) {
                    (window as any).OmnilyPOS.beep("1", "150");
                  }
                } else {
                  console.log('❌ Cliente non trovato per ID:', customerId);
                  if ((window as any).OmnilyPOS.showToast) {
                    (window as any).OmnilyPOS.showToast('Cliente non trovato');
                  }
                }
              } catch (error) {
                console.error('❌ Errore ricerca cliente:', error);
                if ((window as any).OmnilyPOS.showToast) {
                  (window as any).OmnilyPOS.showToast('Errore ricerca cliente');
                }
              }
            };

            findAndOpenCustomer();
          } else {
            console.log('❌ QR code non valido per OMNILY');
            if ((window as any).OmnilyPOS.showToast) {
              (window as any).OmnilyPOS.showToast('QR code non riconosciuto');
            }
          }
        } else {
          console.log('❌ Errore lettura QR:', parsedResult?.error || 'Lettura fallita');
          setQrStatus('error');
          if ((window as any).OmnilyPOS.beep) {
            (window as any).OmnilyPOS.beep("3", "50");
          }
        }
      };

      console.log("✅ NFC e QR callback definiti - NON registrati automaticamente");
    }

    // CLEANUP quando il componente si smonta
    return () => {
      if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
        const bridge = (window as any).OmnilyPOS;

        // Disregistra SEMPRE tutti i callback NFC
        if (bridge.unregisterNFCResultCallback) {
          bridge.unregisterNFCResultCallback('omnilyNFCResultHandler');
          console.log("🧹 CLEANUP: NFC callback DISREGISTRATO per dashboard");
        }

        // Ferma qualsiasi lettura in corso
        if (bridge.stopNFCReading) {
          bridge.stopNFCReading();
          console.log("🧹 CLEANUP: Tutte le letture NFC fermate");
        }

        // Rimuovi tutte le funzioni globali NFC e QR
        delete (window as any).omnilyNFCResultHandler;
        delete (window as any).omnilyQRResultHandler;
        delete (window as any).cardManagementNFCHandler;
        console.log("🧹 CLEANUP: Tutte le funzioni NFC e QR rimosse");
      }
    };
  }, []);

  // NFC Card Reading function
  const handleNFCRead = () => {
    // OTTIMIZZAZIONE: Annullamento immediato e responsive per gestione tessere
    if (nfcStatus === 'reading') {
      console.log('🛑 ANNULLAMENTO IMMEDIATO lettura NFC in corso...');

      // 1. Aggiorna subito lo stato UI per feedback immediato
      setNfcStatus('idle');
      setNfcResult(null);

      // Clear any active timeout
      if (nfcTimeoutId) {
        clearTimeout(nfcTimeoutId);
        setNfcTimeoutId(null);
      }

      if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
        const bridge = (window as any).OmnilyPOS;

        // 2. Ferma IMMEDIATAMENTE tutte le operazioni NFC
        try {
          // Prima ferma il lettore fisico
          if (bridge.stopNFCReading) {
            bridge.stopNFCReading();
            console.log("🔴 Lettore NFC fermato IMMEDIATAMENTE");
          }

          // Poi disregistra il callback
          if (bridge.unregisterNFCResultCallback) {
            bridge.unregisterNFCResultCallback('omnilyNFCResultHandler');
            console.log("🔴 Callback NFC disregistrato");
          }

          // Feedback immediato all'utente
          if (bridge.showToast) {
            bridge.showToast('Lettura NFC annullata');
          }

          // Beep di conferma annullamento
          if (bridge.beep) {
            bridge.beep("2", "100"); // 2 beep corti = annullamento
          }

        } catch (error) {
          console.error('⚠️ Errore durante annullamento NFC:', error);
          // Anche in caso di errore, mostra che è annullato
          if (bridge.showToast) {
            bridge.showToast('NFC fermato (possibili errori hardware)');
          }
        }
      }

      console.log('✅ Annullamento NFC completato - sistema pronto');
      return;
    }

    setNfcStatus('reading');
    setNfcResult(null);
    console.log('🔍 Avvio lettura carta NFC...', new Date().toLocaleTimeString());

    if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
      const bridge = (window as any).OmnilyPOS;

      try {
        // REGISTRA il callback SOLO quando richiesto
        if (bridge.registerNFCResultCallback) {
          bridge.registerNFCResultCallback('omnilyNFCResultHandler');
          console.log("✅ NFC callback registrato per dashboard");
        }

        if (bridge.showToast) {
          bridge.showToast('Avvicina la tessera NFC - Premi di nuovo per annullare');
        }

        if (bridge.readNFCCardAsync) {
          bridge.readNFCCardAsync();
        } else {
          throw new Error('Metodo NFC non disponibile');
        }
        console.log('✅ Chiamata NFC inviata. In attesa del risultato...');

        // Set timeout to automatically cancel NFC reading after 30 seconds
        const timeoutId = setTimeout(() => {
          console.log('⏰ TIMEOUT: Lettura NFC automaticamente annullata dopo 30 secondi');
          setNfcStatus('idle');
          setNfcResult(null);
          if (bridge.stopNFCReading) {
            bridge.stopNFCReading();
          }
          if (bridge.unregisterNFCResultCallback) {
            bridge.unregisterNFCResultCallback('omnilyNFCResultHandler');
          }
          if (bridge.showToast) {
            bridge.showToast('Lettura NFC timeout - riprova');
          }
        }, 30000);

        setNfcTimeoutId(timeoutId);

      } catch (error) {
        console.log('💥 Errore chiamata NFC:', error);
        setNfcStatus('error');
        if (error instanceof Error) {
          setNfcResult({ error: error.message });
        } else {
          setNfcResult({ error: 'Unknown error' });
        }
        if (bridge.showToast) {
          bridge.showToast('💥 Errore sistema NFC');
        }
      }

    } else {
      console.log('❌ Bridge non disponibile');
      setNfcStatus('error');
      setNfcResult({ error: 'Bridge non disponibile' });
    }
  };
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isSlidePanelOpen, setIsSlidePanelOpen] = useState(false)

  // Card Management Panel states
  const [showCardManagementPanel, setShowCardManagementPanel] = useState(false)
  const [showLoyaltyTiersPanel, setShowLoyaltyTiersPanel] = useState(false)
  const [showAccountSettingsPanel, setShowAccountSettingsPanel] = useState(false)
  const [showGiftCertificatesPanel, setShowGiftCertificatesPanel] = useState(false)
  const [showGiftCertificatesStatsModal, setShowGiftCertificatesStatsModal] = useState(false)
  const [showSubscriptionsPanel, setShowSubscriptionsPanel] = useState(false)
  const [subscriptionInitialModal, setSubscriptionInitialModal] = useState<'manage' | 'templates' | undefined>(undefined)
  const [showSubscriptionStatsModal, setShowSubscriptionStatsModal] = useState(false)
  const [showEmailMarketingPanel, setShowEmailMarketingPanel] = useState(false)
  const [showEmailAutomationsPanel, setShowEmailAutomationsPanel] = useState(false)
  const [showBrandingPanel, setShowBrandingPanel] = useState(false)

  // Print Service for POS
  const [printService, setPrintService] = useState<ZCSPrintService | null>(null)

  // Funzioni per gestire il slide panel
  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsSlidePanelOpen(true)

    // NON incrementare visite qui - solo su vendita/scan fisico

    // Registra l'attività visita nel database
    if (currentOrganization) {
      customerActivitiesApi.create({
        organization_id: currentOrganization.id,
        customer_id: customer.id,
        type: 'visit',
        description: `Visita cliente - ${customer.name} selezionato dal POS`
      }).then(() => {
        console.log('✅ Attività visita registrata nel database');
      }).catch((error) => {
        console.error('❌ Errore registrazione attività visita:', error);
      });
    }
  }

  const handleCloseSlidePanel = () => {
    setIsSlidePanelOpen(false)
    setSelectedCustomer(null)
  }

  // Funzioni utility per gestione tiers dinamici
  const calculateCustomerTier = (points: number, loyaltyTiers: any[]): any => {
    if (!loyaltyTiers || loyaltyTiers.length === 0) {
      // Fallback ai tiers fissi se non configurati
      if (points >= 1000) return { name: 'Platinum', multiplier: 2, color: '#e5e7eb' };
      if (points >= 500) return { name: 'Gold', multiplier: 1.5, color: '#f59e0b' };
      if (points >= 200) return { name: 'Silver', multiplier: 1.2, color: '#64748b' };
      return { name: 'Bronze', multiplier: 1, color: '#a3a3a3' };
    }

    // Ordina tiers per soglia decrescente per trovare il tier corretto
    const sortedTiers = [...loyaltyTiers].sort((a, b) => parseFloat(b.threshold) - parseFloat(a.threshold));

    for (const tier of sortedTiers) {
      if (points >= parseFloat(tier.threshold)) {
        return {
          name: tier.name,
          multiplier: parseFloat(tier.multiplier) || 1,
          color: tier.color || '#64748b',
          threshold: parseFloat(tier.threshold)
        };
      }
    }

    // Se non trova nessun tier, usa il primo (più basso)
    const firstTier = loyaltyTiers[0];
    return {
      name: firstTier.name,
      multiplier: parseFloat(firstTier.multiplier) || 1,
      color: firstTier.color || '#64748b',
      threshold: parseFloat(firstTier.threshold)
    };
  };

  const calculatePointsWithMultiplier = (basePoints: number, customerPoints: number, loyaltyTiers: any[]): number => {
    const tier = calculateCustomerTier(customerPoints, loyaltyTiers);
    return Math.floor(basePoints * tier.multiplier);
  };

  // Funzione per incrementare visite cliente - SMART: conta solo 1 visita al giorno
  const incrementCustomerVisits = async (customerId: string) => {
    try {
      const currentCustomer = customers.find(c => c.id === customerId);
      if (!currentCustomer) return;

      const now = new Date();
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

      // Controlla se last_visit è oggi
      let lastVisitDate = null;
      if (currentCustomer.last_visit) {
        lastVisitDate = new Date(currentCustomer.last_visit).toISOString().split('T')[0];
      }

      // Se è già venuto oggi, NON incrementare visite
      if (lastVisitDate === today) {
        console.log(`ℹ️ ${currentCustomer.name} già visitato oggi (${today}). Visite non incrementate.`);

        // Aggiorna solo last_visit timestamp (per tracciare l'orario dell'ultima azione)
        const { error } = await supabase
          .from('customers')
          .update({
            last_visit: now.toISOString()
          })
          .eq('id', customerId);

        if (error) {
          console.error('Errore aggiornamento last_visit:', error);
        }

        return; // NON incrementare visite
      }

      // È un nuovo giorno! Incrementa visite
      const newVisits = currentCustomer.visits + 1;

      // Aggiorna visite nel database
      const { error } = await supabase
        .from('customers')
        .update({
          visits: newVisits,
          last_visit: now.toISOString()
        })
        .eq('id', customerId);

      if (error) {
        console.error('Errore aggiornamento visite:', error);
        return;
      }

      // Aggiorna il state locale
      setCustomers(prevCustomers =>
        prevCustomers.map(customer =>
          customer.id === customerId
            ? { ...customer, visits: newVisits, last_visit: now.toISOString() }
            : customer
        )
      );

      // Aggiorna anche il cliente selezionato se necessario
      if (selectedCustomer && selectedCustomer.id === customerId) {
        setSelectedCustomer({ ...selectedCustomer, visits: newVisits, last_visit: now.toISOString() });
      }

      console.log(`✅ Nuova visita! ${currentCustomer.visits} -> ${newVisits} per ${currentCustomer.name} (ultima visita: ${lastVisitDate || 'mai'} → oggi: ${today})`);
    } catch (error) {
      console.error('Errore durante incremento visite:', error);
    }
  };

  const handleAddPoints = async (customerId: string, points: number) => {
    console.log(`Aggiungi ${points} punti al cliente ${customerId}`)

    try {
      // Trova il cliente corrente per ottenere i punti attuali
      const currentCustomer = customers.find(c => c.id === customerId);
      if (!currentCustomer) {
        console.error('Cliente non trovato');
        return;
      }

      const newPoints = currentCustomer.points + points;

      // Aggiorna i punti nel database
      const { data, error } = await supabase
        .from('customers')
        .update({ points: newPoints })
        .eq('id', customerId)
        .select()
        .single();

      if (error) {
        console.error('Errore aggiornamento punti:', error);
        return;
      }

      // Aggiorna il state locale immediatamente
      setCustomers(prevCustomers =>
        prevCustomers.map(customer =>
          customer.id === customerId
            ? { ...customer, points: newPoints }
            : customer
        )
      );

      // Aggiorna anche il cliente selezionato se è quello che ha ricevuto i punti
      if (selectedCustomer && selectedCustomer.id === customerId) {
        setSelectedCustomer({ ...selectedCustomer, points: newPoints });
        console.log(`✅ Cliente selezionato aggiornato in tempo reale: ${selectedCustomer.points} -> ${newPoints} punti`);
      }

      console.log(`Punti aggiornati: ${currentCustomer.points} -> ${newPoints}`);

      // Registra l'attività nel database
      if (currentOrganization) {
        try {
          await customerActivitiesApi.create({
            organization_id: currentOrganization.id,
            customer_id: customerId,
            type: 'points_added',
            description: `Punti aggiunti manualmente: +${points} punti`,
            points: points
          });
          console.log('✅ Attività punti registrata nel database');
        } catch (error) {
          console.error('❌ Errore registrazione attività punti:', error);
        }
      }
    } catch (error) {
      console.error('Errore durante aggiornamento punti:', error);
    }
  }

  const handleNewTransaction = async (customerId: string, amount: number, pointsEarned: number) => {
    console.log(`Nuova transazione per cliente ${customerId}: €${amount}, +${pointsEarned} punti`)

    try {
      // Prima aggiorna i punti del cliente
      const currentCustomer = customers.find(c => c.id === customerId);
      if (!currentCustomer) {
        console.error('Cliente non trovato');
        return { success: false, error: 'Cliente non trovato' };
      }

      const newPoints = currentCustomer.points + pointsEarned;
      const newTotalSpent = currentCustomer.total_spent + amount;

      // Aggiorna punti e importo speso nel database
      const { data, error } = await supabase
        .from('customers')
        .update({
          points: newPoints,
          total_spent: newTotalSpent
        })
        .eq('id', customerId)
        .select()
        .single();

      if (error) {
        console.error('Errore aggiornamento punti:', error);
        return { success: false, error: 'Errore aggiornamento punti' };
      }

      // Aggiorna il state locale immediatamente
      setCustomers(prevCustomers =>
        prevCustomers.map(customer =>
          customer.id === customerId
            ? { ...customer, points: newPoints, total_spent: newTotalSpent }
            : customer
        )
      );

      // Aggiorna anche il cliente selezionato se è quello che ha fatto la transazione
      if (selectedCustomer && selectedCustomer.id === customerId) {
        setSelectedCustomer({ ...selectedCustomer, points: newPoints, total_spent: newTotalSpent });
        console.log(`✅ Cliente selezionato aggiornato: ${selectedCustomer.points} -> ${newPoints} punti, €${selectedCustomer.total_spent.toFixed(2)} -> €${newTotalSpent.toFixed(2)} speso`);
      }

      console.log(`Transazione completata: ${currentCustomer.points} -> ${newPoints} punti, €${currentCustomer.total_spent.toFixed(2)} -> €${newTotalSpent.toFixed(2)} speso`);

      // Incrementa visite per transazione completata (visita con acquisto)
      await incrementCustomerVisits(customerId);

      // Registra l'attività della transazione nel database
      if (currentOrganization) {
        try {
          await customerActivitiesApi.create({
            organization_id: currentOrganization.id,
            customer_id: customerId,
            type: 'transaction',
            description: `Transazione completata: €${amount.toFixed(2)} - +${pointsEarned} punti`,
            amount: amount,
            points: pointsEarned
          });
          console.log('✅ Attività transazione registrata nel database');
        } catch (error) {
          console.error('❌ Errore registrazione attività transazione:', error);
        }
      }

      return {
        success: true,
        customer: { ...currentCustomer, points: newPoints, total_spent: newTotalSpent },
        amount,
        pointsEarned
      };

    } catch (error) {
      console.error('Errore durante la transazione:', error);
      return { success: false, error: 'Errore durante la transazione' };
    }
  }

  // Real metrics from database
  const [metrics, setMetrics] = useState({
    totalStamps: 0,
    totalOffers: 0,
    totalJoins: 0,
    totalCustomers: 0
  })

  const [chartData, setChartData] = useState<Array<{month: string, stamps: number, redemptions: number}>>([])

  // Load dashboard metrics
  useEffect(() => {
    const loadDashboardMetrics = async () => {
      if (!currentOrganization) return

      try {
        // 1. Total points distributed (sum of all customer points)
        const { data: pointsData } = await supabase
          .from('customers')
          .select('points')
          .eq('organization_id', currentOrganization.id)

        const totalStamps = pointsData?.reduce((sum, c) => sum + (c.points || 0), 0) || 0

        // 2. Total rewards/offers
        const { count: rewardsCount } = await supabase
          .from('rewards')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.id)

        // 3. Total customers
        const totalCustomers = customers.length

        // 4. Total joins (customers created)
        const totalJoins = customers.length

        setMetrics({
          totalStamps,
          totalOffers: rewardsCount || 0,
          totalJoins,
          totalCustomers
        })

        // 5. Chart data - last 12 months activity
        const monthsData = []
        const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

        for (let i = 11; i >= 0; i--) {
          const date = new Date()
          date.setMonth(date.getMonth() - i)
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

          // Points added this month
          const { data: monthActivities } = await supabase
            .from('customer_activities')
            .select('type')
            .eq('organization_id', currentOrganization.id)
            .gte('created_at', monthStart.toISOString())
            .lte('created_at', monthEnd.toISOString())

          const stamps = monthActivities?.filter(a => a.type === 'points_added').length || 0
          const redemptions = monthActivities?.filter(a => a.type === 'reward_redeemed').length || 0

          monthsData.push({
            month: monthNames[date.getMonth()],
            stamps,
            redemptions
          })
        }

        setChartData(monthsData)

      } catch (error) {
        console.error('Error loading dashboard metrics:', error)
      }
    }

    loadDashboardMetrics()
  }, [currentOrganization, customers])

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (activeSection === 'members') {
      fetchCustomers()
    }
  }, [activeSection])

  useEffect(() => {
    if (activeSection === 'rewards') {
      fetchRewards()
    }
  }, [activeSection])

  // OTTIMIZZAZIONE: Ricerca debounced per performance migliore nella gestione tessere
  useEffect(() => {
    if (searchTerm.trim() === '') {
      // Se non c'è ricerca, mostra tutti i clienti immediatamente
      setFilteredCustomers(customers);
      return;
    }

    // Debounce la ricerca di 200ms per ricerca fluida ma responsive
    const debounceTimeout = setTimeout(() => {
      const lowercasedFilter = searchTerm.toLowerCase().trim();
      const filtered = customers.filter(customer => {
        return (
          customer.name.toLowerCase().includes(lowercasedFilter) ||
          (customer.email && customer.email.toLowerCase().includes(lowercasedFilter)) ||
          (customer.phone && customer.phone.includes(searchTerm)) || // Mantieni ricerca telefono case-sensitive
          customer.id.slice(0, 8).toLowerCase().includes(lowercasedFilter)
        );
      });
      setFilteredCustomers(filtered);
      console.log(`🔍 RICERCA VELOCE "${searchTerm}": ${filtered.length}/${customers.length} clienti trovati`);
    }, 200); // 200ms ottimale per POS

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, customers]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true)

      // Carica organizzazioni reali dal database
      const realOrganizations = await organizationsApi.getAll()

      setOrganizations(realOrganizations)

      // Carica i dettagli specifici della prima organizzazione (quella corrente)
      if (realOrganizations.length > 0) {
        const currentOrgDetails = await organizationsApi.getById(realOrganizations[0].id)
        setCurrentOrganization(currentOrgDetails)

        // Notifica il parent component del cambio organizzazione
        if (onOrganizationChange) {
          onOrganizationChange(currentOrgDetails)
        }

        console.log('✅ Caricati dettagli organizzazione corrente:', currentOrgDetails?.name)
        console.log('📋 Loyalty tiers configurati:', currentOrgDetails?.loyalty_tiers?.length || 0)
        console.log('🎁 Default rewards configurati:', currentOrgDetails?.default_rewards?.length || 0)
        console.log('📂 Product categories configurate:', currentOrgDetails?.product_categories?.length || 0)
      }

      setError(null)

      console.log(`✅ Caricate ${realOrganizations.length} organizzazioni reali dal database`)
    } catch (err) {
      console.error('❌ Errore nel caricamento organizzazioni:', err)
      setError(err instanceof Error ? err.message : 'Errore nel caricamento organizzazioni')
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true)

      // Usa l'organization ID dalla prima organization (in un app reale, dovresti gestire l'organization attiva)
      const organizationId = organizations.length > 0 ? organizations[0].id : 'c06a8dcf-b209-40b1-92a5-c80facf2eb29'

      // Carica clienti reali dal database
      const realCustomers = await customersApi.getAll(organizationId)
      const realStats = await customersApi.getStats(organizationId)

      setCustomers(realCustomers)
      setCustomerStats(realStats)

      console.log(`✅ Caricati ${realCustomers.length} clienti reali per organization ${organizationId}`)
    } catch (err) {
      console.error('❌ Errore nel caricamento clienti dal database:', err)

      // In caso di errore, mostra un messaggio più utile
      if (err instanceof Error) {
        setError(`Errore caricamento clienti: ${err.message}`)
      } else {
        setError('Errore sconosciuto nel caricamento clienti')
      }

      // Fallback con dati vuoti invece che mock
      setCustomers([])
      setCustomerStats({ total: 0, male: 0, female: 0, withNotifications: 0 })
    } finally {
      setCustomersLoading(false)
    }
  }

  const fetchRewards = async () => {
    try {
      setRewardsLoading(true)
      const organizationId = organizations.length > 0 ? organizations[0].id : 'c06a8dcf-b209-40b1-92a5-c80facf2eb29'
      const rewardsData = await rewardsService.getAll(organizationId)
      setRewards(rewardsData)
      console.log(`✅ Caricati ${rewardsData.length} premi per organization ${organizationId}`)
    } catch (err) {
      console.error('❌ Errore nel caricamento premi dal database:', err)
      // In caso di errore, non mostrare errore per i premi (tabella potrebbe non esistere ancora)
      setRewards([])
    } finally {
      setRewardsLoading(false)
    }
  }

  // Reward management functions
  const handleAddReward = () => {
    setSelectedReward(null)
    setShowRewardModal(true)
  }

  const handleEditReward = (reward: Reward) => {
    setSelectedReward(reward)
    setShowRewardModal(true)
  }

  const handleDeleteReward = async (rewardId: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo premio?')) {
      return
    }

    try {
      const organizationId = organizations.length > 0 ? organizations[0].id : 'c06a8dcf-b209-40b1-92a5-c80facf2eb29'
      await rewardsService.delete(rewardId, organizationId)
      console.log('✅ Premio eliminato con successo')
      // Ricarica i premi
      fetchRewards()
    } catch (error) {
      console.error('❌ Errore eliminazione premio:', error)
      if (error instanceof Error) {
        setError(`Errore eliminazione premio: ${error.message}`)
      }
    }
  }

  const handleToggleRewardStatus = async (rewardId: string, isActive: boolean) => {
    try {
      const organizationId = organizations.length > 0 ? organizations[0].id : 'c06a8dcf-b209-40b1-92a5-c80facf2eb29'
      await rewardsService.toggleStatus(rewardId, organizationId, isActive)
      console.log(`✅ Status premio aggiornato: ${isActive ? 'attivo' : 'inattivo'}`)
      // Ricarica i premi
      fetchRewards()
    } catch (error) {
      console.error('❌ Errore aggiornamento status premio:', error)
      if (error instanceof Error) {
        setError(`Errore aggiornamento status: ${error.message}`)
      }
    }
  }

  const handleSaveReward = async (rewardData: any) => {
    try {
      setRewardModalLoading(true)
      const organizationId = organizations.length > 0 ? organizations[0].id : 'c06a8dcf-b209-40b1-92a5-c80facf2eb29'

      if (selectedReward) {
        // Update existing reward
        await rewardsService.update(selectedReward.id, organizationId, rewardData)
        console.log('✅ Premio aggiornato con successo')
      } else {
        // Create new reward
        await rewardsService.create(organizationId, rewardData)
        console.log('✅ Nuovo premio creato con successo')
      }

      setShowRewardModal(false)
      setSelectedReward(null)
      // Ricarica i premi
      fetchRewards()
    } catch (error) {
      console.error('❌ Errore salvataggio premio:', error)
      if (error instanceof Error) {
        setError(`Errore salvataggio premio: ${error.message}`)
      }
    } finally {
      setRewardModalLoading(false)
    }
  }

  const handleQRScan = () => {
    console.log('📱 handleQRScan chiamato, stato attuale:', qrStatus);

    if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
      const bridge = (window as any).OmnilyPOS;

      // Se è già in lettura, annulla lo scanner
      if (qrStatus === 'reading') {
        console.log('📱 Annullando scanner QR...');
        if (bridge.cancelQRScanner) {
          bridge.cancelQRScanner();
        }
        setQrStatus('idle');
        setQrResult(null);
        return;
      }

      // Altrimenti avvia lo scanner
      if (bridge.readQRCode) {
        setQrStatus('reading');
        console.log('📱 Chiamando bridge.readQRCode');
        bridge.readQRCode('omnilyQRResultHandler');
      } else {
        console.log('❌ readQRCode non disponibile nel bridge');
        showModal({
          title: 'Scanner QR Non Disponibile',
          message: 'Scanner QR non disponibile. Funzionalità non ancora implementata nel dispositivo.',
          type: 'warning'
        });
      }
    } else {
      console.log('❌ Bridge Android non disponibile');
      showModal({
        title: 'Bridge Non Disponibile',
        message: 'Bridge Android non disponibile. Usa solo da dispositivo POS.',
        type: 'danger'
      });
    }
  };

  // Hardware monitoring functions
  const checkHardwareStatus = async () => {
    const timestamp = new Date().toLocaleTimeString();
    addMatrixLog(`🔍 Avvio verifica hardware... [${timestamp}]`);
    addMatrixLog(`🌐 Window object available: ${typeof window !== 'undefined'}`);
    addMatrixLog(`📱 POS Mode: ${isPOSMode}`);

    // First try to use injected hardware data from Android
    if (typeof window !== 'undefined' && (window as any).__OMNILY_HARDWARE_DATA__) {
      const injectedData = (window as any).__OMNILY_HARDWARE_DATA__;
      addMatrixLog(`🚀 Using injected hardware data from Android (${injectedData.timestamp})`);

      try {
        const hardwareInfo = typeof injectedData.hardware === 'string'
          ? JSON.parse(injectedData.hardware)
          : injectedData.hardware;

        addMatrixLog('✅ Parsing injected hardware data...');
        addMatrixLog(`📦 Injected hardware keys: ${Object.keys(hardwareInfo).join(', ')}`);

        // Update all hardware status from injected data
        if (hardwareInfo.bridge) {
          setHardwareStatus(prev => ({
            ...prev,
            bridge: {
              status: 'connected',
              message: `Bridge Android v${hardwareInfo.bridge.version || 'N/A'}`,
              version: hardwareInfo.bridge.version
            }
          }));
          addMatrixLog(`🔧 Bridge: ${hardwareInfo.bridge.version || 'N/A'}`);
        }

        // Update system info from injected data
        if (hardwareInfo.system) {
          addMatrixLog(`📱 Injected system: manufacturer=${hardwareInfo.system.manufacturer}, model=${hardwareInfo.system.model}, android=${hardwareInfo.system.android_version}`);
          setHardwareStatus(prev => ({
            ...prev,
            system: {
              manufacturer: hardwareInfo.system.manufacturer,
              model: hardwareInfo.system.model,
              androidVersion: hardwareInfo.system.android_version,
              sdkVersion: hardwareInfo.system.sdk_version
            }
          }));
          addMatrixLog(`✅ System saved from injected data`);
        } else {
          addMatrixLog(`⚠️ No system data in injected hardware info`);
        }
        
        if (hardwareInfo.network) {
          setHardwareStatus(prev => ({
            ...prev,
            network: {
              status: hardwareInfo.network.connected !== false ? 'online' : 'offline',
              ip: hardwareInfo.network.ip || 'Non disponibile',
              type: hardwareInfo.network.type || 'Non specificato'
            }
          }));
          addMatrixLog(`📡 Network: ${hardwareInfo.network.ip} (${hardwareInfo.network.type})`);
        }
        
        if (hardwareInfo.printer) {
          setHardwareStatus(prev => ({
            ...prev,
            printer: {
              status: hardwareInfo.printer.available ? 'ready' : 'error',
              message: hardwareInfo.printer.message || 'Status da Android',
              model: hardwareInfo.printer.model
            }
          }));
          addMatrixLog(`🖨️ Printer: ${hardwareInfo.printer.message || 'Available'}`);
        }
        
        if (hardwareInfo.nfc) {
          setHardwareStatus(prev => ({
            ...prev,
            nfc: {
              status: hardwareInfo.nfc.available ? 'available' : 'unavailable',
              message: hardwareInfo.nfc.message || 'Status da Android'
            }
          }));
          addMatrixLog(`📱 NFC: ${hardwareInfo.nfc.message || 'Status checked'}`);
        }
        
        if (hardwareInfo.emv) {
          setHardwareStatus(prev => ({
            ...prev,
            emv: {
              status: hardwareInfo.emv.available ? 'available' : 'unavailable',
              message: hardwareInfo.emv.message || 'Status da Android'
            }
          }));
          addMatrixLog(`💳 EMV: ${hardwareInfo.emv.message || 'Status checked'}`);
        }
        
        addMatrixLog('✅ Hardware status aggiornato da dati Android iniettati');
        return; // Exit early - we got the data from Android injection
        
      } catch (error) {
        addMatrixLog(`❌ Errore parsing dati Android: ${error}`);
        console.error('Error parsing injected hardware data:', error);
      }
    }

    // Fallback to bridge detection if no injected data
    if (typeof window !== 'undefined') {
      addMatrixLog(`🔍 Window.OmnilyPOS exists: ${!!(window as any).OmnilyPOS}`);
      
      // List all available window properties related to bridge
      const windowKeys = Object.keys(window).filter(key => 
        key.toLowerCase().includes('omnily') || 
        key.toLowerCase().includes('bridge') ||
        key.toLowerCase().includes('pos')
      );
      addMatrixLog(`🔍 Window keys with omnily/bridge/pos: [${windowKeys.join(', ')}]`);
    }

    // Wait a bit for bridge to be fully ready
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check Bridge Android
    if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
      const bridge = (window as any).OmnilyPOS;
      addMatrixLog('✅ Bridge Android trovato');

      try {
        // Get app version (try multiple methods)
        let appVersion = 'N/A';

        // Try getAppVersion() first
        if (bridge.getAppVersion) {
          appVersion = bridge.getAppVersion();
          addMatrixLog(`📱 App version (getAppVersion): ${appVersion}`);
        }
        // Try getSystemInfo for app_version
        else if (bridge.getSystemInfo) {
          try {
            const systemInfo = bridge.getSystemInfo();
            const info = typeof systemInfo === 'string' ? JSON.parse(systemInfo) : systemInfo;
            if (info.app_version) {
              appVersion = info.app_version;
              addMatrixLog(`📱 App version (from systemInfo): ${appVersion}`);
            }
          } catch (e) {
            // Ignore, will try next method
          }
        }
        // Fallback to bridge version if no app version found
        if (appVersion === 'N/A' && bridge.getBridgeVersion) {
          appVersion = bridge.getBridgeVersion();
          addMatrixLog(`🔧 Using bridge version as fallback: ${appVersion}`);
        }

        setHardwareStatus(prev => ({
          ...prev,
          bridge: {
            status: 'connected',
            message: `Omnily POS App v${appVersion}`,
            version: appVersion
          }
        }));

        // Get comprehensive hardware info - NEW APPROACH
        if (bridge.getHardwareInfo) {
          try {
            addMatrixLog('📊 Chiamata getHardwareInfo...');
            const hardwareInfo = bridge.getHardwareInfo();
            const info = typeof hardwareInfo === 'string' ? JSON.parse(hardwareInfo) : hardwareInfo;

            addMatrixLog('✅ Info hardware ricevute dal bridge');

            // Update network status
            if (info.network) {
              setHardwareStatus(prev => ({
                ...prev,
                network: {
                  status: info.network.connected !== false ? 'online' : 'offline',
                  ip: info.network.ip || 'Non disponibile',
                  type: info.network.type || 'Non specificato'
                }
              }));
              addMatrixLog(`📡 Network: ${info.network.ip} (${info.network.type})`);
            } else {
              // Try separate getNetworkInfo if network not in hardware info
              if (bridge.getNetworkInfo) {
                try {
                  addMatrixLog('📡 Chiamata getNetworkInfo separata...');
                  const networkInfo = bridge.getNetworkInfo();
                  const netInfo = typeof networkInfo === 'string' ? JSON.parse(networkInfo) : networkInfo;
                  
                  setHardwareStatus(prev => ({
                    ...prev,
                    network: {
                      status: netInfo.connected !== false ? 'online' : 'offline',
                      ip: netInfo.ip || 'Non disponibile',
                      type: netInfo.type || 'Non specificato'
                    }
                  }));
                  addMatrixLog(`📡 Network (separata): ${netInfo.ip} (${netInfo.type})`);
                } catch (error) {
                  console.error('❌ Error getting network info:', error);
                  addMatrixLog(`❌ Errore getNetworkInfo: ${error}`);
                }
              }
            }

            // Update printer status
            if (info.printer) {
              setHardwareStatus(prev => ({
                ...prev,
                printer: {
                  status: info.printer.status || 'checking',
                  message: info.printer.message || 'Verifica in corso...',
                  model: info.printer.model || info.printer.name || info.printer.deviceName
                }
              }));
              addMatrixLog(`🖨️ Printer: ${info.printer.status} - ${info.printer.message}${info.printer.model ? ` (${info.printer.model})` : ''}`);
            }

            // Update NFC status
            if (info.nfc) {
              setHardwareStatus(prev => ({
                ...prev,
                nfc: {
                  status: info.nfc.status || 'checking',
                  message: info.nfc.message || 'Verifica in corso...'
                }
              }));
              addMatrixLog(`📱 NFC: ${info.nfc.status} - ${info.nfc.message}`);
            }

            // Update EMV status
            if (info.emv) {
              setHardwareStatus(prev => ({
                ...prev,
                emv: {
                  status: info.emv.status || 'checking',
                  message: info.emv.message || 'Verifica in corso...'
                }
              }));
              addMatrixLog(`💳 EMV: ${info.emv.status} - ${info.emv.message}`);
            }

          } catch (error) {
            console.error('❌ Error parsing hardware info:', error);
            addMatrixLog(`❌ Errore parsing hardware: ${error}`);
          }
        }

        // Get system info for the info tab
        if (bridge.getSystemInfo) {
          try {
            const systemInfo = bridge.getSystemInfo();
            const info = typeof systemInfo === 'string' ? JSON.parse(systemInfo) : systemInfo;

            addMatrixLog(`📱 Sistema: ${info.manufacturer} ${info.model}`);
            addMatrixLog(`🤖 Android: ${info.android_version} (SDK ${info.sdk_version})`);

            // Store system info for display in the info section
            setHardwareStatus(prev => ({
              ...prev,
              system: {
                manufacturer: info.manufacturer,
                model: info.model,
                androidVersion: info.android_version,
                sdkVersion: info.sdk_version
              }
            }));

            if (info.model && info.manufacturer) {
              addMatrixLog(`🏷️ POS Model: ${info.manufacturer} ${info.model}`);
            }

          } catch (error) {
            console.error('❌ Error parsing system info:', error);
            addMatrixLog(`❌ Errore parsing system: ${error}`);

            // FALLBACK: Use User Agent if getSystemInfo fails
            const userAgent = navigator.userAgent;
            const androidMatch = userAgent.match(/Android\s+([\d.]+)/);
            const deviceMatch = userAgent.match(/Android\s+[\d.]+;\s*([^;)]+?)(?:\s+Build\/|\))/);

            if (androidMatch || deviceMatch) {
              const androidVersion = androidMatch ? androidMatch[1] : undefined;
              let deviceName = deviceMatch ? deviceMatch[1].trim() : undefined;

              let manufacturer = undefined;
              let model = undefined;
              if (deviceName) {
                const parts = deviceName.split(/\s+/);
                if (parts.length > 1) {
                  manufacturer = parts[0];
                  model = parts.slice(1).join(' ');
                } else {
                  model = deviceName;
                }
              }

              setHardwareStatus(prev => ({
                ...prev,
                system: {
                  manufacturer: manufacturer,
                  model: model,
                  androidVersion: androidVersion,
                  sdkVersion: undefined
                }
              }));
            }
          }
        } else {
          // Fallback: usa metodi esistenti se getHardwareInfo/getSystemInfo non esistono
          addMatrixLog('⚠️ Metodi getHardwareInfo/getSystemInfo non disponibili - uso fallback');

          // Extract system info from User Agent as fallback
          const userAgent = navigator.userAgent;
          addMatrixLog(`📱 User Agent: ${userAgent}`);

          // Parse User Agent for Android device info
          // Example formats:
          // "Mozilla/5.0 (Linux; Android 7.1; Sunmi V2 Pro)"
          // "Mozilla/5.0 (Linux; Android 14; T4SMODELX Build/UP1A.231005.007; wv)"
          const androidMatch = userAgent.match(/Android\s+([\d.]+)/);

          // Match device name between "Android X.X;" and "Build/" or ")"
          const deviceMatch = userAgent.match(/Android\s+[\d.]+;\s*([^;)]+?)(?:\s+Build\/|\))/);

          if (androidMatch || deviceMatch) {
            const androidVersion = androidMatch ? androidMatch[1] : undefined;
            let deviceName = deviceMatch ? deviceMatch[1].trim() : undefined;

            // Try to split manufacturer and model
            let manufacturer = undefined;
            let model = undefined;
            if (deviceName) {
              const parts = deviceName.split(/\s+/);
              if (parts.length > 1) {
                manufacturer = parts[0];
                model = parts.slice(1).join(' ');
              } else {
                // Single word - use as model
                model = deviceName;
              }
            }

            setHardwareStatus(prev => ({
              ...prev,
              system: {
                manufacturer: manufacturer,
                model: model,
                androidVersion: androidVersion,
                sdkVersion: undefined
              }
            }));
          }

          // Check hardware usando metodi singoli
          if (bridge.readNFCCard) {
            setHardwareStatus(prev => ({
              ...prev,
              nfc: { status: 'available', message: 'Lettore NFC disponibile' }
            }));
            addMatrixLog('📱 NFC: Disponibile (fallback)');
          } else {
            addMatrixLog('📱 NFC: Non disponibile (fallback)');
          }

          if (bridge.testPrinter || bridge.printReceipt) {
            setHardwareStatus(prev => ({
              ...prev,
              printer: { status: 'ready', message: 'Stampante disponibile', model: undefined }
            }));
            addMatrixLog('🖨️ Printer: Disponibile (fallback)');
          } else {
            addMatrixLog('🖨️ Printer: Non disponibile (fallback)');
          }

          if (bridge.inputAmount || bridge.inputAmountAsync) {
            setHardwareStatus(prev => ({
              ...prev,
              emv: { status: 'available', message: 'Terminale pagamenti disponibile' }
            }));
            addMatrixLog('💳 EMV: Disponibile (fallback)');
          } else {
            addMatrixLog('💳 EMV: Non disponibile (fallback)');
          }
        }

        // Legacy fallback per APK vecchie senza getHardwareInfo
        if (!bridge.getHardwareInfo && bridge.getNetworkInfo) {
          try {
            addMatrixLog('📡 Legacy fallback: richiesta info network...');
            const networkInfo = bridge.getNetworkInfo();
            const info = typeof networkInfo === 'string' ? JSON.parse(networkInfo) : networkInfo;
            
            setHardwareStatus(prev => ({
              ...prev,
              network: {
                status: info.connected !== false ? 'online' : 'offline',
                ip: info.ip || 'Non disponibile',
                type: info.type || 'Non specificato'
              }
            }));
            addMatrixLog(`✅ Network legacy: ${info.ip} (${info.type})`);
          } catch (error) {
            console.error('❌ Error getting network info:', error);
            addMatrixLog(`❌ Errore network legacy: ${error}`);
            setHardwareStatus(prev => ({
              ...prev,
              network: { status: 'offline', ip: 'Errore', type: 'Errore' }
            }));
          }
        }

      } catch (error) {
        console.error('❌ Bridge error:', error);
        addMatrixLog(`❌ Errore bridge generale: ${error}`);
        setHardwareStatus(prev => ({
          ...prev,
          bridge: { status: 'disconnected', message: 'Errore comunicazione bridge', version: undefined }
        }));
      }
    } else {
      // Bridge not available
      addMatrixLog('❌ Bridge OmnilyPOS non trovato in window object');
      
      // Se siamo in modalità sviluppo o test, mostra dati di esempio
      if (isPOSMode || window.location.hostname === 'localhost' || window.location.hostname.includes('vercel')) {
        addMatrixLog('🧪 Modalità TEST: Caricamento dati hardware simulati...');
        
        setHardwareStatus({
          bridge: { status: 'disconnected', message: 'Bridge Android non disponibile (Modalità TEST)', version: undefined },
          system: {
            manufacturer: 'Test Device',
            model: 'Simulator',
            androidVersion: '13.0',
            sdkVersion: '33'
          },
          printer: { status: 'error', message: 'Simulazione - Non connessa', model: 'Test Printer' },
          nfc: { status: 'unavailable', message: 'Simulazione - Non disponibile' },
          network: { status: 'online', ip: '192.168.1.100', type: 'WiFi (Simulato)' },
          emv: { status: 'unavailable', message: 'Simulazione - Non disponibile' }
        });
        
        addMatrixLog('📱 TEST: Bridge status simulato caricato');
        addMatrixLog('📡 TEST: Network status simulato (192.168.1.100)');
        addMatrixLog('🖨️ TEST: Printer status simulato (errore)');
        addMatrixLog('📱 TEST: NFC status simulato (non disponibile)');
        addMatrixLog('💳 TEST: EMV status simulato (non disponibile)');
        
      } else {
        // Produzione senza bridge
        setHardwareStatus({
          bridge: { status: 'disconnected', message: 'Bridge Android non disponibile', version: undefined },
          system: {
            manufacturer: undefined,
            model: undefined,
            androidVersion: undefined,
            sdkVersion: undefined
          },
          printer: { status: 'offline', message: 'Non disponibile', model: undefined },
          nfc: { status: 'unavailable', message: 'Non disponibile' },
          network: { status: 'offline', ip: '', type: '' },
          emv: { status: 'unavailable', message: 'Non disponibile' }
        });
        
        addMatrixLog('🚫 PROD: Hardware non disponibile - serve dispositivo POS');
      }
    }

    // Log completion senza popup fastidiosi
    addMatrixLog('✅ Check hardware completato - risultati disponibili nei tab');
  };

  const testPrinter = () => {
    if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
      const bridge = (window as any).OmnilyPOS;
      if (bridge.testPrinter) {
        bridge.testPrinter();
        showModal({
          title: 'Test Stampante',
          message: 'Test stampante inviato. Controlla la stampa.',
          type: 'info'
        });
      } else {
        showModal({
          title: 'Stampante Non Disponibile',
          message: 'Funzione test stampante non disponibile nel bridge.',
          type: 'warning'
        });
      }
    } else {
      showModal({
        title: 'Bridge Non Disponibile',
        message: 'Bridge Android non disponibile.',
        type: 'danger'
      });
    }
  };

  const testNFC = () => {
    if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
      const bridge = (window as any).OmnilyPOS;
      if (bridge.readNFCCard) {
        showModal({
          title: 'Test Lettore NFC',
          message: 'Avvicina una tessera NFC al lettore...',
          type: 'info',
          onConfirm: () => {
            setShowConfirmModal(false);
            handleNFCRead();
          }
        });
      } else {
        showModal({
          title: 'Lettore NFC Non Disponibile',
          message: 'Lettore NFC non disponibile nel bridge.',
          type: 'warning'
        });
      }
    } else {
      showModal({
        title: 'Bridge Non Disponibile',
        message: 'Bridge Android non disponibile.',
        type: 'danger'
      });
    }
  };

  // Check hardware status when entering pos-integration section
  useEffect(() => {
    if (activeSection === 'pos-integration') {
      checkHardwareStatus();
    }
  }, [activeSection]);

  // Auto-trigger hardware check in POS mode
  useEffect(() => {
    if (isPOSMode && activeSection === 'pos-integration') {
      // Listen for Android hardware data injection
      const handleHardwareReady = (event: any) => {
        addMatrixLog('📡 Event: Android hardware data received');
        // Trigger hardware status check to process the data
        checkHardwareStatus();
      };

      // Add event listener for Android injection
      if (typeof window !== 'undefined') {
        window.addEventListener('omnily-hardware-ready', handleHardwareReady);
      }

      // Immediate check
      checkHardwareStatus();

      // Delayed check to ensure bridge is ready
      const delayedCheck = setTimeout(() => {
        checkHardwareStatus();
      }, 1000);

      // Periodic check every 5 seconds
      const periodicCheck = setInterval(() => {
        checkHardwareStatus();
      }, 5000);

      return () => {
        clearTimeout(delayedCheck);
        clearInterval(periodicCheck);
        if (typeof window !== 'undefined') {
          window.removeEventListener('omnily-hardware-ready', handleHardwareReady);
        }
      };
    }
  }, [isPOSMode, activeSection]);

  // Initialize Print Service for POS
  useEffect(() => {
    console.log('🔍 Print Service Init Check:', {
      isPOSMode,
      hasOrganization: !!currentOrganization,
      orgName: currentOrganization?.name,
      hasPrintService: !!printService
    });

    if (isPOSMode && currentOrganization && !printService) {
      console.log('🔧 Initializing print service for Gift Certificates...');
      const newPrintService = new ZCSPrintService({
        storeName: currentOrganization.name,
        storeAddress: currentOrganization.address || '',
        storePhone: currentOrganization.phone || '',
        storeTax: currentOrganization.partita_iva || '',
        paperWidth: 384,
        fontSizeNormal: 24,
        fontSizeLarge: 32,
        printDensity: 3
      });

      newPrintService.initialize().then(success => {
        if (success) {
          console.log('✅ Print service initialized for Gift Certificates');
          setPrintService(newPrintService);
        } else {
          console.error('❌ Failed to initialize print service');
        }
      });
    } else {
      console.log('⚠️ Print service NOT initialized - conditions not met');
    }
  }, [isPOSMode, currentOrganization, printService]);

  // Intercept ALL console logs when in pos-integration section AND monitor is enabled
  useEffect(() => {
    if (activeSection !== 'pos-integration' || !monitorEnabled) return;

    // Anti-recursion flag
    let isLogging = false;

    // Save original console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    // Override console.log
    console.log = (...args: any[]) => {
      originalLog(...args); // Keep original behavior
      if (!isLogging) {
        isLogging = true;
        try {
          const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
          // Skip CLEANUP logs to prevent infinite loops
          if (!message.includes('🧹 CLEANUP')) {
            addMatrixLog(`[LOG] ${message}`);
          }
        } finally {
          isLogging = false;
        }
      }
    };

    // Override console.error
    console.error = (...args: any[]) => {
      originalError(...args);
      if (!isLogging) {
        isLogging = true;
        try {
          const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
          addMatrixLog(`[ERROR] ${message}`);
        } finally {
          isLogging = false;
        }
      }
    };

    // Override console.warn
    console.warn = (...args: any[]) => {
      originalWarn(...args);
      if (!isLogging) {
        isLogging = true;
        try {
          const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
          addMatrixLog(`[WARN] ${message}`);
        } finally {
          isLogging = false;
        }
      }
    };

    // Override console.info
    console.info = (...args: any[]) => {
      originalInfo(...args);
      if (!isLogging) {
        isLogging = true;
        try {
          const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
          addMatrixLog(`[INFO] ${message}`);
        } finally {
          isLogging = false;
        }
      }
    };

    // Restore original console methods when leaving section or unmounting
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
    };
  }, [activeSection, monitorEnabled]); // Re-run when monitor is toggled

  // Function to check if user can access a section
  const checkSectionAccess = (sectionId: string, featureName: string) => {
    const userPlan = currentOrganization?.plan_type || 'free'
    const featureMap: Record<string, keyof typeof import('../utils/planPermissions').PLAN_FEATURES[keyof typeof import('../utils/planPermissions').PLAN_FEATURES]> = {
      'loyalty-tiers': 'loyaltyTiers',
      'rewards': 'rewards',
      'categories': 'categories',
      'marketing-campaigns': 'marketingCampaigns',
      'team-management': 'teamManagement',
      'notifications': 'notifications',
      'analytics-reports': 'analyticsReports',
      'branding-social': 'brandingSocial',
      'channels': 'channelsIntegration'
    }

    const feature = featureMap[sectionId]
    if (!feature) return true // Always allow access to core sections

    if (!hasAccess(userPlan, feature)) {
      const upgradePlan = getUpgradePlan(userPlan, feature)
      if (upgradePlan) {
        setUpgradeFeature(featureName)
        setRequiredPlan(upgradePlan)
        setShowUpgradePrompt(true)
      }
      return false
    }
    return true
  }

  // Handle section change with access control
  const handleRestrictedSectionChange = (sectionId: string, featureName: string) => {
    if (checkSectionAccess(sectionId, featureName)) {
      handleSectionChange(sectionId)
    }
  }

  // Get filtered sidebar items based on plan
  const getFilteredSidebarItems = () => {
    const userPlan = currentOrganization?.plan_type || 'free'

    const allItems = [
      { id: 'dashboard', icon: BarChart3, label: 'Dashboard', feature: null },
      { id: 'stamps', icon: Target, label: 'Tessere Punti', feature: null },
      { id: 'members', icon: Users, label: 'Clienti', feature: null },
      { id: 'loyalty-tiers', icon: Star, label: 'Livelli Fedeltà', feature: 'loyaltyTiers' },
      { id: 'rewards', icon: Award, label: 'Premi', feature: 'rewards' },
      { id: 'gift-certificates', icon: CreditCard, label: 'Gift Certificates', feature: null },
      { id: 'email-automations', icon: Mail, label: 'Email Automations', feature: 'emailAutomations' },
      { id: 'subscriptions', icon: Package, label: 'Membership', feature: null },
      { id: 'categories', icon: Package, label: 'Categorie', feature: 'categories' },
      { id: 'marketing-campaigns', icon: Mail, label: 'Campagne Marketing', feature: 'marketingCampaigns' },
      { id: 'team-management', icon: UserPlus, label: 'Gestione Team', feature: 'teamManagement' },
      { id: 'pos-integration', icon: Zap, label: 'Integrazione POS', feature: 'posIntegration' },
      { id: 'notifications', icon: Bell, label: 'Notifiche', feature: 'notifications' },
      { id: 'analytics-reports', icon: TrendingUp, label: 'Analytics & Report', feature: 'analyticsReports' },
      { id: 'branding-social', icon: Palette, label: 'Branding & Social', feature: 'brandingSocial' },
      { id: 'website-editor', icon: Globe, label: 'Il Mio Sito Web', feature: null },
      { id: 'channels', icon: Globe, label: 'Canali Integrazione', feature: 'channelsIntegration' },
      { id: 'communications', icon: Gift, label: 'Comunicazioni', feature: null },
      { id: 'settings', icon: Settings, label: 'Impostazioni', feature: null },
      { id: 'support', icon: HelpCircle, label: 'Aiuto & Supporto', feature: null }
    ]

    return allItems.map(item => ({
      ...item,
      locked: item.feature ? !hasAccess(userPlan, item.feature as any) : false
    }))
  }

  const sidebarItems = getFilteredSidebarItems()

  const renderContent = () => {
    switch (activeSection) {
      case 'stamps':
        return currentOrganization ? (
          <div className="dashboard-content" style={{ height: 'calc(100vh - 140px)', overflowY: 'auto', padding: '2rem' }}>
            <CardManagementHub
              organizationId={currentOrganization.id}
              primaryColor={currentOrganization.primary_color}
              secondaryColor={currentOrganization.secondary_color}
              onOpenManagement={() => setShowCardManagementPanel(true)}
            />
          </div>
        ) : null
      
      case 'members':
        return (
          <div
            className="dashboard-content full-width"
            style={isPOSMode ? { padding: 0, margin: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' } : {}}
          >
            {/* Complete Customer List Section */}
            <div
              className="customer-list-container"
              style={isPOSMode ? { padding: 0, margin: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' } : {}}
            >
              {/* Header */}
              <div className="customer-list-header">
                <div className="header-left">
                  <div className="header-icon">
                    <Users size={24} />
                  </div>
                  <div className="header-content">
                    <h2>LISTA COMPLETA CLIENTI</h2>
                    <p>Visualizza, cerca e gestisci tutti i clienti registrati.</p>
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="customer-stats-row">
                <div className="customer-stat-card total">
                  <div className="stat-icon">
                    <Users size={20} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-number">{customerStats.total}</div>
                    <div className="stat-label">CLIENTI TOTALI</div>
                  </div>
                </div>
                
                <div className="customer-stat-card male">
                  <div className="stat-icon">
                    <Users size={20} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-number">{customerStats.male}</div>
                    <div className="stat-label">MASCHI</div>
                  </div>
                </div>
                
                <div className="customer-stat-card female">
                  <div className="stat-icon">
                    <Users size={20} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-number">{customerStats.female}</div>
                    <div className="stat-label">FEMMINE</div>
                  </div>
                </div>
                
                <div className="customer-stat-card notifications">
                  <div className="stat-icon">
                    <Target size={20} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-number">{customerStats.withNotifications}</div>
                    <div className="stat-label">CON NOTIFICHE</div>
                  </div>
                </div>
              </div>

              {/* Customer Table Controls */}
              <div className="customer-table-controls">
                <div className="search-bar">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Cerca cliente per nome, email, o ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoComplete="off"
                    name="customer-search-query"
                    form="customer-search-form"
                    data-form="customer-search"
                    spellCheck="false"
                  />
                </div>
                <div className="table-actions">
                  <button
                    className={`btn-secondary qr-button ${qrStatus}`}
                    onClick={handleQRScan}
                  >
                    <QrCode size={16} />
                    <span>
                      {qrStatus === 'reading' && 'Annulla QR'}
                      {qrStatus === 'idle' && 'Scansiona QR'}
                      {qrStatus === 'success' && 'Scansiona di Nuovo'}
                      {qrStatus === 'error' && 'Riprova QR'}
                    </span>
                  </button>
                  {qrResult && (
                    <div className="qr-result">
                      {qrResult.success ? (
                        `QR Letto: ${qrResult.data || 'OK'}`
                      ) : (
                        `Errore QR: ${qrResult.error}`
                      )}
                    </div>
                  )}
                  <button 
                    className={`btn-secondary nfc-button ${nfcStatus}`}
                    onClick={handleNFCRead}
                  >
                    {nfcStatus === 'reading' && <StopCircle size={16} />}
                    {nfcStatus === 'idle' && <CreditCard size={16} />}
                    {nfcStatus === 'success' && <CheckCircle2 size={16} />}
                    {nfcStatus === 'error' && <XCircle size={16} />}
                    <span>
                      {nfcStatus === 'reading' && 'Annulla Lettura'}
                      {nfcStatus === 'idle' && 'Leggi Tessera'}
                      {nfcStatus === 'success' && 'Leggi di Nuovo'}
                      {nfcStatus === 'error' && 'Riprova Lettura'}
                    </span>
                  </button>
                  {nfcResult && (
                    <div className="nfc-result">
                      {nfcResult.success ? (
                        `Tessera Letta: ${nfcResult.cardNo}`
                      ) : (
                        `Errore: ${nfcResult.error}`
                      )}
                    </div>
                  )}
                  <button 
                    className="btn-primary"
                    onClick={() => setShowRegistrationWizard(true)}
                  >
                    <Users size={16} />
                    <span>Nuovo Cliente</span>
                  </button>
                </div>
              </div>

              {/* Customer Table */}
              <div className="customer-table-wrapper">
                <table className="customer-table-new">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Contatti</th>
                      <th>Punti</th>
                      <th>Livello</th>
                      <th>Stato</th>
                      <th>Registrato</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customersLoading ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                          <div className="loading-bar-container">
                            <div className="loading-bar-label">Caricamento clienti...</div>
                            <div className="loading-bar-track">
                              <div className="loading-bar-fill"></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                          <div>Nessun cliente trovato per "{searchTerm}"</div>
                        </td>
                      </tr>
                    ) : filteredCustomers.map((customer, _index) => (
                      <tr
                        key={customer.id}
                        onClick={() => handleCustomerClick(customer)}
                        style={{ cursor: 'pointer' }}
                        className="customer-row-clickable"
                      >
                        <td>
                          <div className="customer-cell">
                            <div className={`customer-avatar-new ${customer.gender || 'male'}`}>
                              <Users size={16} />
                            </div>
                            <div className="customer-info-new">
                              <div className="customer-name-new">{customer.name}</div>
                              <div className="customer-id">#{customer.id.slice(0, 8)}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="contact-cell">
                            {customer.email && (
                              <div className="contact-item">
                                <span>📧</span>
                                <span>{customer.email}</span>
                              </div>
                            )}
                            {customer.phone && (
                              <div className="contact-item">
                                <span>📱</span>
                                <span>{customer.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="points-cell">
                            <Target size={16} color="#ef4444" />
                            <span>{customer.points}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`level-badge ${customer.tier.toLowerCase()}`}>
                            {customer.tier}
                          </span>
                        </td>
                        <td>
                          <span className={customer.is_active ? "status-active" : "status-inactive"}>
                            {customer.is_active ? <><CheckCircle2 size={14} /> ATTIVO</> : <><XCircle size={14} /> INATTIVO</>}
                          </span>
                        </td>
                        <td>{new Date(customer.created_at).toLocaleDateString('it-IT')}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="action-btn-blue">
                              <Target size={14} />
                            </button>
                            <button className="action-btn-black">
                              <Users size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Professional Registration Wizard */}
            <RegistrationWizard
              isOpen={showRegistrationWizard}
              onClose={() => setShowRegistrationWizard(false)}
              organizationId={organizations.length > 0 ? organizations[0].id : 'c06a8dcf-b209-40b1-92a5-c80facf2eb29'}
              onCustomerCreated={fetchCustomers}
            />
          </div>
        )

      case 'loyalty-tiers':
        return currentOrganization ? (
          <div className="dashboard-content" style={{ height: 'calc(100vh - 140px)', overflowY: 'auto', padding: '2rem' }}>
            <LoyaltyTiersDisplay
              tiers={currentOrganization.loyalty_tiers || []}
              primaryColor={currentOrganization.primary_color || '#dc2626'}
              onEdit={() => setShowLoyaltyTiersPanel(true)}
            />
          </div>
        ) : null

      case 'rewards':
        return (
          <div className="section-content">
            <div className="section-header">
              <Award size={24} />
              <h2>Gestione Premi</h2>
              <p>Crea e gestisci i premi del sistema di fedeltà</p>
            </div>

            <div className="rewards-management">
              <div className="management-header">
                <button className="btn-primary" onClick={handleAddReward}>
                  <Plus size={16} />
                  Aggiungi Premio
                </button>
              </div>

              {rewardsLoading ? (
                <div className="loading-bar-container" style={{ padding: '3rem 0' }}>
                  <div className="loading-bar-label">Caricamento premi...</div>
                  <div className="loading-bar-track">
                    <div className="loading-bar-fill"></div>
                  </div>
                </div>
              ) : rewards.length > 0 ? (
                <div className="cards-grid">
                  {rewards.map((reward) => (
                    <div key={reward.id} className="feature-card reward-card enhanced">
                      {/* Immagine Premio */}
                      <div className="reward-image">
                        {reward.image_url ? (
                          <img src={reward.image_url} alt={reward.name} />
                        ) : (
                          <div className="reward-placeholder">
                            <Award size={32} />
                          </div>
                        )}
                      </div>

                      <div className="reward-content">
                        <div className="reward-header">
                          <h3>{reward.name}</h3>
                          <div className="reward-actions">
                            <button
                              className="btn-edit"
                              title="Modifica"
                              onClick={() => handleEditReward(reward)}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="btn-delete"
                              title="Elimina"
                              onClick={() => handleDeleteReward(reward.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="reward-details">
                          <div className="reward-points">
                            <Target size={16} />
                            <strong>{reward.points_required} {(currentOrganization?.points_name || 'Punti').toLowerCase()}</strong>
                          </div>
                          {reward.required_tier && (
                            <div className="reward-tier">
                              <Star size={16} />
                              <strong>Livello:</strong> {reward.required_tier}
                            </div>
                          )}
                          <div className="reward-type">
                            <strong>Tipo:</strong> {reward.type}
                          </div>
                          <div className="reward-value">
                            <strong>Valore:</strong> {reward.value}
                          </div>
                          {reward.description && (
                            <div className="reward-description">
                              {reward.description}
                            </div>
                          )}
                          {reward.stock_quantity && (
                            <div className="reward-stock">
                              <strong>Stock:</strong> {reward.stock_quantity}
                            </div>
                          )}
                        </div>

                        <div className="reward-status">
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={reward.is_active}
                              onChange={(e) => handleToggleRewardStatus(reward.id, e.target.checked)}
                            />
                            <span className="slider"></span>
                          </label>
                          <span className="status-label">
                            {reward.is_active ? 'Attivo' : 'Disattivo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Award size={48} />
                  <h3>Nessun premio configurato</h3>
                  <p>Inizia creando il tuo primo premio per il sistema di fedeltà.</p>
                  <button className="btn-primary" onClick={handleAddReward}>
                    <Plus size={16} />
                    Crea Primo Premio
                  </button>
                </div>
              )}
            </div>
          </div>
        )

      case 'categories':
        return (
          <div className="section-content">
            <div className="section-header">
              <Package size={24} />
              <h2>Categorie Prodotti</h2>
              <p>Gestisci le categorie prodotti configurate nel wizard</p>
            </div>

            {currentOrganization?.product_categories && Array.isArray(currentOrganization.product_categories) && currentOrganization.product_categories.length > 0 ? (
              <div className="cards-grid">
                {currentOrganization.product_categories.map((category: any, index: number) => {
                  // Gestisce sia stringhe che oggetti
                  const categoryName = typeof category === 'string' ? category : category.name
                  const categoryDescription = typeof category === 'object' ? category.description : null
                  const categoryColor = typeof category === 'object' ? category.color : '#3b82f6'

                  return (
                    <div key={index} className="feature-card category-card">
                      <div className="category-header" style={{ borderColor: categoryColor }}>
                        <Package size={20} style={{ color: categoryColor }} />
                        <h3>{categoryName}</h3>
                      </div>
                      {categoryDescription && (
                        <div className="category-description">
                          {categoryDescription}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state">
                <Package size={48} />
                <h3>Nessuna categoria configurata</h3>
                <p>Le categorie prodotti vengono configurate durante la creazione dell'organizzazione tramite wizard.</p>
              </div>
            )}

            {/* Bonus Categories */}
            {currentOrganization?.bonus_categories && Array.isArray(currentOrganization.bonus_categories) && currentOrganization.bonus_categories.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Moltiplicatori Punti per Categoria</h3>
                <div className="cards-grid">
                  {currentOrganization.bonus_categories.map((bonus: any, index: number) => (
                    <div key={index} className="feature-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Package size={16} style={{ display: 'inline-block', marginRight: '0.5rem' }} />
                          <strong>{bonus.category}</strong>
                        </div>
                        <div style={{ fontSize: '1.5rem', color: '#3b82f6', fontWeight: 'bold' }}>
                          {bonus.multiplier}x
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'marketing-campaigns':
        return (
          <div className="section-content">
            <div className="section-header">
              <Mail size={24} />
              <h2>Campagne Marketing</h2>
              <p>Gestisci le campagne marketing automatiche configurate nel wizard</p>
            </div>

            <div className="campaigns-grid">
              <div className="campaign-card">
                <div className="campaign-header">
                  <Gift size={20} />
                  <h3>Campagna Benvenuto</h3>
                  <div className={`campaign-status ${currentOrganization?.welcome_campaign ? 'active' : 'inactive'}`}>
                    {currentOrganization?.welcome_campaign ? 'Attiva' : 'Inattiva'}
                  </div>
                </div>
                <p>Email di benvenuto automatica per nuovi clienti</p>
              </div>

              <div className="campaign-card">
                <div className="campaign-header">
                  <Star size={20} />
                  <h3>Premi Compleanno</h3>
                  <div className={`campaign-status ${currentOrganization?.birthday_rewards ? 'active' : 'inactive'}`}>
                    {currentOrganization?.birthday_rewards ? 'Attiva' : 'Inattiva'}
                  </div>
                </div>
                <p>Premi speciali automatici nel giorno del compleanno</p>
              </div>

              <div className="campaign-card">
                <div className="campaign-header">
                  <AlertTriangle size={20} />
                  <h3>Campagna Inattivi</h3>
                  <div className={`campaign-status ${currentOrganization?.inactive_campaign ? 'active' : 'inactive'}`}>
                    {currentOrganization?.inactive_campaign ? 'Attiva' : 'Inattiva'}
                  </div>
                </div>
                <p>Riattivazione automatica per clienti inattivi</p>
              </div>
            </div>
          </div>
        )

      case 'team-management':
        return currentOrganization ? (
          <div className="dashboard-content" style={{ height: 'calc(100vh - 140px)', overflowY: 'auto', padding: '2rem' }}>
            <TeamManagementHub
              organizationId={currentOrganization.id}
              primaryColor={currentOrganization.primary_color}
              secondaryColor={currentOrganization.secondary_color}
            />
          </div>
        ) : (
          <div className="section-content">
            <div className="empty-state">
              <UserPlus size={48} />
              <h3>Seleziona un'organizzazione</h3>
              <p>Seleziona un'organizzazione per gestire il team.</p>
            </div>
          </div>
        )

      case 'pos-integration':
        return (
          <div className="section-content">
            <div className="section-header">
              <Activity size={24} />
              <h2>Stato POS</h2>
              <p>Monitoraggio in tempo reale dello stato hardware e connessioni</p>
            </div>

            <div className="hardware-monitoring-grid">
              {/* Bridge Android Status */}
              <div className={`hardware-status-card ${hardwareStatus.bridge.status}`}>
                <div className="hardware-card-header">
                  <div className="hardware-icon">
                    <Zap size={24} />
                  </div>
                  <h3>Bridge Android</h3>
                  <div className={`status-indicator ${hardwareStatus.bridge.status}`}>
                    {hardwareStatus.bridge.status === 'connected' && <CheckCircle2 size={20} />}
                    {hardwareStatus.bridge.status === 'disconnected' && <XCircle size={20} />}
                    {hardwareStatus.bridge.status === 'checking' && <AlertTriangle size={20} />}
                  </div>
                </div>
                <div className="hardware-status-info">
                  <p className="status-message" style={{ color: '#1a1a1a' }}>
                    {hardwareStatus.bridge.message || 'Verifica in corso...'}
                    {hardwareStatus.bridge.version && (
                      <>
                        <br />
                        <strong style={{ color: '#1a1a1a' }}>Versione:</strong> <span style={{ color: '#1a1a1a' }}>{hardwareStatus.bridge.version}</span>
                      </>
                    )}
                  </p>
                  <span className={`status-badge ${hardwareStatus.bridge.status}`}>
                    {hardwareStatus.bridge.status === 'connected' && 'Connesso'}
                    {hardwareStatus.bridge.status === 'disconnected' && 'Disconnesso'}
                    {hardwareStatus.bridge.status === 'checking' && 'Verifica...'}
                  </span>
                </div>
                <button className="btn-test" onClick={checkHardwareStatus}>
                  <RefreshCw size={16} />
                  Aggiorna
                </button>
              </div>

              {/* Network Status */}
              <div className={`hardware-status-card ${hardwareStatus.network.status}`}>
                <div className="hardware-card-header">
                  <div className="hardware-icon">
                    <Wifi size={24} />
                  </div>
                  <h3>Connessione</h3>
                  <div className={`status-indicator ${hardwareStatus.network.status}`}>
                    {hardwareStatus.network.status === 'online' && <CheckCircle2 size={20} />}
                    {hardwareStatus.network.status === 'offline' && <XCircle size={20} />}
                    {hardwareStatus.network.status === 'checking' && <AlertTriangle size={20} />}
                  </div>
                </div>
                <div className="hardware-status-info">
                  <p className="status-message" style={{ color: '#1a1a1a' }}>
                    <strong style={{ color: '#1a1a1a' }}>IP:</strong> <span style={{ color: '#1a1a1a' }}>{hardwareStatus.network.ip || 'N/A'}</span><br />
                    <strong style={{ color: '#1a1a1a' }}>Tipo:</strong> <span style={{ color: '#1a1a1a' }}>{hardwareStatus.network.type || 'N/A'}</span>
                  </p>
                  <span className={`status-badge ${hardwareStatus.network.status}`}>
                    {hardwareStatus.network.status === 'online' && 'Online'}
                    {hardwareStatus.network.status === 'offline' && 'Offline'}
                    {hardwareStatus.network.status === 'checking' && 'Verifica...'}
                  </span>
                </div>
              </div>

              {/* Printer Status */}
              <div className={`hardware-status-card ${hardwareStatus.printer.status}`}>
                <div className="hardware-card-header">
                  <div className="hardware-icon">
                    <Printer size={24} />
                  </div>
                  <h3>Stampante</h3>
                  <div className={`status-indicator ${hardwareStatus.printer.status}`}>
                    {hardwareStatus.printer.status === 'ready' && <CheckCircle2 size={20} />}
                    {hardwareStatus.printer.status === 'error' && <XCircle size={20} />}
                    {hardwareStatus.printer.status === 'offline' && <XCircle size={20} />}
                    {hardwareStatus.printer.status === 'checking' && <AlertTriangle size={20} />}
                  </div>
                </div>
                <div className="hardware-status-info">
                  <p className="status-message" style={{ color: '#1a1a1a' }}>
                    {hardwareStatus.printer.message || 'Verifica in corso...'}
                    {hardwareStatus.printer.model && (
                      <>
                        <br />
                        <strong style={{ color: '#1a1a1a' }}>Modello:</strong> <span style={{ color: '#1a1a1a' }}>{hardwareStatus.printer.model}</span>
                      </>
                    )}
                  </p>
                  <span className={`status-badge ${hardwareStatus.printer.status}`}>
                    {hardwareStatus.printer.status === 'ready' && 'Pronta'}
                    {hardwareStatus.printer.status === 'error' && 'Errore'}
                    {hardwareStatus.printer.status === 'offline' && 'Offline'}
                    {hardwareStatus.printer.status === 'checking' && 'Verifica...'}
                  </span>
                </div>
                <button className="btn-test" onClick={testPrinter} disabled={hardwareStatus.printer.status !== 'ready'}>
                  <Printer size={16} />
                  Test Stampa
                </button>
              </div>

              {/* NFC Reader Status */}
              <div className={`hardware-status-card ${hardwareStatus.nfc.status}`}>
                <div className="hardware-card-header">
                  <div className="hardware-icon">
                    <Smartphone size={24} />
                  </div>
                  <h3>Lettore NFC</h3>
                  <div className={`status-indicator ${hardwareStatus.nfc.status}`}>
                    {hardwareStatus.nfc.status === 'available' && <CheckCircle2 size={20} />}
                    {hardwareStatus.nfc.status === 'unavailable' && <XCircle size={20} />}
                    {hardwareStatus.nfc.status === 'checking' && <AlertTriangle size={20} />}
                  </div>
                </div>
                <div className="hardware-status-info">
                  <p className="status-message" style={{ color: '#1a1a1a' }}>{hardwareStatus.nfc.message || 'Verifica in corso...'}</p>
                  <span className={`status-badge ${hardwareStatus.nfc.status}`}>
                    {hardwareStatus.nfc.status === 'available' && 'Disponibile'}
                    {hardwareStatus.nfc.status === 'unavailable' && 'Non disponibile'}
                    {hardwareStatus.nfc.status === 'checking' && 'Verifica...'}
                  </span>
                  
                  {/* Dati tessera NFC letta */}
                  {nfcResult && (
                    <div className="nfc-card-data" style={{ 
                      marginTop: '12px', 
                      padding: '8px', 
                      backgroundColor: '#f0f9ff', 
                      border: '1px solid #0ea5e9', 
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      <div style={{ fontWeight: 'bold', color: '#0369a1', marginBottom: '4px' }}>
                        📱 Tessera Letta:
                      </div>
                      <div><strong>UID:</strong> {nfcResult.cardUID?.slice(0, 12)}...</div>
                      <div><strong>Tipo:</strong> {nfcResult.cardType || 'N/A'}</div>
                      {nfcResult.customerName && (
                        <div><strong>Cliente:</strong> {nfcResult.customerName}</div>
                      )}
                      {nfcResult.loyaltyPoints !== undefined && (
                        <div><strong>Punti:</strong> {nfcResult.loyaltyPoints}</div>
                      )}
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>
                        {new Date(nfcResult.timestamp || Date.now()).toLocaleString('it-IT')}
                      </div>
                    </div>
                  )}
                </div>
                <button className="btn-test" onClick={testNFC} disabled={hardwareStatus.nfc.status !== 'available'}>
                  <Smartphone size={16} />
                  Test NFC
                </button>
              </div>

              {/* EMV/PinPad Status */}
              <div className={`hardware-status-card ${hardwareStatus.emv.status}`}>
                <div className="hardware-card-header">
                  <div className="hardware-icon">
                    <CreditCard size={24} />
                  </div>
                  <h3>Terminale Pagamenti</h3>
                  <div className={`status-indicator ${hardwareStatus.emv.status}`}>
                    {hardwareStatus.emv.status === 'available' && <CheckCircle2 size={20} />}
                    {hardwareStatus.emv.status === 'unavailable' && <XCircle size={20} />}
                    {hardwareStatus.emv.status === 'checking' && <AlertTriangle size={20} />}
                  </div>
                </div>
                <div className="hardware-status-info">
                  <p className="status-message" style={{ color: '#1a1a1a' }}>{hardwareStatus.emv.message || 'Verifica in corso...'}</p>
                  <span className={`status-badge ${hardwareStatus.emv.status}`}>
                    {hardwareStatus.emv.status === 'available' && 'Disponibile'}
                    {hardwareStatus.emv.status === 'unavailable' && 'Non disponibile'}
                    {hardwareStatus.emv.status === 'checking' && 'Verifica...'}
                  </span>
                </div>
              </div>

              {/* System Info */}
              <div className="hardware-status-card system-info">
                <div className="hardware-card-header">
                  <div className="hardware-icon">
                    <Building2 size={24} />
                  </div>
                  <h3>Informazioni Sistema</h3>
                </div>
                <div className="hardware-status-info">
                  <p className="status-message" style={{ color: '#1a1a1a' }}>
                    <strong style={{ color: '#1a1a1a' }}>Organizzazione:</strong> <span style={{ color: '#1a1a1a' }}>{currentOrganization?.name || 'Caricamento...'}</span><br />
                    <strong style={{ color: '#1a1a1a' }}>Modello POS:</strong> <span style={{ color: '#1a1a1a' }}>{currentOrganization?.pos_model || 'OMNILY POS Standard'}</span><br />
                    <strong style={{ color: '#1a1a1a' }}>Tipo:</strong> <span style={{ color: '#1a1a1a' }}>{currentOrganization?.pos_connection || 'Android Terminal'}</span>
                    {(hardwareStatus.system.manufacturer || hardwareStatus.system.model) && (
                      <span style={{ display: 'block', color: '#000', opacity: 1, visibility: 'visible' }}>
                        <br />
                        <strong style={{ color: '#000' }}>Dispositivo:</strong> <span style={{ color: '#000' }}>{hardwareStatus.system.manufacturer ? `${hardwareStatus.system.manufacturer} ${hardwareStatus.system.model || ''}` : hardwareStatus.system.model}</span>
                      </span>
                    )}
                    {hardwareStatus.system.androidVersion && (
                      <span style={{ display: 'block', color: '#1a1a1a' }}>
                        <br />
                        <strong style={{ color: '#1a1a1a' }}>Android:</strong> <span style={{ color: '#1a1a1a' }}>{hardwareStatus.system.androidVersion} {hardwareStatus.system.sdkVersion && `(SDK ${hardwareStatus.system.sdkVersion})`}</span>
                      </span>
                    )}
                  </p>
                  <span className={`status-badge ${hardwareStatus.bridge.status === 'connected' ? 'connected' : 'disconnected'}`}>
                    {hardwareStatus.bridge.status === 'connected' ? 'Sistema Operativo' : 'Sistema Offline'}
                  </span>
                </div>
              </div>
            </div>

            {/* Matrix Monitor */}
            <div className="matrix-monitor">
              <div className="matrix-header">
                <Terminal size={20} />
                <h3>Monitor Sistema</h3>
                <div className="matrix-controls">
                  <button
                    className={`btn-toggle-monitor ${monitorEnabled ? 'active' : 'inactive'}`}
                    onClick={() => setMonitorEnabled(!monitorEnabled)}
                  >
                    {monitorEnabled ? '● ON' : '○ OFF'}
                  </button>
                  <button className="btn-clear-logs" onClick={() => setMatrixLogs([])}>
                    <Trash2 size={16} />
                    Pulisci
                  </button>
                </div>
              </div>
              <div className="matrix-logs" ref={matrixLogsRef}>
                {matrixLogs.length === 0 ? (
                  <div className="matrix-empty">In attesa di eventi...</div>
                ) : (
                  matrixLogs.map((log, index) => {
                    const logClass = log.includes('[ERROR]') ? 'matrix-log-error' :
                                     log.includes('[WARN]') ? 'matrix-log-warn' :
                                     log.includes('[INFO]') ? 'matrix-log-info' :
                                     'matrix-log-line';
                    return <div key={index} className={`matrix-log-line ${logClass}`}>{log}</div>
                  })
                )}
              </div>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="section-content">
            <div className="section-header">
              <Bell size={24} />
              <h2>Notifiche & Comunicazioni</h2>
              <p>Impostazioni notifiche configurate nel wizard</p>
            </div>

            <div className="notifications-grid">
              <div className="notification-card">
                <div className="notification-header">
                  <Mail size={20} />
                  <h3>Email</h3>
                  <div className={`notification-status ${currentOrganization?.enable_email_notifications ? 'active' : 'inactive'}`}>
                    {currentOrganization?.enable_email_notifications ? 'Attive' : 'Inattive'}
                  </div>
                </div>
                <p>Notifiche via email per clienti e amministratori</p>
                <div className="sub-setting">
                  <span>Email di benvenuto: </span>
                  <span className={currentOrganization?.welcome_email_enabled ? 'enabled' : 'disabled'}>
                    {currentOrganization?.welcome_email_enabled ? 'Abilitata' : 'Disabilitata'}
                  </span>
                </div>
              </div>

              <div className="notification-card">
                <div className="notification-header">
                  <Bell size={20} />
                  <h3>Push Notifications</h3>
                  <div className={`notification-status ${currentOrganization?.enable_push_notifications ? 'active' : 'inactive'}`}>
                    {currentOrganization?.enable_push_notifications ? 'Attive' : 'Inattive'}
                  </div>
                </div>
                <p>Notifiche push per app mobile</p>
              </div>

              <div className="notification-card">
                <div className="notification-header">
                  <div style={{fontSize: '20px'}}>📱</div>
                  <h3>SMS</h3>
                  <div className={`notification-status ${currentOrganization?.enable_sms ? 'active' : 'inactive'}`}>
                    {currentOrganization?.enable_sms ? 'Attivi' : 'Inattivi'}
                  </div>
                </div>
                <p>Notifiche SMS per promozioni urgenti</p>
              </div>
            </div>
          </div>
        )

      case 'analytics-reports':
        return (
          <div className="section-content">
            <div className="section-header">
              <TrendingUp size={24} />
              <h2>Analytics & Report</h2>
              <p>Configurazione analytics dal wizard</p>
            </div>

            <div className="analytics-config">
              <div className="analytics-card">
                <h3>Analytics Avanzate</h3>
                <div className={`status-badge ${currentOrganization?.enable_advanced_analytics ? 'active' : 'inactive'}`}>
                  {currentOrganization?.enable_advanced_analytics ? 'Abilitate' : 'Disabilitate'}
                </div>
                <p>Analisi dettagliate comportamento clienti e performance</p>
              </div>

              <div className="reports-card">
                <h3>Frequenza Report</h3>
                <div className="report-frequency">
                  {currentOrganization?.report_frequency || 'Non configurata'}
                </div>
                <p>Report automatici via email</p>
              </div>

              {currentOrganization?.kpi_tracking && currentOrganization.kpi_tracking.length > 0 && (
                <div className="kpi-card">
                  <h3>KPI Monitorati</h3>
                  <ul className="kpi-list">
                    {Array.isArray(currentOrganization.kpi_tracking) && currentOrganization.kpi_tracking.map((kpi, index) => (
                      <li key={index} className="kpi-item">
                        <CheckCircle2 size={16} />
                        <span>{kpi.replace('_', ' ').toUpperCase()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )

      case 'branding-social':
        return (
          <div className="section-content">
            <div className="section-header">
              <Palette size={24} />
              <h2>Branding & Social Media</h2>
              <p>Personalizzazione brand e social links dal wizard</p>
            </div>

            <div className="branding-grid">
              <div className="brand-card">
                <h3>Colori Brand</h3>
                <div className="color-display">
                  <div className="color-item">
                    <div
                      className="color-preview"
                      style={{ backgroundColor: currentOrganization?.primary_color || '#ef4444' }}
                    ></div>
                    <span>Primario: {currentOrganization?.primary_color || '#ef4444'}</span>
                  </div>
                  <div className="color-item">
                    <div
                      className="color-preview"
                      style={{ backgroundColor: currentOrganization?.secondary_color || '#dc2626' }}
                    ></div>
                    <span>Secondario: {currentOrganization?.secondary_color || '#dc2626'}</span>
                  </div>
                </div>
              </div>

              <div className="logo-card">
                <h3>Logo Aziendale</h3>
                {currentOrganization?.logo_url ? (
                  <div className="logo-display">
                    <img src={currentOrganization.logo_url} alt="Logo" className="org-logo" />
                  </div>
                ) : (
                  <div className="no-logo">Nessun logo configurato</div>
                )}
              </div>

              <div className="social-card">
                <h3>Social Media</h3>
                <div className="social-links">
                  {currentOrganization?.facebook_url && (
                    <div className="social-item">
                      <span>📘 Facebook</span>
                      <a href={currentOrganization.facebook_url} target="_blank" rel="noopener noreferrer">
                        Apri profilo
                      </a>
                    </div>
                  )}
                  {currentOrganization?.instagram_url && (
                    <div className="social-item">
                      <span>📷 Instagram</span>
                      <a href={currentOrganization.instagram_url} target="_blank" rel="noopener noreferrer">
                        Apri profilo
                      </a>
                    </div>
                  )}
                  {currentOrganization?.linkedin_url && (
                    <div className="social-item">
                      <span>💼 LinkedIn</span>
                      <a href={currentOrganization.linkedin_url} target="_blank" rel="noopener noreferrer">
                        Apri profilo
                      </a>
                    </div>
                  )}
                  {currentOrganization?.twitter_url && (
                    <div className="social-item">
                      <span>🐦 Twitter</span>
                      <a href={currentOrganization.twitter_url} target="_blank" rel="noopener noreferrer">
                        Apri profilo
                      </a>
                    </div>
                  )}
                  {!currentOrganization?.facebook_url && !currentOrganization?.instagram_url &&
                   !currentOrganization?.linkedin_url && !currentOrganization?.twitter_url && (
                    <div className="no-social">Nessun social media configurato</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 'website-editor':
        return currentOrganization ? (
          <WebsiteContentEditor
            organizationId={currentOrganization.id}
          />
        ) : (
          <div className="section-content">
            <div className="section-header">
              <Globe size={24} />
              <h2>Il Mio Sito Web</h2>
              <p>Seleziona un'organizzazione per modificare il sito</p>
            </div>
          </div>
        )

      case 'channels':
        return (
          <div className="section-content">
            <div className="section-header">
              <Globe size={24} />
              <h2>Canali di Integrazione</h2>
              <p>Canali di vendita configurati nel wizard</p>
            </div>

            <div className="channels-grid">
              <div className="channel-card">
                <div className="channel-header">
                  <Zap size={20} />
                  <h3>POS</h3>
                  <div className={`channel-status ${currentOrganization?.enable_pos ? 'active' : 'inactive'}`}>
                    {currentOrganization?.enable_pos ? 'Abilitato' : 'Disabilitato'}
                  </div>
                </div>
                <p>Sistema punto vendita fisico</p>
                {currentOrganization?.pos_type && (
                  <div className="channel-detail">Tipo: {currentOrganization.pos_type}</div>
                )}
              </div>

              <div className="channel-card">
                <div className="channel-header">
                  <Globe size={20} />
                  <h3>E-commerce</h3>
                  <div className={`channel-status ${currentOrganization?.enable_ecommerce ? 'active' : 'inactive'}`}>
                    {currentOrganization?.enable_ecommerce ? 'Abilitato' : 'Disabilitato'}
                  </div>
                </div>
                <p>Negozio online integrato</p>
                {currentOrganization?.ecommerce_platform && (
                  <div className="channel-detail">Piattaforma: {currentOrganization.ecommerce_platform}</div>
                )}
              </div>

              <div className="channel-card">
                <div className="channel-header">
                  <div style={{fontSize: '20px'}}>📱</div>
                  <h3>App Mobile</h3>
                  <div className={`channel-status ${currentOrganization?.enable_app ? 'active' : 'inactive'}`}>
                    {currentOrganization?.enable_app ? 'Abilitata' : 'Disabilitata'}
                  </div>
                </div>
                <p>Applicazione mobile per clienti</p>
              </div>
            </div>
          </div>
        )

      case 'communications':
        return (
          <div className="section-content">
            <div className="section-header">
              <Gift size={24} />
              <h2>Comunicazioni</h2>
              <p>Gestisci comunicazioni e messaggi con i tuoi clienti</p>
            </div>
            <div className="cards-grid">
              <div className="feature-card">
                <h3>Email Marketing</h3>
                <p>Invia email personalizzate ai tuoi clienti</p>
                <button className="btn-primary" onClick={() => setShowEmailMarketingPanel(true)}>
                  <Mail size={18} />
                  Gestisci Email
                </button>
              </div>
              <div className="feature-card">
                <h3>Notifiche Push</h3>
                <p>Gestisci le notifiche push dell'app</p>
                <button className="btn-primary">Configura</button>
              </div>
            </div>
          </div>
        )
      
      case 'campaigns':
        return (
          <div className="section-content">
            <div className="section-header">
              <Megaphone size={24} />
              <h2>Campagne Marketing</h2>
              <p>Crea e gestisci campagne promozionali per i tuoi clienti</p>
            </div>
            <div className="cards-grid">
              <div className="feature-card">
                <h3>Campagne Attive</h3>
                <p>Monitora le tue campagne marketing in corso</p>
                <button className="btn-primary">Visualizza</button>
              </div>
              <div className="feature-card">
                <h3>Nuova Campagna</h3>
                <p>Crea una nuova campagna promozionale</p>
                <button className="btn-primary">Crea</button>
              </div>
            </div>
          </div>
        )
      
      case 'settings':
        return (
          <div className="section-content">
            <div className="section-header">
              <Settings size={24} />
              <h2>Impostazioni</h2>
              <p>Configura e personalizza le impostazioni del tuo account</p>
            </div>

            <div className="cards-grid">
              <div className="feature-card">
                <h3>Configurazione Account</h3>
                <p>Gestisci le impostazioni del tuo account e profilo</p>
                <button className="btn-primary" onClick={() => setShowAccountSettingsPanel(true)}>Configura</button>
              </div>
              <div className="feature-card">
                <h3>Fatturazione</h3>
                <p>Visualizza e gestisci i tuoi piani di abbonamento</p>
                <button className="btn-primary">Gestisci</button>
              </div>
              <div className="feature-card">
                <h3>Sicurezza</h3>
                <p>Configura autenticazione e permessi di accesso</p>
                <button className="btn-primary">Sicurezza</button>
              </div>
              <div className="feature-card">
                <h3>API & Integrazioni</h3>
                <p>Gestisci chiavi API e integrazioni esterne</p>
                <button className="btn-primary">API</button>
              </div>
            </div>
          </div>
        )
      
      case 'support':
        return (
          <div className="section-content">
            <div className="section-header">
              <HelpCircle size={24} />
              <h2>Aiuto & Supporto</h2>
              <p>Trova assistenza e risposte alle tue domande</p>
            </div>
            <div className="cards-grid">
              <div className="feature-card">
                <HelpCircle size={48} style={{ color: '#3b82f6', marginBottom: '1rem' }} />
                <h3>Centro Assistenza</h3>
                <p>Trova risposte alle domande più frequenti</p>
                <button className="btn-primary">Esplora</button>
              </div>
              <div className="feature-card">
                <Mail size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
                <h3>Contatta il Supporto</h3>
                <p>Richiedi assistenza tecnica personalizzata</p>
                <button className="btn-primary">Contatta</button>
              </div>
              <div className="feature-card" onClick={() => setShowDocsModal(true)} style={{ cursor: 'pointer' }}>
                <BookOpen size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
                <h3>Documentazione</h3>
                <p>Guide dettagliate per utilizzare Membership e altri componenti</p>
                <button className="btn-primary">Leggi Guide</button>
              </div>
            </div>
          </div>
        )

      case 'gift-certificates':
        return (
          <div className="section-content">
            <div className="section-header">
              <CreditCard size={24} />
              <h2>Gift Certificates</h2>
              <p>Gestisci gift certificates, codici promozionali e buoni regalo</p>
            </div>
            <div className="cards-grid">
              <div className="feature-card">
                <h3>Gestione Gift Certificates</h3>
                <p>Emetti, valida e gestisci gift certificates per i tuoi clienti</p>
                <button
                  className="btn-primary"
                  onClick={() => setShowGiftCertificatesPanel(true)}
                >
                  <CreditCard size={18} />
                  Apri Gestionale
                </button>
              </div>
              <div className="feature-card">
                <h3>Statistiche</h3>
                <p>Visualizza le performance dei gift certificates emessi</p>
                <button
                  className="btn-primary"
                  onClick={() => setShowGiftCertificatesStatsModal(true)}
                >
                  <BarChart3 size={18} />
                  Visualizza Report
                </button>
              </div>
              <div className="feature-card">
                <h3>Configurazione</h3>
                <p>Configura template, validità e impostazioni gift certificates</p>
                <button
                  className="btn-primary"
                  onClick={() => setShowAccountSettingsPanel(true)}
                >
                  <Settings size={18} />
                  Configura
                </button>
              </div>
            </div>
          </div>
        )

      case 'email-automations':
        return (
          <div className="section-content">
            <div className="section-header">
              <Mail size={24} />
              <h2>Email Automations</h2>
              <p>Gestisci branding e automazioni email per i tuoi clienti</p>
            </div>
            <div className="cards-grid">
              <div className="feature-card">
                <h3>Branding Email</h3>
                <p>Personalizza logo, colori e informazioni aziendali per le email automatiche</p>
                <button
                  className="btn-primary"
                  onClick={() => setShowBrandingPanel(true)}
                >
                  <Palette size={18} />
                  Configura Branding
                </button>
              </div>
              <div className="feature-card">
                <h3>Automazioni Email</h3>
                <p>Gestisci email automatiche (welcome, tier upgrade, birthday)</p>
                <button
                  className="btn-primary"
                  onClick={() => setShowEmailAutomationsPanel(true)}
                >
                  <Zap size={18} />
                  Configura Automazioni
                </button>
              </div>
            </div>
          </div>
        )

      case 'subscriptions':
        return (
          <div className="section-content">
            <div className="section-header">
              <Package size={24} />
              <h2>Abbonamenti</h2>
              <p>Gestisci abbonamenti universali per qualsiasi tipo di attività</p>
            </div>
            <div className="cards-grid">
              <div className="feature-card">
                <h3>Gestione Abbonamenti</h3>
                <p>Crea template, vendi e valida abbonamenti per i tuoi clienti</p>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setSubscriptionInitialModal('manage');
                    setShowSubscriptionsPanel(true);
                  }}
                >
                  <Package size={18} />
                  Apri Gestionale
                </button>
              </div>
              <div className="feature-card">
                <h3>Template Personalizzati</h3>
                <p>Crea abbonamenti adatti alla tua attività (pizze, caffè, palestra, etc.)</p>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setSubscriptionInitialModal('templates');
                    setShowSubscriptionsPanel(true);
                  }}
                >
                  <Plus size={18} />
                  Crea Template
                </button>
              </div>
              <div className="feature-card">
                <h3>Statistiche e Report</h3>
                <p>Monitora vendite, utilizzi e performance dei tuoi abbonamenti</p>
                <button
                  className="btn-primary"
                  onClick={() => setShowSubscriptionStatsModal(true)}
                >
                  <BarChart3 size={18} />
                  Visualizza Report
                </button>
              </div>
            </div>
          </div>
        )

      default:
        return currentOrganization ? (
          <div className="dashboard-content">
            <AnalyticsDashboard
              organization={currentOrganization}
              customers={customers}
            />
          </div>
        ) : (
          <div className="dashboard-content">
            {/* Organizations Section - Hidden in POS mode (always 1 org) */}
            {!isPOSMode && organizations.length > 0 && (
              <div className="organizations-section">
                <h3 className="section-subtitle">Le Tue Organizzazioni</h3>
                <div className="organizations-grid">
                  {organizations.map(org => (
                    <div key={org.id} className="org-card">
                      <div className="org-header">
                        <div className="org-name">{org.name}</div>
                        <div className="org-slug">{org.slug}</div>
                      </div>
                      <div className={`org-plan plan-${org.plan_type}`}>
                        {org.plan_type.toUpperCase()}
                      </div>
                      <div className="org-details">
                        <div className="detail-item">
                          <div className="detail-value">{org.max_customers}</div>
                          <div className="detail-label">Max Clienti</div>
                        </div>
                        <div className="detail-item">
                          <div className="detail-value">{org.max_workflows}</div>
                          <div className="detail-label">Max Workflows</div>
                        </div>
                      </div>
                      <div className="color-preview">
                        <div 
                          className="color-box" 
                          style={{ backgroundColor: org.primary_color }}
                          title={`Primary: ${org.primary_color}`}
                        />
                        <div 
                          className="color-box" 
                          style={{ backgroundColor: org.secondary_color }}
                          title={`Secondary: ${org.secondary_color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="dashboard-filters">
              <select className="filter-select">
                <option>Tutte le Sedi</option>
              </select>
              <select className="filter-select">
                <option>Tutte le Offerte</option>
              </select>
              <select className="filter-select">
                <option>Sempre</option>
              </select>
            </div>

            <div className="dashboard-grid">
              {/* Left Column - Metrics */}
              <div className="dashboard-left">
                <div className="metrics-section">
                  <h2 className="section-title">Panoramica</h2>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <div className="metric-icon stamps">
                        <Target size={24} />
                      </div>
                      <div className="metric-content">
                        <div className="metric-value">{metrics.totalStamps.toLocaleString()}</div>
                        <div className="metric-label">Punti totali</div>
                      </div>
                    </div>
                    
                    <div className="metric-card">
                      <div className="metric-icon offers">
                        <Gift size={24} />
                      </div>
                      <div className="metric-content">
                        <div className="metric-value">{metrics.totalOffers.toLocaleString()}</div>
                        <div className="metric-label">Offerte totali</div>
                      </div>
                    </div>
                    
                    <div className="metric-card">
                      <div className="metric-icon joins">
                        <TrendingUp size={24} />
                      </div>
                      <div className="metric-content">
                        <div className="metric-value">{metrics.totalJoins}</div>
                        <div className="metric-label">Iscrizioni totali</div>
                      </div>
                    </div>
                    
                    <div className="metric-card">
                      <div className="metric-icon customers">
                        <Users size={24} />
                      </div>
                      <div className="metric-content">
                        <div className="metric-value">{metrics.totalCustomers}</div>
                        <div className="metric-label">Clienti totali</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Activity Chart */}
              <div className="dashboard-right">
                <div className="activity-section">
                  <h2 className="section-title">Attività <span className="subtitle">sempre</span></h2>
                  
                  <div className="activity-tabs">
                    <button className="tab-btn active">Punti</button>
                    <button className="tab-btn">Riscatti</button>
                  </div>
                  
                  <div className="chart-container">
                    <div className="chart-y-axis">
                      <div>1800</div>
                      <div>1400</div>
                      <div>1000</div>
                      <div>600</div>
                      <div>200</div>
                      <div>0</div>
                    </div>
                    <div className="chart-bars">
                      {chartData.map((data, _index) => (
                        <div key={data.month} className="chart-bar-group">
                          <div 
                            className="chart-bar stamps-bar"
                            style={{ height: `${(data.stamps / 1800) * 100}%` }}
                            title={`${data.month}: ${data.stamps} punti`}
                          />
                          <div className="chart-month">{data.month}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  if (loading) return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <div className="loading-bar-container" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="loading-bar-label">Caricamento dashboard...</div>
        <div className="loading-bar-track">
          <div className="loading-bar-fill"></div>
        </div>
      </div>
    </div>
  )
  if (error) return <div className="error">Errore: {error}</div>

  return (
    <div className={`dashboard-layout ${isPOSMode ? 'pos-mode' : ''}`}>
      {/* DEBUG: POS Mode Indicator */}
      {isPOSMode && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          background: 'red',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '5px',
          zIndex: 9999,
          fontWeight: 'bold'
        }}>
          POS MODE ACTIVE
        </div>
      )}

      {/* Sidebar - Hidden in POS mode */}
      {!isPOSMode && (
        <div className="sidebar">
        <div className="sidebar-header">
          {/* Logo Organizzazione */}
          {currentOrganization?.logo_url ? (
            <div className="org-logo">
              <img src={currentOrganization.logo_url} alt={currentOrganization.name} />
            </div>
          ) : (
            <>
              {console.log('⚠️ Logo URL mancante per:', currentOrganization?.name, 'logo_url:', currentOrganization?.logo_url)}
              <div className="logo">
                <div className="logo-icon">O</div>
                <span className="logo-text">OMNILY PRO</span>
              </div>
            </>
          )}

          {/* Nome Organizzazione */}
          <div className="org-name">{currentOrganization?.name || 'OMNILY PRO'}</div>

          {/* Operatore Loggato */}
          <div className="operator-info">
            <div className="operator-label">Operatore</div>
            <div className="operator-name">{user?.email || 'Admin'}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sidebarItems.map(item => {
            const IconComponent = item.icon
            const isLocked = (item as any).locked
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (isLocked) {
                    handleRestrictedSectionChange(item.id, item.label)
                  } else {
                    handleSectionChange(item.id)
                  }
                }}
                className={`nav-item ${activeSection === item.id ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                disabled={isLocked && activeSection === item.id}
              >
                <IconComponent size={20} />
                <span>{item.label}</span>
                {isLocked && <Lock size={16} className="lock-icon" />}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout-sidebar" onClick={() => {
            localStorage.removeItem('supabase.auth.token');
            window.location.href = '/login';
          }}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
          <div className="version">Version 0.1.0 (48)</div>
        </div>
        </div>
      )}

      {/* POS Mode - Hardware Test Panel */}
      {isPOSMode && (
        <div className="pos-hardware-panel">
          <div className="pos-panel-header">
            <div className="pos-logo">
              <div className="logo-icon">🔧</div>
              <span className="logo-text">OMNILY POS - TEST HARDWARE</span>
            </div>
            <div className="pos-org-name">{currentOrganization?.name || 'OMNILY PRO'}</div>
          </div>
          
          <div className="pos-nav-tabs">
            <button
              className={`pos-nav-tab ${activeSection === 'pos-integration' ? 'active' : ''}`}
              onClick={() => handleSectionChange('pos-integration')}
            >
              <Activity size={20} />
              <span>Stato Hardware</span>
            </button>
            <button
              className={`pos-nav-tab ${activeSection === 'stamps' ? 'active' : ''}`}
              onClick={() => handleSectionChange('stamps')}
            >
              <Target size={20} />
              <span>Test Tessere</span>
            </button>
            <button
              className={`pos-nav-tab ${activeSection === 'gift-certificates' ? 'active' : ''}`}
              onClick={() => handleSectionChange('gift-certificates')}
            >
              <CreditCard size={20} />
              <span>Gift Certificates</span>
            </button>
            <button
              className={`pos-nav-tab ${activeSection === 'email-automations' ? 'active' : ''}`}
              onClick={() => handleSectionChange('email-automations')}
            >
              <Mail size={20} />
              <span>Email Automations</span>
            </button>
            <button
              className={`pos-nav-tab ${activeSection === 'subscriptions' ? 'active' : ''}`}
              onClick={() => handleSectionChange('subscriptions')}
            >
              <Package size={20} />
              <span>Membership</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">
        <header className={`main-header ${isPOSMode ? 'pos-header' : ''}`}>
          <div className="header-title">
            {isPOSMode ? (
              <>
                <Activity size={24} />
                <span>OMNILY POS - Test & Diagnostica</span>
                <div className="current-status-badge">
                  <Zap size={14} />
                  <span>MODALITÀ TEST</span>
                </div>
              </>
            ) : (
              <>
                <BarChart3 size={24} />
                <span>OMNILY PRO - Dashboard</span>
                <div className="current-plan-badge">
                  <Crown size={14} />
                  <span>{(currentOrganization?.plan_type || 'free').toUpperCase()}</span>
                </div>
              </>
            )}
          </div>
        </header>

        {renderContent()}
      </div>

      {/* Customer Slide Panel */}
      <CustomerSlidePanel
        customer={selectedCustomer}
        isOpen={isSlidePanelOpen}
        onClose={handleCloseSlidePanel}
        onAddPoints={handleAddPoints}
        onNewTransaction={handleNewTransaction}
        pointsPerEuro={currentOrganization?.points_per_euro || 1}
        loyaltyTiers={currentOrganization?.loyalty_tiers || []}
        bonusCategories={currentOrganization?.bonus_categories || []}
        pointsName={currentOrganization?.points_name || 'Punti'}
      />

      {/* Card Management Panel (modale) */}
      <CardManagementPanel
        isOpen={showCardManagementPanel}
        onClose={() => setShowCardManagementPanel(false)}
        customers={customers}
        organizationId={currentOrganization?.id || ''}
        onAssignCard={(cardId, customerId) => {
          console.log(`Tessera ${cardId} assegnata al cliente ${customerId}`);
          // Le tessere sono ora gestite direttamente in Supabase
        }}
        onReassignCard={(cardId, customerId) => {
          console.log(`Tessera ${cardId} riassegnata al cliente ${customerId}`);
          // Le tessere sono ora gestite direttamente in Supabase
        }}
        onCardRead={(cardData) => {
          console.log('Tessera letta:', cardData);
          // Le tessere sono ora gestite direttamente in Supabase
        }}
      />

      {/* Loyalty Tiers Configuration Panel */}
      <LoyaltyTiersConfigPanel
        isOpen={showLoyaltyTiersPanel}
        onClose={() => setShowLoyaltyTiersPanel(false)}
        organizationId={organizations.length > 0 ? organizations[0].id : 'c06a8dcf-b209-40b1-92a5-c80facf2eb29'}
        organization={organizations.length > 0 ? organizations[0] : null}
        onSaved={() => {
          console.log('Loyalty tiers saved successfully');
          fetchOrganizations(); // Reload organizations to get updated tiers
        }}
      />

      {/* Email Marketing Hub */}
      <EmailMarketingHub
        isOpen={showEmailMarketingPanel}
        onClose={() => setShowEmailMarketingPanel(false)}
        organizationId={currentOrganization?.id || ''}
        organizationName={currentOrganization?.name || 'Organizzazione'}
        primaryColor={currentOrganization?.primary_color || '#dc2626'}
        secondaryColor={currentOrganization?.secondary_color || '#dc2626'}
      />

      {/* Organization Branding Panel */}
      <OrganizationBrandingPanel
        isOpen={showBrandingPanel}
        onClose={() => setShowBrandingPanel(false)}
        organizationId={currentOrganization?.id || ''}
        organizationName={currentOrganization?.name || ''}
      />

      {/* Email Automations Panel */}
      <EmailAutomationsPanel
        isOpen={showEmailAutomationsPanel}
        onClose={() => setShowEmailAutomationsPanel(false)}
        organizationId={currentOrganization?.id || ''}
        organizationName={currentOrganization?.name || ''}
      />

      {/* Upgrade Prompt */}
      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        feature={upgradeFeature}
        currentPlan={currentOrganization?.plan_type || 'free'}
        requiredPlan={requiredPlan}
        onUpgrade={(plan) => {
          console.log('Upgrade to:', plan)
          // TODO: Implement actual upgrade logic
          showModal({
            title: 'Upgrade Piano',
            message: `Upgrade a ${plan} non ancora implementato`,
            type: 'info'
          })
        }}
      />

      {/* Reward Modal */}
      <RewardModal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        onSave={handleSaveReward}
        reward={selectedReward}
        isLoading={rewardModalLoading}
        loyaltyTiers={organizations.length > 0 ? organizations[0].loyalty_tiers : []}
        pointsName={currentOrganization?.points_name || 'Punti'}
      />

      {/* Account Settings Hub */}
      <AccountSettingsHub
        isOpen={showAccountSettingsPanel}
        onClose={() => setShowAccountSettingsPanel(false)}
        organizationId={currentOrganization?.id || ''}
        organizationName={currentOrganization?.name || 'Organizzazione'}
        primaryColor={currentOrganization?.primary_color || '#dc2626'}
        secondaryColor={currentOrganization?.secondary_color || '#dc2626'}
        organization={currentOrganization}
        onUpdate={() => {
          fetchOrganizations()
          setShowAccountSettingsPanel(false)
          // Chiudi anche EmailMarketingPanel se aperto per forzare refresh dei dati
          setShowEmailMarketingPanel(false)
        }}
      />

      {/* Gift Certificates Panel */}
      <GiftCertificatesPanel
        isOpen={showGiftCertificatesPanel}
        onClose={() => setShowGiftCertificatesPanel(false)}
        organizationId={currentOrganization?.id || ''}
        organizationName={currentOrganization?.name || ''}
        printService={printService}
      />

      {/* Gift Certificates Stats Modal */}
      <GiftCertificatesStatsModal
        isOpen={showGiftCertificatesStatsModal}
        onClose={() => setShowGiftCertificatesStatsModal(false)}
        organizationId={currentOrganization?.id || ''}
        organizationName={currentOrganization?.name || ''}
      />

      {/* Subscriptions Panel */}
      <SubscriptionsPanel
        isOpen={showSubscriptionsPanel}
        onClose={() => {
          setShowSubscriptionsPanel(false);
          setSubscriptionInitialModal(undefined);
        }}
        organizationId={currentOrganization?.id || ''}
        organizationName={currentOrganization?.name || ''}
        printService={printService}
        availableCategories={currentOrganization?.product_categories?.map((cat: any) =>
          typeof cat === 'string' ? cat : cat.name
        ) || []}
        initialModal={subscriptionInitialModal}
      />

      {/* Subscription Stats Modal */}
      <SubscriptionStatsModal
        isOpen={showSubscriptionStatsModal}
        onClose={() => setShowSubscriptionStatsModal(false)}
        organizationId={currentOrganization?.id || ''}
      />

      {/* Documentation Modal */}
      {showDocsModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowDocsModal(false)} style={{ zIndex: 9998 }} />
          <div className="modal docs-modal" style={{
            zIndex: 9999,
            maxHeight: '100vh',
            height: '100vh',
            overflowY: 'auto',
            width: '100vw',
            maxWidth: '100vw',
            position: 'fixed',
            right: 0,
            top: 0,
            borderRadius: '0',
            transform: 'none'
          }}>
            <div className="modal-header" style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              padding: '1.5rem 2rem',
              borderBottom: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <BookOpen size={28} />
                <h2 style={{ margin: 0, color: 'white', fontSize: 'clamp(1.25rem, 3vw, 1.5rem)' }}>Documentazione</h2>
              </div>
              <button onClick={() => setShowDocsModal(false)} className="close-btn" style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}>
                <X size={24} color="white" />
              </button>
            </div>
            <div className="modal-content" style={{ padding: '1.5rem' }}>
              <p style={{
                color: '#6b7280',
                marginBottom: '1.5rem',
                fontSize: 'clamp(0.9375rem, 2vw, 1.125rem)',
                lineHeight: '1.6'
              }}>
                Guide dettagliate per l'utilizzo dei vari componenti di Omnily
              </p>

              {/* Indice */}
              <div style={{
                background: '#f9fafb',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: 'clamp(1rem, 3vw, 1.5rem)',
                marginBottom: '2rem'
              }}>
                <h3 style={{
                  margin: '0 0 1rem 0',
                  fontSize: 'clamp(1rem, 3vw, 1.25rem)',
                  color: '#1f2937',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  📑 Indice
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <a href="#membership-guide" style={{
                    color: '#ef4444',
                    textDecoration: 'none',
                    fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'white'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <Package size={18} />
                    1. Sistema Membership
                  </a>
                  <div style={{
                    color: '#9ca3af',
                    fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    fontStyle: 'italic'
                  }}>
                    <CreditCard size={18} />
                    2. Gift Certificates (In arrivo...)
                  </div>
                  <div style={{
                    color: '#9ca3af',
                    fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    fontStyle: 'italic'
                  }}>
                    <Settings size={18} />
                    3. Sistema Pagamenti (In arrivo...)
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Membership Guide */}
                <div id="membership-guide" style={{
                  background: 'white',
                  border: '2px solid #ef4444',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 6px rgba(239, 68, 68, 0.1)',
                  scrollMarginTop: '2rem'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                  }}>
                    <Package size={32} />
                  </div>

                  <h3 style={{
                    margin: '0 0 0.75rem 0',
                    fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
                    color: '#1f2937',
                    fontWeight: 'bold'
                  }}>
                    Come Funzionano le Membership
                  </h3>

                  <p style={{
                    color: '#1f2937',
                    lineHeight: '1.8',
                    marginBottom: '1rem',
                    fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                    background: '#f8fafc',
                    padding: 'clamp(0.75rem, 2vw, 1rem)',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0'
                  }}>
                    <strong style={{ fontSize: 'clamp(0.9375rem, 2vw, 1.125rem)' }}>Cos'è una Membership?</strong><br/>
                    È come un abbonamento in palestra: il cliente paga una volta e può usare i tuoi servizi per un periodo di tempo (es. 30 giorni), con un numero massimo di volte al giorno o in totale.
                  </p>

                  <p style={{
                    color: '#1f2937',
                    lineHeight: '1.8',
                    marginBottom: '1.5rem',
                    fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                    background: '#f0f9ff',
                    padding: 'clamp(0.75rem, 2vw, 1rem)',
                    borderRadius: '8px',
                    border: '2px solid #bfdbfe'
                  }}>
                    <strong style={{ fontSize: 'clamp(0.9375rem, 2vw, 1.125rem)' }}>Esempio pratico:</strong><br/>
                    • Palestra: "Abbonamento Mensile 50€" → 1 ingresso/giorno per 30 giorni<br/>
                    • Bar: "Colazione Mensile 30€" → 1 colazione/giorno per 30 giorni<br/>
                    • Parrucchiere: "Pacchetto 10 Tagli 100€" → 10 tagli senza scadenza
                  </p>

                  {/* Passo 1 */}
                  <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: '#f0f9ff', borderLeft: '4px solid #3b82f6', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#1e40af', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 'bold' }}>
                      <span style={{
                        background: '#3b82f6',
                        color: 'white',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>1</span>
                      PRIMO PASSO: Crea un Template (Modello di Abbonamento)
                    </h4>

                    <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #bfdbfe' }}>
                      <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9375rem', color: '#1e293b', lineHeight: '1.8', fontWeight: 500 }}>
                        <strong>📍 Dove andare:</strong>
                      </p>
                      <ol style={{ margin: '0', paddingLeft: '1.25rem', fontSize: '0.9375rem', lineHeight: '1.8', color: '#334155' }}>
                        <li>Guarda il <strong>menu sulla sinistra</strong> dello schermo</li>
                        <li>Cerca e clicca su <strong>"Membership"</strong> (icona con pacchetto)</li>
                        <li>Si apre un pannello grande sulla destra</li>
                        <li>In alto vedi 3 tab: clicca su <strong>"Template"</strong></li>
                        <li>Clicca il bottone <strong>"+ Crea Nuovo Template"</strong></li>
                      </ol>
                    </div>

                    <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                      <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9375rem', color: '#1e293b', lineHeight: '1.8', fontWeight: 500 }}>
                        <strong>✏️ Cosa compilare nel form:</strong>
                      </p>
                      <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: '1.8' }}>
                        <div style={{ marginBottom: '0.75rem', paddingLeft: '1rem', borderLeft: '3px solid #3b82f6' }}>
                          <strong>Nome Template:</strong><br/>
                          Dai un nome chiaro. Es: "Abbonamento Mensile Palestra", "Colazioni 30 Giorni", "Pacchetto 10 Tagli"
                        </div>

                        <div style={{ marginBottom: '0.75rem', paddingLeft: '1rem', borderLeft: '3px solid #3b82f6' }}>
                          <strong>Descrizione:</strong><br/>
                          Spiega cosa include. Es: "Accesso illimitato alla palestra per 30 giorni, max 1 ingresso al giorno"
                        </div>

                        <div style={{ marginBottom: '0.75rem', paddingLeft: '1rem', borderLeft: '3px solid #3b82f6' }}>
                          <strong>Prezzo:</strong><br/>
                          Quanto costa. Es: 50 (il sistema aggiunge automaticamente €)
                        </div>

                        <div style={{ marginBottom: '0.75rem', paddingLeft: '1rem', borderLeft: '3px solid #3b82f6' }}>
                          <strong>Durata:</strong><br/>
                          Quanto tempo dura. Scegli il numero e il periodo (giorni/mesi/anni)<br/>
                          Es: 30 giorni, oppure 1 mese, oppure 1 anno
                        </div>

                        <div style={{ marginBottom: '0.75rem', paddingLeft: '1rem', borderLeft: '3px solid #10b981', background: '#f0fdf4', padding: '0.5rem', borderRadius: '4px' }}>
                          <strong>Limite Giornaliero (OPZIONALE):</strong><br/>
                          Quante volte al giorno può usarlo il cliente?<br/>
                          • Lascia vuoto = illimitato<br/>
                          • Metti 1 = solo una volta al giorno<br/>
                          • Metti 2 = massimo 2 volte al giorno
                        </div>

                        <div style={{ paddingLeft: '1rem', borderLeft: '3px solid #10b981', background: '#f0fdf4', padding: '0.5rem', borderRadius: '4px' }}>
                          <strong>Limite Totale (OPZIONALE):</strong><br/>
                          Quante volte IN TOTALE può usarlo?<br/>
                          • Lascia vuoto = illimitato<br/>
                          • Metti 10 = solo 10 volte in tutto<br/>
                          • Metti 20 = massimo 20 volte in tutto
                        </div>
                      </div>
                    </div>

                    <p style={{ margin: '1rem 0 0 0', fontSize: '0.875rem', color: '#1e40af', fontWeight: 600 }}>
                      ✅ Quando hai finito, clicca "Salva" e il template è pronto!
                    </p>
                  </div>

                  {/* Passo 2 */}
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0fdf4', borderLeft: '4px solid #10b981', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', color: '#065f46', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        background: '#10b981',
                        color: 'white',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 'bold'
                      }}>2</span>
                      Vendi una Membership al Cliente
                    </h4>
                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: '#1e293b', lineHeight: '1.6' }}>
                      Clicca su <strong>"Vendi Membership"</strong> nella sezione Membership.
                    </p>
                    <div style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6' }}>
                      <strong>Cosa fare:</strong>
                      <ul style={{ margin: '0.5rem 0 0 1.25rem', paddingLeft: 0 }}>
                        <li>Seleziona il <strong>cliente</strong> dalla lista</li>
                        <li>Scegli il <strong>template</strong> da vendere</li>
                        <li>Conferma il <strong>pagamento</strong></li>
                        <li>Il sistema genera automaticamente un <strong>codice univoco</strong> e un <strong>QR code</strong></li>
                        <li>Stampa o invia al cliente il codice membership</li>
                      </ul>
                    </div>
                  </div>

                  {/* Passo 3 */}
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', color: '#991b1b', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        background: '#ef4444',
                        color: 'white',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 'bold'
                      }}>3</span>
                      Valida l'Utilizzo del Cliente
                    </h4>
                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: '#1e293b', lineHeight: '1.6' }}>
                      Quando il cliente arriva, clicca su <strong>"Valida Utilizzo"</strong>.
                    </p>
                    <div style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6' }}>
                      <strong>Due modi per validare:</strong>
                      <ul style={{ margin: '0.5rem 0 0 1.25rem', paddingLeft: 0 }}>
                        <li><strong>Scansiona QR Code:</strong> Usa la fotocamera per scansionare il QR code del cliente</li>
                        <li><strong>Inserisci Codice:</strong> Digita manualmente il codice membership (es. SUB-ABC123)</li>
                      </ul>
                      <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                        <strong>Il sistema controlla:</strong>
                        <ul style={{ margin: '0.5rem 0 0 1rem', paddingLeft: 0 }}>
                          <li>✓ Membership valida e attiva</li>
                          <li>✓ Non scaduta</li>
                          <li>✓ Limite giornaliero non superato</li>
                          <li>✓ Utilizzi totali disponibili</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Passo 4 */}
                  <div style={{ marginBottom: '1rem', padding: '1rem', background: '#fefce8', borderLeft: '4px solid #eab308', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', color: '#854d0e', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        background: '#eab308',
                        color: 'white',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 'bold'
                      }}>4</span>
                      Monitora Statistiche
                    </h4>
                    <p style={{ margin: '0', fontSize: '0.875rem', color: '#1e293b', lineHeight: '1.6' }}>
                      Nel tab <strong>"Statistiche"</strong> puoi vedere: ricavi totali, membership attive, in scadenza (7 giorni), utilizzi del mese, e tasso di rinnovo.
                    </p>
                  </div>

                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: '#fef3f2',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: '#991b1b',
                    border: '2px solid #fecaca'
                  }}>
                    <strong>⚠️ Importante:</strong>
                    <ul style={{ margin: '0.5rem 0 0 1.25rem', paddingLeft: 0 }}>
                      <li>I limiti giornalieri si resettano automaticamente a mezzanotte</li>
                      <li>Le membership scadute non possono essere utilizzate</li>
                      <li>Un cliente può avere più membership attive contemporaneamente</li>
                    </ul>
                  </div>
                </div>

                {/* Gift Certificates - Coming Soon */}
                <div style={{
                  background: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  opacity: 0.6
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                  }}>
                    <Gift size={32} />
                  </div>

                  <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.25rem', color: '#1f2937' }}>
                    Gift Certificates
                  </h3>

                  <p style={{ color: '#6b7280', lineHeight: '1.6', fontSize: '0.875rem' }}>
                    Documentazione completa per la gestione dei buoni regalo digitali.
                  </p>

                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: '#f3f4f6',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    fontStyle: 'italic'
                  }}>
                    In arrivo...
                  </div>
                </div>

                {/* Payment System - Coming Soon */}
                <div style={{
                  background: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  opacity: 0.6
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                  }}>
                    <CreditCard size={32} />
                  </div>

                  <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.25rem', color: '#1f2937' }}>
                    Sistema Pagamenti
                  </h3>

                  <p style={{ color: '#6b7280', lineHeight: '1.6', fontSize: '0.875rem' }}>
                    Guida all'integrazione e gestione dei metodi di pagamento.
                  </p>

                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: '#f3f4f6',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    fontStyle: 'italic'
                  }}>
                    In arrivo...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        cancelText={confirmModalConfig.cancelText}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setShowConfirmModal(false)}
        type={confirmModalConfig.type}
      />
    </div>
  )
}

export default OrganizationsDashboard// Cache bust Ven 19 Set 2025 23:40:33 CEST
