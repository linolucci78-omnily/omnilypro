import React from 'react';
import { X, Gift, AlertCircle } from 'lucide-react';
import { Reward } from '../services/rewardsService';
import './ConfirmRedeemModal.css';

interface ConfirmRedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reward: Reward | null;
  customerPoints: number;
  pointsName?: string;
}

const ConfirmRedeemModal: React.FC<ConfirmRedeemModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  reward,
  customerPoints,
  pointsName = 'Punti'
}) => {
  if (!isOpen || !reward) return null;

  const pointsAfterRedemption = customerPoints - reward.points_required;

  return (
    <>
      <div className="confirm-redeem-backdrop" onClick={onClose} />
      <div className="confirm-redeem-modal">
        <div className="confirm-redeem-header">
          <h3>Conferma Riscatto</h3>
          <button className="confirm-redeem-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="confirm-redeem-content">
          {/* Reward Preview */}
          <div className="confirm-redeem-preview">
            {reward.image_url ? (
              <img
                src={reward.image_url}
                alt={reward.name}
                className="confirm-redeem-image"
              />
            ) : (
              <div className="confirm-redeem-icon">
                <Gift size={48} />
              </div>
            )}
          </div>

          <h4 className="confirm-redeem-title">{reward.name}</h4>
          {reward.description && (
            <p className="confirm-redeem-description">{reward.description}</p>
          )}

          {/* Points Summary */}
          <div className="confirm-redeem-summary">
            <div className="confirm-redeem-row">
              <span className="confirm-redeem-label">{pointsName} Attuali</span>
              <span className="confirm-redeem-value">{customerPoints}</span>
            </div>
            <div className="confirm-redeem-row cost">
              <span className="confirm-redeem-label">Costo Premio</span>
              <span className="confirm-redeem-value">-{reward.points_required}</span>
            </div>
            <div className="confirm-redeem-divider" />
            <div className="confirm-redeem-row total">
              <span className="confirm-redeem-label">{pointsName} Rimanenti</span>
              <span className="confirm-redeem-value">{pointsAfterRedemption}</span>
            </div>
          </div>

          {/* Warning */}
          <div className="confirm-redeem-warning">
            <AlertCircle size={20} />
            <p>Questa azione non può essere annullata. Confermi di voler riscattare questo premio?</p>
          </div>
        </div>

        <div className="confirm-redeem-actions">
          <button className="confirm-redeem-btn-cancel" onClick={onClose}>
            Annulla
          </button>
          <button className="confirm-redeem-btn-confirm" onClick={onConfirm}>
            Conferma Riscatto
          </button>
        </div>
      </div>
    </>
  );
};

export default ConfirmRedeemModal;
