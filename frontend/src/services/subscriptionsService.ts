/**
 * Subscriptions Service
 * Universal subscription system for any type of business
 */

import { supabase } from '../lib/supabase';
import type {
  SubscriptionTemplate,
  CreateSubscriptionTemplateRequest,
  UpdateSubscriptionTemplateRequest,
  CustomerSubscription,
  CreateCustomerSubscriptionRequest,
  UpdateCustomerSubscriptionRequest,
  SubscriptionUsage,
  CreateSubscriptionUsageRequest,
  SubscriptionRenewal,
  CreateSubscriptionRenewalRequest,
  SubscriptionSettings,
  UpdateSubscriptionSettingsRequest,
  SubscriptionStats,
  TemplateStats,
  SubscriptionValidationResult,
  ValidateSubscriptionRequest,
  UseSubscriptionRequest,
  SubscriptionResponse,
  PaginatedSubscriptionResponse,
  SubscriptionFilters,
  TemplateFilters,
} from '../types/subscription';

class SubscriptionsService {
  // ============================================================================
  // SUBSCRIPTION TEMPLATES
  // ============================================================================

  /**
   * Get all subscription templates for an organization
   */
  async getTemplates(
    filters: TemplateFilters = {}
  ): Promise<PaginatedSubscriptionResponse<SubscriptionTemplate>> {
    try {
      let query = supabase
        .from('subscription_templates')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.organization_id) {
        query = query.eq('organization_id', filters.organization_id);
      }

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters.visibility) {
        query = query.eq('visibility', filters.visibility);
      }

      if (filters.subscription_type) {
        query = query.eq('subscription_type', filters.subscription_type);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Order by sort_order, then by name
      query = query.order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page: 1,
        limit: data?.length || 0,
        has_more: false
      };
    } catch (error: any) {
      console.error('Error fetching subscription templates:', error);
      throw new Error(error.message || 'Failed to fetch subscription templates');
    }
  }

  /**
   * Get a single subscription template by ID
   */
  async getTemplate(id: string): Promise<SubscriptionTemplate> {
    try {
      const { data, error } = await supabase
        .from('subscription_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Template not found');

      return data;
    } catch (error: any) {
      console.error('Error fetching subscription template:', error);
      throw new Error(error.message || 'Failed to fetch subscription template');
    }
  }

  /**
   * Create a new subscription template
   */
  async createTemplate(
    request: CreateSubscriptionTemplateRequest
  ): Promise<SubscriptionResponse<SubscriptionTemplate>> {
    try {
      // DEBUG: Log current user ID
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔍 Creating template with user_id:', user?.id);
      console.log('🔍 Organization ID:', request.organization_id);

      const { data, error } = await supabase
        .from('subscription_templates')
        .insert([request])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Subscription template created successfully'
      };
    } catch (error: any) {
      console.error('Error creating subscription template:', error);
      return {
        success: false,
        error: error.message || 'Failed to create subscription template'
      };
    }
  }

  /**
   * Update an existing subscription template
   */
  async updateTemplate(
    request: UpdateSubscriptionTemplateRequest
  ): Promise<SubscriptionResponse<SubscriptionTemplate>> {
    try {
      const { id, ...updates } = request;

      const { data, error } = await supabase
        .from('subscription_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Subscription template updated successfully'
      };
    } catch (error: any) {
      console.error('Error updating subscription template:', error);
      return {
        success: false,
        error: error.message || 'Failed to update subscription template'
      };
    }
  }

  /**
   * Delete a subscription template
   */
  async deleteTemplate(id: string): Promise<SubscriptionResponse<void>> {
    try {
      // Check if template has active subscriptions
      const { data: activeSubscriptions } = await supabase
        .from('customer_subscriptions')
        .select('id')
        .eq('template_id', id)
        .eq('status', 'active')
        .limit(1);

      if (activeSubscriptions && activeSubscriptions.length > 0) {
        return {
          success: false,
          error: 'Cannot delete template with active subscriptions'
        };
      }

      const { error } = await supabase
        .from('subscription_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        success: true,
        message: 'Subscription template deleted successfully'
      };
    } catch (error: any) {
      console.error('Error deleting subscription template:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete subscription template'
      };
    }
  }

  // ============================================================================
  // CUSTOMER SUBSCRIPTIONS
  // ============================================================================

  /**
   * Get customer subscriptions with filters
   */
  async getSubscriptions(
    filters: SubscriptionFilters = {}
  ): Promise<PaginatedSubscriptionResponse<CustomerSubscription>> {
    try {
      let query = supabase
        .from('customer_subscriptions')
        .select(`
          *,
          template:subscription_templates(*),
          customer:customers(id, name, email, phone)
        `, { count: 'exact' });

      // Apply filters
      if (filters.organization_id) {
        query = query.eq('organization_id', filters.organization_id);
      }

      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }

      if (filters.template_id) {
        query = query.eq('template_id', filters.template_id);
      }

      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters.search_code) {
        query = query.ilike('subscription_code', `%${filters.search_code}%`);
      }

      if (filters.start_date_from) {
        query = query.gte('start_date', filters.start_date_from);
      }

      if (filters.start_date_to) {
        query = query.lte('start_date', filters.start_date_to);
      }

      if (filters.end_date_from) {
        query = query.gte('end_date', filters.end_date_from);
      }

      if (filters.end_date_to) {
        query = query.lte('end_date', filters.end_date_to);
      }

      if (filters.expiring_in_days) {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + filters.expiring_in_days);

        query = query
          .gte('end_date', today.toISOString())
          .lte('end_date', futureDate.toISOString());
      }

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.range(from, to);

      // Order by created_at desc
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        has_more: count ? count > page * limit : false
      };
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      throw new Error(error.message || 'Failed to fetch subscriptions');
    }
  }

  /**
   * Get a single subscription by ID
   */
  async getSubscription(id: string): Promise<CustomerSubscription> {
    try {
      const { data, error } = await supabase
        .from('customer_subscriptions')
        .select(`
          *,
          template:subscription_templates(*),
          customer:customers(id, name, email, phone)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Subscription not found');

      return data;
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      throw new Error(error.message || 'Failed to fetch subscription');
    }
  }

  /**
   * Get a subscription by code
   */
  async getSubscriptionByCode(code: string): Promise<CustomerSubscription> {
    try {
      const { data, error } = await supabase
        .from('customer_subscriptions')
        .select(`
          *,
          template:subscription_templates(*),
          customer:customers(id, name, email, phone)
        `)
        .eq('subscription_code', code)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Subscription not found');

      return data;
    } catch (error: any) {
      console.error('Error fetching subscription by code:', error);
      throw new Error(error.message || 'Failed to fetch subscription');
    }
  }

  /**
   * Create a new customer subscription
   */
  async createSubscription(
    request: CreateCustomerSubscriptionRequest
  ): Promise<SubscriptionResponse<CustomerSubscription>> {
    try {
      // Get template to calculate end_date
      const template = await this.getTemplate(request.template_id);

      // Calculate end_date based on template duration
      const startDate = request.start_date ? new Date(request.start_date) : new Date();
      const endDate = this.calculateEndDate(startDate, template.duration_type, template.duration_value);

      // Calculate next_renewal_date if auto_renewable
      const nextRenewalDate = template.auto_renewable ? endDate : null;

      // Create subscription
      const subscriptionData = {
        ...request,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        next_renewal_date: nextRenewalDate?.toISOString() || null,
        total_amount_paid: request.amount_paid,
        currency: template.currency
      };

      const { data, error } = await supabase
        .from('customer_subscriptions')
        .insert([subscriptionData])
        .select(`
          *,
          template:subscription_templates(*),
          customer:customers(id, name, email, phone)
        `)
        .single();

      if (error) throw error;

      console.log('✅ Subscription created:', data.subscription_code);

      return {
        success: true,
        data,
        message: 'Subscription created successfully'
      };
    } catch (error: any) {
      console.error('❌ Error creating subscription:', error);
      return {
        success: false,
        error: error.message || 'Failed to create subscription'
      };
    }
  }

  /**
   * Update a customer subscription
   */
  async updateSubscription(
    request: UpdateCustomerSubscriptionRequest
  ): Promise<SubscriptionResponse<CustomerSubscription>> {
    try {
      const { id, ...updates } = request;

      // Add pause timestamp if pausing
      if (updates.status === 'paused' && !updates.pause_reason) {
        throw new Error('Pause reason is required when pausing subscription');
      }

      // Add cancellation timestamp if cancelling
      if (updates.status === 'cancelled') {
        updates.cancellation_reason = updates.cancellation_reason || 'Cancelled by user';
      }

      const { data, error } = await supabase
        .from('customer_subscriptions')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          template:subscription_templates(*),
          customer:customers(id, name, email, phone)
        `)
        .single();

      if (error) throw error;

      console.log('✅ Subscription updated:', data.subscription_code);

      return {
        success: true,
        data,
        message: 'Subscription updated successfully'
      };
    } catch (error: any) {
      console.error('❌ Error updating subscription:', error);
      return {
        success: false,
        error: error.message || 'Failed to update subscription'
      };
    }
  }

  /**
   * Pause a subscription
   */
  async pauseSubscription(
    id: string,
    reason: string
  ): Promise<SubscriptionResponse<CustomerSubscription>> {
    return this.updateSubscription({
      id,
      status: 'paused',
      pause_reason: reason
    });
  }

  /**
   * Resume a paused subscription
   */
  async resumeSubscription(id: string): Promise<SubscriptionResponse<CustomerSubscription>> {
    return this.updateSubscription({
      id,
      status: 'active'
    });
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    id: string,
    reason?: string
  ): Promise<SubscriptionResponse<CustomerSubscription>> {
    return this.updateSubscription({
      id,
      status: 'cancelled',
      cancellation_reason: reason
    });
  }

  // ============================================================================
  // SUBSCRIPTION VALIDATION & USAGE
  // ============================================================================

  /**
   * Validate a subscription code and check if it can be used
   */
  async validateSubscription(
    request: ValidateSubscriptionRequest
  ): Promise<SubscriptionValidationResult> {
    try {
      console.log('🔍 Validating subscription:', request.subscription_code);

      // Get subscription with template
      const subscription = await this.getSubscriptionByCode(request.subscription_code);
      const template = subscription.template as SubscriptionTemplate;

      // Check basic validity
      const validityCheck = await this.checkSubscriptionValidity(subscription);
      if (!validityCheck.is_valid) {
        return {
          is_valid: false,
          reason: validityCheck.reason,
          subscription
        };
      }

      // Reset daily usage if needed
      await this.resetDailyUsageIfNeeded(subscription);

      // Reset weekly usage if needed
      await this.resetWeeklyUsageIfNeeded(subscription);

      // Reload subscription after potential reset
      const updatedSubscription = await this.getSubscription(subscription.id);

      // Check limits
      const limitsCheck = this.checkUsageLimits(updatedSubscription, template);
      if (!limitsCheck.is_valid) {
        return {
          is_valid: false,
          reason: limitsCheck.reason,
          subscription: updatedSubscription,
          template
        };
      }

      // Check item/category restrictions if provided
      if (request.item_name && request.item_category) {
        const itemCheck = this.checkItemRestrictions(
          template,
          request.item_category,
          request.item_price
        );
        if (!itemCheck.is_valid) {
          return {
            is_valid: false,
            reason: itemCheck.reason,
            subscription: updatedSubscription,
            template
          };
        }
      }

      // Check time restrictions
      const timeCheck = this.checkTimeRestrictions(template);
      if (!timeCheck.is_valid) {
        return {
          is_valid: false,
          reason: timeCheck.reason,
          subscription: updatedSubscription,
          template
        };
      }

      // Calculate remaining uses
      const remaining = this.calculateRemainingUses(updatedSubscription, template);

      console.log('✅ Subscription valid:', request.subscription_code);

      return {
        is_valid: true,
        subscription: updatedSubscription,
        template,
        remaining_uses: remaining
      };
    } catch (error: any) {
      console.error('❌ Error validating subscription:', error);
      return {
        is_valid: false,
        reason: error.message || 'Validation failed'
      };
    }
  }

  /**
   * Use a subscription (record usage)
   */
  async useSubscription(
    request: UseSubscriptionRequest
  ): Promise<SubscriptionResponse<SubscriptionUsage>> {
    try {
      console.log('📦 Using subscription:', request.subscription_code);

      // Validate first
      const validation = await this.validateSubscription({
        subscription_code: request.subscription_code,
        organization_id: request.organization_id,
        item_name: request.item_name,
        item_category: request.item_category,
        item_price: request.item_price
      });

      if (!validation.is_valid) {
        throw new Error(validation.reason);
      }

      const subscription = validation.subscription!;
      const quantity = request.quantity || 1;

      // Record usage
      const usageData: CreateSubscriptionUsageRequest = {
        subscription_id: subscription.id,
        organization_id: request.organization_id,
        customer_id: subscription.customer_id,
        item_name: request.item_name,
        item_id: request.item_id,
        item_category: request.item_category,
        quantity,
        cashier_name: request.cashier_name,
        cashier_id: request.cashier_id,
        item_value: request.item_price ? request.item_price * quantity : undefined,
        notes: request.notes
      };

      const { data: usage, error: usageError } = await supabase
        .from('subscription_usages')
        .insert([usageData])
        .select()
        .single();

      if (usageError) throw usageError;

      // Update subscription counts
      const { error: updateError } = await supabase
        .from('customer_subscriptions')
        .update({
          usage_count: subscription.usage_count + quantity,
          daily_usage_count: subscription.daily_usage_count + quantity,
          weekly_usage_count: subscription.weekly_usage_count + quantity,
          last_usage_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', subscription.id);

      if (updateError) throw updateError;

      console.log('✅ Subscription used successfully');

      return {
        success: true,
        data: usage,
        message: 'Subscription used successfully'
      };
    } catch (error: any) {
      console.error('❌ Error using subscription:', error);
      return {
        success: false,
        error: error.message || 'Failed to use subscription'
      };
    }
  }

  // ============================================================================
  // SUBSCRIPTION RENEWALS
  // ============================================================================

  /**
   * Renew a subscription
   */
  async renewSubscription(
    subscriptionId: string,
    request: CreateSubscriptionRenewalRequest
  ): Promise<SubscriptionResponse<CustomerSubscription>> {
    try {
      console.log('🔄 Renewing subscription:', subscriptionId);

      // Get subscription and template
      const subscription = await this.getSubscription(subscriptionId);
      const template = subscription.template as SubscriptionTemplate;

      // Calculate new end date
      const currentEndDate = new Date(subscription.end_date);
      const newEndDate = this.calculateEndDate(
        currentEndDate,
        template.duration_type,
        template.duration_value
      );

      // Create renewal record
      const renewalData: CreateSubscriptionRenewalRequest = {
        ...request,
        subscription_id: subscriptionId
      };

      const { data: renewal, error: renewalError } = await supabase
        .from('subscription_renewals')
        .insert([{
          ...renewalData,
          previous_end_date: subscription.end_date,
          new_end_date: newEndDate.toISOString()
        }])
        .select()
        .single();

      if (renewalError) throw renewalError;

      // Update subscription
      const updateData = {
        end_date: newEndDate.toISOString(),
        next_renewal_date: template.auto_renewable ? newEndDate.toISOString() : null,
        renewal_count: subscription.renewal_count + 1,
        total_amount_paid: (subscription.total_amount_paid || 0) + request.amount_paid,
        status: 'active' as const
      };

      const { data: updatedSubscription, error: updateError } = await supabase
        .from('customer_subscriptions')
        .update(updateData)
        .eq('id', subscriptionId)
        .select(`
          *,
          template:subscription_templates(*),
          customer:customers(id, name, email, phone)
        `)
        .single();

      if (updateError) throw updateError;

      console.log('✅ Subscription renewed successfully');

      return {
        success: true,
        data: updatedSubscription,
        message: 'Subscription renewed successfully'
      };
    } catch (error: any) {
      console.error('❌ Error renewing subscription:', error);
      return {
        success: false,
        error: error.message || 'Failed to renew subscription'
      };
    }
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get subscription statistics for an organization
   */
  async getStats(organizationId: string): Promise<SubscriptionStats> {
    try {
      const { data, error } = await supabase.rpc('get_subscription_stats', {
        p_organization_id: organizationId
      });

      if (error) {
        console.warn('RPC function not available, calculating stats manually:', error);
        return this.calculateStatsManually(organizationId);
      }

      return data;
    } catch (error: any) {
      console.error('Error fetching subscription stats:', error);
      return this.calculateStatsManually(organizationId);
    }
  }

  /**
   * Calculate stats manually (fallback)
   */
  private async calculateStatsManually(organizationId: string): Promise<SubscriptionStats> {
    // Get all subscriptions
    const { data: subscriptions } = await supabase
      .from('customer_subscriptions')
      .select('*')
      .eq('organization_id', organizationId);

    const subs = subscriptions || [];

    // Calculate stats
    const total_active = subs.filter(s => s.status === 'active').length;
    const total_paused = subs.filter(s => s.status === 'paused').length;
    const total_expired = subs.filter(s => s.status === 'expired').length;
    const total_cancelled = subs.filter(s => s.status === 'cancelled').length;
    const total_revenue = subs.reduce((sum, s) => sum + (s.total_amount_paid || 0), 0);
    const total_usages = subs.reduce((sum, s) => sum + s.usage_count, 0);

    // Calculate expiring soon (within 7 days)
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const expiring_soon = subs.filter(s =>
      s.status === 'active' &&
      new Date(s.end_date) >= now &&
      new Date(s.end_date) <= sevenDaysFromNow
    ).length;

    return {
      total_active,
      total_paused,
      total_expired,
      total_cancelled,
      total_revenue,
      monthly_revenue: 0, // TODO: Calculate monthly
      total_usages,
      monthly_usages: 0, // TODO: Calculate monthly
      expiring_soon,
      avg_subscription_value: total_active > 0 ? total_revenue / total_active : 0,
      renewal_rate: 0 // TODO: Calculate renewal rate
    };
  }

  // ============================================================================
  // SETTINGS
  // ============================================================================

  /**
   * Get subscription settings for an organization
   */
  async getSettings(organizationId: string): Promise<SubscriptionSettings> {
    try {
      const { data, error } = await supabase
        .from('subscription_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default
          return this.createDefaultSettings(organizationId);
        }
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Error fetching subscription settings:', error);
      throw new Error(error.message || 'Failed to fetch subscription settings');
    }
  }

  /**
   * Update subscription settings
   */
  async updateSettings(
    request: UpdateSubscriptionSettingsRequest
  ): Promise<SubscriptionResponse<SubscriptionSettings>> {
    try {
      const { organization_id, ...updates } = request;

      const { data, error } = await supabase
        .from('subscription_settings')
        .update(updates)
        .eq('organization_id', organization_id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Settings updated successfully'
      };
    } catch (error: any) {
      console.error('Error updating subscription settings:', error);
      return {
        success: false,
        error: error.message || 'Failed to update settings'
      };
    }
  }

  /**
   * Create default settings for an organization
   */
  private async createDefaultSettings(organizationId: string): Promise<SubscriptionSettings> {
    const { data, error } = await supabase
      .from('subscription_settings')
      .insert([{ organization_id: organizationId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Calculate end date based on duration
   */
  private calculateEndDate(startDate: Date, durationType: string, durationValue: number): Date {
    const endDate = new Date(startDate);

    switch (durationType) {
      case 'days':
        endDate.setDate(endDate.getDate() + durationValue);
        break;
      case 'weeks':
        endDate.setDate(endDate.getDate() + (durationValue * 7));
        break;
      case 'months':
        endDate.setMonth(endDate.getMonth() + durationValue);
        break;
      case 'years':
        endDate.setFullYear(endDate.getFullYear() + durationValue);
        break;
    }

    return endDate;
  }

  /**
   * Check if subscription is valid (status, expiry, etc.)
   */
  private async checkSubscriptionValidity(
    subscription: CustomerSubscription
  ): Promise<{ is_valid: boolean; reason?: string }> {
    // Check status
    if (subscription.status !== 'active') {
      return {
        is_valid: false,
        reason: `Abbonamento ${subscription.status === 'paused' ? 'in pausa' : subscription.status}`
      };
    }

    // Check expiry
    const now = new Date();
    const endDate = new Date(subscription.end_date);
    if (endDate < now) {
      // Mark as expired
      await supabase
        .from('customer_subscriptions')
        .update({ status: 'expired' })
        .eq('id', subscription.id);

      return {
        is_valid: false,
        reason: `Abbonamento scaduto il ${endDate.toLocaleDateString('it-IT')}`
      };
    }

    return { is_valid: true };
  }

  /**
   * Check usage limits
   */
  private checkUsageLimits(
    subscription: CustomerSubscription,
    template: SubscriptionTemplate
  ): { is_valid: boolean; reason?: string } {
    // Check daily limit
    if (template.daily_limit && subscription.daily_usage_count >= template.daily_limit) {
      return {
        is_valid: false,
        reason: `Limite giornaliero raggiunto (${template.daily_limit} utilizzi al giorno)`
      };
    }

    // Check weekly limit
    if (template.weekly_limit && subscription.weekly_usage_count >= template.weekly_limit) {
      return {
        is_valid: false,
        reason: `Limite settimanale raggiunto (${template.weekly_limit} utilizzi a settimana)`
      };
    }

    // Check total limit
    if (template.total_limit && subscription.usage_count >= template.total_limit) {
      return {
        is_valid: false,
        reason: `Limite totale raggiunto (${template.total_limit} utilizzi)`
      };
    }

    return { is_valid: true };
  }

  /**
   * Check item/category restrictions
   */
  private checkItemRestrictions(
    template: SubscriptionTemplate,
    itemCategory?: string,
    itemPrice?: number
  ): { is_valid: boolean; reason?: string } {
    // Check if category is included
    if (template.included_categories && template.included_categories.length > 0) {
      if (!itemCategory || !template.included_categories.includes(itemCategory)) {
        return {
          is_valid: false,
          reason: `Categoria non inclusa nell'abbonamento`
        };
      }
    }

    // Check if category is excluded
    if (template.excluded_categories && template.excluded_categories.length > 0) {
      if (itemCategory && template.excluded_categories.includes(itemCategory)) {
        return {
          is_valid: false,
          reason: `Categoria esclusa dall'abbonamento`
        };
      }
    }

    // Check price limit
    if (template.max_price_per_item && itemPrice && itemPrice > template.max_price_per_item) {
      return {
        is_valid: false,
        reason: `Prezzo articolo (€${itemPrice}) supera il limite di €${template.max_price_per_item}`
      };
    }

    return { is_valid: true };
  }

  /**
   * Check time restrictions
   */
  private checkTimeRestrictions(
    template: SubscriptionTemplate
  ): { is_valid: boolean; reason?: string } {
    const now = new Date();

    // Check allowed hours
    if (template.allowed_hours) {
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      if (currentTime < template.allowed_hours.start || currentTime > template.allowed_hours.end) {
        return {
          is_valid: false,
          reason: `Abbonamento valido solo dalle ${template.allowed_hours.start} alle ${template.allowed_hours.end}`
        };
      }
    }

    // Check allowed days
    if (template.allowed_days && template.allowed_days.length > 0) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDay = dayNames[now.getDay()];
      if (!template.allowed_days.includes(currentDay as any)) {
        return {
          is_valid: false,
          reason: `Abbonamento non valido in questo giorno della settimana`
        };
      }
    }

    return { is_valid: true };
  }

  /**
   * Calculate remaining uses
   */
  private calculateRemainingUses(
    subscription: CustomerSubscription,
    template: SubscriptionTemplate
  ) {
    const remaining: any = {};

    if (template.daily_limit) {
      remaining.daily = Math.max(0, template.daily_limit - subscription.daily_usage_count);
    }

    if (template.weekly_limit) {
      remaining.weekly = Math.max(0, template.weekly_limit - subscription.weekly_usage_count);
    }

    if (template.total_limit) {
      remaining.total = Math.max(0, template.total_limit - subscription.usage_count);
    }

    return remaining;
  }

  /**
   * Reset daily usage count if new day
   */
  private async resetDailyUsageIfNeeded(subscription: CustomerSubscription) {
    const now = new Date();
    const lastReset = new Date(subscription.last_usage_reset_at);

    // Check if it's a new day
    if (now.toDateString() !== lastReset.toDateString()) {
      await supabase
        .from('customer_subscriptions')
        .update({
          daily_usage_count: 0,
          last_usage_reset_at: now.toISOString()
        })
        .eq('id', subscription.id);
    }
  }

  /**
   * Reset weekly usage count if new week
   */
  private async resetWeeklyUsageIfNeeded(subscription: CustomerSubscription) {
    const now = new Date();
    const lastReset = new Date(subscription.last_weekly_reset_at);

    // Calculate week difference
    const weekDiff = Math.floor((now.getTime() - lastReset.getTime()) / (7 * 24 * 60 * 60 * 1000));

    if (weekDiff >= 1) {
      await supabase
        .from('customer_subscriptions')
        .update({
          weekly_usage_count: 0,
          last_weekly_reset_at: now.toISOString()
        })
        .eq('id', subscription.id);
    }
  }
}

export const subscriptionsService = new SubscriptionsService();
export default subscriptionsService;
