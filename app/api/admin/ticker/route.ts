import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import {
  getDbTickerSettings,
  updateDbTickerSettings,
  getDbBanners,
  createDbBanner,
  updateDbBanner,
  deleteDbBanner,
  invalidateTickerCache,
} from "@/lib/server/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const TickerSettingsUpdateSchema = z.object({
  isEnabled: z.boolean().optional(),
  rotationSeconds: z.number().int().min(2).max(20).optional(),
  animation: z.enum(["fade", "slide-up", "marquee"]).optional(),
  pauseOnHover: z.boolean().optional(),
  showPlantDesk: z.boolean().optional(),
  plantDeskText: z.string().trim().max(255).optional(),
  showPhone: z.boolean().optional(),
  phoneDisplay: z.string().trim().max(64).optional(),
  phoneTel: z.string().trim().max(64).optional(),
  showWhatsapp: z.boolean().optional(),
  whatsappLabel: z.string().trim().max(64).optional(),
});

const TickerMessageSchema = z.object({
  id: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1, "Message title is required"),
  badgeText: z.string().trim().max(64).optional().nullable(),
  ctaLink: z.string().trim().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime({ offset: true }).optional().nullable().or(z.string().nullable().optional()),
  endsAt: z.string().datetime({ offset: true }).optional().nullable().or(z.string().nullable().optional()),
  sortOrder: z.number().int().min(0).default(0),
});

const PutTickerPayloadSchema = z.object({
  settings: TickerSettingsUpdateSchema.optional(),
  messages: z.array(TickerMessageSchema).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    const [settings, banners] = await Promise.all([
      getDbTickerSettings(),
      getDbBanners(),
    ]);

    return NextResponse.json({
      success: true,
      settings,
      messages: banners,
    });
  } catch (error: any) {
    console.error("[Admin GET /api/admin/ticker error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch ticker data" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = PutTickerPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const { settings: settingsUpdate, messages: messagesUpdate } = parsed.data;

    let updatedSettings = await getDbTickerSettings();
    if (settingsUpdate && Object.keys(settingsUpdate).length > 0) {
      updatedSettings = await updateDbTickerSettings(settingsUpdate, (auth as any).user?.username || "admin");
    }

    if (Array.isArray(messagesUpdate)) {
      const existingBanners = await getDbBanners();
      const existingMap = new Map(existingBanners.map((b) => [b.id, b]));
      const updatedIds = new Set(messagesUpdate.map((m) => m.id));

      // 1. Delete removed banners
      for (const existing of existingBanners) {
        if (!updatedIds.has(existing.id)) {
          await deleteDbBanner(existing.id);
        }
      }

      // 2. Insert or update existing
      for (let i = 0; i < messagesUpdate.length; i++) {
        const item = messagesUpdate[i];
        const existing = existingMap.get(item.id);

        if (existing) {
          await updateDbBanner(item.id, {
            title: item.title,
            badgeText: item.badgeText || undefined,
            ctaLink: item.ctaLink || undefined,
            isActive: item.isActive,
            startsAt: item.startsAt || null,
            endsAt: item.endsAt || null,
            sortOrder: i,
          });
        } else {
          await createDbBanner({
            id: item.id,
            title: item.title,
            badgeText: item.badgeText || undefined,
            ctaLink: item.ctaLink || undefined,
            type: "TOP_TICKER",
            isActive: item.isActive,
            startsAt: item.startsAt || null,
            endsAt: item.endsAt || null,
            sortOrder: i,
          });
        }
      }
    }

    invalidateTickerCache();
    const finalMessages = await getDbBanners();

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
      messages: finalMessages,
    });
  } catch (error: any) {
    console.error("[Admin PUT /api/admin/ticker error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save ticker settings" },
      { status: 500 }
    );
  }
}
