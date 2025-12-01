/**
 * Admin AI Rewards Panel
 * Pannello amministratore per monitorare e gestire il sistema AI Rewards
 */

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  TrendingUp,
  DollarSign,
  Zap,
  AlertCircle,
  CheckCircle,
  BarChart3,
  RefreshCw,
  Eye,
  Key,
  Activity,
  Users,
  Calendar
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import PageLoader from '../UI/PageLoader'

interface AIUsageStats {
  totalGenerations: number
  totalOrganizations: number
  totalTokens: number
  estimatedCost: number
  generationsThisMonth: number
  averagePerOrganization: number
}

interface OrganizationAIUsage {
  organization_id: string
  organization_name: string
  plan_name: string
  generations_count: number
  tokens_used: number
  estimated_cost: number
  last_generation: string
  limit: number | null
}

interface RecentGeneration {
  id: string
  organization_name: string
  rewards_count: number
  tokens_used: number
  generated_at: string
}

const AdminAIRewardsPanel: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<AIUsageStats | null>(null)
  const [organizationUsage, setOrganizationUsage] = useState<OrganizationAIUsage[]>([])
  const [recentGenerations, setRecentGenerations] = useState<RecentGeneration[]>([])
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch AI usage stats
      const { data: usage, error: usageError } = await supabase
        .from('ai_rewards_usage')
        .select(`
          *,
          organizations (name, plan_id, omnilypro_plans (name, limits))
        `)
        .order('generated_at', { ascending: false })

      if (usageError) throw usageError

      // Calculate stats
      const totalGenerations = usage?.length || 0
      const uniqueOrgs = new Set(usage?.map(u => u.organization_id))
      const totalOrganizations = uniqueOrgs.size

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const generationsThisMonth = usage?.filter(u =>
        new Date(u.generated_at) >= startOfMonth
      ).length || 0

      const totalTokens = usage?.reduce((sum, u) => sum + (u.tokens_used || 0), 0) || 0

      // Estimated cost: ~$3 per million tokens for Claude Sonnet
      const estimatedCost = (totalTokens / 1000000) * 3

      setStats({
        totalGenerations,
        totalOrganizations,
        totalTokens,
        estimatedCost,
        generationsThisMonth,
        averagePerOrganization: totalOrganizations > 0 ? totalGenerations / totalOrganizations : 0
      })

      // Group by organization
      const orgMap = new Map<string, OrganizationAIUsage>()

      usage?.forEach(u => {
        const org: any = u.organizations
        if (!org) return

        if (!orgMap.has(u.organization_id)) {
          orgMap.set(u.organization_id, {
            organization_id: u.organization_id,
            organization_name: org.name,
            plan_name: org.omnilypro_plans?.name || 'N/A',
            generations_count: 0,
            tokens_used: 0,
            estimated_cost: 0,
            last_generation: u.generated_at,
            limit: org.omnilypro_plans?.limits?.maxAIGenerationsPerMonth || null
          })
        }

        const orgData = orgMap.get(u.organization_id)!
        orgData.generations_count++
        orgData.tokens_used += u.tokens_used || 0
        orgData.estimated_cost = (orgData.tokens_used / 1000000) * 3

        if (new Date(u.generated_at) > new Date(orgData.last_generation)) {
          orgData.last_generation = u.generated_at
        }
      })

      const orgUsageArray = Array.from(orgMap.values())
        .sort((a, b) => b.generations_count - a.generations_count)

      setOrganizationUsage(orgUsageArray)

      // Recent generations
      const recent = usage?.slice(0, 20).map(u => ({
        id: u.id,
        organization_name: (u.organizations as any)?.name || 'Unknown',
        rewards_count: u.rewards_count,
        tokens_used: u.tokens_used || 0,
        generated_at: u.generated_at
      })) || []

      setRecentGenerations(recent)

      // Check if API key is configured
      try {
        const { data, error } = await supabase.functions.invoke('manage-api-keys', {
          body: {
            action: 'get',
            keyName: 'ANTHROPIC_API_KEY'
          }
        })

        console.log('API Key Status Check:', { data, error })

        if (error) {
          console.log('API Key NOT configured - error checking status')
          setApiKeyConfigured(false)
        } else if (data && data.configured) {
          console.log('API Key IS configured')
          setApiKeyConfigured(true)
        } else {
          console.log('API Key NOT configured')
          setApiKeyConfigured(false)
        }
      } catch (err) {
        console.error('API Key Check Exception:', err)
        setApiKeyConfigured(false)
      }

    } catch (error: any) {
      console.error('Error fetching AI data:', error)
      showError('Errore nel caricamento dei dati AI')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      showError('Inserisci una API key valida')
      return
    }

    try {
      setSaving(true)
      const { data, error } = await supabase.functions.invoke('manage-api-keys', {
        body: {
          action: 'set',
          keyName: 'ANTHROPIC_API_KEY',
          keyValue: apiKeyInput.trim()
        }
      })

      console.log('Save API Key Response:', { data, error })

      if (error) {
        console.error('Edge Function Error:', error)
        // Try to get more details from the error
        const errorMessage = error.message || 'Edge Function error'
        showError(`Errore Edge Function: ${errorMessage}. Controlla la console per dettagli.`)
        throw error
      }

      if (data && !data.success) {
        console.error('API returned error:', data.error)
        showError(data.error || 'Errore durante il salvataggio')
        throw new Error(data.error || 'Errore durante il salvataggio')
      }

      showSuccess('API Key configurata con successo!')
      setShowConfigModal(false)
      setApiKeyInput('')
      fetchData() // Refresh to update status
    } catch (error: any) {
      console.error('Error saving API key:', error)
      showError(error.message || 'Errore durante il salvataggio dell\'API key')
    } finally {
      setSaving(false)
    }
  }

  const handleTestApiKey = async () => {
    try {
      setTesting(true)
      const { data, error } = await supabase.functions.invoke('manage-api-keys', {
        body: {
          action: 'test',
          keyName: 'ANTHROPIC_API_KEY'
        }
      })

      if (error) throw error

      if (data.success) {
        showSuccess('Test completato! L\'API key funziona correttamente ✓')
        fetchData() // Refresh to update test status
      } else {
        showError('Test fallito: ' + (data.message || 'API key non valida'))
      }
    } catch (error: any) {
      console.error('Error testing API key:', error)
      showError('Errore durante il test dell\'API key')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="admin-ai-panel">
      {/* Header */}
      <div className="panel-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Sparkles size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>AI Rewards Analytics</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
              Monitor sistema AI e utilizzo risorse
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            padding: '10px 20px',
            background: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          Aggiorna
        </button>
      </div>

      {/* API Key Status */}
      <div style={{
        background: apiKeyConfigured ? '#ecfdf5' : '#fef2f2',
        border: `2px solid ${apiKeyConfigured ? '#a7f3d0' : '#fecaca'}`,
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {apiKeyConfigured ? (
          <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />
        ) : (
          <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: apiKeyConfigured ? '#065f46' : '#991b1b', marginBottom: '4px' }}>
            {apiKeyConfigured ? 'API Key Configurata ✓' : 'API Key NON Configurata'}
          </div>
          <div style={{ fontSize: '14px', color: apiKeyConfigured ? '#047857' : '#7f1d1d' }}>
            {apiKeyConfigured
              ? 'Il sistema AI è operativo e pronto all\'uso'
              : 'Clicca su "Configura" per impostare la chiave API di Anthropic'
            }
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {apiKeyConfigured && (
            <button
              onClick={handleTestApiKey}
              disabled={testing}
              style={{
                padding: '8px 16px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: testing ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {testing ? <RefreshCw size={14} className="spin" /> : <CheckCircle size={14} />}
              {testing ? 'Testing...' : 'Test'}
            </button>
          )}
          <button
            onClick={() => setShowConfigModal(true)}
            style={{
              padding: '8px 16px',
              background: apiKeyConfigured ? '#6366f1' : '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Key size={14} />
            {apiKeyConfigured ? 'Aggiorna' : 'Configura'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <StatCard
            icon={<Zap size={24} />}
            label="Generazioni Totali"
            value={stats.totalGenerations.toLocaleString()}
            color="#8b5cf6"
          />
          <StatCard
            icon={<Calendar size={24} />}
            label="Questo Mese"
            value={stats.generationsThisMonth.toLocaleString()}
            color="#3b82f6"
          />
          <StatCard
            icon={<Users size={24} />}
            label="Organizzazioni Attive"
            value={stats.totalOrganizations.toLocaleString()}
            color="#10b981"
          />
          <StatCard
            icon={<Activity size={24} />}
            label="Tokens Utilizzati"
            value={formatNumber(stats.totalTokens)}
            color="#f59e0b"
          />
          <StatCard
            icon={<DollarSign size={24} />}
            label="Costo Stimato"
            value={`$${stats.estimatedCost.toFixed(2)}`}
            color="#ef4444"
          />
          <StatCard
            icon={<TrendingUp size={24} />}
            label="Media per Org"
            value={stats.averagePerOrganization.toFixed(1)}
            color="#6366f1"
          />
        </div>
      )}

      {/* Top Organizations */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={20} />
          Top Organizzazioni per Utilizzo
        </h3>
        <div style={{
          background: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
                  Organizzazione
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
                  Piano
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
                  Generazioni
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
                  Limite
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
                  Tokens
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
                  Costo
                </th>
              </tr>
            </thead>
            <tbody>
              {organizationUsage.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                    Nessun utilizzo registrato
                  </td>
                </tr>
              ) : (
                organizationUsage.map((org, index) => (
                  <tr key={org.organization_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{org.organization_name}</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {new Date(org.last_generation).toLocaleDateString('it-IT')}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 12px',
                        background: getPlanColor(org.plan_name).bg,
                        color: getPlanColor(org.plan_name).text,
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 600
                      }}>
                        {org.plan_name}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>
                      {org.generations_count}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {org.limit === null ? (
                        <span style={{ color: '#10b981', fontWeight: 600 }}>∞</span>
                      ) : (
                        <span style={{
                          color: org.generations_count >= org.limit ? '#ef4444' : '#6b7280'
                        }}>
                          {org.limit}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace' }}>
                      {formatNumber(org.tokens_used)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                      ${org.estimated_cost.toFixed(3)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Generations */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} />
          Attività Recente
        </h3>
        <div style={{
          background: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          padding: '16px'
        }}>
          {recentGenerations.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
              Nessuna attività recente
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentGenerations.map(gen => (
                <div
                  key={gen.id}
                  style={{
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{gen.organization_name}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      {gen.rewards_count} premi generati • {formatNumber(gen.tokens_used)} tokens
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                    {formatTimeAgo(gen.generated_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
      `}</style>

      {/* Configuration Modal */}
      {showConfigModal && (
        <>
          {/* Overlay */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }}
            onClick={() => setShowConfigModal(false)}
          >
            {/* Modal */}
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '600px',
                width: '90%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Key size={28} style={{ color: '#8b5cf6' }} />
                  Configura API Key Anthropic
                </h2>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                  Inserisci la tua chiave API di Anthropic Claude per attivare il sistema AI Rewards.
                </p>
              </div>

              {/* Instructions */}
              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  Come ottenere la chiave API:
                </div>
                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#6b7280', lineHeight: '1.6' }}>
                  <li>Vai su <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: '#8b5cf6', textDecoration: 'underline' }}>console.anthropic.com</a></li>
                  <li>Accedi o crea un account</li>
                  <li>Vai su "API Keys" nel menu</li>
                  <li>Crea una nuova chiave e copiala</li>
                </ol>
              </div>

              {/* Input */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-ant-..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowConfigModal(false)
                    setApiKeyInput('')
                  }}
                  disabled={saving}
                  style={{
                    padding: '10px 20px',
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  Annulla
                </button>
                <button
                  onClick={handleSaveApiKey}
                  disabled={saving || !apiKeyInput.trim()}
                  style={{
                    padding: '10px 20px',
                    background: saving || !apiKeyInput.trim() ? '#d1d5db' : '#8b5cf6',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: saving || !apiKeyInput.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Salva Configurazione
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Helper Components
const StatCard: React.FC<{
  icon: React.ReactNode
  label: string
  value: string
  color: string
}> = ({ icon, label, value, color }) => (
  <div style={{
    background: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  }}>
    <div style={{
      width: '56px',
      height: '56px',
      borderRadius: '12px',
      background: `${color}15`,
      color: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 800, color: '#1f2937' }}>
        {value}
      </div>
    </div>
  </div>
)

// Helper Functions
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toLocaleString()
}

function formatTimeAgo(date: string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)

  if (seconds < 60) return 'Pochi secondi fa'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minuti fa`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ore fa`
  return `${Math.floor(seconds / 86400)} giorni fa`
}

function getPlanColor(planName: string): { bg: string, text: string } {
  switch (planName.toLowerCase()) {
    case 'free':
      return { bg: '#f3f4f6', text: '#6b7280' }
    case 'basic':
      return { bg: '#dbeafe', text: '#1e40af' }
    case 'pro':
      return { bg: '#ede9fe', text: '#6b21a8' }
    case 'enterprise':
      return { bg: '#fce7f3', text: '#9f1239' }
    default:
      return { bg: '#f3f4f6', text: '#6b7280' }
  }
}

export default AdminAIRewardsPanel
