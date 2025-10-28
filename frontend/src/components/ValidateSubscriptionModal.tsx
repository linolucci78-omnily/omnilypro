/**
 * Validate Subscription Modal
 *
 * Modal for validating and using subscriptions at POS.
 * Flow: Scan/enter code → Validate → Select item → Confirm usage → Print receipt
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Search,
  Check,
  AlertCircle,
  Package,
  Calendar,
  TrendingUp,
  User,
  Clock,
  Tag,
  Loader,
  Printer
} from 'lucide-react';
import { subscriptionsService } from '../services/subscriptionsService';
import type {
  SubscriptionValidationResult,
  CustomerSubscription,
  SubscriptionTemplate
} from '../types/subscription';
import './ValidateSubscriptionModal.css';

interface ValidateSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onSuccess: () => void;
  printService?: any;
}

type Step = 'scan' | 'valid' | 'invalid' | 'select-item' | 'success';

const ValidateSubscriptionModal: React.FC<ValidateSubscriptionModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  onSuccess,
  printService
}) => {
  const [step, setStep] = useState<Step>('scan');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscription code
  const [subscriptionCode, setSubscriptionCode] = useState('');

  // Validation result
  const [validationResult, setValidationResult] = useState<SubscriptionValidationResult | null>(null);
  const [subscription, setSubscription] = useState<CustomerSubscription | null>(null);
  const [template, setTemplate] = useState<SubscriptionTemplate | null>(null);

  // Item selection
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemPrice, setItemPrice] = useState<number | undefined>();

  // Usage result
  const [usageSuccess, setUsageSuccess] = useState(false);
  const [remainingUses, setRemainingUses] = useState<{
    daily?: number;
    weekly?: number;
    total?: number;
  }>({});

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setStep('scan');
    setLoading(false);
    setError(null);
    setSubscriptionCode('');
    setValidationResult(null);
    setSubscription(null);
    setTemplate(null);
    setItemName('');
    setItemCategory('');
    setItemPrice(undefined);
    setUsageSuccess(false);
    setRemainingUses({});
  };

  const handleScan = async () => {
    if (!subscriptionCode.trim()) {
      setError('Inserisci un codice abbonamento');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await subscriptionsService.validateSubscription({
        subscription_code: subscriptionCode.trim(),
        organization_id: organizationId
      });

      setValidationResult(result);

      if (result.is_valid && result.subscription && result.template) {
        setSubscription(result.subscription);
        setTemplate(result.template);
        setRemainingUses(result.remaining_uses || {});
        setStep('valid');
      } else {
        setStep('invalid');
      }
    } catch (err: any) {
      console.error('Error validating subscription:', err);
      setError(err.message || 'Errore durante la validazione');
      setStep('invalid');
    } finally {
      setLoading(false);
    }
  };

  const handleUseSubscription = async () => {
    if (!itemName.trim()) {
      setError('Inserisci il nome dell\'articolo utilizzato');
      return;
    }

    if (!subscription) return;

    setLoading(true);
    setError(null);

    try {
      const response = await subscriptionsService.useSubscription({
        subscription_code: subscription.subscription_code,
        organization_id: organizationId,
        item_name: itemName.trim(),
        item_category: itemCategory.trim() || undefined,
        item_price: itemPrice,
        quantity: 1
      });

      if (!response.success) {
        throw new Error(response.error || 'Errore durante l\'utilizzo dell\'abbonamento');
      }

      // Update remaining uses
      const newRemaining = {
        daily: remainingUses.daily !== undefined ? Math.max(0, remainingUses.daily - 1) : undefined,
        weekly: remainingUses.weekly !== undefined ? Math.max(0, remainingUses.weekly - 1) : undefined,
        total: remainingUses.total !== undefined ? Math.max(0, remainingUses.total - 1) : undefined
      };
      setRemainingUses(newRemaining);

      setUsageSuccess(true);
      setStep('success');

      // Print receipt
      if (printService && subscription.customer) {
        await printUsageReceipt(newRemaining);
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error using subscription:', err);
      setError(err.message || 'Errore durante l\'utilizzo dell\'abbonamento');
    } finally {
      setLoading(false);
    }
  };

  const printUsageReceipt = async (remaining: typeof remainingUses) => {
    if (!printService || !subscription || !template) return;

    try {
      await printService.printSubscriptionUsage({
        subscription_code: subscription.subscription_code,
        customer_name: subscription.customer?.name || 'Cliente',
        template_name: template.name,
        item_name: itemName,
        remaining_daily: remaining.daily,
        remaining_total: remaining.total,
        cashier: 'POS',
        organizationName: 'Organization'
      });
    } catch (err) {
      console.error('Error printing receipt:', err);
      // Don't fail the whole operation if printing fails
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      active: { label: 'Attivo', color: '#10b981' },
      paused: { label: 'In Pausa', color: '#f59e0b' },
      expired: { label: 'Scaduto', color: '#6b7280' },
      cancelled: { label: 'Annullato', color: '#ef4444' }
    };

    const badge = badges[status] || badges.active;

    return (
      <span style={{
        padding: '0.375rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: `${badge.color}20`,
        color: badge.color
      }}>
        {badge.label}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="validate-subscription-overlay" onClick={onClose} />

      <div className="validate-subscription-modal">
        {/* Header */}
        <div className="validate-subscription-header">
          <div className="validate-subscription-header-info">
            <QrCode size={24} />
            <h2>Valida Abbonamento</h2>
          </div>
          <button onClick={onClose} className="validate-subscription-close-btn">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="validate-subscription-content">
          {error && (
            <div className="validate-subscription-error">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Step 1: Scan/Enter Code */}
          {step === 'scan' && (
            <div className="scan-section">
              <div className="scan-icon-wrapper">
                <QrCode size={64} />
              </div>

              <h3>Scansiona o Inserisci Codice</h3>
              <p className="scan-description">
                Scansiona il QR code dell'abbonamento o inserisci manualmente il codice
              </p>

              <div className="code-input-wrapper">
                <input
                  type="text"
                  placeholder="SUB-2024-00001"
                  value={subscriptionCode}
                  onChange={(e) => setSubscriptionCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                  className="code-input"
                  autoFocus
                />
              </div>

              <button
                className="btn-validate"
                onClick={handleScan}
                disabled={loading || !subscriptionCode.trim()}
              >
                {loading ? <Loader size={20} className="spinning" /> : <Search size={20} />}
                Valida Abbonamento
              </button>
            </div>
          )}

          {/* Step 2: Valid Subscription */}
          {step === 'valid' && subscription && template && (
            <div className="validation-result valid">
              <div className="result-icon success">
                <Check size={48} />
              </div>

              <h3>Abbonamento Valido!</h3>

              <div className="subscription-details-card">
                <div className="detail-header">
                  <div className="detail-code">{subscription.subscription_code}</div>
                  {getStatusBadge(subscription.status)}
                </div>

                <div className="detail-grid">
                  <div className="detail-item">
                    <User size={16} className="detail-icon" />
                    <div>
                      <div className="detail-label">Cliente</div>
                      <div className="detail-value">{subscription.customer?.name || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="detail-item">
                    <Package size={16} className="detail-icon" />
                    <div>
                      <div className="detail-label">Abbonamento</div>
                      <div className="detail-value">{template.name}</div>
                    </div>
                  </div>

                  <div className="detail-item">
                    <Calendar size={16} className="detail-icon" />
                    <div>
                      <div className="detail-label">Scadenza</div>
                      <div className="detail-value">{formatDate(subscription.end_date)}</div>
                    </div>
                  </div>

                  <div className="detail-item">
                    <TrendingUp size={16} className="detail-icon" />
                    <div>
                      <div className="detail-label">Utilizzi</div>
                      <div className="detail-value">
                        {subscription.usage_count} / {template.total_limit || '∞'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remaining uses */}
                <div className="remaining-uses">
                  <h4>Utilizzi Rimanenti</h4>
                  <div className="uses-grid">
                    {remainingUses.daily !== undefined && (
                      <div className="use-item">
                        <div className="use-label">Oggi</div>
                        <div className="use-value">{remainingUses.daily}</div>
                      </div>
                    )}
                    {remainingUses.weekly !== undefined && (
                      <div className="use-item">
                        <div className="use-label">Settimana</div>
                        <div className="use-value">{remainingUses.weekly}</div>
                      </div>
                    )}
                    {remainingUses.total !== undefined && (
                      <div className="use-item">
                        <div className="use-label">Totale</div>
                        <div className="use-value">{remainingUses.total}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Time restrictions */}
                {template.allowed_hours && (
                  <div className="restrictions">
                    <Clock size={16} />
                    <span>
                      Valido: {template.allowed_hours.start} - {template.allowed_hours.end}
                    </span>
                  </div>
                )}

                {/* Category restrictions */}
                {template.included_categories && template.included_categories.length > 0 && (
                  <div className="restrictions">
                    <Tag size={16} />
                    <span>
                      Categorie: {template.included_categories.join(', ')}
                    </span>
                  </div>
                )}
              </div>

              <button
                className="btn-use-subscription"
                onClick={() => setStep('select-item')}
              >
                <Check size={20} />
                Utilizza Abbonamento
              </button>

              <button
                className="btn-back-text"
                onClick={() => setStep('scan')}
              >
                Scansiona Altro Codice
              </button>
            </div>
          )}

          {/* Step 3: Invalid Subscription */}
          {step === 'invalid' && (
            <div className="validation-result invalid">
              <div className="result-icon error">
                <AlertCircle size={48} />
              </div>

              <h3>Abbonamento Non Valido</h3>

              <div className="error-message">
                {validationResult?.reason || 'Abbonamento non trovato o non valido'}
              </div>

              <button
                className="btn-try-again"
                onClick={() => setStep('scan')}
              >
                Riprova
              </button>
            </div>
          )}

          {/* Step 4: Select Item */}
          {step === 'select-item' && (
            <div className="select-item-section">
              <h3>Seleziona Articolo Utilizzato</h3>

              <div className="item-form">
                <div className="form-group">
                  <label>Nome Articolo *</label>
                  <input
                    type="text"
                    placeholder="Es: Caffè Espresso, Pizza Margherita..."
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="form-input"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label>Categoria (opzionale)</label>
                  <input
                    type="text"
                    placeholder="Es: Bevande, Pizze, Dessert..."
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Prezzo (opzionale)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={itemPrice || ''}
                    onChange={(e) => setItemPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="item-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setStep('valid')}
                  disabled={loading}
                >
                  Indietro
                </button>
                <button
                  className="btn-primary"
                  onClick={handleUseSubscription}
                  disabled={loading || !itemName.trim()}
                >
                  {loading ? <Loader size={20} className="spinning" /> : <Check size={20} />}
                  Conferma Utilizzo
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 'success' && subscription && template && (
            <div className="success-section">
              <div className="success-icon">
                <Check size={48} />
              </div>

              <h3>Utilizzo Registrato!</h3>

              <div className="usage-summary">
                <div className="summary-item">
                  <span className="summary-label">Articolo:</span>
                  <span className="summary-value">{itemName}</span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">Cliente:</span>
                  <span className="summary-value">{subscription.customer?.name}</span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">Abbonamento:</span>
                  <span className="summary-value">{template.name}</span>
                </div>

                {remainingUses.daily !== undefined && (
                  <div className="summary-item highlight">
                    <span className="summary-label">Utilizzi rimanenti oggi:</span>
                    <span className="summary-value">{remainingUses.daily}</span>
                  </div>
                )}

                {remainingUses.total !== undefined && (
                  <div className="summary-item highlight">
                    <span className="summary-label">Utilizzi rimanenti totali:</span>
                    <span className="summary-value">{remainingUses.total}</span>
                  </div>
                )}
              </div>

              {printService && (
                <button
                  className="btn-print"
                  onClick={() => printUsageReceipt(remainingUses)}
                >
                  <Printer size={20} />
                  Ristampa Ricevuta
                </button>
              )}

              <button
                className="btn-primary"
                onClick={onClose}
              >
                Chiudi
              </button>

              <button
                className="btn-back-text"
                onClick={resetForm}
              >
                Valida Altro Abbonamento
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ValidateSubscriptionModal;
