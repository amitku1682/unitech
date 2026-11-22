import { NextRequest, NextResponse } from "next/server";
import { getDbPaymentSettings, getDbPool, initializeDatabase } from "@/lib/server/db";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

/**
 * GET /api/payment-settings/qr?orderId=<id>
 * Generates the official dynamic UPI QR code ONLY from the persisted database order.
 * Accepts NO client-supplied amounts and recomputes NO data.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId")?.trim();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId query parameter is required." },
        { status: 400 }
      );
    }

    // 1. Fetch authenticated order from PostgreSQL
    await initializeDatabase();
    const pool = getDbPool();
    const orderRes = await pool.query(
      `SELECT id, order_number, total_amount, payment_status 
       FROM orders 
       WHERE id = $1 OR order_number = $1 
       LIMIT 1;`,
      [orderId]
    );

    if (orderRes.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    const order = orderRes.rows[0];

    // 2. Validate Order is in AWAITING_PAYMENT status
    if (order.payment_status !== "AWAITING_PAYMENT") {
      return NextResponse.json(
        {
          success: false,
          error: `Order is not awaiting payment (current status: ${order.payment_status}).`,
        },
        { status: 409 }
      );
    }

    // 3. Load active payment configuration
    const settings = await getDbPaymentSettings();
    if (!settings || (!settings.upiId && !settings.accountNumber)) {
      return NextResponse.json(
        { success: false, isConfigured: false, error: "Payment settings are not yet configured." },
        { status: 400 }
      );
    }

    const totalAmount = Number(order.total_amount);
    const amountStr = totalAmount.toFixed(2);
    const orderNumber = order.order_number;
    const payeeName = settings.payeeName || "Unitech CCTV";

    // 4. Return static uploaded QR if dynamic QR is disabled
    if (!settings.useDynamicQr || !settings.upiId) {
      return NextResponse.json({
        success: true,
        isDynamic: false,
        qrDataUrl: settings.qrImageUrl || null,
        amount: totalAmount,
        orderNumber,
        upiId: settings.upiId || null,
        payeeName,
        paymentNote: settings.paymentNote,
      });
    }

    // 5. Build official NPCI / RBI UPI payment deep link strictly from database order total and order number
    // Uses strictly non-merchant parameters: pa, pn, am, cu, tn (tr, mc, mode, purpose, url are excluded)
    const rawNote = `Order ${orderNumber}`.slice(0, 50);
    const upiUri = `upi://pay?pa=${encodeURIComponent(settings.upiId.trim())}&pn=${encodeURIComponent(
      payeeName.trim()
    )}&am=${amountStr}&cu=INR&tn=${encodeURIComponent(rawNote)}`;

    // Generate high-resolution QR data URL
    const qrDataUrl = await QRCode.toDataURL(upiUri, {
      width: 360,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });

    return NextResponse.json({
      success: true,
      isDynamic: true,
      qrDataUrl,
      upiUri,
      amount: totalAmount,
      orderNumber,
      orderId: order.id,
      upiId: settings.upiId,
      payeeName,
      paymentNote: settings.paymentNote,
    });
  } catch (error: any) {
    console.error("[GET /api/payment-settings/qr Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate payment QR code." },
      { status: 500 }
    );
  }
}
