-- Seed initial OMNILYPRO plans with features and limits

-- Insert Basic Plan
INSERT INTO omnilypro_plans (
  name,
  slug,
  description,
  price_monthly,
  price_yearly,
  setup_fee,
  currency,
  color,
  is_popular,
  is_featured,
  is_active,
  visibility,
  sort_order,
  features,
  limits
) VALUES (
  'Basic',
  'basic',
  'Piano ideale per iniziare con le funzionalità essenziali',
  29,
  290,
  0,
  'EUR',
  '#3b82f6',
  false,
  false,
  true,
  'public',
  1,
  '{"posEnabled": false, "loyaltyPrograms": true, "emailMarketing": false, "smsMarketing": false, "whatsappMarketing": false, "campaigns": false, "emailAutomations": false, "coupons": false, "giftCards": false, "giftCertificates": false, "subscriptions": false, "referralProgram": false, "gamingLottery": false, "slotMachine": false, "scratchCards": false, "nfcCards": false, "advancedAnalytics": false, "automations": false, "publicWebsite": false, "websiteBuilder": false, "mobileApp": false, "multiLocation": false, "teamManagement": false, "categoriesManagement": false, "channelsManagement": false, "inventoryManagement": false, "customBranding": false, "customDomain": false, "apiAccess": false, "webhooks": false, "prioritySupport": false, "dedicatedAccountManager": false, "supportTickets": false, "contactMessages": false}'::jsonb,
  '{"maxCustomers": 500, "maxTeamMembers": 2, "maxLocations": 1, "maxEmailsPerMonth": 0, "maxSMSPerMonth": 0, "maxWhatsAppPerMonth": 0, "maxCampaigns": 0, "maxEmailAutomations": 0, "maxActiveCoupons": 0, "maxActiveGiftCards": 0, "maxActiveGiftCertificates": 0, "maxSubscriptionPlans": 0, "maxReferralRewards": 0, "maxLotteryDrawsPerMonth": 0, "maxSlotMachineSpins": 0, "maxScratchCardsPerMonth": 0, "maxNFCCards": 0, "maxVirtualCards": 0, "maxAutomations": 0, "maxWorkflows": 0, "maxWebhooks": 0, "maxLoyaltyPrograms": 1, "maxNotifications": 1000, "maxCategories": 5, "maxProductsPerCategory": 50, "maxStorageGB": 1, "maxAPICallsPerDay": 0, "maxReportsPerMonth": 5}'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  updated_at = NOW();

-- Insert Professional Plan
INSERT INTO omnilypro_plans (
  name,
  slug,
  description,
  price_monthly,
  price_yearly,
  setup_fee,
  currency,
  color,
  badge_text,
  is_popular,
  is_featured,
  is_active,
  visibility,
  sort_order,
  features,
  limits
) VALUES (
  'Professional',
  'professional',
  'Tutte le funzionalità per far crescere il tuo business',
  99,
  990,
  0,
  'EUR',
  '#8b5cf6',
  'Più Popolare',
  true,
  true,
  true,
  'public',
  2,
  '{"posEnabled": true, "loyaltyPrograms": true, "emailMarketing": true, "smsMarketing": true, "whatsappMarketing": false, "campaigns": true, "emailAutomations": true, "coupons": true, "giftCards": true, "giftCertificates": true, "subscriptions": true, "referralProgram": true, "gamingLottery": true, "slotMachine": true, "scratchCards": true, "nfcCards": true, "advancedAnalytics": true, "automations": true, "publicWebsite": true, "websiteBuilder": true, "mobileApp": false, "multiLocation": true, "teamManagement": true, "categoriesManagement": true, "channelsManagement": true, "inventoryManagement": true, "customBranding": true, "customDomain": false, "apiAccess": true, "webhooks": true, "prioritySupport": false, "dedicatedAccountManager": false, "supportTickets": true, "contactMessages": true}'::jsonb,
  '{"maxCustomers": 5000, "maxTeamMembers": 10, "maxLocations": 3, "maxEmailsPerMonth": 10000, "maxSMSPerMonth": 5000, "maxWhatsAppPerMonth": 0, "maxCampaigns": 20, "maxEmailAutomations": 10, "maxActiveCoupons": 50, "maxActiveGiftCards": 100, "maxActiveGiftCertificates": 100, "maxSubscriptionPlans": 10, "maxReferralRewards": 20, "maxLotteryDrawsPerMonth": 10, "maxSlotMachineSpins": 5000, "maxScratchCardsPerMonth": 1000, "maxNFCCards": 500, "maxVirtualCards": 1000, "maxAutomations": 20, "maxWorkflows": 50, "maxWebhooks": 10, "maxLoyaltyPrograms": 5, "maxNotifications": 50000, "maxCategories": 50, "maxProductsPerCategory": 500, "maxStorageGB": 50, "maxAPICallsPerDay": 10000, "maxReportsPerMonth": 100}'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  badge_text = EXCLUDED.badge_text,
  is_popular = EXCLUDED.is_popular,
  updated_at = NOW();

-- Insert Enterprise Plan
INSERT INTO omnilypro_plans (
  name,
  slug,
  description,
  price_monthly,
  price_yearly,
  setup_fee,
  currency,
  color,
  badge_text,
  is_popular,
  is_featured,
  is_active,
  visibility,
  sort_order,
  features,
  limits
) VALUES (
  'Enterprise',
  'enterprise',
  'Soluzione completa con supporto dedicato e funzionalità illimitate',
  299,
  2990,
  500,
  'EUR',
  '#ec4899',
  'Best Value',
  false,
  true,
  true,
  'public',
  3,
  '{"posEnabled": true, "loyaltyPrograms": true, "emailMarketing": true, "smsMarketing": true, "whatsappMarketing": true, "campaigns": true, "emailAutomations": true, "coupons": true, "giftCards": true, "giftCertificates": true, "subscriptions": true, "referralProgram": true, "gamingLottery": true, "slotMachine": true, "scratchCards": true, "nfcCards": true, "advancedAnalytics": true, "automations": true, "publicWebsite": true, "websiteBuilder": true, "mobileApp": true, "multiLocation": true, "teamManagement": true, "categoriesManagement": true, "channelsManagement": true, "inventoryManagement": true, "customBranding": true, "customDomain": true, "apiAccess": true, "webhooks": true, "prioritySupport": true, "dedicatedAccountManager": true, "supportTickets": true, "contactMessages": true}'::jsonb,
  '{"maxCustomers": null, "maxTeamMembers": null, "maxLocations": null, "maxEmailsPerMonth": null, "maxSMSPerMonth": null, "maxWhatsAppPerMonth": null, "maxCampaigns": null, "maxEmailAutomations": null, "maxActiveCoupons": null, "maxActiveGiftCards": null, "maxActiveGiftCertificates": null, "maxSubscriptionPlans": null, "maxReferralRewards": null, "maxLotteryDrawsPerMonth": null, "maxSlotMachineSpins": null, "maxScratchCardsPerMonth": null, "maxNFCCards": null, "maxVirtualCards": null, "maxAutomations": null, "maxWorkflows": null, "maxWebhooks": null, "maxLoyaltyPrograms": null, "maxNotifications": null, "maxCategories": null, "maxProductsPerCategory": null, "maxStorageGB": null, "maxAPICallsPerDay": null, "maxReportsPerMonth": null}'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  badge_text = EXCLUDED.badge_text,
  is_featured = EXCLUDED.is_featured,
  updated_at = NOW();

-- Verify inserted plans
SELECT
  name,
  slug,
  price_monthly,
  (features->>'emailMarketing')::boolean as has_email,
  (features->>'smsMarketing')::boolean as has_sms,
  (limits->>'maxCustomers') as max_customers
FROM omnilypro_plans
ORDER BY sort_order;
