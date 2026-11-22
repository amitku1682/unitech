-- Migration 0014: Admin Password Resets
-- PostgreSQL 16 compatible

CREATE TABLE IF NOT EXISTS admin_password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  request_ip VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_admin_password_resets_token_hash ON admin_password_resets(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_password_resets_user_id ON admin_password_resets(admin_user_id);
