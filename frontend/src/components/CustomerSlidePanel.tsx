import React, { useState, useEffect, useMemo } from 'react';
import { X, Star, Gift, ShoppingBag, Plus, Phone, Mail, MapPin, Calendar, Award, Euro, Users, TrendingUp, Sparkles, Crown, QrCode, Target, Edit3, UserCog, Trophy } from 'lucide-react';
import './CustomerSlidePanel.css';
import QRCodeGenerator from './QRCodeGenerator';
import SaleModal from './SaleModal';
import ConfirmModal from './UI/ConfirmModal';
import ModifyPointsModal from './ModifyPointsModal';
import TierUpgradeModal from './TierUpgradeModal';
import EditCustomerModal from './EditCustomerModal';
import RewardsModal from './RewardsModal';
import SaleSuccessModal from './SaleSuccessModal';

import type { Customer, CustomerActivity } from '../lib/supabase';
import { customerActivitiesApi, supabase } from '../lib/supabase';
import { createPrintService } from '../services/printService';
import { rewardsService, type Reward } from '../services/rewardsService';
import {
  handleTierChange,
  getPendingTierUpgradeForCustomer,
  clearTierUpgradeNotification,
  cleanupOldTierUpgrades
} from '../utils/tierUpgradeHelper';
import { logPointsAdded, logPointsRemoved, logRewardRedeemed, logSale } from '../lib/activityLogger';

interface CustomerSlidePanelProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onAddPoints?: (customerId: string, points: number) => void;
  onNewTransaction?: (customerId: string, amount: number, pointsEarned: number) => Promise<{success: boolean; customer?: any; amount?: number; pointsEarned?: number; error?: string}>;
  onUpdateCustomer?: (customerId: string, updates: Partial<Customer>) => Promise<void>;
  pointsPerEuro?: number; // Configurazione dinamica punti per euro dall'organizzazione
  loyaltyTiers?: any[]; // Tiers di fedeltà per calcolo moltiplicatori dinamici
  bonusCategories?: any[]; // Categorie prodotti con moltiplicatori bonus
  pointsName?: string; // Nome personalizzato punti (es. "Gemme", "Stelle")
  organizationName?: string; // Nome organizzazione per email tier upgrade
  organizationAddress?: string; // Indirizzo organizzazione per stampe
  organizationPhone?: string; // Telefono organizzazione per stampe
  organizationTax?: string; // Partita IVA organizzazione per stampe
  primaryColor?: string; // Colore primario organizzazione
  secondaryColor?: string; // Colore secondario organizzazione
  operatorName?: string; // Nome operatore per scontrini
  organizationId?: string; // ID organizzazione per Gaming Module
  onOpenGamingHub?: () => void; // Callback per aprire Gaming Hub
}

const CustomerSlidePanel: React.FC<CustomerSlidePanelProps> = ({
  customer,
  isOpen,
  onClose,
  onAddPoints,
  onNewTransaction,
  onUpdateCustomer,
  pointsPerEuro = 1, // Default a 1 punto per euro se non specificato
  loyaltyTiers = [], // Default array vuoto se non specificato
  bonusCategories = [], // Default array vuoto se non specificato
  pointsName = 'Punti', // Default "Punti" se non specificato
  organizationName = 'OMNILY PRO', // Default name se non specificato
  organizationAddress = '', // Default vuoto
  organizationPhone = '', // Default vuoto
  organizationTax = '', // Default vuoto
  primaryColor = '#dc2626', // Default red se non specificato
  secondaryColor = '#ef4444', // Default lighter red se non specificato
  operatorName = 'Operatore', // Default "Operatore" se non specificato
  organizationId = '', // Default vuoto
  onOpenGamingHub
}) => {
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [customerActivities, setCustomerActivities] = useState<CustomerActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [showModifyPointsModal, setShowModifyPointsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTierUpgradeModal, setShowTierUpgradeModal] = useState(false);
  const [tierUpgradeData, setTierUpgradeData] = useState<{
    oldTierName: string;
    newTierName: string;
    newTierColor: string;
  } | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showSaleSuccessModal, setShowSaleSuccessModal] = useState(false);
  const [saleSuccessData, setSaleSuccessData] = useState<{
    customerName: string;
    pointsEarned: number;
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

      // 📺 INVIA TIER_UPGRADE al customer display 4"
      if (typeof window !== 'undefined' && (window as any).updateCustomerDisplay) {
        console.log('👑 Inviando TIER_UPGRADE al customer display...');

        // Trova moltiplicatore del nuovo tier
        const newTier = loyaltyTiers?.find(t => t.name === pendingUpgrade.newTierName);
        const multiplier = newTier ? parseFloat(newTier.multiplier) : 1;

        (window as any).updateCustomerDisplay({
          type: 'TIER_UPGRADE',
          tierUpgrade: {
            customerName: customer.name,
            oldTierName: pendingUpgrade.oldTierName,
            newTierName: pendingUpgrade.newTierName,
            newTierColor: pendingUpgrade.newTierColor,
            multiplier: multiplier
          }
        });
        console.log('✅ Messaggio TIER_UPGRADE inviato al customer display');
      }

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

        // 📝 LOG STAFF ACTIVITY
        if (pointsChange > 0) {
          await logPointsAdded(
            customer.organization_id,
            customer.id,
            customer.name,
            pointsChange,
            reason
          );
        } else {
          await logPointsRemoved(
            customer.organization_id,
            customer.id,
            customer.name,
            Math.abs(pointsChange),
            reason
          );
        }
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

  // Funzione per riprodurre suono slot machine - DA FILE AUDIO
  const playCoinSound = () => {
    try {
      console.log('🔊 Riproduzione suono slot machine da file audio...');
      const audio = new Audio('/sounds/slot-machine-coin-payout-1-188227.mp3');
      audio.volume = 1.0; // Volume al 100% - regolabile dal dispositivo
      audio.play()
        .then(() => console.log('✅ Suono slot machine riprodotto da file!'))
        .catch(err => console.error('❌ Errore riproduzione audio:', err));
    } catch (error) {
      console.error('❌ Errore riproduzione suono:', error);
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

  // Funzione per creare monete che cadono sullo schermo GRANDE (8") - SPETTACOLARE! 🎉💰
  const createCoinsRainOnMainScreen = () => {
    console.log('[CoinsRain MainScreen] 🎊 Iniziando SUPER pioggia monete spettacolare!');

    let coinsContainer = document.getElementById('main-coins-container');
    if (!coinsContainer) {
      coinsContainer = document.createElement('div');
      coinsContainer.id = 'main-coins-container';
      coinsContainer.style.position = 'fixed';
      coinsContainer.style.top = '0';
      coinsContainer.style.left = '0';
      coinsContainer.style.width = '100vw';
      coinsContainer.style.height = '100vh';
      coinsContainer.style.pointerEvents = 'none';
      coinsContainer.style.zIndex = '9998';
      document.body.appendChild(coinsContainer);
    } else {
      coinsContainer.innerHTML = '';
    }

    // ✨ ESPLOSIONE INIZIALE dal centro! 12 monete grandi
    for (let i = 0; i < 12; i++) {
      const coin = document.createElement('div');
      coin.style.position = 'fixed';
      coin.style.left = '50%';
      coin.style.top = '50%';
      coin.style.width = '60px';
      coin.style.height = '60px';
      coin.style.backgroundImage = 'url(https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/moneyomily.png)';
      coin.style.backgroundSize = 'contain';
      coin.style.backgroundRepeat = 'no-repeat';
      coin.style.backgroundPosition = 'center';
      coin.style.filter = 'drop-shadow(0 0 20px rgba(255, 215, 0, 1)) brightness(1.3)';
      coin.style.pointerEvents = 'none';
      coin.style.zIndex = '9999';

      const angle = (Math.PI * 2 * i) / 12;
      const velocityX = Math.cos(angle) * 200;
      const velocityY = Math.sin(angle) * 200 - 100;

      coin.animate([
        {
          transform: 'translate(-50%, -50%) scale(0) rotate(0deg)',
          opacity: 1
        },
        {
          transform: `translate(calc(-50% + ${velocityX}px), calc(-50% + ${velocityY}px)) scale(1.5) rotate(${360 + Math.random() * 360}deg)`,
          opacity: 1,
          offset: 0.3
        },
        {
          transform: `translate(calc(-50% + ${velocityX}px), calc(-50% + ${velocityY + 800}px)) scale(1) rotate(${720 + Math.random() * 360}deg)`,
          opacity: 0
        }
      ], {
        duration: 2000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      });

      coinsContainer!.appendChild(coin);
      setTimeout(() => coin.remove(), 2100);
    }

    // 💰 CASCATA PRINCIPALE: 45 monete che cadono dall'alto con fisica realistica
    for (let i = 0; i < 45; i++) {
      setTimeout(() => {
        const coin = document.createElement('div');
        const size = 35 + Math.random() * 25; // Dimensioni variabili 35-60px
        const startX = Math.random() * 100;
        const rotation = Math.random() * 720 + 360;
        const duration = 3000 + Math.random() * 1500; // Durata più lunga per sincronizzazione col suono
        const delay = Math.random() * 100;

        coin.style.position = 'fixed';
        coin.style.left = startX + '%';
        coin.style.top = '-100px';
        coin.style.width = size + 'px';
        coin.style.height = size + 'px';
        coin.style.backgroundImage = 'url(https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/moneyomily.png)';
        coin.style.backgroundSize = 'contain';
        coin.style.backgroundRepeat = 'no-repeat';
        coin.style.backgroundPosition = 'center';
        coin.style.filter = `drop-shadow(0 8px 16px rgba(255, 215, 0, ${0.6 + Math.random() * 0.4})) brightness(${1.1 + Math.random() * 0.3})`;
        coin.style.pointerEvents = 'none';
        coin.style.zIndex = '9998';

        // Animazione con rimbalzo e rotazione
        coin.animate([
          {
            transform: 'translateY(-100px) rotate(0deg) scale(0.5)',
            opacity: 0
          },
          {
            transform: `translateY(0px) rotate(${rotation * 0.3}deg) scale(1)`,
            opacity: 1,
            offset: 0.1
          },
          {
            transform: `translateY(calc(100vh - 50px)) rotate(${rotation}deg) scale(0.8)`,
            opacity: 1,
            offset: 0.85
          },
          {
            transform: `translateY(calc(100vh + 20px)) rotate(${rotation + 180}deg) scale(0.5)`,
            opacity: 0
          }
        ], {
          duration,
          delay,
          easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
        });

        coinsContainer!.appendChild(coin);
        setTimeout(() => coin.remove(), duration + delay + 100);
      }, i * 50); // Rilascio più distribuito nel tempo
    }

    // ✨ PARTICELLE SCINTILLANTI: 25 particelle dorate
    for (let i = 0; i < 25; i++) {
      setTimeout(() => {
        const particle = document.createElement('div');
        const size = 4 + Math.random() * 8;
        const startX = Math.random() * 100;
        const drift = (Math.random() - 0.5) * 200;

        particle.style.position = 'fixed';
        particle.style.left = startX + '%';
        particle.style.top = '0';
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.borderRadius = '50%';
        particle.style.background = `radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 215, 0, ${0.8 + Math.random() * 0.2}) 50%, rgba(255, 165, 0, 0) 100%)`;
        particle.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.8)';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '9999';

        particle.animate([
          {
            transform: `translate(0, -20px) scale(0)`,
            opacity: 0
          },
          {
            transform: `translate(${drift * 0.3}px, ${window.innerHeight * 0.3}px) scale(1)`,
            opacity: 1,
            offset: 0.2
          },
          {
            transform: `translate(${drift}px, ${window.innerHeight + 50}px) scale(0.5)`,
            opacity: 0
          }
        ], {
          duration: 3500 + Math.random() * 1500, // Durata più lunga per accompagnare il suono
          easing: 'ease-out'
        });

        coinsContainer!.appendChild(particle);
        setTimeout(() => particle.remove(), 5100);
      }, i * 80); // Distribuite nel tempo
    }

    console.log('[CoinsRain MainScreen] 🎉 82 elementi creati (12 esplosione + 45 monete + 25 particelle) - sincronizzati con il suono!');
  };

  const handleSaleConfirm = async (customerId: string, amount: number, pointsEarned: number) => {
    if (!customer) return;

    console.log(`⚡ Iniziando transazione IMMEDIATA: €${amount} per ${customer.name}, +${pointsEarned} punti`);

    // ⚡ FEEDBACK IMMEDIATO - PRIMA di aspettare il database!
    // 🔊 SUONO parte SUBITO al click
    playCoinSound();
    console.log('🔊 Suono cash register riprodotto IMMEDIATAMENTE!');

    // 🎉 Mostra modale verde "Vendita Registrata!"
    // Nota: La fontana di monete viene triggerata da SaleModal DOPO che questo modale appare
    setSaleSuccessData({
      customerName: customer.name,
      pointsEarned
    });
    setShowSaleSuccessModal(true);
    console.log('✅ Modale successo mostrato IMMEDIATAMENTE!');

    try {
      // Processare la transazione in background (non blocca l'animazione)
      if (onNewTransaction) {
        const result = await onNewTransaction(customerId, amount, pointsEarned);

        if (result.success) {
          // Transazione COMPLETATA con successo!
          console.log('✅ Transazione completata con successo!');

          // 📝 LOG STAFF ACTIVITY (in background, non blocca)
          if (customer.organization_id) {
            logSale(
              customer.organization_id,
              customer.id,
              customer.name,
              amount,
              pointsEarned
            ).catch(err => console.error('Log sale error:', err)); // Non bloccare per errori di log
          }

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

            // Configurazione stampante con dati organizzazione
            const printConfig = {
              storeName: organizationName,
              storeAddress: organizationAddress,
              storePhone: organizationPhone,
              storeTax: organizationTax,
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
              cashierName: operatorName,
              customerPoints: pointsEarned,
              loyaltyCard: customer.id
            };

            // Crea servizio stampa e stampa
            const printService = createPrintService(printConfig);
            const initialized = await printService.initialize();

            if (initialized) {
              const printed = await printService.printReceiptOptimized(receiptData);
              if (printed) {
                console.log('✅ Scontrino stampato con successo (layout ottimizzato)!');
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
        {/* Header - Centered Style come customer-app */}
        <div
          className="customer-panel-header"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            boxShadow: `0 8px 32px ${primaryColor}40, 0 4px 16px ${primaryColor}30`
          }}
        >
          <button className="customer-panel-close-btn" onClick={onClose}>
            <X size={16} />
          </button>

          <div className="customer-slide-panel-header-centered">
            <h3 className="customer-header-title">PROFILO FEDELTÀ</h3>

            {/* Avatar Centrato */}
            <div
              className="customer-slide-panel-avatar-centered"
              style={{
                background: customer.avatar_url ? 'transparent' : (customer.gender === 'female' ? '#ec4899' : '#3b82f6'),
                cursor: customer.avatar_url ? 'pointer' : 'default'
              }}
              onClick={() => customer.avatar_url && setShowAvatarModal(true)}
              title={customer.avatar_url ? 'Clicca per ingrandire' : ''}
            >
              {customer.avatar_url ? (
                <img
                  src={customer.avatar_url}
                  alt={customer.name}
                  className="customer-slide-panel-avatar-img"
                />
              ) : (
                <span className="customer-slide-panel-avatar-initials">
                  {customer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              )}
            </div>

            {/* Nome Centrato */}
            <h2 className="customer-name-centered">{customer.name}</h2>

            {/* Tier Name Centrato - Con icona */}
            <div className="customer-tier-text-centered">
              <Award size={16} />
              <span>{currentTier.name}</span>
              {currentTier.multiplier && currentTier.multiplier > 1 && (
                <span> {currentTier.multiplier}x</span>
              )}
            </div>
          </div>
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
            className="customer-slide-panel-action-btn"
            onClick={() => setShowSaleModal(true)}
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              boxShadow: `0 4px 16px ${primaryColor}40`
            }}
          >
            <div className="action-btn-content">
              <div className="action-btn-icon">
                <ShoppingBag size={24} />
              </div>
              <div className="action-btn-text">
                <div className="action-btn-title">Nuova Vendita</div>
                <div className="action-btn-subtitle">Registra transazione</div>
              </div>
            </div>
            <div className="action-btn-arrow">›</div>
          </button>

          <button className="customer-slide-panel-action-btn" onClick={() => setShowEditModal(true)}>
            <div className="action-btn-content">
              <div className="action-btn-icon">
                <UserCog size={24} />
              </div>
              <div className="action-btn-text">
                <div className="action-btn-title">Dati Profilo</div>
                <div className="action-btn-subtitle">Modifica informazioni</div>
              </div>
            </div>
            <div className="action-btn-arrow">›</div>
          </button>

          <button className="customer-slide-panel-action-btn" onClick={() => setShowModifyPointsModal(true)}>
            <div className="action-btn-content">
              <div className="action-btn-icon">
                <Target size={24} />
              </div>
              <div className="action-btn-text">
                <div className="action-btn-title">Gestione {pointsName}</div>
                <div className="action-btn-subtitle">Opzioni avanzate</div>
              </div>
            </div>
            <div className="action-btn-arrow">›</div>
          </button>

          <button className="customer-slide-panel-action-btn" onClick={() => setShowRewardsModal(true)}>
            <div className="action-btn-content">
              <div className="action-btn-icon">
                <Gift size={24} />
              </div>
              <div className="action-btn-text">
                <div className="action-btn-title">Premi Disponibili</div>
                <div className="action-btn-subtitle">Riscatta le {pointsName.toLowerCase()}</div>
              </div>
            </div>
            <div className="action-btn-arrow">›</div>
          </button>

          {organizationId && organizationId.trim() !== '' && onOpenGamingHub && (
            <button
              className="customer-slide-panel-action-btn"
              onClick={() => {
                console.log('🎮 Gaming button clicked! organizationId:', organizationId)
                onOpenGamingHub()
              }}
            >
              <div className="action-btn-content">
                <div className="action-btn-icon">
                  <Trophy size={24} />
                </div>
                <div className="action-btn-text">
                  <div className="action-btn-title">Gaming Zone</div>
                  <div className="action-btn-subtitle">Gioca e vinci</div>
                </div>
              </div>
              <div className="action-btn-arrow">›</div>
            </button>
          )}
        </div>


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

      {/* Modify Points Modal */}
      <ModifyPointsModal
        isOpen={showModifyPointsModal}
        customer={localCustomer}
        onClose={() => setShowModifyPointsModal(false)}
        onConfirm={handleModifyPoints}
        pointsName={pointsName}
      />

      {/* Tier Upgrade Modal - Celebration - SOLO SUL POS, NON SUL CUSTOMER DISPLAY */}
      {tierUpgradeData && !window.location.pathname.includes('customer-display') && (
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

      {/* Edit Customer Modal - Modifica dati e avatar */}
      {onUpdateCustomer && localCustomer && (
        <EditCustomerModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          customer={localCustomer}
          onUpdate={async (customerId, updates) => {
            await onUpdateCustomer(customerId, updates);
            // Aggiorna localCustomer con i nuovi dati
            setLocalCustomer({ ...localCustomer, ...updates });
          }}
          primaryColor={primaryColor}
        />
      )}

      {/* Avatar Enlarged Modal */}
      {showAvatarModal && customer?.avatar_url && (
        <div
          className="avatar-modal-overlay"
          onClick={() => setShowAvatarModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            cursor: 'pointer',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px'
            }}
          >
            <img
              src={customer.avatar_url}
              alt={customer.name}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
              }}
            />
            <button
              onClick={() => setShowAvatarModal(false)}
              style={{
                padding: '12px 24px',
                backgroundColor: primaryColor || '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <X size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
              Chiudi
            </button>
          </div>
        </div>
      )}

      {/* Rewards Modal */}
      {customer && (
        <RewardsModal
          isOpen={showRewardsModal}
          onClose={() => setShowRewardsModal(false)}
          customer={customer}
          organizationId={customer.organization_id}
          pointsName={pointsName}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          onCustomerUpdate={async () => {
            // Ricarica i dati del cliente dal database
            if (customer?.id) {
              try {
                const { data: updatedCustomer, error } = await supabase
                  .from('customers')
                  .select('*')
                  .eq('id', customer.id)
                  .single();

                if (error) {
                  console.error('Errore ricaricamento cliente:', error);
                  return;
                }

                if (updatedCustomer) {
                  setLocalCustomer(updatedCustomer as Customer);
                  console.log(`✅ Punti aggiornati nel pannello: ${updatedCustomer.points}`);
                }
              } catch (error) {
                console.error('Errore durante il ricaricamento:', error);
              }
            }
          }}
        />
      )}

      {/* Sale Success Modal - Green Celebration */}
      {saleSuccessData && (
        <SaleSuccessModal
          isOpen={showSaleSuccessModal}
          customerName={saleSuccessData.customerName}
          pointsEarned={saleSuccessData.pointsEarned}
          pointsName={pointsName}
          onClose={() => {
            setShowSaleSuccessModal(false);
            setSaleSuccessData(null);
          }}
        />
      )}

    </>
  );
};

export default CustomerSlidePanel;