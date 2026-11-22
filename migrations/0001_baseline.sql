-- Migration 0001: Baseline schema for existing production tables
-- PostgreSQL 16 compatible

CREATE TABLE IF NOT EXISTS announcement_banners (
  id VARCHAR(64) PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  badge_text VARCHAR(64),
  cta_text VARCHAR(64),
  cta_link TEXT,
  type VARCHAR(64) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  discount_percent INTEGER,
  start_date VARCHAR(64),
  end_date VARCHAR(64),
  accent_style VARCHAR(64),
  custom_tags JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS customer_enquiries (
  id VARCHAR(64) PRIMARY KEY,
  type VARCHAR(32) NOT NULL DEFAULT 'DISTRIBUTOR',
  full_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  gstin VARCHAR(64),
  phone VARCHAR(64) NOT NULL,
  email VARCHAR(255),
  city VARCHAR(128) DEFAULT 'Unspecified',
  state VARCHAR(128) DEFAULT 'Uttar Pradesh',
  product_model VARCHAR(255),
  details TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'NEW',
  budget VARCHAR(128),
  admin_notes TEXT,
  created_at VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS customer_orders (
  id VARCHAR(64) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  gstin VARCHAR(64),
  street TEXT NOT NULL,
  city VARCHAR(128) NOT NULL,
  state VARCHAR(128) NOT NULL,
  pincode VARCHAR(32) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  gst18 NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_mode VARCHAR(64) NOT NULL DEFAULT 'UPI',
  utr_number VARCHAR(64) NOT NULL DEFAULT '',
  payment_status VARCHAR(64) NOT NULL DEFAULT 'PENDING',
  admin_notes TEXT,
  created_at VARCHAR(64) NOT NULL,
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dealer_hubs (
  id VARCHAR(64) PRIMARY KEY,
  state VARCHAR(128) NOT NULL,
  city VARCHAR(128) NOT NULL,
  address TEXT,
  contact VARCHAR(128) NOT NULL,
  type VARCHAR(128) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS dealers (
  id VARCHAR(64) PRIMARY KEY,
  state VARCHAR(128) NOT NULL,
  city VARCHAR(128) NOT NULL,
  address TEXT NOT NULL,
  contact VARCHAR(128) NOT NULL,
  type VARCHAR(128) NOT NULL DEFAULT 'Authorized Wholesale Partner',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flash_sales (
  id VARCHAR(64) PRIMARY KEY,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ NOT NULL,
  show_trigger VARCHAR(32) NOT NULL DEFAULT 'delay',
  show_delay_seconds INTEGER NOT NULL DEFAULT 4,
  frequency VARCHAR(32) NOT NULL DEFAULT 'once_per_session',
  show_on VARCHAR(32) NOT NULL DEFAULT 'home_and_products',
  badge VARCHAR(64) NOT NULL DEFAULT 'Flash sale',
  badge2 VARCHAR(64) NOT NULL DEFAULT 'Factory direct',
  eyebrow VARCHAR(128) NOT NULL DEFAULT 'Limited factory scheme',
  title VARCHAR(128) NOT NULL,
  subtitle VARCHAR(255),
  hero_image_url TEXT NOT NULL,
  hero_image_alt VARCHAR(255) NOT NULL,
  hero_badge VARCHAR(32),
  hero_badge_caption VARCHAR(64),
  mrp INTEGER NOT NULL,
  price INTEGER NOT NULL,
  discount_override INTEGER,
  units_in_kit INTEGER NOT NULL DEFAULT 4,
  unit_label VARCHAR(64) NOT NULL DEFAULT 'camera',
  gst_note VARCHAR(255) NOT NULL DEFAULT '+ 18% GST · GST invoice with full ITC',
  perks JSONB NOT NULL DEFAULT '[]'::jsonb,
  stock_total INTEGER NOT NULL DEFAULT 50,
  stock_left INTEGER NOT NULL DEFAULT 16,
  cta_label VARCHAR(128) NOT NULL DEFAULT 'Claim offer · Add to cart',
  cta_short_label VARCHAR(64) NOT NULL DEFAULT 'Claim offer',
  whatsapp_number VARCHAR(64) NOT NULL DEFAULT '+91 87003 17239',
  bulk_label VARCHAR(128) NOT NULL DEFAULT 'Need 10+ kits? Get a quote',
  bulk_url TEXT NOT NULL DEFAULT '/inquiry?type=PRODUCT_QUOTE',
  dismiss_label VARCHAR(128) NOT NULL DEFAULT 'No thanks, browse products',
  linked_product_id VARCHAR(64),
  linked_bundle_sku VARCHAR(64),
  views_count INTEGER NOT NULL DEFAULT 0,
  claims_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(128) DEFAULT 'Admin'
);

CREATE TABLE IF NOT EXISTS flash_sale_items (
  id VARCHAR(64) PRIMARY KEY,
  flash_sale_id VARCHAR(64) NOT NULL REFERENCES flash_sales(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  name VARCHAR(128) NOT NULL,
  short_name VARCHAR(64),
  spec VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS google_reviews (
  id VARCHAR(64) PRIMARY KEY,
  author_name VARCHAR(255) NOT NULL,
  author_role VARCHAR(255) NOT NULL DEFAULT 'Customer',
  rating INTEGER NOT NULL DEFAULT 5,
  review_text TEXT NOT NULL,
  relative_time VARCHAR(64) NOT NULL DEFAULT 'Recently',
  is_featured BOOLEAN NOT NULL DEFAULT true,
  source VARCHAR(64) NOT NULL DEFAULT 'Google Review',
  company_name VARCHAR(255),
  city VARCHAR(128),
  dealer_tier VARCHAR(128),
  hardware_volume VARCHAR(128),
  is_verified_partner BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS hero_slides (
  id VARCHAR(64) PRIMARY KEY,
  tab_label VARCHAR(128) NOT NULL,
  category VARCHAR(128) NOT NULL,
  badge_tag VARCHAR(128) NOT NULL,
  badge_detail VARCHAR(255) NOT NULL,
  headline VARCHAR(255) NOT NULL,
  highlight_text VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  primary_cta_text VARCHAR(128) NOT NULL,
  primary_cta_link TEXT NOT NULL,
  secondary_cta_text VARCHAR(128) NOT NULL,
  secondary_cta_link TEXT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  sku VARCHAR(128) NOT NULL,
  stock_status VARCHAR(128) NOT NULL,
  warranty VARCHAR(128) NOT NULL,
  specs JSONB NOT NULL DEFAULT '[]'::jsonb,
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  type VARCHAR(32) NOT NULL DEFAULT 'camera',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  image_url TEXT,
  is_offer BOOLEAN DEFAULT false,
  offer_price NUMERIC,
  mrp_price NUMERIC,
  savings_text VARCHAR(255),
  schema_details JSONB,
  grid_images JSONB,
  product_sale_data JSONB
);

CREATE TABLE IF NOT EXISTS homepage_category_cards (
  id VARCHAR(64) PRIMARY KEY,
  category_id VARCHAR(64) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  title VARCHAR(64) NOT NULL,
  description VARCHAR(255) NOT NULL,
  chips TEXT[] NOT NULL DEFAULT '{}',
  scene_preset VARCHAR(32) NOT NULL DEFAULT 'graphite',
  background_image_url TEXT,
  product_image_urls TEXT[] NOT NULL DEFAULT '{}',
  link_url TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(128)
);

CREATE TABLE IF NOT EXISTS live_documents (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  file_url TEXT NOT NULL,
  version VARCHAR(64) NOT NULL,
  file_size VARCHAR(64) NOT NULL,
  format VARCHAR(32) NOT NULL DEFAULT 'PDF',
  updated_date VARCHAR(64) NOT NULL,
  is_live BOOLEAN NOT NULL DEFAULT true,
  revision_summary TEXT,
  sort_order INTEGER DEFAULT 0,
  section VARCHAR(64) DEFAULT 'catalogues'
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  order_number VARCHAR(64) NOT NULL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  email VARCHAR(255) NOT NULL,
  street TEXT NOT NULL,
  city VARCHAR(128) NOT NULL,
  state VARCHAR(128) NOT NULL,
  pincode VARCHAR(32) NOT NULL,
  gstin VARCHAR(64),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  gst_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_mode VARCHAR(64) NOT NULL DEFAULT 'UPI',
  payment_status VARCHAR(64) NOT NULL DEFAULT 'CONFIRMED',
  order_status VARCHAR(64) NOT NULL DEFAULT 'PROCESSING',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  model_code VARCHAR(128) NOT NULL,
  category VARCHAR(64) NOT NULL,
  category_label VARCHAR(128) NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  dealer_price NUMERIC NOT NULL DEFAULT 0,
  mrp NUMERIC NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_bestseller BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  is_promo BOOLEAN DEFAULT false,
  rating NUMERIC DEFAULT 4.8,
  review_count INTEGER DEFAULT 12,
  datasheet_pdf_url TEXT,
  warranty_years INTEGER DEFAULT 2,
  connectivity VARCHAR(32),
  specs JSONB NOT NULL DEFAULT '{}'::jsonb,
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_url TEXT,
  placeholder_label VARCHAR(255),
  placeholder_subtext VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tier2_price NUMERIC,
  cable_lengths JSONB
);

CREATE TABLE IF NOT EXISTS product_images (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumb_url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  label VARCHAR(64) NOT NULL DEFAULT 'Front view',
  alt VARCHAR(125) NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(128),
  CONSTRAINT uq_product_images_pos UNIQUE (product_id, position),
  CONSTRAINT chk_product_images_pos CHECK (position >= 0 AND position <= 5)
);

CREATE TABLE IF NOT EXISTS search_popular_terms (
  id VARCHAR(64) PRIMARY KEY,
  label VARCHAR(64) NOT NULL,
  query VARCHAR(128) NOT NULL,
  link_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(128)
);

CREATE TABLE IF NOT EXISTS search_query_log (
  id BIGSERIAL PRIMARY KEY,
  term_normalized VARCHAR(64) NOT NULL,
  results_count INTEGER NOT NULL,
  source VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS uploaded_files (
  id VARCHAR(128) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL UNIQUE,
  file_data BYTEA NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  file_size VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
