/**
 * Referral Service - Advanced Referral System
 * Sistema referral professionale con livelli dinamici, gamification, e analytics
 */

import { supabase } from '../lib/supabase';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface ReferralTier {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  threshold: number;
  color: string;
  icon: string;
  badge_url?: string;
  points_per_referral: number;
  discount_percentage: number;
  special_perks: Array<{
    type: string;
    description: string;
    value?: number;
  }>;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReferralProgram {
  id: string;
  organization_id: string;
  customer_id: string;
  referral_code: string;
  total_referrals: number;
  successful_referrals: number;
  pending_referrals: number;
  conversion_rate: number;
  current_tier_id?: string;
  total_points_earned: number;
  total_rewards_claimed: number;
  shares_whatsapp: number;
  shares_email: number;
  shares_social: number;
  qr_code_scans: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_referral_at?: string;
  // Relations
  current_tier?: ReferralTier;
  customer?: any;
}

export interface ReferralConversion {
  id: string;
  organization_id: string;
  referrer_id: string;
  referee_id: string;
  referral_program_id: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'rewarded' | 'expired' | 'cancelled';
  points_awarded_referrer: number;
  points_awarded_referee: number;
  reward_type?: string;
  reward_value: number;
  reward_claimed: boolean;
  source?: string;
  device_type?: string;
  converted_at?: string;
  rewarded_at?: string;
  created_at: string;
  updated_at: string;
  // Relations
  referrer?: any;
  referee?: any;
}

export interface ReferralReward {
  id: string;
  organization_id: string;
  customer_id: string;
  conversion_id?: string;
  reward_type: string;
  reward_name: string;
  reward_description?: string;
  reward_value: number;
  status: 'pending' | 'available' | 'claimed' | 'expired' | 'cancelled';
  expires_at?: string;
  claimed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReferralAnalytics {
  id: string;
  organization_id: string;
  period_start: string;
  period_end: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  total_referrals: number;
  successful_conversions: number;
  conversion_rate: number;
  total_points_awarded: number;
  total_rewards_value: number;
  top_referrer_id?: string;
  top_referrer_count: number;
  whatsapp_conversions: number;
  email_conversions: number;
  social_conversions: number;
  qr_code_conversions: number;
  total_revenue_generated: number;
  cost_per_acquisition: number;
  roi_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface ReferralStats {
  total_programs: number;
  active_programs: number;
  total_conversions: number;
  conversion_rate: number;
  total_points_distributed: number;
  total_rewards_value: number;
  top_performers: Array<{
    customer: any;
    referrals: number;
    tier: ReferralTier;
  }>;
  recent_conversions: ReferralConversion[];
  channel_breakdown: {
    whatsapp: number;
    email: number;
    social: number;
    qr_code: number;
  };
}

// =====================================================
// REFERRAL TIERS SERVICE
// =====================================================

class ReferralTiersService {
  /**
   * Get all tiers for organization
   */
  async getAll(organizationId: string): Promise<ReferralTier[]> {
    const { data, error } = await supabase
      .from('referral_tiers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('threshold', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get tier by ID
   */
  async getById(tierId: string): Promise<ReferralTier | null> {
    const { data, error } = await supabase
      .from('referral_tiers')
      .select('*')
      .eq('id', tierId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create new tier
   */
  async create(tier: Partial<ReferralTier>): Promise<ReferralTier> {
    const { data, error } = await supabase
      .from('referral_tiers')
      .insert({
        organization_id: tier.organization_id,
        name: tier.name,
        description: tier.description,
        threshold: tier.threshold || 0,
        color: tier.color || '#ef4444',
        icon: tier.icon || 'star',
        badge_url: tier.badge_url,
        points_per_referral: tier.points_per_referral || 0,
        discount_percentage: tier.discount_percentage || 0,
        special_perks: tier.special_perks || [],
        position: tier.position || 0,
        is_active: tier.is_active !== false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update tier
   */
  async update(tierId: string, updates: Partial<ReferralTier>): Promise<ReferralTier> {
    const { data, error } = await supabase
      .from('referral_tiers')
      .update(updates)
      .eq('id', tierId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete tier
   */
  async delete(tierId: string): Promise<void> {
    const { error } = await supabase
      .from('referral_tiers')
      .delete()
      .eq('id', tierId);

    if (error) throw error;
  }

  /**
   * Get tier for referral count
   */
  async getTierForCount(organizationId: string, referralCount: number): Promise<ReferralTier | null> {
    const { data, error } = await supabase
      .from('referral_tiers')
      .select('*')
      .eq('organization_id', organizationId)
      .lte('threshold', referralCount)
      .eq('is_active', true)
      .order('threshold', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  }
}

// =====================================================
// REFERRAL PROGRAMS SERVICE
// =====================================================

class ReferralProgramsService {
  /**
   * Get all programs for organization
   */
  async getAll(organizationId: string): Promise<ReferralProgram[]> {
    const { data, error } = await supabase
      .from('referral_programs')
      .select(`
        *,
        current_tier:referral_tiers(*),
        customer:customers(*)
      `)
      .eq('organization_id', organizationId)
      .order('successful_referrals', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get program by customer
   */
  async getByCustomer(customerId: string): Promise<ReferralProgram | null> {
    const { data, error } = await supabase
      .from('referral_programs')
      .select(`
        *,
        current_tier:referral_tiers(*)
      `)
      .eq('customer_id', customerId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Get program by referral code
   */
  async getByCode(referralCode: string): Promise<ReferralProgram | null> {
    const { data, error } = await supabase
      .from('referral_programs')
      .select(`
        *,
        current_tier:referral_tiers(*),
        customer:customers(*)
      `)
      .eq('referral_code', referralCode.toUpperCase())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Create new referral program
   */
  async create(
    organizationId: string,
    customerId: string,
    customerName?: string
  ): Promise<ReferralProgram> {
    // Generate unique referral code
    const { data: codeData, error: codeError } = await supabase
      .rpc('generate_referral_code', {
        p_customer_name: customerName || 'USER',
        p_organization_id: organizationId,
      });

    if (codeError) throw codeError;

    const referralCode = codeData as string;

    // Create program
    const { data, error } = await supabase
      .from('referral_programs')
      .insert({
        organization_id: organizationId,
        customer_id: customerId,
        referral_code: referralCode,
        total_referrals: 0,
        successful_referrals: 0,
        pending_referrals: 0,
        conversion_rate: 0,
        total_points_earned: 0,
        total_rewards_claimed: 0,
        is_active: true,
      })
      .select(`
        *,
        current_tier:referral_tiers(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update program
   */
  async update(programId: string, updates: Partial<ReferralProgram>): Promise<ReferralProgram> {
    const { data, error } = await supabase
      .from('referral_programs')
      .update(updates)
      .eq('id', programId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Track share event
   */
  async trackShare(
    programId: string,
    channel: 'whatsapp' | 'email' | 'social' | 'qr_code'
  ): Promise<void> {
    const field = channel === 'qr_code' ? 'qr_code_scans' : `shares_${channel}`;

    const { error } = await supabase.rpc('increment', {
      table_name: 'referral_programs',
      row_id: programId,
      field_name: field,
    });

    if (error) {
      // Fallback if RPC doesn't exist
      const { data: program } = await supabase
        .from('referral_programs')
        .select(field)
        .eq('id', programId)
        .single();

      if (program) {
        await supabase
          .from('referral_programs')
          .update({ [field]: (program[field] || 0) + 1 })
          .eq('id', programId);
      }
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    organizationId: string,
    limit: number = 10
  ): Promise<ReferralProgram[]> {
    const { data, error } = await supabase
      .from('referral_programs')
      .select(`
        *,
        current_tier:referral_tiers(*),
        customer:customers(*)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('successful_referrals', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}

// =====================================================
// REFERRAL CONVERSIONS SERVICE
// =====================================================

class ReferralConversionsService {
  /**
   * Get all conversions for organization
   */
  async getAll(organizationId: string): Promise<ReferralConversion[]> {
    const { data, error } = await supabase
      .from('referral_conversions')
      .select(`
        *,
        referrer:referrer_id(id, name, email),
        referee:referee_id(id, name, email)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get conversions by referrer
   */
  async getByReferrer(referrerId: string): Promise<ReferralConversion[]> {
    const { data, error } = await supabase
      .from('referral_conversions')
      .select(`
        *,
        referee:referee_id(id, name, email)
      `)
      .eq('referrer_id', referrerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create conversion (when someone uses a referral code)
   */
  async create(conversion: {
    organization_id: string;
    referrer_id: string;
    referee_id: string;
    referral_program_id: string;
    referral_code: string;
    source?: string;
    device_type?: string;
  }): Promise<ReferralConversion> {
    const { data, error } = await supabase
      .from('referral_conversions')
      .insert({
        organization_id: conversion.organization_id,
        referrer_id: conversion.referrer_id,
        referee_id: conversion.referee_id,
        referral_program_id: conversion.referral_program_id,
        referral_code: conversion.referral_code,
        status: 'pending',
        source: conversion.source || 'direct',
        device_type: conversion.device_type || 'unknown',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Complete conversion (mark as successful)
   */
  async complete(
    conversionId: string,
    rewards: {
      points_referrer: number;
      points_referee: number;
      reward_type?: string;
      reward_value?: number;
    }
  ): Promise<ReferralConversion> {
    const { data, error } = await supabase
      .from('referral_conversions')
      .update({
        status: 'completed',
        points_awarded_referrer: rewards.points_referrer,
        points_awarded_referee: rewards.points_referee,
        reward_type: rewards.reward_type,
        reward_value: rewards.reward_value || 0,
        converted_at: new Date().toISOString(),
      })
      .eq('id', conversionId)
      .select()
      .single();

    if (error) throw error;

    // Award points to customers
    if (data) {
      // Award to referrer
      await supabase.rpc('add_customer_points', {
        p_customer_id: data.referrer_id,
        p_points: rewards.points_referrer,
        p_description: `Referral completato`,
      });

      // Award to referee
      await supabase.rpc('add_customer_points', {
        p_customer_id: data.referee_id,
        p_points: rewards.points_referee,
        p_description: `Benvenuto via referral`,
      });
    }

    return data;
  }

  /**
   * Mark rewards as claimed
   */
  async markRewarded(conversionId: string): Promise<ReferralConversion> {
    const { data, error } = await supabase
      .from('referral_conversions')
      .update({
        status: 'rewarded',
        reward_claimed: true,
        rewarded_at: new Date().toISOString(),
      })
      .eq('id', conversionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// =====================================================
// REFERRAL ANALYTICS SERVICE
// =====================================================

class ReferralAnalyticsService {
  /**
   * Get real-time stats for organization
   */
  async getStats(organizationId: string): Promise<ReferralStats> {
    // Get programs count
    const { data: programs } = await supabase
      .from('referral_programs')
      .select('*')
      .eq('organization_id', organizationId);

    const activePrograms = programs?.filter((p) => p.is_active) || [];

    // Get conversions
    const { data: conversions } = await supabase
      .from('referral_conversions')
      .select('*')
      .eq('organization_id', organizationId);

    const completedConversions = conversions?.filter((c) => c.status === 'completed') || [];

    // Calculate stats
    const totalPrograms = programs?.length || 0;
    const totalConversions = conversions?.length || 0;
    const conversionRate =
      totalConversions > 0 ? (completedConversions.length / totalConversions) * 100 : 0;

    const totalPointsDistributed = completedConversions.reduce(
      (sum, c) => sum + c.points_awarded_referrer + c.points_awarded_referee,
      0
    );

    const totalRewardsValue = completedConversions.reduce(
      (sum, c) => sum + (c.reward_value || 0),
      0
    );

    // Top performers
    const topPerformers = activePrograms
      .sort((a, b) => b.successful_referrals - a.successful_referrals)
      .slice(0, 5)
      .map((p) => ({
        customer: p.customer,
        referrals: p.successful_referrals,
        tier: p.current_tier,
      }));

    // Recent conversions
    const recentConversions = (conversions || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    // Channel breakdown
    const channelBreakdown = {
      whatsapp: completedConversions.filter((c) => c.source === 'whatsapp').length,
      email: completedConversions.filter((c) => c.source === 'email').length,
      social: completedConversions.filter((c) => c.source === 'social').length,
      qr_code: completedConversions.filter((c) => c.source === 'qr_code').length,
    };

    return {
      total_programs: totalPrograms,
      active_programs: activePrograms.length,
      total_conversions: totalConversions,
      conversion_rate: conversionRate,
      total_points_distributed: totalPointsDistributed,
      total_rewards_value: totalRewardsValue,
      top_performers: topPerformers,
      recent_conversions: recentConversions,
      channel_breakdown: channelBreakdown,
    };
  }

  /**
   * Get analytics for period
   */
  async getPeriodAnalytics(
    organizationId: string,
    periodType: 'daily' | 'weekly' | 'monthly' | 'yearly',
    startDate: Date,
    endDate: Date
  ): Promise<ReferralAnalytics[]> {
    const { data, error } = await supabase
      .from('referral_analytics')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('period_type', periodType)
      .gte('period_start', startDate.toISOString())
      .lte('period_end', endDate.toISOString())
      .order('period_start', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Generate shareable referral link
 */
export function generateReferralLink(
  referralCode: string,
  baseUrl: string = window.location.origin
): string {
  return `${baseUrl}/register?ref=${referralCode}`;
}

/**
 * Generate WhatsApp share URL
 */
export function generateWhatsAppShareUrl(referralCode: string, message?: string): string {
  const defaultMessage = `Unisciti a me! Usa il mio codice referral: ${referralCode}`;
  const text = encodeURIComponent(message || defaultMessage);
  const link = encodeURIComponent(generateReferralLink(referralCode));
  return `https://wa.me/?text=${text}%20${link}`;
}

/**
 * Generate Email share URL
 */
export function generateEmailShareUrl(
  referralCode: string,
  subject?: string,
  body?: string
): string {
  const defaultSubject = 'Ti invito a unirti!';
  const defaultBody = `Usa il mio codice referral: ${referralCode}\n\nRegistrati qui: ${generateReferralLink(referralCode)}`;

  return `mailto:?subject=${encodeURIComponent(subject || defaultSubject)}&body=${encodeURIComponent(body || defaultBody)}`;
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

// =====================================================
// EXPORTS
// =====================================================

export const referralTiersService = new ReferralTiersService();
export const referralProgramsService = new ReferralProgramsService();
export const referralConversionsService = new ReferralConversionsService();
export const referralAnalyticsService = new ReferralAnalyticsService();

export default {
  tiers: referralTiersService,
  programs: referralProgramsService,
  conversions: referralConversionsService,
  analytics: referralAnalyticsService,
  utils: {
    generateReferralLink,
    generateWhatsAppShareUrl,
    generateEmailShareUrl,
    copyToClipboard,
  },
};
