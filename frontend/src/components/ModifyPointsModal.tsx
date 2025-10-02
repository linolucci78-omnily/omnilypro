import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import ConfirmModal from './UI/ConfirmModal';

interface ModifyPointsModalProps {
  isOpen: boolean;
  customer: {
    name: string;
    points: number;
  } | null;
  onClose: () => void;
  onConfirm: (points: number, reason: string) => void;
}

const ModifyPointsModal: React.FC<ModifyPointsModalProps> = ({
  isOpen,
  customer,
  onClose,
  onConfirm
}) => {
  const [pointsChange, setPointsChange] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !customer) return null;

  const handleConfirm = () => {
    if (pointsChange === 0) {
      setErrorMessage('Devi inserire un valore diverso da zero per modificare i punti');
      setShowErrorModal(true);
      return;
    }
    if (!reason.trim()) {
      setErrorMessage('Il motivo della modifica è obbligatorio e non può essere vuoto');
      setShowErrorModal(true);
      return;
    }
    onConfirm(pointsChange, reason);
    setPointsChange(0);
    setReason('');
  };

  const newPoints = customer.points + pointsChange;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827'
          }}>
            Modifica Punti - {customer.name}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Punti Attuali */}
          <div style={{
            backgroundColor: '#f3f4f6',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              Punti Attuali
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#111827' }}>
              {customer.points}
            </div>
          </div>

          {/* Incrementa/Decrementa */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Modifica Punti
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={() => setPointsChange(Math.max(pointsChange - 10, -customer.points))}
                style={{
                  padding: '12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: '500'
                }}
              >
                <Minus size={16} /> 10
              </button>
              <input
                type="number"
                value={pointsChange}
                onChange={(e) => setPointsChange(parseInt(e.target.value) || 0)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: '600',
                  textAlign: 'center',
                  color: pointsChange > 0 ? '#10b981' : pointsChange < 0 ? '#ef4444' : '#6b7280'
                }}
                placeholder="0"
              />
              <button
                onClick={() => setPointsChange(pointsChange + 10)}
                style={{
                  padding: '12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: '500'
                }}
              >
                <Plus size={16} /> 10
              </button>
            </div>
          </div>

          {/* Nuovi Punti */}
          <div style={{
            backgroundColor: pointsChange > 0 ? '#d1fae5' : pointsChange < 0 ? '#fee2e2' : '#f3f4f6',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              Nuovi Punti
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: pointsChange > 0 ? '#10b981' : pointsChange < 0 ? '#ef4444' : '#111827' }}>
              {newPoints}
            </div>
          </div>

          {/* Motivo */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Motivo della Modifica *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Es. Rettifica errore, Bonus fedeltà, Rimborso..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          padding: '24px',
          borderTop: '1px solid #e5e7eb',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: '#f9fafb',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Annulla
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              border: 'none',
              backgroundColor: '#3b82f6',
              color: 'white'
            }}
          >
            Conferma Modifica
          </button>
        </div>
      </div>

      {/* Error Modal */}
      <ConfirmModal
        isOpen={showErrorModal}
        title="Attenzione"
        message={errorMessage}
        confirmText="OK"
        type="warning"
        onConfirm={() => setShowErrorModal(false)}
        onCancel={() => setShowErrorModal(false)}
      />
    </div>
  );
};

export default ModifyPointsModal;
