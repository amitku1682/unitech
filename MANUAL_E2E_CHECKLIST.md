# UNITECH CCTV — Manual Testing Checklist

Use this checklist to test the website after installation (see section 3 of `HANDOVER_NOTES.md`), on desktop (Chrome/Edge/Firefox, 1280px+) and on a phone (Android Chrome and iPhone Safari).

Replace `<your-domain>` with your website address (or `http://<your-server-ip>` before HTTPS is set up).

---

## Before you start

- [ ] Website opens at `https://<your-domain>` and the admin login at `https://<your-domain>/admin`
- [ ] Health check returns 200: `curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/api/health` (or `http://localhost/api/health` without HTTPS)
- [ ] `docker exec unitech-staging-web node scripts/migrate.js` reports all 14 migrations as already applied
- [ ] Admin account created with `docker exec -it unitech-staging-web node scripts/create-admin.js`
- [ ] **Email Settings** configured (Admin → Email Settings) and a test email received
- [ ] **Payment Settings** configured (Admin → Payment Settings)
- [ ] **Social & Platform Links** checked (Admin → Social & Platform Links)

---

## 1. Header & navigation

### Desktop
- [ ] Clicking the logo opens the homepage
- [ ] **Products** opens the mega menu with the categories from Admin → Categories & Series (CCTV Cameras, DVR & NVR Recorders, Networking & PoE, Surveillance Cables, DVR & Server Racks, Power Supplies & SMPS, IT Accessories, plus any you add)
- [ ] Mega menu shows series and products with real prices; clicking a category opens the catalogue filtered to it
- [ ] **Top header ticker** shows the active messages and rotates at the speed set in the admin
- [ ] Phone number in the top bar is **+91 87003 17239** and tapping/clicking it starts a call
- [ ] WhatsApp link opens WhatsApp with the company number
- [ ] **Search** icon opens the search panel; typing "4mp", "dvr", "cable" or a model code shows matching products; popular search chips work; Esc closes the panel

### Mobile
- [ ] Menu icon opens a **full-screen** menu (nothing of the page shows through)
- [ ] Tapping a category shows its series and products and a "View all" button; the back button returns to the category list
- [ ] Tapping a product opens its page and closes the menu
- [ ] **Call** and **WhatsApp** buttons are at the bottom of the menu and work
- [ ] The X button closes the menu
- [ ] Cart icon badge shows the number of items in the cart

---

## 2. Homepage hero slides
- [ ] All 4 slides show and change automatically; arrows and dots work
- [ ] Scan / focus animation plays and finishes with a sharp image
- [ ] Product images on slides 2 and 4 have no white box around them
- [ ] Slide 4 (product sale) shows the product, sale price, crossed-out MRP and countdown set in Admin → Hero Cards Studio
- [ ] Each slide's buttons open the correct page

---

## 3. Homepage category cards
- [ ] Cards show their background images and titles
- [ ] **Desktop:** arrow buttons, mouse wheel and keyboard ← → move the row one card at a time; hovering a card blurs the image and shows the description and details
- [ ] Counter (e.g. "01–03 / 06") and progress bar follow the scrolling
- [ ] **Mobile:** swipe moves the cards
- [ ] Clicking a card opens the catalogue filtered to its linked category (e.g. the racks card opens racks)

---

## 4. "Popular with CCTV Installers & Dealers"
- [ ] One tab per active category that has products, plus **Bestsellers**
- [ ] Each tab shows the right products and count
- [ ] The button below follows the selected tab and opens that category in the catalogue

---

## 5. Flash sale pop-up (if a flash sale is published)
- [ ] Desktop: centred pop-up; mobile: bottom sheet
- [ ] Countdown and stock bar are shown
- [ ] The main button works
- [ ] Closing (X, outside click or Esc) works and the page scrolls normally afterwards

---

## 6. Catalogue (`/catalogue`)
- [ ] Category and series filters show the right products; "all" resets the filter
- [ ] Sorting and the search box work; a search with no results shows an empty-state message
- [ ] Product cards show image, name, model code and price; "Add" puts the item in the cart
- [ ] Clicking a product opens its product page

---

## 7. Product page
- [ ] Main image and up to 6 gallery photos; clicking a thumbnail changes the main image; zoom / full-screen works on desktop, swipe works on mobile
- [ ] Specifications are shown
- [ ] Price and dealer/volume prices are shown
- [ ] Datasheet download (if the product has one) opens the PDF
- [ ] Adding to cart works

---

## 8. Kit builder (`/kit-builder`)
- [ ] Options can be changed and the item list and total update
- [ ] Prices match the catalogue prices
- [ ] The kit can be added to the cart

---

## 9. Cart & checkout
### Cart
- [ ] Items, quantities, unit prices, subtotal, GST 18% and total are correct (example: 1 × ₹10 → ₹10.00 + ₹1.80 = ₹11.80)
- [ ] Changing quantities or removing items updates the totals

### Checkout
- [ ] **Step 1:** customer and address form; required fields are checked; totals match the cart exactly
- [ ] **Step 2:** shows "Scan to Pay ₹<total>" and a real order number (UT-ORD-…)
- [ ] Scan the QR with a UPI app (Google Pay, PhonePe) — **do not pay**: the payee, the **exact amount** and "Order UT-ORD-…" in the note must match the screen, with no warning in the app
- [ ] Bank transfer option shows the account details with copy buttons
- [ ] If Payment Settings are empty, checkout shows "Online payment details are being updated — please contact us on WhatsApp"
- [ ] Enter a test UTR (6–30 letters/digits) and place the order: the confirmation page shows the order number, the UTR and the text "Our team will verify your payment against our bank statement within business hours and contact you by phone/WhatsApp…"
- [ ] Using the same UTR again is rejected
- [ ] In Admin → Customer Orders & Payments, the test order shows "Pending verification" — then **reject** it

---

## 10. Enquiry form (`/inquiry`, `/contact`)
- [ ] Form validates phone and email
- [ ] Submitting shows a success message and the enquiry appears in Admin → Customer Enquiries
- [ ] Delete the test enquiry afterwards

---

## 11. Downloads, dealers, reviews, about
- [ ] Support / downloads page: PDFs open or download
- [ ] Dealers page lists the dealers from the admin
- [ ] Reviews section shows the reviews from the admin
- [ ] About page shows the leadership entries from the admin (Amit Arora, Vineeta Arora)

---

## 12. Footer
- [ ] Category links come from the categories (inactive or hidden ones are not shown)
- [ ] Social icons open the correct pages (from Admin → Social & Platform Links); empty or inactive links are hidden
- [ ] **No "Admin Portal" link** anywhere in the footer

---

## 13. Admin panel (`/admin`)

### 13.1 Login
- [ ] Wrong email or password shows "Invalid email or password"
- [ ] After 5 wrong attempts, login is blocked for 15 minutes
- [ ] Correct login opens the admin panel; sessions last 8 hours
- [ ] **Sign Out** logs out; the browser Back button does not show admin data

### 13.2 Products (Product Images & Models / Pricing & Stock Ticker)
- [ ] "Add New Hardware Product" opens an **empty** form (no demo values)
- [ ] Category dropdown lists the categories; "＋ New category…" creates one and selects it; series dropdown follows the category and "＋ New series…" works
- [ ] Price rules are checked (dealer ≤ online price ≤ MRP)
- [ ] Editing a price or stock updates the product page
- [ ] Gallery: up to 6 photos, reorder, choose the cover; non-image files are rejected
- [ ] Deleting a test product removes it from the site

### 13.3 Categories & Series
- [ ] Add, edit, reorder, activate/deactivate categories; cover image upload; show in menu / footer toggles
- [ ] Add, rename, reorder, delete series
- [ ] A category with products cannot be deleted (deactivate it instead)
- [ ] A new category with products appears in the menu, mobile menu, footer, catalogue filter, search and Popular tabs without a restart; deactivating it removes it everywhere

### 13.4 Homepage Category Cards
- [ ] Edit, reorder, show/hide cards
- [ ] "＋ Add Category Card": title, texts, background image, **linked catalogue category** — the new card appears on the homepage in the same design and opens its category
- [ ] Delete a test card

### 13.5 Sales & Ticker Banners (Top Header Ticker)
- [ ] Add, edit, reorder, activate/deactivate and schedule messages
- [ ] Master on/off, speed, phone, plant desk text and WhatsApp label can be changed and appear in the top bar
- [ ] All messages off → no message text in the top bar; master off → the strip is hidden

### 13.6 Hero Cards Studio
- [ ] Edit the 4 slides (texts, images, buttons) and slide 4 product sale; changes appear on the homepage

### 13.7 Flash Sale Pop-up
- [ ] Edit, publish and unpublish; the pop-up follows

### 13.8 Catalogues & Datasheets
- [ ] Upload a PDF, set it live/hidden, delete a test PDF
- [ ] Review the two auto-generated PDFs (`dvr-storage-matrix.pdf`, `datasheet-power-supplies.pdf`)

### 13.9 Customer Orders & Payments
- [ ] Orders list shows order number, customer, items with correct prices (never ₹0), totals and UTR
- [ ] **Verify & Confirm Payment** → status confirmed and stock reduced
- [ ] **Reject** works
- [ ] Order status can be changed (processing, dispatched, delivered)
- [ ] Abandoned drafts are hidden by default; **Clean Abandoned Drafts** removes old ones

### 13.10 Customer Enquiries
- [ ] Enquiries are listed with their details; test entries can be deleted

### 13.11 Payment Settings
- [ ] Save UPI ID, payee name and bank details; invalid UPI ID / IFSC / account number is rejected with a message
- [ ] Upload a QR (PNG): it saves, and a warning appears if its UPI ID differs from the entered one
- [ ] Checkout uses the new details (test with a UPI app, do not pay)

### 13.12 Email Settings
- [ ] Save SMTP details; after reloading, the password stays hidden
- [ ] **Send test email** arrives (check spam too)
- [ ] With notifications on: placing an order sends "Order received" to the customer and an alert to the admin email; confirming payment sends "Payment confirmed"

### 13.13 Social & Platform Links, Dealers, Reviews, About Page
- [ ] Add, edit, reorder, hide; wrong-domain social links are rejected; changes appear on the website

### 13.14 Passwords
- [ ] **Forgot password?** on the login page: the email arrives, the link starts with your website address, the link works once and expires after 30 minutes; old sessions are logged out
- [ ] **Change Password** in the header: a wrong current password is rejected; a new password (12+ characters) works; other devices are logged out

---

## 14. Data safety
- [ ] `docker compose restart` → all data, images and settings are still there
- [ ] `docker compose up -d --build` (rebuild) → all data, images, settings and admin logins are still there
- [ ] Nightly backup files appear in `~/backups` (from Step 9 of `HANDOVER_NOTES.md`)
- [ ] **Never** run `docker compose down -v` or `docker volume rm`

---

## Sign-off

| Role | Name | Date | Result |
| :--- | :--- | :--- | :--- |
| Tester | | | [ ] PASS / [ ] FAIL |
| Developer | | | [ ] PASS / [ ] FAIL |
| Client | | | [ ] APPROVED |
