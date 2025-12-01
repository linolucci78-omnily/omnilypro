import React from 'react'
import { Edit2, Trash2, Check, ToggleLeft, ToggleRight, Package } from 'lucide-react'
import type { Reward } from '../services/rewardsService'

interface RewardsTableViewProps {
  rewards: Reward[]
  selectedRewards: Set<string>
  onToggleSelect: (rewardId: string) => void
  onToggleSelectAll: () => void
  onEdit: (reward: Reward) => void
  onDelete: (rewardId: string) => void
  onToggleActive: (id: string, isActive: boolean) => void
  primaryColor: string
}

const RewardsTableView: React.FC<RewardsTableViewProps> = ({
  rewards,
  selectedRewards,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
  onToggleActive,
  primaryColor
}) => {
  const allSelected = rewards.length > 0 && selectedRewards.size === rewards.length

  return (
    <div className="rewards-table-container" style={{ overflowX: 'auto' }}>
      <table className="rewards-table" style={{
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0,
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <thead>
          <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ padding: '16px', textAlign: 'left', width: '50px' }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
              />
            </th>
            <th style={{ padding: '16px', textAlign: 'left', width: '80px' }}>Immagine</th>
            <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#111827' }}>Nome</th>
            <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#111827' }}>Descrizione</th>
            <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: '#111827' }}>Punti</th>
            <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: '#111827' }}>Tipo</th>
            <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: '#111827' }}>Valore</th>
            <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: '#111827' }}>Tier</th>
            <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: '#111827' }}>Attivo</th>
            <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: '#111827' }}>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {rewards.map((reward, index) => (
            <tr
              key={reward.id}
              style={{
                borderBottom: index < rewards.length - 1 ? '1px solid #e5e7eb' : 'none',
                background: selectedRewards.has(reward.id) ? '#eff6ff' : 'white',
                transition: 'background 0.2s'
              }}
            >
              <td style={{ padding: '16px' }}>
                <input
                  type="checkbox"
                  checked={selectedRewards.has(reward.id)}
                  onChange={() => onToggleSelect(reward.id)}
                  style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                />
              </td>
              <td style={{ padding: '16px' }}>
                {reward.image_url ? (
                  <img
                    src={reward.image_url}
                    alt={reward.name}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '60px',
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f3f4f6',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <Package size={24} color="#9ca3af" />
                  </div>
                )}
              </td>
              <td style={{ padding: '16px', fontWeight: 600, color: '#111827' }}>
                {reward.name}
              </td>
              <td style={{ padding: '16px', color: '#6b7280', maxWidth: '300px' }}>
                {reward.description || '-'}
              </td>
              <td style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: primaryColor }}>
                {reward.points_required}
              </td>
              <td style={{ padding: '16px', textAlign: 'center' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: getTypeColor(reward.type).bg,
                  color: getTypeColor(reward.type).text
                }}>
                  {getTypeLabel(reward.type)}
                </span>
              </td>
              <td style={{ padding: '16px', textAlign: 'center', color: '#374151' }}>
                {reward.value ? `${reward.value}${reward.type === 'discount' ? '%' : '€'}` : '-'}
              </td>
              <td style={{ padding: '16px', textAlign: 'center' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: '#f3f4f6',
                  color: '#374151'
                }}>
                  {reward.required_tier || 'Tutti'}
                </span>
              </td>
              <td style={{ padding: '16px', textAlign: 'center' }}>
                <button
                  onClick={() => onToggleActive(reward.id, !reward.is_active)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto'
                  }}
                  title={reward.is_active ? 'Disattiva' : 'Attiva'}
                >
                  {reward.is_active ? (
                    <ToggleRight size={32} color={primaryColor} />
                  ) : (
                    <ToggleLeft size={32} color="#9ca3af" />
                  )}
                </button>
              </td>
              <td style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    onClick={() => onEdit(reward)}
                    style={{
                      padding: '8px',
                      border: 'none',
                      borderRadius: '6px',
                      background: '#f3f4f6',
                      color: '#374151',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    title="Modifica"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(reward.id)}
                    style={{
                      padding: '8px',
                      border: 'none',
                      borderRadius: '6px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    title="Elimina"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    discount: 'Sconto',
    freeProduct: 'Prodotto',
    cashback: 'Cashback',
    giftCard: 'Buono'
  }
  return labels[type] || type
}

function getTypeColor(type: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    discount: { bg: '#dbeafe', text: '#1e40af' },
    freeProduct: { bg: '#dcfce7', text: '#15803d' },
    cashback: { bg: '#fef3c7', text: '#a16207' },
    giftCard: { bg: '#f3e8ff', text: '#7c3aed' }
  }
  return colors[type] || { bg: '#f3f4f6', text: '#374151' }
}

export default RewardsTableView
