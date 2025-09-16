import { supabase } from '../lib/supabase.ts'

/**
 * Service for managing organizations in OMNILY PRO multi-tenant system
 */
export class OrganizationService {
    
    /**
     * Create new organization from EnterpriseWizard data
     * @param {Object} wizardData - Complete data from wizard steps
     * @param {Object} userInfo - Current user info
     */
    async createOrganization(wizardData: any, _userInfo: any) {
        try {
            console.log('ORGANIZATION SERVICE: Creating organization from wizard data...', wizardData)
            
            // Generate unique slug from organization name
            const slug = await this.generateUniqueSlug(wizardData.organizationName)
            
            // Prepare organization data mapping all wizard steps
            const orgData = {
                // Basic info (Step 1)
                name: wizardData.organizationName,
                slug: slug,
                partita_iva: wizardData.partitaIVA,
                codice_fiscale: wizardData.codiceFiscale,
                industry: wizardData.industry,
                address: wizardData.address,
                city: wizardData.city,
                postal_code: wizardData.cap,
                business_email: wizardData.businessEmail,
                phone: wizardData.phoneNumber,
                website: wizardData.website,
                tagline: wizardData.tagline,
                
                // Default plan
                plan_type: 'basic',
                plan_status: 'active',
                
                // Loyalty system (Step 2)
                points_name: wizardData.pointsName || 'Punti',
                points_per_euro: parseFloat(wizardData.pointsPerEuro) || 1.0,
                reward_threshold: parseInt(wizardData.rewardThreshold) || 100,
                welcome_bonus: parseInt(wizardData.welcomeBonus) || 0,
                points_expiry_months: parseInt(wizardData.pointsExpiry) || 12,
                enable_tier_system: wizardData.enableTierSystem === 'true',
                loyalty_tiers: wizardData.loyaltyTiers || [],
                
                // Products & Categories (Step 3)
                import_products: wizardData.importProducts,
                product_categories: wizardData.productCategories || [],
                bonus_categories: wizardData.bonusCategories || [],
                
                // Rewards (Step 4)
                reward_types: wizardData.rewardTypes || ['discount', 'freeProduct', 'cashback'],
                default_rewards: wizardData.defaultRewards || [],
                
                // Branding (Step 5)
                logo_url: wizardData.logoUrl,
                primary_color: wizardData.primaryColor || '#ef4444',
                secondary_color: wizardData.secondaryColor || '#dc2626',
                
                // Social Media
                facebook_url: wizardData.facebookUrl,
                instagram_url: wizardData.instagramUrl,
                linkedin_url: wizardData.linkedinUrl,
                twitter_url: wizardData.twitterUrl,
                
                // Channels (Step 6)
                enable_pos: wizardData.enablePOS,
                enable_ecommerce: wizardData.enableEcommerce,
                enable_app: wizardData.enableApp,
                pos_type: wizardData.posType,
                ecommerce_platform: wizardData.ecommercePlatform,
                
                // Marketing (Step 7)
                welcome_campaign: wizardData.welcomeCampaign,
                birthday_rewards: wizardData.birthdayRewards,
                inactive_campaign: wizardData.inactiveCampaign,
                email_templates: wizardData.emailTemplates || {},
                
                // Team (Step 8)
                admin_name: wizardData.adminName,
                admin_email: wizardData.adminEmail,
                invite_emails: wizardData.inviteEmails || [],
                
                // POS Integration (Step 9)
                pos_enabled: wizardData.posEnabled,
                pos_model: wizardData.posModel,
                pos_connection: wizardData.posConnection,
                enable_receipt_print: wizardData.enableReceiptPrint,
                enable_nfc: wizardData.enableNFC,
                enable_emv: wizardData.enableEMV,
                enable_pinpad: wizardData.enablePinPad,
                
                // Notifications (Step 10)
                enable_email_notifications: wizardData.enableEmailNotifications,
                enable_sms: wizardData.enableSMS,
                enable_push_notifications: wizardData.enablePushNotifications,
                welcome_email_enabled: wizardData.welcomeEmailEnabled,
                
                // Analytics (Step 10)
                enable_advanced_analytics: wizardData.enableAdvancedAnalytics,
                report_frequency: wizardData.reportFrequency || 'weekly',
                kpi_tracking: wizardData.kpiTracking || ['customer_retention', 'average_transaction', 'loyalty_roi'],
                
                // Billing
                billing_email: wizardData.adminEmail,
                
                // Timestamps
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
            
            // Insert organization
            const { data: organization, error: orgError } = await supabase
                .from('organizations')
                .insert(orgData)
                .select()
                .single()
            
            if (orgError) {
                console.error('Failed to create organization:', orgError)
                throw orgError
            }
            
            console.log('Organization created:', organization.name)
            
            // Skip user operations in development with mock auth
            console.log('ORGANIZATION SERVICE: Mock user detected - skipping user/invite operations for development')
            
            // TODO: In production, add current user as org_admin:
            // if (userInfo?.id) {
            //     await this.addUserToOrganization(organization.id, userInfo.id, 'org_admin')
            // }
            
            // TODO: In production, send team invites:
            // if (wizardData.inviteEmails?.length > 0) {
            //     await this.sendTeamInvites(organization.id, wizardData.inviteEmails, userInfo?.id)
            // }
            
            // Initialize usage tracking
            await this.initializeUsageTracking(organization.id)
            
            return {
                success: true,
                organization,
                subdomain: `${slug}.omnilypro.app`,
                dashboardUrl: `/dashboard?org=${organization.id}`
            }
            
        } catch (error: any) {
            console.error('Organization creation failed:', error)
            return {
                success: false,
                error: error.message || 'Failed to create organization'
            }
        }
    }
    
    /**
     * Generate unique slug from organization name
     */
    async generateUniqueSlug(orgName: any) {
        // Convert to slug format
        let baseSlug = orgName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
        
        if (baseSlug.length < 3) {
            baseSlug = 'org-' + baseSlug
        }
        
        // Check uniqueness
        let slug = baseSlug
        let counter = 0
        
        while (true) {
            const { error } = await supabase
                .from('organizations')
                .select('slug')
                .eq('slug', slug)
                .single()
                
            if (error && error.code === 'PGRST116') {
                // Not found - slug is unique
                break
            }
            
            // Slug exists, try with counter
            counter++
            slug = `${baseSlug}-${counter}`
        }
        
        return slug
    }
    
    /**
     * Add user to organization with role
     */
    async addUserToOrganization(orgId: any, userId: any, role = 'org_admin') {
        const { data, error } = await supabase
            .from('organization_users')
            .insert({
                org_id: orgId,
                user_id: userId,
                role: role,
                joined_at: new Date().toISOString()
            })
            .select()
        
        if (error) {
            console.error('Failed to add user to organization:', error)
            throw error
        }
        
        console.log(`User added to organization as ${role}`)
        return data
    }
    
    /**
     * Send team invitations
     */
    async sendTeamInvites(orgId: any, emails: any, invitedBy: any) {
        const invites = []
        
        for (const email of emails) {
            if (email && email.trim()) {
                const token = this.generateInviteToken()
                const expiresAt = new Date()
                expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry
                
                const { data, error } = await supabase
                    .from('organization_invites')
                    .insert({
                        org_id: orgId,
                        email: email.trim(),
                        role: 'manager',
                        token: token,
                        invited_by: invitedBy,
                        expires_at: expiresAt.toISOString()
                    })
                    .select()
                
                if (error) {
                    console.error(`Failed to create invite for ${email}:`, error)
                } else {
                    invites.push(data[0])
                    console.log(`Invite created for ${email}`)
                }
            }
        }
        
        // TODO: Send actual email invitations
        // This would integrate with email service (SendGrid, Mailgun, etc)
        
        return invites
    }
    
    /**
     * Initialize usage tracking for new organization
     */
    async initializeUsageTracking(orgId: any) {
        const today = new Date().toISOString().split('T')[0]
        
        const trackingEntries = [
            { org_id: orgId, resource_type: 'customers', date: today, quantity: 0 },
            { org_id: orgId, resource_type: 'workflows', date: today, quantity: 0 },
            { org_id: orgId, resource_type: 'notifications', date: today, quantity: 0 }
        ]
        
        const { error } = await supabase
            .from('usage_tracking')
            .insert(trackingEntries)
            
        if (error) {
            console.error('Failed to initialize usage tracking:', error)
        } else {
            console.log('Usage tracking initialized')
        }
    }
    
    /**
     * Generate secure invite token
     */
    generateInviteToken() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15) +
               Date.now().toString(36)
    }
    
    /**
     * Get organization by slug
     */
    async getOrganizationBySlug(slug: any) {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('slug', slug)
            .single()
            
        if (error) {
            console.error('Failed to get organization by slug:', error)
            return null
        }
        
        return data
    }
    
    /**
     * Get user organizations
     */
    async getUserOrganizations(userId: any) {
        const { data, error } = await supabase
            .from('organization_users')
            .select(`
                role,
                joined_at,
                organizations (*)
            `)
            .eq('user_id', userId)
            
        if (error) {
            console.error('Failed to get user organizations:', error)
            return []
        }
        
        return data?.map((item: any) => ({
            ...item.organizations,
            userRole: item.role,
            joinedAt: item.joined_at
        })) || []
    }
}

// Export singleton instance
export const organizationService = new OrganizationService()
