/**
 * Subscription Features Service
 * Gestisce le feature abilitate per ogni organizzazione in base al piano
 */

import { supabase } from '../lib/supabase';

// =====================================================
// TYPES
// =====================================================

export type PlanType = 'free' | 'starter' | 'pro' | 'enterprise';

export interface SubscriptionFeatures {
  id: string;
  organization_id: string;
  tier_system_enabled: boolean;
  max_tiers_allowed: number;
  tier_emails_enabled: boolean;
  tier_analytics_enabled: boolean;
  plan_type: PlanType;
  created_at: string;
  updated_at: string;
}

export interface UpdateSubscriptionFeaturesRequest {
  organization_id: string;
  tier_system_enabled?: boolean;
  max_tiers_allowed?: number;
  tier_emails_enabled?: boolean;
  tier_analytics_enabled?: boolean;
  plan_type?: PlanType;
}

export interface SubscriptionFeaturesResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// =====================================================
// LIMITI PER PIANO
// =====================================================

export const PLAN_LIMITS = {
  free: {
    tier_system_enabled: false,
    max_tiers_allowed: 0,
    tier_emails_enabled: false,
    tier_analytics_enabled: false,
    name: 'Free',
    description: 'Piano gratuito base'
  },
  starter: {
    tier_system_enabled: true,
    max_tiers_allowed: 3,
    tier_emails_enabled: false,
    tier_analytics_enabled: false,
    name: 'Starter',
    description: 'Piano starter con tier limitati'
  },
  pro: {
    tier_system_enabled: true,
    max_tiers_allowed: 5,
    tier_emails_enabled: true,
    tier_analytics_enabled: false,
    name: 'Pro',
    description: 'Piano professionale completo'
  },
  enterprise: {
    tier_system_enabled: true,
    max_tiers_allowed: 0, // 0 = illimitati
    tier_emails_enabled: true,
    tier_analytics_enabled: true,
    name: 'Enterprise',
    description: 'Piano enterprise con tutto incluso'
  }
};

// =====================================================
// SERVICE CLASS
// =====================================================

class SubscriptionFeaturesService {
  /**
   * Ottieni le feature di subscription per un'organizzazione
   */
  async getFeatures(organizationId: string): Promise<SubscriptionFeatures | null> {
    try {
      console.log('[SubscriptionFeatures] Fetching features for organization:', organizationId);

      const { data, error } = await supabase
        .from('subscription_features')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        // Se non esiste, crea con valori di default
        if (error.code === 'PGRST116') {
          console.log('[SubscriptionFeatures] No features found, creating default configuration');
          return await this.createDefaultFeatures(organizationId);
        }
        throw error;
      }

      console.log('[SubscriptionFeatures] Features loaded successfully');
      return data;
    } catch (error: any) {
      console.error('[SubscriptionFeatures] Error fetching features:', error);
      return null;
    }
  }

  /**
   * Crea feature di default per un'organizzazione
   */
  private async createDefaultFeatures(organizationId: string): Promise<SubscriptionFeatures | null> {
    try {
      console.log('[SubscriptionFeatures] Creating default configuration for organization:', organizationId);

      const defaultFeatures = {
        organization_id: organizationId,
        tier_system_enabled: true,
        max_tiers_allowed: 5,
        tier_emails_enabled: true,
        tier_analytics_enabled: false,
        plan_type: 'free' as PlanType
      };

      const { data, error } = await supabase
        .from('subscription_features')
        .insert([defaultFeatures])
        .select()
        .single();

      if (error) throw error;

      console.log('[SubscriptionFeatures] Default configuration created successfully');
      return data;
    } catch (error: any) {
      console.error('[SubscriptionFeatures] Error creating default features:', error);
      return null;
    }
  }

  /**
   * Aggiorna le feature di subscription per un'organizzazione
   */
  async updateFeatures(
    request: UpdateSubscriptionFeaturesRequest
  ): Promise<SubscriptionFeaturesResponse<SubscriptionFeatures>> {
    try {
      const { organization_id, ...updates } = request;

      console.log('[SubscriptionFeatures] Updating features for organization:', organization_id);

      // Usa UPSERT per creare se non esiste, aggiornare se esiste
      const { data, error } = await supabase
        .from('subscription_features')
        .upsert({
          organization_id,
          ...updates
        }, {
          onConflict: 'organization_id'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('[SubscriptionFeatures] Features updated successfully');

      return {
        success: true,
        data,
        message: 'Feature aggiornate con successo'
      };
    } catch (error: any) {
      console.error('[SubscriptionFeatures] Error updating features:', error);
      return {
        success: false,
        error: error.message || 'Errore aggiornamento feature'
      };
    }
  }

  /**
   * Verifica se una feature è disponibile per l'organizzazione
   */
  async canUseFeature(organizationId: string, feature: keyof SubscriptionFeatures): Promise<boolean> {
    try {
      const features = await this.getFeatures(organizationId);
      if (!features) return false;

      return features[feature] as boolean;
    } catch (error) {
      console.error('Error checking feature availability:', error);
      return false;
    }
  }

  /**
   * Verifica se l'organizzazione può creare più tier
   */
  async canCreateMoreTiers(organizationId: string, currentTierCount: number): Promise<{
    canCreate: boolean;
    reason?: string;
    maxAllowed?: number;
  }> {
    try {
      const features = await this.getFeatures(organizationId);

      if (!features) {
        return {
          canCreate: false,
          reason: 'Feature di subscription non trovate'
        };
      }

      // Se tier system non è abilitato
      if (!features.tier_system_enabled) {
        return {
          canCreate: false,
          reason: 'Sistema tier non abilitato per questo piano',
          maxAllowed: 0
        };
      }

      // Se max_tiers_allowed è 0, significa illimitati
      if (features.max_tiers_allowed === 0) {
        return { canCreate: true };
      }

      // Controlla se ha raggiunto il limite
      if (currentTierCount >= features.max_tiers_allowed) {
        return {
          canCreate: false,
          reason: `Limite massimo di ${features.max_tiers_allowed} tier raggiunto. Upgrade per più tier.`,
          maxAllowed: features.max_tiers_allowed
        };
      }

      return {
        canCreate: true,
        maxAllowed: features.max_tiers_allowed
      };
    } catch (error) {
      console.error('Error checking tier creation limit:', error);
      return {
        canCreate: false,
        reason: 'Errore verifica limite tier'
      };
    }
  }

  /**
   * Ottieni informazioni sul piano corrente
   */
  getPlanInfo(planType: PlanType) {
    return PLAN_LIMITS[planType];
  }

  /**
   * Ottieni tutti i piani disponibili
   */
  getAllPlans() {
    return Object.entries(PLAN_LIMITS).map(([key, value]) => ({
      type: key as PlanType,
      ...value
    }));
  }

  /**
   * Aggiorna il piano di un'organizzazione (solo per admin)
   */
  async updatePlan(
    organizationId: string,
    newPlan: PlanType
  ): Promise<SubscriptionFeaturesResponse<SubscriptionFeatures>> {
    try {
      console.log(`[SubscriptionFeatures] Updating plan for organization ${organizationId} to ${newPlan}`);

      const planLimits = PLAN_LIMITS[newPlan];

      return await this.updateFeatures({
        organization_id: organizationId,
        plan_type: newPlan,
        tier_system_enabled: planLimits.tier_system_enabled,
        max_tiers_allowed: planLimits.max_tiers_allowed,
        tier_emails_enabled: planLimits.tier_emails_enabled,
        tier_analytics_enabled: planLimits.tier_analytics_enabled
      });
    } catch (error: any) {
      console.error('[SubscriptionFeatures] Error updating plan:', error);
      return {
        success: false,
        error: error.message || 'Errore aggiornamento piano'
      };
    }
  }
}

// =====================================================
// EXPORT SINGLETON
// =====================================================

export const subscriptionFeaturesService = new SubscriptionFeaturesService();
export default subscriptionFeaturesService;
