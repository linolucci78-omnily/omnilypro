
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '../frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // O SERVICE_ROLE_KEY se hai bisogno di bypassare RLS

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ORG_NAME = 'Sapori e Colori';

async function seed() {
  console.log(`🌱 Seeding data for "${ORG_NAME}"...`);

  // 1. Find Organization
  let { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', ORG_NAME)
    .single();

  if (orgError || !org) {
    console.log(`⚠️ Organization "${ORG_NAME}" not found. Creating it...`);
    const { data: newOrg, error: createError } = await supabase
      .from('organizations')
      .insert({
        name: ORG_NAME,
        slug: 'sapori-e-colori',
        plan_type: 'pro',
        is_active: true
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating organization:', createError);
      return;
    }
    org = newOrg;
  }

  console.log(`✅ Organization ID: ${org.id}`);

  // 2. Create Customers
  console.log('👥 Creating 50 customers...');
  const customers = [];
  const names = ['Mario', 'Luigi', 'Anna', 'Giulia', 'Francesco', 'Alessandro', 'Sofia', 'Martina', 'Luca', 'Chiara'];
  const surnames = ['Rossi', 'Bianchi', 'Verdi', 'Esposito', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno'];

  for (let i = 0; i < 50; i++) {
    const name = names[Math.floor(Math.random() * names.length)];
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const fullName = `${name} ${surname}`;

    customers.push({
      organization_id: org.id,
      name: fullName,
      email: `${name.toLowerCase()}.${surname.toLowerCase()}${i}@example.com`,
      points: Math.floor(Math.random() * 500),
      total_spent: 0, // Will update later
      visits: 0, // Will update later
      is_active: true,
      created_at: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString() // Last 90 days
    });
  }

  const { data: createdCustomers, error: custError } = await supabase
    .from('customers')
    .insert(customers)
    .select();

  if (custError) {
    console.error('❌ Error creating customers:', custError);
    return;
  }
  console.log(`✅ Created ${createdCustomers.length} customers.`);

  // 3. Create Transactions
  console.log('💸 Creating 200 transactions...');
  const transactions = [];

  for (let i = 0; i < 200; i++) {
    const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
    const amount = Math.floor(Math.random() * 50) + 5; // €5 - €55
    const points = Math.floor(amount * 1); // 1 point per euro
    const date = new Date(Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000)); // Last 60 days

    transactions.push({
      organization_id: org.id,
      customer_id: customer.id,
      amount: amount,
      points_earned: points,
      type: 'purchase',
      created_at: date.toISOString()
    });

    // Update customer stats locally (to update DB later)
    customer.total_spent += amount;
    customer.visits += 1;
    customer.points += points;
  }

  // Insert transactions (assuming table is 'transactions' or similar - check schema!)
  // Note: Adjust table name if different (e.g., 'customer_activity')
  const { error: transError } = await supabase
    .from('transactions')
    .insert(transactions);

  if (transError) {
    // Fallback to customer_activity if transactions table doesn't exist
    console.log('⚠️ Transactions table might not exist, trying customer_activity...');
    const activities = transactions.map(t => ({
      organization_id: t.organization_id,
      customer_id: t.customer_id,
      type: 'transaction',
      description: `Acquisto di €${t.amount}`,
      amount: t.amount,
      points: t.points_earned,
      created_at: t.created_at
    }));

    const { error: actError } = await supabase
      .from('customer_activity')
      .insert(activities);

    if (actError) console.error('❌ Error creating activities:', actError);
    else console.log('✅ Created 200 activities.');
  } else {
    console.log('✅ Created 200 transactions.');
  }

  // 4. Update Customer Stats
  console.log('🔄 Updating customer stats...');
  for (const customer of createdCustomers) {
    if (customer.visits > 0) {
      await supabase
        .from('customers')
        .update({
          total_spent: customer.total_spent,
          visits: customer.visits,
          points: customer.points
        })
        .eq('id', customer.id);
    }
  }

  console.log('🎉 Seed completed successfully!');
}

seed();
