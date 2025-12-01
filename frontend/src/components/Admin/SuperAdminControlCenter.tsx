/**
 * Super Admin Control Center
 * Centro di controllo centralizzato per monitorare TUTTE le organizzazioni e features
 */

import React, { useState, useEffect } from 'react'
import {
  Activity,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Zap,
  Package,
  Mail,
  MessageSquare,
  Gift,
  Ticket,
  Award,
  CreditCard,
  Globe,
  Shield,
  RefreshCw,
  Eye,
  AlertCircle,
  Target,
  Tag,
  Smartphone,
  Settings,
  Layout,
  Briefcase,
  MapPin,
  Palette,
  Code,
  Webhook,
  HeadphonesIcon,
  UserCog,
  Layers,
  Bell,
  Sparkles
} from 'lucide-react'
import { adminAnalyticsService } from '../../services/adminAnalyticsService'
import { supabase } from '../../lib/supabase'
import PageLoader from '../UI/PageLoader'
import { useToast } from '../../contexts/ToastContext'
import UpdatePlanFeaturesButton from './UpdatePlanFeaturesButton'
import AssignPlansToOrgsButton from './AssignPlansToOrgsButton'
import AdminAIRewardsPanel from './AdminAIRewardsPanel'

interface SuperAdminControlCenterProps {
  onBack: () => void
}

type TabView = 'overview' | 'features' | 'organizations' | 'alerts' | 'revenue' | 'analytics' | 'ai-rewards'

interface GlobalStats {
  totalOrganizations: number
  activeOrganizations: number
  totalCustomers: number
  totalRevenue: number
  monthlyGrowth: number
}

interface FeatureUsage {
  featureName: string
  organizationsUsing: number
  totalOrganizations: number
  percentage: number
  icon: React.ReactNode
  color: string
}

interface OrganizationData {
  id: string
  name: string
  city?: string
  plan_id?: string
  plan_name?: string
  is_active: boolean
  customers_count: number
  created_at: string
  health_status: 'healthy' | 'warning' | 'critical'
}

interface AlertData {
  id: string
  type: 'limit_exceeded' | 'inactive' | 'payment_issue' | 'churn_risk'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  organizationId: string
  organizationName: string
  createdAt: string
}

const SuperAdminControlCenter: React.FC<SuperAdminControlCenterProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<TabView>('overview')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { showSuccess, showError } = useToast()

  // Data states
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null)
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage[]>([])
  const [organizations, setOrganizations] = useState<OrganizationData[]>([])
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadGlobalStats(),
        loadFeatureUsage(),
        loadOrganizations(),
        loadAlerts()
      ])
    } catch (error: any) {
      console.error('Error loading data:', error)
      showError('Errore', 'Impossibile caricare i dati')
    } finally {
      setLoading(false)
    }
  }

  const loadGlobalStats = async () => {
    try {
      console.log('🔍 [Control Center] Loading global stats...')

      // Count total organizations
      const { count: totalOrgs, error: orgsError, data: orgsData } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })

      console.log('📊 Organizations query result:', {
        totalOrgs,
        orgsError,
        hasData: !!orgsData
      })

      if (orgsError) {
        console.error('❌ Error fetching total organizations:', orgsError)
        throw orgsError
      }

      // Count active organizations
      const { count: activeOrgs, error: activeError } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      console.log('📊 Active organizations query result:', {
        activeOrgs,
        activeError
      })

      if (activeError) {
        console.error('❌ Error fetching active organizations:', activeError)
        throw activeError
      }

      // Count total customers across all organizations
      const { count: totalCustomers, error: customersError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })

      console.log('📊 Customers query result:', {
        totalCustomers,
        customersError
      })

      if (customersError) {
        console.error('❌ Error fetching customers:', customersError)
        throw customersError
      }

      // Get analytics for revenue
      console.log('💰 Fetching analytics from adminAnalyticsService...')
      const analytics = await adminAnalyticsService.getAdminAnalytics()
      console.log('💰 Analytics result:', analytics)

      const stats = {
        totalOrganizations: totalOrgs || 0,
        activeOrganizations: activeOrgs || 0,
        totalCustomers: totalCustomers || 0,
        totalRevenue: analytics.revenue.monthly || 0,
        monthlyGrowth: analytics.revenue.growth || 0
      }

      console.log('✅ [Control Center] Final global stats:', stats)
      setGlobalStats(stats)
    } catch (error) {
      console.error('❌ Error loading global stats:', error)
      throw error
    }
  }

  const loadFeatureUsage = async () => {
    try {
      console.log('🎯 [Control Center] Loading feature usage...')

      // Get all organizations
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('id, plan_id')
        .eq('is_active', true)

      console.log('📊 Organizations for feature analysis:', {
        count: orgs?.length || 0,
        error,
        sample: orgs?.slice(0, 3),
        allOrgs: orgs
      })

      if (error) {
        console.error('❌ Error fetching organizations for features:', error)
        throw error
      }

      const totalOrgs = orgs?.length || 0
      console.log('📈 Total organizations for feature tracking:', totalOrgs)

      // Get plans to check features
      const { data: plans, error: plansError } = await supabase
        .from('omnilypro_plans')
        .select('id, features')

      console.log('📋 Plans query result:', {
        plansCount: plans?.length || 0,
        plansError,
        samplePlan: plans?.[0],
        allPlans: plans
      })

      if (plansError) {
        console.error('❌ Error fetching plans:', plansError)
        throw plansError
      }

      // Count feature usage
      const featureMap = new Map<string, number>()

      console.log('🔍 Starting feature mapping...')
      orgs?.forEach((org, index) => {
        console.log(`📦 Org ${index + 1}:`, {
          id: org.id,
          plan_id: org.plan_id,
          hasPlanId: !!org.plan_id
        })

        const plan = plans?.find(p => p.id === org.plan_id)
        console.log(`  → Plan found:`, {
          found: !!plan,
          planId: plan?.id,
          hasFeatures: !!plan?.features,
          features: plan?.features
        })

        if (plan?.features) {
          Object.entries(plan.features).forEach(([key, value]) => {
            if (value === true) {
              featureMap.set(key, (featureMap.get(key) || 0) + 1)
              console.log(`    ✅ Feature ${key}: ${value}`)
            }
          })
        } else {
          console.log(`    ⚠️ No features found for this org's plan`)
        }
      })

      console.log('🎨 Feature map:', Object.fromEntries(featureMap))

      // Convert to array with icons and colors - ALL 27 FEATURES
      const features: FeatureUsage[] = [
        // Core Features
        {
          featureName: 'POS Enabled',
          organizationsUsing: featureMap.get('posEnabled') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('posEnabled') || 0) / totalOrgs) * 100 : 0,
          icon: <CreditCard size={20} />,
          color: '#6366f1'
        },
        {
          featureName: 'Loyalty Programs',
          organizationsUsing: featureMap.get('loyaltyPrograms') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('loyaltyPrograms') || 0) / totalOrgs) * 100 : 0,
          icon: <Award size={20} />,
          color: '#f59e0b'
        },
        // Marketing & Communication
        {
          featureName: 'Email Marketing',
          organizationsUsing: featureMap.get('emailMarketing') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('emailMarketing') || 0) / totalOrgs) * 100 : 0,
          icon: <Mail size={20} />,
          color: '#3b82f6'
        },
        {
          featureName: 'SMS Marketing',
          organizationsUsing: featureMap.get('smsMarketing') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('smsMarketing') || 0) / totalOrgs) * 100 : 0,
          icon: <MessageSquare size={20} />,
          color: '#8b5cf6'
        },
        {
          featureName: 'WhatsApp Marketing',
          organizationsUsing: featureMap.get('whatsappMarketing') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('whatsappMarketing') || 0) / totalOrgs) * 100 : 0,
          icon: <MessageSquare size={20} />,
          color: '#25D366'
        },
        {
          featureName: 'Campaigns',
          organizationsUsing: featureMap.get('campaigns') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('campaigns') || 0) / totalOrgs) * 100 : 0,
          icon: <Target size={20} />,
          color: '#ef4444'
        },
        {
          featureName: 'Email Automations',
          organizationsUsing: featureMap.get('emailAutomations') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('emailAutomations') || 0) / totalOrgs) * 100 : 0,
          icon: <Zap size={20} />,
          color: '#f97316'
        },
        // Customer Engagement
        {
          featureName: 'Coupons',
          organizationsUsing: featureMap.get('coupons') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('coupons') || 0) / totalOrgs) * 100 : 0,
          icon: <Tag size={20} />,
          color: '#10b981'
        },
        {
          featureName: 'Gift Cards',
          organizationsUsing: featureMap.get('giftCards') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('giftCards') || 0) / totalOrgs) * 100 : 0,
          icon: <Gift size={20} />,
          color: '#84cc16'
        },
        {
          featureName: 'Gift Certificates',
          organizationsUsing: featureMap.get('giftCertificates') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('giftCertificates') || 0) / totalOrgs) * 100 : 0,
          icon: <Gift size={20} />,
          color: '#facc15'
        },
        {
          featureName: 'Subscriptions',
          organizationsUsing: featureMap.get('subscriptions') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('subscriptions') || 0) / totalOrgs) * 100 : 0,
          icon: <CreditCard size={20} />,
          color: '#06b6d4'
        },
        {
          featureName: 'Referral Program',
          organizationsUsing: featureMap.get('referralProgram') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('referralProgram') || 0) / totalOrgs) * 100 : 0,
          icon: <Users size={20} />,
          color: '#0ea5e9'
        },
        // Gaming & Lottery
        {
          featureName: 'Gaming/Lottery',
          organizationsUsing: featureMap.get('gamingLottery') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('gamingLottery') || 0) / totalOrgs) * 100 : 0,
          icon: <Ticket size={20} />,
          color: '#ec4899'
        },
        {
          featureName: 'Slot Machine',
          organizationsUsing: featureMap.get('slotMachine') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('slotMachine') || 0) / totalOrgs) * 100 : 0,
          icon: <Zap size={20} />,
          color: '#d946ef'
        },
        {
          featureName: 'Scratch Cards',
          organizationsUsing: featureMap.get('scratchCards') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('scratchCards') || 0) / totalOrgs) * 100 : 0,
          icon: <Ticket size={20} />,
          color: '#c026d3'
        },
        {
          featureName: 'OmnyCoin',
          organizationsUsing: featureMap.get('omnyCoin') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('omnyCoin') || 0) / totalOrgs) * 100 : 0,
          icon: <DollarSign size={20} />,
          color: '#f59e0b'
        },
        // Advanced Features
        {
          featureName: 'NFC Cards',
          organizationsUsing: featureMap.get('nfcCards') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('nfcCards') || 0) / totalOrgs) * 100 : 0,
          icon: <Smartphone size={20} />,
          color: '#8b5cf6'
        },
        {
          featureName: 'Advanced Analytics',
          organizationsUsing: featureMap.get('advancedAnalytics') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('advancedAnalytics') || 0) / totalOrgs) * 100 : 0,
          icon: <BarChart3 size={20} />,
          color: '#6366f1'
        },
        {
          featureName: 'Automations',
          organizationsUsing: featureMap.get('automations') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('automations') || 0) / totalOrgs) * 100 : 0,
          icon: <Settings size={20} />,
          color: '#64748b'
        },
        {
          featureName: 'Public Website',
          organizationsUsing: featureMap.get('publicWebsite') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('publicWebsite') || 0) / totalOrgs) * 100 : 0,
          icon: <Globe size={20} />,
          color: '#0891b2'
        },
        {
          featureName: 'Website Builder',
          organizationsUsing: featureMap.get('websiteBuilder') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('websiteBuilder') || 0) / totalOrgs) * 100 : 0,
          icon: <Layout size={20} />,
          color: '#14b8a6'
        },
        {
          featureName: 'Mobile App',
          organizationsUsing: featureMap.get('mobileApp') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('mobileApp') || 0) / totalOrgs) * 100 : 0,
          icon: <Smartphone size={20} />,
          color: '#06b6d4'
        },
        // Business Management
        {
          featureName: 'Multi Location',
          organizationsUsing: featureMap.get('multiLocation') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('multiLocation') || 0) / totalOrgs) * 100 : 0,
          icon: <MapPin size={20} />,
          color: '#10b981'
        },
        {
          featureName: 'Team Management',
          organizationsUsing: featureMap.get('teamManagement') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('teamManagement') || 0) / totalOrgs) * 100 : 0,
          icon: <Users size={20} />,
          color: '#84cc16'
        },
        {
          featureName: 'Inventory Management',
          organizationsUsing: featureMap.get('inventoryManagement') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('inventoryManagement') || 0) / totalOrgs) * 100 : 0,
          icon: <Package size={20} />,
          color: '#22c55e'
        },
        {
          featureName: 'Categories Management',
          organizationsUsing: featureMap.get('categoriesManagement') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('categoriesManagement') || 0) / totalOrgs) * 100 : 0,
          icon: <Layers size={20} />,
          color: '#65a30d'
        },
        {
          featureName: 'Channels Management',
          organizationsUsing: featureMap.get('channelsManagement') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('channelsManagement') || 0) / totalOrgs) * 100 : 0,
          icon: <Bell size={20} />,
          color: '#16a34a'
        },
        // Customization & Integration
        {
          featureName: 'Custom Branding',
          organizationsUsing: featureMap.get('customBranding') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('customBranding') || 0) / totalOrgs) * 100 : 0,
          icon: <Palette size={20} />,
          color: '#f59e0b'
        },
        {
          featureName: 'Custom Domain',
          organizationsUsing: featureMap.get('customDomain') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('customDomain') || 0) / totalOrgs) * 100 : 0,
          icon: <Globe size={20} />,
          color: '#ea580c'
        },
        {
          featureName: 'API Access',
          organizationsUsing: featureMap.get('apiAccess') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('apiAccess') || 0) / totalOrgs) * 100 : 0,
          icon: <Code size={20} />,
          color: '#64748b'
        },
        {
          featureName: 'Webhooks',
          organizationsUsing: featureMap.get('webhooks') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('webhooks') || 0) / totalOrgs) * 100 : 0,
          icon: <Webhook size={20} />,
          color: '#475569'
        },
        // Support & Services
        {
          featureName: 'Priority Support',
          organizationsUsing: featureMap.get('prioritySupport') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('prioritySupport') || 0) / totalOrgs) * 100 : 0,
          icon: <HeadphonesIcon size={20} />,
          color: '#3b82f6'
        },
        {
          featureName: 'Dedicated Account Manager',
          organizationsUsing: featureMap.get('dedicatedAccountManager') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('dedicatedAccountManager') || 0) / totalOrgs) * 100 : 0,
          icon: <UserCog size={20} />,
          color: '#2563eb'
        },
        {
          featureName: 'Support Tickets',
          organizationsUsing: featureMap.get('supportTickets') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('supportTickets') || 0) / totalOrgs) * 100 : 0,
          icon: <Ticket size={20} />,
          color: '#1d4ed8'
        },
        {
          featureName: 'Contact Messages',
          organizationsUsing: featureMap.get('contactMessages') || 0,
          totalOrganizations: totalOrgs,
          percentage: totalOrgs > 0 ? ((featureMap.get('contactMessages') || 0) / totalOrgs) * 100 : 0,
          icon: <Mail size={20} />,
          color: '#1e40af'
        }
      ]

      // Sort by usage
      features.sort((a, b) => b.percentage - a.percentage)

      console.log('✅ [Control Center] Final feature usage:', features)
      setFeatureUsage(features)
    } catch (error) {
      console.error('Error loading feature usage:', error)
      throw error
    }
  }

  const loadOrganizations = async () => {
    try {
      console.log('🏢 [Control Center] Loading organizations...')

      // Get all organizations with customer count
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          city,
          plan_id,
          is_active,
          created_at,
          customers (count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get plans to add plan names
      const { data: plans } = await supabase
        .from('omnilypro_plans')
        .select('id, name')

      const orgsWithData: OrganizationData[] = (orgs || []).map(org => {
        const plan = plans?.find(p => p.id === org.plan_id)
        const customersCount = org.customers?.[0]?.count || 0

        // Determine health status
        let health_status: 'healthy' | 'warning' | 'critical' = 'healthy'
        if (!org.is_active) {
          health_status = 'critical'
        } else if (customersCount === 0) {
          health_status = 'warning'
        }

        return {
          id: org.id,
          name: org.name,
          city: org.city,
          plan_id: org.plan_id,
          plan_name: plan?.name || 'Nessun Piano',
          is_active: org.is_active,
          customers_count: customersCount,
          created_at: org.created_at,
          health_status
        }
      })

      console.log('✅ [Control Center] Organizations loaded:', orgsWithData.length)
      setOrganizations(orgsWithData)
    } catch (error) {
      console.error('❌ Error loading organizations:', error)
      throw error
    }
  }

  const loadAlerts = async () => {
    try {
      console.log('🚨 [Control Center] Loading alerts...')
      const detectedAlerts: AlertData[] = []

      // Get all organizations with their plan data
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          plan_id,
          is_active,
          created_at,
          customers (count)
        `)

      if (orgsError) throw orgsError

      // Get all plans with features and limits
      const { data: plans, error: plansError } = await supabase
        .from('omnilypro_plans')
        .select('id, name, limits')

      if (plansError) throw plansError

      // Check each organization for issues
      for (const org of orgs || []) {
        const plan = plans?.find(p => p.id === org.plan_id)
        const customersCount = org.customers?.[0]?.count || 0

        // 1. Check if organization is inactive
        if (!org.is_active) {
          detectedAlerts.push({
            id: `inactive-${org.id}`,
            type: 'inactive',
            severity: 'critical',
            title: 'Organizzazione Inattiva',
            description: `${org.name} è stata disattivata`,
            organizationId: org.id,
            organizationName: org.name,
            createdAt: new Date().toISOString()
          })
        }

        // 2. Check if organization has no customers (churn risk)
        if (org.is_active && customersCount === 0) {
          const daysSinceCreation = Math.floor(
            (Date.now() - new Date(org.created_at).getTime()) / (1000 * 60 * 60 * 24)
          )

          if (daysSinceCreation > 30) {
            detectedAlerts.push({
              id: `churn-${org.id}`,
              type: 'churn_risk',
              severity: 'warning',
              title: 'Rischio Churn',
              description: `${org.name} non ha clienti da ${daysSinceCreation} giorni`,
              organizationId: org.id,
              organizationName: org.name,
              createdAt: new Date().toISOString()
            })
          }
        }

        // 3. Check for limit exceeded
        if (plan?.limits && customersCount > 0) {
          const limits = plan.limits as any

          // Check customer limit
          if (limits.maxCustomers && customersCount > limits.maxCustomers) {
            detectedAlerts.push({
              id: `limit-customers-${org.id}`,
              type: 'limit_exceeded',
              severity: 'critical',
              title: 'Limite Clienti Superato',
              description: `${org.name} ha ${customersCount} clienti (limite: ${limits.maxCustomers})`,
              organizationId: org.id,
              organizationName: org.name,
              createdAt: new Date().toISOString()
            })
          }

          // Check if approaching limit (>80%)
          if (limits.maxCustomers && customersCount > limits.maxCustomers * 0.8 && customersCount <= limits.maxCustomers) {
            detectedAlerts.push({
              id: `limit-warning-${org.id}`,
              type: 'limit_exceeded',
              severity: 'warning',
              title: 'Prossimo al Limite',
              description: `${org.name} ha ${customersCount}/${limits.maxCustomers} clienti (${Math.round(customersCount / limits.maxCustomers * 100)}%)`,
              organizationId: org.id,
              organizationName: org.name,
              createdAt: new Date().toISOString()
            })
          }
        }

        // 4. Check if no plan assigned
        if (!org.plan_id) {
          detectedAlerts.push({
            id: `no-plan-${org.id}`,
            type: 'payment_issue',
            severity: 'critical',
            title: 'Nessun Piano Assegnato',
            description: `${org.name} non ha un piano assegnato`,
            organizationId: org.id,
            organizationName: org.name,
            createdAt: new Date().toISOString()
          })
        }
      }

      console.log('✅ [Control Center] Alerts detected:', detectedAlerts.length)
      setAlerts(detectedAlerts)
    } catch (error) {
      console.error('❌ Error loading alerts:', error)
      throw error
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await loadData()
      showSuccess('Aggiornato', 'Dati aggiornati con successo')
    } catch (error) {
      showError('Errore', 'Impossibile aggiornare i dati')
    } finally {
      setRefreshing(false)
    }
  }

  // Filter organizations based on search
  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.plan_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <PageLoader message="Caricamento Control Center..." />
  }

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#1e293b',
            margin: '0 0 8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Shield size={32} style={{ color: '#3b82f6' }} />
            Super Admin Control Center
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>
            Monitoraggio globale di tutte le organizzazioni e features
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <AssignPlansToOrgsButton onComplete={handleRefresh} />
          <UpdatePlanFeaturesButton onComplete={handleRefresh} />
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: refreshing ? '#94a3b8' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Aggiornamento...' : 'Aggiorna'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '8px'
      }}>
        {[
          { id: 'overview', label: 'Overview', icon: <Activity size={16} /> },
          { id: 'features', label: 'Features', icon: <Zap size={16} /> },
          { id: 'organizations', label: 'Organizations', icon: <Package size={16} /> },
          { id: 'alerts', label: 'Alerts', icon: <AlertTriangle size={16} /> },
          { id: 'revenue', label: 'Revenue', icon: <DollarSign size={16} /> },
          { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
          { id: 'ai-rewards', label: 'AI Rewards', icon: <Sparkles size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabView)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: activeTab === tab.id ? '#3b82f6' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div>
          {/* Global Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            <StatCard
              icon={<Package size={24} />}
              title="Organizzazioni Totali"
              value={globalStats?.totalOrganizations || 0}
              subtitle={`${globalStats?.activeOrganizations || 0} attive`}
              color="#3b82f6"
            />
            <StatCard
              icon={<Users size={24} />}
              title="Clienti Totali"
              value={globalStats?.totalCustomers || 0}
              subtitle="Across all organizations"
              color="#8b5cf6"
            />
            <StatCard
              icon={<DollarSign size={24} />}
              title="MRR"
              value={`€${globalStats?.totalRevenue.toLocaleString() || 0}`}
              subtitle={`${globalStats?.monthlyGrowth > 0 ? '+' : ''}${globalStats?.monthlyGrowth.toFixed(1)}% vs last month`}
              color="#10b981"
              trend={globalStats?.monthlyGrowth || 0}
            />
            <StatCard
              icon={<Activity size={24} />}
              title="System Health"
              value="99.2%"
              subtitle="Uptime last 30 days"
              color="#06b6d4"
            />
          </div>

          {/* Feature Usage Overview */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Target size={20} />
              Feature Adoption Rate
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {featureUsage.map((feature, index) => (
                <div key={index}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ color: feature.color }}>
                        {feature.icon}
                      </div>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>
                        {feature.featureName}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '14px', color: '#64748b' }}>
                        {feature.organizationsUsing}/{feature.totalOrganizations} orgs
                      </span>
                      <span style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: feature.color,
                        minWidth: '60px',
                        textAlign: 'right'
                      }}>
                        {feature.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#e2e8f0',
                    borderRadius: '999px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${feature.percentage}%`,
                      height: '100%',
                      background: feature.color,
                      borderRadius: '999px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'features' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>
            Features Analytics
          </h2>
          <p style={{ color: '#64748b' }}>Coming soon - Detailed feature analytics</p>
        </div>
      )}

      {activeTab === 'organizations' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Organizations Monitor
            </h2>
            <input
              type="text"
              placeholder="Cerca organizzazione..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                width: '300px'
              }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Nome</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Città</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Piano</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Clienti</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Creata</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrganizations.map(org => (
                  <tr key={org.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 12px' }}>
                      {org.health_status === 'healthy' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                          <CheckCircle size={18} />
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>Healthy</span>
                        </div>
                      )}
                      {org.health_status === 'warning' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
                          <AlertCircle size={18} />
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>Warning</span>
                        </div>
                      )}
                      {org.health_status === 'critical' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                          <AlertTriangle size={18} />
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>Critical</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{org.name}</div>
                    </td>
                    <td style={{ padding: '16px 12px', color: '#64748b' }}>{org.city || '-'}</td>
                    <td style={{ padding: '16px 12px' }}>
                      <span style={{
                        padding: '4px 12px',
                        background: '#f1f5f9',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#475569'
                      }}>
                        {org.plan_name}
                      </span>
                    </td>
                    <td style={{ padding: '16px 12px', fontWeight: 600, color: '#1e293b' }}>{org.customers_count}</td>
                    <td style={{ padding: '16px 12px', color: '#64748b', fontSize: '14px' }}>
                      {new Date(org.created_at).toLocaleDateString('it-IT')}
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <button
                        onClick={() => window.location.href = `/admin/organizations`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          background: '#f1f5f9',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrganizations.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '48px',
              color: '#94a3b8'
            }}>
              Nessuna organizzazione trovata
            </div>
          )}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Alerts & Issues
            </h2>
            <div style={{
              padding: '8px 16px',
              background: alerts.length > 0 ? '#fef3c7' : '#dcfce7',
              borderRadius: '999px',
              fontSize: '14px',
              fontWeight: 600,
              color: alerts.length > 0 ? '#92400e' : '#166534'
            }}>
              {alerts.length} Alert{alerts.length !== 1 ? 's' : ''}
            </div>
          </div>

          {alerts.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px',
              color: '#10b981'
            }}>
              <CheckCircle size={48} style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                Nessun Alert Attivo
              </div>
              <div style={{ color: '#64748b' }}>
                Tutte le organizzazioni sono in stato ottimale
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Critical Alerts */}
              {alerts.filter(a => a.severity === 'critical').length > 0 && (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444', margin: 0 }}>
                      Critical ({alerts.filter(a => a.severity === 'critical').length})
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {alerts
                      .filter(a => a.severity === 'critical')
                      .map(alert => (
                        <div
                          key={alert.id}
                          style={{
                            padding: '16px',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#dc2626',
                              marginBottom: '4px'
                            }}>
                              {alert.title}
                            </div>
                            <div style={{ fontSize: '13px', color: '#991b1b', marginBottom: '8px' }}>
                              {alert.description}
                            </div>
                            <div style={{ fontSize: '12px', color: '#b91c1c' }}>
                              Organizzazione: <strong>{alert.organizationName}</strong>
                            </div>
                          </div>
                          <button
                            onClick={() => window.location.href = `/admin/organizations`}
                            style={{
                              padding: '6px 12px',
                              background: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Risolvi
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Warning Alerts */}
              {alerts.filter(a => a.severity === 'warning').length > 0 && (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <AlertCircle size={20} style={{ color: '#f59e0b' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b', margin: 0 }}>
                      Warning ({alerts.filter(a => a.severity === 'warning').length})
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {alerts
                      .filter(a => a.severity === 'warning')
                      .map(alert => (
                        <div
                          key={alert.id}
                          style={{
                            padding: '16px',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#d97706',
                              marginBottom: '4px'
                            }}>
                              {alert.title}
                            </div>
                            <div style={{ fontSize: '13px', color: '#92400e', marginBottom: '8px' }}>
                              {alert.description}
                            </div>
                            <div style={{ fontSize: '12px', color: '#b45309' }}>
                              Organizzazione: <strong>{alert.organizationName}</strong>
                            </div>
                          </div>
                          <button
                            onClick={() => window.location.href = `/admin/organizations`}
                            style={{
                              padding: '6px 12px',
                              background: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Verifica
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Info Alerts */}
              {alerts.filter(a => a.severity === 'info').length > 0 && (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <Bell size={20} style={{ color: '#3b82f6' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6', margin: 0 }}>
                      Info ({alerts.filter(a => a.severity === 'info').length})
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {alerts
                      .filter(a => a.severity === 'info')
                      .map(alert => (
                        <div
                          key={alert.id}
                          style={{
                            padding: '16px',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#2563eb',
                              marginBottom: '4px'
                            }}>
                              {alert.title}
                            </div>
                            <div style={{ fontSize: '13px', color: '#1e40af', marginBottom: '8px' }}>
                              {alert.description}
                            </div>
                            <div style={{ fontSize: '12px', color: '#1d4ed8' }}>
                              Organizzazione: <strong>{alert.organizationName}</strong>
                            </div>
                          </div>
                          <button
                            onClick={() => window.location.href = `/admin/organizations`}
                            style={{
                              padding: '6px 12px',
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Visualizza
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'revenue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Revenue Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {/* Total MRR */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              padding: '24px',
              color: 'white',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <DollarSign size={24} />
                <div style={{ fontSize: '14px', opacity: 0.9 }}>MRR Totale</div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700 }}>
                €{globalStats?.totalRevenue.toFixed(2) || '0.00'}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
                {globalStats?.monthlyGrowth && globalStats.monthlyGrowth > 0 ? '+' : ''}
                {globalStats?.monthlyGrowth.toFixed(1)}% vs mese scorso
              </div>
            </div>

            {/* Revenue per Organization */}
            <div style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '12px',
              padding: '24px',
              color: 'white',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <TrendingUp size={24} />
                <div style={{ fontSize: '14px', opacity: 0.9 }}>MRR / Org</div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700 }}>
                €{globalStats && globalStats.activeOrganizations > 0
                  ? (globalStats.totalRevenue / globalStats.activeOrganizations).toFixed(2)
                  : '0.00'}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
                Media per organizzazione
              </div>
            </div>

            {/* Active Subscriptions */}
            <div style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              borderRadius: '12px',
              padding: '24px',
              color: 'white',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <CreditCard size={24} />
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Abbonamenti Attivi</div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700 }}>
                {globalStats?.activeOrganizations || 0}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
                {globalStats?.totalOrganizations || 0} totali
              </div>
            </div>

            {/* Annual Recurring Revenue */}
            <div style={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              borderRadius: '12px',
              padding: '24px',
              color: 'white',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <BarChart3 size={24} />
                <div style={{ fontSize: '14px', opacity: 0.9 }}>ARR Proiettato</div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700 }}>
                €{globalStats ? (globalStats.totalRevenue * 12).toFixed(2) : '0.00'}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
                Annual Recurring Revenue
              </div>
            </div>
          </div>

          {/* Revenue Breakdown by Plan */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#1e293b' }}>
              Revenue Breakdown per Piano
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Starter Plan Revenue */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '3px',
                      background: '#f59e0b'
                    }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>Starter Plan</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>€49/mese</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: '#f1f5f9',
                  borderRadius: '999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: '20%',
                    height: '100%',
                    background: '#f59e0b',
                    borderRadius: '999px'
                  }} />
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Utilizzato da ~20% delle organizzazioni
                </div>
              </div>

              {/* Professional Plan Revenue */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '3px',
                      background: '#8b5cf6'
                    }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>Professional Plan</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#8b5cf6' }}>€125/mese</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: '#f1f5f9',
                  borderRadius: '999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: '60%',
                    height: '100%',
                    background: '#8b5cf6',
                    borderRadius: '999px'
                  }} />
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Utilizzato da ~60% delle organizzazioni - Piano più popolare
                </div>
              </div>

              {/* Enterprise Plan Revenue */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '3px',
                      background: '#10b981'
                    }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>Enterprise Plan</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>€299/mese</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: '#f1f5f9',
                  borderRadius: '999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: '20%',
                    height: '100%',
                    background: '#10b981',
                    borderRadius: '999px'
                  }} />
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Utilizzato da ~20% delle organizzazioni
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Insights */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#1e293b' }}>
              Revenue Insights
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {/* Churn Rate */}
              <div style={{
                padding: '16px',
                background: '#fef3c7',
                borderRadius: '8px',
                border: '1px solid #fde68a'
              }}>
                <div style={{ fontSize: '12px', color: '#92400e', fontWeight: 600, marginBottom: '8px' }}>
                  CHURN RATE
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#b45309' }}>
                  {globalStats && globalStats.totalOrganizations > 0
                    ? ((1 - globalStats.activeOrganizations / globalStats.totalOrganizations) * 100).toFixed(1)
                    : '0.0'}%
                </div>
                <div style={{ fontSize: '11px', color: '#92400e', marginTop: '4px' }}>
                  Tasso di abbandono
                </div>
              </div>

              {/* Average Customer Value */}
              <div style={{
                padding: '16px',
                background: '#dbeafe',
                borderRadius: '8px',
                border: '1px solid #bfdbfe'
              }}>
                <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: 600, marginBottom: '8px' }}>
                  LIFETIME VALUE
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#1d4ed8' }}>
                  €{globalStats && globalStats.activeOrganizations > 0
                    ? ((globalStats.totalRevenue / globalStats.activeOrganizations) * 12).toFixed(0)
                    : '0'}
                </div>
                <div style={{ fontSize: '11px', color: '#1e40af', marginTop: '4px' }}>
                  Valore annuale medio
                </div>
              </div>

              {/* Growth Trend */}
              <div style={{
                padding: '16px',
                background: '#dcfce7',
                borderRadius: '8px',
                border: '1px solid #bbf7d0'
              }}>
                <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600, marginBottom: '8px' }}>
                  TREND CRESCITA
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#15803d' }}>
                  {globalStats?.monthlyGrowth && globalStats.monthlyGrowth > 0 ? '+' : ''}
                  {globalStats?.monthlyGrowth.toFixed(1) || '0.0'}%
                </div>
                <div style={{ fontSize: '11px', color: '#166534', marginTop: '4px' }}>
                  Crescita mensile
                </div>
              </div>

              {/* Total Customers */}
              <div style={{
                padding: '16px',
                background: '#fce7f3',
                borderRadius: '8px',
                border: '1px solid #fbcfe8'
              }}>
                <div style={{ fontSize: '12px', color: '#9f1239', fontWeight: 600, marginBottom: '8px' }}>
                  CLIENTI TOTALI
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#be123c' }}>
                  {globalStats?.totalCustomers || 0}
                </div>
                <div style={{ fontSize: '11px', color: '#9f1239', marginTop: '4px' }}>
                  Across all orgs
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Platform Health Metrics */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#1e293b' }}>
              Platform Health Metrics
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Active Organizations Rate */}
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <Activity size={24} />
                  <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: 600 }}>ACTIVATION RATE</div>
                </div>
                <div style={{ fontSize: '36px', fontWeight: 700 }}>
                  {globalStats && globalStats.totalOrganizations > 0
                    ? ((globalStats.activeOrganizations / globalStats.totalOrganizations) * 100).toFixed(1)
                    : '0'}%
                </div>
                <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '8px' }}>
                  {globalStats?.activeOrganizations || 0} su {globalStats?.totalOrganizations || 0} organizzazioni attive
                </div>
              </div>

              {/* Customer Density */}
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '12px',
                color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <Users size={24} />
                  <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: 600 }}>CUSTOMER DENSITY</div>
                </div>
                <div style={{ fontSize: '36px', fontWeight: 700 }}>
                  {globalStats && globalStats.activeOrganizations > 0
                    ? (globalStats.totalCustomers / globalStats.activeOrganizations).toFixed(1)
                    : '0'}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '8px' }}>
                  Clienti medi per organizzazione
                </div>
              </div>

              {/* Revenue per Customer */}
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                borderRadius: '12px',
                color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <DollarSign size={24} />
                  <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: 600 }}>REVENUE / CUSTOMER</div>
                </div>
                <div style={{ fontSize: '36px', fontWeight: 700 }}>
                  €{globalStats && globalStats.totalCustomers > 0
                    ? (globalStats.totalRevenue / globalStats.totalCustomers).toFixed(2)
                    : '0.00'}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '8px' }}>
                  MRR generato per cliente
                </div>
              </div>
            </div>
          </div>

          {/* Feature Adoption Analysis */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#1e293b' }}>
              Feature Adoption Analysis
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {/* Most Used Features */}
              <div style={{
                padding: '16px',
                background: '#f0fdf4',
                borderRadius: '8px',
                border: '1px solid #bbf7d0'
              }}>
                <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600, marginBottom: '8px' }}>
                  TOP FEATURES
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  <div style={{ fontSize: '13px', color: '#15803d', display: 'flex', justifyContent: 'space-between' }}>
                    <span>POS System</span>
                    <strong>100%</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#15803d', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Loyalty Programs</span>
                    <strong>100%</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#15803d', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Email Marketing</span>
                    <strong>95%</strong>
                  </div>
                </div>
              </div>

              {/* Least Used Features */}
              <div style={{
                padding: '16px',
                background: '#fff7ed',
                borderRadius: '8px',
                border: '1px solid #fed7aa'
              }}>
                <div style={{ fontSize: '12px', color: '#9a3412', fontWeight: 600, marginBottom: '8px' }}>
                  LEAST USED
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  <div style={{ fontSize: '13px', color: '#c2410c', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Mobile App</span>
                    <strong>20%</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#c2410c', display: 'flex', justifyContent: 'space-between' }}>
                    <span>API Access</span>
                    <strong>25%</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#c2410c', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Webhooks</span>
                    <strong>30%</strong>
                  </div>
                </div>
              </div>

              {/* Average Features per Org */}
              <div style={{
                padding: '16px',
                background: '#eff6ff',
                borderRadius: '8px',
                border: '1px solid #bfdbfe'
              }}>
                <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: 600, marginBottom: '8px' }}>
                  AVERAGE FEATURES
                </div>
                <div style={{ fontSize: '48px', fontWeight: 700, color: '#1d4ed8', textAlign: 'center', marginTop: '12px' }}>
                  {featureUsage.length > 0
                    ? (featureUsage.reduce((sum, f) => sum + f.percentage, 0) / featureUsage.length).toFixed(0)
                    : '0'}%
                </div>
                <div style={{ fontSize: '12px', color: '#1e40af', textAlign: 'center', marginTop: '8px' }}>
                  Feature adoption media
                </div>
              </div>
            </div>
          </div>

          {/* Growth & Engagement Trends */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#1e293b' }}>
              Growth & Engagement Trends
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* Organizations Growth */}
              <div style={{
                padding: '20px',
                background: '#fefce8',
                borderRadius: '12px',
                border: '2px solid #fef08a'
              }}>
                <div style={{ fontSize: '12px', color: '#713f12', fontWeight: 700, marginBottom: '8px' }}>
                  ORG GROWTH RATE
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#a16207' }}>
                  +{globalStats?.monthlyGrowth.toFixed(1) || '0'}%
                </div>
                <div style={{ fontSize: '11px', color: '#854d0e', marginTop: '4px' }}>
                  Nuove organizzazioni mensili
                </div>
              </div>

              {/* Customer Acquisition */}
              <div style={{
                padding: '20px',
                background: '#f0fdfa',
                borderRadius: '12px',
                border: '2px solid #99f6e4'
              }}>
                <div style={{ fontSize: '12px', color: '#134e4a', fontWeight: 700, marginBottom: '8px' }}>
                  CUSTOMER ACQUISITION
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#0f766e' }}>
                  {globalStats?.totalCustomers || 0}
                </div>
                <div style={{ fontSize: '11px', color: '#115e59', marginTop: '4px' }}>
                  Clienti totali piattaforma
                </div>
              </div>

              {/* Platform Utilization */}
              <div style={{
                padding: '20px',
                background: '#faf5ff',
                borderRadius: '12px',
                border: '2px solid #e9d5ff'
              }}>
                <div style={{ fontSize: '12px', color: '#581c87', fontWeight: 700, marginBottom: '8px' }}>
                  PLATFORM UTILIZATION
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#7c3aed' }}>
                  {globalStats && globalStats.totalOrganizations > 0
                    ? ((globalStats.activeOrganizations / globalStats.totalOrganizations) * 100).toFixed(0)
                    : '0'}%
                </div>
                <div style={{ fontSize: '11px', color: '#6b21a8', marginTop: '4px' }}>
                  Tasso di utilizzo attivo
                </div>
              </div>

              {/* Revenue Growth */}
              <div style={{
                padding: '20px',
                background: '#fef2f2',
                borderRadius: '12px',
                border: '2px solid #fecaca'
              }}>
                <div style={{ fontSize: '12px', color: '#7f1d1d', fontWeight: 700, marginBottom: '8px' }}>
                  REVENUE GROWTH
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#dc2626' }}>
                  +{globalStats?.monthlyGrowth.toFixed(1) || '0'}%
                </div>
                <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '4px' }}>
                  Crescita MRR mensile
                </div>
              </div>
            </div>
          </div>

          {/* System Performance */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#1e293b' }}>
              System Performance & Alerts
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              {/* Total Alerts */}
              <div style={{
                padding: '20px',
                background: alerts.length > 0 ? '#fef2f2' : '#f0fdf4',
                borderRadius: '12px',
                border: `2px solid ${alerts.length > 0 ? '#fecaca' : '#bbf7d0'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <Bell size={24} style={{ color: alerts.length > 0 ? '#dc2626' : '#16a34a' }} />
                  <div style={{ fontSize: '13px', fontWeight: 700, color: alerts.length > 0 ? '#7f1d1d' : '#166534' }}>
                    SYSTEM ALERTS
                  </div>
                </div>
                <div style={{ fontSize: '36px', fontWeight: 700, color: alerts.length > 0 ? '#dc2626' : '#16a34a' }}>
                  {alerts.length}
                </div>
                <div style={{ fontSize: '12px', color: alerts.length > 0 ? '#991b1b' : '#15803d', marginTop: '8px' }}>
                  {alerts.length === 0 ? 'Nessun problema rilevato' : 'Problemi da risolvere'}
                </div>
              </div>

              {/* Critical Issues */}
              <div style={{
                padding: '20px',
                background: '#fef2f2',
                borderRadius: '12px',
                border: '2px solid #fca5a5'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <AlertTriangle size={24} style={{ color: '#ef4444' }} />
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#7f1d1d' }}>
                    CRITICAL ISSUES
                  </div>
                </div>
                <div style={{ fontSize: '36px', fontWeight: 700, color: '#ef4444' }}>
                  {alerts.filter(a => a.severity === 'critical').length}
                </div>
                <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '8px' }}>
                  Richiedono attenzione immediata
                </div>
              </div>

              {/* Organizations at Risk */}
              <div style={{
                padding: '20px',
                background: '#fffbeb',
                borderRadius: '12px',
                border: '2px solid #fde68a'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <AlertCircle size={24} style={{ color: '#f59e0b' }} />
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400e' }}>
                    AT RISK
                  </div>
                </div>
                <div style={{ fontSize: '36px', fontWeight: 700, color: '#f59e0b' }}>
                  {organizations.filter(o => o.health_status === 'warning' || o.health_status === 'critical').length}
                </div>
                <div style={{ fontSize: '12px', color: '#92400e', marginTop: '8px' }}>
                  Organizzazioni con problemi
                </div>
              </div>

              {/* Healthy Organizations */}
              <div style={{
                padding: '20px',
                background: '#f0fdf4',
                borderRadius: '12px',
                border: '2px solid #86efac'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <CheckCircle size={24} style={{ color: '#22c55e' }} />
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>
                    HEALTHY
                  </div>
                </div>
                <div style={{ fontSize: '36px', fontWeight: 700, color: '#22c55e' }}>
                  {organizations.filter(o => o.health_status === 'healthy').length}
                </div>
                <div style={{ fontSize: '12px', color: '#15803d', marginTop: '8px' }}>
                  Organizzazioni in salute
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Rewards Tab */}
      {activeTab === 'ai-rewards' && (
        <AdminAIRewardsPanel />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: string | number
  subtitle: string
  color: string
  trend?: number
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle, color, trend }) => {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e2e8f0'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color
        }}>
          {icon}
        </div>
        {trend !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '14px',
            fontWeight: 600,
            color: trend > 0 ? '#10b981' : trend < 0 ? '#ef4444' : '#64748b'
          }}>
            <TrendingUp size={16} style={{ transform: trend < 0 ? 'rotate(180deg)' : 'none' }} />
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <h3 style={{
        fontSize: '0.875rem',
        fontWeight: 600,
        color: '#64748b',
        margin: '0 0 8px 0',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {title}
      </h3>
      <div style={{
        fontSize: '2rem',
        fontWeight: 700,
        color: '#1e293b',
        marginBottom: '8px'
      }}>
        {value}
      </div>
      <p style={{
        fontSize: '0.875rem',
        color: '#94a3b8',
        margin: 0
      }}>
        {subtitle}
      </p>
    </div>
  )
}

export default SuperAdminControlCenter
