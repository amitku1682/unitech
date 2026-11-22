-- Migration: 0009_categories.sql
-- Dynamic categories and category series system

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  short_label VARCHAR(50),
  description TEXT,
  cover_image_url VARCHAR(500),
  position INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  show_in_menu BOOLEAN NOT NULL DEFAULT true,
  show_in_footer BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS category_series (
  id VARCHAR(64) PRIMARY KEY,
  category_id VARCHAR(64) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  position INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_active_pos ON categories (is_active, position ASC);
CREATE INDEX IF NOT EXISTS idx_category_series_cat_pos ON category_series (category_id, is_active, position ASC);

-- Seed Categories
INSERT INTO categories (id, name, short_label, description, cover_image_url, position, is_active, show_in_menu, show_in_footer)
VALUES
  ('cctv-cameras', 'CCTV Cameras', 'Cameras', '4MP / 5MP / 8MP 4K Warm Light, Dome, Bullet & Starlight cameras', '/images/products/utipbcp-4101.png', 0, true, true, true),
  ('dvr-nvr', 'DVR & NVR Recorders', 'DVR / NVR', '4-CH to 32-CH H.265+ 4K Hybrid DVRs & Independent NVRs', '/images/products/uthd-508.png', 1, true, true, true),
  ('networking-poe', 'Networking & PoE', 'Networking', '4-CH to 24-CH Industrial Full Gigabit PoE Switches', '/images/products/24ch-poe-switch.png', 2, true, true, true),
  ('cables', 'Surveillance Cables', 'Cables', '100% Pure Solid Copper 3+1, Cat6 UTP, Special Lift & Telephone Cables', '/images/products/elite.png', 3, true, true, true),
  ('network-racks', 'DVR & Server Racks', 'Racks', '2U, 4U, 6U, 9U & 12U Wall Mount & Folding Lockable Enclosures', '/images/products/utr-1004.png', 4, true, true, true),
  ('power-accessories', 'Power Supplies & SMPS', 'Power Supplies', '1A to 20A Adapters & 4-CH to 16-CH Surge-Protected Power Supplies', '/images/products/utpsa-105.png', 5, true, true, true)
ON CONFLICT (id) DO NOTHING;

-- Seed Category Series
INSERT INTO category_series (id, category_id, label, slug, position, is_active)
VALUES
  -- cctv-cameras
  ('ser-cam-1', 'cctv-cameras', 'IP Camera Series (4MP / 5MP / 4K)', 'ip', 0, true),
  ('ser-cam-2', 'cctv-cameras', 'Warm-Light Full Color Series', 'color', 1, true),
  ('ser-cam-3', 'cctv-cameras', 'HD Analog High Resolution', 'analog', 2, true),
  ('ser-cam-4', 'cctv-cameras', 'Starlight Night Optics Series', 'starlight', 3, true),
  ('ser-cam-5', 'cctv-cameras', 'Vandal Dome & Bullet Housing', 'housing', 4, true),

  -- dvr-nvr
  ('ser-dvr-1', 'dvr-nvr', '4-CH / 8-CH Hybrid DVRs', 'hybrid', 0, true),
  ('ser-dvr-2', 'dvr-nvr', '16-CH / 32-CH Pro NVR Series', 'nvr', 1, true),
  ('ser-dvr-3', 'dvr-nvr', 'H.265+ AI Smart Motion Series', 'ai', 2, true),
  ('ser-dvr-4', 'dvr-nvr', '4K HDMI Multi-Monitor Output', '4k', 3, true),

  -- networking-poe
  ('ser-net-1', 'networking-poe', '4-Port & 8-Port Desktop PoE+', 'desktop', 0, true),
  ('ser-net-2', 'networking-poe', '16-Port & 24-Port Rackmount Gigabit', 'rackmount', 1, true),
  ('ser-net-3', 'networking-poe', '250m CCTV Long-Range PoE Mode', 'cctv', 2, true),
  ('ser-net-4', 'networking-poe', 'Industrial High Surge Protection', 'surge', 3, true),

  -- cables
  ('ser-cab-1', 'cables', '3+1 CCTV Coaxial Solid Copper', '3plus1', 0, true),
  ('ser-cab-2', 'cables', 'Cat6 UTP 550MHz Pure Copper', 'cat6', 1, true),
  ('ser-cab-3', 'cables', 'Special Heavy-Duty Lift Cables', 'lift', 2, true),
  ('ser-cab-4', 'cables', '90m, 180m & 305m Drum Options', 'drums', 3, true),

  -- network-racks
  ('ser-rck-1', 'network-racks', '2U & 4U Compact DVR Enclosures', '2u-4u', 0, true),
  ('ser-rck-2', 'network-racks', '6U & 9U Folding Wall-Mount Racks', '6u-9u', 1, true),
  ('ser-rck-3', 'network-racks', '12U Deep Server Enclosures', '12u', 2, true),
  ('ser-rck-4', 'network-racks', 'Toughened Tinted Glass with Dual Lock', 'lock', 3, true),

  -- power-accessories
  ('ser-pwr-1', 'power-accessories', '12V 4-CH & 8-CH Central SMPS', 'smps', 0, true),
  ('ser-pwr-2', 'power-accessories', '1A, 2A & 5A DC Power Adapters', 'adapter', 1, true),
  ('ser-pwr-3', 'power-accessories', '16-CH Heavy Surge Distribution', 'distribution', 2, true),
  ('ser-pwr-4', 'power-accessories', '100% Copper Wound Transformers', 'copper', 3, true)
ON CONFLICT (id) DO NOTHING;

-- Foreign key on products.category referencing categories(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_category'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT fk_products_category
      FOREIGN KEY (category) REFERENCES categories(id)
      ON UPDATE CASCADE;
  END IF;
END $$;
