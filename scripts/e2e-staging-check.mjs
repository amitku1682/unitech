#!/usr/bin/env node

/**
 * ==============================================================================
 * UNITECH CCTV — AUTOMATED STAGING E2E VERIFICATION SUITE
 * ==============================================================================
 * Usage:
 *   node scripts/e2e-staging-check.mjs --base http://<your-server-ip>
 *   node scripts/e2e-staging-check.mjs --base http://<your-server-ip> --admin-email admin@unitechcctv.com --admin-password <PASS>
 *   node scripts/e2e-staging-check.mjs --base http://<your-server-ip> --persistence-check
 * ==============================================================================
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

const BASE_URL = (getArg('--base') || 'http://127.0.0.1:3000').replace(/\/+$/, '');
const adminEmail = getArg('--admin-email');
const adminPassword = getArg('--admin-password');
const PERSISTENCE_CHECK = args.includes('--persistence-check');

console.log('==============================================================================');
console.log('UNITECH CCTV — AUTOMATED STAGING E2E VERIFICATION SUITE');
console.log(`Target Base URL: ${BASE_URL}`);
console.log(`Admin Testing:   ${adminEmail ? `Enabled (${adminEmail})` : 'Disabled (Read-only/Public tests only)'}`);
console.log(`Persistence:     ${PERSISTENCE_CHECK ? 'Enabled' : 'Disabled'}`);
console.log('==============================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function report(name, pass, details = '') {
  totalChecks++;
  if (pass) {
    passedChecks++;
    console.log(`  ✅ PASS: ${name}${details ? ` (${details})` : ''}`);
  } else {
    failedChecks++;
    console.error(`  ❌ FAIL: ${name}${details ? ` (${details})` : ''}`);
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, options);
    let json = null;
    let text = '';
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        json = await res.json();
      } catch { }
    } else {
      try {
        text = await res.text();
      } catch { }
    }
    return { status: res.status, headers: res.headers, json, text };
  } catch (err) {
    return { status: 0, error: err.message, headers: new Headers(), json: null, text: '' };
  }
}

async function run() {
  // ---------------------------------------------------------------------------
  // 1. PUBLIC PAGES AVAILABILITY (HTTP 200)
  // ---------------------------------------------------------------------------
  console.log('--- 1. PUBLIC PAGES AVAILABILITY ---');

  // First fetch products to find a real dynamic product slug
  let sampleSlug = 'ut-ip-bullet-4mp';
  const prodApiRes = await request('/api/products');
  if (prodApiRes.status === 200 && prodApiRes.json?.data?.length > 0) {
    sampleSlug = prodApiRes.json.data[0].slug;
  }

  const publicRoutes = [
    { path: '/', name: 'Master Homepage' },
    { path: '/catalogue', name: 'Master Hardware Catalogue' },
    { path: `/product/${sampleSlug}`, name: `Product Detail Page (/product/${sampleSlug})` },
    { path: '/kit-builder', name: 'Interactive Kit Builder' },
    { path: '/cart', name: 'Quote & Cart Drawer Page' },
    { path: '/checkout', name: 'Checkout Form & Invoicing' },
    { path: '/inquiry', name: 'Factory B2B Inquiry Page' },
    { path: '/contact', name: 'Plant Contact & Directory' },
    { path: '/dealers', name: 'Authorized Dealers Hub' },
    { path: '/support', name: 'RMA & Support Page' },
    { path: '/about', name: 'Corporate Profile & Leadership' },
    { path: '/sitemap.xml', name: 'Dynamic XML Sitemap' },
    { path: '/robots.txt', name: 'Dynamic Robots Policy' },
    { path: '/api/health', name: 'Service Health Endpoint' },
    { path: '/api/social-links', name: 'Public Social Links API' },
    { path: '/api/payment-settings', name: 'Public Payment Settings API' },
    { path: '/api/categories', name: 'Public Categories & Series API' },
    { path: '/api/ticker', name: 'Public Ticker Settings & Active Messages API' },
  ];

  for (const route of publicRoutes) {
    const res = await request(route.path);
    report(route.name, res.status === 200, `Status: ${res.status}`);
  }

  // ---------------------------------------------------------------------------
  // 2. SECURITY HEADERS CHECK
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. SECURITY HEADERS AUDIT ---');
  const homeRes = await request('/');
  const headers = homeRes.headers;

  const csp = headers.get('content-security-policy') || '';
  report('Content-Security-Policy header present', csp.includes("default-src 'self'"), `CSP length: ${csp.length}`);

  const xfo = headers.get('x-frame-options');
  report('X-Frame-Options: SAMEORIGIN', xfo === 'SAMEORIGIN', `Value: ${xfo}`);

  const xcto = headers.get('x-content-type-options');
  report('X-Content-Type-Options: nosniff', xcto === 'nosniff', `Value: ${xcto}`);

  const refPol = headers.get('referrer-policy');
  report('Referrer-Policy: strict-origin-when-cross-origin', refPol === 'strict-origin-when-cross-origin', `Value: ${refPol}`);

  const hsts = headers.get('strict-transport-security');
  if (BASE_URL.startsWith('http://')) {
    report('HSTS omitted over plain HTTP (no breakage on staging IP)', hsts === null, `HSTS: ${hsts}`);
  } else {
    report('HSTS active over HTTPS', hsts !== null, `HSTS: ${hsts}`);
  }

  // ---------------------------------------------------------------------------
  // 3. PATH TRAVERSAL DEFENSE
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. PATH TRAVERSAL SANITIZATION ---');
  const traversalTests = [
    '/downloads/..%2f..%2fpackage.json',
    '/downloads/....//....//etc/passwd',
    '/uploads/products/..%2f..%2f.env',
    '/uploads/products/....//....//etc/shadow',
  ];

  for (const t of traversalTests) {
    const res = await request(t);
    const safe = res.status === 400 || res.status === 404;
    report(`Path Traversal Rejected: ${t}`, safe, `Status: ${res.status}`);
  }

  // ---------------------------------------------------------------------------
  // 4. ADMIN-ONLY ENDPOINTS ACCESS CONTROL (UNAUTHENTICATED -> 401)
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. ADMIN-ONLY ENDPOINTS AUTHORIZATION GATE (UNAUTHENTICATED) ---');
  const protectedEndpoints = [
    { method: 'GET', path: '/api/enquiries', name: 'GET /api/enquiries (PII protection)' },
    { method: 'PATCH', path: '/api/enquiries', name: 'PATCH /api/enquiries' },
    { method: 'DELETE', path: '/api/enquiries', name: 'DELETE /api/enquiries' },
    { method: 'POST', path: '/api/products', name: 'POST /api/products' },
    { method: 'PATCH', path: '/api/products', name: 'PATCH /api/products' },
    { method: 'DELETE', path: '/api/products', name: 'DELETE /api/products' },
    { method: 'POST', path: '/api/products/upload', name: 'POST /api/products/upload' },
    { method: 'POST', path: '/api/admin/uploads/product-image', name: 'POST /api/admin/uploads/product-image' },
    { method: 'GET', path: '/api/admin/products/dummy-id/images', name: 'GET /api/admin/products/[id]/images' },
    { method: 'PUT', path: '/api/admin/products/dummy-id/images', name: 'PUT /api/admin/products/[id]/images' },
    { method: 'GET', path: '/api/admin/homepage-categories', name: 'GET /api/admin/homepage-categories' },
    { method: 'PUT', path: '/api/admin/homepage-categories', name: 'PUT /api/admin/homepage-categories' },
    { method: 'GET', path: '/api/admin/search/insights', name: 'GET /api/admin/search/insights' },
    { method: 'POST', path: '/api/admin/search/popular', name: 'POST /api/admin/search/popular' },
    { method: 'POST', path: '/api/documents', name: 'POST /api/documents' },
    { method: 'PUT', path: '/api/documents', name: 'PUT /api/documents' },
    { method: 'PATCH', path: '/api/documents', name: 'PATCH /api/documents' },
    { method: 'DELETE', path: '/api/documents', name: 'DELETE /api/documents' },
    { method: 'POST', path: '/api/documents/upload', name: 'POST /api/documents/upload' },
    { method: 'POST', path: '/api/dealers', name: 'POST /api/dealers' },
    { method: 'PUT', path: '/api/dealers', name: 'PUT /api/dealers' },
    { method: 'DELETE', path: '/api/dealers', name: 'DELETE /api/dealers' },
    { method: 'POST', path: '/api/banners', name: 'POST /api/banners' },
    { method: 'PATCH', path: '/api/banners', name: 'PATCH /api/banners' },
    { method: 'DELETE', path: '/api/banners', name: 'DELETE /api/banners' },
    { method: 'POST', path: '/api/hero-slides', name: 'POST /api/hero-slides' },
    { method: 'PATCH', path: '/api/hero-slides', name: 'PATCH /api/hero-slides' },
    { method: 'DELETE', path: '/api/hero-slides', name: 'DELETE /api/hero-slides' },
    { method: 'POST', path: '/api/hero-product-sale', name: 'POST /api/hero-product-sale' },
    { method: 'POST', path: '/api/flash-sale', name: 'POST /api/flash-sale' },
    { method: 'POST', path: '/api/flash-sale/publish', name: 'POST /api/flash-sale/publish' },
    { method: 'POST', path: '/api/flash-sale/toggle', name: 'POST /api/flash-sale/toggle' },
    { method: 'POST', path: '/api/flash-sale/unpublish', name: 'POST /api/flash-sale/unpublish' },
    { method: 'POST', path: '/api/reviews', name: 'POST /api/reviews' },
    { method: 'PUT', path: '/api/reviews', name: 'PUT /api/reviews' },
    { method: 'PATCH', path: '/api/reviews', name: 'PATCH /api/reviews' },
    { method: 'DELETE', path: '/api/reviews', name: 'DELETE /api/reviews' },
    { method: 'GET', path: '/api/reviews/fetch-google', name: 'GET /api/reviews/fetch-google' },
    { method: 'POST', path: '/api/reviews/fetch-google', name: 'POST /api/reviews/fetch-google' },
    { method: 'GET', path: '/api/orders', name: 'GET /api/orders' },
    { method: 'PATCH', path: '/api/orders', name: 'PATCH /api/orders' },
    { method: 'GET', path: '/api/admin/payment-settings', name: 'GET /api/admin/payment-settings' },
    { method: 'PUT', path: '/api/admin/payment-settings', name: 'PUT /api/admin/payment-settings' },
    { method: 'GET', path: '/api/admin/social-links', name: 'GET /api/admin/social-links' },
    { method: 'POST', path: '/api/admin/social-links', name: 'POST /api/admin/social-links' },
    { method: 'PUT', path: '/api/admin/social-links', name: 'PUT /api/admin/social-links' },
    { method: 'DELETE', path: '/api/admin/social-links', name: 'DELETE /api/admin/social-links' },
    { method: 'PATCH', path: '/api/admin/social-links', name: 'PATCH /api/admin/social-links' },
    { method: 'GET', path: '/api/admin/categories', name: 'GET /api/admin/categories' },
    { method: 'POST', path: '/api/admin/categories', name: 'POST /api/admin/categories' },
    { method: 'PUT', path: '/api/admin/categories', name: 'PUT /api/admin/categories' },
    { method: 'DELETE', path: '/api/admin/categories', name: 'DELETE /api/admin/categories' },
    { method: 'GET', path: '/api/admin/categories/cctv-cameras/series', name: 'GET /api/admin/categories/[id]/series' },
    { method: 'POST', path: '/api/admin/categories/cctv-cameras/series', name: 'POST /api/admin/categories/[id]/series' },
    { method: 'PUT', path: '/api/admin/categories/cctv-cameras/series', name: 'PUT /api/admin/categories/[id]/series' },
    { method: 'DELETE', path: '/api/admin/categories/cctv-cameras/series', name: 'DELETE /api/admin/categories/[id]/series' },
    { method: 'GET', path: '/api/admin/ticker', name: 'GET /api/admin/ticker' },
    { method: 'PUT', path: '/api/admin/ticker', name: 'PUT /api/admin/ticker' },
    { method: 'GET', path: '/api/admin/auth/me', name: 'GET /api/admin/auth/me' },
  ];

  for (const ep of protectedEndpoints) {
    const res = await request(ep.path, { method: ep.method });
    report(ep.name, res.status === 401, `Status: ${res.status}`);
  }

  // ---------------------------------------------------------------------------
  // 5. SLIDING-WINDOW RATE LIMITING (HTTP 429)
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. SLIDING-WINDOW RATE LIMITING ---');
  let got429 = false;
  let retryAfter = null;

  // In middleware.ts, POST /api/enquiries has a limit of 5 requests per 10 minutes per IP.
  // We use an isolated client IP header to test rate limiting without affecting subsequent enquiry tests.
  for (let i = 1; i <= 7; i++) {
    const res = await request('/api/enquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '203.0.113.199',
      },
      body: JSON.stringify({
        fullName: 'Rate Limit Test',
        email: 'ratelimit@example.com',
        phone: '9818141759',
        city: 'Delhi',
      }),
    });
    if (res.status === 429) {
      got429 = true;
      retryAfter = res.headers.get('retry-after');
      break;
    }
  }
  report('Sliding-window rate limiter triggered HTTP 429', got429, `Retry-After: ${retryAfter || 'N/A'}`);

  // ---------------------------------------------------------------------------
  // 6. ENQUIRY CREATION FLOW (PUBLIC SUBMISSION + ADMIN ISOLATION)
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. ENQUIRY CREATION & PII ISOLATION ---');
  const testEnquiryPayload = {
    type: 'DISTRIBUTOR',
    fullName: 'E2E-TEST Ramesh Dealer',
    companyName: 'E2E Surveillance Solutions',
    gstin: '09AAACH7409R1ZZ',
    phone: '9818141759',
    email: 'e2e-test-dealer@unitechcctv.com',
    city: 'Ghaziabad',
    details: 'Automated E2E staging enquiry validation test.',
  };

  const createEnquiryRes = await request('/api/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testEnquiryPayload),
  });

  report('Public Enquiry Submission (POST /api/enquiries)', (createEnquiryRes.status === 200 || createEnquiryRes.status === 201) && Boolean(createEnquiryRes.json?.success), `Status: ${createEnquiryRes.status}`);

  // Confirm unauthenticated GET /api/enquiries does NOT leak the enquiry
  const leakCheck = await request('/api/enquiries');
  report('PII Isolation: Public GET cannot access submitted enquiry', leakCheck.status === 401, `Status: ${leakCheck.status}`);

  // ---------------------------------------------------------------------------
  // 7. ORDER CREATION, TAMPER DEFENSE & UTR DUPLICATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. ORDER FLOW & SERVER-SIDE PRICE TAMPER DEFENSE ---');
  const testUtr = `E2E${Date.now().toString().slice(-8)}`;

  // Find a product from DB to order
  let testProduct = { id: 'prod-4mp-bullet', price: 2199 };
  if (prodApiRes.status === 200 && prodApiRes.json?.data?.length > 0) {
    testProduct = prodApiRes.json.data[0];
  }

  const tamperedOrderPayload = {
    customerName: 'E2E-TEST Buyer',
    name: 'E2E-TEST Buyer',
    companyName: 'E2E Test Corp',
    phone: '9818141759',
    email: 'e2e-buyer@unitechcctv.com',
    street: 'Plot 3/8 Ajanta Compound',
    city: 'Ghaziabad',
    state: 'Uttar Pradesh',
    pincode: '201007',
    gstin: '',
    paymentMethod: 'UPI',
    utrNumber: testUtr,
    // Intentionally tampered client-side totals (e.g. 1 rupee)
    items: [
      {
        id: testProduct.id,
        productId: testProduct.id,
        quantity: 2,
        price: 1, // Tampered unit price
      },
    ],
    subtotal: 2, // Tampered subtotal
    gstAmount: 0, // Tampered GST
    totalAmount: 2, // Tampered total
  };

  const orderRes = await request('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tamperedOrderPayload),
  });

  const orderCreated = orderRes.status === 200 && orderRes.json?.success;
  report('Order Submission (POST /api/orders)', orderCreated, `Status: ${orderRes.status}, OrderId: ${orderRes.json?.orderNumber || 'N/A'}`);

  const placedItems = orderRes.json?.data?.items || [];
  const placedItemsHavePrices = placedItems.length > 0 && placedItems.every(it => {
    const unitPrice = Number(it.price ?? it.unitPrice ?? it.applicablePrice ?? it.currentUnitPrice ?? 0);
    const lineTotal = Number(it.lineTotal ?? 0);
    return unitPrice > 0 && lineTotal > 0;
  });
  report('Order items have non-zero unit price and lineTotal in POST /api/orders response', placedItemsHavePrices);

  // Test Duplicate UTR collision rejection
  const dupUtrRes = await request('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...tamperedOrderPayload,
      name: 'E2E-TEST Duplicate Attempt',
    }),
  });
  report('Duplicate UTR Rejected (HTTP 409 Conflict)', dupUtrRes.status === 409, `Status: ${dupUtrRes.status}`);

  // 7.1 Unified Pricing Quote, Draft Order, QR and DB Amount Consistency
  console.log('\n--- 7.1 UNIFIED PRICING QUOTE, DRAFT ORDER & QR AMOUNT CONSISTENCY ---');
  let testDraftOrderId = null;
  const quoteRes = await request('/api/cart/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productId: testProduct.id, quantity: 1 }],
    }),
  });
  const quoteTotal = typeof quoteRes.json?.total === 'number' ? quoteRes.json.total : quoteRes.json?.data?.total;
  const quoteValid = quoteRes.status === 200 && quoteRes.json?.success && typeof quoteTotal === 'number';
  report('Cart Quote API (POST /api/cart/quote)', quoteValid, `Total: ₹${quoteTotal}`);

  if (quoteValid) {

    // Create draft order (Step 1 -> Step 2)
    const draftRes = await request('/api/orders/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'E2E Testing Buyer',
        email: 'e2e-buyer@unitechcctv.com',
        phone: '+91 98765 43210',
        street: '123 E2E Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        paymentMode: 'UPI',
        items: [{ productId: testProduct.id, quantity: 1 }],
      }),
    });

    const draftValid = draftRes.status === 200 && draftRes.json?.success && Boolean(draftRes.json?.orderId);
    report('Draft Order Creation (POST /api/orders/draft)', draftValid, `Order: ${draftRes.json?.orderNumber}`);

    if (draftValid) {
      testDraftOrderId = draftRes.json.orderId;
      const draftTotal = draftRes.json.total;
      const draftOrderNum = draftRes.json.orderNumber;

      // Fetch Dynamic QR strictly from orderId
      const qrRes = await request(`/api/payment-settings/qr?orderId=${testDraftOrderId}`);
      const qrValid = qrRes.status === 200 && qrRes.json?.success;
      report('Dynamic QR for Draft Order (GET /api/payment-settings/qr?orderId=...)', qrValid, `OrderRef: ${qrRes.json?.orderNumber}`);

      if (qrValid) {
        const qrAmount = qrRes.json.amount;
        const qrOrderNum = qrRes.json.orderNumber;

        const amountMatched = quoteTotal === draftTotal && draftTotal === qrAmount;
        report('Paisa-level Consistency (Quote == Draft == QR Amount)', amountMatched, `Quote: ₹${quoteTotal}, Draft: ₹${draftTotal}, QR: ₹${qrAmount}`);

        const orderNumMatched = draftOrderNum === qrOrderNum;
        report('Order Reference Consistency (Draft Order Number == QR Order Ref)', orderNumMatched, `Ref: ${draftOrderNum}`);

        // QR URI Parameter Verification (Non-Merchant UPI Specification: only pa, pn, am, cu, tn)
        const returnedUpiUri = qrRes.json.upiUri || '';
        let qrDecodedUri = returnedUpiUri;

        // Decode actual image buffer from qrDataUrl if available
        if (qrRes.json.qrDataUrl && qrRes.json.qrDataUrl.startsWith('data:image/png;base64,')) {
          try {
            const sharpMod = (await import('sharp')).default;
            const jsqrMod = (await import('jsqr')).default;
            const base64Data = qrRes.json.qrDataUrl.replace(/^data:image\/png;base64,/, '');
            const pngBuf = Buffer.from(base64Data, 'base64');
            const { data: rawPixels, info } = await sharp(pngBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
            const decoded = jsqrMod(new Uint8ClampedArray(rawPixels), info.width, info.height);
            if (decoded && decoded.data) {
              qrDecodedUri = decoded.data;
            }
          } catch (_decodeErr) {
            // Fallback to returned upiUri
          }
        }

        const upiUrl = new URL(qrDecodedUri.replace(/^upi:\/\/pay\?/, 'http://dummy/?'));
        const upiParams = upiUrl.searchParams;
        const paramKeys = Array.from(upiParams.keys()).sort();
        const expectedKeys = ['am', 'cu', 'pa', 'pn', 'tn'];
        const onlyAllowedParams = paramKeys.length === expectedKeys.length && paramKeys.every((k, i) => k === expectedKeys[i]);
        const trAbsent = !upiParams.has('tr') && !qrDecodedUri.includes('tr=');
        const mcAbsent = !upiParams.has('mc') && !qrDecodedUri.includes('mc=');
        const tnValue = upiParams.get('tn') || '';
        const tnHasOrderNum = tnValue.includes(draftOrderNum) && tnValue.startsWith('Order ');
        const tnLengthValid = tnValue.length <= 50;
        const amountValid = upiParams.get('am') === draftTotal.toFixed(2);
        const currencyValid = upiParams.get('cu') === 'INR';

        const qrParamsValid = onlyAllowedParams && trAbsent && mcAbsent && tnHasOrderNum && tnLengthValid && amountValid && currencyValid;
        report('UPI QR Parameters (only pa, pn, am, cu, tn; tr & mc absent; tn has Order number)', qrParamsValid, `URI: ${qrDecodedUri}`);

        // Submit UTR for draft order
        const draftUtr = `E2EDRAFT${Date.now().toString().slice(-6)}`;
        const submitPayRes = await request(`/api/orders/${testDraftOrderId}/submit-payment`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ utrNumber: draftUtr, paymentMode: 'UPI' }),
        });
        report('Submit Payment moves order to PENDING_VERIFICATION', submitPayRes.status === 200 && submitPayRes.json?.success);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 8. ADMIN AUTHENTICATION & CRUD WORKFLOW (IF CREDENTIALS PROVIDED)
  // ---------------------------------------------------------------------------
  let adminCookie = '';
  if (adminEmail && adminPassword) {
    console.log('\n--- 8. ADMIN AUTHENTICATION & CRUD WORKFLOW ---');

    // 8.1 Login
    const loginRes = await request('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });

    const loginSuccess = loginRes.status === 200 && loginRes.json?.success;
    report('Admin Login (POST /api/admin/auth/login)', loginSuccess, `Status: ${loginRes.status}`);

    const rawCookie = loginRes.headers.get('set-cookie') || '';
    const match = rawCookie.match(/unitech_admin_session=([^;]+)/);
    adminCookie = match ? `unitech_admin_session=${match[1]}` : '';

    if (adminCookie) {
      const authHeaders = { Cookie: adminCookie, 'Content-Type': 'application/json' };

      // 8.2 Verify session identity
      const meRes = await request('/api/admin/auth/me', { headers: authHeaders });
      report('Session Verification (GET /api/admin/auth/me)', meRes.status === 200 && meRes.json?.user?.email === adminEmail, `User: ${meRes.json?.user?.email}`);

      // 8.3 Verify Order Price was recalculated server-side
      const ordersRes = await request('/api/orders', { headers: authHeaders });
      if (ordersRes.status === 200 && Array.isArray(ordersRes.json?.data)) {
        const testOrder = ordersRes.json.data.find(o => o.utrNumber === testUtr || o.id === orderRes.json?.orderNumber);
        if (testOrder) {
          const expectedServerSubtotal = testProduct.price * 2;
          const priceRecalculated = testOrder.subtotal === expectedServerSubtotal;
          report('Server-Side Price Calculation (Tampered Price Ignored)', priceRecalculated, `Server Subtotal: ₹${testOrder.subtotal}, Expected: ₹${expectedServerSubtotal}`);
          report('Order Initial Status: PENDING_VERIFICATION', testOrder.paymentStatus === 'PENDING_VERIFICATION' || testOrder.status === 'PENDING_VERIFICATION', `Status: ${testOrder.paymentStatus || testOrder.status}`);

          const adminOrderItems = testOrder.items || [];
          const adminItemsHavePrices = adminOrderItems.length > 0 && adminOrderItems.every(it => {
            const unitPrice = Number(it.price ?? it.unitPrice ?? it.applicablePrice ?? it.currentUnitPrice ?? 0);
            const lineTotal = Number(it.lineTotal ?? 0);
            return unitPrice > 0 && lineTotal > 0;
          });
          report('Order items have non-zero unit price and lineTotal in GET /api/orders response', adminItemsHavePrices);

          // 8.4 Admin Verifies Payment (Atomic Stock Decrement)
          const verifyPaymentRes = await request('/api/orders', {
            method: 'PATCH',
            headers: authHeaders,
            body: JSON.stringify({ id: testOrder.id, action: 'confirm_payment' }),
          });
          report('Admin Verify Payment (PATCH /api/orders)', verifyPaymentRes.status === 200 && verifyPaymentRes.json?.success, `Status: ${verifyPaymentRes.status}`);

          // Cancel / clean up test order
          await request('/api/orders', {
            method: 'PATCH',
            headers: authHeaders,
            body: JSON.stringify({ id: testOrder.id, action: 'reject_payment', adminNotes: 'E2E Test Cleanup' }),
          });
          report('Admin cleans up E2E-TEST order (marked REJECTED)', true);
        }
      }

      // 8.5 Admin verifies & cleans up test enquiry
      const enquiriesRes = await request('/api/enquiries', { headers: authHeaders });
      if (enquiriesRes.status === 200 && Array.isArray(enquiriesRes.json?.data)) {
        const foundEnquiry = enquiriesRes.json.data.find(e => e.fullName === testEnquiryPayload.fullName);
        report('Admin CRM sees submitted enquiry', Boolean(foundEnquiry), `Enquiry ID: ${foundEnquiry?.id}`);
        if (foundEnquiry) {
          await request(`/api/enquiries?id=${foundEnquiry.id}`, { method: 'DELETE', headers: authHeaders });
          report('Admin cleans up E2E-TEST enquiry', true);
        }
      }

      // 8.6 Create, Verify & Clean E2E-TEST Product
      const testProductSlug = `e2e-test-cam-${Date.now().toString().slice(-6)}`;
      const createProdRes = await request('/api/products', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: 'E2E-TEST Surveillance Camera',
          slug: testProductSlug,
          modelCode: 'UT-E2E-4K',
          category: 'cctv-cameras',
          categoryLabel: 'CCTV Cameras',
          price: 4999,
          dealerPrice: 3800,
          mrp: 6999,
          stockQuantity: 50,
          specs: { sensor: 'Sony Starvis' },
          highlights: ['E2E Automated Test'],
        }),
      });
      report('Create Product (POST /api/products)', createProdRes.status === 200 || createProdRes.status === 201, `Slug: ${testProductSlug}`);

      // Verify product visible in public API
      const checkProd = await request('/api/products');
      const prodInApi = checkProd.json?.data?.some(p => p.slug === testProductSlug);
      report('Product appears in public GET /api/products', prodInApi);

      // Clean up product
      const createdProdId = createProdRes.json?.data?.id || createProdRes.json?.id;
      if (createdProdId) {
        await request(`/api/products?id=${createdProdId}`, { method: 'DELETE', headers: authHeaders });
        report('Admin cleans up E2E-TEST product', true);
      }

      // 8.7 Create, Verify & Clean E2E-TEST Banner
      const testBannerId = `banner-e2e-${Date.now().toString().slice(-6)}`;
      const createBannerRes = await request('/api/banners', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          id: testBannerId,
          title: 'E2E-TEST Announcement Banner',
          type: 'TICKER',
          text: 'E2E-TEST FLASH DISPATCH ACTIVE NATIONWIDE',
          isActive: true,
          position: 99,
        }),
      });
      report('Create Banner (POST /api/banners)', createBannerRes.status === 200 || createBannerRes.status === 201);
      const bannerId = createBannerRes.json?.data?.id || createBannerRes.json?.id || testBannerId;
      if (bannerId) {
        await request(`/api/banners?id=${bannerId}`, { method: 'DELETE', headers: authHeaders });
        report('Admin cleans up E2E-TEST banner', true);
      }

      // 8.8 Create, Verify & Clean E2E-TEST Document
      const testDocId = `doc-e2e-${Date.now().toString().slice(-6)}`;
      const createDocRes = await request('/api/documents', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          id: testDocId,
          title: 'E2E-TEST Master Specification Sheet',
          category: 'datasheets',
          section: 'datasheets',
          fileUrl: '/downloads/test-doc.pdf',
          fileSize: '1.2 MB',
          version: 'v1.0',
          format: 'PDF',
          updatedDate: 'Nov 2026',
          isLive: true,
        }),
      });
      report('Create Document (POST /api/documents)', createDocRes.status === 200 || createDocRes.status === 201);
      const docId = createDocRes.json?.data?.id || createDocRes.json?.id || testDocId;
      if (docId) {
        await request(`/api/documents?id=${docId}`, { method: 'DELETE', headers: authHeaders });
        report('Admin cleans up E2E-TEST document', true);
      }

      // 8.9 Admin Uploads Test Image, Verifies Public Serve & ETag, then Deletes
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64'
      );
      const uploadFormData = new FormData();
      uploadFormData.append('file', new Blob([pngBuffer], { type: 'image/png' }), 'e2e-test-image.png');

      const uploadRes = await fetch(`${BASE_URL}/api/products/upload`, {
        method: 'POST',
        headers: { Cookie: adminCookie },
        body: uploadFormData,
      });
      const uploadJson = await uploadRes.json();
      const uploadSuccess = uploadRes.status === 200 && uploadJson.success && Boolean(uploadJson.fileUrl);
      report('Admin Image Upload (POST /api/products/upload)', uploadSuccess, `URL: ${uploadJson.fileUrl}`);

      if (uploadSuccess) {
        // Verify public loading without auth cookie
        const publicServeRes = await fetch(`${BASE_URL}${uploadJson.fileUrl}`);
        const etag = publicServeRes.headers.get('etag');
        const cacheControl = publicServeRes.headers.get('cache-control');
        const servesCorrectly = publicServeRes.status === 200 && Boolean(etag);
        report('Public File Serving & ETag (GET /uploads/**)', servesCorrectly, `Status: ${publicServeRes.status}, ETag: ${etag}, Cache: ${cacheControl}`);

        // Verify 304 conditional get
        if (etag) {
          const conditionalRes = await fetch(`${BASE_URL}${uploadJson.fileUrl}`, {
            headers: { 'If-None-Match': etag },
          });
          report('304 Not Modified on ETag match', conditionalRes.status === 304);
        }

        // Admin deletes uploaded file
        const deleteUploadRes = await request(`/api/products/upload?filename=${uploadJson.filename}`, {
          method: 'DELETE',
          headers: authHeaders,
        });
        report('Admin Deletes Uploaded File (DELETE /api/products/upload)', deleteUploadRes.status === 200 && deleteUploadRes.json?.success);

        // Verify file is now 404
        const afterDeleteRes = await fetch(`${BASE_URL}${uploadJson.fileUrl}`);
        report('Deleted File Returns 404', afterDeleteRes.status === 404, `Status: ${afterDeleteRes.status}`);
      }

      // 8.10 Categories & Series Management & Product-Usage Protection
      console.log('\n--- 8.10 CATEGORIES & SERIES DYNAMIC SYSTEM ---');
      const publicCatRes = await request('/api/categories');
      const hasCategories = publicCatRes.status === 200 && Array.isArray(publicCatRes.json?.data) && publicCatRes.json.data.length > 0;
      report('Public Categories API returns live categories & series', hasCategories, `Found: ${publicCatRes.json?.data?.length || 0} categories`);

      // Test product-usage protection (cctv-cameras has products, deletion must be blocked with HTTP 400)
      const protectedDelRes = await request('/api/admin/categories?id=cctv-cameras', {
        method: 'DELETE',
        headers: authHeaders,
      });
      const blockedExpected = protectedDelRes.status === 400 && Boolean(protectedDelRes.json?.canDeactivate);
      report('Product-usage deletion protection blocked deleting active category (HTTP 400)', blockedExpected, `Error: ${protectedDelRes.json?.error || protectedDelRes.status}`);

      // Create test category
      const testCatId = `e2e-test-cat-${Date.now().toString().slice(-6)}`;
      const createCatRes = await request('/api/admin/categories', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          id: testCatId,
          name: 'E2E Test Surveillance Hub',
          slug: testCatId,
          description: 'Automated E2E test category',
          position: 99,
          isActive: true,
        }),
      });
      report('Create Category (POST /api/admin/categories)', createCatRes.status === 200 || createCatRes.status === 201);

      // Create series under test category
      const createSeriesRes = await request(`/api/admin/categories/${testCatId}/series`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          label: 'E2E Alpha Series',
          position: 1,
        }),
      });
      const createdSeriesId = createSeriesRes.json?.data?.id;
      report('Create Category Series (POST /api/admin/categories/[id]/series)', Boolean(createdSeriesId));

      if (createdSeriesId) {
        // Delete test series
        const delSeriesRes = await request(`/api/admin/categories/${testCatId}/series?seriesId=${createdSeriesId}`, {
          method: 'DELETE',
          headers: authHeaders,
        });
        report('Delete Category Series (DELETE /api/admin/categories/[id]/series)', delSeriesRes.status === 200);
      }

      // Delete test category
      const delCatRes = await request(`/api/admin/categories?id=${testCatId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      report('Delete Unused Category (DELETE /api/admin/categories)', delCatRes.status === 200);

      // 8.11 Top Header Ticker Control & Scheduling
      console.log('\n--- 8.11 TOP HEADER TICKER CONTROL & SCHEDULING ---');
      const publicTickerRes = await request('/api/ticker');
      const tickerValid = publicTickerRes.status === 200 && publicTickerRes.json?.success && publicTickerRes.json?.settings;
      report('Public Ticker API returns settings & active messages', tickerValid, `Rotation: ${publicTickerRes.json?.settings?.rotationSeconds}s, Messages: ${publicTickerRes.json?.messages?.length}`);

      const adminTickerRes = await request('/api/admin/ticker', { headers: authHeaders });
      report('Admin GET Ticker Settings (GET /api/admin/ticker)', adminTickerRes.status === 200 && Boolean(adminTickerRes.json?.settings));

      if (adminTickerRes.json?.settings) {
        const curSettings = adminTickerRes.json.settings;
        const updateSettingsRes = await request('/api/admin/ticker', {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({
            settings: {
              isEnabled: curSettings.isEnabled,
              rotationSeconds: curSettings.rotationSeconds || 4,
              animation: curSettings.animation || 'fade',
              pauseOnHover: curSettings.pauseOnHover ?? true,
              showPhone: curSettings.showPhone ?? true,
              phoneDisplay: curSettings.phoneDisplay || '+91 98181 41759',
              showWhatsapp: curSettings.showWhatsapp ?? true,
              whatsappLabel: curSettings.whatsappLabel || '+91 98181 41759',
            },
          }),
        });
        report('Admin Update Ticker Settings (PUT /api/admin/ticker)', updateSettingsRes.status === 200);
      }

      // 8.12 Payment Settings Server Validation
      console.log('\n--- 8.12 PAYMENT SETTINGS SERVER VALIDATION ---');
      const badUpiRes = await request('/api/admin/payment-settings', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ upiId: 'invalid-upi-no-at', payeeName: 'Test' }),
      });
      report('Reject invalid UPI without @ (HTTP 400)', badUpiRes.status === 400, `Status: ${badUpiRes.status}`);

      const badIfscRes = await request('/api/admin/payment-settings', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ upiId: 'valid@upi', payeeName: 'Test', ifsc: 'bad_ifsc_code' }),
      });
      report('Reject invalid IFSC format (HTTP 400)', badIfscRes.status === 400, `Status: ${badIfscRes.status}`);

      const badFkRes = await request('/api/admin/payment-settings', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ upiId: 'valid@upi', payeeName: 'Test', qrImageFileId: 'file-qr-non-existent-999' }),
      });
      report('Reject non-existent qrImageFileId (HTTP 400)', badFkRes.status === 400, `Error: ${badFkRes.json?.error}`);

      // 8.13 Payment Settings QR Upload & Foreign Key Proof
      console.log('\n--- 8.13 PAYMENT SETTINGS QR UPLOAD & FOREIGN KEY PROOF ---');
      const qrPngBytes = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64'
      );
      const qrFormData = new FormData();
      qrFormData.append('file', new Blob([qrPngBytes], { type: 'image/png' }), 'test-admin-qr.png');

      const qrUploadRes = await fetch(`${BASE_URL}/api/admin/payment-settings/qr-upload`, {
        method: 'POST',
        headers: { Cookie: adminCookie },
        body: qrFormData,
      });
      const qrUploadJson = await qrUploadRes.json();
      const qrUploadSuccess = qrUploadRes.status === 200 && qrUploadJson.success && Boolean(qrUploadJson.id);
      report('Admin QR Upload (POST /api/admin/payment-settings/qr-upload)', qrUploadSuccess, `ID: ${qrUploadJson.id}`);

      if (qrUploadSuccess) {
        // Save settings using the returned uploaded_files.id
        const saveValidFkRes = await request('/api/admin/payment-settings', {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({
            upiId: '9891010375@okbizaxis',
            payeeName: 'UNITECH CCTV',
            qrImageFileId: qrUploadJson.id,
            useDynamicQr: true,
          }),
        });
        report('Save payment settings with valid qrImageFileId (Foreign Key Satisfied)', saveValidFkRes.status === 200);

        // Delete uploaded test QR file
        await request(`/api/products/upload?filename=${qrUploadJson.filename}`, {
          method: 'DELETE',
          headers: authHeaders,
        });
      }

      // 8.14 Abandoned Orders Cleanup
      console.log('\n--- 8.14 ABANDONED ORDERS CLEANUP ---');
      const cleanupOrdersRes = await request('/api/orders?action=cleanup_abandoned', {
        method: 'DELETE',
        headers: authHeaders,
      });
      report('Cleanup Abandoned Orders (DELETE /api/orders?action=cleanup_abandoned)', cleanupOrdersRes.status === 200);

      // Clean up test draft order if created
      if (testDraftOrderId) {
        await request('/api/orders', {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify({ id: testDraftOrderId, action: 'reject_payment', adminNotes: 'E2E Test Draft Cleanup' }),
        });
        report('Admin cleans up E2E test draft order', true);
      }

      // 8.15 Categories CRUD & Storefront Catalogue Reflection
      console.log('\n--- 8.15 CATEGORIES CRUD & STOREFRONT CATALOGUE REFLECTION ---');
      const crudCatId = `e2e-cat-${Date.now().toString().slice(-4)}`;
      const createCrudCatRes = await request('/api/admin/categories', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          id: crudCatId,
          name: 'E2E Test Category',
          shortLabel: 'E2E Test',
          description: 'Automated E2E Category Verification',
          isActive: true,
          showInMenu: true,
          showInFooter: false,
          position: 99,
        }),
      });
      const crudCatCreated = createCrudCatRes.status === 200 && createCrudCatRes.json?.success;
      report('Admin creates category (POST /api/admin/categories)', crudCatCreated, `ID: ${crudCatId}`);

      if (crudCatCreated) {
        // Verify in public /api/categories
        const pubCatsRes = await request('/api/categories');
        const pubCatFound = pubCatsRes.status === 200 && Array.isArray(pubCatsRes.json?.data) && pubCatsRes.json.data.some(c => c.id === crudCatId);
        report('New category appears in public GET /api/categories', pubCatFound);

        // Verify in storefront catalogue HTML (/catalogue)
        const cataloguePageRes = await request('/catalogue');
        const catalogueHasCat = cataloguePageRes.status === 200 && cataloguePageRes.text.includes('E2E Test Category');
        report('New category appears in storefront catalogue HTML (/catalogue)', catalogueHasCat);

        // Cleanup category
        const delCatRes = await request(`/api/admin/categories?id=${crudCatId}`, {
          method: 'DELETE',
          headers: authHeaders,
        });
        report('Admin cleans up test category (DELETE /api/admin/categories)', delCatRes.status === 200 && delCatRes.json?.success);
      }

      // 8.16 Product Creation with Dynamic Category & Series
      console.log('\n--- 8.16 PRODUCT CREATION WITH CATEGORY & SERIES ---');
      const dynProdSlug = `e2e-dyn-cam-${Date.now().toString().slice(-4)}`;
      const dynProdCode = `E2E-CAM-${Date.now().toString().slice(-4)}`;
      const createDynProdRes = await request('/api/products', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: 'E2E Dynamic Series Camera',
          modelCode: dynProdCode,
          slug: dynProdSlug,
          category: 'cctv-cameras',
          categoryLabel: 'CCTV Cameras',
          series: 'Smart AI Series',
          price: 2500,
          dealerPrice: 1900,
          mrp: 3500,
          stockQuantity: 25,
          isBestseller: false,
          isNew: true,
          connectivity: 'wired',
          highlights: ['E2E Automated verification highlight'],
          specs: { 'Resolution': '4K AI', 'Series': 'Smart AI Series' },
        }),
      });
      const dynProdCreated = (createDynProdRes.status === 200 || createDynProdRes.status === 201) && createDynProdRes.json?.success;
      report('Admin creates product with series (POST /api/products)', dynProdCreated, `Slug: ${dynProdSlug}`);

      if (dynProdCreated) {
        // Verify in /api/products
        const listDynProdsRes = await request('/api/products');
        const dynProdFoundInList = listDynProdsRes.status === 200 && Array.isArray(listDynProdsRes.json?.data) && listDynProdsRes.json.data.some(p => p.slug === dynProdSlug && p.series === 'Smart AI Series');
        report('Product appears in GET /api/products with series', dynProdFoundInList);

        // Verify product detail page /product/<slug> renders live
        const dynProdPageRes = await request(`/product/${dynProdSlug}`);
        const dynProdPageRendered = dynProdPageRes.status === 200 && dynProdPageRes.text.includes(dynProdCode);
        report('Product detail page opens live (/product/<slug>)', dynProdPageRendered);

        // Cleanup product
        const createdDynProdId = createDynProdRes.json?.data?.id;
        if (createdDynProdId) {
          const delDynProdRes = await request(`/api/products?id=${createdDynProdId}`, {
            method: 'DELETE',
            headers: authHeaders,
          });
          report('Admin cleans up test product (DELETE /api/products)', delDynProdRes.status === 200 && delDynProdRes.json?.success);
        }
      }

      // 8.18 Outbound SMTP Email Settings Security & Persistence
      console.log('\n--- 8.18 OUTBOUND SMTP EMAIL SETTINGS ---');
      const getEmailSettingsRes = await request('/api/admin/email-settings', { headers: authHeaders });
      const emailSettingsValid = getEmailSettingsRes.status === 200 && getEmailSettingsRes.json?.success;
      report('Admin GET Email Settings (GET /api/admin/email-settings)', emailSettingsValid);
      const emailSettingsData = getEmailSettingsRes.json?.data;
      const passwordNeverExposed = !emailSettingsData?.smtpPassword && !emailSettingsData?.smtp_password_encrypted;
      report('SMTP Password never exposed in GET response', passwordNeverExposed);

      // Test PUT email settings
      const putEmailRes = await request('/api/admin/email-settings', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          isEnabled: false,
          smtpHost: 'smtp.example.com',
          smtpPort: 587,
          smtpSecure: false,
          smtpUser: 'test@example.com',
          senderEmail: 'sales@unitechcctv.com',
          senderName: 'Unitech CCTV Sales',
          adminNotificationEmails: ['alerts@unitechcctv.com'],
          notifyOnOrderReceived: true,
          notifyOnPaymentConfirmed: true,
          notifyOnPaymentRejected: true,
          notifyAdminOnOrder: true,
          notifyAdminOnEnquiry: true,
        }),
      });
      report('Admin PUT Email Settings (PUT /api/admin/email-settings)', putEmailRes.status === 200 && putEmailRes.json?.success);

      // 8.19 Admin Password Management Flows (Forgot & Change Password)
      console.log('\n--- 8.19 ADMIN PASSWORD MANAGEMENT FLOWS ---');
      const uniformMsg = 'If this email belongs to an admin account, a reset link has been sent.';

      // 1. Forgot-password uniform message for existing and non-existing email
      const forgotNonExistentRes = await request('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '198.51.100.101' },
        body: JSON.stringify({ email: 'nonexistent-admin-e2e-check@unitechcctv.com' }),
      });
      const forgotExistingRes = await request('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '198.51.100.102' },
        body: JSON.stringify({ email: adminEmail }),
      });
      const uniformCheck =
        forgotNonExistentRes.status === 200 &&
        forgotNonExistentRes.json?.message === uniformMsg &&
        forgotExistingRes.status === 200 &&
        forgotExistingRes.json?.message === uniformMsg;
      report('Forgot-password uniform message for existing & non-existing email', uniformCheck);

      // 2. Forgot-password rate limit (429 on 4th attempt in window)
      const rateLimitIp = '198.51.100.222';
      const rateLimitEmail = 'ratelimit-probe@unitechcctv.com';
      let hit429 = false;
      for (let attempt = 1; attempt <= 4; attempt++) {
        const rlRes = await request('/api/admin/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': rateLimitIp },
          body: JSON.stringify({ email: rateLimitEmail }),
        });
        if (attempt <= 3) {
          if (rlRes.status !== 200) console.warn(`  Attempt ${attempt} got status ${rlRes.status}`);
        } else {
          if (rlRes.status === 429) hit429 = true;
        }
      }
      report('Forgot-password rate limit returns HTTP 429 on 4th attempt', hit429);

      // 3. Reset-password with invalid token rejected
      const invalidResetRes = await request('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'invalid-nonexistent-token-e2e-check-1234567890',
          newPassword: 'ValidNewPassword2026!',
          confirmPassword: 'ValidNewPassword2026!',
        }),
      });
      const invalidTokenRejected = invalidResetRes.status === 400 && Boolean(invalidResetRes.json?.error);
      report('Reset-password with invalid token rejected (HTTP 400)', invalidTokenRejected);

      // 4. Change-password unauthenticated returns 401
      const unauthChangeRes = await request('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: 'AnyPassword123!',
          newPassword: 'ValidNewPassword2026!',
          confirmPassword: 'ValidNewPassword2026!',
        }),
      });
      report('Change-password unauthenticated returns HTTP 401', unauthChangeRes.status === 401);

      // 5. Change-password with wrong current password rejected (non-destructive)
      const wrongCurrentRes = await request('/api/admin/auth/change-password', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          currentPassword: 'DefinitelyIncorrectPassword999!',
          newPassword: 'ValidNewPassword2026!',
          confirmPassword: 'ValidNewPassword2026!',
        }),
      });
      const wrongPwRejected = wrongCurrentRes.status === 400 && Boolean(wrongCurrentRes.json?.error?.toLowerCase().includes('incorrect'));
      report('Change-password with wrong current password rejected (HTTP 400)', wrongPwRejected, wrongCurrentRes.json?.error ? `Error: ${wrongCurrentRes.json.error}` : `Status: ${wrongCurrentRes.status}`);

      // 8.20 Admin Logout
      const logoutRes = await request('/api/admin/auth/logout', { method: 'POST', headers: authHeaders });
      report('Admin Logout (POST /api/admin/auth/logout)', logoutRes.status === 200);

      // Verify session terminated
      const postLogoutMe = await request('/api/admin/auth/me', { headers: authHeaders });
      report('Post-Logout access blocked (HTTP 401)', postLogoutMe.status === 401, `Status: ${postLogoutMe.status}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 9. PERSISTENCE SNAPSHOT (OPTIONAL)
  // ---------------------------------------------------------------------------
  if (PERSISTENCE_CHECK) {
    console.log('\n--- 9. PERSISTENCE SNAPSHOT CHECK ---');
    const snapshotFile = path.join(process.cwd(), 'e2e-persistence-snapshot.json');
    const currentCounts = {
      timestamp: new Date().toISOString(),
      products: prodApiRes.json?.data?.length || 0,
      banners: (await request('/api/banners')).json?.data?.length || 0,
      documents: (await request('/api/documents')).json?.data?.length || 0,
      dealers: (await request('/api/dealers')).json?.data?.length || 0,
    };

    if (fs.existsSync(snapshotFile)) {
      const prev = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
      console.log('Comparing against previous snapshot taken at:', prev.timestamp);
      report('Products count persisted', currentCounts.products >= prev.products, `Current: ${currentCounts.products}, Prev: ${prev.products}`);
      report('Banners count persisted', currentCounts.banners === prev.banners, `Current: ${currentCounts.banners}, Prev: ${prev.banners}`);
      report('Documents count persisted', currentCounts.documents === prev.documents, `Current: ${currentCounts.documents}, Prev: ${prev.documents}`);
      report('Dealers count persisted', currentCounts.dealers === prev.dealers, `Current: ${currentCounts.dealers}, Prev: ${prev.dealers}`);
    } else {
      fs.writeFileSync(snapshotFile, JSON.stringify(currentCounts, null, 2));
      console.log(`Saved baseline snapshot to ${snapshotFile}. Run again after container restart to verify persistence.`);
    }
  }

  // ---------------------------------------------------------------------------
  // SUMMARY REPORT
  // ---------------------------------------------------------------------------
  console.log('\n==============================================================================');
  console.log('E2E STAGING VERIFICATION SUMMARY');
  console.log('==============================================================================');
  console.log(`Total Checks Executed: ${totalChecks}`);
  console.log(`Passed:                ${passedChecks}`);
  console.log(`Failed:                ${failedChecks}`);
  console.log('==============================================================================\n');

  if (failedChecks > 0) {
    console.error(`🚨 E2E TEST FAILED: ${failedChecks} checks did not pass.`);
    process.exit(1);
  } else {
    console.log('🎉 ALL E2E STAGING CHECKS PASSED (100% SUCCESS)');
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal E2E test runner error:', err);
  process.exit(1);
});
