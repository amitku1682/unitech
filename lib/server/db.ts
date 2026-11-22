import { Pool } from "pg";
import {
  CustomerEnquiry,
  EnquiryStatus,
  EnquiryType,
  Product,
  CategorySlug,
  LiveDocumentAsset,
  HeroSlideCard,
  AnnouncementBanner,
  GoogleReview,
  DealerHub,
  CheckoutOrder,
  ProductSaleSlideData,
  ProductImage,
  HomepageCategoryCard,
  SearchPopularTerm,
  SearchInsightsData,
  Category,
  CategorySeries,
  TickerSettings,
  EmailSettings,
  EmailLogEntry,
} from "@/lib/types";
import { encryptSecret, decryptSecret, getEncryptionKey } from "@/lib/server/crypto";
import { LeadershipDirector } from "@/lib/leadershipData";

// Database Connection String from environment
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://unitech_admin@localhost:5432/unitech_cctv_db";

let pool: Pool | null = null;
let isInitialized = false;
let initPromise: Promise<boolean> | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    const isSsl = process.env.DATABASE_SSL === "true" || process.env.DATABASE_SSL === "1";
    pool = new Pool({
      connectionString: DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined,
    });

    pool.on("error", (err) => {
      console.error("[PostgreSQL Pool Error]:", err);
    });
  }
  return pool;
}

// Lightweight connectivity probe with shared singleton Promise to prevent concurrency race conditions (SEC-MED-06)
export async function initializeDatabase(): Promise<boolean> {
  if (isInitialized) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const db = getDbPool();
      await db.query("SELECT 1;");
      isInitialized = true;
      return true;
    } catch (error: any) {
      const code = error?.code || "UNREACHABLE";
      const msg = error?.message || String(error);
      console.warn(`[PostgreSQL Status]: DB offline (${code} - ${msg}).`);
      return false;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

// =========================================================================
// 1. CUSTOMER ENQUIRIES & LEADS CRM
// =========================================================================
function rowToEnquiry(row: any): CustomerEnquiry {
  return {
    id: row.id,
    type: row.type as EnquiryType,
    fullName: row.full_name,
    companyName: row.company_name || undefined,
    gstin: row.gstin || undefined,
    phone: row.phone,
    email: row.email || "",
    city: row.city || "Unspecified",
    state: row.state || "Uttar Pradesh",
    productModel: row.product_model || undefined,
    details: row.details || "",
    status: row.status as EnquiryStatus,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    budget: row.budget || undefined,
    adminNotes: row.admin_notes || undefined,
  };
}

export async function getDbEnquiries(): Promise<CustomerEnquiry[]> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const res = await db.query(
    `SELECT * FROM customer_enquiries ORDER BY created_at DESC;`
  );
  return res.rows.map(rowToEnquiry);
}

export async function createDbEnquiry(
  payload: Omit<CustomerEnquiry, "id" | "status" | "createdAt"> & {
    id?: string;
    status?: EnquiryStatus;
    createdAt?: string;
  }
): Promise<CustomerEnquiry> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();

  let nextId = payload.id;
  if (!nextId) {
    const idRes = await db.query(`SELECT id FROM customer_enquiries WHERE id ~ '^enq-[0-9]+$';`);
    let maxIdNum = 100;
    for (const r of idRes.rows) {
      const match = r.id.match(/^enq-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxIdNum) {
          maxIdNum = num;
        }
      }
    }
    nextId = `enq-${maxIdNum + 1}`;
  }

  const status = payload.status || "NEW";
  const createdAt = payload.createdAt ? new Date(payload.createdAt) : new Date();

  await db.query(
    `INSERT INTO customer_enquiries (
      id, type, full_name, company_name, gstin, phone, email, city, state, product_model, details, status, budget, admin_notes, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15);`,
    [
      nextId,
      payload.type || "DISTRIBUTOR",
      payload.fullName.trim(),
      payload.companyName?.trim() || null,
      payload.gstin?.trim() || null,
      payload.phone.trim(),
      payload.email?.trim() || "",
      payload.city?.trim() || "Unspecified",
      payload.state?.trim() || "Uttar Pradesh",
      payload.productModel?.trim() || null,
      payload.details?.trim() || "Inquiry submitted via website form.",
      status,
      payload.budget?.trim() || null,
      payload.adminNotes?.trim() || null,
      createdAt,
    ]
  );

  return {
    id: nextId,
    type: payload.type || "DISTRIBUTOR",
    fullName: payload.fullName.trim(),
    companyName: payload.companyName?.trim() || undefined,
    gstin: payload.gstin?.trim() || undefined,
    phone: payload.phone.trim(),
    email: payload.email?.trim() || "",
    city: payload.city?.trim() || "Unspecified",
    state: payload.state?.trim() || "Uttar Pradesh",
    productModel: payload.productModel?.trim() || undefined,
    details: payload.details?.trim() || "Inquiry submitted via website form.",
    status,
    createdAt: createdAt.toISOString(),
    budget: payload.budget?.trim() || undefined,
    adminNotes: payload.adminNotes?.trim() || undefined,
  };
}

export async function updateDbEnquiry(
  id: string,
  updates: Partial<CustomerEnquiry>
): Promise<CustomerEnquiry | null> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (updates.status) {
    fields.push(`status = $${index++}`);
    values.push(updates.status);
  }
  if (typeof updates.adminNotes === "string") {
    fields.push(`admin_notes = $${index++}`);
    values.push(updates.adminNotes);
  }
  if (updates.companyName !== undefined) {
    fields.push(`company_name = $${index++}`);
    values.push(updates.companyName || null);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const query = `UPDATE customer_enquiries SET ${fields.join(", ")} WHERE id = $${index} RETURNING *;`;
  const res = await db.query(query, values);
  if (res.rowCount === 0) return null;
  return rowToEnquiry(res.rows[0]);
}

export async function deleteDbEnquiry(id: string): Promise<boolean> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const res = await db.query(`DELETE FROM customer_enquiries WHERE id = $1;`, [id]);
  return (res.rowCount ?? 0) > 0;
}

// =========================================================================
// 2. HARDWARE PRODUCTS CATALOG
// =========================================================================
function rowToProduct(row: any): Product {
  let specsObj: Record<string, string> = {};
  if (typeof row.specs === "object" && row.specs !== null) {
    specsObj = row.specs;
  } else if (typeof row.specs === "string") {
    try {
      specsObj = JSON.parse(row.specs);
    } catch { }
  }

  let highlightsArr: string[] = [];
  if (Array.isArray(row.highlights)) {
    highlightsArr = row.highlights;
  } else if (typeof row.highlights === "string") {
    try {
      highlightsArr = JSON.parse(row.highlights);
    } catch { }
  }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    modelCode: row.model_code,
    category: row.category as CategorySlug,
    categoryLabel: row.category_label,
    price: Number(row.price),
    tier2Price: row.tier2_price !== undefined && row.tier2_price !== null ? Number(row.tier2_price) : undefined,
    dealerPrice: Number(row.dealer_price),
    mrp: Number(row.mrp),
    stockQuantity: Number(row.stock_quantity),
    isBestseller: Boolean(row.is_bestseller),
    isNew: Boolean(row.is_new),
    isPromo: Boolean(row.is_promo),
    rating: Number(row.rating),
    reviewCount: Number(row.review_count),
    datasheetPdfUrl: row.datasheet_pdf_url || undefined,
    warrantyYears: Number(row.warranty_years),
    connectivity: row.connectivity || undefined,
    specs: specsObj,
    highlights: highlightsArr,
    cableLengths: Array.isArray(row.cable_lengths)
      ? row.cable_lengths
      : typeof row.cable_lengths === "string"
        ? JSON.parse(row.cable_lengths)
        : undefined,
    imageUrl: row.image_url || undefined,
    placeholderLabel: row.placeholder_label || row.name,
    placeholderSubtext: row.placeholder_subtext || `${row.model_code} · Standard Spec`,
    imageCount: row.image_count !== undefined ? Number(row.image_count) : (row.image_url ? 1 : 0),
    series: row.series || specsObj?.Series || specsObj?.series || undefined,
  };
}

export async function getDbProducts(filterCategory?: string, search?: string): Promise<Product[]> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();

  let query = `
    SELECT p.*,
      COALESCE(
        (SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = p.id),
        CASE WHEN p.image_url IS NOT NULL AND p.image_url != '' THEN 1 ELSE 0 END
      ) AS image_count
    FROM products p
  `;
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (filterCategory && filterCategory !== "ALL") {
    conditions.push(`category = $${paramIdx++}`);
    params.push(filterCategory);
  }

  if (search && search.trim()) {
    conditions.push(`(name ILIKE $${paramIdx} OR model_code ILIKE $${paramIdx} OR category_label ILIKE $${paramIdx})`);
    params.push(`%${search.trim()}%`);
    paramIdx++;
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(" AND ");
  }

  query += ` ORDER BY sort_order ASC, updated_at DESC;`;
  const res = await db.query(query, params);
  return res.rows.map(rowToProduct);
}

export async function getDbProductBySlug(slug: string): Promise<Product | null> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const res = await db.query(
    `SELECT * FROM products 
     WHERE slug = $1 OR id = $1 OR LOWER(model_code) = LOWER($1) 
     LIMIT 1;`,
    [slug]
  );
  if (res.rowCount === 0) return null;
  const product = rowToProduct(res.rows[0]);

  try {
    const images = await getDbProductImages(product.id);
    if (images.length > 0) {
      product.images = images;
      product.imageCount = images.length;
    } else if (product.imageUrl) {
      product.images = [
        {
          url: product.imageUrl,
          thumbUrl: product.imageUrl,
          label: "Front view",
          alt: `${product.name} — front view`,
          position: 0,
        },
      ];
      product.imageCount = 1;
    }
  } catch (imgErr) {
    console.warn("[getDbProductBySlug gallery images warning]:", imgErr);
  }

  return product;
}

export async function getDbProductById(id: string): Promise<Product | null> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const res = await db.query(`SELECT * FROM products WHERE id = $1 LIMIT 1;`, [id]);
  if (res.rowCount === 0) return null;
  const product = rowToProduct(res.rows[0]);

  try {
    const images = await getDbProductImages(product.id);
    if (images.length > 0) {
      product.images = images;
      product.imageCount = images.length;
    } else if (product.imageUrl) {
      product.images = [
        {
          url: product.imageUrl,
          thumbUrl: product.imageUrl,
          label: "Front view",
          alt: `${product.name} — front view`,
          position: 0,
        },
      ];
      product.imageCount = 1;
    }
  } catch (imgErr) {
    console.warn("[getDbProductById gallery images warning]:", imgErr);
  }

  return product;
}

export async function getDbProductImages(productId: string): Promise<ProductImage[]> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const res = await db.query(
    `SELECT * FROM product_images WHERE product_id = $1 ORDER BY position ASC;`,
    [productId]
  );
  return res.rows.map((r: any) => ({
    id: r.id,
    productId: r.product_id,
    url: r.url,
    thumbUrl: r.thumb_url,
    width: r.width ? Number(r.width) : undefined,
    height: r.height ? Number(r.height) : undefined,
    label: r.label,
    alt: r.alt,
    position: Number(r.position),
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
    updatedBy: r.updated_by || undefined,
  }));
}

export async function saveDbProductImages(
  productId: string,
  images: Array<Partial<ProductImage> & { url: string }>
): Promise<ProductImage[]> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();

  if (!Array.isArray(images) || images.length === 0) {
    throw new Error("At least 1 product image is required.");
  }
  if (images.length > 6) {
    throw new Error("Maximum 6 images allowed per product.");
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN;");

    // 1. Delete current images for this product
    await client.query(`DELETE FROM product_images WHERE product_id = $1;`, [productId]);

    // 2. Insert new ordered items (max 6)
    const inserted: ProductImage[] = [];
    for (let i = 0; i < images.length && i < 6; i++) {
      const img = images[i];
      const imgId = img.id && !img.id.startsWith("temp-")
        ? img.id
        : `img-${productId}-${i}-${Date.now().toString(36)}`;
      const url = img.url;
      const thumbUrl = img.thumbUrl || (img as any).thumb_url || url;
      const width = img.width || 1000;
      const height = img.height || 1000;
      const label = img.label || (i === 0 ? "Front view" : "Other");
      const alt = (img.alt && img.alt.trim()) ? img.alt.substring(0, 125) : `Unitech hardware — ${label.toLowerCase()}`;
      const position = i;

      await client.query(
        `INSERT INTO product_images (
          id, product_id, url, thumb_url, width, height, label, alt, position, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP);`,
        [imgId, productId, url, thumbUrl, width, height, label, alt, position]
      );

      inserted.push({
        id: imgId,
        productId,
        url,
        thumbUrl,
        width,
        height,
        label,
        alt,
        position,
      });
    }

    // 3. Sync cover image (position 0) into products.image_url
    const coverUrl = inserted[0]?.url || "";
    if (coverUrl) {
      await client.query(
        `UPDATE products SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;`,
        [coverUrl, productId]
      );
    }

    await client.query("COMMIT;");
    return inserted;
  } catch (err) {
    await client.query("ROLLBACK;");
    throw err;
  } finally {
    client.release();
  }
}

export async function createDbProduct(product: Product): Promise<Product> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();

  const specs = { ...(product.specs || {}) };
  if (product.series && !specs["Series"]) {
    specs["Series"] = product.series;
  }

  await db.query(
    `INSERT INTO products (
      id, slug, name, model_code, category, category_label, price, dealer_price, mrp, stock_quantity,
      is_bestseller, is_new, is_promo, rating, review_count, datasheet_pdf_url, warranty_years,
      connectivity, specs, highlights, image_url, placeholder_label, placeholder_subtext, sort_order
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, 0)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      price = EXCLUDED.price,
      dealer_price = EXCLUDED.dealer_price,
      mrp = EXCLUDED.mrp,
      stock_quantity = EXCLUDED.stock_quantity,
      image_url = EXCLUDED.image_url,
      updated_at = CURRENT_TIMESTAMP;`,
    [
      product.id,
      product.slug,
      product.name,
      product.modelCode,
      product.category,
      product.categoryLabel,
      product.price,
      product.dealerPrice,
      product.mrp,
      product.stockQuantity,
      product.isBestseller ?? false,
      product.isNew ?? false,
      product.isPromo ?? false,
      product.rating,
      product.reviewCount,
      product.datasheetPdfUrl || null,
      product.warrantyYears,
      product.connectivity || null,
      JSON.stringify(specs),
      JSON.stringify(product.highlights || []),
      product.imageUrl || null,
      product.placeholderLabel,
      product.placeholderSubtext,
    ]
  );

  invalidateCategoriesCache();
  return product;
}

export async function updateDbProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();

  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${index++}`);
    values.push(updates.name);
  }
  if (updates.category !== undefined) {
    fields.push(`category = $${index++}`);
    values.push(updates.category);
  }
  if (updates.categoryLabel !== undefined) {
    fields.push(`category_label = $${index++}`);
    values.push(updates.categoryLabel);
  }
  if (updates.connectivity !== undefined) {
    fields.push(`connectivity = $${index++}`);
    values.push(updates.connectivity);
  }
  if (updates.price !== undefined) {
    fields.push(`price = $${index++}`);
    values.push(updates.price);
  }
  if (updates.tier2Price !== undefined) {
    fields.push(`tier2_price = $${index++}`);
    values.push(updates.tier2Price);
  }
  if (updates.dealerPrice !== undefined) {
    fields.push(`dealer_price = $${index++}`);
    values.push(updates.dealerPrice);
  }
  if (updates.mrp !== undefined) {
    fields.push(`mrp = $${index++}`);
    values.push(updates.mrp);
  }
  if (updates.cableLengths !== undefined) {
    fields.push(`cable_lengths = $${index++}`);
    values.push(JSON.stringify(updates.cableLengths));
  }
  if (updates.stockQuantity !== undefined) {
    fields.push(`stock_quantity = $${index++}`);
    values.push(updates.stockQuantity);
  }
  if (updates.imageUrl !== undefined) {
    fields.push(`image_url = $${index++}`);
    values.push(updates.imageUrl || null);
  }
  if (updates.datasheetPdfUrl !== undefined) {
    fields.push(`datasheet_pdf_url = $${index++}`);
    values.push(updates.datasheetPdfUrl || null);
  }
  if (updates.isBestseller !== undefined) {
    fields.push(`is_bestseller = $${index++}`);
    values.push(updates.isBestseller);
  }
  if (updates.isNew !== undefined) {
    fields.push(`is_new = $${index++}`);
    values.push(updates.isNew);
  }
  if (updates.warrantyYears !== undefined) {
    fields.push(`warranty_years = $${index++}`);
    values.push(updates.warrantyYears);
  }
  if (updates.specs !== undefined) {
    fields.push(`specs = $${index++}`);
    values.push(JSON.stringify(updates.specs));
  }
  if (updates.highlights !== undefined) {
    fields.push(`highlights = $${index++}`);
    values.push(JSON.stringify(updates.highlights));
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);
  const query = `UPDATE products SET ${fields.join(", ")} WHERE id = $${index} RETURNING *;`;
  const res = await db.query(query, values);
  if (res.rowCount === 0) return null;
  invalidateCategoriesCache();
  return rowToProduct(res.rows[0]);
}

export async function deleteDbProduct(id: string): Promise<boolean> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const res = await db.query(`DELETE FROM products WHERE id = $1;`, [id]);
  if ((res.rowCount ?? 0) > 0) {
    invalidateCategoriesCache();
    return true;
  }
  return false;
}

// =========================================================================
// 3. LIVE DOCUMENTS & CATALOGUES (PDF REGISTRY)
// =========================================================================
function formatDocDate(val: any): string {
  if (!val) return "Nov 2026";
  if (typeof val === "string" && /^[A-Za-z]{3}\s\d{4}$/.test(val)) return val;
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

function parseDocDate(val: any): Date {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  if (typeof val === "string") {
    const match = val.match(/^([A-Za-z]{3})\s+(\d{4})$/);
    if (match) {
      const months: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };
      const m = months[match[1].toLowerCase()];
      if (m !== undefined) {
        return new Date(Date.UTC(parseInt(match[2], 10), m, 1));
      }
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

function rowToDocument(row: any): LiveDocumentAsset {
  const cat = row.category || "";
  const sec = row.section || (
    cat === "Software" || cat === "Utilities"
      ? "software"
      : cat === "Policy" || cat === "Compliance"
        ? "warranty-rma"
        : "catalogues"
  );
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    section: sec,
    fileUrl: row.file_url,
    version: row.version,
    fileSize: row.file_size,
    format: row.format,
    updatedDate: formatDocDate(row.updated_date),
    isLive: Boolean(row.is_live),
    revisionSummary: row.revision_summary || undefined,
  };
}

export async function getDbDocuments(category?: string): Promise<LiveDocumentAsset[]> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  let query = `SELECT * FROM live_documents`;
  const params: any[] = [];
  if (category && category !== "ALL") {
    query += ` WHERE category = $1`;
    params.push(category);
  }
  query += ` ORDER BY sort_order ASC;`;
  const res = await db.query(query, params);
  return res.rows.map(rowToDocument);
}

export async function createDbDocument(doc: LiveDocumentAsset): Promise<LiveDocumentAsset> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  await db.query(
    `INSERT INTO live_documents (
      id, title, category, section, file_url, version, file_size, format, updated_date, is_live, revision_summary
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      category = EXCLUDED.category,
      section = EXCLUDED.section,
      file_url = EXCLUDED.file_url,
      version = EXCLUDED.version,
      file_size = EXCLUDED.file_size,
      format = EXCLUDED.format,
      updated_date = EXCLUDED.updated_date,
      is_live = EXCLUDED.is_live,
      revision_summary = EXCLUDED.revision_summary;`,
    [
      doc.id,
      doc.title,
      doc.category || "catalogues",
      doc.section || "catalogues",
      doc.fileUrl,
      doc.version || "v1.0",
      doc.fileSize || "1.0 MB",
      doc.format || "PDF",
      parseDocDate(doc.updatedDate),
      doc.isLive !== false,
      doc.revisionSummary || null,
    ]
  );
  return doc;
}

export async function updateDbDocument(id: string, updates: Partial<LiveDocumentAsset>): Promise<LiveDocumentAsset | null> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (updates.title !== undefined) {
    fields.push(`title = $${index++}`);
    values.push(updates.title);
  }
  if (updates.category !== undefined) {
    fields.push(`category = $${index++}`);
    values.push(updates.category);
  }
  if (updates.section !== undefined) {
    fields.push(`section = $${index++}`);
    values.push(updates.section);
  }
  if (updates.version !== undefined) {
    fields.push(`version = $${index++}`);
    values.push(updates.version);
  }
  if (updates.fileSize !== undefined) {
    fields.push(`file_size = $${index++}`);
    values.push(updates.fileSize);
  }
  if (updates.fileUrl !== undefined) {
    fields.push(`file_url = $${index++}`);
    values.push(updates.fileUrl);
  }
  if (updates.updatedDate !== undefined) {
    fields.push(`updated_date = $${index++}`);
    values.push(parseDocDate(updates.updatedDate));
  }
  if (updates.revisionSummary !== undefined) {
    fields.push(`revision_summary = $${index++}`);
    values.push(updates.revisionSummary || null);
  }
  if (updates.isLive !== undefined) {
    fields.push(`is_live = $${index++}`);
    values.push(updates.isLive);
  }

  if (fields.length === 0) return null;
  values.push(id);
  const query = `UPDATE live_documents SET ${fields.join(", ")} WHERE id = $${index} RETURNING *;`;
  const res = await db.query(query, values);
  if (res.rowCount === 0) return null;
  return rowToDocument(res.rows[0]);
}

export async function deleteDbDocument(id: string): Promise<boolean> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const res = await db.query(`DELETE FROM live_documents WHERE id = $1;`, [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function syncDbDocuments(docs: LiveDocumentAsset[]): Promise<LiveDocumentAsset[]> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const client = await db.connect();
  try {
    await client.query("BEGIN;");
    const activeIds = docs.map((d) => d.id).filter(Boolean);
    if (activeIds.length > 0) {
      await client.query(
        `DELETE FROM live_documents WHERE id NOT IN (${activeIds.map((_, i) => `$${i + 1}`).join(", ")});`,
        activeIds
      );
    } else {
      await client.query(`DELETE FROM live_documents;`);
    }

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      await client.query(
        `INSERT INTO live_documents (
          id, title, category, section, file_url, version, file_size, format, updated_date, is_live, revision_summary, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          section = EXCLUDED.section,
          file_url = EXCLUDED.file_url,
          version = EXCLUDED.version,
          file_size = EXCLUDED.file_size,
          format = EXCLUDED.format,
          updated_date = EXCLUDED.updated_date,
          is_live = EXCLUDED.is_live,
          revision_summary = EXCLUDED.revision_summary,
          sort_order = EXCLUDED.sort_order;`,
        [
          doc.id,
          doc.title,
          doc.category || "CCTV Cameras",
          doc.section || "catalogues",
          doc.fileUrl,
          doc.version,
          doc.fileSize,
          doc.format || "PDF",
          parseDocDate(doc.updatedDate),
          doc.isLive !== false,
          doc.revisionSummary || null,
          i,
        ]
      );
    }
    await client.query("COMMIT;");
    return docs;
  } catch (err) {
    await client.query("ROLLBACK;");
    throw err;
  } finally {
    client.release();
  }
}

// =========================================================================
// 4. HOMEPAGE HERO SLIDES
// =========================================================================
function rowToHeroSlide(row: any): HeroSlideCard {
  let specsArr: any[] = [];
  if (Array.isArray(row.specs)) specsArr = row.specs;
  else if (typeof row.specs === "string") {
    try {
      specsArr = JSON.parse(row.specs);
    } catch { }
  }

  let highlightsArr: string[] = [];
  if (Array.isArray(row.highlights)) highlightsArr = row.highlights;
  else if (typeof row.highlights === "string") {
    try {
      highlightsArr = JSON.parse(row.highlights);
    } catch { }
  }

  let schemaDetailsArr: any[] = [];
  if (Array.isArray(row.schema_details)) schemaDetailsArr = row.schema_details;
  else if (typeof row.schema_details === "string") {
    try {
      schemaDetailsArr = JSON.parse(row.schema_details);
    } catch { }
  }

  const isOffer = Boolean(
    row.is_offer ||
    row.type === "offer" ||
    row.type === "scheme" ||
    (row.sku && String(row.sku).startsWith("SCHEME")) ||
    (row.headline && String(row.headline).toLowerCase().includes("scheme"))
  );

  return {
    id: row.id,
    tabLabel: row.tab_label,
    category: row.category,
    badgeTag: row.badge_tag,
    badgeDetail: row.badge_detail,
    headline: row.headline,
    highlightText: row.highlight_text,
    description: row.description,
    primaryCtaText: row.primary_cta_text,
    primaryCtaLink: row.primary_cta_link,
    secondaryCtaText: row.secondary_cta_text,
    secondaryCtaLink: row.secondary_cta_link,
    productName: row.product_name,
    sku: row.sku,
    stockStatus: row.stock_status,
    warranty: row.warranty,
    specs: specsArr,
    highlights: highlightsArr,
    type: row.type,
    imageUrl: row.image_url || undefined,
    isActive: Boolean(row.is_active),
    isOffer,
    offerPrice: row.offer_price ? Number(row.offer_price) : undefined,
    mrpPrice: row.mrp_price ? Number(row.mrp_price) : undefined,
    savingsText: row.savings_text || undefined,
    schemaDetails: schemaDetailsArr.length ? schemaDetailsArr : undefined,
    productSaleData: row.product_sale_data || undefined,
  };
}

export async function getDbHeroSlides(): Promise<HeroSlideCard[]> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const res = await db.query(`SELECT * FROM hero_slides ORDER BY sort_order ASC;`);
  return res.rows.map(rowToHeroSlide);
}

export async function createDbHeroSlide(slide: HeroSlideCard): Promise<HeroSlideCard> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  await db.query(
    `INSERT INTO hero_slides (
      id, tab_label, category, badge_tag, badge_detail, headline, highlight_text, description,
      primary_cta_text, primary_cta_link, secondary_cta_text, secondary_cta_link,
      product_name, sku, stock_status, warranty, specs, highlights, type, image_url, is_active, sort_order,
      is_offer, offer_price, mrp_price, savings_text, schema_details
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, 0, $22, $23, $24, $25, $26)
    ON CONFLICT (id) DO UPDATE SET
      tab_label = EXCLUDED.tab_label,
      category = EXCLUDED.category,
      badge_tag = EXCLUDED.badge_tag,
      badge_detail = EXCLUDED.badge_detail,
      headline = EXCLUDED.headline,
      highlight_text = EXCLUDED.highlight_text,
      description = EXCLUDED.description,
      primary_cta_text = EXCLUDED.primary_cta_text,
      primary_cta_link = EXCLUDED.primary_cta_link,
      secondary_cta_text = EXCLUDED.secondary_cta_text,
      secondary_cta_link = EXCLUDED.secondary_cta_link,
      product_name = EXCLUDED.product_name,
      sku = EXCLUDED.sku,
      stock_status = EXCLUDED.stock_status,
      warranty = EXCLUDED.warranty,
      specs = EXCLUDED.specs,
      highlights = EXCLUDED.highlights,
      type = EXCLUDED.type,
      image_url = EXCLUDED.image_url,
      is_active = EXCLUDED.is_active,
      is_offer = EXCLUDED.is_offer,
      offer_price = EXCLUDED.offer_price,
      mrp_price = EXCLUDED.mrp_price,
      savings_text = EXCLUDED.savings_text,
      schema_details = EXCLUDED.schema_details;`,
    [
      slide.id,
      slide.tabLabel,
      slide.category,
      slide.badgeTag,
      slide.badgeDetail,
      slide.headline,
      slide.highlightText,
      slide.description,
      slide.primaryCtaText,
      slide.primaryCtaLink,
      slide.secondaryCtaText,
      slide.secondaryCtaLink,
      slide.productName,
      slide.sku,
      slide.stockStatus,
      slide.warranty,
      JSON.stringify(slide.specs || []),
      JSON.stringify(slide.highlights || []),
      slide.type,
      slide.imageUrl || null,
      slide.isActive !== false,
      slide.isOffer || false,
      slide.offerPrice || null,
      slide.mrpPrice || null,
      slide.savingsText || null,
      JSON.stringify(slide.schemaDetails || []),
    ]
  );
  return slide;
}

export async function updateDbHeroSlide(id: string, updates: Partial<HeroSlideCard>): Promise<HeroSlideCard | null> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (updates.tabLabel !== undefined) {
    fields.push(`tab_label = $${index++}`);
    values.push(updates.tabLabel);
  }
  if (updates.headline !== undefined) {
    fields.push(`headline = $${index++}`);
    values.push(updates.headline);
  }
  if (updates.highlightText !== undefined) {
    fields.push(`highlight_text = $${index++}`);
    values.push(updates.highlightText);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${index++}`);
    values.push(updates.description);
  }
  if (updates.imageUrl !== undefined) {
    fields.push(`image_url = $${index++}`);
    values.push(updates.imageUrl);
  }
  if (updates.isActive !== undefined) {
    fields.push(`is_active = $${index++}`);
    values.push(updates.isActive);
  }
  if (updates.isOffer !== undefined) {
    fields.push(`is_offer = $${index++}`);
    values.push(updates.isOffer);
  }
  if (updates.offerPrice !== undefined) {
    fields.push(`offer_price = $${index++}`);
    values.push(updates.offerPrice);
  }
  if (updates.mrpPrice !== undefined) {
    fields.push(`mrp_price = $${index++}`);
    values.push(updates.mrpPrice);
  }
  if (updates.savingsText !== undefined) {
    fields.push(`savings_text = $${index++}`);
    values.push(updates.savingsText);
  }
  if (updates.badgeTag !== undefined) {
    fields.push(`badge_tag = $${index++}`);
    values.push(updates.badgeTag);
  }
  if (updates.badgeDetail !== undefined) {
    fields.push(`badge_detail = $${index++}`);
    values.push(updates.badgeDetail);
  }
  if (updates.primaryCtaText !== undefined) {
    fields.push(`primary_cta_text = $${index++}`);
    values.push(updates.primaryCtaText);
  }
  if (updates.primaryCtaLink !== undefined) {
    fields.push(`primary_cta_link = $${index++}`);
    values.push(updates.primaryCtaLink);
  }
  if (updates.secondaryCtaText !== undefined) {
    fields.push(`secondary_cta_text = $${index++}`);
    values.push(updates.secondaryCtaText);
  }
  if (updates.secondaryCtaLink !== undefined) {
    fields.push(`secondary_cta_link = $${index++}`);
    values.push(updates.secondaryCtaLink);
  }
  if (updates.specs !== undefined) {
    fields.push(`specs = $${index++}`);
    values.push(JSON.stringify(updates.specs));
  }
  if ((updates as any).productSaleData !== undefined) {
    fields.push(`product_sale_data = $${index++}`);
    values.push(JSON.stringify((updates as any).productSaleData));
  }
  if (updates.schemaDetails !== undefined) {
    fields.push(`schema_details = $${index++}`);
    values.push(JSON.stringify(updates.schemaDetails));
  }

  if (fields.length === 0) return null;
  values.push(id);
  const query = `UPDATE hero_slides SET ${fields.join(", ")} WHERE id = $${index} RETURNING *;`;
  const res = await db.query(query, values);
  if (res.rowCount === 0) return null;
  return rowToHeroSlide(res.rows[0]);
}

export async function deleteDbHeroSlide(id: string): Promise<boolean> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const res = await db.query(`DELETE FROM hero_slides WHERE id = $1;`, [id]);
  return (res.rowCount ?? 0) > 0;
}

// =========================================================================
// 5. ANNOUNCEMENT & SALES BANNERS
// =========================================================================
function rowToBanner(row: any): AnnouncementBanner {
  let tags: string[] = [];
  if (Array.isArray(row.custom_tags)) tags = row.custom_tags;
  else if (typeof row.custom_tags === "string") {
    try {
      tags = JSON.parse(row.custom_tags);
    } catch { }
  }

  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle || undefined,
    badgeText: row.badge_text || undefined,
    ctaText: row.cta_text || undefined,
    ctaLink: row.cta_link || undefined,
    type: row.type || "TOP_TICKER",
    isActive: Boolean(row.is_active),
    discountPercent: row.discount_percent ? Number(row.discount_percent) : undefined,
    startDate: row.start_date || undefined,
    endDate: row.end_date || undefined,
    startsAt: row.starts_at ? new Date(row.starts_at).toISOString() : null,
    endsAt: row.ends_at ? new Date(row.ends_at).toISOString() : null,
    accentStyle: row.accent_style || "red",
    customTags: tags,
    sortOrder: row.sort_order !== undefined && row.sort_order !== null ? Number(row.sort_order) : 0,
  };
}

let cachedTicker: { settings: TickerSettings; messages: AnnouncementBanner[]; timestamp: number } | null = null;
const TICKER_CACHE_TTL_MS = 60000;

export function invalidateTickerCache() {
  cachedTicker = null;
}

function rowToTickerSettings(row: any): TickerSettings {
  return {
    id: Number(row.id),
    isEnabled: Boolean(row.is_enabled),
    rotationSeconds: Math.max(2, Math.min(20, Number(row.rotation_seconds) || 4)),
    animation: ["fade", "slide-up", "marquee"].includes(row.animation) ? row.animation : "fade",
    pauseOnHover: Boolean(row.pause_on_hover),
    showPlantDesk: Boolean(row.show_plant_desk),
    plantDeskText: row.plant_desk_text || "Sahibabad Plant Direct Supply",
    showPhone: Boolean(row.show_phone),
    phoneDisplay: row.phone_display || "+91 87003 17239",
    phoneTel: row.phone_tel || "+918700317239",
    showWhatsapp: Boolean(row.show_whatsapp),
    whatsappLabel: row.whatsapp_label || "Quick Order via WhatsApp",
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    updatedBy: row.updated_by || undefined,
  };
}

export async function getDbTickerSettings(): Promise<TickerSettings> {
  const ready = await initializeDatabase();
  if (!ready) {
    return {
      id: 1,
      isEnabled: true,
      rotationSeconds: 4,
      animation: "fade",
      pauseOnHover: true,
      showPlantDesk: true,
      plantDeskText: "Sahibabad Plant Direct Supply",
      showPhone: true,
      phoneDisplay: "+91 87003 17239",
      phoneTel: "+918700317239",
      showWhatsapp: true,
      whatsappLabel: "Quick Order via WhatsApp",
    };
  }
  const db = getDbPool();
  const res = await db.query(`SELECT * FROM ticker_settings WHERE id = 1 LIMIT 1;`);
  if (res.rowCount === 0) {
    const insertRes = await db.query(`
      INSERT INTO ticker_settings (
        id, is_enabled, rotation_seconds, animation, pause_on_hover,
        show_plant_desk, plant_desk_text, show_phone, phone_display,
        phone_tel, show_whatsapp, whatsapp_label
      ) VALUES (
        1, true, 4, 'fade', true,
        true, 'Sahibabad Plant Direct Supply', true, '+91 87003 17239',
        '+918700317239', true, 'Quick Order via WhatsApp'
      ) ON CONFLICT (id) DO UPDATE SET id = 1 RETURNING *;
    `);
    return rowToTickerSettings(insertRes.rows[0]);
  }
  return rowToTickerSettings(res.rows[0]);
}

export async function updateDbTickerSettings(
  updates: Partial<TickerSettings>,
  updatedBy: string = "admin"
): Promise<TickerSettings> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();

  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (updates.isEnabled !== undefined) {
    fields.push(`is_enabled = $${index++}`);
    values.push(updates.isEnabled);
  }
  if (updates.rotationSeconds !== undefined) {
    const clamped = Math.max(2, Math.min(20, Number(updates.rotationSeconds) || 4));
    fields.push(`rotation_seconds = $${index++}`);
    values.push(clamped);
  }
  if (updates.animation !== undefined) {
    const anim = ["fade", "slide-up", "marquee"].includes(updates.animation) ? updates.animation : "fade";
    fields.push(`animation = $${index++}`);
    values.push(anim);
  }
  if (updates.pauseOnHover !== undefined) {
    fields.push(`pause_on_hover = $${index++}`);
    values.push(updates.pauseOnHover);
  }
  if (updates.showPlantDesk !== undefined) {
    fields.push(`show_plant_desk = $${index++}`);
    values.push(updates.showPlantDesk);
  }
  if (updates.plantDeskText !== undefined) {
    fields.push(`plant_desk_text = $${index++}`);
    values.push(updates.plantDeskText);
  }
  if (updates.showPhone !== undefined) {
    fields.push(`show_phone = $${index++}`);
    values.push(updates.showPhone);
  }
  if (updates.phoneDisplay !== undefined) {
    fields.push(`phone_display = $${index++}`);
    values.push(updates.phoneDisplay);
  }
  if (updates.phoneTel !== undefined) {
    fields.push(`phone_tel = $${index++}`);
    values.push(updates.phoneTel);
  }
  if (updates.showWhatsapp !== undefined) {
    fields.push(`show_whatsapp = $${index++}`);
    values.push(updates.showWhatsapp);
  }
  if (updates.whatsappLabel !== undefined) {
    fields.push(`whatsapp_label = $${index++}`);
    values.push(updates.whatsappLabel);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  fields.push(`updated_by = $${index++}`);
  values.push(updatedBy);

  const query = `UPDATE ticker_settings SET ${fields.join(", ")} WHERE id = 1 RETURNING *;`;
  const res = await db.query(query, values);
  invalidateTickerCache();
  return rowToTickerSettings(res.rows[0]);
}

export async function getDbActiveTickerBanners(): Promise<AnnouncementBanner[]> {
  const ready = await initializeDatabase();
  if (!ready) return [];
  const db = getDbPool();
  const res = await db.query(`
    SELECT * FROM announcement_banners
    WHERE is_active = true
      AND (starts_at IS NULL OR starts_at <= CURRENT_TIMESTAMP)
      AND (ends_at IS NULL OR ends_at >= CURRENT_TIMESTAMP)
    ORDER BY sort_order ASC, id ASC;
  `);
  return res.rows.map(rowToBanner);
}

export async function getCachedTickerPayload(): Promise<{ settings: TickerSettings; messages: AnnouncementBanner[] }> {
  const now = Date.now();
  if (cachedTicker && now - cachedTicker.timestamp < TICKER_CACHE_TTL_MS) {
    return { settings: cachedTicker.settings, messages: cachedTicker.messages };
  }
  const [settings, messages] = await Promise.all([
    getDbTickerSettings(),
    getDbActiveTickerBanners(),
  ]);
  cachedTicker = { settings, messages, timestamp: now };
  return { settings, messages };
}

export async function getDbBanners(): Promise<AnnouncementBanner[]> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const res = await db.query(`SELECT * FROM announcement_banners ORDER BY sort_order ASC, id ASC;`);
  return res.rows.map(rowToBanner);
}

export async function createDbBanner(banner: AnnouncementBanner): Promise<AnnouncementBanner> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  await db.query(
    `INSERT INTO announcement_banners (
      id, title, subtitle, badge_text, cta_text, cta_link, type, is_active, discount_percent,
      start_date, end_date, starts_at, ends_at, accent_style, custom_tags, sort_order
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      subtitle = EXCLUDED.subtitle,
      badge_text = EXCLUDED.badge_text,
      cta_text = EXCLUDED.cta_text,
      cta_link = EXCLUDED.cta_link,
      type = EXCLUDED.type,
      is_active = EXCLUDED.is_active,
      discount_percent = EXCLUDED.discount_percent,
      starts_at = EXCLUDED.starts_at,
      ends_at = EXCLUDED.ends_at,
      accent_style = EXCLUDED.accent_style,
      custom_tags = EXCLUDED.custom_tags,
      sort_order = EXCLUDED.sort_order;`,
    [
      banner.id,
      banner.title,
      banner.subtitle || null,
      banner.badgeText || null,
      banner.ctaText || null,
      banner.ctaLink || null,
      banner.type || "TOP_TICKER",
      banner.isActive,
      banner.discountPercent || null,
      banner.startDate || null,
      banner.endDate || null,
      banner.startsAt ? new Date(banner.startsAt) : null,
      banner.endsAt ? new Date(banner.endsAt) : null,
      banner.accentStyle || "red",
      JSON.stringify(banner.customTags || []),
      banner.sortOrder ?? 0,
    ]
  );
  invalidateTickerCache();
  return banner;
}

export async function updateDbBanner(id: string, updates: Partial<AnnouncementBanner>): Promise<AnnouncementBanner | null> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (updates.title !== undefined) {
    fields.push(`title = $${index++}`);
    values.push(updates.title);
  }
  if (updates.subtitle !== undefined) {
    fields.push(`subtitle = $${index++}`);
    values.push(updates.subtitle || null);
  }
  if (updates.badgeText !== undefined) {
    fields.push(`badge_text = $${index++}`);
    values.push(updates.badgeText || null);
  }
  if (updates.ctaText !== undefined) {
    fields.push(`cta_text = $${index++}`);
    values.push(updates.ctaText || null);
  }
  if (updates.ctaLink !== undefined) {
    fields.push(`cta_link = $${index++}`);
    values.push(updates.ctaLink || null);
  }
  if (updates.isActive !== undefined) {
    fields.push(`is_active = $${index++}`);
    values.push(updates.isActive);
  }
  if (updates.discountPercent !== undefined) {
    fields.push(`discount_percent = $${index++}`);
    values.push(updates.discountPercent || null);
  }
  if (updates.startsAt !== undefined) {
    fields.push(`starts_at = $${index++}`);
    values.push(updates.startsAt ? new Date(updates.startsAt) : null);
  }
  if (updates.endsAt !== undefined) {
    fields.push(`ends_at = $${index++}`);
    values.push(updates.endsAt ? new Date(updates.endsAt) : null);
  }
  if (updates.accentStyle !== undefined) {
    fields.push(`accent_style = $${index++}`);
    values.push(updates.accentStyle);
  }
  if (updates.sortOrder !== undefined) {
    fields.push(`sort_order = $${index++}`);
    values.push(updates.sortOrder);
  }

  if (fields.length === 0) return null;
  values.push(id);
  const query = `UPDATE announcement_banners SET ${fields.join(", ")} WHERE id = $${index} RETURNING *;`;
  const res = await db.query(query, values);
  if (res.rowCount === 0) return null;
  invalidateTickerCache();
  return rowToBanner(res.rows[0]);
}

export async function deleteDbBanner(id: string): Promise<boolean> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const res = await db.query(`DELETE FROM announcement_banners WHERE id = $1;`, [id]);
  invalidateTickerCache();
  return (res.rowCount ?? 0) > 0;
}

// =========================================================================
// 6. GOOGLE REVIEWS & TESTIMONIALS
// =========================================================================
function rowToReview(row: any): GoogleReview {
  return {
    id: row.id,
    authorName: row.author_name,
    authorRole: row.author_role,
    rating: Number(row.rating),
    reviewText: row.review_text,
    relativeTime: row.relative_time,
    isFeatured: Boolean(row.is_featured),
    source: row.source,
    companyName: row.company_name || undefined,
    city: row.city || undefined,
    dealerTier: row.dealer_tier || undefined,
    hardwareVolume: row.hardware_volume || undefined,
    isVerifiedPartner: Boolean(row.is_verified_partner),
  };
}

export async function getDbReviews(): Promise<GoogleReview[]> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const res = await db.query(`SELECT * FROM google_reviews ORDER BY sort_order ASC;`);
  return res.rows.map(rowToReview);
}

export async function createDbReview(review: GoogleReview): Promise<GoogleReview> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  await db.query(
    `INSERT INTO google_reviews (
      id, author_name, author_role, rating, review_text, relative_time, is_featured, source,
      company_name, city, dealer_tier, hardware_volume, is_verified_partner, sort_order
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0)
    ON CONFLICT (id) DO UPDATE SET
      author_name = EXCLUDED.author_name,
      author_role = EXCLUDED.author_role,
      rating = EXCLUDED.rating,
      review_text = EXCLUDED.review_text,
      relative_time = EXCLUDED.relative_time,
      is_featured = EXCLUDED.is_featured,
      source = EXCLUDED.source,
      company_name = EXCLUDED.company_name,
      city = EXCLUDED.city,
      dealer_tier = EXCLUDED.dealer_tier,
      hardware_volume = EXCLUDED.hardware_volume,
      is_verified_partner = EXCLUDED.is_verified_partner;`,
    [
      review.id,
      review.authorName,
      review.authorRole,
      review.rating,
      review.reviewText,
      review.relativeTime,
      review.isFeatured,
      review.source,
      review.companyName || null,
      review.city || null,
      review.dealerTier || null,
      review.hardwareVolume || null,
      review.isVerifiedPartner || false,
    ]
  );
  return review;
}

// Atomically save/upsert a batch of reviews in PostgreSQL (SEC-MED-03)
export async function saveDbReviews(reviews: GoogleReview[]): Promise<GoogleReview[]> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const client = await db.connect();

  try {
    await client.query("BEGIN;");
    for (const review of reviews) {
      await client.query(
        `INSERT INTO google_reviews (
          id, author_name, author_role, rating, review_text, relative_time, is_featured, source,
          company_name, city, dealer_tier, hardware_volume, is_verified_partner, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0)
        ON CONFLICT (id) DO UPDATE SET
          author_name = EXCLUDED.author_name,
          author_role = EXCLUDED.author_role,
          rating = EXCLUDED.rating,
          review_text = EXCLUDED.review_text,
          relative_time = EXCLUDED.relative_time,
          is_featured = EXCLUDED.is_featured,
          source = EXCLUDED.source,
          company_name = EXCLUDED.company_name,
          city = EXCLUDED.city,
          dealer_tier = EXCLUDED.dealer_tier,
          hardware_volume = EXCLUDED.hardware_volume,
          is_verified_partner = EXCLUDED.is_verified_partner;`,
        [
          review.id,
          review.authorName,
          review.authorRole,
          review.rating,
          review.reviewText,
          review.relativeTime,
          review.isFeatured,
          review.source,
          review.companyName || null,
          review.city || null,
          review.dealerTier || null,
          review.hardwareVolume || null,
          review.isVerifiedPartner || false,
        ]
      );
    }
    await client.query("COMMIT;");
    return reviews;
  } catch (err) {
    await client.query("ROLLBACK;");
    throw err;
  } finally {
    client.release();
  }
}

export async function updateDbReview(id: string, updates: Partial<GoogleReview>): Promise<GoogleReview | null> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (updates.authorName !== undefined) {
    fields.push(`author_name = $${index++}`);
    values.push(updates.authorName);
  }
  if (updates.rating !== undefined) {
    fields.push(`rating = $${index++}`);
    values.push(updates.rating);
  }
  if (updates.reviewText !== undefined) {
    fields.push(`review_text = $${index++}`);
    values.push(updates.reviewText);
  }
  if (updates.isFeatured !== undefined) {
    fields.push(`is_featured = $${index++}`);
    values.push(updates.isFeatured);
  }

  if (fields.length === 0) return null;
  values.push(id);
  const query = `UPDATE google_reviews SET ${fields.join(", ")} WHERE id = $${index} RETURNING *;`;
  const res = await db.query(query, values);
  if (res.rowCount === 0) return null;
  return rowToReview(res.rows[0]);
}

export async function deleteDbReview(id: string): Promise<boolean> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const res = await db.query(`DELETE FROM google_reviews WHERE id = $1;`, [id]);
  return (res.rowCount ?? 0) > 0;
}

// =========================================================================
// 7. PERMANENT BINARY FILE STORAGE (PDFs & Datasheets)
// =========================================================================
export async function saveUploadedFile(
  filename: string,
  buffer: Buffer,
  mimeType: string = "application/pdf",
  fileSize?: number | string
): Promise<{ id: string; filename: string; fileUrl: string; fileSize: number }> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const id = `file-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const cleanFilename = filename.toLowerCase().replace(/[^a-z0-9.-]/g, "_");

  let sizeInBytes = buffer.length;
  if (typeof fileSize === "number" && !isNaN(fileSize)) {
    sizeInBytes = Math.floor(fileSize);
  } else if (typeof fileSize === "string" && /^\d+$/.test(fileSize.trim())) {
    sizeInBytes = parseInt(fileSize.trim(), 10);
  }

  await db.query(
    `INSERT INTO uploaded_files (id, filename, file_data, mime_type, file_size, created_at)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
     ON CONFLICT (filename) DO UPDATE SET
       file_data = EXCLUDED.file_data,
       mime_type = EXCLUDED.mime_type,
       file_size = EXCLUDED.file_size,
       created_at = CURRENT_TIMESTAMP;`,
    [id, cleanFilename, buffer, mimeType, sizeInBytes]
  );

  return {
    id,
    filename: cleanFilename,
    fileUrl: `/downloads/${cleanFilename}`,
    fileSize: sizeInBytes,
  };
}

export async function getUploadedFile(
  filename: string
): Promise<{ buffer: Buffer; mimeType: string; filename: string; id?: string; fileSize?: number; createdAt?: string } | null> {
  const ready = await initializeDatabase();
  if (!ready) return null;
  try {
    const db = getDbPool();
    const cleanFilename = filename.toLowerCase().replace(/[^a-z0-9.-]/g, "_");
    const rawLookup = filename.trim();
    const res = await db.query(
      `SELECT id, file_data, mime_type, filename, file_size, created_at FROM uploaded_files 
       WHERE id = $1 OR filename = $1 OR filename ILIKE $2 LIMIT 1;`,
      [rawLookup, cleanFilename]
    );
    if (res.rowCount === 0) return null;
    return {
      id: res.rows[0].id,
      buffer: res.rows[0].file_data,
      mimeType: res.rows[0].mime_type || "application/pdf",
      filename: res.rows[0].filename,
      fileSize: res.rows[0].file_size ? Number(res.rows[0].file_size) : res.rows[0].file_data.length,
      createdAt: res.rows[0].created_at ? new Date(res.rows[0].created_at).toISOString() : new Date().toISOString(),
    };
  } catch (err) {
    console.warn("[getUploadedFile Error]:", err);
    return null;
  }
}

export async function deleteUploadedFile(
  filename: string
): Promise<boolean> {
  const ready = await initializeDatabase();
  if (!ready) return false;
  try {
    const db = getDbPool();
    const cleanFilename = filename.toLowerCase().replace(/[^a-z0-9.-]/g, "_");
    const res = await db.query(
      `DELETE FROM uploaded_files WHERE filename = $1 OR filename ILIKE $1;`,
      [cleanFilename]
    );
    return (res.rowCount ?? 0) > 0;
  } catch (err) {
    console.warn("[deleteUploadedFile Error]:", err);
    return false;
  }
}

// =========================================================================
// 8. AUTHORIZED DEALERS NETWORK (PostgreSQL Driven)
// =========================================================================
function rowToDealer(row: any): DealerHub {
  return {
    id: row.id,
    state: row.state,
    city: row.city,
    address: row.address,
    contact: row.contact,
    type: row.type || "Authorized Dealer",
    isActive: Boolean(row.is_active),
  };
}

export async function getDbDealers(): Promise<DealerHub[]> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const res = await db.query(`SELECT * FROM dealers ORDER BY sort_order ASC, state ASC;`);
  return res.rows.map(rowToDealer);
}

export async function createDbDealer(dealer: DealerHub): Promise<DealerHub> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const id = dealer.id || `dealer-${Date.now()}`;

  await db.query(
    `INSERT INTO dealers (id, state, city, address, contact, type, is_active, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
     ON CONFLICT (id) DO UPDATE SET
       state = EXCLUDED.state,
       city = EXCLUDED.city,
       address = EXCLUDED.address,
       contact = EXCLUDED.contact,
       type = EXCLUDED.type,
       is_active = EXCLUDED.is_active,
       updated_at = CURRENT_TIMESTAMP;`,
    [
      id,
      dealer.state.trim(),
      dealer.city.trim(),
      dealer.address.trim(),
      dealer.contact.trim(),
      dealer.type || "Authorized Dealer",
      dealer.isActive !== false,
    ]
  );

  return { ...dealer, id, isActive: dealer.isActive !== false };
}

export async function updateDbDealer(id: string, updates: Partial<DealerHub>): Promise<DealerHub | null> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (updates.state !== undefined) {
    fields.push(`state = $${index++}`);
    values.push(updates.state.trim());
  }
  if (updates.city !== undefined) {
    fields.push(`city = $${index++}`);
    values.push(updates.city.trim());
  }
  if (updates.address !== undefined) {
    fields.push(`address = $${index++}`);
    values.push(updates.address.trim());
  }
  if (updates.contact !== undefined) {
    fields.push(`contact = $${index++}`);
    values.push(updates.contact.trim());
  }
  if (updates.type !== undefined) {
    fields.push(`type = $${index++}`);
    values.push(updates.type);
  }
  if (updates.isActive !== undefined) {
    fields.push(`is_active = $${index++}`);
    values.push(updates.isActive);
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);
  const query = `UPDATE dealers SET ${fields.join(", ")} WHERE id = $${index} RETURNING *;`;
  const res = await db.query(query, values);
  if (res.rowCount === 0) return null;
  return rowToDealer(res.rows[0]);
}

export async function deleteDbDealer(id: string): Promise<boolean> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const res = await db.query(`DELETE FROM dealers WHERE id = $1;`, [id]);
  return (res.rowCount ?? 0) > 0;
}

// =========================================================================
// 9. CHECKOUT ORDERS & INVOICES (Full ACID PostgreSQL)
// =========================================================================
function rowToOrder(row: any): CheckoutOrder {
  let itemsArr: any[] = [];
  if (Array.isArray(row.items)) itemsArr = row.items;
  else if (typeof row.items === "string") {
    try {
      itemsArr = JSON.parse(row.items);
    } catch { }
  }

  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    companyName: row.company_name || null,
    phone: row.phone,
    email: row.email,
    street: row.street,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    gstin: row.gstin || undefined,
    subtotal: Number(row.subtotal),
    gstAmount: Number(row.gst_amount),
    totalAmount: Number(row.total_amount),
    paymentMode: row.payment_mode || "UPI",
    utrNumber: row.utr_number || null,
    paymentStatus: row.payment_status || "PENDING_VERIFICATION",
    orderStatus: row.order_status || "PLACED",
    adminNotes: row.admin_notes || null,
    items: itemsArr,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

export async function getDbOrders(includeAbandoned: boolean = false): Promise<CheckoutOrder[]> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const query = includeAbandoned
    ? `SELECT * FROM orders ORDER BY created_at DESC;`
    : `SELECT * FROM orders 
       WHERE NOT (payment_status = 'AWAITING_PAYMENT' AND created_at < NOW() - INTERVAL '24 hours')
       ORDER BY created_at DESC;`;
  const res = await db.query(query);
  return res.rows.map(rowToOrder);
}

export async function cleanupAbandonedOrders(): Promise<number> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const res = await db.query(
    `DELETE FROM orders WHERE payment_status = 'AWAITING_PAYMENT' AND created_at < NOW() - INTERVAL '24 hours';`
  );
  return res.rowCount ?? 0;
}

export async function getDbOrderById(idOrOrderNum: string): Promise<CheckoutOrder | null> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const res = await db.query(
    `SELECT * FROM orders WHERE id = $1 OR order_number = $1 LIMIT 1;`,
    [idOrOrderNum]
  );
  if (res.rowCount === 0) return null;
  return rowToOrder(res.rows[0]);
}

export async function getDbOrderByUtr(utr: string): Promise<CheckoutOrder | null> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const res = await db.query(
    `SELECT * FROM orders WHERE utr_number = $1 LIMIT 1;`,
    [utr]
  );
  if (res.rowCount === 0) return null;
  return rowToOrder(res.rows[0]);
}

export async function createDbOrder(payload: Omit<CheckoutOrder, "id" | "createdAt"> & { id?: string }): Promise<CheckoutOrder> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const id = payload.id || `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  await db.query(
    `INSERT INTO orders (
      id, order_number, customer_name, company_name, phone, email, street, city, state, pincode,
      gstin, subtotal, gst_amount, total_amount, payment_mode, utr_number, payment_status, order_status, admin_notes, items
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20);`,
    [
      id,
      payload.orderNumber,
      payload.customerName,
      payload.companyName || null,
      payload.phone,
      payload.email,
      payload.street,
      payload.city,
      payload.state,
      payload.pincode,
      payload.gstin || null,
      payload.subtotal,
      payload.gstAmount,
      payload.totalAmount,
      payload.paymentMode || "UPI",
      payload.utrNumber || null,
      payload.paymentStatus || "PENDING_VERIFICATION",
      payload.orderStatus || "PLACED",
      payload.adminNotes || null,
      JSON.stringify(payload.items || []),
    ]
  );

  return {
    ...payload,
    id,
    createdAt: new Date().toISOString(),
  };
}

export async function updateDbOrderStatus(id: string, orderStatus: string, adminNotes?: string): Promise<boolean> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const res = await db.query(
    `UPDATE orders SET order_status = $1, admin_notes = COALESCE($2, admin_notes), updated_at = CURRENT_TIMESTAMP WHERE id = $3 OR order_number = $3;`,
    [orderStatus, adminNotes || null, id]
  );
  return (res.rowCount ?? 0) > 0;
}

export async function confirmDbOrderPayment(orderId: string, adminNotes?: string): Promise<{ success: boolean; error?: string }> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const client = await db.connect();

  try {
    await client.query("BEGIN;");

    const orderRes = await client.query(`SELECT * FROM orders WHERE id = $1 OR order_number = $1 FOR UPDATE;`, [orderId]);
    if (orderRes.rowCount === 0) {
      await client.query("ROLLBACK;");
      return { success: false, error: "Order not found." };
    }

    const order = orderRes.rows[0];
    if (order.payment_status === "CONFIRMED") {
      await client.query("ROLLBACK;");
      return { success: false, error: "Payment is already confirmed." };
    }

    await client.query(
      `UPDATE orders 
       SET payment_status = 'CONFIRMED', 
           order_status = 'PROCESSING', 
           admin_notes = COALESCE($1, admin_notes),
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2;`,
      [adminNotes || null, order.id]
    );

    let itemsArr: any[] = [];
    if (Array.isArray(order.items)) itemsArr = order.items;
    else if (typeof order.items === "string") {
      try { itemsArr = JSON.parse(order.items); } catch { }
    }

    for (const item of itemsArr) {
      const pId = item.productId || item.id;
      const model = item.modelCode;
      const qty = Number(item.quantity) || 1;

      if (pId) {
        await client.query(
          `UPDATE products 
           SET stock_quantity = GREATEST(0, stock_quantity - $1) 
           WHERE id = $2 OR slug = $2;`,
          [qty, pId]
        );
      } else if (model) {
        await client.query(
          `UPDATE products 
           SET stock_quantity = GREATEST(0, stock_quantity - $1) 
           WHERE model_code = $2;`,
          [qty, model]
        );
      }
    }

    await client.query("COMMIT;");
    return { success: true };
  } catch (err: any) {
    await client.query("ROLLBACK;");
    console.error("[confirmDbOrderPayment Transaction Error]:", err);
    return { success: false, error: err.message };
  } finally {
    client.release();
  }
}

export async function rejectDbOrderPayment(orderId: string, adminNotes?: string): Promise<{ success: boolean; error?: string }> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();

  try {
    const res = await db.query(
      `UPDATE orders 
       SET payment_status = 'REJECTED', 
           order_status = 'CANCELLED', 
           admin_notes = COALESCE($1, admin_notes),
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 OR order_number = $2;`,
      [adminNotes || null, orderId]
    );
    if ((res.rowCount ?? 0) === 0) {
      return { success: false, error: "Order not found." };
    }
    return { success: true };
  } catch (err: any) {
    console.error("[rejectDbOrderPayment Error]:", err);
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 10. HOMEPAGE CATEGORY CARDS SHOWCASE
const DEFAULT_CATEGORY_IMAGES_MAP: Record<string, string> = {
  "cctv-cameras": "/images/categories/cctv-cameras.jpg",
  "dvr-nvr": "/images/categories/dvr-nvr-recorders.jpg",
  "networking-poe": "/images/categories/networking-poe.jpg",
  cables: "/images/categories/surveillance-cables.jpg",
  "network-racks": "/images/categories/dvr-server-racks.jpg",
  "power-accessories": "/images/categories/power-supplies-smps.jpg",
};

// =========================================================================
function rowToHomepageCategoryCard(row: any): HomepageCategoryCard {
  return {
    id: row.id,
    categoryId: row.category_id,
    position: Number(row.position ?? 0),
    isVisible: Boolean(row.is_visible),
    title: row.title,
    badge: row.badge || undefined,
    buttonText: row.button_text || "Explore Catalogue",
    description: row.description,
    chips: Array.isArray(row.chips) ? row.chips : [],
    scenePreset: row.scene_preset || "custom_image",
    backgroundImageUrl:
      row.background_image_url ||
      DEFAULT_CATEGORY_IMAGES_MAP[row.category_id] ||
      "/images/categories/cctv-cameras.jpg",
    productImageUrls: Array.isArray(row.product_image_urls) ? row.product_image_urls : [],
    linkUrl: row.link_url || `/catalogue?category=${row.category_id}`,
    skuCount: row.sku_count !== undefined ? Number(row.sku_count) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    updatedBy: row.updated_by || undefined,
  };
}

export async function getDbHomepageCategories(): Promise<HomepageCategoryCard[]> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const res = await db.query(`
    SELECT c.*,
      COALESCE(
        (SELECT COUNT(*) FROM products p WHERE p.category = c.category_id),
        0
      ) AS sku_count
    FROM homepage_category_cards c
    ORDER BY c.position ASC;
  `);
  return res.rows.map(rowToHomepageCategoryCard);
}

export async function saveDbHomepageCategories(
  cards: HomepageCategoryCard[]
): Promise<HomepageCategoryCard[]> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();

  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error("Category cards list cannot be empty.");
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN;");
    await client.query("DELETE FROM homepage_category_cards;");

    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      const cardId = c.id && !c.id.startsWith("temp-")
        ? c.id
        : `cat-card-${c.categoryId}-${i}`;
      await client.query(
        `INSERT INTO homepage_category_cards (
          id, category_id, position, is_visible, title, badge, button_text, description, chips,
          scene_preset, background_image_url, product_image_urls, link_url, updated_at, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, $14);`,
        [
          cardId,
          c.categoryId,
          i,
          c.isVisible !== false,
          c.title.substring(0, 40),
          c.badge ? c.badge.substring(0, 32) : null,
          c.buttonText ? c.buttonText.substring(0, 64) : "Explore Catalogue",
          c.description.substring(0, 110),
          Array.isArray(c.chips) ? c.chips.slice(0, 4) : [],
          c.scenePreset || "custom_image",
          c.backgroundImageUrl || DEFAULT_CATEGORY_IMAGES_MAP[c.categoryId] || "/images/categories/cctv-cameras.jpg",
          Array.isArray(c.productImageUrls) ? c.productImageUrls.slice(0, 3) : [],
          c.linkUrl || `/catalogue?category=${c.categoryId}`,
          c.updatedBy || "admin",
        ]
      );
    }

    await client.query("COMMIT;");
  } catch (err) {
    await client.query("ROLLBACK;");
    throw err;
  } finally {
    client.release();
  }

  return getDbHomepageCategories();
}

// =========================================================================
// 11. SEARCH POPULAR CHIPS & SEARCH INSIGHTS LOGGING
// =========================================================================
function rowToSearchPopularTerm(row: any): SearchPopularTerm {
  return {
    id: row.id,
    label: row.label,
    query: row.query,
    linkUrl: row.link_url || null,
    position: Number(row.position ?? 0),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    updatedBy: row.updated_by || undefined,
  };
}

export async function getDbPopularSearchTerms(activeOnly = true): Promise<SearchPopularTerm[]> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const res = await db.query(
    `SELECT * FROM search_popular_terms
     WHERE ($1::boolean IS FALSE OR is_active = true)
     ORDER BY position ASC;`,
    [!activeOnly]
  );
  return res.rows.map(rowToSearchPopularTerm);
}

export async function saveDbPopularSearchTerms(
  terms: SearchPopularTerm[]
): Promise<SearchPopularTerm[]> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();

  if (!Array.isArray(terms)) {
    throw new Error("Popular search terms list must be an array.");
  }

  // Max 10 active chips constraint
  const activeCount = terms.filter((t) => t.isActive).length;
  if (activeCount > 10) {
    throw new Error("Maximum 10 active search chips allowed.");
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN;");
    await client.query("DELETE FROM search_popular_terms;");

    for (let i = 0; i < terms.length; i++) {
      const t = terms[i];
      const termId = t.id && !t.id.startsWith("temp-") ? t.id : `pop-${i}-${Date.now().toString(36)}`;
      const label = t.label.trim().substring(0, 32);
      const query = (t.query || t.label).trim().substring(0, 60);
      const linkUrl = t.linkUrl ? t.linkUrl.trim() : null;

      await client.query(
        `INSERT INTO search_popular_terms (
          id, label, query, link_url, position, is_active, updated_at, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7);`,
        [termId, label, query, linkUrl, i, t.isActive !== false, t.updatedBy || "admin"]
      );
    }

    await client.query("COMMIT;");
  } catch (err) {
    await client.query("ROLLBACK;");
    throw err;
  } finally {
    client.release();
  }

  return getDbPopularSearchTerms(false);
}

export async function logDbSearchQuery(
  term: string,
  resultsCount: number,
  source: string
): Promise<void> {
  const ready = await initializeDatabase();
  if (!ready) return;
  const db = getDbPool();

  const termNorm = term.trim().toLowerCase().replace(/\s+/g, " ").substring(0, 60);
  if (termNorm.length < 2) return;

  const validSource = source === "panel" || source === "results_page" || source === "chip" ? source : "panel";

  try {
    await db.query(
      `INSERT INTO search_query_log (term_normalized, results_count, source)
       VALUES ($1, $2, $3);`,
      [termNorm, Math.max(0, resultsCount), validSource]
    );

    // Occasional cleanup of older than 90 days rows
    if (Math.random() < 0.1) {
      await db.query(`DELETE FROM search_query_log WHERE created_at < NOW() - INTERVAL '90 days';`);
    }
  } catch (logErr) {
    console.warn("[Search query logging warning]:", logErr);
  }
}

export async function getDbSearchInsights(days = 7): Promise<SearchInsightsData> {
  const ready = await initializeDatabase();
  if (!ready) {
    return {
      top_terms: [],
      zero_result_terms: [],
      total_searches: 0,
    };
  }
  const db = getDbPool();
  const safeDays = days === 30 ? 30 : 7;

  try {
    // 1. Total searches
    const totalRes = await db.query(
      `SELECT COUNT(*) AS total FROM search_query_log
       WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL;`,
      [safeDays]
    );
    const totalSearches = parseInt(totalRes.rows[0]?.total || "0", 10);

    // 2. Top searches
    const topRes = await db.query(
      `SELECT term_normalized AS term, COUNT(*) AS count
       FROM search_query_log
       WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
       GROUP BY term_normalized
       ORDER BY count DESC
       LIMIT 20;`,
      [safeDays]
    );
    const topTerms = topRes.rows.map((r: any) => ({
      term: r.term,
      count: Number(r.count),
    }));

    // 3. Zero result terms
    const zeroRes = await db.query(
      `SELECT term_normalized AS term, COUNT(*) AS count
       FROM search_query_log
       WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL AND results_count = 0
       GROUP BY term_normalized
       ORDER BY count DESC
       LIMIT 20;`,
      [safeDays]
    );
    const zeroTerms = zeroRes.rows.map((r: any) => ({
      term: r.term,
      count: Number(r.count),
    }));

    return {
      top_terms: topTerms,
      zero_result_terms: zeroTerms,
      total_searches: totalSearches,
    };
  } catch (err) {
    console.warn("[Search insights query warning]:", err);
    return {
      top_terms: [],
      zero_result_terms: [],
      total_searches: 0,
    };
  }
}

// =========================================================================
// 15. ABOUT LEADERSHIP
// =========================================================================
export async function getDbLeadership(): Promise<LeadershipDirector[]> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const res = await db.query(
    `SELECT id, category, name, role, bio, image_url, order_index, linkedin_url, is_active, badge, since, highlights, quote
     FROM about_leadership
     WHERE is_active = true
     ORDER BY order_index ASC, id ASC;`
  );
  return res.rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    badge: r.badge || r.role,
    since: r.since || "Since 2002",
    bio: r.bio || "",
    photoUrl: r.image_url || "",
    highlights: Array.isArray(r.highlights)
      ? r.highlights
      : typeof r.highlights === "string"
        ? JSON.parse(r.highlights)
        : [],
    quote: r.quote || "",
  }));
}

export async function saveDbLeadership(directors: LeadershipDirector[]): Promise<LeadershipDirector[]> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();
  const client = await db.connect();
  try {
    await client.query("BEGIN;");
    for (let idx = 0; idx < directors.length; idx++) {
      const d = directors[idx];
      await client.query(
        `INSERT INTO about_leadership (
          id, category, name, role, bio, image_url, order_index,
          badge, since, highlights, quote, is_active, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          bio = EXCLUDED.bio,
          image_url = EXCLUDED.image_url,
          order_index = EXCLUDED.order_index,
          badge = EXCLUDED.badge,
          since = EXCLUDED.since,
          highlights = EXCLUDED.highlights,
          quote = EXCLUDED.quote,
          updated_at = CURRENT_TIMESTAMP;`,
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
    await client.query("COMMIT;");
    return directors;
  } catch (err) {
    await client.query("ROLLBACK;");
    throw err;
  } finally {
    client.release();
  }
}

// ==========================================
// PAYMENT SETTINGS DATABASE ACCESSORS
// ==========================================

export interface PaymentSettingsRow {
  id: number;
  upiId: string | null;
  payeeName: string | null;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  branch: string | null;
  qrImageFileId: string | null;
  qrImageUrl: string | null;
  useDynamicQr: boolean;
  paymentNote: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface PublicPaymentSettings {
  isConfigured: boolean;
  upiId: string | null;
  payeeName: string | null;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  branch: string | null;
  qrImageUrl: string | null;
  useDynamicQr: boolean;
  paymentNote: string | null;
}

export async function getDbPaymentSettings(): Promise<PaymentSettingsRow | null> {
  const ready = await initializeDatabase();
  if (!ready) return null;
  try {
    const db = getDbPool();
    const res = await db.query(`
      SELECT 
        id,
        upi_id AS "upiId",
        payee_name AS "payeeName",
        bank_name AS "bankName",
        account_name AS "accountName",
        account_number AS "accountNumber",
        ifsc,
        branch,
        qr_image_file_id AS "qrImageFileId",
        qr_image_url AS "qrImageUrl",
        use_dynamic_qr AS "useDynamicQr",
        payment_note AS "paymentNote",
        updated_at AS "updatedAt",
        updated_by AS "updatedBy"
      FROM payment_settings
      WHERE id = 1
      LIMIT 1;
    `);
    if (res.rowCount === 0) return null;
    return res.rows[0];
  } catch (err) {
    console.error("[getDbPaymentSettings Error]:", err);
    return null;
  }
}

export async function getPublicPaymentSettings(): Promise<PublicPaymentSettings> {
  const settings = await getDbPaymentSettings();
  if (!settings) {
    return {
      isConfigured: false,
      upiId: null,
      payeeName: null,
      bankName: null,
      accountName: null,
      accountNumber: null,
      ifsc: null,
      branch: null,
      qrImageUrl: null,
      useDynamicQr: true,
      paymentNote: null,
    };
  }

  const hasUpi = Boolean(settings.upiId && settings.upiId.trim());
  const hasBank = Boolean(settings.accountNumber && settings.ifsc && settings.accountName);
  const isConfigured = hasUpi || hasBank;

  let resolvedQrUrl = settings.qrImageUrl || null;
  if (!resolvedQrUrl && settings.qrImageFileId) {
    resolvedQrUrl = `/api/uploads/${settings.qrImageFileId}`;
  }

  return {
    isConfigured,
    upiId: settings.upiId,
    payeeName: settings.payeeName,
    bankName: settings.bankName,
    accountName: settings.accountName,
    accountNumber: settings.accountNumber,
    ifsc: settings.ifsc,
    branch: settings.branch,
    qrImageUrl: resolvedQrUrl,
    useDynamicQr: settings.useDynamicQr,
    paymentNote: settings.paymentNote,
  };
}

export async function updateDbPaymentSettings(
  data: Partial<PaymentSettingsRow>,
  adminUserId?: string
): Promise<PaymentSettingsRow> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("Database not connected");
  const db = getDbPool();

  const res = await db.query(
    `INSERT INTO payment_settings (
      id, upi_id, payee_name, bank_name, account_name, account_number,
      ifsc, branch, qr_image_file_id, qr_image_url, use_dynamic_qr,
      payment_note, updated_at, updated_by
    ) VALUES (
      1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, $12
    )
    ON CONFLICT (id) DO UPDATE SET
      upi_id = EXCLUDED.upi_id,
      payee_name = EXCLUDED.payee_name,
      bank_name = EXCLUDED.bank_name,
      account_name = EXCLUDED.account_name,
      account_number = EXCLUDED.account_number,
      ifsc = EXCLUDED.ifsc,
      branch = EXCLUDED.branch,
      qr_image_file_id = EXCLUDED.qr_image_file_id,
      qr_image_url = EXCLUDED.qr_image_url,
      use_dynamic_qr = EXCLUDED.use_dynamic_qr,
      payment_note = EXCLUDED.payment_note,
      updated_at = CURRENT_TIMESTAMP,
      updated_by = EXCLUDED.updated_by
    RETURNING 
      id,
      upi_id AS "upiId",
      payee_name AS "payeeName",
      bank_name AS "bankName",
      account_name AS "accountName",
      account_number AS "accountNumber",
      ifsc,
      branch,
      qr_image_file_id AS "qrImageFileId",
      qr_image_url AS "qrImageUrl",
      use_dynamic_qr AS "useDynamicQr",
      payment_note AS "paymentNote",
      updated_at AS "updatedAt",
      updated_by AS "updatedBy";`,
    [
      data.upiId || null,
      data.payeeName || null,
      data.bankName || null,
      data.accountName || null,
      data.accountNumber || null,
      data.ifsc || null,
      data.branch || null,
      data.qrImageFileId || null,
      data.qrImageUrl || null,
      data.useDynamicQr !== undefined ? data.useDynamicQr : true,
      data.paymentNote || null,
      adminUserId || null,
    ]
  );

  return res.rows[0];
}

// =========================================================================
// 19. SOCIAL & PLATFORM LINKS
// =========================================================================

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "youtube"
  | "x"
  | "whatsapp"
  | "google_business"
  | "indiamart"
  | "justdial"
  | "pinterest"
  | "threads"
  | "telegram"
  | "other";

export interface SocialLinkRow {
  id: string;
  platform: SocialPlatform;
  label: string | null;
  url: string;
  isActive: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface PublicSocialLink {
  id: string;
  platform: SocialPlatform;
  label: string | null;
  url: string;
  position: number;
}

export function validatePlatformUrl(platform: string, url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== "string") {
    return { valid: false, error: "URL is required" };
  }
  const trimmed = url.trim();
  if (!trimmed.startsWith("https://")) {
    return { valid: false, error: "URL must start with https://" };
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: "Invalid URL syntax" };
  }
  if (parsed.protocol !== "https:") {
    return { valid: false, error: "Only HTTPS URLs are allowed" };
  }

  const hostname = parsed.hostname.toLowerCase();

  const domainRules: Record<string, string[]> = {
    facebook: ["facebook.com", "fb.com", "fb.me"],
    instagram: ["instagram.com"],
    linkedin: ["linkedin.com"],
    youtube: ["youtube.com", "youtu.be"],
    x: ["x.com", "twitter.com"],
    whatsapp: ["wa.me", "api.whatsapp.com", "web.whatsapp.com", "whatsapp.com"],
    google_business: ["google.com", "maps.google.com", "goo.gl", "maps.app.goo.gl", "g.page"],
    indiamart: ["indiamart.com"],
    justdial: ["justdial.com"],
    pinterest: ["pinterest.com", "pin.it"],
    threads: ["threads.net"],
    telegram: ["t.me", "telegram.me", "telegram.org"],
  };

  const allowedDomains = domainRules[platform];
  if (allowedDomains) {
    const matches = allowedDomains.some((d) => hostname === d || hostname.endsWith("." + d));
    if (!matches) {
      return {
        valid: false,
        error: `URL domain for platform '${platform}' must belong to: ${allowedDomains.join(", ")}`,
      };
    }
  }

  return { valid: true };
}

function rowToSocialLink(row: any): SocialLinkRow {
  return {
    id: row.id,
    platform: row.platform,
    label: row.label || null,
    url: row.url,
    isActive: Boolean(row.is_active),
    position: Number(row.position) || 0,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    updatedBy: row.updated_by || null,
  };
}

export async function getDbSocialLinks(onlyActive = false): Promise<SocialLinkRow[]> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("Database not connected");
  const db = getDbPool();

  const query = onlyActive
    ? `SELECT * FROM social_links WHERE is_active = true ORDER BY position ASC, created_at ASC;`
    : `SELECT * FROM social_links ORDER BY position ASC, created_at ASC;`;

  const res = await db.query(query);
  return res.rows.map(rowToSocialLink);
}

export async function getPublicSocialLinks(): Promise<PublicSocialLink[]> {
  try {
    const links = await getDbSocialLinks(true);
    return links.map((l) => ({
      id: l.id,
      platform: l.platform,
      label: l.label,
      url: l.url,
      position: l.position,
    }));
  } catch (err) {
    console.error("Failed to load social links from DB, using fallback defaults", err);
    return [
      { id: "soc-facebook", platform: "facebook", label: "Facebook", url: "https://facebook.com/unitechcctv", position: 1 },
      { id: "soc-instagram", platform: "instagram", label: "Instagram", url: "https://instagram.com/unitechcctv", position: 2 },
      { id: "soc-youtube", platform: "youtube", label: "YouTube", url: "https://youtube.com/@unitechcctv", position: 3 },
      { id: "soc-linkedin", platform: "linkedin", label: "LinkedIn", url: "https://linkedin.com/company/unitech-security-systems", position: 4 },
      { id: "soc-x", platform: "x", label: "X (Twitter)", url: "https://x.com/unitechcctv", position: 5 },
      { id: "soc-whatsapp", platform: "whatsapp", label: "WhatsApp Support", url: "https://wa.me/918700317239", position: 6 },
      { id: "soc-google-business", platform: "google_business", label: "Google Business Profile", url: "https://maps.google.com/maps?cid=3536483869333144352", position: 7 },
    ];
  }
}

export async function createDbSocialLink(
  data: {
    id?: string;
    platform: SocialPlatform;
    label?: string | null;
    url: string;
    isActive?: boolean;
    position?: number;
  },
  adminUserId?: string
): Promise<SocialLinkRow> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("Database not connected");
  const db = getDbPool();

  const val = validatePlatformUrl(data.platform, data.url);
  if (!val.valid) {
    throw new Error(val.error || "Invalid URL for platform");
  }

  const id = data.id || `soc-${data.platform}-${Date.now().toString(36)}`;
  let position = data.position;
  if (position === undefined) {
    const maxRes = await db.query(`SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM social_links;`);
    position = maxRes.rows[0]?.next_pos || 1;
  }

  const res = await db.query(
    `INSERT INTO social_links (id, platform, label, url, is_active, position, updated_by, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *;`,
    [
      id,
      data.platform,
      data.label || null,
      data.url.trim(),
      data.isActive !== false,
      position,
      adminUserId || null,
    ]
  );

  return rowToSocialLink(res.rows[0]);
}

export async function updateDbSocialLink(
  id: string,
  data: Partial<{
    platform: SocialPlatform;
    label: string | null;
    url: string;
    isActive: boolean;
    position: number;
  }>,
  adminUserId?: string
): Promise<SocialLinkRow | null> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("Database not connected");
  const db = getDbPool();

  // If URL or platform is changing, validate URL
  if (data.url || data.platform) {
    // Fetch current row if platform or url is not provided
    const curRes = await db.query(`SELECT platform, url FROM social_links WHERE id = $1;`, [id]);
    if (curRes.rowCount === 0) return null;
    const cur = curRes.rows[0];
    const platformToVal = data.platform || cur.platform;
    const urlToVal = data.url || cur.url;
    const val = validatePlatformUrl(platformToVal, urlToVal);
    if (!val.valid) {
      throw new Error(val.error || "Invalid URL for platform");
    }
  }

  const fields: string[] = ["updated_at = CURRENT_TIMESTAMP"];
  const values: any[] = [];
  let paramIdx = 1;

  if (data.platform !== undefined) {
    fields.push(`platform = $${paramIdx++}`);
    values.push(data.platform);
  }
  if (data.label !== undefined) {
    fields.push(`label = $${paramIdx++}`);
    values.push(data.label || null);
  }
  if (data.url !== undefined) {
    fields.push(`url = $${paramIdx++}`);
    values.push(data.url.trim());
  }
  if (data.isActive !== undefined) {
    fields.push(`is_active = $${paramIdx++}`);
    values.push(data.isActive);
  }
  if (data.position !== undefined) {
    fields.push(`position = $${paramIdx++}`);
    values.push(data.position);
  }
  if (adminUserId !== undefined) {
    fields.push(`updated_by = $${paramIdx++}`);
    values.push(adminUserId || null);
  }

  values.push(id);
  const query = `UPDATE social_links SET ${fields.join(", ")} WHERE id = $${paramIdx} RETURNING *;`;
  const res = await db.query(query, values);
  if (res.rowCount === 0) return null;
  return rowToSocialLink(res.rows[0]);
}

export async function deleteDbSocialLink(id: string): Promise<boolean> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("Database not connected");
  const db = getDbPool();
  const res = await db.query(`DELETE FROM social_links WHERE id = $1;`, [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function reorderDbSocialLinks(orderedIds: string[], adminUserId?: string): Promise<boolean> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("Database not connected");
  const db = getDbPool();
  const client = await db.connect();
  try {
    await client.query("BEGIN;");
    for (let i = 0; i < orderedIds.length; i++) {
      await client.query(
        `UPDATE social_links SET position = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = $3;`,
        [i + 1, adminUserId || null, orderedIds[i]]
      );
    }
    await client.query("COMMIT;");
    return true;
  } catch (err) {
    await client.query("ROLLBACK;");
    throw err;
  } finally {
    client.release();
  }
}

// =========================================================================
// 17. CATEGORIES & SERIES MANAGEMENT
// =========================================================================

let cachedCategories: { data: Category[]; timestamp: number } | null = null;
const CATEGORIES_CACHE_TTL_MS = 60 * 1000;

export function invalidateCategoriesCache() {
  cachedCategories = null;
}

export async function getDbCategories(options?: {
  activeOnly?: boolean;
  includeSeries?: boolean;
}): Promise<Category[]> {
  const activeOnly = options?.activeOnly ?? false;
  const includeSeries = options?.includeSeries ?? true;

  if (activeOnly && includeSeries && cachedCategories && Date.now() - cachedCategories.timestamp < CATEGORIES_CACHE_TTL_MS) {
    return cachedCategories.data;
  }

  const ready = await initializeDatabase();
  if (!ready) throw new Error("Database not connected");
  const db = getDbPool();

  const whereClause = activeOnly ? "WHERE c.is_active = true" : "";
  const query = `
    SELECT
      c.id,
      c.name,
      c.short_label,
      c.description,
      c.cover_image_url,
      c.position,
      c.is_active,
      c.show_in_menu,
      c.show_in_footer,
      c.created_at,
      c.updated_at,
      COUNT(p.id)::int AS product_count
    FROM categories c
    LEFT JOIN products p ON p.category = c.id
    ${whereClause}
    GROUP BY c.id
    ORDER BY c.position ASC, c.created_at ASC;
  `;

  const res = await db.query(query);

  const seriesByCat: Record<string, CategorySeries[]> = {};
  if (includeSeries) {
    const seriesWhere = activeOnly ? "WHERE is_active = true" : "";
    const seriesRes = await db.query(`
      SELECT id, category_id, label, slug, position, is_active, created_at, updated_at
      FROM category_series
      ${seriesWhere}
      ORDER BY position ASC, created_at ASC;
    `);

    for (const row of seriesRes.rows) {
      const catId = row.category_id;
      if (!seriesByCat[catId]) seriesByCat[catId] = [];
      seriesByCat[catId].push({
        id: row.id,
        categoryId: row.category_id,
        label: row.label,
        slug: row.slug,
        position: row.position,
        isActive: row.is_active,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
      });
    }
  }

  const categories: Category[] = res.rows.map((row) => ({
    id: row.id,
    name: row.name,
    shortLabel: row.short_label || undefined,
    description: row.description || undefined,
    coverImageUrl: row.cover_image_url || undefined,
    image: row.cover_image_url || undefined,
    position: row.position,
    isActive: row.is_active,
    showInMenu: row.show_in_menu,
    showInFooter: row.show_in_footer,
    productCount: row.product_count,
    count: row.product_count,
    series: seriesByCat[row.id] || [],
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  }));

  if (activeOnly && includeSeries) {
    cachedCategories = { data: categories, timestamp: Date.now() };
  }

  return categories;
}

export async function getDbCategoryById(id: string): Promise<Category | null> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("Database not connected");
  const db = getDbPool();

  const res = await db.query(`
    SELECT
      c.id, c.name, c.short_label, c.description, c.cover_image_url,
      c.position, c.is_active, c.show_in_menu, c.show_in_footer,
      c.created_at, c.updated_at,
      COUNT(p.id)::int AS product_count
    FROM categories c
    LEFT JOIN products p ON p.category = c.id
    WHERE c.id = $1
    GROUP BY c.id;
  `, [id]);

  if (res.rowCount === 0) return null;
  const row = res.rows[0];

  const seriesRes = await db.query(`
    SELECT id, category_id, label, slug, position, is_active, created_at, updated_at
    FROM category_series
    WHERE category_id = $1
    ORDER BY position ASC, created_at ASC;
  `, [id]);

  const series: CategorySeries[] = seriesRes.rows.map((s) => ({
    id: s.id,
    categoryId: s.category_id,
    label: s.label,
    slug: s.slug,
    position: s.position,
    isActive: s.is_active,
    createdAt: s.created_at ? new Date(s.created_at).toISOString() : undefined,
    updatedAt: s.updated_at ? new Date(s.updated_at).toISOString() : undefined,
  }));

  return {
    id: row.id,
    name: row.name,
    shortLabel: row.short_label || undefined,
    description: row.description || undefined,
    coverImageUrl: row.cover_image_url || undefined,
    image: row.cover_image_url || undefined,
    position: row.position,
    isActive: row.is_active,
    showInMenu: row.show_in_menu,
    showInFooter: row.show_in_footer,
    productCount: row.product_count,
    count: row.product_count,
    series,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

export async function createDbCategory(cat: Partial<Category>): Promise<Category> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("Database not connected");
  const db = getDbPool();

  const id = (cat.id || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""))!;
  if (!id) throw new Error("Category id or valid name is required");

  const posRes = await db.query(`SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM categories;`);
  const position = cat.position !== undefined ? cat.position : posRes.rows[0].next_pos;

  await db.query(`
    INSERT INTO categories (
      id, name, short_label, description, cover_image_url, position, is_active, show_in_menu, show_in_footer
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
  `, [
    id,
    cat.name || id,
    cat.shortLabel || null,
    cat.description || null,
    cat.coverImageUrl || cat.image || null,
    position,
    cat.isActive !== false,
    cat.showInMenu !== false,
    cat.showInFooter !== false,
  ]);

  invalidateCategoriesCache();
  return (await getDbCategoryById(id))!;
}

export async function updateDbCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("Database not connected");
  const db = getDbPool();

  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${index++}`);
    values.push(updates.name);
  }
  if (updates.shortLabel !== undefined) {
    fields.push(`short_label = $${index++}`);
    values.push(updates.shortLabel);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${index++}`);
    values.push(updates.description);
  }
  if (updates.coverImageUrl !== undefined || updates.image !== undefined) {
    fields.push(`cover_image_url = $${index++}`);
    values.push(updates.coverImageUrl || updates.image || null);
  }
  if (updates.position !== undefined) {
    fields.push(`position = $${index++}`);
    values.push(updates.position);
  }
  if (updates.isActive !== undefined) {
    fields.push(`is_active = $${index++}`);
    values.push(updates.isActive);
  }
  if (updates.showInMenu !== undefined) {
    fields.push(`show_in_menu = $${index++}`);
    values.push(updates.showInMenu);
  }
  if (updates.showInFooter !== undefined) {
    fields.push(`show_in_footer = $${index++}`);
    values.push(updates.showInFooter);
  }

  if (fields.length === 0) return getDbCategoryById(id);

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `UPDATE categories SET ${fields.join(", ")} WHERE id = $${index} RETURNING *;`;
  const res = await db.query(query, values);
  if (res.rowCount === 0) return null;

  invalidateCategoriesCache();
  return getDbCategoryById(id);
}

export async function deleteDbCategory(id: string): Promise<{ success: boolean; error?: string }> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("Database not connected");
  const db = getDbPool();

  const prodCheck = await db.query(`SELECT COUNT(*)::int AS count FROM products WHERE category = $1;`, [id]);
  const productCount = prodCheck.rows[0].count;
  if (productCount > 0) {
    return {
      success: false,
      error: `Cannot delete category: ${productCount} products are currently assigned to it. Deactivate the category instead.`,
    };
  }

  await db.query(`DELETE FROM categories WHERE id = $1;`, [id]);
  invalidateCategoriesCache();
  return { success: true };
}

export async function reorderDbCategories(orderedIds: string[]): Promise<boolean> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("Database not connected");
  const db = getDbPool();
  const client = await db.connect();
  try {
    await client.query("BEGIN;");
    for (let i = 0; i < orderedIds.length; i++) {
      await client.query(
        `UPDATE categories SET position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;`,
        [i, orderedIds[i]]
      );
    }
    await client.query("COMMIT;");
    invalidateCategoriesCache();
    return true;
  } catch (err) {
    await client.query("ROLLBACK;");
    throw err;
  } finally {
    client.release();
  }
}

export async function getDbCategorySeries(categoryId: string, activeOnly = false): Promise<CategorySeries[]> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("Database not connected");
  const db = getDbPool();

  const where = activeOnly
    ? `WHERE category_id = $1 AND is_active = true`
    : `WHERE category_id = $1`;

  const res = await db.query(`
    SELECT id, category_id, label, slug, position, is_active, created_at, updated_at
    FROM category_series
    ${where}
    ORDER BY position ASC, created_at ASC;
  `, [categoryId]);

  return res.rows.map((row) => ({
    id: row.id,
    categoryId: row.category_id,
    label: row.label,
    slug: row.slug,
    position: row.position,
    isActive: row.is_active,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  }));
}

export async function createDbCategorySeries(series: Partial<CategorySeries>): Promise<CategorySeries> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("Database not connected");
  const db = getDbPool();

  if (!series.categoryId) throw new Error("Category ID is required");
  if (!series.label) throw new Error("Series label is required");

  const id = series.id || `ser-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const slug = series.slug || series.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const posRes = await db.query(
    `SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM category_series WHERE category_id = $1;`,
    [series.categoryId]
  );
  const position = series.position !== undefined ? series.position : posRes.rows[0].next_pos;

  const res = await db.query(`
    INSERT INTO category_series (id, category_id, label, slug, position, is_active)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `, [
    id,
    series.categoryId,
    series.label,
    slug,
    position,
    series.isActive !== false,
  ]);

  invalidateCategoriesCache();
  const row = res.rows[0];
  return {
    id: row.id,
    categoryId: row.category_id,
    label: row.label,
    slug: row.slug,
    position: row.position,
    isActive: row.is_active,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

export async function updateDbCategorySeries(id: string, updates: Partial<CategorySeries>): Promise<CategorySeries | null> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("Database not connected");
  const db = getDbPool();

  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (updates.label !== undefined) {
    fields.push(`label = $${index++}`);
    values.push(updates.label);
  }
  if (updates.slug !== undefined) {
    fields.push(`slug = $${index++}`);
    values.push(updates.slug);
  }
  if (updates.position !== undefined) {
    fields.push(`position = $${index++}`);
    values.push(updates.position);
  }
  if (updates.isActive !== undefined) {
    fields.push(`is_active = $${index++}`);
    values.push(updates.isActive);
  }

  if (fields.length === 0) {
    const r = await db.query(`SELECT * FROM category_series WHERE id = $1;`, [id]);
    return r.rows[0] || null;
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `UPDATE category_series SET ${fields.join(", ")} WHERE id = $${index} RETURNING *;`;
  const res = await db.query(query, values);
  if (res.rowCount === 0) return null;

  invalidateCategoriesCache();
  const row = res.rows[0];
  return {
    id: row.id,
    categoryId: row.category_id,
    label: row.label,
    slug: row.slug,
    position: row.position,
    isActive: row.is_active,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

export async function deleteDbCategorySeries(id: string): Promise<boolean> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("Database not connected");
  const db = getDbPool();

  const res = await db.query(`DELETE FROM category_series WHERE id = $1;`, [id]);
  invalidateCategoriesCache();
  return (res.rowCount ?? 0) > 0;
}

export async function reorderDbCategorySeries(categoryId: string, orderedIds: string[]): Promise<boolean> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("Database not connected");
  const db = getDbPool();
  const client = await db.connect();
  try {
    await client.query("BEGIN;");
    for (let i = 0; i < orderedIds.length; i++) {
      await client.query(
        `UPDATE category_series SET position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND category_id = $3;`,
        [i, orderedIds[i], categoryId]
      );
    }
    await client.query("COMMIT;");
    invalidateCategoriesCache();
    return true;
  } catch (err) {
    await client.query("ROLLBACK;");
    throw err;
  } finally {
    client.release();
  }
}

// =========================================================================
// 17. OUTBOUND SMTP EMAIL NOTIFICATIONS & LOGS
// =========================================================================
function rowToEmailSettings(row: any): EmailSettings {
  return {
    id: 1,
    isEnabled: Boolean(row.is_enabled),
    smtpHost: row.smtp_host || "",
    smtpPort: Number(row.smtp_port ?? 587),
    smtpSecure: Boolean(row.smtp_secure),
    smtpUser: row.smtp_user || "",
    hasPassword: Boolean(row.smtp_password_encrypted && row.smtp_password_encrypted.trim().length > 0),
    senderEmail: row.sender_email || "sales@unitechcctv.com",
    senderName: row.sender_name || "Unitech CCTV Sales",
    adminNotificationEmails: Array.isArray(row.admin_notification_emails) ? row.admin_notification_emails : [],
    notifyOnOrderReceived: Boolean(row.notify_on_order_received),
    notifyOnPaymentConfirmed: Boolean(row.notify_on_payment_confirmed),
    notifyOnPaymentRejected: Boolean(row.notify_on_payment_rejected),
    notifyAdminOnOrder: Boolean(row.notify_admin_on_order),
    notifyAdminOnEnquiry: Boolean(row.notify_admin_on_enquiry),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    updatedBy: row.updated_by || "admin",
  };
}

export async function getDbEmailSettings(): Promise<EmailSettings> {
  const ready = await initializeDatabase();
  if (!ready) {
    return {
      id: 1,
      isEnabled: false,
      smtpHost: "",
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: "",
      hasPassword: false,
      senderEmail: "sales@unitechcctv.com",
      senderName: "Unitech CCTV Sales",
      adminNotificationEmails: [],
      notifyOnOrderReceived: true,
      notifyOnPaymentConfirmed: true,
      notifyOnPaymentRejected: true,
      notifyAdminOnOrder: true,
      notifyAdminOnEnquiry: true,
    };
  }
  const db = getDbPool();
  const res = await db.query(`SELECT * FROM email_settings WHERE id = 1 LIMIT 1;`);
  if (res.rowCount === 0) {
    const insertRes = await db.query(`
      INSERT INTO email_settings (id, is_enabled) VALUES (1, false) ON CONFLICT (id) DO NOTHING RETURNING *;
    `);
    if (insertRes.rowCount && insertRes.rowCount > 0) {
      return rowToEmailSettings(insertRes.rows[0]);
    }
  }
  return rowToEmailSettings(res.rows[0]);
}

export async function getDbEmailSettingsWithSecret(options?: { forceDecrypt?: boolean }): Promise<EmailSettings & { smtpPasswordDecrypted: string }> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("Database not connected");
  const db = getDbPool();
  const res = await db.query(`SELECT * FROM email_settings WHERE id = 1 LIMIT 1;`);
  if (res.rowCount === 0) {
    throw new Error("Email settings row not found");
  }
  const row = res.rows[0];
  const settings = rowToEmailSettings(row);
  let smtpPasswordDecrypted = "";
  if (row.smtp_password_encrypted && (row.is_enabled || options?.forceDecrypt)) {
    smtpPasswordDecrypted = decryptSecret(row.smtp_password_encrypted);
  }
  return {
    ...settings,
    smtpPasswordDecrypted,
  };
}

export async function saveDbEmailSettings(
  payload: Partial<EmailSettings> & { smtpPassword?: string }
): Promise<EmailSettings> {
  const ready = await initializeDatabase();
  if (!ready) throw new Error("Database not connected");
  const db = getDbPool();

  if (payload.isEnabled || (payload.smtpPassword && payload.smtpPassword.trim().length > 0)) {
    getEncryptionKey();
  }

  const currentRes = await db.query(`SELECT smtp_password_encrypted FROM email_settings WHERE id = 1 LIMIT 1;`);
  let passwordEncrypted = currentRes.rows[0]?.smtp_password_encrypted || "";

  if (payload.smtpPassword && payload.smtpPassword.trim().length > 0) {
    passwordEncrypted = encryptSecret(payload.smtpPassword.trim());
  }

  const adminEmails = Array.isArray(payload.adminNotificationEmails)
    ? payload.adminNotificationEmails.map((e) => String(e).trim()).filter(Boolean)
    : [];

  const res = await db.query(
    `INSERT INTO email_settings (
      id, is_enabled, smtp_host, smtp_port, smtp_secure,
      smtp_user, smtp_password_encrypted, sender_email, sender_name,
      admin_notification_emails, notify_on_order_received,
      notify_on_payment_confirmed, notify_on_payment_rejected,
      notify_admin_on_order, notify_admin_on_enquiry,
      updated_at, updated_by
    ) VALUES (
      1, $1, $2, $3, $4,
      $5, $6, $7, $8,
      $9, $10,
      $11, $12,
      $13, $14,
      CURRENT_TIMESTAMP, $15
    ) ON CONFLICT (id) DO UPDATE SET
      is_enabled = EXCLUDED.is_enabled,
      smtp_host = EXCLUDED.smtp_host,
      smtp_port = EXCLUDED.smtp_port,
      smtp_secure = EXCLUDED.smtp_secure,
      smtp_user = EXCLUDED.smtp_user,
      smtp_password_encrypted = EXCLUDED.smtp_password_encrypted,
      sender_email = EXCLUDED.sender_email,
      sender_name = EXCLUDED.sender_name,
      admin_notification_emails = EXCLUDED.admin_notification_emails,
      notify_on_order_received = EXCLUDED.notify_on_order_received,
      notify_on_payment_confirmed = EXCLUDED.notify_on_payment_confirmed,
      notify_on_payment_rejected = EXCLUDED.notify_on_payment_rejected,
      notify_admin_on_order = EXCLUDED.notify_admin_on_order,
      notify_admin_on_enquiry = EXCLUDED.notify_admin_on_enquiry,
      updated_at = CURRENT_TIMESTAMP,
      updated_by = EXCLUDED.updated_by
    RETURNING *;`,
    [
      Boolean(payload.isEnabled),
      (payload.smtpHost || "").trim().substring(0, 255),
      Number(payload.smtpPort ?? 587),
      Boolean(payload.smtpSecure),
      (payload.smtpUser || "").trim().substring(0, 255),
      passwordEncrypted,
      (payload.senderEmail || "sales@unitechcctv.com").trim().substring(0, 255),
      (payload.senderName || "Unitech CCTV Sales").trim().substring(0, 255),
      adminEmails,
      payload.notifyOnOrderReceived !== false,
      payload.notifyOnPaymentConfirmed !== false,
      payload.notifyOnPaymentRejected !== false,
      payload.notifyAdminOnOrder !== false,
      payload.notifyAdminOnEnquiry !== false,
      payload.updatedBy || "admin",
    ]
  );

  return rowToEmailSettings(res.rows[0]);
}

export async function logEmailEvent(entry: {
  toEmail: string;
  subject: string;
  templateType: string;
  status: "sent" | "failed" | "disabled";
  errorMessage?: string | null;
}): Promise<void> {
  const ready = await initializeDatabase();
  if (!ready) return;
  const db = getDbPool();
  const id = `email-log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  try {
    await db.query(
      `INSERT INTO email_logs (id, to_email, subject, template_type, status, error_message, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP);`,
      [
        id,
        entry.toEmail.substring(0, 255),
        entry.subject.substring(0, 255),
        entry.templateType.substring(0, 64),
        entry.status.substring(0, 32),
        entry.errorMessage || null,
      ]
    );
  } catch (err: any) {
    console.error("[logEmailEvent Error]: Failed to write email log:", err?.message || err);
  }
}

export async function getDbEmailLogs(limit: number = 20): Promise<EmailLogEntry[]> {
  const ready = await initializeDatabase();
  if (!ready) return [];
  const db = getDbPool();
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const res = await db.query(
    `SELECT * FROM email_logs ORDER BY created_at DESC LIMIT $1;`,
    [safeLimit]
  );
  return res.rows.map((row) => ({
    id: row.id,
    toEmail: row.to_email,
    subject: row.subject,
    templateType: row.template_type,
    status: row.status,
    errorMessage: row.error_message || null,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}



