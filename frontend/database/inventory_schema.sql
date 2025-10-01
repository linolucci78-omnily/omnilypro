-- ============================================================================
-- OMNILY PRO - INVENTORY & SUPPLIER MANAGEMENT
-- Schema per gestione fornitori e magazzino hardware
-- ============================================================================

-- Tabella fornitori (principalmente Cina)
CREATE TABLE IF NOT EXISTS suppliers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL,
    company_name varchar(255),
    contact_person varchar(255),
    email varchar(255),
    phone varchar(50),
    country varchar(100) DEFAULT 'China',
    city varchar(100),
    address text,
    payment_terms varchar(100), -- '30 days', 'PayPal', 'Bank Transfer'
    currency varchar(3) DEFAULT 'USD',
    tax_id varchar(100),
    notes text,
    is_active boolean DEFAULT true,
    rating integer DEFAULT 5, -- 1-5 rating fornitore
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Tabella prodotti/modelli hardware
CREATE TABLE IF NOT EXISTS hardware_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sku varchar(100) UNIQUE NOT NULL,
    name varchar(255) NOT NULL,
    model varchar(100) NOT NULL, -- 'Z108', 'Z108_PRO', 'CUSTOMER_DISPLAY'
    description text,
    category varchar(100) DEFAULT 'POS_TERMINAL',
    specifications jsonb, -- {display_size: "8inch", nfc: true, printer: "thermal"}
    warranty_months integer DEFAULT 24,
    weight_kg decimal(5,2),
    dimensions_cm varchar(50), -- "20x15x8"
    is_active boolean DEFAULT true,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Tabella ordini dai fornitori
CREATE TABLE IF NOT EXISTS supplier_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number varchar(100) UNIQUE NOT NULL,
    supplier_id uuid REFERENCES suppliers(id) ON DELETE RESTRICT,
    status varchar(50) DEFAULT 'draft', -- 'draft', 'sent', 'confirmed', 'production', 'shipped', 'received', 'cancelled'
    total_amount decimal(12,2) NOT NULL,
    currency varchar(3) DEFAULT 'USD',
    exchange_rate decimal(10,4) DEFAULT 1.0000, -- USD to EUR
    total_amount_eur decimal(12,2), -- Calcolato automaticamente
    payment_method varchar(100),
    payment_status varchar(50) DEFAULT 'pending', -- 'pending', 'paid', 'partial', 'overdue'
    expected_delivery_date date,
    actual_delivery_date date,
    tracking_number varchar(255),
    shipping_cost decimal(10,2) DEFAULT 0,
    customs_cost decimal(10,2) DEFAULT 0,
    other_costs decimal(10,2) DEFAULT 0,
    notes text,
    ordered_at timestamp DEFAULT now(),
    shipped_at timestamp,
    received_at timestamp,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Tabella dettagli ordini fornitori (line items)
CREATE TABLE IF NOT EXISTS supplier_order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_order_id uuid REFERENCES supplier_orders(id) ON DELETE CASCADE,
    hardware_product_id uuid REFERENCES hardware_products(id) ON DELETE RESTRICT,
    quantity integer NOT NULL,
    unit_price decimal(10,2) NOT NULL,
    total_price decimal(10,2) NOT NULL,
    received_quantity integer DEFAULT 0,
    defective_quantity integer DEFAULT 0,
    notes text,
    created_at timestamp DEFAULT now()
);

-- Tabella inventory/magazzino
CREATE TABLE IF NOT EXISTS inventory_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hardware_product_id uuid REFERENCES hardware_products(id) ON DELETE RESTRICT,
    sku varchar(100) NOT NULL,
    quantity_available integer DEFAULT 0,
    quantity_reserved integer DEFAULT 0, -- Riservati per ordini clienti
    quantity_defective integer DEFAULT 0,
    reorder_point integer DEFAULT 10, -- Quando riordinare
    max_stock integer DEFAULT 100,
    location varchar(255) DEFAULT 'Main Warehouse',
    last_restock_date timestamp,
    cost_per_unit decimal(10,2), -- Ultimo costo di acquisto
    total_value decimal(12,2), -- quantity_available * cost_per_unit
    notes text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),

    UNIQUE(hardware_product_id, location)
);

-- Tabella movimenti di magazzino
CREATE TABLE IF NOT EXISTS inventory_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
    movement_type varchar(50) NOT NULL, -- 'IN', 'OUT', 'ADJUSTMENT', 'DEFECTIVE', 'RESERVED', 'UNRESERVED'
    quantity integer NOT NULL, -- Positivo per IN, negativo per OUT
    reference_type varchar(50), -- 'supplier_order', 'customer_order', 'manual_adjustment'
    reference_id uuid, -- ID dell'ordine/documento di riferimento
    notes text,
    performed_by uuid, -- User ID che ha fatto il movimento
    performed_at timestamp DEFAULT now(),
    created_at timestamp DEFAULT now()
);

-- Tabella costi aggiuntivi per ordini
CREATE TABLE IF NOT EXISTS supplier_order_costs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_order_id uuid REFERENCES supplier_orders(id) ON DELETE CASCADE,
    cost_type varchar(100) NOT NULL, -- 'shipping', 'customs', 'insurance', 'handling', 'other'
    description varchar(255),
    amount decimal(10,2) NOT NULL,
    currency varchar(3) DEFAULT 'EUR',
    invoice_number varchar(255),
    invoice_date date,
    created_at timestamp DEFAULT now()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_supplier_orders_supplier ON supplier_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_status ON supplier_orders(status);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_date ON supplier_orders(ordered_at);
CREATE INDEX IF NOT EXISTS idx_supplier_order_items_order ON supplier_order_items(supplier_order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_product ON inventory_items(hardware_product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON inventory_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type);

-- RLS (Row Level Security)
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_order_costs ENABLE ROW LEVEL SECURITY;

-- Policy per admin (full access)
CREATE POLICY "Admin full access suppliers" ON suppliers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_users ou
            WHERE ou.user_id = auth.uid()
            AND ou.role = 'super_admin'
        )
    );

CREATE POLICY "Admin full access hardware_products" ON hardware_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_users ou
            WHERE ou.user_id = auth.uid()
            AND ou.role = 'super_admin'
        )
    );

CREATE POLICY "Admin full access supplier_orders" ON supplier_orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_users ou
            WHERE ou.user_id = auth.uid()
            AND ou.role = 'super_admin'
        )
    );

CREATE POLICY "Admin full access inventory" ON inventory_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_users ou
            WHERE ou.user_id = auth.uid()
            AND ou.role = 'super_admin'
        )
    );

-- Inserimento dati di base
INSERT INTO suppliers (name, company_name, contact_person, email, phone, country, city) VALUES
('TechnoChina Ltd', 'Shenzhen TechnoChina Manufacturing Co.', 'Li Wei', 'li.wei@technochina.com', '+86 755 1234 5678', 'China', 'Shenzhen'),
('POS Solutions China', 'Guangzhou POS Solutions Inc.', 'Wang Ming', 'wang.ming@possolutions.cn', '+86 20 8765 4321', 'China', 'Guangzhou'),
('Smart Terminals Co', 'Beijing Smart Terminals Technology', 'Zhang Yu', 'zhang.yu@smartterminals.com.cn', '+86 10 5555 0000', 'China', 'Beijing')
ON CONFLICT DO NOTHING;

INSERT INTO hardware_products (sku, name, model, description, specifications) VALUES
('Z108-STD', 'Z108 Standard POS Terminal', 'Z108', 'Standard POS terminal with 8" display, NFC, thermal printer', '{"display": "8inch", "nfc": true, "printer": "thermal", "ram": "4GB", "storage": "32GB"}'),
('Z108-PRO', 'Z108 Pro POS Terminal', 'Z108_PRO', 'Professional POS terminal with enhanced features', '{"display": "8inch", "nfc": true, "printer": "thermal", "ram": "6GB", "storage": "64GB", "camera": true}'),
('CUST-DISP', 'Customer Display 7"', 'CUSTOMER_DISPLAY', 'Secondary customer-facing display', '{"display": "7inch", "touch": false, "mounting": "pole"}')
ON CONFLICT (sku) DO NOTHING;

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hardware_products_updated_at BEFORE UPDATE ON hardware_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_orders_updated_at BEFORE UPDATE ON supplier_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger per calcolare total_amount_eur automaticamente
CREATE OR REPLACE FUNCTION calculate_eur_amount()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_amount_eur = NEW.total_amount * NEW.exchange_rate;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_supplier_order_eur BEFORE INSERT OR UPDATE ON supplier_orders
    FOR EACH ROW EXECUTE FUNCTION calculate_eur_amount();

-- Trigger per aggiornare total_value in inventory
CREATE OR REPLACE FUNCTION update_inventory_value()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_value = NEW.quantity_available * NEW.cost_per_unit;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_items_value BEFORE INSERT OR UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_inventory_value();