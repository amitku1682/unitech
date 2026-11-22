-- Migration 0003: Orders table merge and hardening
-- Add missing enterprise fields and payment verification fields
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS utr_number VARCHAR(64),
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Set defaults for manual UPI / bank transfer verification workflow
ALTER TABLE orders 
  ALTER COLUMN payment_status SET DEFAULT 'PENDING_VERIFICATION',
  ALTER COLUMN order_status SET DEFAULT 'PLACED';

-- Enforce unique UTR reference number across all paid/pending orders
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_utr_number 
  ON orders(utr_number) 
  WHERE utr_number IS NOT NULL AND utr_number <> '';

-- Drop redundant empty customer_orders table (0 rows verified in baseline)
DROP TABLE IF EXISTS customer_orders;
