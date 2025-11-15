/**
 * OMNILYPRO GAMING MODULE - Components Export
 */

// Main Hub Components
export { default as GamingHub } from './GamingHub'
export { default as GamingHubWrapper } from './GamingHubWrapper'

// Badge System
export { default as BadgeGallery } from './BadgeGallery'
export { default as BadgeUnlockNotification } from './BadgeUnlockNotification'

// Challenges System
export { default as ChallengesHub } from './ChallengesHub'

// Spin Wheel System
export { default as SpinWheel } from './SpinWheel'

// Slot Machine System
export { default as SlotMachine } from './SlotMachine'

// Re-export types
export type {
  Badge,
  CustomerBadge,
  BadgeCategory,
  BadgeRarity,
  BadgeUnlockRule,
  BadgeRewards,
  Challenge,
  CustomerChallenge,
  WheelConfig,
  SpinPrize
} from '../../services/gaming/types'

// Re-export services
export { badgeService } from '../../services/gaming/badgeService'
export { challengeService } from '../../services/gaming/challengeService'
export { spinService } from '../../services/gaming/spinService'
export { slotMachineService } from '../../services/gaming/slotMachineService'
export { gamingSetupService } from '../../services/gaming/gamingSetupService'
