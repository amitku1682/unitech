"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/utils";
import { Navbar } from "@/components/store/Navbar";
import { Footer } from "@/components/store/Footer";
import {
  Lock,
  CreditCard,
  QrCode,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Copy,
  Check,
  Building2,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import {
  validateIndianPhone,
  validateEmail,
  validatePincode,
  validateGSTIN,
  validateText,
} from "@/lib/validation";

interface PaymentConfig {
  isConfigured: boolean;
  upiId: string | null;
  payeeName: string | null;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  branch: string | null;
  qrImageUrl: string | null;
  useDynamicQr: boolean;
  paymentNote: string | null;
}

interface StoredCartItem {
  productId: string;
  quantity: number;
}

interface DraftOrderData {
  orderId: string;
  orderNumber: string;
  items: any[];
  subtotal: number;
  gst: number;
  total: number;
}

export default function CheckoutPage() {
  const [step, setStep] = useState<"DETAILS" | "PAYMENT" | "CONFIRMED">("DETAILS");
  const [paymentMode, setPaymentMode] = useState<"UPI" | "BANK_TRANSFER">("UPI");
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedUtr, setConfirmedUtr] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Cart & Server-Side Quote state
  const [cartRaw, setCartRaw] = useState<StoredCartItem[]>([]);
  const [serverQuote, setServerQuote] = useState<{
    items: any[];
    subtotal: number;
    gst: number;
    total: number;
  } | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState<boolean>(true);

  // Draft order state (Single Source of Truth)
  const [draftOrder, setDraftOrder] = useState<DraftOrderData | null>(null);

  // Payment configuration & Dynamic QR state
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [dynamicQrDataUrl, setDynamicQrDataUrl] = useState<string | null>(null);
  const [qrOrderNumber, setQrOrderNumber] = useState<string>("");

  // 1. Load cart from localStorage and payment settings
  useEffect(() => {
    fetch("/api/payment-settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setPaymentConfig(json.data);
        }
      })
      .catch((err) => console.error("[Payment settings fetch error]:", err));

    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("unitech_cart");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const normalized: StoredCartItem[] = parsed
              .map((item: any) => ({
                productId: String(item.productId || item.id || "").trim(),
                quantity: Math.max(1, Math.min(999, parseInt(String(item.quantity || 1), 10) || 1)),
              }))
              .filter((item) => Boolean(item.productId));
            setCartRaw(normalized);
            return;
          }
        }
      } catch { }
    }
    setCartRaw([]);
    setIsLoadingQuote(false);
  }, []);

  // 2. Fetch canonical server-side quote for Step 1
  const loadServerQuote = useCallback(async (itemsToQuote: StoredCartItem[]) => {
    if (itemsToQuote.length === 0) {
      setServerQuote(null);
      setIsLoadingQuote(false);
      return;
    }
    setIsLoadingQuote(true);
    try {
      const res = await fetch("/api/cart/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToQuote }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setServerQuote({
          items: json.data.items,
          subtotal: json.data.subtotal,
          gst: json.data.gst,
          total: json.data.total,
        });
      }
    } catch (err) {
      console.error("[Checkout Quote Fetch Error]:", err);
    } finally {
      setIsLoadingQuote(false);
    }
  }, []);

  useEffect(() => {
    if (cartRaw.length > 0) {
      loadServerQuote(cartRaw);
    } else {
      setIsLoadingQuote(false);
    }
  }, [cartRaw, loadServerQuote]);

  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    state: "Uttar Pradesh",
    pincode: "",
    gstin: "",
    utrNumber: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const validateAllFields = () => {
    const errs: Record<string, string> = {};

    const nameRes = validateText(form.fullName, "Customer / Contact Name", 3);
    if (!nameRes.isValid) errs.fullName = nameRes.error!;

    const phoneRes = validateIndianPhone(form.phone);
    if (!phoneRes.isValid) errs.phone = phoneRes.error!;

    const emailRes = validateEmail(form.email, true);
    if (!emailRes.isValid) errs.email = emailRes.error!;

    const streetRes = validateText(form.street, "Delivery Address", 8);
    if (!streetRes.isValid) errs.street = streetRes.error!;

    const cityRes = validateText(form.city, "City", 2);
    if (!cityRes.isValid) errs.city = cityRes.error!;

    const pinRes = validatePincode(form.pincode);
    if (!pinRes.isValid) errs.pincode = pinRes.error!;

    if (!form.state || !form.state.trim()) {
      errs.state = "Please select a state / province.";
    }

    const gstinRes = validateGSTIN(form.gstin, false);
    if (!gstinRes.isValid) errs.gstin = gstinRes.error!;

    return errs;
  };

  const handleFieldChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // 3. Fetch Dynamic QR using ONLY the persisted orderId
  const fetchDynamicQr = async (targetOrderId: string) => {
    setIsLoadingPayment(true);
    try {
      const res = await fetch(`/api/payment-settings/qr?orderId=${encodeURIComponent(targetOrderId)}`);
      const json = await res.json();
      if (json.success) {
        if (json.qrDataUrl) setDynamicQrDataUrl(json.qrDataUrl);
        if (json.orderNumber) setQrOrderNumber(json.orderNumber);
      } else {
        setServerError(json.error || "Failed to load payment QR code.");
      }
    } catch (err) {
      console.error("[Dynamic QR fetch error]:", err);
    } finally {
      setIsLoadingPayment(false);
    }
  };

  // 4. Step 1 -> Step 2: Create or update draft order in PostgreSQL
  const handleProceedToPayment = async () => {
    const errs = validateAllFields();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    if (cartRaw.length === 0) {
      setServerError("Your cart is empty. Please add items before checking out.");
      return;
    }

    setErrors({});
    setServerError(null);
    setIsProcessing(true);

    try {
      const res = await fetch("/api/orders/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: cartRaw,
          customerName: form.fullName.trim(),
          companyName: form.companyName.trim() || null,
          phone: form.phone.trim(),
          email: form.email.trim(),
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
          gstin: form.gstin.trim() ? form.gstin.trim().toUpperCase() : null,
          paymentMode,
          existingOrderId: draftOrder?.orderId || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setServerError(json.error || "Failed to create draft order. Please try again.");
        setIsProcessing(false);
        return;
      }

      const newDraft: DraftOrderData = {
        orderId: json.orderId,
        orderNumber: json.orderNumber,
        items: json.items,
        subtotal: json.subtotal,
        gst: json.gst,
        total: json.total,
      };

      setDraftOrder(newDraft);
      setStep("PAYMENT");
      setIsProcessing(false);

      // Load dynamic QR directly from the created draft order
      fetchDynamicQr(newDraft.orderId);
    } catch (draftErr) {
      console.error("[Create Draft Order Error]:", draftErr);
      setServerError("Network error communicating with order server. Please try again.");
      setIsProcessing(false);
    }
  };

  // 5. Step 2 -> Submit: Submit payment UTR to PATCH /api/orders/<id>/submit-payment
  const handleSubmitOrder = async () => {
    const cleanUtr = form.utrNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!cleanUtr || cleanUtr.length < 6 || cleanUtr.length > 30) {
      setErrors({ utrNumber: "Please enter a valid 6–30 character UTR / Transaction Reference." });
      return;
    }

    if (!draftOrder?.orderId) {
      setServerError("Missing order reference. Please return to Step 1 and try again.");
      return;
    }

    setIsProcessing(true);
    setServerError(null);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(draftOrder.orderId)}/submit-payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utrNumber: cleanUtr,
          paymentMode,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setServerError(data.error || "Failed to submit payment. Please verify your UTR and try again.");
        setIsProcessing(false);
        return;
      }

      setConfirmedUtr(cleanUtr);
      setIsProcessing(false);
      setStep("CONFIRMED");

      // Clear cart on successful order submission
      try {
        localStorage.removeItem("unitech_cart");
        window.dispatchEvent(new Event("storage"));
      } catch { }
    } catch (orderErr) {
      console.error("[Submit Payment Reference Error]:", orderErr);
      setServerError("Network error communicating with order server. Please try again.");
      setIsProcessing(false);
    }
  };

  // Single verified source of truth for amounts
  const activeSubtotal = draftOrder ? draftOrder.subtotal : serverQuote ? serverQuote.subtotal : 0;
  const activeGst = draftOrder ? draftOrder.gst : serverQuote ? serverQuote.gst : 0;
  const activeTotal = draftOrder ? draftOrder.total : serverQuote ? serverQuote.total : 0;
  const activeOrderNumber = draftOrder?.orderNumber || qrOrderNumber || "";

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col">
      <Navbar cartCount={cartRaw.reduce((acc, it) => acc + it.quantity, 0)} />

      <div className="max-w-4xl mx-auto px-5 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12 flex-1 w-full">
        {step === "DETAILS" && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <span className="text-xs font-mono font-bold text-slate-400 block mb-1">Step 1 of 2</span>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600 shrink-0" />
                <h1 className="font-heading font-black text-xl sm:text-2xl text-slate-900">
                  Dispatch Address & GST Invoicing
                </h1>
              </div>
            </div>

            {serverError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {Object.keys(errors).length > 0 && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Please correct the highlighted fields below before proceeding to payment.</span>
              </div>
            )}

            {cartRaw.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-heading font-bold text-sm text-slate-800">Your Cart is Empty</h3>
                <p className="text-xs text-slate-500">Please add products to your cart before proceeding to checkout.</p>
                <Link
                  href="/catalogue"
                  className="inline-flex px-5 py-2.5 rounded-full bg-unitech-red text-white text-xs font-bold hover:bg-unitech-darkred transition-colors"
                >
                  Browse Hardware Catalogue
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Customer / Contact Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={form.fullName}
                      onChange={(e) => handleFieldChange("fullName", e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border transition-all focus:outline-none ${
                        errors.fullName ? "border-red-500 bg-red-50/20" : "border-slate-300 focus:border-unitech-red"
                      }`}
                    />
                    {errors.fullName && (
                      <p className="text-red-600 text-[11px] font-semibold mt-1">⚠️ {errors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Company / Entity Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Security Solutions Pvt Ltd"
                      value={form.companyName}
                      onChange={(e) => handleFieldChange("companyName", e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:border-unitech-red focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Mobile / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9818141759"
                      value={form.phone}
                      onChange={(e) => handleFieldChange("phone", e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border transition-all focus:outline-none ${
                        errors.phone ? "border-red-500 bg-red-50/20" : "border-slate-300 focus:border-unitech-red"
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-red-600 text-[11px] font-semibold mt-1">⚠️ {errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email Address (For Tax Invoice) *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. billing@acmesecurity.in"
                      value={form.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border transition-all focus:outline-none ${
                        errors.email ? "border-red-500 bg-red-50/20" : "border-slate-300 focus:border-unitech-red"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-red-600 text-[11px] font-semibold mt-1">⚠️ {errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="text-xs">
                  <label className="font-bold text-slate-700 block mb-1">Delivery Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Plot 18, Sahibabad Industrial Area, Site 2"
                    value={form.street}
                    onChange={(e) => handleFieldChange("street", e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border transition-all focus:outline-none ${
                      errors.street ? "border-red-500 bg-red-50/20" : "border-slate-300 focus:border-unitech-red"
                    }`}
                  />
                  {errors.street && (
                    <p className="text-red-600 text-[11px] font-semibold mt-1">⚠️ {errors.street}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ghaziabad"
                      value={form.city}
                      onChange={(e) => handleFieldChange("city", e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border transition-all focus:outline-none ${
                        errors.city ? "border-red-500 bg-red-50/20" : "border-slate-300 focus:border-unitech-red"
                      }`}
                    />
                    {errors.city && (
                      <p className="text-red-600 text-[11px] font-semibold mt-1">⚠️ {errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">State / Province *</label>
                    <select
                      required
                      value={form.state}
                      onChange={(e) => handleFieldChange("state", e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-medium transition-all focus:outline-none focus:border-unitech-red"
                    >
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Delhi">Delhi NCR</option>
                      <option value="Haryana">Haryana</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Telangana">Telangana</option>
                      <option value="West Bengal">West Bengal</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Bihar">Bihar</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Other">Other State / UT</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Pincode *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      placeholder="e.g. 201007"
                      value={form.pincode}
                      onChange={(e) => handleFieldChange("pincode", e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border transition-all focus:outline-none ${
                        errors.pincode ? "border-red-500 bg-red-50/20" : "border-slate-300 focus:border-unitech-red"
                      }`}
                    />
                    {errors.pincode && (
                      <p className="text-red-600 text-[11px] font-semibold mt-1">⚠️ {errors.pincode}</p>
                    )}
                  </div>
                </div>

                <div className="text-xs">
                  <label className="font-bold text-slate-700 block mb-1">GSTIN (Optional · 18% Input Tax Credit)</label>
                  <input
                    type="text"
                    autoCapitalize="characters"
                    placeholder="e.g. 09AAGPU2841M1ZG"
                    value={form.gstin}
                    onChange={(e) => handleFieldChange("gstin", e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 uppercase transition-all focus:outline-none focus:border-unitech-red"
                  />
                </div>

                {/* Server-Verified Price Breakdown */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="font-bold text-slate-700 pb-1 border-b border-slate-200">
                    Order Summary ({cartRaw.reduce((a, b) => a + b.quantity, 0)} Items)
                  </div>
                  {isLoadingQuote ? (
                    <div className="py-2 text-slate-400 text-center flex items-center justify-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying factory catalogue pricing...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Hardware Subtotal:</span>
                        <span className="font-bold text-slate-800">{formatINR(activeSubtotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>GST (18% Input Tax Credit):</span>
                        <span className="font-bold text-slate-800">{formatINR(activeGst)}</span>
                      </div>
                      <div className="flex justify-between font-black text-slate-900 text-sm pt-1.5 border-t border-slate-200">
                        <span>Total Payable:</span>
                        <span className="text-emerald-700">{formatINR(activeTotal)}</span>
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={isProcessing || isLoadingQuote || cartRaw.length === 0}
                  className="w-full min-h-[44px] py-3.5 rounded-full bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold transition-all shadow-md shadow-unitech-red/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Verified Draft Order...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Payment Verification</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {step === "PAYMENT" && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <span className="text-xs font-mono font-bold text-slate-400 block mb-1">Step 2 of 2</span>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-unitech-red shrink-0" />
                <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-900">
                  Direct UPI & Bank Transfer
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Transfer to Unitech official account and submit your UTR / transaction reference number below.
              </p>
            </div>

            {serverError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {!paymentConfig?.isConfigured ? (
              <div className="p-8 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-4">
                <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                <div className="space-y-1">
                  <h3 className="font-heading font-black text-base text-amber-900">
                    Online payment details are being updated
                  </h3>
                  <p className="text-xs text-amber-700 max-w-md mx-auto">
                    Online payment details are being updated — please contact us on WhatsApp to complete your order or receive payment instructions directly.
                  </p>
                </div>
                <a
                  href={`https://wa.me/919818141759?text=Hello%20Unitech,%20I%20would%20like%20to%20complete%20order%20${encodeURIComponent(activeOrderNumber)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <span>Contact on WhatsApp (+91 98181 41759)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMode("UPI")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentMode === "UPI"
                        ? "bg-slate-900 text-white border-slate-900 shadow-md"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <QrCode className="w-4 h-4" />
                      <span>Instant UPI / QR</span>
                    </div>
                    <div className="text-[10px] opacity-70 mt-0.5">GPay, PhonePe, Paytm, BHIM</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode("BANK_TRANSFER")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentMode === "BANK_TRANSFER"
                        ? "bg-slate-900 text-white border-slate-900 shadow-md"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" />
                      <span>NEFT / RTGS / IMPS</span>
                    </div>
                    <div className="text-[10px] opacity-70 mt-0.5">Corporate NetBanking Account</div>
                  </button>
                </div>

                {paymentMode === "UPI" && (
                  <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
                    <div className="w-44 h-44 mx-auto bg-white rounded-2xl border-2 border-dashed border-slate-300 p-2 flex flex-col items-center justify-center shadow-xs overflow-hidden">
                      {isLoadingPayment ? (
                        <div className="text-slate-400 text-xs flex flex-col items-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-slate-500" />
                          <span>Loading Secure QR...</span>
                        </div>
                      ) : dynamicQrDataUrl ? (
                        <img src={dynamicQrDataUrl} alt="UPI Payment QR Code" className="w-full h-full object-contain" />
                      ) : paymentConfig.qrImageUrl ? (
                        <img src={paymentConfig.qrImageUrl} alt="UPI Payment QR Code" className="w-full h-full object-contain" />
                      ) : (
                        <>
                          <QrCode className="w-24 h-24 text-slate-800" />
                          <span className="text-[10px] font-mono font-bold text-slate-600 mt-1 truncate max-w-[150px]">
                            {paymentConfig.upiId}
                          </span>
                        </>
                      )}
                    </div>

                    {paymentConfig.payeeName && (
                      <div className="text-xs font-bold text-slate-700">
                        Payee: <span className="text-slate-900">{paymentConfig.payeeName}</span>
                      </div>
                    )}

                    {paymentConfig.upiId && (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                          UPI ID: {paymentConfig.upiId}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(paymentConfig.upiId || "", "upi")}
                          className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                          title="Copy UPI ID"
                        >
                          {copiedKey === "upi" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    )}

                    <div className="font-heading font-black text-base text-slate-900">
                      Scan to Pay <span className="text-emerald-700">{formatINR(activeTotal)}</span>
                      {activeOrderNumber && (
                        <span className="block text-[11px] font-mono font-normal text-slate-500 mt-0.5">
                          Order Ref: {activeOrderNumber}
                        </span>
                      )}
                    </div>

                    {paymentConfig.paymentNote && (
                      <p className="text-[11px] text-slate-500 mt-2 max-w-md mx-auto">
                        {paymentConfig.paymentNote}
                      </p>
                    )}
                  </div>
                )}

                {paymentMode === "BANK_TRANSFER" && (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
                    <div className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                      Official Corporate Bank Account:
                    </div>
                    <div className="space-y-2 font-mono text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500">Beneficiary:</span>
                        <span className="font-bold text-slate-900">{paymentConfig.accountName || "—"}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500">Account No:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{paymentConfig.accountNumber || "—"}</span>
                          {paymentConfig.accountNumber && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(paymentConfig.accountNumber || "", "acct")}
                              className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                            >
                              {copiedKey === "acct" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500">Bank & IFSC:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {paymentConfig.bankName || "—"} · {paymentConfig.ifsc || "—"}
                          </span>
                          {paymentConfig.ifsc && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(paymentConfig.ifsc || "", "ifsc")}
                              className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                            >
                              {copiedKey === "ifsc" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500">Branch:</span>
                        <span className="text-slate-800">{paymentConfig.branch || "—"}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-sans">
                      <span className="font-bold text-slate-700">Total Payable:</span>
                      <span className="font-heading font-black text-sm text-emerald-700">{formatINR(activeTotal)}</span>
                    </div>
                    {activeOrderNumber && (
                      <div className="text-[11px] font-mono text-slate-500 text-right">
                        Order Ref: {activeOrderNumber}
                      </div>
                    )}

                    {paymentConfig.paymentNote && (
                      <p className="text-[11px] text-slate-500 mt-2">
                        {paymentConfig.paymentNote}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* UTR Input Field */}
            <div className="space-y-1.5 pt-2">
              <label className="font-bold text-slate-900 text-xs block">
                UTR / Bank Transaction Reference Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 405629184712 or UTR12345678"
                value={form.utrNumber}
                onChange={(e) => handleFieldChange("utrNumber", e.target.value.toUpperCase())}
                className={`w-full px-3.5 py-3 rounded-xl bg-slate-50 border uppercase font-mono text-xs font-bold transition-all focus:outline-none ${
                  errors.utrNumber ? "border-red-500 bg-red-50/20" : "border-slate-300 focus:border-unitech-red"
                }`}
              />
              {errors.utrNumber ? (
                <p className="text-red-600 text-[11px] font-semibold">⚠️ {errors.utrNumber}</p>
              ) : (
                <p className="text-slate-400 text-[11px]">
                  Found in your banking app after completing the payment (usually 12 digits for UPI, or 16+ for NEFT).
                </p>
              )}
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={isProcessing || !draftOrder}
              className="w-full py-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Order to Factory...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Place Order & Submit UTR Reference ({formatINR(activeTotal)})</span>
                </>
              )}
            </button>

            <button
              onClick={() => setStep("DETAILS")}
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 text-center cursor-pointer"
            >
              ← Back to Dispatch Address
            </button>
          </div>
        )}

        {step === "CONFIRMED" && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs text-center space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <span className="text-[10px] font-mono uppercase font-bold text-amber-700 tracking-wider">
              Order Placed · Payment Verification Pending
            </span>

            <h2 className="font-heading font-black text-3xl text-slate-900">
              Order Received!
            </h2>

            <p className="font-mono text-xs text-slate-700 font-bold">
              Order Ref: {activeOrderNumber}
            </p>
            <p className="font-mono text-[11px] text-slate-500">
              Submitted UTR: {confirmedUtr}
            </p>

            <p className="text-xs text-slate-600 leading-relaxed">
              Our team will verify your payment against our bank statement within business hours. A confirmation email will be sent to <span className="font-bold text-slate-900">{form.email}</span> once verified. Please keep your order reference for any queries.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Amount:</span>
                <span className="font-bold text-slate-900">{formatINR(activeTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact email:</span>
                <span className="font-bold text-slate-900">{form.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GSTIN:</span>
                <span className="font-bold text-slate-900">{form.gstin || "B2C Consumer"}</span>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
            >
              Return to Catalog
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
