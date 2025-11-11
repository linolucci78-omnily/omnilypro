import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ReceiptLayoutEditor from '../components/ReceiptLayoutEditor'

const ReceiptLayoutEditorPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const organizationId = searchParams.get('org')

  const [organizationName, setOrganizationName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrganization = async () => {
      const isPOSMode = window.location.search.includes('posomnily=true') || localStorage.getItem('pos-mode') === 'true'
      const fallbackRoute = isPOSMode ? '/pos?posomnily=true' : '/dashboard'

      if (!organizationId) {
        navigate(fallbackRoute)
        return
      }

      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', organizationId)
          .single()

        if (error || !data) {
          console.error('Errore caricamento organizzazione:', error)
          navigate(fallbackRoute)
          return
        }

        setOrganizationName(data.name)
      } catch (error) {
        console.error('Errore:', error)
        navigate(fallbackRoute)
      } finally {
        setLoading(false)
      }
    }

    loadOrganization()
  }, [organizationId, navigate])

  const handleClose = () => {
    // Check if we're in POS mode and navigate back accordingly
    const isPOSMode = window.location.search.includes('posomnily=true') || localStorage.getItem('pos-mode') === 'true'
    if (isPOSMode) {
      navigate(`/pos?posomnily=true`)
    } else {
      navigate('/dashboard')
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%)'
      }}>
        <div style={{ fontSize: '1.5rem', color: '#6b7280' }}>
          Caricamento...
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <ReceiptLayoutEditor
        organizationId={organizationId!}
        organizationName={organizationName}
        onClose={handleClose}
      />

      {/* Close button */}
      <button
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          padding: '0.75rem 1.5rem',
          background: 'white',
          color: '#374151',
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.2s',
          zIndex: 100,
          fontSize: '1rem'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f3f4f6'
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
      >
        ✕ Chiudi Editor
      </button>
    </div>
  )
}

export default ReceiptLayoutEditorPage
