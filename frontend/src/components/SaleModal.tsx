import React, { useState, useEffect, useRef } from 'react';
import { X, Store, Target, ChevronDown, ShoppingBag, Eraser, QrCode, Printer } from 'lucide-react';
import './SaleModal.css';
import QRScannerModal from './QRScannerModal';
import { supabase } from '../lib/supabase';

interface SaleModalProps {
  customer: any;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customerId: string, amount: number, pointsEarned: number, printReceipt?: boolean) => void;
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
  const [printReceipt, setPrintReceipt] = useState(true); // Toggle stampa scontrino
  const [showCustomerToast, setShowCustomerToast] = useState(false); // Toast per cambio cliente
  const [toastMessage, setToastMessage] = useState(''); // Messaggio toast

  // Ref per l'input amount per controllare il focus
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Cliente attivo - può essere diverso dal customer prop dopo una scansione QR
  const [activeCustomer, setActiveCustomer] = useState(customer);
  const [activeTier, setActiveTier] = useState(currentTier);

  // Sincronizza activeCustomer con customer quando il modale si apre per la prima volta
  useEffect(() => {
    if (isOpen && customer) {
      setActiveCustomer(customer);
      setActiveTier(currentTier);
      // Carica preferenza stampa del cliente (default true se non specificato)
      setPrintReceipt(customer.print_receipt_preference !== false);
      console.log('[SaleModal] 👤 Cliente iniziale:', customer.name);
      console.log('[SaleModal] 🖨️ Preferenza stampa:', customer.print_receipt_preference !== false ? 'SI' : 'NO');
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
    // Passa anche la preferenza di stampa
    onConfirm(activeCustomer.id, numAmount, pointsEarned, printReceipt);
    console.log(`[SaleModal] 💳 Vendita registrata per ${activeCustomer.name}`);
    console.log(`[SaleModal] 🖨️ Stampa scontrino: ${printReceipt ? 'SI' : 'NO'}`);

    // Reset importo per la prossima vendita
    setAmount('');

    // 🔑 IMPORTANTE: Rimuovi focus dall'input per evitare tastierino
    if (amountInputRef.current) {
      amountInputRef.current.blur();
      console.log('[SaleModal] ⌨️ Input blurred - tastierino nascosto');
    }

    // 🔄 AGGIORNA: Dopo la vendita, ricarica i dati aggiornati del cliente attivo
    setTimeout(async () => {
      try {
        const { data: updatedCustomer, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', activeCustomer.id)
          .single();

        if (updatedCustomer && !error) {
          setActiveCustomer(updatedCustomer);

          // Ricalcola tier aggiornato
          const calculateCustomerTier = (points: number) => {
            if (!loyaltyTiers || loyaltyTiers.length === 0) return { name: 'Standard', multiplier: 1, color: '#6366f1' };
            for (let i = loyaltyTiers.length - 1; i >= 0; i--) {
              if (points >= parseFloat(loyaltyTiers[i].threshold)) {
                return loyaltyTiers[i];
              }
            }
            return loyaltyTiers[0];
          };

          const updatedTier = calculateCustomerTier(updatedCustomer.points);
          setActiveTier(updatedTier);

          console.log(`[SaleModal] 🔄 Dati cliente aggiornati: ${updatedCustomer.name} - ${updatedCustomer.points} punti`);
        }
      } catch (error) {
        console.error('[SaleModal] ❌ Errore ricaricamento dati cliente:', error);
      }

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
      setToastMessage('❌ QR code non valido');
      setShowCustomerToast(true);
      setTimeout(() => setShowCustomerToast(false), 3000);
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
        setToastMessage('❌ Cliente non trovato');
        setShowCustomerToast(true);
        setTimeout(() => setShowCustomerToast(false), 3000);
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
      setPointsEarned(0);
      setDisplayedPoints(0);

      // Carica preferenza stampa del nuovo cliente
      setPrintReceipt(newCustomer.print_receipt_preference !== false);

      // 📺 AGGIORNA CUSTOMER DISPLAY con il nuovo cliente
      if (typeof window !== 'undefined' && (window as any).updateCustomerDisplay) {
        (window as any).updateCustomerDisplay({
          type: 'SALE_PREVIEW',
          preview: {
            customerName: newCustomer.name,
            amount: 0,
            pointsToEarn: 0,
            currentPoints: newCustomer.points,
            newTotalPoints: newCustomer.points,
            tier: newTier.name
          }
        });
        console.log(`[SaleModal] 📺 Customer display aggiornato per ${newCustomer.name}`);
      }

      console.log(`[SaleModal] 🔄 Cliente cambiato: ${newCustomer.name} (${newTier.name})`);

      // Mostra toast di successo
      setToastMessage(`✅ ${newCustomer.name} - ${newCustomer.points} punti - ${newTier.name}`);
      setShowCustomerToast(true);
      setTimeout(() => setShowCustomerToast(false), 3000);

    } catch (error) {
      console.error('[SaleModal] ❌ Errore caricamento cliente:', error);
      setToastMessage('❌ Errore caricamento cliente');
      setShowCustomerToast(true);
      setTimeout(() => setShowCustomerToast(false), 3000);
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
            customerName: activeCustomer.name,
            amount: numAmount,
            pointsToEarn: finalPoints,
            currentPoints: activeCustomer.points,
            newTotalPoints: activeCustomer.points + finalPoints,
            tier: activeTier?.name || activeCustomer.tier || 'Bronze',
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

  const newTotalPoints = activeCustomer.points + pointsEarned;

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
              {activeCustomer.avatar_url ? (
                <img
                  src={activeCustomer.avatar_url}
                  alt={activeCustomer.name}
                  className="gemini-avatar-img"
                />
              ) : (
                <span className="gemini-avatar-initials">
                  {activeCustomer.name.charAt(0).toUpperCase()}
                </span>
              )}
              {activeTier?.multiplier && activeTier.multiplier > 1 && (
                <span className="gemini-avatar-badge">{activeTier.multiplier}x</span>
              )}
            </div>
            <div className="gemini-customer-info">
              <h2 className="gemini-customer-name">{activeCustomer.name}</h2>
              <p className="gemini-customer-subtitle">Cliente Fidelizzato</p>
            </div>
            <div className="gemini-tier-badge" style={{
              background: `linear-gradient(135deg, ${activeTier?.color || '#6366f1'} 0%, ${activeTier?.color || '#6366f1'}dd 100%)`
            }}>
              <span className="gemini-tier-label">LIVELLO</span>
              <span className="gemini-tier-name">{activeTier?.name || activeCustomer.tier}</span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="gemini-amount-section">
            <label className="gemini-amount-label">TOTALE SCONTRINO</label>
            <div className="gemini-amount-wrapper">
              <span className="gemini-euro">€</span>
              <input
                ref={amountInputRef}
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
              <span className="gemini-points-value">{activeCustomer.points}</span>
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

          {/* Print Receipt Toggle */}
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '10px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Printer size={18} color="white" strokeWidth={2} />
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'white'
                }}>
                  Scontrino cartaceo
                </span>
              </div>

              {/* Toggle Switch - rettangolo orizzontale */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPrintReceipt(!printReceipt);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                style={{
                  position: 'relative',
                  width: '50px',
                  height: '26px',
                  borderRadius: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backgroundColor: printReceipt ? '#10b981' : '#4b5563',
                  padding: 0,
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: printReceipt ? 'flex-start' : 'flex-end',
                  paddingLeft: printReceipt ? '3px' : '0',
                  paddingRight: printReceipt ? '0' : '3px',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {/* Pallina con icona */}
                <div style={{
                  position: 'absolute',
                  top: '3px',
                  left: printReceipt ? '28px' : '3px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Printer size={11} color={printReceipt ? '#10b981' : '#6b7280'} strokeWidth={2.5} />
                </div>
              </button>
            </div>

            {/* Status Text */}
            <div style={{
              marginTop: '6px',
              fontSize: '11px',
              color: printReceipt ? '#10b981' : '#9ca3af',
              fontWeight: '500',
              paddingLeft: '30px'
            }}>
              {printReceipt ? '✓ Scontrino cartaceo' : '📱 Solo digitale (app)'}
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

      {/* Toast Notification per cambio cliente */}
      {showCustomerToast && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10001,
          backgroundColor: toastMessage.startsWith('❌') ? '#ef4444' : '#10b981',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          fontSize: '15px',
          fontWeight: '600',
          maxWidth: '400px',
          textAlign: 'center',
          animation: 'slideDown 0.3s ease-out',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {toastMessage}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default SaleModal;