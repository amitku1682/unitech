const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runMigrations() {
  const envPath = path.join(__dirname, '..', '.env');
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl && fs.existsSync(envPath)) {
    const dotenv = fs.readFileSync(envPath, 'utf8');
    for (const line of dotenv.split('\n')) {
      if (line.trim().startsWith('DATABASE_URL=')) {
        dbUrl = line.trim().substring('DATABASE_URL='.length);
      }
    }
  }

  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set in environment or .env');
  }

  const isSsl = process.env.DATABASE_SSL === 'true' || process.env.DATABASE_SSL === '1';
  const client = new Client({
    connectionString: dbUrl,
    ssl: isSsl ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();

  console.log('Connected to database. Checking schema_migrations...');

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(64) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const appliedRes = await client.query('SELECT version FROM schema_migrations;');
  const appliedSet = new Set(appliedRes.rows.map(r => r.version));

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  // Check if baseline already exists in DB
  const checkBaseline = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'products'
    );
  `);
  const productsTableExists = checkBaseline.rows[0].exists;

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`[Already Applied] ${file}`);
      continue;
    }

    if (file === '0001_baseline.sql' && productsTableExists) {
      console.log(`[Baseline Detected] Marking ${file} as applied without re-running...`);
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING;', [file]);
      appliedSet.add(file);
      continue;
    }

    console.log(`[Applying Migration] ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    await client.query('BEGIN;');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1);', [file]);
      await client.query('COMMIT;');
      console.log(`[Successfully Applied] ${file}`);
      appliedSet.add(file);
    } catch (err) {
      await client.query('ROLLBACK;');
      console.error(`[Migration Error] Failed to apply ${file}:`, err);
      await client.end();
      process.exit(1);
    }
  }

  console.log('All migrations completed successfully.');
  await client.end();
}

runMigrations().catch(err => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});
