import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Target, Award, Delete } from 'lucide-react';
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

  // Calcola punti guadagnati (1 punto per ogni euro speso)
  useEffect(() => {
    const numAmount = parseFloat(amount) || 0;
    const points = Math.floor(numAmount);
    setPointsEarned(points);
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

  // Funzioni per il keypad numerico
  const addDigit = (digit: string) => {
    if (digit === '.' && amount.includes('.')) return;

    // Suono click uniforme per feedback keypad
    if (typeof window !== 'undefined' && (window as any).OmnilyPOS?.beep) {
      (window as any).OmnilyPOS.beep("2", "80");
    }

    setAmount(prev => prev + digit);
  };

  const removeLastDigit = () => {
    if (amount.length === 0) return; // Non fare nulla se già vuoto

    // Suono per cancellazione singola cifra
    if (typeof window !== 'undefined' && (window as any).OmnilyPOS?.beep) {
      (window as any).OmnilyPOS.beep("1", "100");
    }

    setAmount(prev => prev.slice(0, -1));
  };

  const clearAmount = () => {
    if (amount.length === 0) return; // Non fare nulla se già vuoto

    // Suono per clear completo - tono più basso
    if (typeof window !== 'undefined' && (window as any).OmnilyPOS?.beep) {
      (window as any).OmnilyPOS.beep("0", "150");
    }

    setAmount('');
  };

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
                placeholder="0.00"
                className="amount-input"
                inputMode="none"
                readOnly
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

          {/* Keypad Numerico */}
          <div className="sale-keypad">
            <div className="sale-keypad-row">
              <button className="sale-keypad-btn" onClick={() => addDigit('1')}>1</button>
              <button className="sale-keypad-btn" onClick={() => addDigit('2')}>2</button>
              <button className="sale-keypad-btn" onClick={() => addDigit('3')}>3</button>
            </div>
            <div className="sale-keypad-row">
              <button className="sale-keypad-btn" onClick={() => addDigit('4')}>4</button>
              <button className="sale-keypad-btn" onClick={() => addDigit('5')}>5</button>
              <button className="sale-keypad-btn" onClick={() => addDigit('6')}>6</button>
            </div>
            <div className="sale-keypad-row">
              <button className="sale-keypad-btn" onClick={() => addDigit('7')}>7</button>
              <button className="sale-keypad-btn" onClick={() => addDigit('8')}>8</button>
              <button className="sale-keypad-btn" onClick={() => addDigit('9')}>9</button>
            </div>
            <div className="sale-keypad-row">
              <button className="sale-keypad-btn" onClick={() => addDigit('.')}>.</button>
              <button className="sale-keypad-btn" onClick={() => addDigit('0')}>0</button>
              <button className="sale-keypad-btn sale-keypad-btn-delete" onClick={removeLastDigit}>
                <Delete size={20} />
              </button>
            </div>
            <div className="sale-keypad-row">
              <button className="sale-keypad-btn sale-keypad-btn-clear" onClick={clearAmount}>
                Clear
              </button>
              <button
                className="sale-keypad-btn sale-keypad-btn-confirm"
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