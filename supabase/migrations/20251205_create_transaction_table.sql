-- Create transaction table for tracking customer purchases and bonus points
CREATE TABLE IF NOT EXISTS public.transaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) DEFAULT 0,
    points INTEGER DEFAULT 0,
    type TEXT NOT NULL CHECK (type IN ('sale', 'bonus', 'refund')),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_customer_id ON public.transaction(customer_id);
CREATE INDEX IF NOT EXISTS idx_transaction_organization_id ON public.transaction(organization_id);
CREATE INDEX IF NOT EXISTS idx_transaction_created_at ON public.transaction(created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_type ON public.transaction(type);

-- Enable RLS
ALTER TABLE public.transaction ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow authenticated users to read transactions for their organization
CREATE POLICY "Users can view transactions for their organization"
ON public.transaction
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id
        FROM public.staff
        WHERE user_id = auth.uid()
    )
);

-- Allow authenticated users to insert transactions for their organization
CREATE POLICY "Users can create transactions for their organization"
ON public.transaction
FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id
        FROM public.staff
        WHERE user_id = auth.uid()
    )
);

-- Allow service role to do everything (for Edge Functions)
CREATE POLICY "Service role has full access"
ON public.transaction
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');
