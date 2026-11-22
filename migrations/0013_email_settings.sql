-- Migration 0013: Outbound SMTP Email Settings and Logs
-- PostgreSQL 16 compatible

CREATE TABLE IF NOT EXISTS email_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  smtp_host VARCHAR(255) NOT NULL DEFAULT '',
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_secure BOOLEAN NOT NULL DEFAULT false,
  smtp_user VARCHAR(255) NOT NULL DEFAULT '',
  smtp_password_encrypted TEXT NOT NULL DEFAULT '',
  sender_email VARCHAR(255) NOT NULL DEFAULT 'sales@unitechcctv.com',
  sender_name VARCHAR(255) NOT NULL DEFAULT 'Unitech CCTV Sales',
  admin_notification_emails TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  notify_on_order_received BOOLEAN NOT NULL DEFAULT true,
  notify_on_payment_confirmed BOOLEAN NOT NULL DEFAULT true,
  notify_on_payment_rejected BOOLEAN NOT NULL DEFAULT true,
  notify_admin_on_order BOOLEAN NOT NULL DEFAULT true,
  notify_admin_on_enquiry BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(128) DEFAULT 'admin',
  CONSTRAINT single_row_email CHECK (id = 1)
);

INSERT INTO email_settings (
  id, is_enabled, smtp_host, smtp_port, smtp_secure,
  smtp_user, smtp_password_encrypted, sender_email, sender_name,
  admin_notification_emails, notify_on_order_received,
  notify_on_payment_confirmed, notify_on_payment_rejected,
  notify_admin_on_order, notify_admin_on_enquiry
) VALUES (
  1, false, '', 587, false,
  '', '', 'sales@unitechcctv.com', 'Unitech CCTV Sales',
  ARRAY[]::TEXT[], true,
  true, true,
  true, true
) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS email_logs (
  id VARCHAR(64) PRIMARY KEY,
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  template_type VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  error_message TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs (created_at DESC);
