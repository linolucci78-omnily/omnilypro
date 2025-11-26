/**
 * Feature Flags Configuration
 * Controlla quali funzionalità sono abilitate nell'applicazione
 */

export const FEATURES = {
    // OMNY Wallet System (Crypto)
    OMNY_WALLET: import.meta.env.VITE_ENABLE_OMNY_WALLET === 'true',
    OMNY_EARN: import.meta.env.VITE_ENABLE_OMNY_EARN === 'true',
    OMNY_SPEND: import.meta.env.VITE_ENABLE_OMNY_SPEND === 'true',

    // Future features
    STRIPE_BILLING: import.meta.env.VITE_ENABLE_STRIPE_BILLING === 'true',
    ADVANCED_ANALYTICS: import.meta.env.VITE_ENABLE_ADVANCED_ANALYTICS === 'true'
} as const

export type FeatureFlag = keyof typeof FEATURES

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (feature: FeatureFlag): boolean => {
    return FEATURES[feature] || false
}

/**
 * Get all enabled features
 */
export const getEnabledFeatures = (): FeatureFlag[] => {
    return Object.entries(FEATURES)
        .filter(([_, enabled]) => enabled)
        .map(([feature]) => feature as FeatureFlag)
}
