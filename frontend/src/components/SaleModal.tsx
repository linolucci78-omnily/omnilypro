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

  // Calcola punti guadagnati (1 punto per ogni euro speso)
  useEffect(() => {
    const numAmount = parseFloat(amount) || 0;
    const points = Math.floor(numAmount);
    setPointsEarned(points);
  }, [amount]);

  const handleConfirm = () => {
    if (!amount || parseFloat(amount) <= 0) return;

    // Suono "ka-ching" quando confermi la vendita
    if (typeof window !== 'undefined' && (window as any).OmnilyPOS?.beep) {
      (window as any).OmnilyPOS.beep("2", "150"); // Beep di conferma
    }

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

          <div className="congratulations">
            <p>Ben Fatto!</p>
          </div>
        </div>

        <div className="sale-modal-actions">
          <button className="sale-btn-cancel" onClick={onClose}>
            Annulla
          </button>
          <button
            className="sale-btn-confirm"
            onClick={handleConfirm}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            Conferma Vendita
          </button>
        </div>
      </div>
    </>
  );
};

export default SaleModal;