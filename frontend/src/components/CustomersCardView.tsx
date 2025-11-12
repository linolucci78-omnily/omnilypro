import React from 'react'
import { User, Award, Euro, TrendingUp, Mail, Phone, MapPin, Star, Crown, Sparkles, Medal, Zap, Trophy, Shield, Gem, Cake } from 'lucide-react'
import './CustomersCardView.css'
import type { Customer } from '../lib/supabase'

interface CustomersCardViewProps {
  customers: Customer[]
  onCustomerClick: (customer: Customer) => void
  onReferralClick?: (customer: Customer) => void
  primaryColor?: string
  secondaryColor?: string
  pointsName?: string
  loyaltyTiers?: any[]
}

const CustomersCardView: React.FC<CustomersCardViewProps> = ({
  customers,
  onCustomerClick,
  onReferralClick,
  primaryColor = '#dc2626',
  secondaryColor = '#dc2626',
  pointsName = 'Punti',
  loyaltyTiers = []
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const calculateAge = (birthDate: string | undefined): number | null => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const getTierInfo = (points: number) => {
    // Array di icone da usare in base all'ordine del tier (cicla se ci sono più di 5 livelli)
    const tierIcons = [Crown, Trophy, Star, Shield, Award]

    if (!loyaltyTiers || loyaltyTiers.length === 0) {
      // Fallback ai tiers fissi
      if (points >= 1000) return { name: 'Platinum', color: '#e5e7eb', icon: Crown }
      if (points >= 500) return { name: 'Gold', color: '#f59e0b', icon: Trophy }
      if (points >= 200) return { name: 'Silver', color: '#64748b', icon: Star }
      return { name: 'Bronze', color: '#a3a3a3', icon: Shield }
    }

    // Ordina tiers per soglia decrescente
    const sortedTiers = [...loyaltyTiers].sort((a, b) => parseFloat(b.threshold) - parseFloat(a.threshold))

    for (let i = 0; i < sortedTiers.length; i++) {
      const tier = sortedTiers[i]
      if (points >= parseFloat(tier.threshold)) {
        return {
          name: tier.name,
          color: tier.color || '#64748b',
          icon: tierIcons[i % tierIcons.length] // Cicla le icone con modulo
        }
      }
    }

    // Default primo tier (quello con soglia più bassa)
    const firstTier = sortedTiers[sortedTiers.length - 1]
    return {
      name: firstTier.name,
      color: firstTier.color || '#64748b',
      icon: tierIcons[(sortedTiers.length - 1) % tierIcons.length] // Cicla le icone
    }
  }

  return (
    <div className="customers-card-view">
      <div className="customers-grid">
        {customers.map((customer) => {
          const tierInfo = getTierInfo(customer.points)

          return (
            <div
              key={customer.id}
              className="customer-card-animated"
              onClick={() => onCustomerClick(customer)}
              style={{
                '--primary-color': primaryColor,
                '--secondary-color': secondaryColor,
                '--tier-color': tierInfo.color
              } as React.CSSProperties}
            >
              {/* Shine effect */}
              <div className="customer-card-shine"></div>

              {/* Tier badge */}
              <div className="customer-card-tier-badge" style={{ '--tier-color': tierInfo.color } as React.CSSProperties}>
                {React.createElement(tierInfo.icon, { size: 8, strokeWidth: 2.5, className: 'tier-icon' })}
                <span className="tier-name">{tierInfo.name}</span>
              </div>

              {/* Avatar Section */}
              <div className="customer-card-avatar-section">
                {customer.avatar_url ? (
                  <img
                    src={customer.avatar_url}
                    alt={customer.name}
                    className="customer-card-avatar-image"
                  />
                ) : (
                  <div
                    className="customer-card-avatar-placeholder"
                    style={{ background: primaryColor }}
                  >
                    <span>{getInitials(customer.name)}</span>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div className="customer-card-info">
                <h3 className="customer-card-name">{customer.name}</h3>

                {/* Contact Info */}
                <div className="customer-card-contacts">
                  {customer.email && (
                    <div className="contact-item">
                      <Mail size={14} />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="contact-item">
                      <Phone size={14} />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="contact-item">
                      <MapPin size={14} />
                      <span>{customer.address}</span>
                    </div>
                  )}
                  {customer.birth_date && calculateAge(customer.birth_date) !== null && (
                    <div className="contact-item">
                      <Cake size={14} />
                      <span>{calculateAge(customer.birth_date)} anni</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Referral Code */}
              {customer.referral_code && (
                <div className="customer-card-referral">
                  <span
                    className="referral-code-badge"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (onReferralClick) {
                        onReferralClick(customer)
                      }
                    }}
                    style={{
                      cursor: onReferralClick ? 'pointer' : 'default'
                    }}
                  >
                    {customer.referral_code}
                  </span>
                </div>
              )}

              {/* Stats Grid */}
              <div className="customer-card-stats-grid">
                <div className="customer-card-stat">
                  <div className="stat-icon" style={{ background: `${primaryColor}15`, color: primaryColor }}>
                    <Award size={18} />
                  </div>
                  <div className="stat-value">{customer.points}</div>
                  <div className="stat-label">{pointsName}</div>
                </div>

                <div className="customer-card-stat">
                  <div className="stat-icon" style={{ background: '#10b98115', color: '#10b981' }}>
                    <Euro size={18} />
                  </div>
                  <div className="stat-value">€{customer.total_spent.toFixed(0)}</div>
                  <div className="stat-label">Speso</div>
                </div>

                <div className="customer-card-stat">
                  <div className="stat-icon" style={{ background: '#3b82f615', color: '#3b82f6' }}>
                    <TrendingUp size={18} />
                  </div>
                  <div className="stat-value">{customer.visits}</div>
                  <div className="stat-label">Visite</div>
                </div>
              </div>

              {/* Click to view details hint */}
              <div className="customer-card-action-hint">
                Clicca per dettagli →
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {customers.length === 0 && (
        <div className="customers-empty-state">
          <User size={64} />
          <h3>Nessun cliente trovato</h3>
          <p>Inizia ad aggiungere clienti per vederli qui</p>
        </div>
      )}
    </div>
  )
}

export default CustomersCardView
