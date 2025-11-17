-- Make About section stats fully customizable
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_about_stat1_value TEXT DEFAULT '500+',
ADD COLUMN IF NOT EXISTS website_about_stat1_label TEXT DEFAULT 'Clienti Felici',
ADD COLUMN IF NOT EXISTS website_about_stat2_value TEXT DEFAULT '15+',
ADD COLUMN IF NOT EXISTS website_about_stat2_label TEXT DEFAULT 'Anni di Esperienza',
ADD COLUMN IF NOT EXISTS website_about_stat3_value TEXT DEFAULT '98%',
ADD COLUMN IF NOT EXISTS website_about_stat3_label TEXT DEFAULT 'Soddisfazione',
ADD COLUMN IF NOT EXISTS website_about_stat4_value TEXT DEFAULT '24/7',
ADD COLUMN IF NOT EXISTS website_about_stat4_label TEXT DEFAULT 'Supporto';

COMMENT ON COLUMN organizations.website_about_stat1_value IS 'First statistic value (e.g., 500+, 1000+)';
COMMENT ON COLUMN organizations.website_about_stat1_label IS 'First statistic label (e.g., Happy Customers)';
COMMENT ON COLUMN organizations.website_about_stat2_value IS 'Second statistic value (e.g., 15+, 20+)';
COMMENT ON COLUMN organizations.website_about_stat2_label IS 'Second statistic label (e.g., Years of Experience)';
COMMENT ON COLUMN organizations.website_about_stat3_value IS 'Third statistic value (e.g., 98%, 100%)';
COMMENT ON COLUMN organizations.website_about_stat3_label IS 'Third statistic label (e.g., Satisfaction)';
COMMENT ON COLUMN organizations.website_about_stat4_value IS 'Fourth statistic value (e.g., 24/7)';
COMMENT ON COLUMN organizations.website_about_stat4_label IS 'Fourth statistic label (e.g., Support)';
