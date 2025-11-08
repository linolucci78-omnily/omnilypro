import React, { useState } from 'react'
import { Package, Tag, TrendingUp, Star, ArrowLeft, Plus, Settings, BarChart3, Edit } from 'lucide-react'
import './CategoriesHub.css'

interface CategoryItem {
  name: string
  description?: string
  color?: string
  isBonus?: boolean
}

interface CategoriesHubProps {
  organizationId: string
  organizationName: string
  primaryColor: string
  secondaryColor: string
  productCategories: any[]
  bonusCategories: any[]
}

const CategoriesHub: React.FC<CategoriesHubProps> = ({
  organizationId,
  organizationName,
  primaryColor,
  secondaryColor,
  productCategories = [],
  bonusCategories = []
}) => {
  // Parse categories
  const parseCategories = (categories: any[], isBonus = false): CategoryItem[] => {
    if (!Array.isArray(categories)) return []
    return categories.map((cat: any) => {
      if (typeof cat === 'string') {
        return { name: cat, isBonus }
      }
      // Per bonus categories, il nome è in cat.category invece di cat.name
      const categoryName = cat.category || cat.name || cat
      return {
        name: categoryName,
        description: cat.description || (cat.multiplier ? `Moltiplicatore: ${cat.multiplier}x` : undefined),
        color: cat.color || (isBonus ? '#f59e0b' : primaryColor),
        isBonus
      }
    })
  }

  const parsedProductCategories = parseCategories(productCategories, false)
  const parsedBonusCategories = parseCategories(bonusCategories, true)
  const allCategories = [...parsedProductCategories, ...parsedBonusCategories]

  // Statistics
  const stats = {
    totalCategories: parsedProductCategories.length,
    bonusCategories: parsedBonusCategories.length,
    allCategories: allCategories.length,
    activeCategories: allCategories.length
  }

  return (
    <div
      className="categories-hub"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      <div className="categories-hub-header">
        <div className="categories-hub-header-content">
          <div className="categories-hub-icon">
            <Package size={48} />
          </div>
          <div>
            <h1>Centro Categorie</h1>
            <p>Gestisci categorie prodotti e configurazioni bonus</p>
          </div>
        </div>
      </div>

      {/* Statistiche Overview */}
      <div className="categories-stats-grid">
        <div className="categories-stat-card">
          <div className="categories-stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <Package size={24} />
          </div>
          <div className="categories-stat-content">
            <div className="categories-stat-value">{stats.totalCategories}</div>
            <div className="categories-stat-label">Categorie Prodotto</div>
          </div>
        </div>

        <div className="categories-stat-card">
          <div className="categories-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Star size={24} />
          </div>
          <div className="categories-stat-content">
            <div className="categories-stat-value">{stats.bonusCategories}</div>
            <div className="categories-stat-label">Categorie Bonus</div>
          </div>
        </div>

        <div className="categories-stat-card">
          <div className="categories-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Tag size={24} />
          </div>
          <div className="categories-stat-content">
            <div className="categories-stat-value">{stats.allCategories}</div>
            <div className="categories-stat-label">Totale Categorie</div>
          </div>
        </div>

        <div className="categories-stat-card">
          <div className="categories-stat-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="categories-stat-content">
            <div className="categories-stat-value">{stats.activeCategories}</div>
            <div className="categories-stat-label">Categorie Attive</div>
          </div>
        </div>
      </div>

      {/* Categorie Prodotto */}
      {parsedProductCategories.length > 0 && (
        <div className="categories-section">
          <h2>
            <Package size={28} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Categorie Prodotto
          </h2>
          <div className="categories-grid">
            {parsedProductCategories.map((category, index) => (
              <div key={index} className="category-card">
                <div className="category-icon" style={{ background: category.color || primaryColor }}>
                  <Tag size={24} />
                </div>
                <div className="category-content">
                  <h3>{category.name}</h3>
                  {category.description && (
                    <p className="category-description">{category.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categorie Bonus */}
      {parsedBonusCategories.length > 0 && (
        <div className="categories-section">
          <h2>
            <Star size={28} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Categorie Bonus
          </h2>
          <div className="categories-grid">
            {parsedBonusCategories.map((category, index) => (
              <div key={index} className="category-card category-card-bonus">
                <div className="category-icon" style={{ background: category.color || '#f59e0b' }}>
                  <Star size={24} />
                </div>
                <div className="category-content">
                  <h3>{category.name}</h3>
                  {category.description && (
                    <p className="category-description">{category.description}</p>
                  )}
                </div>
                <div className="bonus-badge">BONUS</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card Azioni Principali */}
      <div className="categories-hub-cards">
        {/* Card: Gestione Categorie */}
        <div
          className="categories-hub-card categories-hub-card-primary"
        >
          <div className="categories-hub-card-icon">
            <Settings size={32} />
          </div>
          <div className="categories-hub-card-content">
            <h3>Gestione Categorie</h3>
            <p>Modifica e configura le tue categorie prodotto</p>
            <ul className="categories-hub-card-features">
              <li><Plus size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Aggiungi categorie</li>
              <li><Edit size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Modifica esistenti</li>
              <li><Tag size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Personalizza colori</li>
              <li><Star size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Configura bonus</li>
            </ul>
            <div className="coming-soon-badge">Configurazione dal Wizard</div>
          </div>
        </div>

        {/* Card: Analytics Categorie */}
        <div
          className="categories-hub-card categories-hub-card-secondary"
        >
          <div className="categories-hub-card-icon">
            <BarChart3 size={32} />
          </div>
          <div className="categories-hub-card-content">
            <h3>Analytics Categorie</h3>
            <p>Analizza le performance delle tue categorie</p>
            <ul className="categories-hub-card-features">
              <li><TrendingUp size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Vendite per categoria</li>
              <li><BarChart3 size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Performance bonus</li>
              <li><Package size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Prodotti più venduti</li>
              <li><Star size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />ROI categorie bonus</li>
            </ul>
            <div className="coming-soon-badge">In Arrivo</div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {allCategories.length === 0 && (
        <div className="empty-state">
          <Package size={64} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: '0 0 0.5rem 0' }}>
            Nessuna Categoria Configurata
          </h3>
          <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>
            Configura le categorie prodotto tramite il wizard di setup iniziale
          </p>
        </div>
      )}
    </div>
  )
}

export default CategoriesHub
