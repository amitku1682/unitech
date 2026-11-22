import { NextRequest, NextResponse } from "next/server";
import { getDbPool, initializeDatabase } from "@/lib/server/db";
import { calculateCartQuote } from "@/lib/server/pricing";
import {
  validateIndianPhone,
  validateEmail,
  validatePincode,
  validateGSTIN,
  validateText,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // 1. Validate customer & shipping details
    const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
    const companyName = typeof body.companyName === "string" ? body.companyName.trim() || null : null;
    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    const cleanPhone = rawPhone.replace(/\D/g, "");
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const street = typeof body.street === "string" ? body.street.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const state = typeof body.state === "string" ? body.state.trim() : "";
    const pincode = typeof body.pincode === "string" ? body.pincode.trim() : "";
    const rawGstin = typeof body.gstin === "string" ? body.gstin.trim() : "";
    const existingOrderId = typeof body.existingOrderId === "string" ? body.existingOrderId.trim() : "";
    const paymentMode = body.paymentMode === "BANK_TRANSFER" ? "BANK_TRANSFER" : "UPI";

    const nameVal = validateText(customerName, "Customer Name", 3);
    if (!nameVal.isValid) {
      return NextResponse.json({ success: false, error: nameVal.error }, { status: 400 });
    }

    const phoneVal = validateIndianPhone(rawPhone);
    if (!phoneVal.isValid) {
      return NextResponse.json({ success: false, error: phoneVal.error }, { status: 400 });
    }

    const emailVal = validateEmail(email, true);
    if (!emailVal.isValid) {
      return NextResponse.json({ success: false, error: emailVal.error }, { status: 400 });
    }

    const streetVal = validateText(street, "Address", 5);
    if (!streetVal.isValid) {
      return NextResponse.json({ success: false, error: streetVal.error }, { status: 400 });
    }

    const cityVal = validateText(city, "City", 2);
    if (!cityVal.isValid) {
      return NextResponse.json({ success: false, error: cityVal.error }, { status: 400 });
    }

    if (!state) {
      return NextResponse.json({ success: false, error: "State is required." }, { status: 400 });
    }

    const pinVal = validatePincode(pincode);
    if (!pinVal.isValid) {
      return NextResponse.json({ success: false, error: pinVal.error }, { status: 400 });
    }

    let gstin: string | null = null;
    if (rawGstin) {
      const gstinVal = validateGSTIN(rawGstin, false);
      if (!gstinVal.isValid) {
        return NextResponse.json({ success: false, error: gstinVal.error }, { status: 400 });
      }
      gstin = rawGstin.toUpperCase();
    }

    // 2. Validate Cart & calculate canonical pricing server-side
    const cartItems = Array.isArray(body.cart)
      ? body.cart
      : Array.isArray(body.items)
      ? body.items
      : [];

    if (cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty. Please add items to proceed." },
        { status: 400 }
      );
    }

    const quote = await calculateCartQuote(cartItems);

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

    await initializeDatabase();
    const pool = getDbPool();

    // 3. Create or update draft order
    let finalOrderId = "";
    let finalOrderNumber = "";

    if (existingOrderId) {
      const checkRes = await pool.query(
        `SELECT id, order_number, payment_status FROM orders WHERE id = $1 LIMIT 1;`,
        [existingOrderId]
      );
      if (checkRes.rowCount && checkRes.rowCount > 0) {
        const existingRow = checkRes.rows[0];
        // Only allow updating drafts that have not yet had payment confirmed or submitted
        if (existingRow.payment_status === "AWAITING_PAYMENT") {
          await pool.query(
            `UPDATE orders SET
              customer_name = $1,
              company_name = $2,
              phone = $3,
              email = $4,
              street = $5,
              city = $6,
              state = $7,
              pincode = $8,
              gstin = $9,
              subtotal = $10,
              gst_amount = $11,
              total_amount = $12,
              payment_mode = $13,
              items = $14,
              updated_at = NOW()
            WHERE id = $15;`,
            [
              customerName,
              companyName,
              cleanPhone,
              email,
              street,
              city,
              state,
              pincode,
              gstin,
              quote.subtotal,
              quote.gst,
              quote.total,
              paymentMode,
              JSON.stringify(quote.items),
              existingRow.id,
            ]
          );
          finalOrderId = existingRow.id;
          finalOrderNumber = existingRow.order_number;
        }
      }
    }

    if (!finalOrderId) {
      finalOrderId = `ord-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      finalOrderNumber = `UT-ORD-${Date.now().toString().slice(-6)}`;

      await pool.query(
        `INSERT INTO orders (
          id, order_number, customer_name, company_name, phone, email, street, city, state, pincode, gstin,
          subtotal, gst_amount, total_amount, payment_mode, payment_status, order_status, items, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
          $12, $13, $14, $15, 'AWAITING_PAYMENT', 'PLACED', $16, NOW(), NOW()
        );`,
        [
          finalOrderId,
          finalOrderNumber,
          customerName,
          companyName,
          cleanPhone,
          email,
          street,
          city,
          state,
          pincode,
          gstin,
          quote.subtotal,
          quote.gst,
          quote.total,
          paymentMode,
          JSON.stringify(quote.items),
        ]
      );
    }

    return NextResponse.json({
      success: true,
      orderId: finalOrderId,
      orderNumber: finalOrderNumber,
      items: quote.items,
      subtotal: quote.subtotal,
      gst: quote.gst,
      total: quote.total,
      unavailableItems: quote.unavailableItems,
    });
  } catch (error: any) {
    console.error("[POST /api/orders/draft Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create draft order." },
      { status: 500 }
    );
  }
}
