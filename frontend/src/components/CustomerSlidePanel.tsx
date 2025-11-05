import React, { useState, useEffect, useMemo } from 'react';
import { X, Star, Gift, ShoppingBag, Plus, Phone, Mail, MapPin, Calendar, Award, Euro, Users, TrendingUp, Sparkles, Crown, QrCode, Target, Edit3 } from 'lucide-react';
import './CustomerSlidePanel.css';
import QRCodeGenerator from './QRCodeGenerator';
import SaleModal from './SaleModal';
import ConfirmModal from './UI/ConfirmModal';
import ModifyPointsModal from './ModifyPointsModal';
import TierUpgradeModal from './TierUpgradeModal';

import type { Customer, CustomerActivity } from '../lib/supabase';
import { customerActivitiesApi } from '../lib/supabase';
import { createPrintService } from '../services/printService';
import { rewardsService, type Reward } from '../services/rewardsService';
import {
  handleTierChange,
  getPendingTierUpgradeForCustomer,
  clearTierUpgradeNotification,
  cleanupOldTierUpgrades
} from '../utils/tierUpgradeHelper';

interface CustomerSlidePanelProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onAddPoints?: (customerId: string, points: number) => void;
  onNewTransaction?: (customerId: string, amount: number, pointsEarned: number) => Promise<{success: boolean; customer?: any; amount?: number; pointsEarned?: number; error?: string}>;
  pointsPerEuro?: number; // Configurazione dinamica punti per euro dall'organizzazione
  loyaltyTiers?: any[]; // Tiers di fedeltà per calcolo moltiplicatori dinamici
  bonusCategories?: any[]; // Categorie prodotti con moltiplicatori bonus
  pointsName?: string; // Nome personalizzato punti (es. "Gemme", "Stelle")
  organizationName?: string; // Nome organizzazione per email tier upgrade
}

const CustomerSlidePanel: React.FC<CustomerSlidePanelProps> = ({
  customer,
  isOpen,
  onClose,
  onAddPoints,
  onNewTransaction,
  pointsPerEuro = 1, // Default a 1 punto per euro se non specificato
  loyaltyTiers = [], // Default array vuoto se non specificato
  bonusCategories = [], // Default array vuoto se non specificato
  pointsName = 'Punti', // Default "Punti" se non specificato
  organizationName = 'OMNILY PRO' // Default name se non specificato
}) => {
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showRewardsSection, setShowRewardsSection] = useState(false);
  const [rewardsView, setRewardsView] = useState<'redeem' | 'redeemed'>('redeem'); // 'redeem' = Riscatta Premio, 'redeemed' = Premi Riscattati
  const [customerActivities, setCustomerActivities] = useState<CustomerActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [availableRewards, setAvailableRewards] = useState<Reward[]>([]);
  const [allRewards, setAllRewards] = useState<Reward[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [redemptionHistory, setRedemptionHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showModifyPointsModal, setShowModifyPointsModal] = useState(false);
  const [showTierUpgradeModal, setShowTierUpgradeModal] = useState(false);
  const [tierUpgradeData, setTierUpgradeData] = useState<{
    oldTierName: string;
    newTierName: string;
    newTierColor: string;
  } | null>(null);

  // State locale per tenere traccia dei dati customer aggiornati in tempo reale
  const [localCustomer, setLocalCustomer] = useState<Customer | null>(customer);

  // Sincronizza localCustomer con customer prop quando cambia (aggiornamento in tempo reale)
  useEffect(() => {
    if (customer) {
      setLocalCustomer(customer);
      console.log(`🔄 CustomerSlidePanel: customer aggiornato - Punti: ${customer.points}, Speso: €${customer.total_spent.toFixed(2)}`);
    }
  }, [customer?.points, customer?.total_spent, customer?.visits, customer?.id]);

  // Controlla se c'è un tier upgrade pending da mostrare quando si apre il panel
  useEffect(() => {
    if (!customer || !isOpen) return;

    // Cleanup vecchie notifiche (> 24h)
    cleanupOldTierUpgrades();

    // Controlla se c'è una notifica pending per questo cliente
    const pendingUpgrade = getPendingTierUpgradeForCustomer(customer.id);

    if (pendingUpgrade) {
      console.log(`🎊 Tier upgrade pending trovato per ${customer.name}:`, pendingUpgrade);

      // Mostra modale celebrativo
      setTierUpgradeData({
        oldTierName: pendingUpgrade.oldTierName,
        newTierName: pendingUpgrade.newTierName,
        newTierColor: pendingUpgrade.newTierColor
      });
      setShowTierUpgradeModal(true);

      // Rimuovi notifica dopo averla mostrata
      clearTierUpgradeNotification(customer.id);
    }
  }, [customer, isOpen]);

  // Carica attività del cliente quando il pannello si apre o cambia cliente
  useEffect(() => {
    const loadCustomerActivities = async () => {
      if (!customer || !isOpen) return;

      setLoadingActivities(true);
      try {
        console.log(`🔍 Caricamento attività per customer ID: ${customer.id}`);
        const activities = await customerActivitiesApi.getByCustomerId(customer.id, 5);
        console.log(`✅ Caricate ${activities.length} attività per ${customer.name}`, activities);
        setCustomerActivities(activities);
      } catch (error) {
        console.error('❌ Errore caricamento attività:', error);
        setCustomerActivities([]);
      } finally {
        setLoadingActivities(false);
      }
    };

    loadCustomerActivities();
  }, [customer, isOpen]);

  // Carica premi quando la sezione premi viene aperta
  useEffect(() => {
    const loadRewards = async () => {
      if (!customer || !showRewardsSection) return;

      setLoadingRewards(true);
      try {
        console.log(`🔍 Caricamento premi per org: ${customer.organization_id}`);

        // Calcola tier corrente del cliente
        const currentTier = calculateCustomerTier(customer.points);
        console.log(`🎯 Tier corrente cliente: ${currentTier.name}, Punti: ${customer.points}`);

        // Carica tutti i premi attivi per mostrare anche quelli non disponibili
        const active = await rewardsService.getActive(customer.organization_id);
        console.log(`📦 Premi attivi trovati:`, active);
        setAllRewards(active);

        // Carica premi disponibili in base a punti e tier
        const available = await rewardsService.getAvailableForCustomer(
          customer.organization_id,
          customer.points,
          currentTier.name,
          loyaltyTiers
        );
        console.log(`✅ Premi disponibili trovati:`, available);
        setAvailableRewards(available);

        console.log(`✅ Caricati ${active.length} premi totali, ${available.length} disponibili per ${customer.name}`);
      } catch (error) {
        console.error('❌ Errore caricamento premi:', error);
        setAllRewards([]);
        setAvailableRewards([]);
      } finally {
        setLoadingRewards(false);
      }
    };

    loadRewards();
  }, [customer, showRewardsSection, loyaltyTiers]);

  // Carica storico premi riscattati quando si seleziona la vista "redeemed"
  useEffect(() => {
    const loadRedemptionHistory = async () => {
      if (!customer || !showRewardsSection || rewardsView !== 'redeemed') return;

      setLoadingHistory(true);
      try {
        const history = await rewardsService.getRedemptionsByCustomer(
          customer.id,
          customer.organization_id,
          20 // Ultime 20 redemptions
        );
        setRedemptionHistory(history);
        console.log(`✅ Caricato storico di ${history.length} premi riscattati per ${customer.name}`);
      } catch (error) {
        console.error('❌ Errore caricamento storico:', error);
        setRedemptionHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadRedemptionHistory();
  }, [customer, showRewardsSection, rewardsView]);

  // Calcola messaggio conferma riscatto dinamicamente per mostrare sempre punti aggiornati
  // IMPORTANTE: useMemo DEVE essere prima del return condizionale per rispettare le Rules of Hooks
  const confirmRedeemMessage = useMemo(() => {
    if (!selectedReward || !localCustomer) return '';

    const pointsAfterRedemption = localCustomer.points - selectedReward.points_required;

    return `Vuoi riscattare "${selectedReward.name}" per ${selectedReward.points_required} ${pointsName.toLowerCase()}?\n\n${pointsName} attuali: ${localCustomer.points}\n${pointsName} dopo riscatto: ${pointsAfterRedemption}`;
  }, [selectedReward, localCustomer, pointsName]);

  if (!customer || !localCustomer) return null;

  // Funzioni utility per gestione tiers dinamici
  const calculateCustomerTier = (points: number): any => {
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

  // Calcola tier dinamico del cliente corrente usando localCustomer per dati aggiornati
  const currentTier = calculateCustomerTier(localCustomer.points);

  const getTierColor = (tierName?: string) => {
    // Se abbiamo tier dinamici configurati, cerca il colore dal tier
    if (loyaltyTiers && loyaltyTiers.length > 0) {
      const targetTierName = tierName || currentTier.name;
      const tier = loyaltyTiers.find(t => t.name === targetTierName);
      if (tier && tier.color) {
        return tier.color;
      }
    }

    // Fallback: usa il colore dal tier corrente se disponibile
    if (currentTier.color) {
      return currentTier.color;
    }

    // Ultimo fallback: colore arancione di default
    return '#F59E0B';
  };

  const updateCustomerDisplay = () => {
    // Aggiorna customer display con info cliente
    if (typeof window !== 'undefined' && (window as any).updateCustomerDisplay) {
      (window as any).updateCustomerDisplay({
        type: 'CUSTOMER_SELECTED',
        customer: {
          name: customer.name,
          points: customer.points,
          tier: customer.tier,
          visits: customer.visits
        }
      });
    }
  };

  // Funzione per riscattare un premio
  const handleRedeemReward = async (reward: Reward) => {
    if (!customer) return;
    setSelectedReward(reward);
    setShowConfirmModal(true);
  };

  const handleModifyPoints = async (pointsChange: number, reason: string) => {
    if (!customer || !onAddPoints || !localCustomer) return;

    setShowModifyPointsModal(false);

    // Cattura punti vecchi prima della modifica
    const oldPoints = localCustomer.points;

    // Usa onAddPoints che gestisce già l'update al database
    await onAddPoints(customer.id, pointsChange);

    // Aggiorna localCustomer immediatamente con i nuovi punti
    const newPoints = localCustomer.points + pointsChange;
    setLocalCustomer({ ...localCustomer, points: newPoints });
    console.log(`🔄 LocalCustomer aggiornato: ${localCustomer.points} -> ${newPoints} punti dopo modifica manuale`);

    // 🎯 CONTROLLA CAMBIO TIER
    try {
      await handleTierChange({
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email || '',
        organizationId: customer.organization_id,
        organizationName,
        oldPoints,
        newPoints,
        loyaltyTiers,
        pointsName
      });
    } catch (error) {
      console.error('❌ Errore controllo tier change:', error);
    }

    // Registra l'attività con il motivo
    if (customer.organization_id) {
      try {
        console.log('📝 Creazione attività modifica punti:', {
          customer_id: customer.id,
          organization_id: customer.organization_id,
          type: 'points_added',
          description: `${pointsChange > 0 ? '+' : ''}${pointsChange} punti - ${reason}`,
          points: pointsChange
        });
        const activity = await customerActivitiesApi.create({
          customer_id: customer.id,
          organization_id: customer.organization_id,
          type: 'points_added',
          description: `${pointsChange > 0 ? '+' : ''}${pointsChange} punti - ${reason}`,
          points: pointsChange
        });
        console.log('✅ Attività creata:', activity);
      } catch (error) {
        console.error('❌ Errore creazione attività:', error);
      }
    }

    // Aggiorna display
    updateCustomerDisplay();

    // Ricarica attività
    try {
      setTimeout(async () => {
        const refreshedActivities = await customerActivitiesApi.getByCustomerId(customer.id, 5);
        setCustomerActivities(refreshedActivities);
      }, 500);
    } catch (error) {
      console.error('❌ Errore aggiornamento attività:', error);
    }
  };

  const confirmRedeemReward = async () => {
    if (!customer || !selectedReward || !localCustomer) return;

    setShowConfirmModal(false);

    try {
      console.log(`🎁 Riscatto premio "${selectedReward.name}" per ${customer.name}...`);

      // Calcola tier corrente
      const currentTier = calculateCustomerTier(localCustomer.points);

      // Chiama API per riscattare il premio
      const result = await rewardsService.redeemForCustomer(
        customer.organization_id,
        customer.id,
        selectedReward.id,
        localCustomer.points,
        currentTier.name
      );

      if (!result.success) {
        console.error(`❌ Errore riscatto: ${result.error}`);
        return;
      }

      console.log(`✅ Premio "${selectedReward.name}" riscattato! Punti scalati: -${selectedReward.points_required}`);

      // Aggiorna localCustomer immediatamente con i nuovi punti
      const newPoints = localCustomer.points - selectedReward.points_required;
      setLocalCustomer({ ...localCustomer, points: newPoints });
      console.log(`🔄 LocalCustomer aggiornato: ${localCustomer.points} -> ${newPoints} punti dopo riscatto premio`);

      // Chiudi e riapri la sezione per ricaricare i dati
      setShowRewardsSection(false);
      setTimeout(() => setShowRewardsSection(true), 100);

      // Aggiorna il customer display se disponibile
      updateCustomerDisplay();

      setSelectedReward(null);

    } catch (error) {
      console.error('❌ Errore riscatto premio:', error);
      setSelectedReward(null);
    }
  };

  // Funzione per riprodurre suono coin.wav o suono programmatico
  const playCoinSound = () => {
    try {
      console.log('🔊 Tentativo riproduzione suono monete...');

      // Prima prova con il file coin.wav
      const audio = new Audio('/sounds/coin.wav');
      audio.volume = 0.7; // Volume al 70%

      audio.addEventListener('loadeddata', () => {
        console.log('✅ File coin.wav caricato correttamente');
      });

      audio.addEventListener('error', (e) => {
        console.error('❌ File coin.wav non supportato, uso suono programmatico');
        // Fallback: suono programmatico
        playProgrammaticCoinSound();
      });

      audio.play()
        .then(() => {
          console.log('✅ Riproduzione coin.wav iniziata');
        })
        .catch(error => {
          console.error('❌ Errore riproduzione coin.wav, uso suono programmatico');
          // Fallback: suono programmatico
          playProgrammaticCoinSound();
        });
    } catch (error) {
      console.error('❌ Errore generale, uso suono programmatico');
      playProgrammaticCoinSound();
    }
  };

  // Suono programmatico usando Web Audio API
  const playProgrammaticCoinSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Crea un suono "ding" per le monete
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Frequenze per effetto moneta
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);

      // Volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

      oscillator.type = 'sine';
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

      console.log('✅ Suono programmatico monete riprodotto');
    } catch (error) {
      console.error('❌ Errore suono programmatico:', error);
    }
  };

  const handleSaleConfirm = async (customerId: string, amount: number, pointsEarned: number) => {
    if (!customer) return;

    console.log(`Iniziando transazione: €${amount} per ${customer.name}, +${pointsEarned} punti`);

    try {
      // Processare la transazione e aspettare l'esito
      if (onNewTransaction) {
        const result = await onNewTransaction(customerId, amount, pointsEarned);

        if (result.success) {
          // Transazione COMPLETATA con successo!
          console.log('Transazione completata con successo!');

          // 🔊 SUONO CELEBRAZIONE - Riprodotto dal POS principale
          playCoinSound();
          console.log('🔊 Suono coin.wav riprodotto dal POS durante celebrazione');

          // Suono bridge Android opzionale - DISABILITATO TEMPORANEAMENTE
          // if (typeof window !== 'undefined' && (window as any).OmnilyPOS?.beep) {
          //   (window as any).OmnilyPOS.beep("1", "300"); // Beep lungo di successo
          // }

          // CELEBRAZIONE finale con pioggia di monete
          if (typeof window !== 'undefined' && (window as any).updateCustomerDisplay) {
            console.log('🎉 Inviando SALE_CELEBRATION al customer display...');
            (window as any).updateCustomerDisplay({
              type: 'SALE_CELEBRATION',
              celebration: {
                customerName: customer.name,
                amount: amount,
                pointsEarned: pointsEarned,
                oldPoints: customer.points,
                newTotalPoints: result.customer?.points || (customer.points + pointsEarned),
                tier: customer.tier,
                showCoinsRain: true, // Attiva pioggia di monete
                duration: 4000 // Celebrazione per 4 secondi
              }
            });
            console.log('✅ Messaggio SALE_CELEBRATION inviato');
          } else {
            console.error('❌ updateCustomerDisplay non disponibile!');
          }

          // 🖨️ STAMPA AUTOMATICA SCONTRINO
          try {
            console.log('🖨️ Iniziando stampa automatica scontrino...');

            // Configurazione stampante
            const printConfig = {
              storeName: 'OMNILY PRO',
              storeAddress: 'Via Roma 123, Milano',
              storePhone: 'Tel: 02-12345678',
              storeTax: 'P.IVA: 12345678901',
              paperWidth: 384, // 58mm
              fontSizeNormal: 24,
              fontSizeLarge: 30,
              printDensity: 0
            };

            // Dati scontrino
            const receiptData = {
              receiptNumber: `R${Date.now().toString().slice(-6)}`,
              timestamp: new Date(),
              items: [{
                name: 'Transazione POS',
                quantity: 1,
                price: amount,
                total: amount
              }],
              subtotal: amount,
              tax: amount * 0.22,
              total: amount,
              paymentMethod: 'Contanti',
              cashierName: 'POS Operatore',
              customerPoints: pointsEarned,
              loyaltyCard: customer.id
            };

            // Crea servizio stampa e stampa
            const printService = createPrintService(printConfig);
            const initialized = await printService.initialize();

            if (initialized) {
              const printed = await printService.printReceipt(receiptData);
              if (printed) {
                console.log('✅ Scontrino stampato con successo!');
              } else {
                console.error('❌ Errore durante la stampa dello scontrino');
              }
            } else {
              console.error('❌ Impossibile inizializzare la stampante');
            }
          } catch (printError) {
            console.error('❌ Errore stampa scontrino:', printError);
          }

          // 🎯 CONTROLLA CAMBIO TIER dopo vendita
          try {
            const oldPoints = customer.points;
            const newPoints = result.customer?.points || (customer.points + pointsEarned);

            await handleTierChange({
              customerId: customer.id,
              customerName: customer.name,
              customerEmail: customer.email || '',
              organizationId: customer.organization_id,
              organizationName,
              oldPoints,
              newPoints,
              loyaltyTiers,
              pointsName
            });
          } catch (error) {
            console.error('❌ Errore controllo tier change dopo vendita:', error);
          }

          // Ricarica le attività per mostrare la nuova transazione
          try {
            const refreshedActivities = await customerActivitiesApi.getByCustomerId(customer.id, 5);
            setCustomerActivities(refreshedActivities);
            console.log('✅ Attività aggiornate dopo transazione completata');
          } catch (error) {
            console.error('❌ Errore aggiornamento attività dopo transazione:', error);
          }

          // Chiudi il modale dopo la vendita completata
          setShowSaleModal(false);

        } else {
          // Transazione FALLITA
          console.error('Transazione fallita:', result.error);

          // Mostra errore al customer display
          if (typeof window !== 'undefined' && (window as any).updateCustomerDisplay) {
            (window as any).updateCustomerDisplay({
              type: 'SALE_ERROR',
              error: {
                message: 'Errore durante la transazione',
                details: result.error || 'Errore sconosciuto'
              }
            });
          }

          // Non chiudere il modale in caso di errore, così l'utente può riprovare
        }
      }

    } catch (error) {
      console.error('Errore durante handleSaleConfirm:', error);

      // Mostra errore generico
      if (typeof window !== 'undefined' && (window as any).updateCustomerDisplay) {
        (window as any).updateCustomerDisplay({
          type: 'SALE_ERROR',
          error: {
            message: 'Errore di sistema',
            details: 'Si è verificato un errore imprevisto'
          }
        });
      }
    }
  };

  // NON aggiorniamo automaticamente il customer display quando apriamo il pannello
  // Questo causava interferenze con popup indesiderati sul display principale
  // L'aggiornamento del customer display avviene solo tramite azioni specifiche

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="customer-slide-panel-overlay"
          onClick={onClose}
        />
      )}

      {/* Slide Panel */}
      <div className={`customer-slide-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="customer-panel-header">
          <div className="customer-slide-panel-header-info">
            <h2>{customer.name}</h2>
            <div
              className="customer-slide-panel-tier"
              style={{ backgroundColor: getTierColor(currentTier.name) }}
            >
              {currentTier.name === 'Platinum' && <Crown size={16} />}
              {currentTier.name === 'Gold' && <Sparkles size={16} />}
              {currentTier.name === 'Silver' && <Award size={16} />}
              {currentTier.name === 'Bronze' && <Star size={16} />}
              {currentTier.name}</div>
          </div>
          <button className="customer-panel-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="customer-slide-panel-quick-stats">
          <div className="customer-slide-panel-stat-item">
            <div className="customer-slide-panel-stat-icon">
              <Award size={24} />
            </div>
            <div className="customer-slide-panel-stat-number">{localCustomer.points}</div>
            <div className="customer-slide-panel-stat-label">{pointsName}</div>
          </div>
          <div className="customer-slide-panel-stat-item">
            <div className="customer-slide-panel-stat-icon">
              <Euro size={24} />
            </div>
            <div className="customer-slide-panel-stat-number">€{localCustomer.total_spent.toFixed(2)}</div>
            <div className="customer-slide-panel-stat-label">Speso</div>
          </div>
          <div className="customer-slide-panel-stat-item">
            <div className="customer-slide-panel-stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="customer-slide-panel-stat-number">{localCustomer.visits}</div>
            <div className="customer-slide-panel-stat-label">Visite</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="customer-panel-actions">
          <button
            className="customer-slide-panel-action-btn customer-slide-panel-action-btn-primary"
            onClick={() => setShowModifyPointsModal(true)}
          >
            <Edit3 size={20} />
            Modifica {pointsName}
          </button>
          <button
            className="customer-slide-panel-action-btn customer-slide-panel-action-btn-secondary"
            onClick={() => setShowSaleModal(true)}
          >
            <ShoppingBag size={20} />
            Nuova Vendita
          </button>
          <button
            className="customer-slide-panel-action-btn customer-slide-panel-action-btn-tertiary"
            onClick={() => setShowRewardsSection(!showRewardsSection)}
          >
            <Gift size={20} />
            Premi
          </button>
        </div>

        {/* Rewards Section - Sezione Premi */}
        {showRewardsSection && (
          <div className="customer-slide-panel-rewards-section">
            <h3>
              <Gift size={18} />
              Gestione Premi
            </h3>

            {/* Two buttons: Riscatta Premio | Premi Riscattati */}
            <div className="rewards-section-actions">
              <button
                className={`rewards-section-btn ${rewardsView === 'redeem' ? 'active' : ''}`}
                onClick={() => setRewardsView('redeem')}
              >
                <Award size={18} />
                Riscatta Premio
              </button>
              <button
                className={`rewards-section-btn ${rewardsView === 'redeemed' ? 'active' : ''}`}
                onClick={() => setRewardsView('redeemed')}
              >
                <Star size={18} />
                Premi Riscattati
              </button>
            </div>

            {/* Content based on selected view */}
            <div className="rewards-section-content">
              {rewardsView === 'redeem' ? (
                // RISCATTA PREMIO - Lista premi disponibili
                <div className="rewards-available">
                  <p className="rewards-section-info">
                    <Target size={16} />
                    Hai <strong>{localCustomer.points} {pointsName.toLowerCase()}</strong> disponibili
                  </p>
                  <p className="rewards-section-subtitle">
                    Seleziona un premio da riscattare:
                  </p>

                  {/* Lista premi disponibili */}
                  <div className="rewards-list">
                    {loadingRewards ? (
                      <p style={{ textAlign: 'center', color: '#6b7280' }}>Caricamento premi...</p>
                    ) : allRewards.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#6b7280' }}>Nessun premio configurato</p>
                    ) : (
                      allRewards.map(reward => {
                        const isAvailable = availableRewards.some(r => r.id === reward.id);
                        const canRedeem = isAvailable && localCustomer.points >= reward.points_required;

                        return (
                          <div
                            key={reward.id}
                            className={`reward-item ${!canRedeem ? 'disabled' : ''}`}
                          >
                            <div className="reward-item-header">
                              <Award size={20} className="reward-icon" />
                              <div className="reward-info">
                                <h4>{reward.name}</h4>
                                <p className="reward-points">{reward.points_required} {pointsName.toLowerCase()}</p>
                                {reward.required_tier && (
                                  <p className="reward-tier-requirement" style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                                    Richiede: {reward.required_tier}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              className="reward-redeem-btn"
                              disabled={!canRedeem}
                              onClick={() => handleRedeemReward(reward)}
                            >
                              {!isAvailable && reward.required_tier
                                ? `Richiede ${reward.required_tier}`
                                : !canRedeem
                                ? `${pointsName} Insufficienti`
                                : 'Riscatta'}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                // PREMI RISCATTATI - Storico premi
                <div className="rewards-redeemed">
                  <p className="rewards-section-subtitle">
                    Storico dei premi riscattati:
                  </p>

                  {/* Lista premi riscattati */}
                  <div className="rewards-history-list">
                    {loadingHistory ? (
                      <p style={{ textAlign: 'center', color: '#6b7280' }}>Caricamento storico...</p>
                    ) : redemptionHistory.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#6b7280' }}>Nessun premio riscattato ancora</p>
                    ) : (
                      redemptionHistory.map(redemption => (
                        <div key={redemption.id} className="reward-history-item">
                          <div className="reward-history-info">
                            <Sparkles size={18} className="reward-history-icon" />
                            <div>
                              <h5>{redemption.reward_name}</h5>
                              <p className="reward-history-date">
                                {new Date(redemption.redeemed_at).toLocaleDateString('it-IT', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <span className="reward-history-points">-{redemption.points_spent} pt</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="customer-slide-panel-contact">
          <h3>Contatti</h3>
          <div className="customer-slide-panel-contact-item">
            <Mail size={18} />
            <span>{customer.email}</span>
          </div>
          {customer.phone && (
            <div className="customer-slide-panel-contact-item">
              <Phone size={18} />
              <span>{customer.phone}</span>
            </div>
          )}
          {customer.address && (
            <div className="customer-slide-panel-contact-item">
              <MapPin size={18} />
              <span>{customer.address}</span>
            </div>
          )}
          <div className="customer-slide-panel-contact-item">
            <Calendar size={18} />
            <span>Iscritto: {new Date(customer.created_at).toLocaleDateString('it-IT')}</span>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="customer-slide-panel-qr">
          <h3><QrCode size={18} /> Codice QR Cliente</h3>
          <div className="customer-slide-panel-qr-container">
            <QRCodeGenerator
              value={`OMNILY_CUSTOMER:${customer.id}`}
              size={150}
              level="M"
              className="customer-qr-code"
            />
            <p className="customer-slide-panel-qr-text">
              Mostra questo QR code al POS per l'accesso rapido
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="customer-slide-panel-activity">
          <h3>Attività Recente</h3>
          {loadingActivities ? (
            <div className="customer-slide-panel-activity-item">
              <div className="customer-slide-panel-activity-date">-</div>
              <div className="customer-slide-panel-activity-text">Caricamento attività...</div>
            </div>
          ) : customerActivities.length > 0 ? (
            customerActivities.map((activity) => {
              const activityDate = new Date(activity.created_at);
              const now = new Date();
              const diffInDays = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));

              let dateLabel = '';
              if (diffInDays === 0) {
                dateLabel = 'Oggi';
              } else if (diffInDays === 1) {
                dateLabel = 'Ieri';
              } else if (diffInDays < 7) {
                dateLabel = `${diffInDays} giorni fa`;
              } else {
                dateLabel = activityDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
              }

              return (
                <div key={activity.id} className="customer-slide-panel-activity-item">
                  <div className="customer-slide-panel-activity-date">{dateLabel}</div>
                  <div className="customer-slide-panel-activity-text">{activity.description}</div>
                </div>
              );
            })
          ) : (
            <div className="customer-slide-panel-activity-item">
              <div className="customer-slide-panel-activity-date">-</div>
              <div className="customer-slide-panel-activity-text">Nessuna attività recente</div>
            </div>
          )}
        </div>
      </div>

      {/* Sale Modal */}
      <SaleModal
        customer={localCustomer}
        isOpen={showSaleModal}
        onClose={() => setShowSaleModal(false)}
        onConfirm={handleSaleConfirm}
        pointsPerEuro={pointsPerEuro}
        loyaltyTiers={loyaltyTiers}
        currentTier={currentTier}
        bonusCategories={bonusCategories}
        pointsName={pointsName}
      />

      {/* Confirm Redeem Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="Conferma Riscatto Premio"
        message={confirmRedeemMessage}
        confirmText="Riscatta"
        cancelText="Annulla"
        type="info"
        onConfirm={confirmRedeemReward}
        onCancel={() => {
          setShowConfirmModal(false);
          setSelectedReward(null);
        }}
      />

      {/* Modify Points Modal */}
      <ModifyPointsModal
        isOpen={showModifyPointsModal}
        customer={localCustomer}
        onClose={() => setShowModifyPointsModal(false)}
        onConfirm={handleModifyPoints}
        pointsName={pointsName}
      />

      {/* Tier Upgrade Modal - Celebration */}
      {tierUpgradeData && (
        <TierUpgradeModal
          isOpen={showTierUpgradeModal}
          customerName={customer.name}
          oldTierName={tierUpgradeData.oldTierName}
          newTierName={tierUpgradeData.newTierName}
          newTierColor={tierUpgradeData.newTierColor}
          pointsName={pointsName}
          onClose={() => {
            setShowTierUpgradeModal(false);
            setTierUpgradeData(null);
          }}
        />
      )}
    </>
  );
};

export default CustomerSlidePanel;