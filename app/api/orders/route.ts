import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import {
  getDbOrders,
  getDbOrderById,
  getDbOrderByUtr,
  createDbOrder,
  updateDbOrderStatus,
  confirmDbOrderPayment,
  rejectDbOrderPayment,
  cleanupAbandonedOrders,
  getDbPool,
  initializeDatabase,
} from "@/lib/server/db";
import { calculateCartQuote } from "@/lib/server/pricing";
import {
  sendPaymentConfirmedNotification,
  sendPaymentRejectedNotification,
} from "@/lib/server/email";
import { CheckoutOrder } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/orders - Admin only: retrieve order list or single order by ID/OrderNumber
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(req.url);
    const idOrNum = searchParams.get("id") || searchParams.get("orderNumber");

    if (idOrNum) {
      const order = await getDbOrderById(idOrNum);
      if (!order) {
        return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
      }
      return NextResponse.json({ success: true, source: "postgresql", data: order });
    }

    const showAbandoned = searchParams.get("showAbandoned") === "true";
    const list = await getDbOrders(showAbandoned);
    return NextResponse.json({
      success: true,
      source: "postgresql",
      count: list.length,
      data: list,
    });
  } catch (error: any) {
    console.error("[API GET /api/orders] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch orders." }, { status: 500 });
  }
}

// POST /api/orders - Public: Place verified checkout order with manual UPI / bank UTR reference
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validate required customer & address details
    const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
    const companyName = typeof body.companyName === "string" ? body.companyName.trim() : null;
    const phone = typeof body.phone === "string" ? body.phone.trim().replace(/\D/g, "") : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const street = typeof body.street === "string" ? body.street.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const state = typeof body.state === "string" ? body.state.trim() : "";
    const pincode = typeof body.pincode === "string" ? body.pincode.trim() : "";
    const gstin = typeof body.gstin === "string" && body.gstin.trim() ? body.gstin.trim().toUpperCase() : null;
    const rawUtr = typeof body.utrNumber === "string" ? body.utrNumber.trim().toUpperCase() : "";

    if (!customerName || customerName.length < 3) {
      return NextResponse.json({ success: false, error: "Valid customer or company name is required (min 3 chars)." }, { status: 400 });
    }
    if (!phone || phone.length < 10) {
      return NextResponse.json({ success: false, error: "Valid 10-digit mobile number is required." }, { status: 400 });
    }
    if (!email || !email.includes("@") || !email.includes(".")) {
      return NextResponse.json({ success: false, error: "Valid email address is required for invoicing." }, { status: 400 });
    }
    if (!street || street.length < 5) {
      return NextResponse.json({ success: false, error: "Complete delivery address is required." }, { status: 400 });
    }
    if (!city || !state || !pincode || pincode.length !== 6) {
      return NextResponse.json({ success: false, error: "Valid city, state, and 6-digit postal pincode are required." }, { status: 400 });
    }

    // 2. Validate UTR reference number (min 6 alphanumeric characters, max 30)
    const cleanUtr = rawUtr.replace(/[^A-Z0-9]/g, "");
    if (!cleanUtr || cleanUtr.length < 6 || cleanUtr.length > 30) {
      return NextResponse.json(
        { success: false, error: "A valid UTR / Bank Transaction Reference (6–30 alphanumeric characters) is required." },
        { status: 400 }
      );
    }

    // 3. Check for Duplicate UTR in PostgreSQL
    const existingOrder = await getDbOrderByUtr(cleanUtr);
    if (existingOrder) {
      return NextResponse.json(
        {
          success: false,
          error: "An order with this UTR transaction reference number has already been submitted. If you already placed this order, please check your email or contact support.",
        },
        { status: 409 }
      );
    }

    // 4. Validate items array
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0) {
      return NextResponse.json({ success: false, error: "Cart is empty. At least one item is required to place an order." }, { status: 400 });
    }

    // 5. Server-side price recalculation using canonical pricing engine (NEVER trust browser prices)
    const quote = await calculateCartQuote(rawItems);
    if (quote.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "None of the items in your cart are currently available for purchase.",
          unavailableItems: quote.unavailableItems,
        },
        { status: 400 }
      );
    }

    const calculatedSubtotal = quote.subtotal;
    const calculatedGst = quote.gst;
    const calculatedTotal = quote.total;
    const validatedItems = quote.items;

    const orderNumber = `UT-ORD-${Date.now().toString().slice(-6)}`;

    const orderPayload = {
      orderNumber,
      customerName,
      companyName,
      phone,
      email,
      street,
      city,
      state,
      pincode,
      gstin,
      subtotal: calculatedSubtotal,
      gstAmount: calculatedGst,
      totalAmount: calculatedTotal,
      paymentMode: "UPI" as const,
      utrNumber: cleanUtr,
      paymentStatus: "PENDING_VERIFICATION",
      orderStatus: "PLACED",
      adminNotes: null,
      items: validatedItems,
    };

    const created = await createDbOrder(orderPayload as any);

    return NextResponse.json({
      success: true,
      source: "postgresql",
      orderNumber,
      data: created,
      message: "Order placed successfully — payment verification pending admin review.",
    });
  } catch (error: any) {
    console.error("[API POST /api/orders] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to place order. Please try again." }, { status: 500 });
  }
}

// DELETE /api/orders - Admin only: cleanup abandoned drafts older than 24 hours
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "cleanup_abandoned") {
      const cleanedCount = await cleanupAbandonedOrders();
      return NextResponse.json({
        success: true,
        cleanedCount,
        message: `Successfully cleaned up ${cleanedCount} abandoned draft orders older than 24 hours.`,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action parameter." }, { status: 400 });
  } catch (error: any) {
    console.error("[API DELETE /api/orders] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete order." }, { status: 500 });
  }
}

// PATCH /api/orders - Admin only: Payment verification (confirm/reject) and order fulfillment status
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const id = body.id || body.orderId;
    const { action, orderStatus, adminNotes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Order id is required." }, { status: 400 });
    }

    // Action 1: Confirm Payment (updates status & decrements inventory atomically)
    if (action === "confirm_payment" || body.paymentStatus === "CONFIRMED") {
      const result = await confirmDbOrderPayment(id, adminNotes);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error || "Failed to confirm payment." }, { status: 400 });
      }
      sendPaymentConfirmedNotification(id).catch((emailErr) => {
        console.warn("[Email Notification Error - Payment Confirmed]:", emailErr?.message || emailErr);
      });
      return NextResponse.json({ success: true, message: "Payment confirmed and product stock decremented." });
    }

    // Action 2: Reject Payment
    if (action === "reject_payment" || body.paymentStatus === "REJECTED") {
      const result = await rejectDbOrderPayment(id, adminNotes);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error || "Failed to reject payment." }, { status: 400 });
      }
      sendPaymentRejectedNotification(id, adminNotes).catch((emailErr) => {
        console.warn("[Email Notification Error - Payment Rejected]:", emailErr?.message || emailErr);
      });
      return NextResponse.json({ success: true, message: "Payment rejected and order cancelled." });
    }

    // Action 3: Update Order Fulfillment Status (PLACED -> PROCESSING -> DISPATCHED -> DELIVERED)
    if (orderStatus) {
      const updated = await updateDbOrderStatus(id, orderStatus, adminNotes);
      if (!updated) {
        return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: `Order status updated to ${orderStatus}.` });
    }

    return NextResponse.json({ success: false, error: "No recognized action or orderStatus provided." }, { status: 400 });
  } catch (error: any) {
    console.error("[API PATCH /api/orders] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update order." }, { status: 500 });
  }
}
