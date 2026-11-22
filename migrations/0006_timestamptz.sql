-- Migration 0006: Convert varchar/naive timestamps to timestamptz (SEC-MED-04)
-- PostgreSQL 16 compatible

-- 1. customer_enquiries.created_at -> timestamptz
ALTER TABLE customer_enquiries
  ALTER COLUMN created_at TYPE timestamptz
  USING created_at::timestamptz,
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- 2. live_documents.updated_date -> timestamptz
ALTER TABLE live_documents
  ALTER COLUMN updated_date TYPE timestamptz
  USING to_timestamp(updated_date, 'Mon YYYY'),
  ALTER COLUMN updated_date SET DEFAULT CURRENT_TIMESTAMP;

-- 3. orders.created_at -> timestamptz
ALTER TABLE orders
  ALTER COLUMN created_at TYPE timestamptz
  USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- 4. dealers.created_at & updated_at -> timestamptz
ALTER TABLE dealers
  ALTER COLUMN created_at TYPE timestamptz
  USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at TYPE timestamptz
  USING updated_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
