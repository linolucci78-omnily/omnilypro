import React, { useState } from 'react'
import { X, Plus, Copy, Trash2, Upload, Save, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './MultiRewardCreator.css'

interface RewardRow {
  id: string
  name: string
  description: string
  type: 'discount' | 'freeProduct' | 'cashback' | 'giftCard'
  value: string
  points_required: number
  required_tier?: string
  category: string
  stock_quantity?: number
  image?: File | null
  imagePreview?: string
  is_active: boolean
}

interface MultiRewardCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  organizationId: string
  loyaltyTiers: any[]
  pointsName: string
}

const REWARD_TYPES = [
  { value: 'discount', label: 'Sconto' },
  { value: 'freeProduct', label: 'Prodotto Gratuito' },
  { value: 'cashback', label: 'Cashback' },
  { value: 'giftCard', label: 'Gift Card' }
]

const MultiRewardCreator: React.FC<MultiRewardCreatorProps> = ({
  isOpen,
  onClose,
  onSuccess,
  organizationId,
  loyaltyTiers = [],
  pointsName = 'Punti'
}) => {
  const [rows, setRows] = useState<RewardRow[]>([
    {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      type: 'discount',
      value: '',
      points_required: 100,
      category: '',
      is_active: true
    }
  ])

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const addRow = () => {
    setRows([...rows, {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      type: 'discount',
      value: '',
      points_required: 100,
      category: '',
      is_active: true
    }])
  }

  const duplicateRow = (index: number) => {
    const newRow = { ...rows[index], id: crypto.randomUUID(), name: rows[index].name + ' (Copia)' }
    setRows([...rows.slice(0, index + 1), newRow, ...rows.slice(index + 1)])
  }

  const removeRow = (index: number) => {
    if (rows.length === 1) return // Mantieni almeno una riga
    setRows(rows.filter((_, i) => i !== index))
  }

  const updateRow = (index: number, field: keyof RewardRow, value: any) => {
    const newRows = [...rows]
    newRows[index] = { ...newRows[index], [field]: value }
    setRows(newRows)
  }

  const handleImageUpload = (index: number, file: File | null) => {
    if (!file) return

    const newRows = [...rows]
    newRows[index].image = file
    newRows[index].imagePreview = URL.createObjectURL(file)
    setRows(newRows)
  }

  const validateRows = (): boolean => {
    const newErrors: Record<string, string> = {}

    rows.forEach((row, index) => {
      if (!row.name.trim()) {
        newErrors[`name-${index}`] = 'Nome obbligatorio'
      }
      if (!row.description.trim()) {
        newErrors[`description-${index}`] = 'Descrizione obbligatoria'
      }
      if (row.points_required < 1) {
        newErrors[`points-${index}`] = 'Punti devono essere maggiori di 0'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const saveAllRewards = async () => {
    if (!validateRows()) {
      return
    }

    setSaving(true)
    const createdRewards = []
    const failedRewards = []

    try {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]

        try {
          // 1. Upload immagine se presente
          let imageUrl = null
          if (row.image) {
            const fileExt = row.image.name.split('.').pop()
            const fileName = `${organizationId}/${Date.now()}-${Math.random()}.${fileExt}`
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('reward-images')
              .upload(fileName, row.image)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
              .from('reward-images')
              .getPublicUrl(fileName)

            imageUrl = publicUrl
          }

          // 2. Crea il reward nel database
          const { data, error } = await supabase
            .from('rewards')
            .insert({
              organization_id: organizationId,
              name: row.name,
              description: row.description,
              type: row.type,
              value: row.value,
              points_required: row.points_required,
              required_tier: row.required_tier || null,
              category: row.category || null,
              stock_quantity: row.stock_quantity || null,
              image_url: imageUrl,
              is_active: row.is_active
            })
            .select()
            .single()

          if (error) throw error

          createdRewards.push(row.name)
        } catch (error) {
          console.error(`Errore creazione premio ${row.name}:`, error)
          failedRewards.push(row.name)
        }
      }

      // Mostra risultati
      if (failedRewards.length === 0) {
        alert(`✅ ${createdRewards.length} premi creati con successo!`)
        onSuccess()
        onClose()
      } else {
        alert(`⚠️ Creati ${createdRewards.length} premi.\nFalliti: ${failedRewards.join(', ')}`)
        // Rimuovi le righe create con successo
        setRows(rows.filter(row => failedRewards.includes(row.name)))
      }
    } catch (error) {
      console.error('Errore generale:', error)
      alert('❌ Errore durante la creazione dei premi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="multi-reward-container">
      {/* Header */}
      <div className="multi-reward-header">
        <div>
          <h2>Crea Premi Multipli</h2>
          <p>Compila la tabella per creare più premi contemporaneamente</p>
        </div>
        <button className="close-button" onClick={onClose}>
          <X size={20} />
          <span>Torna alla Lista</span>
        </button>
      </div>

        {/* Actions */}
        <div className="multi-reward-actions">
          <button className="btn-add-row" onClick={addRow} disabled={saving}>
            <Plus size={18} />
            Aggiungi Riga
          </button>
          <div className="action-info">
            {rows.length} {rows.length === 1 ? 'premio' : 'premi'} da creare
          </div>
          <button className="btn-save-all" onClick={saveAllRewards} disabled={saving}>
            <Save size={18} />
            {saving ? 'Salvataggio...' : `Salva Tutti (${rows.length})`}
          </button>
        </div>

        {/* Table */}
        <div className="rewards-table-container">
          <table className="rewards-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th style={{ width: '200px' }}>Nome Premio *</th>
                <th style={{ width: '250px' }}>Descrizione *</th>
                <th style={{ width: '120px' }}>Tipo</th>
                <th style={{ width: '100px' }}>Valore</th>
                <th style={{ width: '100px' }}>{pointsName} *</th>
                <th style={{ width: '150px' }}>Livello Richiesto</th>
                <th style={{ width: '120px' }}>Categoria</th>
                <th style={{ width: '80px' }}>Stock</th>
                <th style={{ width: '120px' }}>Immagine</th>
                <th style={{ width: '120px' }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id} className={errors[`name-${index}`] ? 'row-error' : ''}>
                  <td className="row-number">{index + 1}</td>

                  {/* Nome */}
                  <td>
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateRow(index, 'name', e.target.value)}
                      placeholder="es. Caffè Gratis"
                      className={errors[`name-${index}`] ? 'input-error' : ''}
                    />
                  </td>

                  {/* Descrizione */}
                  <td>
                    <textarea
                      value={row.description}
                      onChange={(e) => updateRow(index, 'description', e.target.value)}
                      placeholder="Descrizione del premio"
                      rows={2}
                      className={errors[`description-${index}`] ? 'input-error' : ''}
                    />
                  </td>

                  {/* Tipo */}
                  <td>
                    <select
                      value={row.type}
                      onChange={(e) => updateRow(index, 'type', e.target.value)}
                    >
                      {REWARD_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </td>

                  {/* Valore */}
                  <td>
                    <input
                      type="text"
                      value={row.value}
                      onChange={(e) => updateRow(index, 'value', e.target.value)}
                      placeholder="es. 5€"
                    />
                  </td>

                  {/* Punti */}
                  <td>
                    <input
                      type="number"
                      value={row.points_required}
                      onChange={(e) => updateRow(index, 'points_required', parseInt(e.target.value) || 0)}
                      min="1"
                      className={errors[`points-${index}`] ? 'input-error' : ''}
                    />
                  </td>

                  {/* Livello */}
                  <td>
                    <select
                      value={row.required_tier || ''}
                      onChange={(e) => updateRow(index, 'required_tier', e.target.value || undefined)}
                    >
                      <option value="">Nessuno</option>
                      {loyaltyTiers.map((tier: any) => (
                        <option key={tier.name} value={tier.name}>
                          {tier.name} ({tier.threshold}+ {pointsName.toLowerCase()})
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Categoria */}
                  <td>
                    <input
                      type="text"
                      value={row.category}
                      onChange={(e) => updateRow(index, 'category', e.target.value)}
                      placeholder="Food, Drink..."
                    />
                  </td>

                  {/* Stock */}
                  <td>
                    <input
                      type="number"
                      value={row.stock_quantity || ''}
                      onChange={(e) => updateRow(index, 'stock_quantity', e.target.value ? parseInt(e.target.value) : undefined)}
                      min="0"
                      placeholder="∞"
                    />
                  </td>

                  {/* Immagine */}
                  <td>
                    <div className="image-upload-cell">
                      <input
                        type="file"
                        accept="image/*"
                        id={`image-${row.id}`}
                        style={{ display: 'none' }}
                        onChange={(e) => handleImageUpload(index, e.target.files?.[0] || null)}
                      />
                      <label htmlFor={`image-${row.id}`} className="upload-button">
                        <Upload size={14} />
                        {row.imagePreview ? '✓' : 'Carica'}
                      </label>
                      {row.imagePreview && (
                        <img src={row.imagePreview} alt="Preview" className="image-preview-thumb" />
                      )}
                    </div>
                  </td>

                  {/* Azioni */}
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn-icon"
                        onClick={() => duplicateRow(index)}
                        title="Duplica"
                        disabled={saving}
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => removeRow(index)}
                        title="Elimina"
                        disabled={saving || rows.length === 1}
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

        {/* Errors Summary */}
        {Object.keys(errors).length > 0 && (
          <div className="errors-summary">
            <AlertCircle size={18} />
            <span>Correggi gli errori evidenziati in rosso prima di salvare</span>
          </div>
        )}
    </div>
  )
}

export default MultiRewardCreator
