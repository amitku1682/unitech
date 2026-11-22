-- Migration 0010: Top Header Ticker Settings & Announcement Banner Scheduling
-- Compatible with PostgreSQL 16

CREATE TABLE IF NOT EXISTS ticker_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  rotation_seconds INTEGER NOT NULL DEFAULT 4,
  animation VARCHAR(32) NOT NULL DEFAULT 'fade',
  pause_on_hover BOOLEAN NOT NULL DEFAULT true,
  show_plant_desk BOOLEAN NOT NULL DEFAULT true,
  plant_desk_text VARCHAR(255) NOT NULL DEFAULT 'Sahibabad Plant Direct Supply',
  show_phone BOOLEAN NOT NULL DEFAULT true,
  phone_display VARCHAR(64) NOT NULL DEFAULT '+91 87003 17239',
  phone_tel VARCHAR(64) NOT NULL DEFAULT '+918700317239',
  show_whatsapp BOOLEAN NOT NULL DEFAULT true,
  whatsapp_label VARCHAR(64) NOT NULL DEFAULT 'Quick Order via WhatsApp',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(128) DEFAULT 'admin',
  CONSTRAINT single_row_ticker CHECK (id = 1)
);

INSERT INTO ticker_settings (
  id, is_enabled, rotation_seconds, animation, pause_on_hover,
  show_plant_desk, plant_desk_text, show_phone, phone_display,
  phone_tel, show_whatsapp, whatsapp_label
) VALUES (
  1, true, 4, 'fade', true,
  true, 'Sahibabad Plant Direct Supply', true, '+91 87003 17239',
  '+918700317239', true, 'Quick Order via WhatsApp'
) ON CONFLICT (id) DO NOTHING;

ALTER TABLE announcement_banners ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ NULL;
ALTER TABLE announcement_banners ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ NULL;
