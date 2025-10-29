/**
 * Validate Subscription Modal
 *
 * Modal for validating and using subscriptions at POS.
 * Flow: Scan/enter code → Validate → Select item → Confirm usage → Print receipt
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  QrCode,
  Search,
  Check,
  AlertCircle,
  XCircle,
  AlertTriangle,
  Package,
  Calendar,
  TrendingUp,
  User,
  Clock,
  Tag,
  Loader,
  Printer,
  CreditCard
} from 'lucide-react';
import { subscriptionsService } from '../services/subscriptionsService';
import { nfcCardsApi } from '../lib/supabase';
import { createPrintService } from '../services/printService';
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
  organizationName: string;
  onSuccess: () => void;
  printService?: any;
}

type Step = 'scan' | 'select-subscription' | 'invalid' | 'success';

const ValidateSubscriptionModal: React.FC<ValidateSubscriptionModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  onSuccess,
  printService
}) => {
  const [step, setStep] = useState<Step>('scan');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NFC
  const [isReadingNFC, setIsReadingNFC] = useState(false);
  const [customerSubscriptions, setCustomerSubscriptions] = useState<CustomerSubscription[]>([]);
  const busyRef = useRef(false);

  // Subscription code
  const [subscriptionCode, setSubscriptionCode] = useState('');

  // Validation result
  const [validationResult, setValidationResult] = useState<SubscriptionValidationResult | null>(null);
  const [subscription, setSubscription] = useState<CustomerSubscription | null>(null);
  const [template, setTemplate] = useState<SubscriptionTemplate | null>(null);

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

      // Setup QR callback for Android bridge
      (window as any).validateSubQRCallback = (result: any) => {
        console.log('📱 QR Subscription callback:', result);

        try {
          const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;

          if (parsedResult.cancelled) {
            console.log('📱 QR scan cancelled');
            return;
          }

          if (parsedResult.error) {
            console.error('📱 QR scan error:', parsedResult.error);
            setError('Errore durante la scansione del QR code');
            return;
          }

          // Extract QR data from various possible fields
          const qrData = parsedResult.content || parsedResult.qrCode || parsedResult.data;

          if (parsedResult.success && qrData) {
            console.log('📱 QR code scanned successfully:', qrData);
            const code = qrData.toString().toUpperCase();

            // Check if it's a subscription code format
            if (code.startsWith('SUB:')) {
              const subCode = code.replace('SUB:', '');
              console.log('📱 Extracted subscription code:', subCode);
              setSubscriptionCode(subCode);
              validateSubscription(subCode);
            } else {
              console.log('📱 Using code as-is:', code);
              setSubscriptionCode(code);
              validateSubscription(code);
            }
          }
        } catch (err) {
          console.error('Error parsing QR result:', err);
          setError('Errore nella lettura del QR code');
        }
      };
    }

    // Cleanup
    return () => {
      delete (window as any).validateSubQRCallback;
    };
  }, [isOpen]);

  // Setup NFC handler
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).OmnilyPOS && isOpen) {
      (window as any).validateSubscriptionNFCHandler = async (rawResult: any) => {
        console.log('🔵 NFC CALLBACK - Membership Validation - Raw result:', rawResult);

        let result = rawResult;
        if (typeof rawResult === 'string') {
          try {
            result = JSON.parse(rawResult);
          } catch (e) {
            console.error('❌ Failed to parse NFC result:', e);
            result = { success: false, error: 'Parse failed' };
          }
        }

        setIsReadingNFC(false);

        if (result && result.success) {
          console.log('✅ NFC SUCCESS - Card UID:', result.cardNo || result.rfUid);
          if ((window as any).OmnilyPOS.beep) {
            (window as any).OmnilyPOS.beep("1", "150");
          }

          const cardUID = result.cardNo || result.rfUid;
          if (!cardUID) {
            console.error("UID della tessera non trovato");
            if ((window as any).OmnilyPOS.showToast) {
              (window as any).OmnilyPOS.showToast('Errore: UID non letto');
            }
            return;
          }

          await handleNFCCardRead(cardUID);
        } else {
          console.log('❌ NFC FAILED - Error:', result?.error);
          if ((window as any).OmnilyPOS.beep) {
            (window as any).OmnilyPOS.beep("3", "50");
          }
          if ((window as any).OmnilyPOS.showToast) {
            (window as any).OmnilyPOS.showToast(result?.error || 'Lettura NFC fallita');
          }
        }
      };

      console.log('📡 NFC Handler registered: validateSubscriptionNFCHandler');
    }

    return () => {
      if (typeof window !== 'undefined') {
        const bridge = (window as any).OmnilyPOS;
        if (bridge && bridge.stopNFCReading) {
          bridge.stopNFCReading();
          console.log("🧹 CLEANUP: Lettura NFC fermata");
        }
        delete (window as any).validateSubscriptionNFCHandler;
      }
    };
  }, [isOpen, organizationId]);

  const resetForm = () => {
    setStep('scan');
    setLoading(false);
    setError(null);
    setIsReadingNFC(false);
    setCustomerSubscriptions([]);
    setSubscriptionCode('');
    setValidationResult(null);
    setSubscription(null);
    setTemplate(null);
    setUsageSuccess(false);
    setRemainingUses({});
  };

  const handleReadNFC = () => {
    if (busyRef.current) {
      console.log('⚠️ NFC read already in progress');
      return;
    }

    if (typeof window === 'undefined' || !(window as any).OmnilyPOS) {
      setError('Bridge Android non disponibile');
      return;
    }

    const bridge = (window as any).OmnilyPOS;
    if (!bridge.readNFCCard) {
      setError('Funzione NFC non disponibile');
      return;
    }

    busyRef.current = true;
    setIsReadingNFC(true);
    setError(null);

    console.log('🔵 Starting NFC read...');
    bridge.readNFCCard('validateSubscriptionNFCHandler');
  };

  const handleNFCCardRead = async (cardUID: string) => {
    busyRef.current = false;
    console.log('🔍 Looking for customer with NFC UID:', cardUID);

    try {
      setLoading(true);

      // Get NFC card with customer info
      const nfcCard = await nfcCardsApi.getByUID(organizationId, cardUID);

      if (!nfcCard || !nfcCard.customer) {
        setError('Tessera non associata a nessun cliente');
        if ((window as any).OmnilyPOS?.showToast) {
          (window as any).OmnilyPOS.showToast('Tessera non associata');
        }
        return;
      }

      console.log('✅ Customer found:', nfcCard.customer.name);

      // Get active subscriptions for this customer
      const response = await subscriptionsService.getSubscriptions({
        organization_id: organizationId,
        customer_id: nfcCard.customer.id,
        status: ['active', 'paused']
      });

      if (!response.data || response.data.length === 0) {
        setError(`Nessuna membership attiva per ${nfcCard.customer.name}`);
        if ((window as any).OmnilyPOS?.showToast) {
          (window as any).OmnilyPOS.showToast('Nessuna membership attiva');
        }
        return;
      }

      console.log(`✅ Found ${response.data.length} subscription(s) for customer`);
      setCustomerSubscriptions(response.data);

      // If only one subscription, select it automatically
      if (response.data.length === 1) {
        const sub = response.data[0];
        setSubscriptionCode(sub.subscription_code);
        await validateSubscription(sub.subscription_code);
      } else {
        // Multiple subscriptions - let user choose
        setStep('select-subscription');
      }
    } catch (err: any) {
      console.error('❌ Error reading NFC card:', err);
      setError(err.message || 'Errore durante la lettura della tessera');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubscription = async (sub: CustomerSubscription) => {
    setSubscriptionCode(sub.subscription_code);
    await validateSubscription(sub.subscription_code);
  };

  const validateSubscription = async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await subscriptionsService.validateSubscription({
        subscription_code: code,
        organization_id: organizationId
      });

      setValidationResult(result);

      if (result.is_valid && result.subscription && result.template) {
        setSubscription(result.subscription);
        setTemplate(result.template);
        setRemainingUses(result.remaining_uses || {});

        // Show confirmation step instead of using automatically
        setStep('confirmed');
      } else {
        // Even if invalid, set subscription and template so we can show customer info
        if (result.subscription) {
          setSubscription(result.subscription);
        }
        if (result.template) {
          setTemplate(result.template);
        }
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

  const handleScan = async () => {
    if (!subscriptionCode.trim()) {
      setError('Inserisci un codice membership');
      return;
    }

    await validateSubscription(subscriptionCode.trim());
  };

  const useSubscriptionDirectly = async (
    sub: CustomerSubscription,
    tmpl: SubscriptionTemplate,
    remaining: { daily?: number; weekly?: number; total?: number }
  ) => {
    try {
      console.log('🔵 Using subscription:', sub.subscription_code);

      const response = await subscriptionsService.useSubscription({
        subscription_code: sub.subscription_code,
        organization_id: organizationId,
        item_name: 'Utilizzo Abbonamento', // Generic item name for membership usage
        quantity: 1
      });

      console.log('📊 Use subscription response:', response);

      if (!response.success) {
        throw new Error(response.error || 'Errore durante l\'utilizzo dell\'abbonamento');
      }

      // Update remaining uses
      const newRemaining = {
        daily: remaining.daily !== undefined ? Math.max(0, remaining.daily - 1) : undefined,
        weekly: remaining.weekly !== undefined ? Math.max(0, remaining.weekly - 1) : undefined,
        total: remaining.total !== undefined ? Math.max(0, remaining.total - 1) : undefined
      };
      setRemainingUses(newRemaining);

      console.log('✅ Setting step to success');
      setUsageSuccess(true);
      setStep('success');

      // Print receipt
      if (sub.customer) {
        console.log('🖨️ Printing usage receipt...');
        await printUsageReceipt(newRemaining, sub, tmpl);
      } else {
        console.log('⚠️ No customer, skipping receipt');
      }

      // DON'T call onSuccess() here - let user close manually from success screen
      // onSuccess();
    } catch (err: any) {
      console.error('❌ Error using subscription:', err);
      setError(err.message || 'Errore durante l\'utilizzo dell\'abbonamento');
      setStep('invalid');
    }
  };

  const printUsageReceipt = async (
    remaining: typeof remainingUses,
    sub: CustomerSubscription,
    tmpl: SubscriptionTemplate
  ) => {
    try {
      console.log('🖨️ Creating print service...');

      const printConfig = {
        printerWidth: 48,
        fontSize: 20,
        fontSizeLarge: 30,
        printDensity: 0
      };

      const printSvc = createPrintService(printConfig);
      const initialized = await printSvc.initialize();

      if (!initialized) {
        console.error('❌ Failed to initialize print service');
        return;
      }

      console.log('✅ Print service initialized, printing usage receipt...');
      console.log('📊 Remaining uses to print:', remaining);

      const printed = await printSvc.printSubscriptionUsage({
        subscription_code: sub.subscription_code,
        customer_name: sub.customer?.name || 'Cliente',
        template_name: tmpl.name,
        item_name: 'Utilizzo Abbonamento',
        remaining_daily: remaining.daily,
        remaining_total: remaining.total,
        cashier: 'POS',
        organizationName: organizationName
      });

      if (printed) {
        console.log('✅ Usage receipt printed successfully!');
      } else {
        console.error('❌ Print failed');
      }
    } catch (err) {
      console.error('❌ Error printing receipt:', err);
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
            <Package size={24} />
            <h2>Valida Membership</h2>
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
                {isReadingNFC ? <CreditCard size={64} className="spinning" /> : <QrCode size={64} />}
              </div>

              <h3>{isReadingNFC ? 'Avvicina Tessera NFC...' : 'Scansiona o Inserisci Codice'}</h3>
              <p className="scan-description">
                {isReadingNFC
                  ? 'Avvicina la tessera NFC del cliente al lettore'
                  : 'Scansiona il QR code, usa la tessera NFC o inserisci manualmente il codice'}
              </p>

              {!isReadingNFC && (
                <>
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
                    Valida Membership
                  </button>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    margin: '1.5rem 0 1rem 0',
                    color: '#6b7280',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                    <span>oppure</span>
                    <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                  </div>

                  {/* Grid 2x1 per i pulsanti affiancati */}
                  <div className="validation-buttons-grid">
                    <button
                      className="validation-grid-btn validation-btn-qr"
                      onClick={() => {
                        console.log('📱 Starting QR scan for subscription');

                        if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
                          const bridge = (window as any).OmnilyPOS;

                          if (bridge.readQRCode) {
                            setError(null);
                            console.log('📱 Calling bridge.readQRCode with callback: validateSubQRCallback');
                            bridge.readQRCode('validateSubQRCallback');
                          } else {
                            console.log('❌ readQRCode not available in bridge');
                            setError('Scanner QR non disponibile su questo dispositivo');
                          }
                        } else {
                          console.log('❌ OmnilyPOS bridge not available');
                          setError('Scanner QR disponibile solo su app Android POS');
                        }
                      }}
                      disabled={loading}
                    >
                      <QrCode size={48} />
                      <span>Scansiona QR Code</span>
                    </button>

                    <button
                      className="validation-grid-btn validation-btn-nfc"
                      onClick={handleReadNFC}
                      disabled={loading}
                    >
                      <CreditCard size={48} />
                      <span>Usa Tessera NFC</span>
                    </button>
                  </div>
                </>
              )}

              {isReadingNFC && (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setIsReadingNFC(false);
                    busyRef.current = false;
                    if ((window as any).OmnilyPOS?.stopNFCReading) {
                      (window as any).OmnilyPOS.stopNFCReading();
                    }
                  }}
                >
                  Annulla
                </button>
              )}
            </div>
          )}

          {/* Step 2: Select Subscription (when customer has multiple) */}
          {step === 'select-subscription' && customerSubscriptions.length > 0 && (
            <div className="select-item-section">
              <h3>Seleziona Membership</h3>
              <p className="scan-description">
                Il cliente ha {customerSubscriptions.length} membership attive. Seleziona quale utilizzare:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                {customerSubscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => handleSelectSubscription(sub)}
                    style={{
                      padding: '1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#ef4444';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937' }}>
                        {sub.template?.name || 'N/A'}
                      </div>
                      {getStatusBadge(sub.status)}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#374151' }}>Codice:</div>
                        <div>{sub.subscription_code}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#374151' }}>Scadenza:</div>
                        <div>{formatDate(sub.end_date)}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#374151' }}>Utilizzi:</div>
                        <div>{sub.usage_count} / {sub.template?.total_limit || '∞'}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#374151' }}>Cliente:</div>
                        <div>{sub.customer?.name || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="btn-back-text"
                onClick={() => setStep('scan')}
                style={{ marginTop: '1.5rem' }}
              >
                Torna Indietro
              </button>
            </div>
          )}

          {/* Step 2: Confirmed - Show details and ask for confirmation */}
          {step === 'confirmed' && subscription && template && (
            <div className="validation-result">
              <div className="result-icon success">
                <Check size={64} />
              </div>

              <h3>Membership Valida</h3>

              {/* Customer Avatar */}
              {subscription.customer?.avatar_url && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <img
                    src={subscription.customer.avatar_url}
                    alt={subscription.customer.name}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #10b981',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}
                  />
                </div>
              )}

              <div className="subscription-details-card">
                <div className="detail-header">
                  <div className="detail-code">{subscription.subscription_code}</div>
                  {getStatusBadge(subscription.status)}
                </div>

                <div className="detail-grid">
                  <div className="detail-item">
                    <User size={20} className="detail-icon" />
                    <div>
                      <div className="detail-label">Cliente</div>
                      <div className="detail-value">{subscription.customer?.name || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="detail-item">
                    <Package size={20} className="detail-icon" />
                    <div>
                      <div className="detail-label">Piano</div>
                      <div className="detail-value">{template.name}</div>
                    </div>
                  </div>

                  <div className="detail-item">
                    <Calendar size={20} className="detail-icon" />
                    <div>
                      <div className="detail-label">Scadenza</div>
                      <div className="detail-value">{formatDate(subscription.end_date)}</div>
                    </div>
                  </div>

                  <div className="detail-item">
                    <TrendingUp size={20} className="detail-icon" />
                    <div>
                      <div className="detail-label">Utilizzi Totali</div>
                      <div className="detail-value">
                        {subscription.usage_count} / {template.total_limit || '∞'}
                      </div>
                    </div>
                  </div>
                </div>

                {(remainingUses.daily !== undefined || remainingUses.weekly !== undefined || remainingUses.total !== undefined) && (
                  <div className="remaining-uses">
                    <h4>Utilizzi Disponibili</h4>
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
                          <div className="use-label">Totali</div>
                          <div className="use-value">{remainingUses.total}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                className="btn-use-subscription"
                onClick={() => useSubscriptionDirectly(subscription, template, remainingUses)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader size={20} className="spinning" />
                    Registrazione...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Utilizza Membership
                  </>
                )}
              </button>

              <button
                className="btn-back-text"
                onClick={() => setStep('scan')}
                style={{ marginTop: '1rem' }}
              >
                Annulla
              </button>
            </div>
          )}

          {/* Step 3: Invalid Subscription */}
          {step === 'invalid' && (
            <div className="validation-result invalid">
              <div className="result-icon error">
                <AlertTriangle size={48} />
              </div>

              <h3>
                Membership Non Valida
                {subscription?.customer?.name && ` - ${subscription.customer.name}`}
              </h3>

              {/* Customer Avatar */}
              {subscription?.customer?.avatar_url && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <img
                    src={subscription.customer.avatar_url}
                    alt={subscription.customer.name}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #ef4444',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                    }}
                  />
                </div>
              )}

              <div className="error-details">
                <p className="error-reason">
                  {validationResult?.reason || 'Membership non trovata o non valida'}
                </p>

                {subscription && (
                  <div className="subscription-info-error">
                    <div className="info-row-error">
                      <span className="label-error">Codice:</span>
                      <span className="value-error">{subscription.subscription_code}</span>
                    </div>
                    {template && (
                      <div className="info-row-error">
                        <span className="label-error">Piano:</span>
                        <span className="value-error">{template.name}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                className="btn-try-again"
                onClick={() => setStep('scan')}
              >
                Scansiona Altra Membership
              </button>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && subscription && template && (
            <div className="success-section">
              <div className="success-icon">
                <Check size={48} />
              </div>

              <h3>Utilizzo Registrato!</h3>

              <div className="usage-summary">
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
                onClick={() => {
                  onSuccess(); // Refresh stats/subscriptions list
                  onClose();   // Close modal
                }}
              >
                Chiudi
              </button>

              <button
                className="btn-back-text"
                onClick={() => {
                  onSuccess(); // Refresh stats/subscriptions list
                  resetForm(); // Start new validation
                }}
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
