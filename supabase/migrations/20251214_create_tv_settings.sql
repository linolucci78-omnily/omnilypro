-- Create a specific table for TV configurations to keep it separate from core org data
create table public.tv_configurations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) not null unique,
  
  -- Sfondo dinamico
  background_image text default 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop',
  
  -- Configurazione Ticker
  ticker_text text default 'Benvenuto nel Club esclusivo • Scarica l''App per accumulare punti',
  
  -- Configurazione Lotteria
  jackpot_amount integer default 15000,
  super_prize_image text,
  
  -- Configurazione Premi (JSONB per flessibilità)
  rewards_json jsonb default '[
    {"id": 1, "title": "Pizza Margherita", "points": 500, "tier": "Base"},
    {"id": 2, "title": "Caffè Speciale", "points": 150, "tier": "Base"},
    {"id": 3, "title": "T-Shirt VIP", "points": 1200, "tier": "Gold"}
  ]'::jsonb,
  
  -- Palinsesto (quali slide mostrare)
  active_slides jsonb default '{
    "leaderboard": true,
    "rewards": true,
    "lottery": true,
    "promo": true,
    "activity": true,
    "howto": false
  }'::jsonb,
  
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Abilita RLS
alter table public.tv_configurations enable row level security;

-- Policy in lettura (tutti possono vedere la TV se hanno org_id)
create policy "Public TV Configurations are viewable by everyone"
  on public.tv_configurations for select
  using (true);

-- Policy in scrittura (solo gli admin dell'org)
create policy "Admins can update their own TV config"
  on public.tv_configurations for update
  using (auth.uid() in (
    select user_id from public.organization_users where org_id = tv_configurations.org_id
  ));

-- Policy in inserimento
create policy "Admins can insert their own TV config"
  on public.tv_configurations for insert
  with check (auth.uid() in (
    select user_id from public.organization_users where org_id = tv_configurations.org_id
  ));
