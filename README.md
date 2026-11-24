# UNITECH CCTV — Website & Admin Control Panel

B2B e-commerce and distributor website for **Unitech Security Systems Pvt. Ltd.** Built with Next.js 15.5.29 (App Router, React 19), TypeScript, Tailwind CSS and PostgreSQL (node-postgres `pg`), packaged with Docker (Node.js 24).

**Installing on a server?** Follow **section 3 of `HANDOVER_NOTES.md`** step by step. The website data file (`unitech-database-final.sql`) must be loaded before the website is started.

---

## 1. Requirements

- **Docker** and **Docker Compose v2** (production)
- **PostgreSQL 16** (runs inside Docker in production)
- **Node.js 22 or 24** and npm (only for local development; production runs Node.js 24 inside Docker)
- Server: 2 vCPU, 1–2 GB RAM with a 2 GB swap file, 40 GB disk

---

## 2. Architecture

- **Framework:** Next.js 15.5.29 (App Router, server components and API routes), React 19
- **Database:** PostgreSQL via `pg` with versioned SQL migrations in `migrations/` (applied by `scripts/migrate.js`)
- **Authentication:** bcrypt (cost 12) passwords and database-stored sessions with `HttpOnly`, `SameSite=Strict` cookies (`Secure` when `COOKIE_SECURE=true`)
- **Payments:** UPI and bank transfer with UTR reference, verified by an admin. Set bank details and QR in **Admin → Payment Settings**.
- **Email:** SMTP configured in **Admin → Email Settings** (password encrypted with `SETTINGS_ENCRYPTION_KEY`)
- **Uploads:** all images and PDFs are stored in the PostgreSQL `uploaded_files` table (no server folders); image processing with sharp 0.35
- **Configuration:** all variables in `.env` are passed to the website container automatically (`env_file` in `docker-compose.yml`)

---

## 3. Backup

All data and uploaded files are inside PostgreSQL, so one command backs up everything:

```bash
docker exec unitech-postgres-db pg_dump -U unitech_admin -d unitech_cctv_db > backup_complete.sql
```

Nightly automatic backups: see Step 9 in `HANDOVER_NOTES.md`.

---

## 4. Local Development (developers only)

### Step 1: Install dependencies
```bash
npm install
```

### Step 2: Configure environment variables
```bash
cp .env.example .env
```
Edit `.env`: set `DATABASE_URL` to your local PostgreSQL (host `localhost`), `COOKIE_SECURE=false` for plain HTTP, and generate `SETTINGS_ENCRYPTION_KEY` and `ADMIN_SESSION_SECRET` (e.g. `openssl rand -hex 32`).

### Step 3: Apply database migrations
```bash
node scripts/migrate.js
```

### Step 4: Create an admin account
```bash
node scripts/create-admin.js
```

### Step 5: Start the development server
```bash
npm run dev
```
- Storefront: http://localhost:3000
- Admin panel: http://localhost:3000/admin

---

## 5. Production (Docker)

**Follow section 3 of `HANDOVER_NOTES.md`.** Summary of how it works:

1. `docker compose` starts PostgreSQL 16 (`unitech-postgres-db`, named volume `postgres_data`, reachable only from the server itself) and the website (`unitech-staging-web`, Node.js 24, runs as an unprivileged user).
2. The website is published on port **80** (container port 3000). With HTTPS (Caddy), it is changed to `127.0.0.1:3000:3000` and Caddy serves ports 80/443.
3. Commands that need Node run **inside** the website container, for example:
   ```bash
   docker exec unitech-staging-web node scripts/migrate.js
   docker exec -it unitech-staging-web node scripts/create-admin.js
   ```

**Never** run `docker compose down -v` or `docker volume rm` — they delete the database.

---

## 6. Security

- Server-side login checks on every admin page and admin API; login blocked for 15 minutes after 5 wrong attempts
- CSRF origin checks on admin changes; rate limits on public forms (enquiries, orders, search log, flash-sale claims)
- Security headers: Content-Security-Policy, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`; HSTS only over HTTPS
- Uploads: file signature checks (PDF, PNG, JPEG, WebP), SVG blocked, 10 MB documents / 5 MB images, random file names
- Protection against path traversal on file download routes
- Start-up warning in the logs if a required environment variable is missing (values are never logged)

### Admin passwords
- **Forgot password:** "Forgot password?" on the `/admin` login page emails a single-use reset link (valid 30 minutes). Requires Email Settings. Limited to 3 requests per 15 minutes.
- **Change password:** "Change Password" in the admin header; other sessions are logged out. Limited to 5 attempts per 15 minutes.
- **Additional admins:** `docker exec -it unitech-staging-web node scripts/create-admin.js`

---

## 7. Rules for Database Changes

- Never edit a migration file that has already been applied. Add a new numbered migration instead (the latest is `0015`).
- Content the admin can edit (phone, ticker, payment details, social links, categories) is changed in the admin panel, not in code.

---

## 8. Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Local development server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Runs the production build |
| `npm run lint` | ESLint checks |
| `node scripts/migrate.js` | Applies pending SQL migrations (inside Docker: `docker exec unitech-staging-web node scripts/migrate.js`) |
| `node scripts/create-admin.js` | Creates an admin account (inside Docker: `docker exec -it unitech-staging-web node scripts/create-admin.js`) |

---

## 9. License

Proprietary software developed for **Unitech Security Systems Pvt. Ltd.** All rights reserved.
