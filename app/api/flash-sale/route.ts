import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import { getCurrentFlashSale, saveFlashSale } from "@/lib/server/flashSaleStore";
import { z } from "zod";

export const dynamic = "force-dynamic";

const flashSaleItemSchema = z.object({
  id: z.string().optional(),
  position: z.number().int().min(0).default(0),
  imageUrl: z.string().min(1, "Item image is required"),
  qty: z.number().int().min(1).max(99),
  name: z.string().min(1, "Name is required").max(120, "Name max 120 chars"),
  shortName: z.string().max(80, "Short name max 80 chars").optional(),
  spec: z.string().max(255, "Spec max 255 chars").optional(),
});

const flashSaleSchema = z.object({
  id: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  isEnabled: z.boolean().default(false),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().min(1, "End date/time is required"),
  showTrigger: z.enum(["delay", "immediate", "exit_intent", "scroll_50"]).default("delay"),
  showDelaySeconds: z.number().int().min(0).max(60).default(4),
  frequency: z.enum(["once_per_session", "once_per_day", "every_visit"]).default("once_per_session"),
  showOn: z.enum(["home_and_products", "all_pages", "home_only"]).default("home_and_products"),
  badge: z.string().max(64).default("Flash sale"),
  badge2: z.string().max(64).default("Factory direct"),
  eyebrow: z.string().max(128).default("Limited factory scheme"),
  title: z.string().min(1, "Title is required").max(120, "Title max 120 chars"),
  subtitle: z.string().max(255, "Subtitle max 255 chars").default(""),
  heroImageUrl: z.string().min(1, "Hero image is required"),
  heroImageAlt: z.string().min(1, "Hero image alt is required").max(255),
  heroBadge: z.string().max(16).optional(),
  heroBadgeCaption: z.string().max(32).optional(),
  mrp: z.number().int().positive("MRP must be greater than 0"),
  price: z.number().int().positive("Price must be greater than 0"),
  discountOverride: z.number().int().min(1).max(90).nullable().optional(),
  unitsInKit: z.number().int().min(1).default(4),
  unitLabel: z.string().max(32).default("camera"),
  gstNote: z.string().max(128).default("+ 18% GST · GST invoice with full ITC"),
  perks: z.array(z.string().max(64)).max(6).default([]),
  stockTotal: z.number().int().min(0).default(50),
  stockLeft: z.number().int().min(0).default(16),
  ctaLabel: z.string().max(64).default("Claim offer · Add to cart"),
  ctaShortLabel: z.string().max(32).default("Claim offer"),
  whatsappNumber: z.string().default("+91 87003 17239"),
  bulkLabel: z.string().max(64).default("Need 10+ kits? Get a quote"),
  bulkUrl: z.string().default("/inquiry?type=PRODUCT_QUOTE"),
  dismissLabel: z.string().max(64).default("No thanks, browse products"),
  linkedProductId: z.string().nullable().optional(),
  linkedBundleSku: z.string().nullable().optional(),
  items: z.array(flashSaleItemSchema).min(1, "At least 1 item is required in the kit").max(8, "Maximum 8 items allowed"),
}).refine((data) => data.price < data.mrp, {
  message: "Flash sale price must be lower than the MRP.",
  path: ["price"],
}).refine((data) => data.stockLeft <= data.stockTotal, {
  message: "Kits left cannot exceed total kits.",
  path: ["stockLeft"],
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const sale = await getCurrentFlashSale();
    return NextResponse.json({ success: true, data: sale });
  } catch (error: any) {
    console.error("[GET /api/flash-sale Error]:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch flash sale." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const parsed = flashSaleSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: firstIssue?.message || "Invalid flash sale data",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const saved = await saveFlashSale(parsed.data as any);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    console.error("[POST /api/flash-sale Error]:", error);
    return NextResponse.json({ success: false, error: "Failed to save flash sale." }, { status: 500 });
  }
}
