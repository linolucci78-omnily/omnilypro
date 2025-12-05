SELECT * FROM transactions WHERE customer_id IN (SELECT id FROM customers WHERE name ILIKE '%pippo%') ORDER BY created_at DESC LIMIT 10;
