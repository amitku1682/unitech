-- Migration 0015: Drop product warranty field
BEGIN;

ALTER TABLE products DROP COLUMN IF EXISTS warranty_years;

COMMIT;
