/**
 * GAMING MODULE TEST PAGE
 * Pagina di test per tutte le funzionalità del Gaming Module
 */

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GamingHubWrapper } from '../components/Gaming'
import { supabase } from '../lib/supabase'
import './GamingTest.css'

const GamingTest: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [customerId, setCustomerId] = useState('')
  const [organizationId, setOrganizationId] = useState('')
  const [organizationPlan, setOrganizationPlan] = useState('pro')
  const [customerName, setCustomerName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Available organizations and customers for testing
  const [orgs, setOrgs] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])

  useEffect(() => {
    // Try to get from URL params
    const urlCustomerId = searchParams.get('customerId')
    const urlOrganizationId = searchParams.get('organizationId')

    if (urlCustomerId) setCustomerId(urlCustomerId)
    if (urlOrganizationId) setOrganizationId(urlOrganizationId)

    // If we have both URL params, skip DB loading and show directly
    if (urlCustomerId && urlOrganizationId) {
      console.log('✅ GamingTest: URL params found, skipping DB load')
      setOrgName('Sapori & Colori (Test)')
      setCustomerName('Test User')
      setOrganizationPlan('pro')
      setLoading(false)
      console.log('✅ GamingTest: Loading set to false')
    } else {
      console.log('⚠️ GamingTest: No URL params, loading orgs from DB')
      loadOrganizations()
    }
  }, [])

  useEffect(() => {
    // Skip if coming from URL params (already set in first useEffect)
    if (!searchParams.get('customerId') && organizationId) {
      loadCustomers(organizationId)
      loadOrganizationDetails(organizationId)
    }
  }, [organizationId])

  useEffect(() => {
    // Skip if coming from URL params (already set in first useEffect)
    if (!searchParams.get('customerId') && customerId) {
      loadCustomerDetails(customerId)
    }
  }, [customerId])

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, plan_type')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('❌ Supabase error loading orgs:', error)
        throw error
      }
      setOrgs(data || [])
    } catch (err: any) {
      console.error('❌ Error loading orgs:', err)
      console.error('Error details:', JSON.stringify(err, null, 2))
    }
  }

  const loadCustomers = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email, points')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('❌ Supabase error loading customers:', error)
        throw error
      }
      setCustomers(data || [])
    } catch (err: any) {
      console.error('❌ Error loading customers:', err)
      console.error('Error details:', JSON.stringify(err, null, 2))
    }
  }

  const loadOrganizationDetails = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('name, plan_type')
        .eq('id', orgId)
        .single()

      if (error) throw error
      if (data) {
        setOrgName(data.name)
        setOrganizationPlan(data.plan_type || 'pro')
      }
      setLoading(false)
    } catch (err: any) {
      setError('Organizzazione non trovata')
      setLoading(false)
    }
  }

  const loadCustomerDetails = async (custId: string) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('first_name, last_name')
        .eq('id', custId)
        .single()

      if (error) throw error
      if (data) {
        setCustomerName(`${data.first_name} ${data.last_name}`)
      }
    } catch (err: any) {
      setError('Customer non trovato')
    }
  }

  const handleUpgrade = () => {
    alert('Upgrade flow - da implementare nel tuo routing!')
  }

  // Show selector if missing params
  if (!customerId || !organizationId) {
    return (
      <div className="gaming-test-page">
        <div className="gaming-test-selector">
          <h1>🎮 Gaming Module Test</h1>
          <p>Seleziona un'organizzazione e un customer per testare il Gaming Module</p>

          {/* Organization selector */}
          <div className="selector-group">
            <label>Organizzazione:</label>
            <select
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
            >
              <option value="">-- Seleziona organizzazione --</option>
              {orgs.map(org => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.plan_type})
                </option>
              ))}
            </select>
          </div>

          {/* Customer selector */}
          {organizationId && (
            <div className="selector-group">
              <label>Customer:</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">-- Seleziona customer --</option>
                {customers.map(cust => (
                  <option key={cust.id} value={cust.id}>
                    {cust.first_name} {cust.last_name} - {cust.email} ({cust.points} punti)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Plan selector for testing */}
          {organizationId && customerId && (
            <div className="selector-group">
              <label>Simula Piano (per test permissions):</label>
              <select
                value={organizationPlan}
                onChange={(e) => setOrganizationPlan(e.target.value)}
              >
                <option value="free">Free (no access)</option>
                <option value="basic">Basic (no access)</option>
                <option value="pro">Pro (access ✅)</option>
                <option value="enterprise">Enterprise (access ✅)</option>
              </select>
            </div>
          )}

          {organizationId && customerId && (
            <button
              className="test-start-btn"
              onClick={() => {
                window.location.href = `/gaming-test?customerId=${customerId}&organizationId=${organizationId}`
              }}
            >
              Avvia Test Gaming Module
            </button>
          )}

          <div className="test-info">
            <h3>ℹ️ Info Setup</h3>
            <p>Se non hai ancora fatto il setup, esegui:</p>
            <code>npm run setup-gaming YOUR_ORG_ID</code>
            <p>Oppure manualmente:</p>
            <code>node -r esbuild-register src/scripts/setupGamingModule.ts YOUR_ORG_ID</code>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    console.log('🔄 GamingTest: Rendering loading spinner (loading=true)')
    return (
      <div className="gaming-test-page">
        <div className="gaming-test-loading">
          <div className="spinner"></div>
          <p>Caricamento...</p>
        </div>
      </div>
    )
  }

  console.log('✅ GamingTest: Rendering Gaming Hub (loading=false)')

  if (error) {
    return (
      <div className="gaming-test-page">
        <div className="gaming-test-error">
          <h2>❌ Errore</h2>
          <p>{error}</p>
          <button onClick={() => window.location.href = '/gaming-test'}>
            Torna alla selezione
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="gaming-test-page">
      {/* Test header */}
      <div className="gaming-test-header">
        <div className="test-info-bar">
          <div className="test-info-item">
            <strong>Org:</strong> {orgName}
          </div>
          <div className="test-info-item">
            <strong>Customer:</strong> {customerName}
          </div>
          <div className="test-info-item">
            <strong>Piano:</strong> <span className={`plan-badge ${organizationPlan}`}>{organizationPlan}</span>
          </div>
          <button
            className="change-btn"
            onClick={() => window.location.href = '/gaming-test'}
          >
            Cambia
          </button>
        </div>
      </div>

      {/* Gaming Hub */}
      <GamingHubWrapper
        customerId={customerId}
        organizationId={organizationId}
        organizationPlan={organizationPlan}
        primaryColor="#dc2626"
        onUpgradeClick={handleUpgrade}
      />
    </div>
  )
}

export default GamingTest
