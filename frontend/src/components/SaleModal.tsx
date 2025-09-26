import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Target, Award } from 'lucide-react';
import './SaleModal.css';

interface SaleModalProps {
  customer: any;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customerId: string, amount: number, pointsEarned: number) => void;
  pointsPerEuro?: number; // Configurazione dinamica punti per euro
  loyaltyTiers?: any[]; // Tiers di fedeltà per calcoli dinamici
  currentTier?: any; // Tier corrente del cliente
}

const SaleModal: React.FC<SaleModalProps> = ({
  customer,
  isOpen,
  onClose,
  onConfirm,
  pointsPerEuro = 1, // Default a 1 punto per euro se non specificato
  loyaltyTiers = [], // Default array vuoto se non specificato
  currentTier = { multiplier: 1 } // Default moltiplicatore 1x se non specificato
}) => {
  const [amount, setAmount] = useState('');
  const [pointsEarned, setPointsEarned] = useState(0);

  // Calcola punti guadagnati basato sulla configurazione dell'organizzazione e tier - ottimizzato
  useEffect(() => {
    const numAmount = parseFloat(amount) || 0;
    const basePoints = numAmount * pointsPerEuro; // Punti base
    const tierMultiplier = currentTier?.multiplier || 1; // Moltiplicatore del tier
    const finalPoints = Math.floor(basePoints * tierMultiplier); // Punti finali con moltiplicatore

    console.log(`💰 Calcolo punti: €${numAmount} × ${pointsPerEuro} × ${tierMultiplier} (${currentTier?.name || 'Default'}) = ${finalPoints} punti`);

    // Aggiorna solo se i punti sono davvero cambiati
    setPointsEarned(prevPoints => prevPoints !== finalPoints ? finalPoints : prevPoints);
  }, [amount, pointsPerEuro, currentTier]);

  // Funzione per suono "ka-ching" celebrativo - DISABILITATA TEMPORANEAMENTE
  const playCelebrationSound = () => {
    // DISABILITATO per evitare loop infiniti
    console.log('Celebration sound disabled to prevent infinite beeps');
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

      // Aggiorna customer display in tempo reale durante la digitazione
      if (typeof window !== 'undefined' && (window as any).updateCustomerDisplay) {
        const numAmount = parseFloat(value) || 0;
        const basePoints = numAmount * pointsPerEuro; // Punti base
        const tierMultiplier = currentTier?.multiplier || 1; // Moltiplicatore del tier
        const finalPoints = Math.floor(basePoints * tierMultiplier); // Punti finali con moltiplicatore

        (window as any).updateCustomerDisplay({
          type: 'SALE_IN_PROGRESS',
          transaction: {
            customerName: customer.name,
            amount: numAmount,
            formattedAmount: `€${numAmount.toFixed(2)}`,
            pointsToEarn: finalPoints,
            currentPoints: customer.points,
            newTotalPoints: customer.points + finalPoints,
            tier: currentTier?.name || customer.tier || 'Bronze',
            tierMultiplier: tierMultiplier,
            phase: numAmount > 0 ? 'calculating' : 'waiting',
            message: numAmount > 0
              ? `Spendi €${numAmount.toFixed(2)} e guadagni +${finalPoints} punti!`
              : 'Il cassiere sta inserendo l\'importo...',
            showProgress: true
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
        type: 'SALE_IN_PROGRESS',
        transaction: {
          customerName: customer.name,
          amount: 0,
          formattedAmount: '€0.00',
          pointsToEarn: 0,
          currentPoints: customer.points,
          newTotalPoints: customer.points,
          tier: customer.tier,
          phase: 'waiting',
          message: 'Il cassiere sta inserendo l\'importo...',
          showProgress: false
        }
      });
    }

    // Suono disabilitato temporaneamente
    console.log('Clear sound disabled to prevent infinite beeps');
  };


  // Inizializza customer display quando si apre il modale
  useEffect(() => {
    if (isOpen && customer && typeof window !== 'undefined' && (window as any).updateCustomerDisplay) {
      (window as any).updateCustomerDisplay({
        type: 'SALE_IN_PROGRESS',
        transaction: {
          customerName: customer.name,
          amount: 0,
          formattedAmount: '€0.00',
          pointsToEarn: 0,
          currentPoints: customer.points,
          newTotalPoints: customer.points,
          tier: currentTier?.name || customer.tier || 'Bronze',
          phase: 'waiting',
          message: 'Il cassiere sta inserendo l\'importo della tua spesa...',
          showProgress: false
        }
      });
      console.log(`🛒 SaleModal aperto per ${customer.name} - customer display inizializzato`);
    }
  }, [isOpen, customer, currentTier]);

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
            <span
              className={`customer-tier ${(currentTier?.name || customer.tier).toLowerCase()}`}
              style={{ backgroundColor: currentTier?.color || '#F59E0B' }}
            >
              {currentTier?.name || customer.tier} {currentTier?.multiplier && currentTier.multiplier > 1 && `(${currentTier.multiplier}x)`}
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

          {/* Actions */}
          <div className="sale-actions-section">
            <div className="sale-actions">
              <button className="sale-btn-clear" onClick={clearAmount}>
                Cancella
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