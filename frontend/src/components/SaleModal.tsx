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
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const confirmClickedRef = React.useRef(false); // Previene click multipli

  // Calcola punti guadagnati basato sulla configurazione dell'organizzazione, tier e categoria
  useEffect(() => {
    const numAmount = parseFloat(amount) || 0;
    const basePoints = numAmount * pointsPerEuro; // Punti base
    const tierMultiplier = currentTier?.multiplier || 1; // Moltiplicatore del tier

    // Trova moltiplicatore categoria se selezionata
    let categoryMultiplier = 1;
    if (selectedCategory && bonusCategories.length > 0) {
      const category = bonusCategories.find(c => c.category === selectedCategory);
      categoryMultiplier = category ? parseFloat(category.multiplier) : 1;
    }

    const finalPoints = Math.floor(basePoints * tierMultiplier * categoryMultiplier); // Punti finali con tutti i moltiplicatori

    console.log(`💰 Calcolo punti: €${numAmount} × ${pointsPerEuro} × ${tierMultiplier} (${currentTier?.name || 'Default'}) × ${categoryMultiplier} (${selectedCategory || 'Nessuna'}) = ${finalPoints} punti`);

    // Aggiorna solo se i punti sono davvero cambiati
    setPointsEarned(prevPoints => prevPoints !== finalPoints ? finalPoints : prevPoints);
  }, [amount, pointsPerEuro, currentTier, selectedCategory, bonusCategories]);

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
          customerName: customer.name,
          amount: parseFloat(amount),
          pointsToEarn: pointsEarned,
          tier: currentTier?.name || customer.tier || 'Bronze'
        }
      });
      console.log('🔄 Mostrando schermata di elaborazione transazione...');
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
            <div
              className={`customer-tier ${(currentTier?.name || customer.tier).toLowerCase()}`}
              style={{
                background: `linear-gradient(135deg, ${currentTier?.color || '#F59E0B'} 0%, ${currentTier?.color || '#F59E0B'}dd 100%)`,
                color: 'white',
                padding: '0.5rem 1.25rem',
                borderRadius: '24px',
                fontSize: '0.875rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                boxShadow: `0 4px 12px ${currentTier?.color || '#F59E0B'}40`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '2px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              {(currentTier?.name || customer.tier) === 'Platinum' && '👑'}
              {(currentTier?.name || customer.tier) === 'Gold' && '⭐'}
              {(currentTier?.name || customer.tier) === 'Silver' && '✨'}
              {(currentTier?.name || customer.tier) === 'Bronze' && '🥉'}
              <span>{currentTier?.name || customer.tier}</span>
              {currentTier?.multiplier && currentTier.multiplier > 1 && (
                <span style={{
                  background: 'rgba(255, 255, 255, 0.3)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '700'
                }}>
                  {currentTier.multiplier}x
                </span>
              )}
            </div>
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

          {/* Categoria Prodotto (opzionale) */}
          {bonusCategories && bonusCategories.length > 0 && (
            <div className="category-input-section">
              <label htmlFor="category">Categoria Prodotto (opzionale)</label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-select"
              >
                <option value="">Nessuna categoria</option>
                {bonusCategories.map((cat, index) => (
                  <option key={index} value={cat.category}>
                    {cat.category} ({cat.multiplier}x {pointsName.toLowerCase()})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="points-summary">
            <div className="points-row">
              <div className="points-icon">
                <Target size={20} />
              </div>
              <span className="points-label">{pointsName} Attuali</span>
              <span className="points-value">{customer.points}</span>
            </div>

            <div className="points-row earned">
              <div className="points-icon">
                <Award size={20} />
              </div>
              <span className="points-label">{pointsName} Guadagnati</span>
              <span className="points-value">+{pointsEarned}</span>
            </div>

            <div className="points-row total">
              <div className="points-icon">
                <Target size={20} />
              </div>
              <span className="points-label">Ora Hai</span>
              <span className="points-value">{newTotalPoints} {pointsName.toLowerCase()}</span>
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
                onTouchEnd={(e) => {
                  e.preventDefault(); // Previene il click dopo il touch
                  handleConfirm();
                }}
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