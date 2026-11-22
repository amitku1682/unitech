const fs = require('fs');
const { Client } = require('pg');
const dotenv = fs.readFileSync('.env', 'utf8');
let dbUrl = '';
for (const line of dotenv.split('\n')) {
  if (line.trim().startsWith('DATABASE_URL=')) dbUrl = line.trim().substring('DATABASE_URL='.length);
}
const client = new Client({ connectionString: dbUrl });
client.connect().then(async () => {
  const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name;");
  for (const t of tables.rows) {
    const cols = await client.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position;", [t.table_name]);
    console.log(t.table_name + ': ' + cols.rows.map(c => c.column_name + ' (' + c.data_type + (c.is_nullable === 'NO' ? ' NOT NULL' : '') + ')').join(', '));
  }
  await client.end();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
