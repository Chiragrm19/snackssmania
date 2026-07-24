-- ====================================================================
-- COMPLETE 1-CLICK SUPABASE DATABASE SETUP FOR SNACKSSMANIA
-- Run this script in the SQL Editor of your NEW Supabase project!
-- ====================================================================

-- 1. CREATE TABLES
-- --------------------------------------------------------------------

-- Tables management
CREATE TABLE IF NOT EXISTS public.tables (
    id INT PRIMARY KEY,
    is_free BOOLEAN DEFAULT true
);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT,
    display_order INT DEFAULT 0
);

-- Menu Items
CREATE TABLE IF NOT EXISTS public.menu_items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    category TEXT DEFAULT 'food',
    emoji TEXT DEFAULT '🍽️',
    is_veg BOOLEAN DEFAULT true,
    is_signature BOOLEAN DEFAULT false,
    discount_pct NUMERIC DEFAULT 0,
    description TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.menu_items DROP COLUMN IF EXISTS image_url;

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    table_id INT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new',
    payment_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE IF NOT EXISTS public.customers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 2. ENABLE REALTIME ON TABLES
-- --------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;


-- 3. DISABLE RLS / ALLOW ANON ACCESS (For POS app simplicity)
-- --------------------------------------------------------------------
ALTER TABLE public.tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;


-- 4. SEED INITIAL DINING TABLES (Takeaway 0 + Tables 1 to 20)
-- --------------------------------------------------------------------
INSERT INTO public.tables (id, is_free) VALUES
(0, true), (1, true), (2, true), (3, true), (4, true), (5, true),
(6, true), (7, true), (8, true), (9, true), (10, true),
(11, true), (12, true), (13, true), (14, true), (15, true),
(16, true), (17, true), (18, true), (19, true), (20, true)
ON CONFLICT (id) DO NOTHING;


-- 5. SEED CATEGORIES
-- --------------------------------------------------------------------
INSERT INTO public.categories (name, display_order) VALUES
('food', 1),
('cold', 2)
ON CONFLICT DO NOTHING;


-- 6. CREATE PERFORMANCE INDEXES
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON public.orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON public.menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone_number);

-- ====================================================================
-- SUCCESS! Your new database schema, realtime features, and initial data are ready.
-- ====================================================================
