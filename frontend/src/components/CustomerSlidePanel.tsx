import React from 'react';
import { X, Star, Gift, ShoppingBag, Plus, Phone, Mail, MapPin, Calendar, Award, Euro, Users, TrendingUp, Sparkles, Crown } from 'lucide-react';
import './CustomerSlidePanel.css';

import type { Customer } from '../lib/supabase';

interface CustomerSlidePanelProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onAddPoints?: (customerId: string, points: number) => void;
  onNewTransaction?: (customerId: string) => void;
}

const CustomerSlidePanel: React.FC<CustomerSlidePanelProps> = ({
  customer,
  isOpen,
  onClose,
  onAddPoints,
  onNewTransaction
}) => {
  if (!customer) return null;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return '#8B5CF6';
      case 'Gold': return '#F59E0B';
      case 'Silver': return '#94A3B8';
      case 'Bronze': return '#A16207';
      case 'Argento': return '#94A3B8';
      case 'Bronzo': return '#A16207';
      default: return '#F59E0B';
    }
  };

  const updateCustomerDisplay = () => {
    // Aggiorna customer display con info cliente
    if (typeof window !== 'undefined' && (window as any).updateCustomerDisplay) {
      (window as any).updateCustomerDisplay({
        type: 'CUSTOMER_SELECTED',
        customer: {
          name: customer.name,
          points: customer.points,
          tier: customer.tier,
          visits: customer.visits
        }
      });
    }
  };

  // NON aggiorniamo automaticamente il customer display quando apriamo il pannello
  // Questo causava interferenze con popup indesiderati sul display principale
  // L'aggiornamento del customer display avviene solo tramite azioni specifiche

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="customer-slide-panel-overlay"
          onClick={onClose}
        />
      )}

      {/* Slide Panel */}
      <div className={`customer-slide-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="customer-panel-header">
          <div className="customer-slide-panel-header-info">
            <h2>{customer.name}</h2>
            <div
              className="customer-slide-panel-tier"
              style={{ backgroundColor: getTierColor(customer.tier) }}
            >
              {customer.tier === 'Platinum' && <Crown size={16} />}
              {customer.tier === 'Gold' && <Sparkles size={16} />}
              {customer.tier === 'Silver' && <Award size={16} />}
              {customer.tier === 'Bronze' && <Star size={16} />}
              {customer.tier}</div>
          </div>
          <button className="customer-panel-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="customer-slide-panel-quick-stats">
          <div className="customer-slide-panel-stat-item">
            <div className="customer-slide-panel-stat-icon">
              <Award size={24} />
            </div>
            <div className="customer-slide-panel-stat-number">{customer.points}</div>
            <div className="customer-slide-panel-stat-label">Punti</div>
          </div>
          <div className="customer-slide-panel-stat-item">
            <div className="customer-slide-panel-stat-icon">
              <Euro size={24} />
            </div>
            <div className="customer-slide-panel-stat-number">€{customer.total_spent.toFixed(2)}</div>
            <div className="customer-slide-panel-stat-label">Speso</div>
          </div>
          <div className="customer-slide-panel-stat-item">
            <div className="customer-slide-panel-stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="customer-slide-panel-stat-number">{customer.visits}</div>
            <div className="customer-slide-panel-stat-label">Visite</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="customer-panel-actions">
          <button
            className="customer-slide-panel-action-btn customer-slide-panel-action-btn-primary"
            onClick={() => {
              onAddPoints?.(customer.id, 10);
              // Solo ora aggiorniamo il customer display con i nuovi punti
              updateCustomerDisplay();
            }}
          >
            <Plus size={20} />
            Aggiungi Punti
          </button>
          <button
            className="customer-slide-panel-action-btn customer-slide-panel-action-btn-secondary"
            onClick={() => {
              onNewTransaction?.(customer.id);
              // Aggiorna customer display con info vendita
              updateCustomerDisplay();
            }}
          >
            <ShoppingBag size={20} />
            Nuova Vendita
          </button>
          <button className="customer-slide-panel-action-btn customer-slide-panel-action-btn-tertiary">
            <Gift size={20} />
            Premi
          </button>
        </div>

        {/* Contact Info */}
        <div className="customer-slide-panel-contact">
          <h3>Contatti</h3>
          <div className="customer-slide-panel-contact-item">
            <Mail size={18} />
            <span>{customer.email}</span>
          </div>
          {customer.phone && (
            <div className="customer-slide-panel-contact-item">
              <Phone size={18} />
              <span>{customer.phone}</span>
            </div>
          )}
          {customer.address && (
            <div className="customer-slide-panel-contact-item">
              <MapPin size={18} />
              <span>{customer.address}</span>
            </div>
          )}
          <div className="customer-slide-panel-contact-item">
            <Calendar size={18} />
            <span>Iscritto: {new Date(customer.created_at).toLocaleDateString('it-IT')}</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="customer-slide-panel-activity">
          <h3>Attività Recente</h3>
          <div className="customer-slide-panel-activity-item">
            <div className="customer-slide-panel-activity-date">Oggi</div>
            <div className="customer-slide-panel-activity-text">Acquisto caffè - +2 punti</div>
          </div>
          <div className="customer-slide-panel-activity-item">
            <div className="customer-slide-panel-activity-date">Ieri</div>
            <div className="customer-slide-panel-activity-text">Riscatto premio - -50 punti</div>
          </div>
          <div className="customer-slide-panel-activity-item">
            <div className="customer-slide-panel-activity-date">3 giorni fa</div>
            <div className="customer-slide-panel-activity-text">Acquisto cornetto - +1 punto</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerSlidePanel;