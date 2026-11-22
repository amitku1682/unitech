import { NextRequest, NextResponse } from "next/server";
import {
  getDbEnquiries,
  createDbEnquiry,
  updateDbEnquiry,
  deleteDbEnquiry,
} from "@/lib/server/db";
import { EnquiryStatus, EnquiryType } from "@/lib/types";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import { sendEnquiryNotification } from "@/lib/server/email";

export const dynamic = "force-dynamic";

// GET /api/enquiries - Retrieve all ingested leads from PostgreSQL (ADMIN ONLY)
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    const list = await getDbEnquiries();
    return NextResponse.json({
      success: true,
      source: "postgresql",
      count: list.length,
      data: list,
    });
  } catch (error: any) {
    console.error("[API GET /api/enquiries] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch enquiries." },
      { status: 500 }
    );
  }
}

// POST /api/enquiries - Ingest a new lead directly into PostgreSQL (PUBLIC)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const {
      fullName,
      phone,
      email,
      companyName,
      gstin,
      city,
      state,
      type,
      details,
      productModel,
      budget,
    } = body;

    // Validate required fields
    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json(
        { success: false, error: "Full Name is required." },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== "string" || !phone.trim()) {
      return NextResponse.json(
        { success: false, error: "Phone number is required." },
        { status: 400 }
      );
    }

    const created = await createDbEnquiry({
      fullName: fullName.trim().substring(0, 255),
      phone: phone.trim().substring(0, 64),
      email: email ? String(email).trim().substring(0, 255) : "",
      companyName: companyName ? String(companyName).trim().substring(0, 255) : undefined,
      gstin: gstin ? String(gstin).trim().substring(0, 64) : undefined,
      city: city ? String(city).trim().substring(0, 128) : "Unspecified",
      state: state ? String(state).trim().substring(0, 128) : "Uttar Pradesh",
      type: (type as EnquiryType) || "DISTRIBUTOR",
      details: details ? String(details).trim().substring(0, 5000) : "Inquiry submitted via website form.",
      productModel: productModel ? String(productModel).trim().substring(0, 255) : undefined,
      budget: budget ? String(budget).trim().substring(0, 128) : undefined,
      status: "NEW",
    });

    sendEnquiryNotification(created).catch((emailErr) => {
      console.warn("[Email Notification Error - Enquiry Alert]:", emailErr?.message || emailErr);
    });

    return NextResponse.json(
      {
        success: true,
        message: "Enquiry submitted successfully.",
        data: {
          id: created.id,
          fullName: created.fullName,
          status: created.status,
          createdAt: created.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API POST /api/enquiries] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit enquiry. Please try again." },
      { status: 500 }
    );
  }
}

// PATCH /api/enquiries - Update lead status or admin notes in PostgreSQL (ADMIN ONLY)
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json().catch(() => ({}));
    const { id, status, adminNotes } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "Enquiry ID is required." },
        { status: 400 }
      );
    }

    const updates: { status?: EnquiryStatus; adminNotes?: string } = {};
    if (status) updates.status = status as EnquiryStatus;
    if (typeof adminNotes === "string") updates.adminNotes = adminNotes;

    const updated = await updateDbEnquiry(id, updates);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Enquiry with ID "${id}" not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Enquiry #${id} updated in PostgreSQL.`,
      data: updated,
    });
  } catch (error: any) {
    console.error("[API PATCH /api/enquiries] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update enquiry." },
      { status: 500 }
    );
  }
}

// DELETE /api/enquiries - Delete an enquiry from PostgreSQL (ADMIN ONLY)
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Enquiry ID is required." },
        { status: 400 }
      );
    }

    const deleted = await deleteDbEnquiry(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `Enquiry with ID "${id}" not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Enquiry #${id} deleted from PostgreSQL database.`,
    });
  } catch (error: any) {
    console.error("[API DELETE /api/enquiries] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete enquiry." },
      { status: 500 }
    );
  }
}
