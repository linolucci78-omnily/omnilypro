import { supabase } from '../lib/supabase.ts'

/**
 * Service for managing organizations in OMNILY PRO multi-tenant system
 */
export class OrganizationService {
    
    /**
     * Create new organization from EnterpriseWizard data
     * @param {Object} wizardData - Complete data from wizard steps
     * @param {Object} userInfo - Current user info
     * @param {String} mode - 'admin' or 'client' (default: 'client')
     */
    async createOrganization(wizardData: any, _userInfo: any, mode: 'admin' | 'client' = 'client') {
        try {
            console.log('ORGANIZATION SERVICE: Creating organization from wizard data...', wizardData)
            console.log('Mode:', mode)

            // STEP 1: Create or get business owner
            let ownerId = null
            if (wizardData.ownerEmail) {
                ownerId = await this.createOrGetBusinessOwner({
                    firstName: wizardData.ownerFirstName,
                    lastName: wizardData.ownerLastName,
                    email: wizardData.ownerEmail,
                    phone: wizardData.ownerPhone,
                    avatarUrl: wizardData.ownerAvatarUrl
                })
                console.log('✅ Business owner created/found:', ownerId)
            }

            // Generate unique slug from organization name
            const slug = await this.generateUniqueSlug(wizardData.organizationName)

            // Generate activation token if in admin mode
            const activationToken = mode === 'admin' ? crypto.randomUUID() : null
            const status = mode === 'admin' ? 'pending_payment' : 'active'

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

                // Owner Relation (FK to business_owners table)
                owner_id: ownerId,

                // Plan from dynamic selection
                plan_id: wizardData.planId || null,
                plan_status: status === 'active' ? 'active' : 'pending',

                // Activation (for admin mode)
                status: status,
                activation_token: activationToken,
                invited_at: mode === 'admin' ? new Date().toISOString() : null,
                onboarding_completed: mode === 'admin' ? true : false,
                
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

            // Initialize storage bucket for email images
            await this.initializeStorageBucket(organization.id)

            // Create default rewards in the rewards table
            if (wizardData.defaultRewards && wizardData.defaultRewards.length > 0) {
                await this.createDefaultRewards(organization.id, wizardData.defaultRewards)
            }

            // SEND BUSINESS INVITE EMAIL if in admin mode
            if (mode === 'admin' && wizardData.ownerEmail && wizardData.planId && activationToken) {
                console.log('📧 Sending business invite email to:', wizardData.ownerEmail)
                console.log('Plan ID:', wizardData.planId)
                console.log('Activation token:', activationToken)

                try {
                    const { emailService } = await import('../services/emailService')
                    const { omnilyProPlansService } = await import('../services/omnilyProPlansService')

                    // Get plan details from database
                    const allPlans = await omnilyProPlansService.getAllPlans()
                    const selectedPlan = allPlans.find(p => p.id === wizardData.planId)
                    const emailPlanType = selectedPlan?.slug || 'basic'

                    const emailResult = await emailService.sendBusinessInviteEmail(
                        wizardData.ownerEmail,
                        emailPlanType,
                        activationToken
                    )

                    if (emailResult.success) {
                        console.log('✅ Business invite email sent successfully to:', wizardData.ownerEmail)
                    } else {
                        console.error('❌ Failed to send business invite email:', emailResult.error)
                    }
                } catch (emailError) {
                    console.error('❌ Exception sending business invite email:', emailError)
                }
            }

            return {
                success: true,
                organization,
                subdomain: `${slug}.omnilypro.app`,
                dashboardUrl: `/dashboard?org=${organization.id}`,
                activationToken: activationToken,
                activationUrl: activationToken ? `/activate/${activationToken}` : null,
                mode: mode
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
        // Convert to slug format (without hyphens)
        let baseSlug = orgName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '') // Remove everything except letters and numbers
        
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
     * Create default rewards from wizard data
     */
    async createDefaultRewards(orgId: any, defaultRewards: any[]) {
        try {
            console.log(`Creating ${defaultRewards.length} default rewards for organization ${orgId}`)

            const rewardsToInsert = defaultRewards.map((reward: any) => ({
                organization_id: orgId,
                name: reward.description || `Premio ${reward.points} punti`,
                description: reward.description || '',
                type: reward.type || 'discount',
                value: reward.value || '0',
                points_required: parseInt(reward.points) || 100,
                required_tier: reward.requiredTier || null,
                stock_quantity: null, // Unlimited
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }))

            const { data, error } = await supabase
                .from('rewards')
                .insert(rewardsToInsert)
                .select()

            if (error) {
                console.error('Failed to create default rewards:', error)
                throw error
            }

            console.log(`✅ Created ${data?.length || 0} default rewards`)
            return data
        } catch (error) {
            console.error('Error creating default rewards:', error)
            // Don't throw - allow organization creation to continue
            return []
        }
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
     * Initialize storage bucket for organization email images
     */
    async initializeStorageBucket(orgId: any) {
        try {
            console.log(`Creating storage bucket for organization ${orgId}`)

            const { data, error } = await supabase.functions.invoke('create-storage-bucket', {
                body: { organizationId: orgId }
            })

            if (error) {
                console.error('Failed to create storage bucket:', error)
                // Don't throw - allow organization creation to continue
                return
            }

            console.log('✅ Storage bucket initialized:', data)
        } catch (error) {
            console.error('Error initializing storage bucket:', error)
            // Don't throw - allow organization creation to continue
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

    /**
     * Update organization details
     */
    async updateOrganizationDetails(orgId: string, data: any) {
        const { data: result, error } = await supabase
            .from('organizations')
            .update({
                name: data.name,
                partita_iva: data.partita_iva,
                codice_fiscale: data.codice_fiscale,
                industry: data.industry,
                business_email: data.business_email,
                phone: data.phone_number,
                website: data.website,
                tagline: data.tagline,
                address: data.address,
                city: data.city,
                postal_code: data.cap,
                updated_at: new Date().toISOString()
            })
            .eq('id', orgId)
            .select()
            .single()

        if (error) throw error
        return result
    }

    /**
     * Update loyalty settings
     */
    async updateLoyaltySettings(orgId: string, settings: any) {
        const { data, error } = await supabase
            .from('organizations')
            .update({
                points_name: settings.points_name,
                points_per_euro: settings.points_per_euro,
                reward_threshold: settings.reward_threshold,
                welcome_bonus: settings.welcome_bonus,
                points_expiry_months: settings.points_expiry_months,
                enable_tier_system: settings.enable_tier_system,
                updated_at: new Date().toISOString()
            })
            .eq('id', orgId)
            .select()
            .single()

        if (error) throw error
        return data
    }

    /**
     * Update branding
     */
    async updateBranding(orgId: string, branding: any) {
        const { data, error } = await supabase
            .from('organizations')
            .update({
                logo_url: branding.logo_url,
                primary_color: branding.primary_color,
                secondary_color: branding.secondary_color,
                updated_at: new Date().toISOString()
            })
            .eq('id', orgId)
            .select()
            .single()

        if (error) throw error
        return data
    }

    /**
     * Reset all customer points for organization
     */
    async resetAllPoints(orgId: string) {
        const { error } = await supabase
            .from('customers')
            .update({ points: 0 })
            .eq('organization_id', orgId)

        if (error) throw error

        console.log(`✅ Azzerati tutti i punti per organization: ${orgId}`)
    }

    /**
     * Schedule points reset
     */
    async schedulePointsReset(orgId: string, resetDate: Date) {
        const { data, error } = await supabase
            .from('organizations')
            .update({
                scheduled_points_reset: resetDate.toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', orgId)
            .select()
            .single()

        if (error) throw error
        return data
    }

    /**
     * Create or get existing business owner
     * Returns owner_id (creates new if email doesn't exist, returns existing if it does)
     */
    async createOrGetBusinessOwner(ownerData: any) {
        try {
            // Check if owner already exists by email
            const { data: existingOwner, error: searchError } = await supabase
                .from('business_owners')
                .select('id')
                .eq('email', ownerData.email)
                .single()

            if (existingOwner) {
                console.log('📧 Existing business owner found:', ownerData.email)
                return existingOwner.id
            }

            // Create new business owner
            // Log dei dati prima dell'inserimento
            console.log('📝 Attempting to create business owner with data:', {
                first_name: ownerData.firstName,
                last_name: ownerData.lastName,
                email: ownerData.email,
                phone: ownerData.phone,
                avatar_url: ownerData.avatarUrl
            })

            const { data: newOwner, error: createError } = await supabase
                .from('business_owners')
                .insert({
                    first_name: ownerData.firstName,
                    last_name: ownerData.lastName,
                    email: ownerData.email,
                    phone: ownerData.phone,
                    avatar_url: ownerData.avatarUrl
                })
                .select('id')
                .single()

            if (createError) {
                console.error('Failed to create business owner:', createError)
                console.error('Full error details:', JSON.stringify(createError, null, 2))
                throw createError
            }

            console.log('✅ New business owner created:', ownerData.email)

            // STEP 2: Create Supabase Auth user with email confirmation
            try {
                const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                    email: ownerData.email,
                    email_confirm: false, // User must confirm via email
                    user_metadata: {
                        first_name: ownerData.firstName,
                        last_name: ownerData.lastName,
                        role: 'business_owner',
                        owner_id: newOwner.id
                    }
                })

                if (authError) {
                    console.error('⚠️ Failed to create Auth user (will need manual setup):', authError)
                    // Don't throw - we still want to return the owner_id
                    // Admin can manually send activation email later
                } else {
                    console.log('✅ Supabase Auth user created, activation email sent to:', ownerData.email)
                }
            } catch (authException) {
                console.error('⚠️ Exception creating Auth user:', authException)
                // Continue anyway - business_owner record is created
            }

            return newOwner.id
        } catch (error) {
            console.error('Error in createOrGetBusinessOwner:', error)
            throw error
        }
    }

    /**
     * Get all organizations owned by a business owner (for organization switcher)
     */
    async getOwnerOrganizations(ownerEmail: string) {
        try {
            const { data, error } = await supabase
                .rpc('get_owner_organizations', { owner_email_param: ownerEmail })

            if (error) {
                console.error('Failed to get owner organizations:', error)
                return []
            }

            console.log(`📋 Found ${data?.length || 0} organizations for owner:`, ownerEmail)
            return data || []
        } catch (error) {
            console.error('Error in getOwnerOrganizations:', error)
            return []
        }
    }

    /**
     * Get organization users (staff/team members)
     * Uses RPC function to join with auth.users
     */
    async getOrganizationUsers(orgId: string) {
        try {
            // Try RPC function first (requires migration 051)
            const { data, error } = await supabase
                .rpc('get_organization_users_with_auth', { p_org_id: orgId })

            if (!error && data) {
                // Transform to match Customer interface format
                return data?.map((item: any) => {
                    const userId = item?.user_id || 'unknown'
                    const userEmail = item?.user_email || ''
                    const fullName = item?.full_name || userEmail?.split('@')?.[0] || 'User'

                    return {
                        id: userId,
                        email: userEmail || userId,
                        name: fullName,
                        phone: item?.phone || '',
                        organization_id: orgId,
                        role: item?.role || 'user',
                        joined_at: item?.joined_at || new Date().toISOString()
                    }
                }) || []
            }

            // Fallback: if RPC doesn't exist, use direct query
            console.warn('⚠️ RPC function not found, using fallback query')
            const { data: orgUsers, error: fallbackError } = await supabase
                .from('organization_users')
                .select('user_id, role, joined_at')
                .eq('org_id', orgId)

            if (fallbackError) {
                console.error('Failed to get organization users (fallback):', fallbackError)
                throw fallbackError
            }

            // Return minimal data without auth.users join
            return orgUsers?.map((item: any) => {
                const userId = item?.user_id || 'unknown'
                const userIdShort = typeof userId === 'string' ? userId.substring(0, 8) : 'unknown'
                const role = item?.role || 'user'

                return {
                    id: userId,
                    email: `User ${userIdShort}`, // Show partial UUID
                    name: `${role === 'org_admin' ? 'Administrator' : role === 'super_admin' ? 'Super Admin' : 'User'} (${userIdShort})`,
                    phone: '',
                    organization_id: orgId,
                    role: role,
                    joined_at: item?.joined_at || new Date().toISOString()
                }
            }) || []
        } catch (error) {
            console.error('Error in getOrganizationUsers:', error)
            throw error
        }
    }
}

// Export singleton instance
export const organizationService = new OrganizationService()
