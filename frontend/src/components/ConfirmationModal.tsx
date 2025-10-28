/**
 * Confirmation Modal
 *
 * Reusable modal for showing success/error messages
 * Animates from top to bottom
 */

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import './ConfirmationModal.css';

interface ConfirmationModalProps {
  isOpen: boolean;
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  type,
  title,
  message,
  onClose,
  autoClose = true,
  autoCloseDelay = 3000
}) => {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={48} />;
      case 'error':
        return <XCircle size={48} />;
      case 'warning':
        return <AlertCircle size={48} />;
      default:
        return <CheckCircle size={48} />;
    }
  };

  return (
    <>
      <div className="confirmation-modal-overlay" onClick={onClose} />

      <div className={`confirmation-modal confirmation-modal-${type}`}>
        <button className="confirmation-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="confirmation-modal-icon">
          {getIcon()}
        </div>

        <h3 className="confirmation-modal-title">{title}</h3>
        <p className="confirmation-modal-message">{message}</p>

        {autoClose && (
          <div className="confirmation-modal-timer">
            <div className="timer-bar" style={{ animationDuration: `${autoCloseDelay}ms` }} />
          </div>
        )}

        <button className="confirmation-modal-button" onClick={onClose}>
          OK
        </button>
      </div>
    </>
  );
};

export default ConfirmationModal;
