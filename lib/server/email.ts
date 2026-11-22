import nodemailer from "nodemailer";
import {
  getDbEmailSettingsWithSecret,
  logEmailEvent,
  getDbOrderById,
} from "@/lib/server/db";
import { CheckoutOrder, CustomerEnquiry } from "@/lib/types";
import { getEncryptionKey } from "@/lib/server/crypto";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  templateType: "order_received" | "payment_confirmed" | "payment_rejected" | "admin_order_alert" | "admin_enquiry_alert" | "test_email" | "password_reset" | "password_changed" | string;
  forceSend?: boolean;
}

/**
 * Sends an email using configured SMTP settings.
 * If SMTP is disabled or unconfigured, logs as 'disabled' without throwing.
 */
export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; status: string; error?: string }> {
  try {
    const settings = await getDbEmailSettingsWithSecret({ forceDecrypt: params.forceSend });

    if (!settings.isEnabled && !params.forceSend) {
      await logEmailEvent({
        toEmail: params.to,
        subject: params.subject,
        templateType: params.templateType,
        status: "disabled",
      });
      return { success: true, status: "disabled" };
    }

    if (!settings.smtpHost || !settings.smtpUser) {
      const errorMsg = "SMTP host or user is missing in configuration.";
      await logEmailEvent({
        toEmail: params.to,
        subject: params.subject,
        templateType: params.templateType,
        status: "failed",
        errorMessage: errorMsg,
      });
      return { success: false, status: "failed", error: errorMsg };
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpSecure,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPasswordDecrypted,
      },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 4000,
      tls: {
        rejectUnauthorized: false,
      },
    });

    const fromAddress = `"${settings.senderName}" <${settings.senderEmail}>`;

    await transporter.sendMail({
      from: fromAddress,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    await logEmailEvent({
      toEmail: params.to,
      subject: params.subject,
      templateType: params.templateType,
      status: "sent",
    });

    return { success: true, status: "sent" };
  } catch (error: any) {
    const errorMsg = error?.message || "Failed to dispatch email via SMTP transporter.";
    console.error(`[SMTP Dispatch Error to ${params.to}]:`, errorMsg);
    await logEmailEvent({
      toEmail: params.to,
      subject: params.subject,
      templateType: params.templateType,
      status: "failed",
      errorMessage: errorMsg,
    });
    return { success: false, status: "failed", error: errorMsg };
  }
}

// =========================================================================
// RESPONSIVE HTML EMAIL TEMPLATES (UNITECH CCTV BRANDING)
// =========================================================================

function emailLayout(contentHtml: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #334155; }
    .email-container { max-width: 600px; margin: 24px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
    .email-header { background: #0f172a; padding: 28px 24px; text-align: center; border-bottom: 3px solid #E3141B; }
    .logo-text { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; margin: 0; }
    .logo-accent { color: #E3141B; }
    .logo-tagline { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin-top: 4px; }
    .email-body { padding: 32px 28px; line-height: 1.6; }
    .order-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .order-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .order-table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
    .order-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #1e293b; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-pending { background: #fef3c7; color: #b45309; }
    .badge-confirmed { background: #dcfce7; color: #15803d; }
    .badge-rejected { background: #fee2e2; color: #b91c1c; }
    .email-footer { background: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .btn { display: inline-block; padding: 12px 24px; background: #E3141B; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <div class="logo-text">UNITECH<span class="logo-accent">.</span> CCTV</div>
      <div class="logo-tagline">Direct Factory Surveillance Manufacturer</div>
    </div>
    <div class="email-body">
      ${contentHtml}
    </div>
    <div class="email-footer">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #334155;">Unitech CCTV — Sahibabad Industrial Area, Ghaziabad, UP, India</p>
      <p style="margin: 0 0 4px 0;">Corporate Phone: <a href="tel:+918700317239" style="color: #E3141B; text-decoration: none;">+91 87003 17239</a> | Email: <a href="mailto:sales@unitechcctv.com" style="color: #E3141B; text-decoration: none;">sales@unitechcctv.com</a></p>
      <p style="margin: 0; color: #94a3b8; font-size: 11px;">An ISO 9001:2015 & CE Certified Surveillance Manufacturer</p>
    </div>
  </div>
</body>
</html>`;
}

// 1. Order Received (Customer)
function buildOrderReceivedEmail(order: CheckoutOrder) {
  const itemsHtml = Array.isArray(order.items)
    ? order.items
        .map(
          (it) => `<tr>
            <td><strong>${it.name || "Hardware Product"}</strong><br><span style="font-size: 11px; color: #64748b;">${it.modelCode || it.slug || ""}</span></td>
            <td style="text-align: center;">${it.quantity}</td>
            <td style="text-align: right;">₹${(Number(it.price || 0) * Number(it.quantity || 1)).toLocaleString("en-IN")}</td>
          </tr>`
        )
        .join("")
    : "";

  const contentHtml = `
    <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Order Placed & Payment Submitted</h2>
    <p>Dear <strong>${order.customerName}</strong>,</p>
    <p>Thank you for choosing Unitech CCTV. We have received your order details and transaction reference. Our accounts desk is currently verifying your payment with the bank.</p>
    
    <div class="order-box">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 14px; font-weight: 700; color: #0f172a;">Order #${order.orderNumber || order.id}</span>
        <span class="badge badge-pending">Payment Pending Verification</span>
      </div>
      <p style="margin: 4px 0; font-size: 13px;"><strong>Transaction UTR:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: 700;">${order.utrNumber || "Submitted"}</code></p>
      <p style="margin: 4px 0; font-size: 13px;"><strong>Payment Mode:</strong> ${order.paymentMode}</p>
      <p style="margin: 4px 0; font-size: 13px;"><strong>Delivery Address:</strong> ${order.street}, ${order.city}, ${order.state} - ${order.pincode}</p>

      <table class="order-table">
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="margin-top: 16px; border-top: 2px solid #e2e8f0; padding-top: 12px; text-align: right; font-size: 13px;">
        <div>Subtotal: <strong>₹${Number(order.subtotal || 0).toLocaleString("en-IN")}</strong></div>
        <div>GST (18%): <strong>₹${Number(order.gstAmount || 0).toLocaleString("en-IN")}</strong></div>
        <div style="font-size: 16px; font-weight: 800; color: #E3141B; margin-top: 6px;">Total Amount: ₹${Number(order.totalAmount || 0).toLocaleString("en-IN")}</div>
      </div>
    </div>

    <p style="font-size: 13px; color: #475569;">
      <strong>Next Steps:</strong> Once our accounts team reconciles your transaction reference, your order status will update to <strong>CONFIRMED</strong> and dispatch processing will commence. You will receive an email confirmation upon dispatch.
    </p>
    <p style="font-size: 13px; color: #475569;">
      If you have questions regarding this order, call our sales desk directly at <strong>+91 87003 17239</strong>.
    </p>
  `;

  const text = `Unitech CCTV - Order Received #${order.orderNumber || order.id}
Dear ${order.customerName},
Thank you for your order. We have received your payment reference (UTR: ${order.utrNumber}).
Total Amount: INR ${order.totalAmount}
Delivery: ${order.street}, ${order.city}, ${order.state} - ${order.pincode}
Our accounts team will verify your transaction shortly. For inquiries, call +91 87003 17239.`;

  return {
    subject: `[Unitech CCTV] Order Placed: #${order.orderNumber || order.id} (Payment Under Verification)`,
    html: emailLayout(contentHtml, `Order Received #${order.orderNumber || order.id}`),
    text,
  };
}

// 2. Payment Confirmed (Customer)
function buildPaymentConfirmedEmail(order: CheckoutOrder) {
  const contentHtml = `
    <h2 style="font-size: 20px; color: #15803d; margin-top: 0;">Payment Confirmed & Order Processing</h2>
    <p>Dear <strong>${order.customerName}</strong>,</p>
    <p>We are pleased to inform you that your payment for Order <strong>#${order.orderNumber || order.id}</strong> has been successfully verified by our accounts desk.</p>

    <div class="order-box">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 14px; font-weight: 700; color: #0f172a;">Order #${order.orderNumber || order.id}</span>
        <span class="badge badge-confirmed">Payment Confirmed</span>
      </div>
      <p style="margin: 4px 0; font-size: 13px;"><strong>Amount Paid:</strong> ₹${Number(order.totalAmount || 0).toLocaleString("en-IN")}</p>
      <p style="margin: 4px 0; font-size: 13px;"><strong>Verified UTR:</strong> <code style="font-weight: 700;">${order.utrNumber || "Verified"}</code></p>
      <p style="margin: 4px 0; font-size: 13px;"><strong>Current Order Status:</strong> Processing at Sahibabad Warehouse</p>
      <p style="margin: 4px 0; font-size: 13px;"><strong>Shipping Address:</strong> ${order.street}, ${order.city}, ${order.state} - ${order.pincode}</p>
    </div>

    <p style="font-size: 13px; color: #475569;">
      Your hardware units are being quality inspected, packaged, and prepared for dispatch. Our logistics partner tracking details will be shared once handed over to the courier.
    </p>
  `;

  const text = `Unitech CCTV - Payment Confirmed for Order #${order.orderNumber || order.id}
Dear ${order.customerName},
Your payment of INR ${order.totalAmount} has been verified!
Your order is currently processing for dispatch from our Sahibabad plant.
For any queries, contact our desk at +91 87003 17239.`;

  return {
    subject: `[Unitech CCTV] Payment Confirmed: Order #${order.orderNumber || order.id} is Processing`,
    html: emailLayout(contentHtml, `Payment Confirmed #${order.orderNumber || order.id}`),
    text,
  };
}

// 3. Payment Rejected (Customer)
function buildPaymentRejectedEmail(order: CheckoutOrder, reason?: string) {
  const contentHtml = `
    <h2 style="font-size: 20px; color: #b91c1c; margin-top: 0;">Payment Verification Action Required</h2>
    <p>Dear <strong>${order.customerName}</strong>,</p>
    <p>We were unable to verify your payment reference for Order <strong>#${order.orderNumber || order.id}</strong>.</p>

    <div class="order-box">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 14px; font-weight: 700; color: #0f172a;">Order #${order.orderNumber || order.id}</span>
        <span class="badge badge-rejected">Verification Failed</span>
      </div>
      <p style="margin: 4px 0; font-size: 13px;"><strong>Submitted UTR:</strong> <code>${order.utrNumber || "N/A"}</code></p>
      <p style="margin: 4px 0; font-size: 13px;"><strong>Order Amount:</strong> ₹${Number(order.totalAmount || 0).toLocaleString("en-IN")}</p>
      ${reason ? `<p style="margin: 4px 0; font-size: 13px; color: #b91c1c;"><strong>Reason:</strong> ${reason}</p>` : ""}
    </div>

    <p style="font-size: 13px; color: #475569;">
      Please double-check the UTR reference from your banking app. If the payment was debited from your account, kindly contact our accounts desk with a payment screenshot so we can locate your transaction and release your order.
    </p>
    <p style="font-size: 13px; color: #475569;">
      Direct Support: <strong>+91 87003 17239</strong> or WhatsApp <a href="https://wa.me/918700317239" style="color: #E3141B; font-weight: bold;">+91 87003 17239</a>.
    </p>
  `;

  const text = `Unitech CCTV - Payment Verification Failed for Order #${order.orderNumber || order.id}
Dear ${order.customerName},
We could not verify payment reference ${order.utrNumber || "N/A"} for Order #${order.orderNumber || order.id}.
${reason ? `Reason: ${reason}` : ""}
Please contact our accounts desk at +91 87003 17239 or WhatsApp +91 87003 17239 with your payment screenshot.`;

  return {
    subject: `[Action Required] Payment Verification Issue: Order #${order.orderNumber || order.id}`,
    html: emailLayout(contentHtml, `Payment Verification Issue #${order.orderNumber || order.id}`),
    text,
  };
}

// 4. Admin Order Alert
function buildAdminOrderAlertEmail(order: CheckoutOrder) {
  const contentHtml = `
    <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">🚨 New Order Received — Payment Verification Needed</h2>
    <div class="order-box">
      <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">Order #${order.orderNumber || order.id}</div>
      <p style="margin: 3px 0; font-size: 13px;"><strong>Customer:</strong> ${order.customerName} (${order.phone})</p>
      <p style="margin: 3px 0; font-size: 13px;"><strong>Email:</strong> ${order.email}</p>
      ${order.companyName ? `<p style="margin: 3px 0; font-size: 13px;"><strong>Company:</strong> ${order.companyName}</p>` : ""}
      ${order.gstin ? `<p style="margin: 3px 0; font-size: 13px;"><strong>GSTIN:</strong> ${order.gstin}</p>` : ""}
      <p style="margin: 3px 0; font-size: 13px;"><strong>Total Amount:</strong> ₹${Number(order.totalAmount || 0).toLocaleString("en-IN")}</p>
      <p style="margin: 3px 0; font-size: 13px;"><strong>Payment Mode:</strong> ${order.paymentMode}</p>
      <p style="margin: 3px 0; font-size: 13px;"><strong>Submitted UTR:</strong> <code style="background: #e2e8f0; padding: 2px 6px; font-size: 14px; font-weight: 800; color: #E3141B;">${order.utrNumber || "N/A"}</code></p>
      <p style="margin: 3px 0; font-size: 13px;"><strong>Location:</strong> ${order.city}, ${order.state} - ${order.pincode}</p>
    </div>
    <p style="font-size: 13px;">Log in to the Admin Panel &gt; <strong>Customer Orders</strong> tab to verify the UTR and approve or reject this order.</p>
  `;

  const text = `[ADMIN ALERT] New Order Received #${order.orderNumber || order.id}
Customer: ${order.customerName} (${order.phone}, ${order.email})
Total: INR ${order.totalAmount}
UTR: ${order.utrNumber}
Location: ${order.city}, ${order.state}`;

  return {
    subject: `[ADMIN ALERT] New Order Received: #${order.orderNumber || order.id} (₹${Number(order.totalAmount || 0).toLocaleString("en-IN")})`,
    html: emailLayout(contentHtml, `Admin Order Alert`),
    text,
  };
}

// 5. Admin Enquiry Alert
function buildAdminEnquiryAlertEmail(enquiry: CustomerEnquiry) {
  const contentHtml = `
    <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">📩 New Storefront Enquiry / B2B Lead</h2>
    <div class="order-box">
      <p style="margin: 3px 0; font-size: 13px;"><strong>Name:</strong> ${enquiry.fullName}</p>
      <p style="margin: 3px 0; font-size: 13px;"><strong>Phone:</strong> <a href="tel:${enquiry.phone}">${enquiry.phone}</a></p>
      <p style="margin: 3px 0; font-size: 13px;"><strong>Email:</strong> <a href="mailto:${enquiry.email}">${enquiry.email}</a></p>
      ${enquiry.companyName ? `<p style="margin: 3px 0; font-size: 13px;"><strong>Company:</strong> ${enquiry.companyName}</p>` : ""}
      ${enquiry.gstin ? `<p style="margin: 3px 0; font-size: 13px;"><strong>GSTIN:</strong> ${enquiry.gstin}</p>` : ""}
      <p style="margin: 3px 0; font-size: 13px;"><strong>Type:</strong> ${enquiry.type}</p>
      <p style="margin: 3px 0; font-size: 13px;"><strong>Location:</strong> ${enquiry.city}, ${enquiry.state}</p>
      ${enquiry.productModel ? `<p style="margin: 3px 0; font-size: 13px;"><strong>Product Interest:</strong> ${enquiry.productModel}</p>` : ""}
      <p style="margin: 8px 0 0 0; font-size: 13px;"><strong>Message / Details:</strong></p>
      <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; font-size: 12px; margin-top: 4px; white-space: pre-wrap;">${enquiry.details}</div>
    </div>
  `;

  const text = `[ADMIN ALERT] New Storefront Enquiry
Name: ${enquiry.fullName}
Phone: ${enquiry.phone}
Email: ${enquiry.email}
Company: ${enquiry.companyName || "N/A"}
Type: ${enquiry.type}
Details: ${enquiry.details}`;

  return {
    subject: `[ADMIN ALERT] New Enquiry from ${enquiry.fullName} (${enquiry.city || "Website"})`,
    html: emailLayout(contentHtml, `Admin Enquiry Alert`),
    text,
  };
}

// 6. Test Email
function buildTestEmail(recipientEmail: string) {
  const contentHtml = `
    <h2 style="font-size: 20px; color: #15803d; margin-top: 0;">🎉 SMTP Configuration Test Successful</h2>
    <p>Hello,</p>
    <p>This is a test notification confirming that outbound SMTP mail dispatch is correctly configured and working in your <strong>Unitech CCTV Admin Panel</strong>.</p>
    <div class="order-box">
      <p style="margin: 4px 0; font-size: 13px;"><strong>Target Recipient:</strong> ${recipientEmail}</p>
      <p style="margin: 4px 0; font-size: 13px;"><strong>Timestamp:</strong> ${new Date().toLocaleString("en-IN")}</p>
      <p style="margin: 4px 0; font-size: 13px;"><strong>System:</strong> Unitech CCTV Production Outbound Mailer</p>
    </div>
    <p style="font-size: 13px; color: #475569;">All active notification triggers (Order Placed, Payment Confirmed, Admin Alerts) will now send through this server.</p>
  `;

  const text = `Unitech CCTV - SMTP Configuration Test Email
Outbound SMTP dispatch is working correctly.
Target: ${recipientEmail}
Timestamp: ${new Date().toISOString()}`;

  return {
    subject: `[Unitech CCTV] SMTP Configuration Test Email`,
    html: emailLayout(contentHtml, `SMTP Configuration Test`),
    text,
  };
}

// =========================================================================
// HIGH-LEVEL NOTIFICATION TRIGGER HELPERS
// =========================================================================

export async function sendOrderReceivedNotifications(orderId: string): Promise<void> {
  try {
    const settings = await getDbEmailSettingsWithSecret();
    const order = await getDbOrderById(orderId);
    if (!order) return;

    // 1. Send receipt to customer
    if (settings.isEnabled && settings.notifyOnOrderReceived && order.email && order.email.includes("@")) {
      const emailContent = buildOrderReceivedEmail(order);
      await sendEmail({
        to: order.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        templateType: "order_received",
      });
    }

    // 2. Send alert to admin recipients
    if (settings.isEnabled && settings.notifyAdminOnOrder && Array.isArray(settings.adminNotificationEmails)) {
      const emailContent = buildAdminOrderAlertEmail(order);
      for (const adminEmail of settings.adminNotificationEmails) {
        if (adminEmail && adminEmail.includes("@")) {
          await sendEmail({
            to: adminEmail,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
            templateType: "admin_order_alert",
          });
        }
      }
    }
  } catch (err: any) {
    console.error("[sendOrderReceivedNotifications Error]:", err?.message || err);
  }
}

export async function sendPaymentConfirmedNotification(orderId: string): Promise<void> {
  try {
    const settings = await getDbEmailSettingsWithSecret();
    if (!settings.isEnabled || !settings.notifyOnPaymentConfirmed) return;

    const order = await getDbOrderById(orderId);
    if (!order || !order.email || !order.email.includes("@")) return;

    const emailContent = buildPaymentConfirmedEmail(order);
    await sendEmail({
      to: order.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      templateType: "payment_confirmed",
    });
  } catch (err: any) {
    console.error("[sendPaymentConfirmedNotification Error]:", err?.message || err);
  }
}

export async function sendPaymentRejectedNotification(orderId: string, reason?: string): Promise<void> {
  try {
    const settings = await getDbEmailSettingsWithSecret();
    if (!settings.isEnabled || !settings.notifyOnPaymentRejected) return;

    const order = await getDbOrderById(orderId);
    if (!order || !order.email || !order.email.includes("@")) return;

    const emailContent = buildPaymentRejectedEmail(order, reason);
    await sendEmail({
      to: order.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      templateType: "payment_rejected",
    });
  } catch (err: any) {
    console.error("[sendPaymentRejectedNotification Error]:", err?.message || err);
  }
}

export async function sendEnquiryNotification(enquiry: CustomerEnquiry): Promise<void> {
  try {
    const settings = await getDbEmailSettingsWithSecret();
    if (!settings.isEnabled || !settings.notifyAdminOnEnquiry) return;
    if (!Array.isArray(settings.adminNotificationEmails) || settings.adminNotificationEmails.length === 0) return;

    const emailContent = buildAdminEnquiryAlertEmail(enquiry);
    for (const adminEmail of settings.adminNotificationEmails) {
      if (adminEmail && adminEmail.includes("@")) {
        await sendEmail({
          to: adminEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          templateType: "admin_enquiry_alert",
        });
      }
    }
  } catch (err: any) {
    console.error("[sendEnquiryNotification Error]:", err?.message || err);
  }
}

export async function sendTestNotification(recipientEmail: string): Promise<{ success: boolean; error?: string }> {
  try {
    getEncryptionKey();
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Email is disabled: SETTINGS_ENCRYPTION_KEY is not set on the server.",
    };
  }
  const emailContent = buildTestEmail(recipientEmail);
  const result = await sendEmail({
    to: recipientEmail,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
    templateType: "test_email",
    forceSend: true,
  });
  return { success: result.success, error: result.error };
}

export async function sendPasswordResetEmail(adminEmail: string, resetUrl: string): Promise<boolean> {
  const subject = "Reset your Unitech admin password";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#0f172a;color:#e2e8f0;">
  <div style="max-width:560px;margin:0 auto;background-color:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
    <div style="background-color:#020617;padding:24px;border-bottom:1px solid #334155;text-align:center;">
      <h1 style="margin:0;color:#ef4444;font-size:20px;font-weight:900;letter-spacing:1px;">UNITECH SECURITY SYSTEMS</h1>
      <p style="margin:4px 0 0 0;font-size:11px;color:#94a3b8;letter-spacing:0.5px;">ADMINISTRATOR SECURITY PORTAL</p>
    </div>
    <div style="padding:32px 24px;">
      <h2 style="margin:0 0 16px 0;font-size:18px;color:#f8fafc;font-weight:700;">Password Reset Request</h2>
      <p style="font-size:14px;line-height:1.6;color:#cbd5e1;margin:0 0 24px 0;">
        We received a request to reset the administrator password for <strong>${adminEmail}</strong>. Click the button below to set a new password:
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}" style="background-color:#ef4444;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;letter-spacing:0.5px;">
          Reset Admin Password
        </a>
      </div>
      <p style="font-size:12px;line-height:1.6;color:#94a3b8;margin:24px 0 0 0;padding-top:16px;border-top:1px solid #334155;">
        ⚠️ This link is valid for <strong>30 minutes</strong> and can only be used once.<br>
        If you did not request this password reset, please disregard this email or notify your system administrator immediately.
      </p>
    </div>
    <div style="background-color:#0f172a;padding:16px 24px;text-align:center;border-top:1px solid #334155;font-size:11px;color:#64748b;">
      © ${new Date().getFullYear()} Unitech Security Systems. Automated security notification.
    </div>
  </div>
</body>
</html>
  `;
  const text = `Reset your Unitech admin password\n\nWe received a request to reset your admin password. Visit the link below to set a new password:\n\n${resetUrl}\n\nThis link is valid for 30 minutes. If you did not request this, please disregard.`;

  const result = await sendEmail({
    to: adminEmail,
    subject,
    html,
    text,
    templateType: "password_reset",
    forceSend: true,
  });
  return result.success;
}

export async function sendPasswordChangedNotification(adminEmail: string): Promise<boolean> {
  const subject = "Your Unitech admin password was changed";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#0f172a;color:#e2e8f0;">
  <div style="max-width:560px;margin:0 auto;background-color:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
    <div style="background-color:#020617;padding:24px;border-bottom:1px solid #334155;text-align:center;">
      <h1 style="margin:0;color:#ef4444;font-size:20px;font-weight:900;letter-spacing:1px;">UNITECH SECURITY SYSTEMS</h1>
      <p style="margin:4px 0 0 0;font-size:11px;color:#94a3b8;letter-spacing:0.5px;">ADMINISTRATOR SECURITY PORTAL</p>
    </div>
    <div style="padding:32px 24px;">
      <h2 style="margin:0 0 16px 0;font-size:18px;color:#f8fafc;font-weight:700;">Password Updated Successfully</h2>
      <p style="font-size:14px;line-height:1.6;color:#cbd5e1;margin:0 0 16px 0;">
        This is a security confirmation that the administrator password for <strong>${adminEmail}</strong> was recently changed.
      </p>
      <p style="font-size:13px;line-height:1.6;color:#94a3b8;margin:0;">
        All existing active sessions for this account have been invalidated. If you did not make this change, please contact your security administration immediately.
      </p>
    </div>
    <div style="background-color:#0f172a;padding:16px 24px;text-align:center;border-top:1px solid #334155;font-size:11px;color:#64748b;">
      © ${new Date().getFullYear()} Unitech Security Systems. Automated security notification.
    </div>
  </div>
</body>
</html>
  `;
  const text = `Your Unitech admin password was changed\n\nThe administrator password for ${adminEmail} was recently changed. All prior sessions have been invalidated.\n\nIf you did not perform this action, contact support immediately.`;

  const result = await sendEmail({
    to: adminEmail,
    subject,
    html,
    text,
    templateType: "password_changed",
    forceSend: true,
  });
  return result.success;
}
