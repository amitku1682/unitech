-- Migration: 0007_payment_settings.sql
-- Admin-configurable payment settings with server-side dynamic UPI QR generation

CREATE TABLE IF NOT EXISTS payment_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  upi_id VARCHAR(255),
  payee_name VARCHAR(255),
  bank_name VARCHAR(255),
  account_name VARCHAR(255),
  account_number VARCHAR(64),
  ifsc VARCHAR(32),
  branch VARCHAR(255),
  qr_image_file_id VARCHAR(128) REFERENCES uploaded_files(id) ON DELETE SET NULL,
  qr_image_url VARCHAR(500),
  use_dynamic_qr BOOLEAN NOT NULL DEFAULT true,
  payment_note TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Seed initial singleton row with empty/placeholder details
INSERT INTO payment_settings (id, use_dynamic_qr, payment_note)
VALUES (
  1,
  true,
  'Please complete payment via UPI or IMPS/NEFT and enter your UTR / Transaction Reference Number below.'
)
ON CONFLICT (id) DO NOTHING;
