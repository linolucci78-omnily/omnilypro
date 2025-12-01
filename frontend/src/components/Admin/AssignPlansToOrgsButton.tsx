/**
 * Assign Plans to Organizations Button
 * Assegna automaticamente i piani alle organizzazioni che non ne hanno uno
 */

import React, { useState } from 'react'
import { Link2, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { omnilyProPlansService } from '../../services/omnilyProPlansService'
import { useToast } from '../../contexts/ToastContext'

interface AssignPlansToOrgsButtonProps {
  onComplete?: () => void
}

const AssignPlansToOrgsButton: React.FC<AssignPlansToOrgsButtonProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { showSuccess, showError } = useToast()

  const handleAssignPlans = async () => {
    try {
      setLoading(true)
      console.log('🔗 Assigning plans to organizations...')

      // Get all organizations without a plan_id
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, plan_type')
        .is('plan_id', null)

      if (orgsError) throw orgsError

      console.log(`📊 Found ${orgs?.length || 0} organizations without plan_id`)

      if (!orgs || orgs.length === 0) {
        showSuccess('Completato', 'Tutte le organizzazioni hanno già un piano assegnato')
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        return
      }

      // Get all plans
      const plans = await omnilyProPlansService.getAllPlans()
      console.log(`📋 Available plans:`, plans.map(p => ({ id: p.id, name: p.name, slug: p.slug })))

      let assignedCount = 0

      for (const org of orgs) {
        let planToAssign = null

        // Try to match based on plan_type field
        if (org.plan_type) {
          const planType = org.plan_type.toLowerCase()

          if (planType.includes('enterprise')) {
            planToAssign = plans.find(p => p.slug.includes('enterprise') || p.name.toLowerCase().includes('enterprise'))
          } else if (planType.includes('pro') || planType.includes('professional')) {
            planToAssign = plans.find(p =>
              p.slug.includes('professional') ||
              p.slug.includes('pro') ||
              p.name.toLowerCase().includes('professional')
            )
          } else if (planType.includes('starter') || planType.includes('basic') || planType.includes('free')) {
            planToAssign = plans.find(p =>
              p.slug.includes('starter') ||
              p.slug.includes('basic') ||
              p.name.toLowerCase().includes('starter') ||
              p.name.toLowerCase().includes('basic')
            )
          }
        }

        // If no match, assign Professional as default
        if (!planToAssign) {
          planToAssign = plans.find(p =>
            p.slug.includes('professional') ||
            p.name.toLowerCase().includes('professional')
          )
        }

        // If still no match, use first available plan
        if (!planToAssign && plans.length > 0) {
          planToAssign = plans[0]
        }

        if (planToAssign) {
          const { error: updateError } = await supabase
            .from('organizations')
            .update({ plan_id: planToAssign.id })
            .eq('id', org.id)

          if (updateError) {
            console.error(`❌ Error assigning plan to ${org.name}:`, updateError)
          } else {
            console.log(`✅ Assigned "${planToAssign.name}" to "${org.name}"`)
            assignedCount++
          }
        } else {
          console.warn(`⚠️ No plan available to assign to ${org.name}`)
        }
      }

      setSuccess(true)
      showSuccess('Completato!', `${assignedCount} organizzazioni collegate ai piani`)

      if (onComplete) {
        onComplete()
      }

      // Reset success after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      console.error('❌ Error assigning plans:', error)
      showError('Errore', error.message || 'Impossibile assegnare i piani')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleAssignPlans}
      disabled={loading || success}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 24px',
        background: success ? '#10b981' : loading ? '#94a3b8' : '#f59e0b',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: loading || success ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      {success ? (
        <>
          <CheckCircle size={18} />
          Piani Assegnati!
        </>
      ) : loading ? (
        <>
          <div style={{
            width: '18px',
            height: '18px',
            border: '2px solid white',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          Assegnazione...
        </>
      ) : (
        <>
          <Link2 size={18} />
          Collega Piani alle Org
        </>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  )
}

export default AssignPlansToOrgsButton
