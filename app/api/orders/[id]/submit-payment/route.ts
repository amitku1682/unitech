import { NextRequest, NextResponse } from "next/server";
import { getDbPool, initializeDatabase } from "@/lib/server/db";
import { sendOrderReceivedNotifications } from "@/lib/server/email";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/orders/[id]/submit-payment
 * Submits customer UTR reference for an existing AWAITING_PAYMENT draft order.
 * Updates payment_status to PENDING_VERIFICATION and enforces duplicate-UTR defense.
 */
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const orderId = params.id?.trim();
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID parameter is required." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawUtr = typeof body.utrNumber === "string" ? body.utrNumber.trim().toUpperCase() : "";
    const paymentMode = body.paymentMode === "BANK_TRANSFER" ? "BANK_TRANSFER" : "UPI";

    const cleanUtr = rawUtr.replace(/[^A-Z0-9]/g, "");
    if (!cleanUtr || cleanUtr.length < 6 || cleanUtr.length > 30) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid UTR / Bank Transaction Reference (6–30 alphanumeric characters) is required.",
        },
        { status: 400 }
      );
    }

    await initializeDatabase();
    const pool = getDbPool();

    // 1. Fetch target order
    const orderRes = await pool.query(
      `SELECT id, order_number, payment_status, total_amount 
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

    // 2. Validate current state allows submission
    if (order.payment_status !== "AWAITING_PAYMENT") {
      return NextResponse.json(
        {
          success: false,
          error: `Payment reference has already been submitted for this order (current status: ${order.payment_status}).`,
        },
        { status: 409 }
      );
    }

    // 3. Enforce Duplicate UTR check across orders
    const dupRes = await pool.query(
      `SELECT id FROM orders WHERE utr_number = $1 AND id != $2 LIMIT 1;`,
      [cleanUtr, order.id]
    );

    if (dupRes.rowCount && dupRes.rowCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "An order with this UTR transaction reference number has already been submitted.",
        },
        { status: 409 }
      );
    }

    // 4. Update order to PENDING_VERIFICATION
    await pool.query(
      `UPDATE orders 
       SET utr_number = $1, 
           payment_mode = $2, 
           payment_status = 'PENDING_VERIFICATION', 
           updated_at = NOW() 
       WHERE id = $3;`,
      [cleanUtr, paymentMode, order.id]
    );

    // Trigger email notifications (customer receipt + admin alert)
    sendOrderReceivedNotifications(order.id).catch((emailErr) => {
      console.warn("[Email Notification Error - Order Received]:", emailErr?.message || emailErr);
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      paymentStatus: "PENDING_VERIFICATION",
      utrNumber: cleanUtr,
    });
  } catch (error: any) {
    console.error("[PATCH /api/orders/[id]/submit-payment Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit payment reference." },
      { status: 500 }
    );
  }
}
