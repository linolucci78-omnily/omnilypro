/**
 * Sell Subscription Modal
 *
 * Modal for selling subscriptions to customers at POS.
 * Flow: Select customer → Select template → Confirm payment → Print voucher
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  User,
  CreditCard,
  Wallet,
  Banknote,
  Package,
  Calendar,
  TrendingUp,
  Check,
  Printer,
  Loader
} from 'lucide-react';
import { subscriptionsService } from '../services/subscriptionsService';
import type {
  SubscriptionTemplate,
  CustomerSubscription,
  PaymentMethod
} from '../types/subscription';
import './SellSubscriptionModal.css';

interface SellSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  templates: SubscriptionTemplate[];
  onSuccess: (subscription: CustomerSubscription) => void;
  printService?: any;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

type Step = 'customer' | 'template' | 'confirm' | 'success';

const SellSubscriptionModal: React.FC<SellSubscriptionModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  templates,
  onSuccess,
  printService
}) => {
  const [step, setStep] = useState<Step>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customer selection
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Template selection
  const [selectedTemplate, setSelectedTemplate] = useState<SubscriptionTemplate | null>(null);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  // Result
  const [createdSubscription, setCreatedSubscription] = useState<CustomerSubscription | null>(null);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (customerSearch.length >= 2) {
      searchCustomers();
    } else {
      setCustomers([]);
    }
  }, [customerSearch]);

  const resetForm = () => {
    setStep('customer');
    setLoading(false);
    setError(null);
    setCustomerSearch('');
    setCustomers([]);
    setSelectedCustomer(null);
    setSelectedTemplate(null);
    setPaymentMethod('cash');
    setCreatedSubscription(null);
  };

  const searchCustomers = async () => {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, phone')
        .eq('organization_id', organizationId)
        .or(`name.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%,email.ilike.%${customerSearch}%`)
        .limit(10);

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error searching customers:', err);
      setCustomers([]);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setStep('template');
  };

  const handleSelectTemplate = (template: SubscriptionTemplate) => {
    setSelectedTemplate(template);
    setStep('confirm');
  };

  const handleConfirmPurchase = async () => {
    if (!selectedCustomer || !selectedTemplate) return;

    setLoading(true);
    setError(null);

    try {
      const response = await subscriptionsService.createSubscription({
        organization_id: organizationId,
        customer_id: selectedCustomer.id,
        template_id: selectedTemplate.id,
        payment_method: paymentMethod,
        amount_paid: selectedTemplate.price,
        start_date: new Date().toISOString()
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Errore durante la creazione dell\'abbonamento');
      }

      setCreatedSubscription(response.data);
      setStep('success');

      // Print voucher
      if (printService) {
        await printVoucher(response.data);
      }

      onSuccess(response.data);
    } catch (err: any) {
      console.error('Error creating subscription:', err);
      setError(err.message || 'Errore durante la creazione dell\'abbonamento');
    } finally {
      setLoading(false);
    }
  };

  const printVoucher = async (subscription: CustomerSubscription) => {
    if (!printService || !selectedTemplate || !selectedCustomer) return;

    try {
      await printService.printSubscriptionVoucher({
        subscription_code: subscription.subscription_code,
        customer_name: selectedCustomer.name,
        template_name: selectedTemplate.name,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        daily_limit: selectedTemplate.daily_limit,
        total_limit: selectedTemplate.total_limit,
        organizationName: organizationName
      });
    } catch (err) {
      console.error('Error printing voucher:', err);
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

  if (!isOpen) return null;

  return (
    <>
      <div className="sell-subscription-overlay" onClick={onClose} />

      <div className="sell-subscription-modal">
        {/* Header */}
        <div className="sell-subscription-header">
          <div className="sell-subscription-header-info">
            <Package size={24} />
            <h2>Vendi Abbonamento</h2>
          </div>
          <button onClick={onClose} className="sell-subscription-close-btn">
            <X size={24} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="sell-subscription-steps">
          <div className={`step ${step === 'customer' ? 'active' : step === 'template' || step === 'confirm' || step === 'success' ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Cliente</div>
          </div>
          <div className="step-divider" />
          <div className={`step ${step === 'template' ? 'active' : step === 'confirm' || step === 'success' ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Abbonamento</div>
          </div>
          <div className="step-divider" />
          <div className={`step ${step === 'confirm' ? 'active' : step === 'success' ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Conferma</div>
          </div>
        </div>

        {/* Content */}
        <div className="sell-subscription-content">
          {error && (
            <div className="sell-subscription-error">
              {error}
            </div>
          )}

          {/* Step 1: Customer Selection */}
          {step === 'customer' && (
            <div className="customer-selection">
              <div className="search-wrapper">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  placeholder="Cerca cliente per nome, telefono o email..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="search-input"
                  autoFocus
                />
              </div>

              {customers.length > 0 ? (
                <div className="customers-list">
                  {customers.map(customer => (
                    <div
                      key={customer.id}
                      className="customer-item"
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <User size={20} />
                      <div className="customer-info">
                        <div className="customer-name">{customer.name}</div>
                        {customer.phone && (
                          <div className="customer-detail">{customer.phone}</div>
                        )}
                        {customer.email && (
                          <div className="customer-detail">{customer.email}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : customerSearch.length >= 2 ? (
                <div className="empty-state">
                  <User size={48} style={{ opacity: 0.3 }} />
                  <p>Nessun cliente trovato</p>
                  <small style={{ opacity: 0.7 }}>
                    Crea nuovi clienti dalle impostazioni dell'organizzazione
                  </small>
                </div>
              ) : (
                <div className="empty-state">
                  <User size={48} style={{ opacity: 0.3 }} />
                  <p>Cerca un cliente per iniziare</p>
                  <small style={{ opacity: 0.7 }}>
                    Digita almeno 2 caratteri per cercare
                  </small>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Template Selection */}
          {step === 'template' && (
            <div className="template-selection">
              <div className="selected-customer-info">
                <User size={20} />
                <div>
                  <div className="info-label">Cliente selezionato:</div>
                  <div className="info-value">{selectedCustomer?.name}</div>
                </div>
              </div>

              <h3>Seleziona Abbonamento</h3>

              {templates.length === 0 ? (
                <div className="empty-state">
                  <Package size={48} style={{ opacity: 0.3 }} />
                  <p>Nessun template disponibile</p>
                </div>
              ) : (
                <div className="templates-grid">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className="template-card"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <div className="template-card-header">
                        <h4>{template.name}</h4>
                        <div className="template-price">
                          {formatCurrency(template.price)}
                        </div>
                      </div>

                      {template.description && (
                        <p className="template-description">{template.description}</p>
                      )}

                      <div className="template-details">
                        <div className="template-detail-item">
                          <Calendar size={16} />
                          <span>{template.duration_value} {template.duration_type}</span>
                        </div>
                        {template.daily_limit && (
                          <div className="template-detail-item">
                            <TrendingUp size={16} />
                            <span>{template.daily_limit}/giorno</span>
                          </div>
                        )}
                      </div>

                      {template.original_price && template.original_price > template.price && (
                        <div className="template-savings">
                          Risparmi {formatCurrency(template.original_price - template.price)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                className="btn-back"
                onClick={() => setStep('customer')}
              >
                Indietro
              </button>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirm' && selectedTemplate && selectedCustomer && (
            <div className="confirmation">
              <div className="confirmation-summary">
                <h3>Riepilogo Acquisto</h3>

                <div className="summary-item">
                  <span className="summary-label">Cliente:</span>
                  <span className="summary-value">{selectedCustomer.name}</span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">Abbonamento:</span>
                  <span className="summary-value">{selectedTemplate.name}</span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">Durata:</span>
                  <span className="summary-value">
                    {selectedTemplate.duration_value} {selectedTemplate.duration_type}
                  </span>
                </div>

                {selectedTemplate.daily_limit && (
                  <div className="summary-item">
                    <span className="summary-label">Limite giornaliero:</span>
                    <span className="summary-value">{selectedTemplate.daily_limit} utilizzi/giorno</span>
                  </div>
                )}

                {selectedTemplate.total_limit && (
                  <div className="summary-item">
                    <span className="summary-label">Limite totale:</span>
                    <span className="summary-value">{selectedTemplate.total_limit} utilizzi</span>
                  </div>
                )}

                <div className="summary-divider" />

                <div className="summary-item summary-total">
                  <span className="summary-label">Totale:</span>
                  <span className="summary-value">{formatCurrency(selectedTemplate.price)}</span>
                </div>
              </div>

              <div className="payment-method-selection">
                <h3>Metodo di Pagamento</h3>

                <div className="payment-methods">
                  <button
                    className={`payment-method-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <Banknote size={24} />
                    <span>Contanti</span>
                  </button>

                  <button
                    className={`payment-method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <CreditCard size={24} />
                    <span>Carta</span>
                  </button>

                  <button
                    className={`payment-method-btn ${paymentMethod === 'wallet' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('wallet')}
                  >
                    <Wallet size={24} />
                    <span>Portafoglio</span>
                  </button>
                </div>
              </div>

              <div className="confirmation-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setStep('template')}
                  disabled={loading}
                >
                  Indietro
                </button>
                <button
                  className="btn-primary"
                  onClick={handleConfirmPurchase}
                  disabled={loading}
                >
                  {loading ? <Loader size={20} className="spinning" /> : <Check size={20} />}
                  Conferma Acquisto
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && createdSubscription && (
            <div className="success-state">
              <div className="success-icon">
                <Check size={48} />
              </div>

              <h3>Abbonamento Creato!</h3>

              <div className="subscription-info">
                <div className="subscription-code">
                  {createdSubscription.subscription_code}
                </div>

                <div className="subscription-details">
                  <div className="detail-item">
                    <span className="detail-label">Cliente:</span>
                    <span className="detail-value">{selectedCustomer?.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Abbonamento:</span>
                    <span className="detail-value">{selectedTemplate?.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Valido fino:</span>
                    <span className="detail-value">{formatDate(createdSubscription.end_date)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Pagato:</span>
                    <span className="detail-value">{formatCurrency(createdSubscription.amount_paid)}</span>
                  </div>
                </div>
              </div>

              {printService && (
                <button
                  className="btn-print"
                  onClick={() => printVoucher(createdSubscription)}
                >
                  <Printer size={20} />
                  Ristampa Voucher
                </button>
              )}

              <button
                className="btn-primary"
                onClick={onClose}
              >
                Chiudi
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SellSubscriptionModal;
