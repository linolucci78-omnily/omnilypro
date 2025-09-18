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
      case 'Silver': return '#6B7280';
      case 'Bronze': return '#92400E';
      default: return '#6B7280';
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
          className="slide-panel-overlay"
          onClick={onClose}
        />
      )}

      {/* Slide Panel */}
      <div className={`customer-slide-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="panel-header">
          <div className="customer-header-info">
            <h2>{customer.name}</h2>
            <div
              className="customer-tier"
              style={{ backgroundColor: getTierColor(customer.tier) }}
            >
              {customer.tier === 'Platinum' && <Crown size={16} />}
              {customer.tier === 'Gold' && <Sparkles size={16} />}
              {customer.tier === 'Silver' && <Award size={16} />}
              {customer.tier === 'Bronze' && <Star size={16} />}
              {customer.tier}</div>
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="customer-quick-stats">
          <div className="stat-item">
            <div className="stat-icon">
              <Award size={24} />
            </div>
            <div className="stat-number">{customer.points}</div>
            <div className="stat-label">Punti</div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <Euro size={24} />
            </div>
            <div className="stat-number">€{customer.total_spent.toFixed(2)}</div>
            <div className="stat-label">Speso</div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="stat-number">{customer.visits}</div>
            <div className="stat-label">Visite</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="panel-actions">
          <button
            className="action-btn primary"
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
            className="action-btn secondary"
            onClick={() => {
              onNewTransaction?.(customer.id);
              // Aggiorna customer display con info vendita
              updateCustomerDisplay();
            }}
          >
            <ShoppingBag size={20} />
            Nuova Vendita
          </button>
          <button className="action-btn tertiary">
            <Gift size={20} />
            Premi
          </button>
        </div>

        {/* Contact Info */}
        <div className="customer-contact">
          <h3>Contatti</h3>
          <div className="contact-item">
            <Mail size={18} />
            <span>{customer.email}</span>
          </div>
          {customer.phone && (
            <div className="contact-item">
              <Phone size={18} />
              <span>{customer.phone}</span>
            </div>
          )}
          {customer.address && (
            <div className="contact-item">
              <MapPin size={18} />
              <span>{customer.address}</span>
            </div>
          )}
          <div className="contact-item">
            <Calendar size={18} />
            <span>Iscritto: {new Date(customer.created_at).toLocaleDateString('it-IT')}</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="customer-activity">
          <h3>Attività Recente</h3>
          <div className="activity-item">
            <div className="activity-date">Oggi</div>
            <div className="activity-text">Acquisto caffè - +2 punti</div>
          </div>
          <div className="activity-item">
            <div className="activity-date">Ieri</div>
            <div className="activity-text">Riscatto premio - -50 punti</div>
          </div>
          <div className="activity-item">
            <div className="activity-date">3 giorni fa</div>
            <div className="activity-text">Acquisto cornetto - +1 punto</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerSlidePanel;