-- Migration 0005: Add missing indexes and check constraints (SEC-MED-02)
-- PostgreSQL 16 compatible

-- 1. Products: indexes and price/stock constraints
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_model_code ON products(model_code);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_price') THEN
    ALTER TABLE products ADD CONSTRAINT chk_products_price CHECK (price >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_dealer_price') THEN
    ALTER TABLE products ADD CONSTRAINT chk_products_dealer_price CHECK (dealer_price >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_stock_quantity') THEN
    ALTER TABLE products ADD CONSTRAINT chk_products_stock_quantity CHECK (stock_quantity >= 0);
  END IF;
END $$;

-- 2. Orders: index on created_at (order_number and utr_number already indexed)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 3. Customer Enquiries: composite index on status and created_at
CREATE INDEX IF NOT EXISTS idx_customer_enquiries_status_created ON customer_enquiries(status, created_at);

-- 4. Dealers: index on state, city, is_active
CREATE INDEX IF NOT EXISTS idx_dealers_state_city_active ON dealers(state, city, is_active);

-- 5. Live Documents: index on category and is_live
CREATE INDEX IF NOT EXISTS idx_live_documents_cat_live ON live_documents(category, is_live);

-- 6. Flash Sales: unique partial index ensuring only ONE active published flash sale exists
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_published_flash_sale
ON flash_sales (is_enabled, status)
WHERE is_enabled = true AND status = 'published';
