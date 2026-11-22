-- Migration: 0012_category_cards_link.sql
-- Link homepage category cards to categories table with foreign key
-- Add badge and button_text columns, and map the 6 baseline cards

BEGIN;

-- 1. Ensure columns exist on homepage_category_cards
ALTER TABLE homepage_category_cards ADD COLUMN IF NOT EXISTS badge VARCHAR(32);
ALTER TABLE homepage_category_cards ADD COLUMN IF NOT EXISTS button_text VARCHAR(64) DEFAULT 'Explore Catalogue';

-- 2. Allow category_id to be nullable so ON DELETE SET NULL works properly
ALTER TABLE homepage_category_cards ALTER COLUMN category_id DROP NOT NULL;

-- 3. Add foreign key to categories(id) with ON DELETE SET NULL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_homepage_category_cards_category'
  ) THEN
    ALTER TABLE homepage_category_cards
      ADD CONSTRAINT fk_homepage_category_cards_category
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Map existing 6 baseline cards to active categories
UPDATE homepage_category_cards
  SET category_id = 'cctv-cameras'
  WHERE id = 'cat-cctv-cameras' OR UPPER(title) LIKE '%CCTV%';

UPDATE homepage_category_cards
  SET category_id = 'network-racks'
  WHERE id = 'cat-network-racks' OR UPPER(title) LIKE '%RACK%';

UPDATE homepage_category_cards
  SET category_id = 'networking-poe'
  WHERE id = 'cat-networking-poe' OR UPPER(title) LIKE '%POE%';

UPDATE homepage_category_cards
  SET category_id = 'dvr-nvr'
  WHERE id = 'cat-dvr-nvr' OR UPPER(title) LIKE '%DVR%';

UPDATE homepage_category_cards
  SET category_id = 'cables'
  WHERE id = 'cat-cables' OR UPPER(title) LIKE '%CABLE%';

UPDATE homepage_category_cards
  SET category_id = 'power-accessories'
  WHERE id = 'cat-power-accessories' OR UPPER(title) LIKE '%POWER%' OR UPPER(title) LIKE '%SMPS%';

-- Set default button text for existing cards if null
UPDATE homepage_category_cards
  SET button_text = 'Explore Catalogue'
  WHERE button_text IS NULL OR button_text = '';

COMMIT;
