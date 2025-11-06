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

  console.log(`🎊 TIER UPGRADE DETECTED! ${oldTier.name} -> ${newTier.name}`);

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

  // 3. Invia email di congratulazioni automatica (non-blocking)
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

  // 4. Salva notifica pending per mostrare modale celebrativo
  saveTierUpgradeNotification({
    customerId,
    customerName,
    customerEmail,
    oldTierName: oldTier.name,
    newTierName: newTier.name,
    newTierColor: newTier.color,
    timestamp: Date.now()
  });

  console.log(`💾 Tier upgrade notification saved for ${customerName}`);

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
 * Salva una notifica tier upgrade pending
 */
function saveTierUpgradeNotification(notification: TierUpgradeNotification): void {
  try {
    const existing = getPendingTierUpgrades();
    const updated = [...existing, notification];
    localStorage.setItem(TIER_UPGRADES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving tier upgrade notification:', error);
  }
}

/**
 * Ottieni tutte le notifiche tier upgrade pending
 */
export function getPendingTierUpgrades(): TierUpgradeNotification[] {
  try {
    const stored = localStorage.getItem(TIER_UPGRADES_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error getting tier upgrade notifications:', error);
    return [];
  }
}

/**
 * Ottieni notifica tier upgrade per un cliente specifico
 */
export function getPendingTierUpgradeForCustomer(customerId: string): TierUpgradeNotification | null {
  const all = getPendingTierUpgrades();
  return all.find(n => n.customerId === customerId) || null;
}

/**
 * Rimuovi notifica tier upgrade dopo averla mostrata
 */
export function clearTierUpgradeNotification(customerId: string): void {
  try {
    const all = getPendingTierUpgrades();
    const filtered = all.filter(n => n.customerId !== customerId);
    localStorage.setItem(TIER_UPGRADES_KEY, JSON.stringify(filtered));
    console.log(`🗑️ Tier upgrade notification cleared for customer ${customerId}`);
  } catch (error) {
    console.error('Error clearing tier upgrade notification:', error);
  }
}

/**
 * Pulisci tutte le notifiche più vecchie di 24 ore (cleanup automatico)
 */
export function cleanupOldTierUpgrades(): void {
  try {
    const all = getPendingTierUpgrades();
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recent = all.filter(n => n.timestamp > oneDayAgo);
    localStorage.setItem(TIER_UPGRADES_KEY, JSON.stringify(recent));
    const removed = all.length - recent.length;
    if (removed > 0) {
      console.log(`🗑️ Cleaned up ${removed} old tier upgrade notifications`);
    }
  } catch (error) {
    console.error('Error cleaning up tier upgrades:', error);
  }
}
