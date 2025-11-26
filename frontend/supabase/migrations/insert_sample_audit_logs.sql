-- Sample Audit Logs Data
-- Inserisce dati di esempio per testare il sistema di audit logs

-- Sample audit logs with various actions
INSERT INTO audit_logs (action, user_id, organization_id, metadata, created_at) VALUES
  -- Login events
  ('user.login',
   (SELECT id FROM auth.users LIMIT 1),
   (SELECT id FROM organizations LIMIT 1),
   '{"ip_address": "192.168.1.100", "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", "location": "Milan, Italy"}',
   NOW() - INTERVAL '2 hours'),

  ('user.login_failed',
   NULL,
   NULL,
   '{"ip_address": "192.168.1.101", "email": "test@example.com", "reason": "Invalid password", "user_agent": "Mozilla/5.0"}',
   NOW() - INTERVAL '3 hours'),

  ('user.logout',
   (SELECT id FROM auth.users LIMIT 1),
   (SELECT id FROM organizations LIMIT 1),
   '{"ip_address": "192.168.1.100", "user_agent": "Mozilla/5.0"}',
   NOW() - INTERVAL '1 hour'),

  -- Data access events
  ('data.access',
   (SELECT id FROM auth.users LIMIT 1),
   (SELECT id FROM organizations LIMIT 1),
   '{"resource": "customers", "action": "read", "count": 150}',
   NOW() - INTERVAL '30 minutes'),

  ('data.export',
   (SELECT id FROM auth.users LIMIT 1),
   (SELECT id FROM organizations LIMIT 1),
   '{"resource": "customers", "format": "csv", "count": 1500, "file_size": "2.3MB"}',
   NOW() - INTERVAL '45 minutes'),

  -- Organization events
  ('organization.created',
   (SELECT id FROM auth.users LIMIT 1),
   (SELECT id FROM organizations LIMIT 1),
   '{"organization_name": "Test Company", "plan": "pro"}',
   NOW() - INTERVAL '5 hours'),

  ('organization.updated',
   (SELECT id FROM auth.users LIMIT 1),
   (SELECT id FROM organizations LIMIT 1),
   '{"changes": ["plan_type"], "old_plan": "basic", "new_plan": "pro"}',
   NOW() - INTERVAL '4 hours'),

  -- User management events
  ('user.created',
   (SELECT id FROM auth.users LIMIT 1),
   (SELECT id FROM organizations LIMIT 1),
   '{"email": "newuser@example.com", "role": "member"}',
   NOW() - INTERVAL '6 hours'),

  ('user.role_changed',
   (SELECT id FROM auth.users LIMIT 1),
   (SELECT id FROM organizations LIMIT 1),
   '{"user_email": "admin@example.com", "old_role": "member", "new_role": "admin"}',
   NOW() - INTERVAL '7 hours'),

  ('user.deleted',
   (SELECT id FROM auth.users LIMIT 1),
   (SELECT id FROM organizations LIMIT 1),
   '{"email": "olduser@example.com", "reason": "User requested account deletion"}',
   NOW() - INTERVAL '8 hours'),

  -- Subscription events
  ('subscription.upgraded',
   (SELECT id FROM auth.users LIMIT 1),
   (SELECT id FROM organizations LIMIT 1),
   '{"from_plan": "basic", "to_plan": "pro", "price": "€99/month"}',
   NOW() - INTERVAL '1 day'),

  ('subscription.cancelled',
   (SELECT id FROM auth.users LIMIT 1),
   (SELECT id FROM organizations LIMIT 1),
   '{"plan": "basic", "reason": "Customer requested cancellation"}',
   NOW() - INTERVAL '2 days'),

  -- Security events
  ('security.password_reset',
   (SELECT id FROM auth.users LIMIT 1),
   NULL,
   '{"email": "user@example.com", "ip_address": "192.168.1.105"}',
   NOW() - INTERVAL '12 hours'),

  ('security.suspicious_activity',
   (SELECT id FROM auth.users LIMIT 1),
   (SELECT id FROM organizations LIMIT 1),
   '{"activity": "Multiple failed login attempts", "ip_address": "192.168.1.200", "count": 5}',
   NOW() - INTERVAL '15 hours'),

  -- System events
  ('system.backup_completed',
   NULL,
   NULL,
   '{"database_size": "15GB", "duration": "45 minutes", "status": "success"}',
   NOW() - INTERVAL '20 hours'),

  ('system.maintenance_started',
   NULL,
   NULL,
   '{"type": "scheduled", "estimated_duration": "2 hours"}',
   NOW() - INTERVAL '1 day'),

  -- API events
  ('api.rate_limit_exceeded',
   (SELECT id FROM auth.users LIMIT 1),
   (SELECT id FROM organizations LIMIT 1),
   '{"endpoint": "/api/customers", "limit": 1000, "requests": 1543}',
   NOW() - INTERVAL '3 hours'),

  ('api.error',
   (SELECT id FROM auth.users LIMIT 1),
   (SELECT id FROM organizations LIMIT 1),
   '{"endpoint": "/api/transactions", "error": "Database timeout", "status_code": 500}',
   NOW() - INTERVAL '5 hours'),

  -- Payment events
  ('payment.succeeded',
   (SELECT id FROM auth.users LIMIT 1),
   (SELECT id FROM organizations LIMIT 1),
   '{"amount": "€99.00", "payment_method": "card", "invoice_id": "INV-2024-001"}',
   NOW() - INTERVAL '1 day'),

  ('payment.failed',
   (SELECT id FROM auth.users LIMIT 1),
   (SELECT id FROM organizations LIMIT 1),
   '{"amount": "€99.00", "reason": "Insufficient funds", "payment_method": "card"}',
   NOW() - INTERVAL '2 days'),

  -- Recent events (last hour)
  ('user.login',
   (SELECT id FROM auth.users LIMIT 1),
   (SELECT id FROM organizations LIMIT 1),
   '{"ip_address": "192.168.1.102", "user_agent": "Chrome 120", "location": "Rome, Italy"}',
   NOW() - INTERVAL '15 minutes'),

  ('data.access',
   (SELECT id FROM auth.users LIMIT 1),
   (SELECT id FROM organizations LIMIT 1),
   '{"resource": "analytics", "action": "view", "dashboard": "sales"}',
   NOW() - INTERVAL '5 minutes'),

  ('settings.updated',
   (SELECT id FROM auth.users LIMIT 1),
   (SELECT id FROM organizations LIMIT 1),
   '{"section": "notifications", "changes": ["email_enabled", "push_enabled"]}',
   NOW() - INTERVAL '10 minutes');

-- Verify data was inserted
DO $$
DECLARE
  log_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO log_count FROM audit_logs;
  RAISE NOTICE 'Inserted % audit log records', log_count;
END $$;
