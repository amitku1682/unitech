# UNITECH CCTV — Technical Handover & Installation Guide

You receive two files. You need both:

| File | Contents |
|---|---|
| `unitech-handover-v1.0.zip` | The website software |
| `unitech-database-final.sql` | All website data: products, images, PDFs, categories, settings |

**The data file is loaded in Step 4 of section 3, before the website is started.** The website does not load it by itself.

---

## 1. System Overview & Technology Stack

- **Framework:** Next.js 14 (App Router, React 18, TypeScript)
- **Database:** PostgreSQL 16 via `pg` (node-postgres connection pool)
- **Styling:** Tailwind CSS with Lucide Icons
- **Image Processing:** Sharp (image optimization and EXIF metadata stripping)
- **Authentication:** Server-side sessions stored in PostgreSQL with HTTP-only, SameSite=Strict cookies; passwords hashed with bcrypt (cost factor 12)
- **Payments & Orders:** Direct UPI and bank transfer (NEFT/RTGS/IMPS) with mandatory UTR reference; server-side order calculation; admin payment verification. Razorpay is not used.
- **Infrastructure:** Docker and Docker Compose with a multi-stage production build
- **Storage:** All data and all uploaded files (images, PDFs) are stored in PostgreSQL. One database backup contains everything.

---

## 2. Key Features & Security

### 2.1 Orders and Payments
- The browser cart stores only product IDs and quantities; all prices, GST and totals are calculated on the server from the database.
- At checkout, a real order with its order number is created first. The UPI QR code is generated from that saved order: exact amount and order number (in the payment note), no merchant-only parameters.
- The customer pays by UPI or bank transfer and enters the UTR / transaction reference. The order is then "Pending verification".
- An admin confirms or rejects the payment in **Admin → Customer Orders & Payments**. Stock is reduced only when a payment is confirmed.
- Abandoned checkouts (older than 24 hours without UTR) are hidden by default and can be removed with **Clean Abandoned Drafts**.
- Duplicate UTR numbers are rejected.

### 2.2 Payment Settings
- **Admin → Payment Settings:** UPI ID, payee name, bank details, and a QR image (PNG/JPG, max 2 MB).
- The uploaded QR is read automatically; a warning appears if its UPI ID differs from the UPI ID entered.
- UPI ID, IFSC and account number formats are validated.
- Until Payment Settings are filled in, checkout shows a "please contact us on WhatsApp" message instead of payment details.

### 2.3 Admin Login & Security
- Hard-coded PINs and demo credentials were removed.
- Admin accounts and login sessions are stored in the database; sessions last 8 hours.
- Every admin page and admin API requires a valid login on the server.
- Login is blocked for 15 minutes after 5 wrong attempts.
- Security headers, CSRF protection and rate limits on public forms are active.

### 2.4 Content Management (all in the admin panel)
- Products, prices, stock, product image galleries (up to 6 photos)
- **Categories & Series** — new categories appear automatically in the menu, mobile menu, footer, catalogue filters, search and the homepage "Popular" tabs
- **Homepage Category Cards** — the large category cards on the homepage; each card is linked to a catalogue category
- Hero Cards Studio (homepage slides), Flash Sale Pop-up, Top Header Ticker (messages, speed, phone, WhatsApp)
- Catalogues & Datasheets (PDFs), Authorized Dealers, Google Reviews, About Page leadership
- Social & Platform Links, Customer Enquiries

### 2.5 Uploads
- Uploads are stored in the database (no server folders needed).
- Only PDF (documents) and JPG/PNG/WebP (images) are accepted; SVG is blocked. Limits: 10 MB documents, 5 MB images.

### 2.6 Email Settings
- **Admin → Email Settings:** SMTP host, port, username, app password, sender email and name, admin alert emails.
- The SMTP password is stored encrypted (requires `SETTINGS_ENCRYPTION_KEY` in `.env`) and is never shown again.
- **Send test email** checks the connection.
- Automatic emails: order received, payment confirmed, payment rejected (to the customer); new order and new enquiry (to the admin alert emails).
- Email Settings are also used for **"Forgot password?"** emails.

### 2.7 Admin Passwords
- **Forgot password:** login page → "Forgot password?" → a reset link is emailed (valid 30 minutes, works once). Requires Email Settings.
- **Change password:** admin header → "Change Password". Other devices are logged out.
- **Additional admins:** see Step 7 below.

---

## 3. Installation Guide (new server)

### Requirements
- Ubuntu 22.04 or 24.04 server (2 vCPU, 4 GB RAM recommended, 25 GB disk)
- Your domain's DNS A record pointing to the server's IP address
- Firewall: ports 22, 80 and 443 open

### Step 1 – Install Docker
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```
Log out and log in again, then check: `docker --version` and `docker compose version`.

### Step 2 – Upload and unpack
Upload both files to your home folder (for example with WinSCP), then run:
```bash
sudo apt-get install -y unzip
mkdir -p ~/unitech && unzip -q ~/unitech-handover-v1.0.zip -d ~/unitech
cd ~/unitech && ls migrations | tail -1
```
The last line must show `0014_admin_password_resets.sql`.

### Step 3 – Create the configuration file (.env)
Replace `unitechcctv.com` with your domain if it is different. Secure passwords and keys are generated automatically.
```bash
cd ~/unitech
DBPASS=$(openssl rand -hex 24)
cat > .env << EOF
COMPOSE_PROJECT_NAME=unitech
POSTGRES_USER=unitech_admin
POSTGRES_PASSWORD=$DBPASS
POSTGRES_DB=unitech_cctv_db
DATABASE_URL=postgres://unitech_admin:$DBPASS@unitech-db:5432/unitech_cctv_db
DATABASE_SSL=false
NODE_ENV=production
COOKIE_SECURE=true
PORT=3000
HOSTNAME=0.0.0.0
NEXT_PUBLIC_BASE_URL=https://unitechcctv.com
APP_BASE_URL=https://unitechcctv.com
SETTINGS_ENCRYPTION_KEY=$(openssl rand -hex 32)
ADMIN_SESSION_SECRET=$(openssl rand -hex 32)
EOF
chmod 600 .env
```
Keep a copy of this `.env` file in a password manager. It contains your database password and encryption keys. If `SETTINGS_ENCRYPTION_KEY` is lost or changed, re-enter the SMTP password in Email Settings.

### Step 4 – Start the database and load your data
```bash
cd ~/unitech
docker compose up -d unitech-db
sleep 15 && docker compose ps
docker exec -i unitech-postgres-db psql -q -v ON_ERROR_STOP=1 -U unitech_admin -d unitech_cctv_db < ~/unitech-database-final.sql && echo "DATA LOADED"
docker exec unitech-postgres-db psql -U unitech_admin -d unitech_cctv_db -c "SELECT count(*) AS products FROM products;"
```
The database must show "healthy", the load must print `DATA LOADED`, and the product count must be shown.
Load the data only once, into the new empty database.

### Step 5 – HTTPS (secure website)
Edit `docker-compose.yml` and change the website's port line from `- "80:3000"` to:
```yaml
      - "127.0.0.1:3000:3000"
```
Then install Caddy, which obtains and renews the free HTTPS certificate automatically (replace the domain if different):
```bash
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update && sudo apt-get install -y caddy
sudo tee /etc/caddy/Caddyfile > /dev/null << 'EOF'
unitechcctv.com, www.unitechcctv.com {
    reverse_proxy 127.0.0.1:3000
}
EOF
sudo systemctl reload caddy
```
**No domain yet?** Skip this step, keep `- "80:3000"`, and in `.env` set `COOKIE_SECURE=false` and both URLs to `http://<your-server-ip>`. Do Step 5 later when the domain is ready (then set `COOKIE_SECURE=true`, both URLs to `https://<your-domain>`, and run `docker compose up -d`).

### Step 6 – Build and start the website
```bash
cd ~/unitech
docker compose up -d --build
sleep 40 && docker compose ps
docker exec unitech-staging-web node scripts/migrate.js
curl -s -o /dev/null -w "health: %{http_code}\n" http://127.0.0.1:3000/api/health
```
Both containers must show "healthy", the migration must report all 14 migrations as already applied, and the health check must print `health: 200`.
If you skipped Step 5, check health with:
```bash
curl -s -o /dev/null -w "health: %{http_code}\n" http://localhost/api/health
```
Then open your website in a browser.
(The website container is named `unitech-staging-web`; this is only its internal name.)

### Step 7 – Create your admin account
```bash
docker exec -it unitech-staging-web node scripts/create-admin.js
```
Enter your email, name and a password of at least 12 characters (the password is not shown while typing – this is normal). Then log in at `https://<your-domain>/admin`.
For each additional staff member, run the same command with their email. If you see "permission denied", put `sudo` in front of the command.

### Step 8 – First-login setup (Admin panel)
1. **Email Settings:** SMTP host, port, username, app password, sender email and name, admin alert email. Click **Send test email**, then switch notifications on. Required for order emails and for "Forgot password?".
2. **Payment Settings:** UPI ID, payee name, bank details and QR code (PNG). Save, then place one test order, scan the QR with a UPI app (do not pay) and check the amount and order number. Reject the test order in Orders.
3. Check prices, contact details, social links, ticker texts and the two auto-generated PDFs in Catalogues (`dvr-storage-matrix.pdf`, `datasheet-power-supplies.pdf`).
4. Test **Forgot password?** once on the login page.

### Step 9 – Nightly backups (kept for 14 days)
```bash
mkdir -p ~/backups
(crontab -l 2>/dev/null; echo '0 2 * * * docker exec unitech-postgres-db pg_dump -U unitech_admin -d unitech_cctv_db | gzip > $HOME/backups/unitech-$(date +\%F).sql.gz && find $HOME/backups -name "unitech-*.sql.gz" -mtime +14 -delete') | crontab -
```
One backup contains everything (data, images and PDFs). Copy backups off the server regularly.

### Important rules
- **Never** run `docker compose down -v` or `docker volume rm` – they delete the database.
- Restart: `cd ~/unitech && docker compose restart`
- Updating to a new version: back up first, then `docker compose up -d --build`, then `docker exec unitech-staging-web node scripts/migrate.js`.
- Database changes are made only through new migration files; never edit an existing migration. Content (phone, ticker, payment, social links, categories) is changed in the admin panel.

### Troubleshooting
- "No such container": the website is not running → `cd ~/unitech && docker compose up -d`
- "Permission denied" on docker commands: put `sudo` in front of the command
- Login says "Invalid email or password": check spelling (passwords are case-sensitive); after 5 wrong attempts, login is blocked for 15 minutes
- No reset email: check spam, and that **Send test email** works in Email Settings

---

## 4. Database Migrations (reference)
`scripts/migrate.js` applies `migrations/0001` to `0014` in order and skips migrations already applied. The provided data file already contains all 14, so on a new installation it reports "Already Applied" for each.

| Migration | Purpose |
|---|---|
| 0001_baseline | Core tables (products, documents, enquiries, dealers, banners, hero slides, reviews, uploaded files) |
| 0002_admin_auth | Admin accounts and sessions |
| 0003_orders_merge | Single orders table with UTR and payment verification |
| 0004_about_leadership | About page leadership |
| 0005_indexes_constraints | Indexes and price/stock checks |
| 0006_timestamptz | Time-zone aware timestamps |
| 0007_payment_settings | Payment settings and QR |
| 0008_social_links | Social and platform links |
| 0009_categories | Categories and series |
| 0010_ticker_settings | Top header ticker settings |
| 0011_uploaded_files_types | Upload date and size column types |
| 0012_category_cards_link | Homepage category cards linked to categories |
| 0013_email_settings | Email settings and email logs |
| 0014_admin_password_resets | Password reset tokens |

---

## 5. Client Checklist
- [ ] Install following section 3 (data loaded in Step 4, before starting the website)
- [ ] HTTPS active on your domain (Step 5), `COOKIE_SECURE=true`
- [ ] Admin account created (Step 7)
- [ ] Email Settings configured and test email received
- [ ] Payment Settings configured and checkout QR tested (no payment)
- [ ] "Forgot password?" tested once
- [ ] Prices, contact details, social links and ticker texts checked
- [ ] Auto-generated PDFs reviewed (`dvr-storage-matrix.pdf`, `datasheet-power-supplies.pdf`)
- [ ] Privacy policy page added (the website collects customer contact details)
- [ ] Nightly backups enabled (Step 9) and copied off the server regularly
- [ ] Plan a future Next.js upgrade (version 14.2 has known issues that are mitigated but not fully fixed)
