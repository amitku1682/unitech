-- Migration: 0004_about_leadership.sql
-- Module: About Company Leadership & Executive Team
-- Compatibility: PostgreSQL 16+

CREATE TABLE IF NOT EXISTS about_leadership (
    id VARCHAR(64) PRIMARY KEY,
    category VARCHAR(64) NOT NULL DEFAULT 'leaders',
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    bio TEXT,
    image_url TEXT,
    order_index INT NOT NULL DEFAULT 0,
    linkedin_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    badge VARCHAR(255),
    since VARCHAR(64),
    highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
    quote TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_about_leadership_cat_order ON about_leadership(category, order_index);
CREATE INDEX IF NOT EXISTS idx_about_leadership_active ON about_leadership(is_active);
