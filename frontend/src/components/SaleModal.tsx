import React, { useState, useEffect } from 'react';
import { X, Store, Target, ChevronDown, ShoppingBag, Eraser, QrCode } from 'lucide-react';
import './SaleModal.css';
import QRScannerModal from './QRScannerModal';
import { supabase } from '../lib/supabase';

interface SaleModalProps {
  customer: any;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customerId: string, amount: number, pointsEarned: number) => void;
  pointsPerEuro?: number; // Configurazione dinamica punti per euro
  loyaltyTiers?: any[]; // Tiers di fedeltà per calcoli dinamici
  currentTier?: any; // Tier corrente del cliente
  bonusCategories?: any[]; // Categorie prodotti con moltiplicatori
  pointsName?: string; // Nome personalizzato punti (es. "Gemme", "Stelle")
}

const SaleModal: React.FC<SaleModalProps> = ({
  customer,
  isOpen,
  onClose,
  onConfirm,
  pointsPerEuro = 1, // Default a 1 punto per euro se non specificato
  loyaltyTiers = [], // Default array vuoto se non specificato
  currentTier = { multiplier: 1 }, // Default moltiplicatore 1x se non specificato
  bonusCategories = [], // Default array vuoto se non specificato
  pointsName = 'Punti' // Default "Punti" se non specificato
}) => {
  const [amount, setAmount] = useState('');
  const [pointsEarned, setPointsEarned] = useState(0);
  const [displayedPoints, setDisplayedPoints] = useState(0); // Punti visualizzati con animazione
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const confirmClickedRef = React.useRef(false); // Previene click multipli

  // Cliente attivo - può essere diverso dal customer prop dopo una scansione QR
  const [activeCustomer, setActiveCustomer] = useState(customer);
  const [activeTier, setActiveTier] = useState(currentTier);

  // Sincronizza activeCustomer con customer quando il modale si apre per la prima volta
  useEffect(() => {
    if (isOpen && customer) {
      setActiveCustomer(customer);
      setActiveTier(currentTier);
      console.log('[SaleModal] 👤 Cliente iniziale:', customer.name);
    }
  }, [isOpen, customer, currentTier]);

  // Calcola punti guadagnati basato sulla configurazione dell'organizzazione, tier e categoria
  useEffect(() => {
    const numAmount = parseFloat(amount) || 0;
    const basePoints = numAmount * pointsPerEuro; // Punti base
    const tierMultiplier = activeTier?.multiplier || 1; // Moltiplicatore del tier ATTIVO

    // Trova moltiplicatore categoria se selezionata
    let categoryMultiplier = 1;
    if (selectedCategory && bonusCategories.length > 0) {
      const category = bonusCategories.find(c => c.category === selectedCategory);
      categoryMultiplier = category ? parseFloat(category.multiplier) : 1;
    }

    const finalPoints = Math.floor(basePoints * tierMultiplier * categoryMultiplier); // Punti finali con tutti i moltiplicatori

    console.log(`💰 Calcolo punti: €${numAmount} × ${pointsPerEuro} × ${tierMultiplier} (${activeTier?.name || 'Default'}) × ${categoryMultiplier} (${selectedCategory || 'Nessuna'}) = ${finalPoints} punti`);

    // Aggiorna solo se i punti sono davvero cambiati
    setPointsEarned(prevPoints => prevPoints !== finalPoints ? finalPoints : prevPoints);
  }, [amount, pointsPerEuro, activeTier, selectedCategory, bonusCategories]);

  // Effetto conteggio animato per i punti guadagnati
  useEffect(() => {
    if (pointsEarned === displayedPoints) return;

    const duration = 800; // Durata animazione in ms
    const steps = 30; // Numero di step dell'animazione
    const increment = (pointsEarned - displayedPoints) / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayedPoints(pointsEarned);
        clearInterval(timer);
      } else {
        setDisplayedPoints(prev => Math.floor(prev + increment));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [pointsEarned]);

  // Funzione per suono "ka-ching" celebrativo - DISABILITATA TEMPORANEAMENTE
  const playCelebrationSound = () => {
    // DISABILITATO per evitare loop infiniti
    console.log('Celebration sound disabled to prevent infinite beeps');
  };

  const handleConfirm = () => {
    // Previeni click multipli usando ref
    if (confirmClickedRef.current) {
      console.log('[SaleModal] Click già processato, ignoro duplicato');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) return;

    // Segna come processato
    confirmClickedRef.current = true;
    console.log('[SaleModal] ✅ Conferma vendita - processamento avviato');

    // Suono celebrativo "ka-ching"
    playCelebrationSound();

    // NUOVO: Mostra stato "Elaborazione transazione" sul customer display
    if (typeof window !== 'undefined' && (window as any).updateCustomerDisplay) {
      (window as any).updateCustomerDisplay({
        type: 'SALE_PROCESSING',
        processing: {
          customerName: activeCustomer.name,
          amount: parseFloat(amount),
          pointsToEarn: pointsEarned,
          tier: activeTier?.name || activeCustomer.tier || 'Bronze'
        }
      });
      console.log('🔄 Mostrando schermata di elaborazione transazione...');
    }

    const numAmount = parseFloat(amount);

    // Chiama onConfirm che mostra il modale verde in CustomerSlidePanel
    // La fontana di monete viene ora triggerata automaticamente da SaleSuccessModal
    // USA activeCustomer invece di customer per supportare scansioni QR
    onConfirm(activeCustomer.id, numAmount, pointsEarned);
    console.log(`[SaleModal] 💳 Vendita registrata per ${activeCustomer.name}`);

    // Reset importo per la prossima vendita
    setAmount('');

    // Reset ref dopo un breve delay per permettere la prossima vendita
    setTimeout(() => {
      confirmClickedRef.current = false;
      console.log('[SaleModal] 🔓 Pronto per la prossima vendita');
    }, 1000);

    // NON chiudiamo più il modale - rimane aperto per la prossima scansione
    // onClose();
  };

  // Funzione per gestire la scansione QR e caricare il nuovo cliente
  const handleQRScan = async (scannedCode: string) => {
    console.log('[SaleModal] 📱 QR scansionato:', scannedCode);

    // Parse QR code formato: "OMNILY_CUSTOMER:customer_id"
    if (!scannedCode.startsWith('OMNILY_CUSTOMER:')) {
      console.error('[SaleModal] ❌ QR code non valido');
      alert('QR code non valido. Assicurati di scansionare il QR della carta cliente.');
      return;
    }

    const customerId = scannedCode.replace('OMNILY_CUSTOMER:', '');
    console.log('[SaleModal] 🔍 Ricerca cliente con ID:', customerId);

    try {
      // Carica cliente dal database
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error || !newCustomer) {
        console.error('[SaleModal] ❌ Cliente non trovato:', error);
        alert('Cliente non trovato nel database.');
        return;
      }

      console.log('[SaleModal] ✅ Cliente caricato:', newCustomer.name);

      // Calcola tier del nuovo cliente
      const calculateCustomerTier = (points: number) => {
        if (!loyaltyTiers || loyaltyTiers.length === 0) return { name: 'Standard', multiplier: 1, color: '#6366f1' };

        for (let i = loyaltyTiers.length - 1; i >= 0; i--) {
          if (points >= parseFloat(loyaltyTiers[i].threshold)) {
            return loyaltyTiers[i];
          }
        }
        return loyaltyTiers[0];
      };

      const newTier = calculateCustomerTier(newCustomer.points);

      // Aggiorna activeCustomer e activeTier
      setActiveCustomer(newCustomer);
      setActiveTier(newTier);

      // Reset importo per nuovo cliente
      setAmount('');

      console.log(`[SaleModal] 🔄 Cliente cambiato: ${newCustomer.name} (${newTier.name})`);

      // Mostra messaggio di successo breve
      alert(`✅ Cliente caricato: ${newCustomer.name}\nPunti: ${newCustomer.points}\nLivello: ${newTier.name}`);

    } catch (error) {
      console.error('[SaleModal] ❌ Errore caricamento cliente:', error);
      alert('Errore durante il caricamento del cliente.');
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permetti solo numeri e punto decimale
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);

      // Aggiorna customer display in tempo reale durante la digitazione
      if (typeof window !== 'undefined' && (window as any).updateCustomerDisplay) {
        const numAmount = parseFloat(value) || 0;
        const basePoints = numAmount * pointsPerEuro; // Punti base
        const tierMultiplier = currentTier?.multiplier || 1; // Moltiplicatore del tier
        const finalPoints = Math.floor(basePoints * tierMultiplier); // Punti finali con moltiplicatore

        (window as any).updateCustomerDisplay({
          type: 'SALE_PREVIEW',
          preview: {
            customerName: customer.name,
            amount: numAmount,
            pointsToEarn: finalPoints,
            currentPoints: customer.points,
            newTotalPoints: customer.points + finalPoints,
            tier: currentTier?.name || customer.tier || 'Bronze',
            tierMultiplier: tierMultiplier
          }
        });
        console.log(`💰 Customer display: €${numAmount.toFixed(2)} → +${finalPoints} punti`);
      }
    }
  };


  const clearAmount = () => {
    if (amount.length === 0) return;

    // Aggiorna immediatamente lo stato
    setAmount('');

    // Reset customer display quando cancelli
    if (typeof window !== 'undefined' && (window as any).updateCustomerDisplay) {
      (window as any).updateCustomerDisplay({
        type: 'SALE_PREVIEW',
        preview: {
          customerName: customer.name,
          amount: 0,
          pointsToEarn: 0,
          currentPoints: customer.points,
          newTotalPoints: customer.points,
          tier: customer.tier
        }
      });
    }

    // Suono disabilitato temporaneamente
    console.log('Clear sound disabled to prevent infinite beeps');
  };


  // Inizializza customer display quando si apre il modale E resetta il ref
  useEffect(() => {
    if (isOpen) {
      // Reset del ref per permettere nuova conferma
      confirmClickedRef.current = false;
      setDisplayedPoints(0); // Reset contatore animato
      console.log('[SaleModal] 🔓 Modal aperto - ref resettato per nuova vendita');
    }

    if (isOpen && customer && typeof window !== 'undefined' && (window as any).updateCustomerDisplay) {
      (window as any).updateCustomerDisplay({
        type: 'SALE_PREVIEW',
        preview: {
          customerName: customer.name,
          amount: 0,
          pointsToEarn: 0,
          currentPoints: customer.points,
          newTotalPoints: customer.points,
          tier: currentTier?.name || customer.tier || 'Bronze'
        }
      });
      console.log(`🛒 SaleModal aperto per ${customer.name} - customer display inizializzato`);
    }
  }, [isOpen, customer, currentTier]);

  if (!isOpen || !customer) return null;

  const newTotalPoints = customer.points + pointsEarned;

  const quickAddAmount = (addAmount: number) => {
    const currentAmount = parseFloat(amount) || 0;
    const newAmount = currentAmount + addAmount;
    setAmount(newAmount.toFixed(2));
  };

  return (
    <>
      <div className="gemini-backdrop" onClick={onClose} />
      <div className="gemini-panel">
        {/* Header Gemini Style */}
        <div className="gemini-header">
          <div className="gemini-header-left">
            <Store size={18} className="gemini-store-icon" />
            <span className="gemini-pos-label">POS SYSTEM</span>
          </div>
          <h1 className="gemini-title">Nuova Vendita</h1>
          <button className="gemini-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="gemini-content">
          {/* Customer Card */}
          <div className="gemini-customer-card">
            <div className="gemini-avatar">
              {customer.avatar_url ? (
                <img
                  src={customer.avatar_url}
                  alt={customer.name}
                  className="gemini-avatar-img"
                />
              ) : (
                <span className="gemini-avatar-initials">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
              )}
              {currentTier?.multiplier && currentTier.multiplier > 1 && (
                <span className="gemini-avatar-badge">{currentTier.multiplier}x</span>
              )}
            </div>
            <div className="gemini-customer-info">
              <h2 className="gemini-customer-name">{customer.name}</h2>
              <p className="gemini-customer-subtitle">Cliente Fidelizzato</p>
            </div>
            <div className="gemini-tier-badge" style={{
              background: `linear-gradient(135deg, ${currentTier?.color || '#6366f1'} 0%, ${currentTier?.color || '#6366f1'}dd 100%)`
            }}>
              <span className="gemini-tier-label">LIVELLO</span>
              <span className="gemini-tier-name">{currentTier?.name || customer.tier}</span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="gemini-amount-section">
            <label className="gemini-amount-label">TOTALE SCONTRINO</label>
            <div className="gemini-amount-wrapper">
              <span className="gemini-euro">€</span>
              <input
                type="text"
                value={amount || ''}
                onChange={handleAmountChange}
                placeholder="0"
                className="gemini-amount-input"
                inputMode="decimal"
              />
              {amount && <div className="gemini-amount-underline" />}
            </div>
          </div>

          {/* Quick Add Buttons */}
          <div className="gemini-quick-buttons">
            <button onClick={() => quickAddAmount(1)} className="gemini-quick-btn">+1€</button>
            <button onClick={() => quickAddAmount(2)} className="gemini-quick-btn">+2€</button>
            <button onClick={() => quickAddAmount(5)} className="gemini-quick-btn">+5€</button>
            <button onClick={() => quickAddAmount(10)} className="gemini-quick-btn">+10€</button>
          </div>

          {/* Category Dropdown */}
          <div className="gemini-category-wrapper">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="gemini-category-select"
            >
              <option value="">Seleziona categoria (opzionale)</option>
              {bonusCategories.map((cat, index) => (
                <option key={index} value={cat.category}>
                  {cat.category} ({cat.multiplier}x)
                </option>
              ))}
            </select>
            <ChevronDown className="gemini-chevron" size={20} />
          </div>

          {/* Points Box */}
          <div className="gemini-points-box">
            <div className="gemini-points-row">
              <div className="gemini-points-left">
                <Target size={20} className="gemini-target-icon" />
                <span className="gemini-points-label">ATTUALI</span>
              </div>
              <span className="gemini-points-value">{customer.points}</span>
            </div>
            <div className="gemini-divider" />
            <div className="gemini-points-row gemini-gain">
              <div className="gemini-points-left">
                <Target size={20} className="gemini-trophy-icon" />
                <span className="gemini-points-label">GUADAGNO</span>
              </div>
              <span className="gemini-points-value gemini-gain-value">+{displayedPoints}</span>
            </div>
            <div className="gemini-saldo-row">
              <span className="gemini-saldo-label">Nuovo Saldo</span>
              <span className="gemini-saldo-value">{newTotalPoints} {pointsName.toLowerCase()}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="gemini-action-buttons">
            <button
              className="gemini-confirm-btn"
              onClick={handleConfirm}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={!amount || parseFloat(amount) <= 0}
            >
              <span>Conferma Vendita</span>
              <ShoppingBag size={20} />
            </button>

            {/* Clear Button */}
            <button className="gemini-clear-icon" onClick={clearAmount}>
              <Eraser size={22} />
            </button>
          </div>

          {/* Floating QR Code Button */}
          <button
            className="gemini-qr-floating-btn"
            onClick={() => setIsQRScannerOpen(true)}
            title="Scansiona QR Code"
          >
            <QrCode size={28} />
          </button>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={async (scannedCode) => {
          console.log('QR scansionato:', scannedCode);
          setIsQRScannerOpen(false);
          await handleQRScan(scannedCode);
        }}
      />
    </>
  );
};

export default SaleModal;