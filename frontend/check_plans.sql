-- Check organizations and their plans
SELECT id, name, plan_id, plan_type, is_active 
FROM organizations 
LIMIT 5;

-- Check plans and their features
SELECT id, name, slug, features 
FROM omnilypro_plans 
LIMIT 5;
