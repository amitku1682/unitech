import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import { getDbPaymentSettings, updateDbPaymentSettings, getDbPool, initializeDatabase } from "@/lib/server/db";

export const dynamic = "force-dynamic";

const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_NO_REGEX = /^\d{9,18}$/;

// GET /api/admin/payment-settings - Admin only: full settings with metadata
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const settings = await getDbPaymentSettings();
    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error("[GET /api/admin/payment-settings Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payment settings." },
      { status: 500 }
    );
  }
}

// PUT /api/admin/payment-settings - Admin only: validate and persist payment configuration
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    await initializeDatabase();
    const pool = getDbPool();

    const rawBody = await req.json().catch(() => ({}));
    const errors: Record<string, string> = {};

    // Extract fields
    const upiId = typeof rawBody.upiId === "string" ? rawBody.upiId.trim() : "";
    const payeeName = typeof rawBody.payeeName === "string" ? rawBody.payeeName.trim() : "";
    const bankName = typeof rawBody.bankName === "string" ? rawBody.bankName.trim() : "";
    const accountName = typeof (rawBody.accountName || rawBody.accountHolderName) === "string" 
      ? (rawBody.accountName || rawBody.accountHolderName).trim() 
      : "";
    const accountNumber = typeof rawBody.accountNumber === "string" ? rawBody.accountNumber.trim() : "";
    const rawIfsc = typeof (rawBody.ifsc || rawBody.ifscCode) === "string" 
      ? (rawBody.ifsc || rawBody.ifscCode).trim() 
      : "";
    const ifsc = rawIfsc.toUpperCase();
    const branch = typeof rawBody.branch === "string" ? rawBody.branch.trim() : "";
    const qrImageFileId = typeof rawBody.qrImageFileId === "string" ? rawBody.qrImageFileId.trim() : "";
    const qrImageUrl = typeof rawBody.qrImageUrl === "string" ? rawBody.qrImageUrl.trim() : "";
    const useDynamicQr = rawBody.useDynamicQr !== false;
    const acceptBankTransfer = rawBody.acceptBankTransfer === true;
    const paymentNote = typeof rawBody.paymentNote === "string" ? rawBody.paymentNote.trim() : "";

    // 1. Verify qr_image_file_id exists in uploaded_files before saving (if provided)
    if (qrImageFileId) {
      const fileRes = await pool.query(
        `SELECT id FROM uploaded_files WHERE id = $1 LIMIT 1;`,
        [qrImageFileId]
      );
      if (fileRes.rowCount === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "QR image not found, please upload again",
            errors: { qrImageFileId: "QR image not found, please upload again" },
          },
          { status: 400 }
        );
      }
    }

    // 2. Validate UPI format if provided
    if (upiId && !UPI_REGEX.test(upiId)) {
      errors.upiId = "Invalid UPI ID format. Expected format: username@bank (e.g. business@icici)";
    }

    // 3. Validate Dynamic QR requirement: upi_id AND payee_name are REQUIRED
    if (useDynamicQr) {
      if (!upiId) {
        errors.upiId = "UPI ID is required when Dynamic QR is enabled.";
      }
      if (!payeeName) {
        errors.payeeName = "Payee name is required when Dynamic QR is enabled.";
      }
    }

    // 4. Validate Account Number format if provided
    if (accountNumber && !ACCOUNT_NO_REGEX.test(accountNumber)) {
      errors.accountNumber = "Account number must contain only 9 to 18 numeric digits.";
    }

    // 5. Validate IFSC format if provided
    if (ifsc && !IFSC_REGEX.test(ifsc)) {
      errors.ifsc = "Invalid IFSC format. Expected 4 letters, 0, then 6 alphanumeric characters (e.g. ABCD0123456).";
    }

    // 6. Validate Bank Transfer requirement
    const hasAnyBankInfo = Boolean(bankName || accountName || accountNumber || ifsc);
    if (acceptBankTransfer || hasAnyBankInfo) {
      if (!bankName) {
        errors.bankName = "Bank name is required for bank transfer.";
      }
      if (!accountName) {
        errors.accountName = "Account holder name is required for bank transfer.";
      }
      if (!accountNumber) {
        errors.accountNumber = "Account number is required for bank transfer.";
      }
      if (!ifsc) {
        errors.ifsc = "IFSC code is required for bank transfer.";
      }
    }

    // Return field-level errors if any failed
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      return NextResponse.json(
        {
          success: false,
          error: firstError,
          errors,
        },
        { status: 400 }
      );
    }

    // Persist validated settings
    const updated = await updateDbPaymentSettings(
      {
        upiId: upiId || null,
        payeeName: payeeName || null,
        bankName: bankName || null,
        accountName: accountName || null,
        accountNumber: accountNumber || null,
        ifsc: ifsc || null,
        branch: branch || null,
        qrImageFileId: qrImageFileId || null,
        qrImageUrl: qrImageUrl || (qrImageFileId ? `/api/uploads/${qrImageFileId}` : null),
        useDynamicQr,
        paymentNote: paymentNote || null,
      },
      auth.user.id
    );

    return NextResponse.json({
      success: true,
      message: "Payment settings updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    console.error("[PUT /api/admin/payment-settings Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update payment settings." },
      { status: 500 }
    );
  }
}
