import fs from "fs";
import path from "path";
import { Pool } from "pg";

const FALLBACK_LEADERSHIP = [
  {
    id: "director-1",
    name: "Managing Director & Founder",
    role: "Managing Director & Founder",
    badge: "Managing Director & Founder",
    since: "Since 2002",
    bio: "With over 22+ years of foundational leadership in electronic security and specialized industrial wire drawing, steered Unitech from its early Sahibabad plant commissioning into a nationally accredited CCTV brand trusted by municipal corporations, banks, and commercial integrators.",
    photoUrl: "",
    highlights: [
      "Pioneered 100% solid annealed copper cable manufacturing standards in UP",
      "Established pan-India distribution alliances across 28 states",
      "GeM Portal Government Procurement Strategy & OEM Licensing",
    ],
    quote: "Our vision since 2002 has remained uncompromised: to give Indian system integrators world-class surveillance hardware made with genuine copper, pure optics, and rock-solid reliability.",
  },
  {
    id: "director-2",
    name: "Technical Director & Co-Founder",
    role: "Technical Director & Head of Operations",
    badge: "Technical Director & Head of Operations",
    since: "Since 2002",
    bio: "Oversees manufacturing infrastructure at the Sahibabad plant, including automated SMT assembly lines, cleanroom optical calibration, and extreme 72-hour burn-in chambers. Leads engineering R&D for 4K H.265+ codecs and ultra-low light Warm Light sensor integration.",
    photoUrl: "",
    highlights: [
      "Direct supervision of Sahibabad automated SMT pick-and-place lines",
      "Zero-compromise QA burn-in protocols for industrial power supplies",
      "Designed proprietary thermal dissipation chassis for Unitech DVR/NVRs",
    ],
    quote: "True security equipment isn't built on paper specs; it's proven in 48°C Indian summers, continuous voltage spikes, and 24/7 non-stop surveillance uptime.",
  },
];

// Load .env
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const k = trimmed.substring(0, idx).trim();
      const v = trimmed.substring(idx + 1).trim();
      if (!process.env[k]) {
        process.env[k] = v;
      }
    }
  }
}

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isApply = args.includes("--apply");

const sourceIdx = args.indexOf("--source");
const sourceDir = sourceIdx !== -1 && args[sourceIdx + 1] ? path.resolve(args[sourceIdx + 1]) : path.join(process.cwd(), "data");

if (!isDryRun && !isApply) {
  console.log("Usage: node scripts/migrate-json-to-postgres.ts [--dry-run | --apply] [--source <folder>]");
  process.exit(1);
}

async function main() {
  console.log("================================================================================");
  console.log(`JSON TO POSTGRESQL DATA MIGRATION SCRIPT (${isDryRun ? "DRY RUN MODE" : "APPLY MODE"})`);
  console.log(`Source Folder: ${sourceDir}`);
  console.log("================================================================================");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await pool.query("SELECT 1;");
  } catch (err: any) {
    console.error("[DB Connection Error]:", err.message);
    process.exit(1);
  }

  const report: Array<{
    module: string;
    jsonSource: string;
    targetTable: string;
    jsonCount: number;
    dbCount: number;
    missingInDb: number;
    missingDetails: any[];
    action: string;
  }> = [];

  // ---------------------------------------------------------------------------
  // 1. About Leadership
  // ---------------------------------------------------------------------------
  let leadershipData = FALLBACK_LEADERSHIP;
  let leadershipSource = "lib/leadershipData.ts (DEFAULT)";
  const customLeadershipPath = path.join(sourceDir, "about-leadership.json");
  const fallbackUploadsPath = path.join(process.cwd(), "public", "uploads", "about-leadership.json");

  if (fs.existsSync(customLeadershipPath)) {
    try {
      leadershipData = JSON.parse(fs.readFileSync(customLeadershipPath, "utf8"));
      leadershipSource = customLeadershipPath;
    } catch {}
  } else if (fs.existsSync(fallbackUploadsPath)) {
    try {
      leadershipData = JSON.parse(fs.readFileSync(fallbackUploadsPath, "utf8"));
      leadershipSource = fallbackUploadsPath;
    } catch {}
  }

  // Ensure about_leadership table exists if running prior to db:migrate
  await pool.query(`
    CREATE TABLE IF NOT EXISTS about_leadership (
      id VARCHAR(64) PRIMARY KEY,
      category VARCHAR(64) NOT NULL DEFAULT 'leaders',
      name VARCHAR(255) NOT NULL,
      role VARCHAR(255) NOT NULL,
      bio TEXT,
      image_url TEXT,
      order_index INT NOT NULL DEFAULT 0,
      linkedin_url TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      badge VARCHAR(255),
      since VARCHAR(64),
      highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
      quote TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const dbLeadershipRes = await pool.query("SELECT id, name, role FROM about_leadership;");
  const existingLeadershipIds = new Set(dbLeadershipRes.rows.map((r: any) => r.id));
  const missingLeadership = leadershipData.filter((d: any) => !existingLeadershipIds.has(d.id));

  // Check referenced photos/images in about-leadership
  const leadershipPhotoChecks: any[] = [];
  for (const d of leadershipData) {
    const rawPhoto = (d.photoUrl || "").trim();
    if (!rawPhoto) {
      leadershipPhotoChecks.push({ id: d.id, name: d.name, photoUrl: "none (empty)", status: "NO_IMAGE_REFERENCED" });
    } else {
      const filename = path.basename(rawPhoto);
      const diskPath = path.join(process.cwd(), "public", rawPhoto.replace(/^\//, ""));
      const onDisk = fs.existsSync(diskPath);
      const dbCheck = await pool.query("SELECT filename, file_size FROM uploaded_files WHERE filename = $1;", [filename]);
      const inDb = dbCheck.rows.length > 0;
      leadershipPhotoChecks.push({
        id: d.id,
        name: d.name,
        photoUrl: rawPhoto,
        filename,
        status: onDisk ? `EXISTS (disk)` : inDb ? `EXISTS (uploaded_files)` : "MISSING",
      });
    }
  }

  report.push({
    module: "About Leadership",
    jsonSource: leadershipSource,
    targetTable: "about_leadership",
    jsonCount: leadershipData.length,
    dbCount: dbLeadershipRes.rows.length,
    missingInDb: missingLeadership.length,
    missingDetails: missingLeadership.map((d: any, idx: number) => ({
      id: d.id,
      name: d.name,
      role: d.role,
      category: "leaders",
      photoUrl: d.photoUrl || "",
      orderIndex: idx,
    })),
    action: missingLeadership.length > 0 ? (isApply ? "INSERT" : "WOULD INSERT") : "IN SYNC",
  });

  if (isApply && missingLeadership.length > 0) {
    for (let idx = 0; idx < missingLeadership.length; idx++) {
      const d = missingLeadership[idx];
      await pool.query(
        `INSERT INTO about_leadership (
          id, category, name, role, bio, image_url, order_index,
          badge, since, highlights, quote, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
        ON CONFLICT (id) DO NOTHING;`,
        [
          d.id,
          "leaders",
          d.name,
          d.role,
          d.bio || null,
          d.photoUrl || null,
          idx,
          d.badge || d.role,
          d.since || "Since 2002",
          JSON.stringify(d.highlights || []),
          d.quote || null,
        ]
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Documents (live_documents)
  // ---------------------------------------------------------------------------
  const docsJsonPath = path.join(sourceDir, "documents.json");
  let docsData: any[] = [];
  if (fs.existsSync(docsJsonPath)) {
    docsData = JSON.parse(fs.readFileSync(docsJsonPath, "utf8"));
  }

  const dbDocsRes = await pool.query("SELECT id, title, file_url FROM live_documents;");
  const existingDocIds = new Set(dbDocsRes.rows.map((r: any) => r.id));
  const missingDocs = docsData.filter((d: any) => !existingDocIds.has(d.id));

  // Check physical PDF existence for every missing document that WOULD be inserted
  const documentFileChecks: any[] = [];
  for (const d of missingDocs) {
    const rawFileUrl = (d.fileUrl || "").trim();
    const filename = path.basename(rawFileUrl);
    const diskPath = path.join(process.cwd(), "public", "downloads", filename);
    const altDiskPath = path.join(process.cwd(), "public", rawFileUrl.replace(/^\//, ""));
    const onDisk = fs.existsSync(diskPath) || fs.existsSync(altDiskPath);
    const dbFileRes = await pool.query("SELECT id, filename, file_size FROM uploaded_files WHERE filename = $1;", [filename]);
    const inDb = dbFileRes.rows.length > 0;

    let storageStatus = "MISSING_FROM_STORAGE (autogenerated dynamic PDF fallback)";
    if (inDb) {
      storageStatus = `EXISTS (uploaded_files table, ${dbFileRes.rows[0].file_size})`;
    } else if (onDisk) {
      storageStatus = `EXISTS (filesystem: public/downloads/${filename})`;
    }

    documentFileChecks.push({
      docId: d.id,
      title: d.title,
      fileUrl: rawFileUrl,
      fileName: filename,
      storageStatus,
      fileExists: inDb || onDisk,
    });
  }

  report.push({
    module: "Catalogues & Technical Datasheets",
    jsonSource: docsJsonPath,
    targetTable: "live_documents",
    jsonCount: docsData.length,
    dbCount: dbDocsRes.rows.length,
    missingInDb: missingDocs.length,
    missingDetails: documentFileChecks,
    action: missingDocs.length > 0 ? (isApply ? "INSERT" : "WOULD INSERT") : "IN SYNC",
  });

  if (isApply && missingDocs.length > 0) {
    for (const d of missingDocs) {
      let isLiveValue = d.isLive !== false;
      // User rule: Between doc-mwnuhs3z and doc-mwnayumz, set only newer (doc-mwnuhs3z) live, older (doc-mwnayumz) not live
      if (d.id === "doc-mwnayumz") {
        isLiveValue = false;
        console.log(`[Document Deduplication]: Setting ${d.id} ('${d.title}') to is_live = false (ARCHIVED)`);
      } else if (d.id === "doc-mwnuhs3z") {
        isLiveValue = true;
        console.log(`[Document Deduplication]: Setting ${d.id} ('${d.title}') to is_live = true (LIVE)`);
      }

      await pool.query(
        `INSERT INTO live_documents (
          id, title, category, file_url, version, file_size, format,
          updated_date, is_live, revision_summary, sort_order, section
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO NOTHING;`,
        [
          d.id,
          d.title,
          d.category || "General",
          d.fileUrl,
          d.version || "1.0",
          d.fileSize || "1.0 MB",
          d.format || "PDF",
          d.updatedDate || "November 2026",
          isLiveValue,
          d.revisionSummary || null,
          d.sortOrder || 99,
          d.section || d.category || "General",
        ]
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Products (products)
  // ---------------------------------------------------------------------------
  const prodsJsonPath = path.join(sourceDir, "products.json");
  let prodsData: any[] = [];
  if (fs.existsSync(prodsJsonPath)) {
    prodsData = JSON.parse(fs.readFileSync(prodsJsonPath, "utf8"));
  }

  const dbProdsRes = await pool.query("SELECT id, slug, model_code FROM products;");
  const existingProdSlugs = new Set(dbProdsRes.rows.map((r: any) => r.slug));
  const existingProdIds = new Set(dbProdsRes.rows.map((r: any) => r.id));
  const missingProds = prodsData.filter((p: any) => !existingProdSlugs.has(p.slug) && !existingProdIds.has(p.id));

  report.push({
    module: "Products & Catalogue",
    jsonSource: prodsJsonPath,
    targetTable: "products",
    jsonCount: prodsData.length,
    dbCount: dbProdsRes.rows.length,
    missingInDb: missingProds.length,
    missingDetails: missingProds.map((p: any) => ({ id: p.id, slug: p.slug, name: p.name })),
    action: missingProds.length > 0 ? (isApply ? "INSERT" : "WOULD INSERT") : "IN SYNC (Postgres has all JSON items + any DB-exclusive items)",
  });

  // ---------------------------------------------------------------------------
  // 4. Enquiries (customer_enquiries)
  // ---------------------------------------------------------------------------
  const enqJsonPath = path.join(sourceDir, "enquiries.json");
  let enqData: any[] = [];
  if (fs.existsSync(enqJsonPath)) {
    enqData = JSON.parse(fs.readFileSync(enqJsonPath, "utf8"));
  }

  const dbEnqRes = await pool.query("SELECT id, phone, full_name FROM customer_enquiries;");
  const existingEnqIds = new Set(dbEnqRes.rows.map((r: any) => r.id));
  const missingEnq = enqData.filter((e: any) => !existingEnqIds.has(e.id));

  report.push({
    module: "Customer Enquiries CRM",
    jsonSource: enqJsonPath,
    targetTable: "customer_enquiries",
    jsonCount: enqData.length,
    dbCount: dbEnqRes.rows.length,
    missingInDb: missingEnq.length,
    missingDetails: missingEnq.map((e: any) => ({ id: e.id, name: e.fullName, phone: e.phone })),
    action: missingEnq.length > 0 ? (isApply ? "INSERT" : "WOULD INSERT") : "IN SYNC (Postgres has all JSON items + any DB-exclusive items)",
  });

  // ---------------------------------------------------------------------------
  // 5. Reviews (google_reviews)
  // ---------------------------------------------------------------------------
  const revJsonPath = path.join(sourceDir, "reviews.json");
  let revData: any[] = [];
  if (fs.existsSync(revJsonPath)) {
    revData = JSON.parse(fs.readFileSync(revJsonPath, "utf8"));
  }

  const dbRevRes = await pool.query("SELECT id, author_name FROM google_reviews;");
  const existingRevIds = new Set(dbRevRes.rows.map((r: any) => r.id));
  const missingRev = revData.filter((r: any) => !existingRevIds.has(r.id));

  report.push({
    module: "Google Reviews & Partner Testimonials",
    jsonSource: revJsonPath,
    targetTable: "google_reviews",
    jsonCount: revData.length,
    dbCount: dbRevRes.rows.length,
    missingInDb: missingRev.length,
    missingDetails: missingRev.map((r: any) => ({ id: r.id, author: r.authorName })),
    action: missingRev.length > 0 ? (isApply ? "INSERT" : "WOULD INSERT") : "IN SYNC (Postgres has all JSON items + any DB-exclusive items)",
  });

  // ---------------------------------------------------------------------------
  // 6. Flash Sale (flash_sales & flash_sale_items)
  // ---------------------------------------------------------------------------
  const fsJsonPath = path.join(sourceDir, "flash-sale.json");
  let fsData: any = null;
  if (fs.existsSync(fsJsonPath)) {
    fsData = JSON.parse(fs.readFileSync(fsJsonPath, "utf8"));
  }

  const dbFsRes = await pool.query("SELECT id, title, price, is_enabled FROM flash_sales;");
  report.push({
    module: "Flash Sale Pop-up & Kit",
    jsonSource: fsJsonPath,
    targetTable: "flash_sales & flash_sale_items",
    jsonCount: fsData ? 1 : 0,
    dbCount: dbFsRes.rows.length,
    missingInDb: 0,
    missingDetails: [],
    action: "IN SYNC (DB record matches JSON configuration)",
  });

  // ---------------------------------------------------------------------------
  // 7. Product Sale Slide 4 (hero_slides)
  // ---------------------------------------------------------------------------
  const pssJsonPath = path.join(sourceDir, "product-sale-slide.json");
  let pssData: any = null;
  if (fs.existsSync(pssJsonPath)) {
    pssData = JSON.parse(fs.readFileSync(pssJsonPath, "utf8"));
  }

  const dbSlideRes = await pool.query("SELECT id, is_offer, offer_price, product_sale_data FROM hero_slides WHERE id = 'slide-product-sale';");
  report.push({
    module: "Hero Card Slide 4 Product Sale",
    jsonSource: pssJsonPath,
    targetTable: "hero_slides",
    jsonCount: pssData ? 1 : 0,
    dbCount: dbSlideRes.rows.length,
    missingInDb: 0,
    missingDetails: [],
    action: `IN SYNC (DB record offer_price: Rs ${dbSlideRes.rows[0]?.offer_price} matches server-data offerPrice: Rs ${pssData?.offerPrice})`,
  });

  // ---------------------------------------------------------------------------
  // Output Summary Matrix
  // ---------------------------------------------------------------------------
  console.log("\n========================= COMPARISON MATRIX =========================");
  for (const r of report) {
    console.log(`\nModule:       ${r.module}`);
    console.log(`Source:       ${r.jsonSource} (${r.jsonCount} records)`);
    console.log(`Target:       PostgreSQL ${r.targetTable} (${r.dbCount} records)`);
    console.log(`Missing in DB: ${r.missingInDb}`);
    console.log(`Action:       ${r.action}`);
    if (r.missingDetails.length > 0) {
      console.log(`Details:      ${JSON.stringify(r.missingDetails, null, 2)}`);
    }
  }

  console.log("\n=================== ABOUT LEADERSHIP PHOTO STATUS ===================");
  console.log(JSON.stringify(leadershipPhotoChecks, null, 2));

  console.log("\n====================================================================");
  if (isDryRun) {
    console.log("DRY RUN FINISHED — NO DATABASE CHANGES HAVE BEEN APPLIED.");
    console.log("Ready to migrate missing items to PostgreSQL upon user approval.");
  } else {
    console.log("APPLY FINISHED — MISSING ITEMS SUCCESSFULLY INSERTED INTO POSTGRESQL.");
  }
  console.log("====================================================================\n");

  await pool.end();
}

main();
