import { getDbPool, initializeDatabase } from "@/lib/server/db";

export interface CartInputItem {
  productId?: string;
  id?: string;
  quantity?: number | string;
}

export interface QuotedCartItem {
  id: string; // product primary id
  productId: string;
  slug: string;
  name: string;
  modelCode: string;
  imageUrl: string;
  price: number; // compatible unit price alias
  unitPrice: number; // compatible unit price alias
  currentUnitPrice: number; // standard catalog unit price
  applicablePrice: number; // effective unit price after flash sale or tier discount
  quantity: number;
  lineTotal: number;
  pricingType: "standard" | "flash_sale" | "dealer_tier" | "tier2";
  stockAvailable: number;
}

export interface UnavailableCartItem {
  productId: string;
  name?: string;
  reason: "not_found" | "out_of_stock";
  message: string;
}

export interface CartQuote {
  items: QuotedCartItem[];
  subtotal: number;
  gst: number;
  total: number;
  itemCount: number;
  unavailableItems: UnavailableCartItem[];
}

export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates a verified, canonical quote directly against PostgreSQL products and active promotions.
 * This is the SINGLE SOURCE OF TRUTH for Cart, Checkout Step 1, Draft Orders, and Dynamic QR amounts.
 */
export async function calculateCartQuote(rawItems: CartInputItem[]): Promise<CartQuote> {
  await initializeDatabase();
  const pool = getDbPool();

  // 1. Fetch full product catalog
  const productsRes = await pool.query(`
    SELECT id, slug, model_code, name, price, dealer_price, tier2_price, stock_quantity, image_url 
    FROM products;
  `);
  const catalog = productsRes.rows;

  // 2. Fetch active flash sales if any
  let activeFlashSales: any[] = [];
  try {
    const flashRes = await pool.query(`
      SELECT id, price, linked_product_id 
      FROM flash_sales 
      WHERE is_enabled = true 
        AND status = 'published' 
        AND (starts_at IS NULL OR starts_at <= NOW()) 
        AND (ends_at IS NULL OR ends_at >= NOW());
    `);
    activeFlashSales = flashRes.rows;
  } catch (fsErr) {
    // If flash_sales table query fails gracefully fallback to standard catalog
    console.warn("[Pricing Quote] Flash sales lookup error:", fsErr);
  }

  const quotedItems: QuotedCartItem[] = [];
  const unavailableItems: UnavailableCartItem[] = [];

  for (const item of rawItems) {
    const rawId = String(item.productId || item.id || "").trim();
    if (!rawId) continue;

    const qty = Math.max(1, Math.min(999, parseInt(String(item.quantity || 1), 10) || 1));

    // Match by exact ID, exact slug, or case-insensitive model_code
    const dbProduct = catalog.find(
      (p) =>
        p.id === rawId ||
        (p.slug && p.slug.toLowerCase() === rawId.toLowerCase()) ||
        (p.model_code && p.model_code.toLowerCase() === rawId.toLowerCase())
    );

    if (!dbProduct) {
      unavailableItems.push({
        productId: rawId,
        reason: "not_found",
        message: "This product is no longer available in the catalogue.",
      });
      continue;
    }

    const stock = Number(dbProduct.stock_quantity ?? 0);
    if (stock <= 0) {
      unavailableItems.push({
        productId: dbProduct.id,
        name: dbProduct.name,
        reason: "out_of_stock",
        message: `"${dbProduct.name}" is currently out of stock.`,
      });
      continue;
    }

    const standardPrice = roundToTwo(Number(dbProduct.price) || 0);
    let applicablePrice = standardPrice;
    let pricingType: "standard" | "flash_sale" | "dealer_tier" | "tier2" = "standard";

    // A. Check Active Flash Sale override
    const matchingFlashSale = activeFlashSales.find(
      (fs) => fs.linked_product_id === dbProduct.id && Number(fs.price) > 0
    );
    if (matchingFlashSale) {
      const fsPrice = roundToTwo(Number(matchingFlashSale.price));
      if (fsPrice < applicablePrice) {
        applicablePrice = fsPrice;
        pricingType = "flash_sale";
      }
    }

    // B. Check Volume / Dealer Tier Pricing if flash sale didn't already give a lower price
    if (pricingType === "standard") {
      const dealerPrice = Number(dbProduct.dealer_price);
      const tier2Price = Number(dbProduct.tier2_price);

      if (qty >= 10 && dealerPrice > 0) {
        applicablePrice = roundToTwo(dealerPrice);
        pricingType = "dealer_tier";
      } else if (qty >= 5 && tier2Price > 0) {
        applicablePrice = roundToTwo(tier2Price);
        pricingType = "tier2";
      }
    }

    const lineTotal = roundToTwo(applicablePrice * qty);

    quotedItems.push({
      id: dbProduct.id,
      productId: dbProduct.id,
      slug: dbProduct.slug,
      name: dbProduct.name,
      modelCode: dbProduct.model_code || "",
      imageUrl: dbProduct.image_url || "/images/products/placeholder.webp",
      price: applicablePrice,
      unitPrice: applicablePrice,
      currentUnitPrice: standardPrice,
      applicablePrice,
      quantity: qty,
      lineTotal,
      pricingType,
      stockAvailable: stock,
    });
  }

  const subtotal = roundToTwo(quotedItems.reduce((sum, it) => sum + it.lineTotal, 0));
  const gst = roundToTwo(subtotal * 0.18);
  const total = roundToTwo(subtotal + gst);
  const itemCount = quotedItems.reduce((sum, it) => sum + it.quantity, 0);

  return {
    items: quotedItems,
    subtotal,
    gst,
    total,
    itemCount,
    unavailableItems,
  };
}
