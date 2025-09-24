import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Target, Award } from 'lucide-react';
import './SaleModal.css';

interface SaleModalProps {
  customer: any;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customerId: string, amount: number, pointsEarned: number) => void;
}

const SaleModal: React.FC<SaleModalProps> = ({
  customer,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [amount, setAmount] = useState('');
  const [pointsEarned, setPointsEarned] = useState(0);
  const [isPinPadActive, setIsPinPadActive] = useState(false);
  const [pinPadError, setPinPadError] = useState<string | null>(null);
  const [hasTriedPinPad, setHasTriedPinPad] = useState(false);

  // Calcola punti guadagnati (1 punto per ogni euro speso) - ottimizzato
  useEffect(() => {
    const numAmount = parseFloat(amount) || 0;
    const points = Math.floor(numAmount);
    // Aggiorna solo se i punti sono davvero cambiati
    setPointsEarned(prevPoints => prevPoints !== points ? points : prevPoints);
  }, [amount]);

  // Funzione per suono "ka-ching" celebrativo
  const playCelebrationSound = () => {
    if (typeof window !== 'undefined' && (window as any).OmnilyPOS?.beep) {
      // Sequenza di beep per creare effetto "ka-ching"
      setTimeout(() => (window as any).OmnilyPOS.beep("1", "100"), 0);
      setTimeout(() => (window as any).OmnilyPOS.beep("2", "100"), 100);
      setTimeout(() => (window as any).OmnilyPOS.beep("3", "150"), 200);
      setTimeout(() => (window as any).OmnilyPOS.beep("2", "200"), 350);
    }
  };

  const handleConfirm = () => {
    if (!amount || parseFloat(amount) <= 0) return;

    // Suono celebrativo "ka-ching"
    playCelebrationSound();

    const numAmount = parseFloat(amount);
    onConfirm(customer.id, numAmount, pointsEarned);
    setAmount('');
    onClose();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permetti solo numeri e punto decimale
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  // Callback per il risultato del PinPad nativo
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).omnilyAmountInputHandler = (result: string) => {
        setIsPinPadActive(false);
        if (result && !result.startsWith('ERROR:')) {
          setAmount(result);
          setPinPadError(null);
          console.log('PinPad input received:', result);
        } else {
          console.error('PinPad error:', result);
          setPinPadError(result || 'PinPad non disponibile');
          setHasTriedPinPad(true);
          // Mostra alert solo al primo errore
          if (!hasTriedPinPad) {
            alert('PinPad non disponibile. Usa l\'input manuale.');
          }
        }
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).omnilyAmountInputHandler;
      }
    };
  }, [hasTriedPinPad]);

  // Gestisci click su input per aprire PinPad
  const handleInputClick = () => {
    // Non aprire PinPad se c'è già un errore o se è già attivo
    if (pinPadError || isPinPadActive) {
      console.log('PinPad skipped - error:', pinPadError, 'or active:', isPinPadActive);
      return;
    }
    console.log('Click su input - tentativo apertura PinPad...');
    openNativePinPad();
  };

  // Funzione per aprire il PinPad nativo
  const openNativePinPad = () => {
    // Previeni chiamate multiple
    if (isPinPadActive || pinPadError) {
      console.log('PinPad already active or in error state');
      return;
    }

    if (typeof window !== 'undefined' && (window as any).OmnilyPOS?.inputAmountAsync) {
      console.log('Opening native PinPad...');
      setIsPinPadActive(true);
      setPinPadError(null);
      (window as any).OmnilyPOS.inputAmountAsync();
    } else {
      console.error('Native PinPad not available');
      setPinPadError('PinPad bridge non disponibile');
      setHasTriedPinPad(true);
      alert('PinPad nativo non disponibile. Usa il tastierino web.');
    }
  };

  const clearAmount = () => {
    if (amount.length === 0) return;

    // Aggiorna immediatamente lo stato
    setAmount('');

    // Suono asincrono
    setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).OmnilyPOS?.beep) {
        (window as any).OmnilyPOS.beep("0", "80");
      }
    }, 0);
  };

  // Reset stati quando il modale si apre/chiude
  useEffect(() => {
    if (isOpen) {
      // Reset errori quando si apre il modale
      setPinPadError(null);
      setHasTriedPinPad(false);
      setIsPinPadActive(false);
    }
  }, [isOpen]);

  if (!isOpen || !customer) return null;

  const newTotalPoints = customer.points + pointsEarned;

  return (
    <>
      <div className="sale-modal-backdrop" onClick={onClose} />
      <div className="sale-modal">
        <div className="sale-modal-header">
          <div className="sale-modal-title">
            <ShoppingBag size={24} />
            <h2>Nuova Vendita</h2>
          </div>
          <button className="sale-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="sale-modal-content">
          <div className="customer-info">
            <h3>{customer.name}</h3>
            <span className={`customer-tier ${customer.tier.toLowerCase()}`}>
              {customer.tier}
            </span>
          </div>

          <div className="amount-input-section">
            <label htmlFor="amount">Totale Speso</label>
            <div className="amount-input-wrapper">
              <span className="currency-symbol">€</span>
              <input
                id="amount"
                type="text"
                value={amount}
                onChange={handleAmountChange}
                onClick={handleInputClick}
                onFocus={handleInputClick}
                placeholder="0.00"
                className="amount-input"
                inputMode="decimal"
                autoFocus
              />
            </div>
          </div>

          <div className="points-summary">
            <div className="points-row">
              <div className="points-icon">
                <Target size={20} />
              </div>
              <span className="points-label">Punti Attuali</span>
              <span className="points-value">{customer.points}</span>
            </div>

            <div className="points-row earned">
              <div className="points-icon">
                <Award size={20} />
              </div>
              <span className="points-label">Punti Guadagnati</span>
              <span className="points-value">+{pointsEarned}</span>
            </div>

            <div className="points-row total">
              <div className="points-icon">
                <Target size={20} />
              </div>
              <span className="points-label">Ora Hai</span>
              <span className="points-value">{newTotalPoints} punti</span>
            </div>
          </div>

          {/* PinPad Status & Actions - MODALITÀ DEBUG */}
          <div className="sale-pinpad-section">
            {pinPadError ? (
              <div className="pinpad-debug">
                <p>❌ {pinPadError}</p>
                <p>💡 Usa l'input manuale per inserire l'importo</p>
              </div>
            ) : isPinPadActive ? (
              <div className="pinpad-debug">
                <p>⏳ PinPad attivo - inserisci l'importo sul terminale...</p>
              </div>
            ) : (
              <div className="pinpad-debug">
                <p>💡 Clicca sul campo "Totale Speso" per aprire il PinPad nativo</p>
                <p>⚠️ In caso di errore, usa l'input manuale</p>
              </div>
            )}

            <div className="sale-pinpad-actions">
              <button className="sale-btn-clear-small" onClick={clearAmount}>
                Cancella
              </button>
              <button
                className="sale-btn-test-small"
                onClick={openNativePinPad}
                disabled={isPinPadActive || !!pinPadError}
              >
                {isPinPadActive ? 'PinPad Attivo...' : 'Test PinPad'}
              </button>
              <button
                className="sale-btn-confirm-small"
                onClick={handleConfirm}
                disabled={!amount || parseFloat(amount) <= 0}
              >
                Conferma
              </button>
            </div>
          </div>

          <div className="congratulations">
            <p>Ben Fatto!</p>
          </div>
        </div>

        <div className="sale-modal-actions">
          <button className="sale-btn-cancel" onClick={onClose}>
            Annulla
          </button>
        </div>
      </div>
    </>
  );
};

export default SaleModal;