import React, { useState } from 'react';
import { X, Star, Gift, ShoppingBag, Plus, Phone, Mail, MapPin, Calendar, Award, Euro, Users, TrendingUp, Sparkles, Crown, QrCode } from 'lucide-react';
import './CustomerSlidePanel.css';
import QRCodeGenerator from './QRCodeGenerator';
import SaleModal from './SaleModal';

import type { Customer } from '../lib/supabase';

interface CustomerSlidePanelProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onAddPoints?: (customerId: string, points: number) => void;
  onNewTransaction?: (customerId: string, amount: number, pointsEarned: number) => Promise<{success: boolean; customer?: any; amount?: number; pointsEarned?: number; error?: string}>;
  pointsPerEuro?: number; // Configurazione dinamica punti per euro dall'organizzazione
  loyaltyTiers?: any[]; // Tiers di fedeltà per calcolo moltiplicatori dinamici
}

const CustomerSlidePanel: React.FC<CustomerSlidePanelProps> = ({
  customer,
  isOpen,
  onClose,
  onAddPoints,
  onNewTransaction,
  pointsPerEuro = 1, // Default a 1 punto per euro se non specificato
  loyaltyTiers = [] // Default array vuoto se non specificato
}) => {
  const [showSaleModal, setShowSaleModal] = useState(false);

  if (!customer) return null;

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

  // Calcola tier dinamico del cliente corrente
  const currentTier = calculateCustomerTier(customer.points);

  const getTierColor = (tierName?: string) => {
    if (tierName) {
      // Se viene passato un nome tier specifico, usa i colori fissi (backward compatibility)
      switch (tierName) {
        case 'Platinum': return '#8B5CF6';
        case 'Gold': return '#F59E0B';
        case 'Silver': return '#94A3B8';
        case 'Bronze': return '#A16207';
        case 'Argento': return '#94A3B8';
        case 'Bronzo': return '#A16207';
        default: return '#F59E0B';
      }
    }
    // Altrimenti usa il colore dal tier dinamico
    return currentTier.color || '#F59E0B';
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
              style={{ backgroundColor: getTierColor(customer.tier) }}
            >
              {customer.tier === 'Platinum' && <Crown size={16} />}
              {customer.tier === 'Gold' && <Sparkles size={16} />}
              {customer.tier === 'Silver' && <Award size={16} />}
              {customer.tier === 'Bronze' && <Star size={16} />}
              {customer.tier}</div>
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
            <div className="customer-slide-panel-stat-number">{customer.points}</div>
            <div className="customer-slide-panel-stat-label">Punti</div>
          </div>
          <div className="customer-slide-panel-stat-item">
            <div className="customer-slide-panel-stat-icon">
              <Euro size={24} />
            </div>
            <div className="customer-slide-panel-stat-number">€{customer.total_spent.toFixed(2)}</div>
            <div className="customer-slide-panel-stat-label">Speso</div>
          </div>
          <div className="customer-slide-panel-stat-item">
            <div className="customer-slide-panel-stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="customer-slide-panel-stat-number">{customer.visits}</div>
            <div className="customer-slide-panel-stat-label">Visite</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="customer-panel-actions">
          <button
            className="customer-slide-panel-action-btn customer-slide-panel-action-btn-primary"
            onClick={() => {
              onAddPoints?.(customer.id, 10);
              // Solo ora aggiorniamo il customer display con i nuovi punti
              updateCustomerDisplay();
            }}
          >
            <Plus size={20} />
            Aggiungi Punti
          </button>
          <button
            className="customer-slide-panel-action-btn customer-slide-panel-action-btn-secondary"
            onClick={() => setShowSaleModal(true)}
          >
            <ShoppingBag size={20} />
            Nuova Vendita
          </button>
          <button className="customer-slide-panel-action-btn customer-slide-panel-action-btn-tertiary">
            <Gift size={20} />
            Premi
          </button>
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
          <div className="customer-slide-panel-activity-item">
            <div className="customer-slide-panel-activity-date">Oggi</div>
            <div className="customer-slide-panel-activity-text">Acquisto caffè - +2 punti</div>
          </div>
          <div className="customer-slide-panel-activity-item">
            <div className="customer-slide-panel-activity-date">Ieri</div>
            <div className="customer-slide-panel-activity-text">Riscatto premio - -50 punti</div>
          </div>
          <div className="customer-slide-panel-activity-item">
            <div className="customer-slide-panel-activity-date">3 giorni fa</div>
            <div className="customer-slide-panel-activity-text">Acquisto cornetto - +1 punto</div>
          </div>
        </div>
      </div>

      {/* Sale Modal */}
      <SaleModal
        customer={customer}
        isOpen={showSaleModal}
        onClose={() => setShowSaleModal(false)}
        onConfirm={handleSaleConfirm}
        pointsPerEuro={pointsPerEuro}
        loyaltyTiers={loyaltyTiers}
        currentTier={currentTier}
      />
    </>
  );
};

export default CustomerSlidePanel;