import React, { useEffect, useRef } from 'react';
import { CheckCircle } from 'lucide-react';
import './SaleSuccessModal.css';
import NotificationAnimations, { NotificationAnimationsRef } from './NotificationAnimations';

interface SaleSuccessModalProps {
  isOpen: boolean;
  customerName: string;
  pointsEarned: number;
  pointsName?: string;
  onClose: () => void;
}

const SaleSuccessModal: React.FC<SaleSuccessModalProps> = ({
  isOpen,
  customerName,
  pointsEarned,
  pointsName = 'Punti',
  onClose
}) => {
  const animationsRef = useRef<NotificationAnimationsRef>(null);

  // Triggera fontana di monete quando il modale si apre
  useEffect(() => {
    if (isOpen) {
      console.log('🎉 SaleSuccessModal aperto - triggering coin fountain con', pointsEarned, 'punti');
      console.log('🔍 animationsRef.current disponibile:', !!animationsRef.current);

      // Piccolo delay per dare tempo al canvas di renderizzarsi
      setTimeout(() => {
        if (animationsRef.current && animationsRef.current.triggerCoinFountain) {
          console.log('✅ Chiamando triggerCoinFountain...');
          animationsRef.current.triggerCoinFountain(pointsEarned);
        } else {
          console.error('❌ animationsRef.current o triggerCoinFountain non disponibile!', {
            hasRef: !!animationsRef.current,
            hasMethod: !!(animationsRef.current?.triggerCoinFountain)
          });
        }
      }, 100);
    }
  }, [isOpen, pointsEarned]);

  // Auto-close dopo 3 secondi
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <>
      {/* Coin Fountain Animation - SEMPRE montato PRIMA del modale */}
      <NotificationAnimations ref={animationsRef} />

      {isOpen && (
        <>
          <div className="sale-success-overlay" onClick={onClose} />

          <div className="sale-success-modal">
            <div className="sale-success-icon">
              <CheckCircle size={80} strokeWidth={2} />
            </div>

            <h1 className="sale-success-title">Vendita Registrata!</h1>

            <p className="sale-success-message">
              Hai accreditato <strong>{pointsEarned} {pointsName.toLowerCase()}</strong>
            </p>

            <p className="sale-success-customer">
              a <strong>{customerName}</strong>
            </p>

            {/* Progress bar per auto-close */}
            <div className="sale-success-progress">
              <div className="sale-success-progress-bar" />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default SaleSuccessModal;
