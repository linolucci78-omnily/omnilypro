export interface IndustryTemplate {
    industry: string;
    name: string;
    colors: {
        primary: string;
        secondary: string;
    };
    pointsName: string;
    pointsPerEuro: string;
    rewardThreshold: string;
    welcomeBonus: string;
    productCategories: string[];
    bonusCategories: { category: string; multiplier: string }[];
    defaultRewards: {
        points: string;
        requiredTier: string;
        type: string;
        value: string;
        description: string;
    }[];
    loyaltyTiers: {
        name: string;
        threshold: string;
        multiplier: string;
        color: string;
        gradient: boolean;
        gradientEnd: string;
    }[];
    marketingCopy: {
        welcomeTitle: string;
        welcomeBody: string;
    };
}

export const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
    restaurant: {
        industry: 'restaurant',
        name: 'Ristorazione & Food',
        colors: {
            primary: '#ea580c', // Orange-600 (Warm/Appetizing)
            secondary: '#fcd34d', // Amber-300 (Gold/Cheese)
        },
        pointsName: 'Punti Gusto',
        pointsPerEuro: '1',
        rewardThreshold: '100',
        welcomeBonus: '20',
        productCategories: ['Pizze Classiche', 'Pizze Speciali', 'Bevande', 'Dessert', 'Caffetteria'],
        bonusCategories: [
            { category: 'Pizze Speciali', multiplier: '1.5' },
            { category: 'Dessert', multiplier: '2.0' }
        ],
        defaultRewards: [
            { points: '100', requiredTier: 'Iniziale', type: 'freeProduct', value: 'bibita', description: 'Bibita in Lattina Gratis' },
            { points: '250', requiredTier: 'Iniziale', type: 'freeProduct', value: 'pizza_margherita', description: 'Pizza Margherita Gratis' },
            { points: '500', requiredTier: 'Gourmet', type: 'discount', value: '20', description: 'Cena per 2 (Sconto 20€)' }
        ],
        loyaltyTiers: [
            { name: 'Buongustaio', threshold: '0', multiplier: '1', color: '#fb923c', gradient: false, gradientEnd: '#fb923c' },
            { name: 'Gourmet', threshold: '400', multiplier: '1.5', color: '#ea580c', gradient: true, gradientEnd: '#c2410c' },
            { name: 'Chef VIP', threshold: '1000', multiplier: '2', color: '#f59e0b', gradient: true, gradientEnd: '#b45309' }
        ],
        marketingCopy: {
            welcomeTitle: 'Benvenuto nel Club del Gusto! 🍕',
            welcomeBody: 'Grazie per esserti unito a noi! Hai subito 20 Punti Gusto in regalo. Raggiungi 250 punti per una pizza gratis!'
        }
    },

    retail: {
        industry: 'retail',
        name: 'Retail & Fashion',
        colors: {
            primary: '#0f172a', // Slate-900 (Elegant/Premium)
            secondary: '#38bdf8', // Sky-400 (Accent)
        },
        pointsName: 'Coins',
        pointsPerEuro: '1',
        rewardThreshold: '150',
        welcomeBonus: '50',
        productCategories: ['Nuova Collezione', 'Accessori', 'Outlet', 'Best Sellers'],
        bonusCategories: [
            { category: 'Accessori', multiplier: '1.5' },
            { category: 'Nuova Collezione', multiplier: '1.2' }
        ],
        defaultRewards: [
            { points: '150', requiredTier: 'Member', type: 'discount', value: '10', description: 'Voucher 10€' },
            { points: '300', requiredTier: 'Member', type: 'discount', value: '25', description: 'Voucher 25€' },
            { points: '1000', requiredTier: 'VIP', type: 'discount', value: '100', description: 'Shopping Vip (100€)' }
        ],
        loyaltyTiers: [
            { name: 'Member', threshold: '0', multiplier: '1', color: '#64748b', gradient: false, gradientEnd: '#64748b' },
            { name: 'Trendsetter', threshold: '500', multiplier: '1.5', color: '#0ea5e9', gradient: false, gradientEnd: '#0ea5e9' },
            { name: 'VIP Icon', threshold: '1500', multiplier: '2', color: '#4f46e5', gradient: true, gradientEnd: '#7c3aed' }
        ],
        marketingCopy: {
            welcomeTitle: 'Benvenuto nella Community di Stile ✨',
            welcomeBody: 'Il tuo stile viene premiato. Ecco 50 Coins per iniziare il tuo shopping con noi!'
        }
    },

    beauty: {
        industry: 'beauty',
        name: 'Beauty & Wellness',
        colors: {
            primary: '#db2777', // Pink-600 (Feminine/Strong)
            secondary: '#fbcfe8', // Pink-200 (Soft)
        },
        pointsName: 'Beauty Points',
        pointsPerEuro: '1',
        rewardThreshold: '200',
        welcomeBonus: '30',
        productCategories: ['Trattamenti Viso', 'Massaggi', 'Prodotti Cura', 'Manicure/Pedicure'],
        bonusCategories: [
            { category: 'Prodotti Cura', multiplier: '1.5' },
            { category: 'Massaggi', multiplier: '1.2' }
        ],
        defaultRewards: [
            { points: '200', requiredTier: 'Bronze', type: 'freeProduct', value: 'maschera', description: 'Maschera Viso Omagggio' },
            { points: '500', requiredTier: 'Silver', type: 'discount', value: '30', description: 'Sconto 30€ su Trattamento' },
            { points: '1000', requiredTier: 'Gold', type: 'freeProduct', value: 'massaggio_30', description: 'Massaggio 30min Gratuito' }
        ],
        loyaltyTiers: [
            { name: 'Bronze', threshold: '0', multiplier: '1', color: '#fda4af', gradient: false, gradientEnd: '#fda4af' },
            { name: 'Silver', threshold: '400', multiplier: '1.5', color: '#94a3b8', gradient: true, gradientEnd: '#e2e8f0' },
            { name: 'Gold', threshold: '1000', multiplier: '2', color: '#d97706', gradient: true, gradientEnd: '#fbbf24' }
        ],
        marketingCopy: {
            welcomeTitle: 'Benvenuta nel tuo momento di relax 🌸',
            welcomeBody: 'La tua bellezza merita un premio. Inizia con 30 Beauty Points in regalo per te!'
        }
    },

    grocery: {
        industry: 'grocery',
        name: 'Alimentari & Market',
        colors: {
            primary: '#16a34a', // Green-600 (Fresh)
            secondary: '#bef264', // Lime-300 (Natural)
        },
        pointsName: 'Punti Spesa',
        pointsPerEuro: '1',
        rewardThreshold: '500',
        welcomeBonus: '10',
        productCategories: ['Ortofrutta', 'Banco Frigo', 'Dispensa', 'Bevande', 'Casa'],
        bonusCategories: [
            { category: 'Ortofrutta', multiplier: '2.0' },
            { category: 'Dispensa', multiplier: '1.2' }
        ],
        defaultRewards: [
            { points: '500', requiredTier: 'Cliente', type: 'discount', value: '5', description: 'Buono Spesa 5€' },
            { points: '1000', requiredTier: 'Cliente', type: 'discount', value: '12', description: 'Buono Spesa 12€' },
            { points: '2500', requiredTier: 'Fedelissimo', type: 'discount', value: '35', description: 'Spesa Gratis (35€)' }
        ],
        loyaltyTiers: [
            { name: 'Cliente', threshold: '0', multiplier: '1', color: '#16a34a', gradient: false, gradientEnd: '#16a34a' },
            { name: 'Fedelissimo', threshold: '1500', multiplier: '1.2', color: '#15803d', gradient: true, gradientEnd: '#14532d' }
        ],
        marketingCopy: {
            welcomeTitle: 'La tua spesa vale di più! 🛒',
            welcomeBody: 'Benvenuto! Accumula punti su ogni spesa e risparmia. Ecco 10 punti per iniziare.'
        }
    },

    gym: {
        industry: 'gym',
        name: 'Fitness & Palestra',
        colors: {
            primary: '#000000', // Black
            secondary: '#84cc16', // Lime (Energy)
        },
        pointsName: 'Energy Pts',
        pointsPerEuro: '1',
        rewardThreshold: '300',
        welcomeBonus: '100',
        productCategories: ['Abbonamenti', 'Ingressi', 'Personal Training', 'Bar/Integratori', 'Merchandise'],
        bonusCategories: [
            { category: 'Personal Training', multiplier: '2.0' },
            { category: 'Bar/Integratori', multiplier: '1.5' }
        ],
        defaultRewards: [
            { points: '300', requiredTier: 'Starter', type: 'freeProduct', value: 'shake', description: 'Protein Shake Gratis' },
            { points: '800', requiredTier: 'Pro', type: 'discount', value: '25', description: 'Sconto mese successivo 25€' },
            { points: '2000', requiredTier: 'Elite', type: 'freeProduct', value: 'pt_session', description: '1h Personal Trainer Gratis' }
        ],
        loyaltyTiers: [
            { name: 'Starter', threshold: '0', multiplier: '1', color: '#525252', gradient: false, gradientEnd: '#525252' },
            { name: 'Pro', threshold: '1000', multiplier: '1.5', color: '#4d7c0f', gradient: true, gradientEnd: '#a3e635' },
            { name: 'Elite', threshold: '3000', multiplier: '2', color: '#000000', gradient: true, gradientEnd: '#d4d4d8' }
        ],
        marketingCopy: {
            welcomeTitle: 'Ready to Train? 💪',
            welcomeBody: 'Benvenuto nel team! Il tuo allenamento ora ti premia. 100 Energy Points caricati per te!'
        }
    }
}
