-- Migration: 0011_uploaded_files_types.sql
-- Safely convert uploaded_files column types:
-- 1. created_at -> TIMESTAMPTZ (supporting ISO strings, epoch seconds/ms, and nulls)
-- 2. file_size  -> BIGINT (bytes, calculating from octet_length(file_data) when string/MB/null)

BEGIN;

-- 1. Convert created_at to TIMESTAMPTZ safely
ALTER TABLE uploaded_files ALTER COLUMN created_at DROP DEFAULT;

ALTER TABLE uploaded_files
  ALTER COLUMN created_at TYPE TIMESTAMPTZ
  USING (
    CASE
      WHEN created_at IS NULL THEN CURRENT_TIMESTAMP
      WHEN created_at::text ~ '^\d{12,}$' THEN to_timestamp(created_at::text::double precision / 1000.0)
      WHEN created_at::text ~ '^\d{9,11}$' THEN to_timestamp(created_at::text::double precision)
      WHEN created_at::text ~ '^\d{4}-\d{2}-\d{2}' THEN created_at::text::timestamptz
      ELSE CURRENT_TIMESTAMP
    END
  );

ALTER TABLE uploaded_files ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- 2. Convert file_size to BIGINT safely
DO $$
BEGIN
  -- Drop default if it exists
  ALTER TABLE uploaded_files ALTER COLUMN file_size DROP DEFAULT;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE uploaded_files
  ALTER COLUMN file_size TYPE BIGINT
  USING (
    CASE
      WHEN file_size::text ~ '^\d+$' THEN file_size::text::bigint
      WHEN file_data IS NOT NULL THEN octet_length(file_data)::bigint
      ELSE 0::bigint
    END
  );

ALTER TABLE uploaded_files ALTER COLUMN file_size SET DEFAULT 0;
ALTER TABLE uploaded_files ALTER COLUMN file_size SET NOT NULL;

COMMIT;
