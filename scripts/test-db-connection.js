const fs = require('fs');
const dotenv = fs.readFileSync('.env', 'utf8');
let dbUrl = '';
for (const line of dotenv.split('\n')) {
  if (line.trim().startsWith('DATABASE_URL=')) {
    dbUrl = line.trim().substring('DATABASE_URL='.length);
  }
}
console.log('Testing connection to DATABASE_URL in .env (host masked)...');
const { Client } = require('pg');
const client = new Client({ connectionString: dbUrl, connectionTimeoutMillis: 5000 });
client.connect().then(async () => {
  console.log('SUCCESS: Connected to PostgreSQL!');
  const dbInfo = await client.query('SELECT current_database(), current_user, version();');
  console.log('DB Info:', dbInfo.rows[0].current_database, dbInfo.rows[0].current_user, dbInfo.rows[0].version.split(' ')[0], dbInfo.rows[0].version.split(' ')[1]);
  const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;");
  console.log('Tables found (' + tables.rows.length + '):', tables.rows.map(r => r.table_name).join(', '));
  for (const t of tables.rows) {
    const c = await client.query('SELECT COUNT(*) FROM ' + t.table_name);
    console.log(' - ' + t.table_name + ': ' + c.rows[0].count);
  }
  await client.end();
}).catch(err => {
  console.error('Connection FAILED:', err.message);
  process.exit(1);
});
