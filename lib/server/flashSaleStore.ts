import {
  FlashSaleData,
  FlashSaleItem,
  FlashSalePublicPayload,
} from "@/lib/types";
import { getDbPool, initializeDatabase } from "@/lib/server/db";
import { revalidatePath, revalidateTag } from "next/cache";

export const DEFAULT_FLASH_SALE: FlashSaleData = {
  id: "fs-unitech-4cam-kit",
  status: "published",
  isEnabled: true,
  startsAt: null,
  endsAt: "2026-11-29T23:59:59.000Z",
  showTrigger: "delay",
  showDelaySeconds: 2,
  frequency: "once_per_session",
  showOn: "home_and_products",
  badge: "Flash sale",
  badge2: "Factory direct",
  eyebrow: "Limited factory scheme",
  title: "4-Camera Full-Colour CCTV Kit",
  subtitle: "8-channel DVR included — add up to 4 more cameras later.",
  heroImageUrl: "/images/products/utipbcp-4101.png",
  heroImageAlt: "Unitech 4-Camera Full-Colour CCTV Kit",
  heroBadge: "×4",
  heroBadgeCaption: "CAMERAS",
  mrp: 28000,
  price: 18499,
  discountOverride: null,
  unitsInKit: 4,
  unitLabel: "camera",
  gstNote: "+ 18% GST · GST invoice with full ITC",
  perks: [
    "Same-day dispatch",
    "Factory direct · Sahibabad",
    "2-year warranty",
  ],
  stockTotal: 50,
  stockLeft: 16,
  ctaLabel: "Claim offer · Add to cart",
  ctaShortLabel: "Claim offer",
  whatsappNumber: "+91 87003 17239",
  bulkLabel: "Need 10+ kits? Get a quote",
  bulkUrl: "/inquiry?type=PRODUCT_QUOTE",
  dismissLabel: "No thanks, browse products",
  linkedProductId: "utipbcp-4101",
  linkedBundleSku: "UT-BND-4CAM-8DVR",
  viewsCount: 142,
  claimsCount: 28,
  createdAt: "2026-11-15T12:00:00.000Z",
  updatedAt: "2026-11-15T12:00:00.000Z",
  updatedBy: "System Seed",
  items: [
    {
      id: "fsi-1",
      flashSaleId: "fs-unitech-4cam-kit",
      position: 0,
      qty: 4,
      name: "4MP Warm Light Bullet Cameras",
      shortName: "4MP Bullet ×4",
      spec: "30 m colour night vision · IP67 metal body",
      imageUrl: "/images/products/utipbcp-4101.png",
    },
    {
      id: "fsi-2",
      flashSaleId: "fs-unitech-4cam-kit",
      position: 1,
      qty: 1,
      name: "8-Channel H.265+ Hybrid DVR",
      shortName: "8-CH Hybrid DVR",
      spec: "Dual SATA · 4 channels free to expand",
      imageUrl: "/images/products/uthd-508.png",
    },
    {
      id: "fsi-3",
      flashSaleId: "fs-unitech-4cam-kit",
      position: 2,
      qty: 1,
      name: "90 m 3+1 Copper CCTV Cable",
      shortName: "3+1 Copper Cable 90 m",
      spec: "100% solid annealed copper",
      imageUrl: "/images/products/90y-tight.png",
    },
    {
      id: "fsi-4",
      flashSaleId: "fs-unitech-4cam-kit",
      position: 3,
      qty: 1,
      name: "12V 10A SMPS + Connectors",
      shortName: "12V 10A SMPS",
      spec: "Powers all cameras · BNC & DC included",
      imageUrl: "/images/products/utpsa-105.png",
    },
  ],
};

function computeDerived(sale: FlashSaleData): FlashSalePublicPayload {
  const discount =
    sale.discountOverride !== null && sale.discountOverride !== undefined
      ? sale.discountOverride
      : Math.round(((sale.mrp - sale.price) / sale.mrp) * 100);

  const save = sale.mrp - sale.price;
  const perUnit = Math.round(sale.price / Math.max(1, sale.unitsInKit));
  const barPct = Math.min(100, Math.round((sale.price / sale.mrp) * 100));
  const stockPct = Math.min(
    100,
    Math.round((sale.stockLeft / Math.max(1, sale.stockTotal)) * 100)
  );

  return {
    ...sale,
    serverNow: new Date().toISOString(),
    discount,
    save,
    perUnit,
    barPct,
    stockPct,
  };
}

function invalidateCache(): void {
  try {
    revalidatePath("/");
    revalidatePath("/catalogue");
    revalidateTag("flash-sale");
  } catch (err) {
    console.warn("[flashSaleStore] Invalidation warning:", err);
  }
}

function rowToFlashSale(row: any, items: any[]): FlashSaleData {
  return {
    id: row.id,
    status: row.status,
    isEnabled: Boolean(row.is_enabled),
    startsAt: row.starts_at ? new Date(row.starts_at).toISOString() : null,
    endsAt: new Date(row.ends_at).toISOString(),
    showTrigger: row.show_trigger,
    showDelaySeconds: Number(row.show_delay_seconds) || 2,
    frequency: row.frequency,
    showOn: row.show_on,
    badge: row.badge,
    badge2: row.badge2,
    eyebrow: row.eyebrow,
    title: row.title,
    subtitle: row.subtitle || "",
    heroImageUrl: row.hero_image_url,
    heroImageAlt: row.hero_image_alt,
    heroBadge: row.hero_badge || undefined,
    heroBadgeCaption: row.hero_badge_caption || undefined,
    mrp: Number(row.mrp),
    price: Number(row.price),
    discountOverride: row.discount_override !== null && row.discount_override !== undefined ? Number(row.discount_override) : null,
    unitsInKit: Number(row.units_in_kit) || 4,
    unitLabel: row.unit_label || "camera",
    gstNote: row.gst_note || "+ 18% GST · GST invoice with full ITC",
    perks: Array.isArray(row.perks)
      ? row.perks
      : typeof row.perks === "string"
      ? JSON.parse(row.perks || "[]")
      : [],
    stockTotal: Number(row.stock_total),
    stockLeft: Number(row.stock_left),
    ctaLabel: row.cta_label,
    ctaShortLabel: row.cta_short_label,
    whatsappNumber: row.whatsapp_number || "+91 87003 17239",
    bulkLabel: row.bulk_label,
    bulkUrl: row.bulk_url,
    dismissLabel: row.dismiss_label,
    linkedProductId: row.linked_product_id || undefined,
    linkedBundleSku: row.linked_bundle_sku || undefined,
    viewsCount: Number(row.views_count) || 0,
    claimsCount: Number(row.claims_count) || 0,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    updatedBy: row.updated_by || "Admin",
    items: items.map((i: any) => ({
      id: i.id,
      flashSaleId: i.flash_sale_id || row.id,
      position: Number(i.position) || 0,
      imageUrl: i.image_url,
      qty: Number(i.qty) || 1,
      name: i.name,
      shortName: i.short_name || undefined,
      spec: i.spec || undefined,
    })),
  };
}

// -------------------------------------------------------------------------
// Main API Methods (100% Pure PostgreSQL - Zero JSON File Writes)
// -------------------------------------------------------------------------

export async function getActiveFlashSale(): Promise<FlashSalePublicPayload | null> {
  const now = new Date();

  try {
    const dbReady = await initializeDatabase();
    if (dbReady) {
      const db = getDbPool();
      const res = await db.query(
        `SELECT * FROM flash_sales 
         WHERE status = 'published' 
           AND is_enabled = true 
           AND (starts_at IS NULL OR starts_at <= $1) 
           AND ends_at > $1 
           AND stock_left > 0
         ORDER BY updated_at DESC
         LIMIT 1;`,
        [now]
      );

      if (res.rows.length > 0) {
        const row = res.rows[0];
        const itemsRes = await db.query(
          `SELECT * FROM flash_sale_items 
           WHERE flash_sale_id = $1 
           ORDER BY position ASC;`,
          [row.id]
        );

        const sale = rowToFlashSale(row, itemsRes.rows);
        sale.items.sort((a, b) => a.position - b.position);
        return computeDerived(sale);
      }
    }
  } catch (err) {
    console.warn("[flashSaleStore] getActiveFlashSale PostgreSQL warning:", err);
  }

  return null;
}

export async function getCurrentFlashSale(): Promise<FlashSaleData> {
  try {
    const dbReady = await initializeDatabase();
    if (dbReady) {
      const db = getDbPool();
      const res = await db.query(
        `SELECT * FROM flash_sales ORDER BY updated_at DESC LIMIT 1;`
      );

      if (res.rows.length > 0) {
        const row = res.rows[0];
        const itemsRes = await db.query(
          `SELECT * FROM flash_sale_items 
           WHERE flash_sale_id = $1 
           ORDER BY position ASC;`,
          [row.id]
        );

        return rowToFlashSale(row, itemsRes.rows);
      }
    }
  } catch (err) {
    console.warn("[flashSaleStore] getCurrentFlashSale PostgreSQL warning:", err);
  }

  // Pure in-memory fallback (No file write)
  return DEFAULT_FLASH_SALE;
}

export async function saveFlashSale(
  payload: Partial<FlashSaleData> & { id?: string }
): Promise<FlashSaleData> {
  const dbReady = await initializeDatabase();
  if (!dbReady) {
    throw new Error("PostgreSQL database is not reachable. Cannot save flash sale.");
  }
  const db = getDbPool();

  const current = await getCurrentFlashSale();
  const id = payload.id || current.id || "fs-unitech-4cam-kit";
  const now = new Date();

  const merged: FlashSaleData = {
    ...current,
    ...payload,
    id,
    updatedAt: now.toISOString(),
    items: payload.items && payload.items.length > 0 ? payload.items : current.items,
  };

  // Re-number item positions
  merged.items = merged.items.map((item, idx) => ({
    ...item,
    id: item.id || `fsi-${idx + 1}`,
    flashSaleId: id,
    position: idx,
  }));

  // Save directly to PostgreSQL inside an atomic SQL transaction (SEC-MED-03)
  const client = await db.connect();
  try {
    await client.query("BEGIN;");

    await client.query(
      `INSERT INTO flash_sales (
        id, status, is_enabled, starts_at, ends_at, show_trigger, show_delay_seconds,
        frequency, show_on, badge, badge2, eyebrow, title, subtitle, hero_image_url,
        hero_image_alt, hero_badge, hero_badge_caption, mrp, price, discount_override,
        units_in_kit, unit_label, gst_note, perks, stock_total, stock_left, cta_label,
        cta_short_label, whatsapp_number, bulk_label, bulk_url, dismiss_label,
        linked_product_id, linked_bundle_sku, views_count, claims_count, updated_at, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
        $29, $30, $31, $32, $33, $34, $35, $36, $37, CURRENT_TIMESTAMP, $38
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        is_enabled = EXCLUDED.is_enabled,
        starts_at = EXCLUDED.starts_at,
        ends_at = EXCLUDED.ends_at,
        show_trigger = EXCLUDED.show_trigger,
        show_delay_seconds = EXCLUDED.show_delay_seconds,
        frequency = EXCLUDED.frequency,
        show_on = EXCLUDED.show_on,
        badge = EXCLUDED.badge,
        badge2 = EXCLUDED.badge2,
        eyebrow = EXCLUDED.eyebrow,
        title = EXCLUDED.title,
        subtitle = EXCLUDED.subtitle,
        hero_image_url = EXCLUDED.hero_image_url,
        hero_image_alt = EXCLUDED.hero_image_alt,
        hero_badge = EXCLUDED.hero_badge,
        hero_badge_caption = EXCLUDED.hero_badge_caption,
        mrp = EXCLUDED.mrp,
        price = EXCLUDED.price,
        discount_override = EXCLUDED.discount_override,
        units_in_kit = EXCLUDED.units_in_kit,
        unit_label = EXCLUDED.unit_label,
        gst_note = EXCLUDED.gst_note,
        perks = EXCLUDED.perks,
        stock_total = EXCLUDED.stock_total,
        stock_left = EXCLUDED.stock_left,
        cta_label = EXCLUDED.cta_label,
        cta_short_label = EXCLUDED.cta_short_label,
        whatsapp_number = EXCLUDED.whatsapp_number,
        bulk_label = EXCLUDED.bulk_label,
        bulk_url = EXCLUDED.bulk_url,
        dismiss_label = EXCLUDED.dismiss_label,
        linked_product_id = EXCLUDED.linked_product_id,
        linked_bundle_sku = EXCLUDED.linked_bundle_sku,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = EXCLUDED.updated_by;`,
      [
        merged.id,
        merged.status,
        merged.isEnabled,
        merged.startsAt ? new Date(merged.startsAt) : null,
        new Date(merged.endsAt),
        merged.showTrigger,
        merged.showDelaySeconds,
        merged.frequency,
        merged.showOn,
        merged.badge,
        merged.badge2,
        merged.eyebrow,
        merged.title,
        merged.subtitle,
        merged.heroImageUrl,
        merged.heroImageAlt,
        merged.heroBadge || null,
        merged.heroBadgeCaption || null,
        merged.mrp,
        merged.price,
        merged.discountOverride,
        merged.unitsInKit,
        merged.unitLabel,
        merged.gstNote,
        JSON.stringify(merged.perks),
        merged.stockTotal,
        merged.stockLeft,
        merged.ctaLabel,
        merged.ctaShortLabel,
        merged.whatsappNumber || "+91 87003 17239",
        merged.bulkLabel,
        merged.bulkUrl,
        merged.dismissLabel,
        merged.linkedProductId || null,
        merged.linkedBundleSku || null,
        merged.viewsCount || 0,
        merged.claimsCount || 0,
        merged.updatedBy || "Admin",
      ]
    );

    // Atomically re-insert items in PostgreSQL within same transaction
    await client.query(`DELETE FROM flash_sale_items WHERE flash_sale_id = $1;`, [merged.id]);
    for (const item of merged.items) {
      await client.query(
        `INSERT INTO flash_sale_items (id, flash_sale_id, position, image_url, qty, name, short_name, spec)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
        [
          item.id,
          merged.id,
          item.position,
          item.imageUrl,
          item.qty,
          item.name,
          item.shortName || null,
          item.spec || null,
        ]
      );
    }

    await client.query("COMMIT;");
  } catch (txErr) {
    await client.query("ROLLBACK;");
    throw txErr;
  } finally {
    client.release();
  }

  invalidateCache();
  return merged;
}

export async function publishFlashSale(id: string, fullData?: FlashSaleData): Promise<FlashSaleData> {
  const dbReady = await initializeDatabase();
  if (!dbReady) throw new Error("PostgreSQL database is not reachable.");
  const db = getDbPool();

  const targetSale: FlashSaleData = fullData || (await getCurrentFlashSale());
  if (id) {
    targetSale.id = id;
  }

  const now = new Date();
  if (new Date(targetSale.endsAt) <= now) {
    throw new Error("End date must be in the future to publish.");
  }
  if (targetSale.price >= targetSale.mrp) {
    throw new Error("Flash sale price must be lower than the MRP.");
  }

  // Disable any other flash sales in PostgreSQL
  await db.query(`UPDATE flash_sales SET is_enabled = false WHERE id != $1;`, [targetSale.id]);

  targetSale.status = "published";
  targetSale.isEnabled = true;
  targetSale.updatedAt = new Date().toISOString();

  return saveFlashSale(targetSale);
}

export async function unpublishFlashSale(id: string): Promise<FlashSaleData> {
  const current = await getCurrentFlashSale();
  current.status = "draft";
  current.isEnabled = false;
  current.updatedAt = new Date().toISOString();
  return saveFlashSale(current);
}

export async function toggleFlashSaleEnabled(
  id: string,
  isEnabled: boolean
): Promise<FlashSaleData> {
  const current = await getCurrentFlashSale();
  current.isEnabled = isEnabled;
  current.updatedAt = new Date().toISOString();
  return saveFlashSale(current);
}

export async function incrementFlashSaleViews(id: string): Promise<number> {
  try {
    const dbReady = await initializeDatabase();
    if (dbReady) {
      const db = getDbPool();
      const res = await db.query(
        `UPDATE flash_sales SET views_count = views_count + 1 WHERE id = $1 RETURNING views_count;`,
        [id]
      );
      if (res.rows.length > 0) {
        return res.rows[0].views_count;
      }
    }
  } catch (err) {
    console.warn("[flashSaleStore] incrementFlashSaleViews PostgreSQL warning:", err);
  }
  return 0;
}

export async function processFlashSaleClaim(
  id: string,
  qty: number
): Promise<{ success: boolean; cartItem: any; claimsCount: number; error?: string }> {
  const activeSale = await getActiveFlashSale();

  if (!activeSale || activeSale.id !== id) {
    return {
      success: false,
      cartItem: null,
      claimsCount: 0,
      error: "Flash sale is no longer active.",
    };
  }

  if (qty <= 0) {
    return {
      success: false,
      cartItem: null,
      claimsCount: activeSale.claimsCount,
      error: "Invalid quantity requested.",
    };
  }

  if (qty > activeSale.stockLeft) {
    return {
      success: false,
      cartItem: null,
      claimsCount: activeSale.claimsCount,
      error: `Only ${activeSale.stockLeft} kits left in stock.`,
    };
  }

  if (qty > 10) {
    return {
      success: false,
      cartItem: null,
      claimsCount: activeSale.claimsCount,
      error: "Maximum 10 kits allowed per customer.",
    };
  }

  let newClaimsCount = (activeSale.claimsCount || 0) + 1;
  try {
    const dbReady = await initializeDatabase();
    if (dbReady) {
      const db = getDbPool();
      const res = await db.query(
        `UPDATE flash_sales SET claims_count = claims_count + 1 WHERE id = $1 RETURNING claims_count;`,
        [id]
      );
      if (res.rows.length > 0) {
        newClaimsCount = res.rows[0].claims_count;
      }
    }
  } catch (err) {
    console.warn("[flashSaleStore] processFlashSaleClaim PostgreSQL warning:", err);
  }

  const cartItem = {
    id: `flash-sale-${activeSale.id}`,
    name: activeSale.title,
    modelCode: activeSale.linkedBundleSku || "FLASH-SALE-BUNDLE",
    price: activeSale.price,
    quantity: qty,
    imageUrl: activeSale.heroImageUrl,
    isFlashSale: true,
    flashSaleId: activeSale.id,
    badge: activeSale.badge,
    kitContents: activeSale.items.map((i) => `${i.qty}× ${i.name}`).join(", "),
  };

  return {
    success: true,
    cartItem,
    claimsCount: newClaimsCount,
  };
}
