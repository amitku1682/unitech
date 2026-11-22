import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError, getAdminFromRequest } from "@/lib/server/auth";
import { ProductSaleSlideData } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { getDbPool, initializeDatabase } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminFromRequest(req);
    const ready = await initializeDatabase();
    if (!ready) throw new Error("Database is offline.");

    const db = getDbPool();
    const res = await db.query(
      `SELECT * FROM hero_slides WHERE id = 'slide-product-sale' OR type = 'product_sale' LIMIT 1;`
    );

    if (res.rowCount && res.rowCount > 0) {
      const row = res.rows[0];
      if (row.product_sale_data) {
        const data = typeof row.product_sale_data === "object" ? row.product_sale_data : JSON.parse(row.product_sale_data);
        if (!admin && (!data.enabled || data.status !== "published")) {
          return NextResponse.json({ success: true, source: "postgresql", data: null });
        }
        return NextResponse.json({ success: true, source: "postgresql", data });
      }
    }

    return NextResponse.json({ success: false, error: "Product sale slide not found in database." }, { status: 404 });
  } catch (error: any) {
    console.error("[API GET /api/hero-product-sale] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to load product sale slide." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const body: Partial<ProductSaleSlideData> = await req.json();

    const mrp = Number(body.mrp) || 0;
    const offerPrice = Number(body.offerPrice) || 0;

    if (!body.productName || body.productName.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Product name is required." },
        { status: 400 }
      );
    }

    if (mrp <= 0 || offerPrice <= 0) {
      return NextResponse.json(
        { success: false, error: "MRP and Offer Price must be greater than 0." },
        { status: 400 }
      );
    }

    if (offerPrice >= mrp) {
      return NextResponse.json(
        { success: false, error: "Offer price must be strictly less than MRP." },
        { status: 400 }
      );
    }

    if (!body.endsAt) {
      return NextResponse.json(
        { success: false, error: "End date/time is required." },
        { status: 400 }
      );
    }

    const calculatedDiscount = Math.round(((mrp - offerPrice) / mrp) * 100);
    const discountPercent =
      body.discountOverride && body.discountPercent
        ? Math.min(90, Math.max(1, Number(body.discountPercent)))
        : calculatedDiscount;

    const specs = Array.isArray(body.specs)
      ? body.specs.filter((s) => typeof s === "string" && s.trim().length > 0).slice(0, 4)
      : [
          "4MP Ultra HD",
          "F1.0 full-colour starlight",
          "30 m warm LED range",
          "IP67 weatherproof alloy",
        ];

    if (specs.length < 2) {
      return NextResponse.json(
        { success: false, error: "At least 2 specifications are required (up to 4)." },
        { status: 400 }
      );
    }

    const slideData: ProductSaleSlideData = {
      id: "slide-product-sale",
      type: "product_sale",
      enabled: body.enabled !== false,
      position: Number(body.position) || 4,
      badgeText: (body.badgeText || "Product of the week").slice(0, 30),
      category: (body.category || "CCTV CAMERAS").toUpperCase().slice(0, 24),
      productName: body.productName.trim().slice(0, 60),
      tagline: (body.tagline || "").slice(0, 100),
      headlineSuffix: (body.headlineSuffix || "this week.").slice(0, 30),
      mrp,
      offerPrice,
      discountPercent,
      discountOverride: !!body.discountOverride,
      gstNote: body.gstNote || "+ 18% GST · full ITC",
      showGstNote: body.showGstNote !== false,
      specs,
      stockLeft: Math.max(0, Number(body.stockLeft) || 0),
      productImage: body.productImage || "/images/products/utipbcp-4101.png",
      imageAlt: (body.imageAlt || body.productName).slice(0, 80),
      primaryCta: {
        label: body.primaryCta?.label?.slice(0, 24) || "Buy now",
        url: body.primaryCta?.url?.slice(0, 100) || "/catalogue?category=cctv-cameras",
      },
      secondaryCta: {
        label: body.secondaryCta?.label?.slice(0, 24) || "Get bulk price",
        url: body.secondaryCta?.url?.slice(0, 100) || "/inquiry?type=PRODUCT_QUOTE",
      },
      startsAt: body.startsAt || null,
      endsAt: body.endsAt,
      afterEnd: body.afterEnd || "hide_slide",
      status: body.status || "published",
      updatedAt: new Date().toISOString(),
      updatedBy: body.updatedBy || "Admin",
    };

    // Primary ACID store: PostgreSQL hero_slides table
    const ready = await initializeDatabase();
    if (!ready) throw new Error("Database offline.");
    const db = getDbPool();

    await db.query(
      `INSERT INTO hero_slides (
        id, tab_label, category, badge_tag, badge_detail, headline, highlight_text, description,
        primary_cta_text, primary_cta_link, secondary_cta_text, secondary_cta_link,
        product_name, sku, stock_status, warranty, specs, highlights, type, image_url,
        is_active, sort_order, is_offer, offer_price, mrp_price, savings_text, product_sale_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, 3, $22, $23, $24, $25, $26)
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
        type = EXCLUDED.type,
        image_url = EXCLUDED.image_url,
        is_active = EXCLUDED.is_active,
        is_offer = EXCLUDED.is_offer,
        offer_price = EXCLUDED.offer_price,
        mrp_price = EXCLUDED.mrp_price,
        savings_text = EXCLUDED.savings_text,
        product_sale_data = EXCLUDED.product_sale_data;`,
      [
        slideData.id,
        "Product of the Week",
        slideData.category,
        "SALE",
        slideData.badgeText,
        `Save ${slideData.discountPercent}%\n${slideData.headlineSuffix}`,
        slideData.tagline,
        `${slideData.productName} — ${slideData.tagline}`,
        slideData.primaryCta.label,
        slideData.primaryCta.url,
        slideData.secondaryCta.label,
        slideData.secondaryCta.url,
        slideData.productName,
        "UTIPBCP-4101",
        slideData.stockLeft ? `${slideData.stockLeft} Units Left` : "Limited Stock",
        "2-Year Warranty",
        JSON.stringify(slideData.specs.map((s, idx) => ({ label: `SPEC 0${idx + 1}`, value: s, detail: "" }))),
        JSON.stringify(slideData.specs),
        "product_sale",
        slideData.productImage,
        slideData.enabled && slideData.status === "published",
        true,
        slideData.offerPrice,
        slideData.mrp,
        `Save ₹${slideData.mrp - slideData.offerPrice} (${slideData.discountPercent}% OFF)`,
        JSON.stringify(slideData),
      ]
    );

    // Invalidate homepage cache immediately
    try {
      revalidatePath("/");
    } catch (e) {
      console.warn("[revalidatePath Error]:", e);
    }

    return NextResponse.json({ success: true, source: "postgresql", data: slideData });
  } catch (error: any) {
    console.error("[API POST /api/hero-product-sale] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update product sale slide." }, { status: 500 });
  }
}
