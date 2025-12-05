-- Create customer_notifications table for tier upgrades and other customer-specific notifications
CREATE TABLE IF NOT EXISTS public.customer_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'tier_upgrade', 'promotion', etc.
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB, -- Additional data like oldTierName, newTierName, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_notifications_customer_id ON public.customer_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_category ON public.customer_notifications(category);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_is_read ON public.customer_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_created_at ON public.customer_notifications(created_at);

-- Enable RLS
ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view notifications for their organization's customers"
    ON public.customer_notifications
    FOR SELECT
    USING (
        customer_id IN (
            SELECT id FROM public.customers
            WHERE organization_id = (auth.jwt() ->> 'organization_id')::uuid
        )
    );

CREATE POLICY "Users can insert notifications for their organization's customers"
    ON public.customer_notifications
    FOR INSERT
    WITH CHECK (
        customer_id IN (
            SELECT id FROM public.customers
            WHERE organization_id = (auth.jwt() ->> 'organization_id')::uuid
        )
    );

CREATE POLICY "Users can update notifications for their organization's customers"
    ON public.customer_notifications
    FOR UPDATE
    USING (
        customer_id IN (
            SELECT id FROM public.customers
            WHERE organization_id = (auth.jwt() ->> 'organization_id')::uuid
        )
    );

CREATE POLICY "Users can delete notifications for their organization's customers"
    ON public.customer_notifications
    FOR DELETE
    USING (
        customer_id IN (
            SELECT id FROM public.customers
            WHERE organization_id = (auth.jwt() ->> 'organization_id')::uuid
        )
    );
