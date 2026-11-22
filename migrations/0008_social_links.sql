-- Migration: 0008_social_links.sql
-- Admin-configurable social & platform links

CREATE TABLE IF NOT EXISTS social_links (
  id VARCHAR(64) PRIMARY KEY,
  platform VARCHAR(32) NOT NULL CHECK (platform IN (
    'facebook', 'instagram', 'linkedin', 'youtube', 'x', 'whatsapp',
    'google_business', 'indiamart', 'justdial', 'pinterest', 'threads', 'telegram', 'other'
  )),
  label VARCHAR(100),
  url VARCHAR(500) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Unique constraint per platform (except 'other')
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_links_platform_unique
ON social_links (platform)
WHERE platform != 'other';

CREATE INDEX IF NOT EXISTS idx_social_links_active_position
ON social_links (is_active, position ASC);

-- Seed with authentic existing URLs found in codebase
INSERT INTO social_links (id, platform, label, url, is_active, position)
VALUES
  ('soc-facebook', 'facebook', 'Facebook', 'https://facebook.com/unitechcctv', true, 1),
  ('soc-instagram', 'instagram', 'Instagram', 'https://instagram.com/unitechcctv', true, 2),
  ('soc-youtube', 'youtube', 'YouTube', 'https://youtube.com/@unitechcctv', true, 3),
  ('soc-linkedin', 'linkedin', 'LinkedIn', 'https://linkedin.com/company/unitech-security-systems', true, 4),
  ('soc-x', 'x', 'X (Twitter)', 'https://x.com/unitechcctv', true, 5),
  ('soc-whatsapp', 'whatsapp', 'WhatsApp Support', 'https://wa.me/918700317239', true, 6),
  ('soc-google-business', 'google_business', 'Google Business Profile', 'https://maps.google.com/maps?cid=3536483869333144352', true, 7)
ON CONFLICT (id) DO NOTHING;
