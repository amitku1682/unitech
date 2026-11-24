"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const readline_1 = __importDefault(require("readline"));
const pg_1 = require("pg");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function main() {
    const envPath = path_1.default.join(process.cwd(), '.env');
    let dbUrl = process.env.DATABASE_URL;
    if (!dbUrl && fs_1.default.existsSync(envPath)) {
        const dotenv = fs_1.default.readFileSync(envPath, 'utf8');
        for (const line of dotenv.split('\n')) {
            if (line.trim().startsWith('DATABASE_URL=')) {
                dbUrl = line.trim().substring('DATABASE_URL='.length);
            }
        }
    }
    if (!dbUrl) {
        console.error('Error: DATABASE_URL is not set.');
        process.exit(1);
    }
    const isSsl = process.env.DATABASE_SSL === 'true' || process.env.DATABASE_SSL === '1';
    const client = new pg_1.Client({
        connectionString: dbUrl,
        ssl: isSsl ? { rejectUnauthorized: false } : undefined,
    });
    await client.connect();
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));
    console.log('==============================================');
    console.log('UNITECH CCTV - CREATE SUPER ADMIN');
    console.log('==============================================\n');
    try {
        const email = (await question('Enter Admin Email: ')).trim().toLowerCase();
        if (!email || !email.includes('@') || !email.includes('.')) {
            console.error('Error: Please enter a valid email address.');
            process.exit(1);
        }
        const name = (await question('Enter Admin Full Name: ')).trim() || 'Super Administrator';
        const password = (await question('Enter Admin Password (minimum 12 characters): ')).trim();
        if (!password || password.length < 12) {
            console.error('Error: Password must be at least 12 characters long.');
            process.exit(1);
        }
        console.log('\nHashing password with bcrypt (cost 12)...');
        const hash = await bcryptjs_1.default.hash(password, 12);
        const res = await client.query(`INSERT INTO admin_users (email, name, password_hash, role, is_active)
       VALUES ($1, $2, $3, 'super_admin', true)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         password_hash = EXCLUDED.password_hash,
         role = 'super_admin',
         is_active = true,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, email, name, role;`, [email, name, hash]);
        const user = res.rows[0];
        console.log(`\nSUCCESS: Super Admin "${user.name}" (${user.email}) registered successfully!`);
        console.log(`User ID: ${user.id}`);
        console.log('Role: super_admin\n');
    }
    catch (err) {
        console.error('Error creating admin user:', err.message);
    }
    finally {
        rl.close();
        await client.end();
    }
}
main();
