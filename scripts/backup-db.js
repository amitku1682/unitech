const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function backup() {
  const dotenv = fs.readFileSync('.env', 'utf8');
  let dbUrl = '';
  for (const line of dotenv.split('\n')) {
    if (line.trim().startsWith('DATABASE_URL=')) {
      dbUrl = line.trim().substring('DATABASE_URL='.length);
    }
  }

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const auditDir = path.join(__dirname, '..', 'audit');
  if (!fs.existsSync(auditDir)) {
    fs.mkdirSync(auditDir, { recursive: true });
  }
  const backupFile = path.join(auditDir, `backup-${timestamp}.sql`);
  const stream = fs.createWriteStream(backupFile, { encoding: 'utf8' });

  stream.write(`-- UNITECH CCTV DATABASE BACKUP\n-- Timestamp: ${new Date().toISOString()}\n\n`);

  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema='public' AND table_type='BASE TABLE'
    ORDER BY table_name;
  `);

  for (const row of tablesRes.rows) {
    const table = row.table_name;
    stream.write(`\n-- Table: ${table}\n`);
    const countRes = await client.query(`SELECT COUNT(*) FROM "${table}"`);
    console.log(`Backing up ${table} (${countRes.rows[0].count} rows)...`);

    const dataRes = await client.query(`SELECT * FROM "${table}"`);
    if (dataRes.rows.length > 0) {
      const cols = Object.keys(dataRes.rows[0]).map(c => `"${c}"`).join(', ');
      for (const r of dataRes.rows) {
        const vals = Object.values(r).map(v => {
          if (v === null) return 'NULL';
          if (typeof v === 'boolean' || typeof v === 'number') return v;
          if (v instanceof Date) return `'${v.toISOString()}'`;
          if (Buffer.isBuffer(v)) return `decode('${v.toString('hex')}', 'hex')`;
          if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
          return `'${String(v).replace(/'/g, "''")}'`;
        }).join(', ');
        stream.write(`INSERT INTO "${table}" (${cols}) VALUES (${vals}) ON CONFLICT DO NOTHING;\n`);
      }
    }
  }

  stream.end();
  await client.end();
  console.log(`Backup completed successfully to ${backupFile}`);
}

backup().catch(err => {
  console.error('Backup failed:', err);
  process.exit(1);
});
