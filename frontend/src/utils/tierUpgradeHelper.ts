import { sendTierUpgradeEmail } from '../services/emailAutomationService';
import { supabase } from '../lib/supabase';

/**
 * Helper per gestire il cambio tier del cliente
 * - Rileva se il tier è cambiato
 * - Invia email di congratulazioni automatiche
 * - Salva notifica pending per mostrare modale celebrativo
 */

export interface TierUpgradeNotification {
  customerId: string;
  customerName: string;
  customerEmail: string;
  oldTierName: string;
  newTierName: string;
  newTierColor: string;
  timestamp: number;
}

const TIER_UPGRADES_KEY = 'omnily_tier_upgrades_pending';

/**
 * Controlla se il tier è cambiato e gestisce la notifica
 */
export async function handleTierChange(params: {
  customerId: string;
  customerName: string;
  customerEmail: string;
  organizationId: string;
  organizationName: string;
  oldPoints: number;
  newPoints: number;
  loyaltyTiers: any[];
  pointsName?: string;
}): Promise<{ tierChanged: boolean; oldTier?: any; newTier?: any }> {

  const {
    customerId,
    customerName,
    customerEmail,
    organizationId,
    organizationName,
    oldPoints,
    newPoints,
    loyaltyTiers,
    pointsName = 'Punti'
  } = params;

  // Calcola tier vecchio e nuovo
  const oldTier = calculateTier(oldPoints, loyaltyTiers);
  const newTier = calculateTier(newPoints, loyaltyTiers);

  console.log(`🎯 Controllo cambio tier: ${oldTier.name} -> ${newTier.name}`);

  // Se il tier NON è cambiato, esci
  if (oldTier.name === newTier.name) {
    console.log(`✅ Tier unchanged: ${oldTier.name}`);
    return { tierChanged: false };
  }

  // ✨ NUOVO: Rileva se è upgrade o downgrade confrontando threshold
  const isUpgrade = (newTier.threshold || 0) > (oldTier.threshold || 0);
  const tierChangeType = isUpgrade ? 'UPGRADE' : 'DOWNGRADE';
  const emoji = isUpgrade ? '🎊' : '📉';

  console.log(`${emoji} TIER ${tierChangeType} DETECTED! ${oldTier.name} -> ${newTier.name}`);

  // Se è un DOWNGRADE (perdita livello), NON inviare email celebrative
  if (!isUpgrade) {
    console.log(`⚠️ Tier downgrade detected - skipping celebration email and notifications`);

    // Aggiorna solo il tier nel database senza celebrazioni
    try {
      console.log(`💾 Updating tier in database (downgrade): ${newTier.name}`);
      await supabase
        .from('customers')
        .update({
          tier: newTier.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);

      console.log(`✅ Customer tier updated (downgrade): ${oldTier.name} -> ${newTier.name}`);
    } catch (error) {
      console.error('⚠️ Error updating tier:', error);
    }

    return { tierChanged: true, oldTier, newTier };
  }

  // 1. Ottieni total_spent del cliente per l'email
  let totalSpent = 0;
  try {
    const { data: customerData } = await supabase
      .from('customers')
      .select('total_spent')
      .eq('id', customerId)
      .single();

    totalSpent = customerData?.total_spent || 0;
  } catch (error) {
    console.error('⚠️ Error fetching customer total_spent:', error);
  }

  // 2. Genera icone emoji per i tier
  const getTierIcon = (tierName: string): string => {
    const tier = tierName.toLowerCase();
    if (tier.includes('platinum') || tier.includes('diamond')) return '👑';
    if (tier.includes('gold')) return '⭐';
    if (tier.includes('silver')) return '✨';
    return '🥉';
  };

  // 3. Invia email di congratulazioni automatica (SOLO per upgrade)
  try {
    console.log(`📧 Sending automated tier upgrade email to ${customerEmail}...`);

    await sendTierUpgradeEmail(
      organizationId,
      {
        email: customerEmail,
        name: customerName,
        points: newPoints
      },
      {
        oldTier: oldTier.name,
        oldTierIcon: getTierIcon(oldTier.name),
        newTier: newTier.name,
        newTierIcon: getTierIcon(newTier.name),
        newTierColor: newTier.color,
        multiplier: newTier.multiplier,
        totalSpent: totalSpent
      },
      organizationName
    );

    console.log(`✅ Automated tier upgrade email sent successfully!`);
  } catch (error) {
    // Non-blocking error - don't fail tier upgrade if email fails
    console.error(`⚠️ Error sending tier upgrade email (non-blocking):`, error);
  }

  // 4. AGGIORNA IL CAMPO TIER NEL DATABASE
  try {
    console.log(`💾 Updating tier in database: ${newTier.name}`);

    const { error: updateError } = await supabase
      .from('customers')
      .update({
        tier: newTier.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId);

    if (updateError) {
      console.error('⚠️ Error updating customer tier in database:', updateError);
    } else {
      console.log(`✅ Customer tier updated in database: ${newTier.name}`);
    }
  } catch (error) {
    console.error('⚠️ Error updating tier (non-blocking):', error);
  }

  // 5. Salva notifica nel DATABASE (SOLO per upgrade - celebrazione)
  try {
    console.log(`💾 Saving tier upgrade notification to database for ${customerName}...`);

    const { error: notificationError } = await supabase
      .from('customer_notifications')
      .insert({
        customer_id: customerId,
        organization_id: organizationId,
        category: 'tier_upgrade',
        title: `🎊 Congratulazioni! Sei ${newTier.name}!`,
        message: `Sei passato da ${oldTier.name} a ${newTier.name}! Continua così!`,
        is_read: false,
        metadata: {
          oldTierName: oldTier.name,
          newTierName: newTier.name,
          newTierColor: newTier.color,
          multiplier: newTier.multiplier
        },
        animation_type: 'tier_upgrade',
        created_at: new Date().toISOString()
      });

    if (notificationError) {
      console.error('⚠️ Error saving tier upgrade notification:', notificationError);
    } else {
      console.log(`✅ Tier upgrade notification saved to database for ${customerName}`);
    }
  } catch (error) {
    console.error('⚠️ Error saving notification (non-blocking):', error);
  }

  return { tierChanged: true, oldTier, newTier };
}

/**
 * Calcola il tier in base ai punti
 */
function calculateTier(points: number, loyaltyTiers: any[]): any {
  if (!loyaltyTiers || loyaltyTiers.length === 0) {
    // Fallback ai tiers fissi se non configurati
    if (points >= 1000) return { name: 'Platinum', multiplier: 2, color: '#e5e7eb' };
    if (points >= 500) return { name: 'Gold', multiplier: 1.5, color: '#f59e0b' };
    if (points >= 200) return { name: 'Silver', multiplier: 1.2, color: '#64748b' };
    return { name: 'Bronze', multiplier: 1, color: '#a3a3a3' };
  }

  // Ordina tiers per soglia decrescente per trovare il tier corretto
  const sortedTiers = [...loyaltyTiers].sort((a, b) => parseFloat(b.threshold) - parseFloat(a.threshold));

  for (const tier of sortedTiers) {
    if (points >= parseFloat(tier.threshold)) {
      return {
        name: tier.name,
        multiplier: parseFloat(tier.multiplier) || 1,
        color: tier.color || '#64748b',
        threshold: parseFloat(tier.threshold)
      };
    }
  }

  // Se non trova nessun tier, usa il primo (più basso)
  const firstTier = loyaltyTiers[0];
  return {
    name: firstTier.name,
    multiplier: parseFloat(firstTier.multiplier) || 1,
    color: firstTier.color || '#64748b',
    threshold: parseFloat(firstTier.threshold)
  };
}

/**
 * Ottieni notifica tier upgrade per un cliente specifico dal DATABASE
 */
export async function getPendingTierUpgradeForCustomer(customerId: string): Promise<TierUpgradeNotification | null> {
  try {
    const { data, error } = await supabase
      .from('customer_notifications')
      .select('*')
      .eq('customer_id', customerId)
      .eq('category', 'tier_upgrade')
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - normal case
        return null;
      }
      console.error('Error fetching tier upgrade notification:', error);
      return null;
    }

    if (!data) return null;

    // Converti dal formato database al formato TierUpgradeNotification
    return {
      customerId: data.customer_id,
      customerName: data.metadata?.newTierName || '',
      customerEmail: '',
      oldTierName: data.metadata?.oldTierName || '',
      newTierName: data.metadata?.newTierName || '',
      newTierColor: data.metadata?.newTierColor || '#64748b',
      timestamp: new Date(data.created_at).getTime()
    };
  } catch (error) {
    console.error('Error getting tier upgrade notification:', error);
    return null;
  }
}

/**
 * Segna notifica tier upgrade come letta nel DATABASE
 */
export async function clearTierUpgradeNotification(customerId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('customer_notifications')
      .update({ is_read: true })
      .eq('customer_id', customerId)
      .eq('category', 'tier_upgrade')
      .eq('is_read', false);

    if (error) {
      console.error('⚠️ Error clearing tier upgrade notification:', error);
    } else {
      console.log(`🗑️ Tier upgrade notification marked as read for customer ${customerId}`);
    }
  } catch (error) {
    console.error('Error clearing tier upgrade notification:', error);
  }
}

/**
 * Pulisci notifiche più vecchie di 7 giorni (cleanup automatico)
 */
export async function cleanupOldTierUpgrades(): Promise<void> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { error } = await supabase
      .from('customer_notifications')
      .delete()
      .eq('category', 'tier_upgrade')
      .eq('is_read', true)
      .lt('created_at', sevenDaysAgo.toISOString());

    if (error) {
      console.error('⚠️ Error cleaning up old tier upgrades:', error);
    } else {
      console.log(`🗑️ Cleaned up old tier upgrade notifications (older than 7 days)`);
    }
  } catch (error) {
    console.error('Error cleaning up tier upgrades:', error);
  }
}
