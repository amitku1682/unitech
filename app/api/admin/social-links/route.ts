import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import {
  getDbSocialLinks,
  createDbSocialLink,
  updateDbSocialLink,
  deleteDbSocialLink,
  reorderDbSocialLinks,
  validatePlatformUrl,
  SocialPlatform,
} from "@/lib/server/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const VALID_PLATFORMS = [
  "facebook",
  "instagram",
  "linkedin",
  "youtube",
  "x",
  "whatsapp",
  "google_business",
  "indiamart",
  "justdial",
  "pinterest",
  "threads",
  "telegram",
  "other",
] as const;

const CreateLinkSchema = z.object({
  id: z.string().trim().max(64).optional(),
  platform: z.enum(VALID_PLATFORMS),
  label: z.string().trim().max(100).optional().nullable(),
  url: z.string().trim().max(500),
  isActive: z.boolean().default(true),
  position: z.number().int().min(0).optional(),
});

const UpdateLinkSchema = z.object({
  id: z.string().trim().min(1).max(64),
  platform: z.enum(VALID_PLATFORMS).optional(),
  label: z.string().trim().max(100).optional().nullable(),
  url: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

const ReorderSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1),
});

// GET /api/admin/social-links - Fetch all social links
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;
    const adminUser = auth.user;

    const links = await getDbSocialLinks(false);
    return NextResponse.json({
      success: true,
      links,
      user: { id: adminUser.id, email: adminUser.email },
    });
  } catch (error: any) {
    if (isAuthError(error)) return error;
    console.error("[GET /api/admin/social-links Error]:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch social links." }, { status: 500 });
  }
}

// POST /api/admin/social-links - Create a new social link
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;
    const adminUser = auth.user;

    const body = await req.json();
    const parsed = CreateLinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    const val = validatePlatformUrl(parsed.data.platform, parsed.data.url);
    if (!val.valid) {
      return NextResponse.json({ success: false, error: val.error }, { status: 400 });
    }

    const created = await createDbSocialLink(
      {
        id: parsed.data.id,
        platform: parsed.data.platform as SocialPlatform,
        label: parsed.data.label,
        url: parsed.data.url,
        isActive: parsed.data.isActive,
        position: parsed.data.position,
      },
      adminUser.id
    );

    return NextResponse.json({ success: true, link: created });
  } catch (error: any) {
    if (isAuthError(error)) return error;
    if (error.code === "23505") {
      return NextResponse.json(
        { success: false, error: "A link for this platform already exists. Edit the existing one or use 'other'." },
        { status: 409 }
      );
    }
    console.error("[POST /api/admin/social-links Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create social link." }, { status: 500 });
  }
}

// PUT /api/admin/social-links - Update an existing social link
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;
    const adminUser = auth.user;

    const body = await req.json();
    const parsed = UpdateLinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    if (parsed.data.url) {
      const val = validatePlatformUrl(parsed.data.platform || "other", parsed.data.url);
      if (!val.valid) {
        return NextResponse.json({ success: false, error: val.error }, { status: 400 });
      }
    }

    const updated = await updateDbSocialLink(
      parsed.data.id,
      {
        platform: parsed.data.platform as SocialPlatform | undefined,
        label: parsed.data.label,
        url: parsed.data.url,
        isActive: parsed.data.isActive,
        position: parsed.data.position,
      },
      adminUser.id
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Social link not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, link: updated });
  } catch (error: any) {
    if (isAuthError(error)) return error;
    if (error.code === "23505") {
      return NextResponse.json(
        { success: false, error: "A link for this platform already exists." },
        { status: 409 }
      );
    }
    console.error("[PUT /api/admin/social-links Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update social link." }, { status: 500 });
  }
}

// DELETE /api/admin/social-links - Delete a social link
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const url = new URL(req.url);
    let id = url.searchParams.get("id");
    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "Link ID is required." }, { status: 400 });
    }

    const deleted = await deleteDbSocialLink(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Link not found or already deleted." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Social link deleted successfully." });
  } catch (error: any) {
    if (isAuthError(error)) return error;
    console.error("[DELETE /api/admin/social-links Error]:", error);
    return NextResponse.json({ success: false, error: "Failed to delete social link." }, { status: 500 });
  }
}

// PATCH /api/admin/social-links - Reorder social links
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;
    const adminUser = auth.user;

    const body = await req.json();
    const parsed = ReorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    await reorderDbSocialLinks(parsed.data.ids, adminUser.id);
    return NextResponse.json({ success: true, message: "Links reordered successfully." });
  } catch (error: any) {
    if (isAuthError(error)) return error;
    console.error("[PATCH /api/admin/social-links Error]:", error);
    return NextResponse.json({ success: false, error: "Failed to reorder social links." }, { status: 500 });
  }
}
