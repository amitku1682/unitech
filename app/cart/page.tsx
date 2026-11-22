"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/utils";
import { Navbar } from "@/components/store/Navbar";
import { Footer } from "@/components/store/Footer";
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface StoredCartItem {
  productId: string;
  quantity: number;
}

interface QuotedCartItem {
  id: string;
  productId: string;
  slug: string;
  name: string;
  modelCode: string;
  imageUrl: string;
  currentUnitPrice: number;
  applicablePrice: number;
  quantity: number;
  lineTotal: number;
  pricingType: "standard" | "flash_sale" | "dealer_tier" | "tier2";
  stockAvailable: number;
}

interface CartQuote {
  items: QuotedCartItem[];
  subtotal: number;
  gst: number;
  total: number;
  itemCount: number;
  unavailableItems: Array<{ productId: string; name?: string; message: string }>;
}

export default function CartPage() {
  const [cartRaw, setCartRaw] = useState<StoredCartItem[]>([]);
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [removedAlert, setRemovedAlert] = useState<string | null>(null);

  // 1. Initial cart load from localStorage (normalizing to ONLY productId + quantity)
  useEffect(() => {
    if (typeof window === "undefined") return;
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
    setCartRaw([]);
    setIsLoading(false);
  }, []);

  // 2. Fetch canonical server-side quote whenever raw cart items change
  const fetchQuote = useCallback(async (itemsToQuote: StoredCartItem[]) => {
    if (itemsToQuote.length === 0) {
      setQuote({
        items: [],
        subtotal: 0,
        gst: 0,
        total: 0,
        itemCount: 0,
        unavailableItems: [],
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/cart/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToQuote }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        const quoteData: CartQuote = json.data;

        // If server reported unavailable items, remove them from localStorage
        if (quoteData.unavailableItems && quoteData.unavailableItems.length > 0) {
          const unavailIds = new Set(quoteData.unavailableItems.map((u) => u.productId));
          const cleaned = itemsToQuote.filter((item) => !unavailIds.has(item.productId));

          setCartRaw(cleaned);
          localStorage.setItem("unitech_cart", JSON.stringify(cleaned));
          window.dispatchEvent(new Event("storage"));

          const messages = quoteData.unavailableItems.map((u) => u.message).join(" ");
          setRemovedAlert(messages);
        }

        setQuote(quoteData);
      }
    } catch (err) {
      console.error("[Cart Quote Fetch Error]:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cartRaw.length > 0) {
      fetchQuote(cartRaw);
    } else {
      setQuote(null);
      setIsLoading(false);
    }
  }, [cartRaw, fetchQuote]);

  // Save changes to localStorage and refresh quote
  const handleUpdateRawCart = (newItems: StoredCartItem[]) => {
    setCartRaw(newItems);
    try {
      localStorage.setItem("unitech_cart", JSON.stringify(newItems));
      window.dispatchEvent(new Event("storage"));
    } catch { }
  };

  const updateQuantity = (productId: string, delta: number) => {
    const updated = cartRaw
      .map((item) =>
        item.productId === productId ? { ...item, quantity: item.quantity + delta } : item
      )
      .filter((item) => item.quantity > 0);
    handleUpdateRawCart(updated);
  };

  const removeItem = (productId: string) => {
    const updated = cartRaw.filter((item) => item.productId !== productId);
    handleUpdateRawCart(updated);
  };

  const items = quote?.items || [];
  const subtotal = quote?.subtotal || 0;
  const gst18 = quote?.gst || 0;
  const total = quote?.total || 0;
  const totalItemCount = quote?.itemCount || 0;

  // Context-rich BOM invoice WhatsApp message
  const cartWhatsAppMessage = React.useMemo(() => {
    if (items.length === 0) return "";
    const itemsList = items
      .map(
        (item: QuotedCartItem, idx: number) =>
          `${idx + 1}. *${item.name}* (${item.modelCode || "UT-MODEL"})${
            item.pricingType !== "standard" ? `\n   • Discount: ${item.pricingType.replace("_", " ").toUpperCase()}` : ""
          }\n   • Qty: ${item.quantity} pcs × ${formatINR(item.applicablePrice)} = ${formatINR(item.lineTotal)}`
      )
      .join("\n\n");

    const msg =
`📋 *UNITECH OFFICIAL PROFORMA INVOICE REQUEST*
━━━━━━━━━━━━━━━━━━━━━━━━━━
*Items in Hardware Quote Cart:*

${itemsList}

━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 *Subtotal:* ${formatINR(subtotal)}
🏛️ *GST 18% (100% ITC Claimable):* ${formatINR(gst18)}
⭐ *Grand Total (All Taxes Incl.):* ${formatINR(total)}

📍 *Dispatch Facility:* Sahibabad Industrial Area Plant
🛡️ *Warranty:* 2-Year Direct Factory Replacement

Hello Unitech Sales Desk, please issue an official GST Proforma Invoice in our company name with factory bank account details for RTGS/NEFT payment.`;

    return encodeURIComponent(msg);
  }, [items, subtotal, gst18, total]);

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col">
      <Navbar cartCount={totalItemCount} />

      {/* Breadcrumb Strip */}
      <div className="bg-white border-b border-slate-200/80 py-3.5">
        <div className="w-full px-5 sm:px-6 lg:px-8 xl:px-10 flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Shopping & Quote Cart</span>
        </div>
      </div>

      <div className="w-full px-5 sm:px-6 lg:px-8 xl:px-10 py-8 sm:py-10 flex-1">
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-10 h-10 rounded-2xl bg-unitech-red/10 border border-unitech-red/20 flex items-center justify-center text-unitech-red shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">
                Hardware Quote Cart
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {items.length} {items.length === 1 ? "Item" : "Items"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Factory-direct pricing with Indian 18% GST input tax credit and verified dealer wholesale tiers.
            </p>
          </div>
        </div>

        {removedAlert && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{removedAlert}</span>
            </div>
            <button
              onClick={() => setRemovedAlert(null)}
              className="text-amber-600 hover:text-amber-900 font-bold text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {isLoading && !quote ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
            <Loader2 className="w-8 h-8 text-unitech-red animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Calculating verified factory quotation...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 sm:py-24 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-4 max-w-lg mx-auto">
            <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto" />
            <h2 className="font-heading font-black text-lg sm:text-xl text-slate-900">
              Your quote cart is empty
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Explore our factory catalogue of 4MP Warm Light cameras, hybrid DVRs, or use the 60-second kit builder.
            </p>
            <Link
              href="/catalogue"
              className="inline-flex px-6 py-3 rounded-full bg-unitech-red text-white text-xs font-bold hover:bg-unitech-darkred transition-colors shadow-xs"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-start">
            {/* Left Items Table */}
            <div className="lg:col-span-8 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 lg:p-8 border border-slate-200/90 shadow-xs space-y-4">
              <div className="hidden sm:grid grid-cols-12 text-xs font-bold text-slate-400 pb-3 border-b border-slate-100 uppercase tracking-wider">
                <span className="col-span-6">Hardware Product</span>
                <span className="col-span-2 text-center">Unit Price</span>
                <span className="col-span-2 text-center">Quantity</span>
                <span className="col-span-2 text-right">Subtotal</span>
              </div>

              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <div key={item.id} className="py-4 sm:py-5">
                    {/* Mobile Compact Card View (< sm) */}
                    <div className="sm:hidden space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 min-w-[64px] min-h-[64px] rounded-xl bg-slate-50 border border-slate-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain mix-blend-multiply"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase block">
                                {item.modelCode}
                              </span>
                              {item.pricingType !== "standard" && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                                  {item.pricingType.replace("_", " ")}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => removeItem(item.productId)}
                              className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-unitech-red -mt-2 -mr-2 shrink-0 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <h3 className="font-heading font-bold text-xs text-slate-900 line-clamp-2 mt-0.5">
                            {item.name}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50/80 shadow-2xs overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.productId, -1)}
                            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-600 hover:text-slate-950 font-bold text-base active:bg-slate-200 transition-colors cursor-pointer"
                          >
                            −
                          </button>
                          <span className="font-bold text-slate-900 min-w-[28px] text-center text-sm px-1">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, 1)}
                            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-600 hover:text-slate-950 font-bold text-base active:bg-slate-200 transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-slate-500 block font-medium">
                            {formatINR(item.applicablePrice)} each
                          </span>
                          <span className="font-heading font-black text-slate-950 text-base">
                            {formatINR(item.lineTotal)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Grid View (>= sm) */}
                    <div className="hidden sm:grid sm:grid-cols-12 gap-4 items-center text-xs">
                      <div className="col-span-6 flex items-center gap-3">
                        <div className="w-16 h-16 min-w-[64px] min-h-[64px] rounded-xl bg-slate-50 border border-slate-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain mix-blend-multiply"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-mono font-bold text-slate-500 block uppercase">
                              {item.modelCode}
                            </span>
                            {item.pricingType !== "standard" && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                                {item.pricingType.replace("_", " ")}
                              </span>
                            )}
                          </div>
                          <h3 className="font-heading font-bold text-sm text-slate-950 truncate">
                            {item.name}
                          </h3>
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="text-[11px] text-slate-400 hover:text-unitech-red font-semibold flex items-center gap-1 mt-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove item</span>
                          </button>
                        </div>
                      </div>

                      <div className="col-span-2 text-center font-bold text-slate-700 text-sm">
                        {formatINR(item.applicablePrice)}
                      </div>

                      <div className="col-span-2 flex items-center justify-center">
                        <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50/80 shadow-2xs overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.productId, -1)}
                            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-600 hover:text-slate-950 font-bold text-base active:bg-slate-200 transition-colors cursor-pointer"
                          >
                            −
                          </button>
                          <span className="font-bold text-slate-900 min-w-[28px] text-center text-sm px-1">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, 1)}
                            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-600 hover:text-slate-950 font-bold text-base active:bg-slate-200 transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="col-span-2 text-right font-heading font-black text-slate-950 text-base">
                        {formatINR(item.lineTotal)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                <Link
                  href="/catalogue"
                  className="font-bold text-slate-700 hover:text-unitech-red flex items-center gap-1.5 transition-colors"
                >
                  <span>← Continue Shopping</span>
                </Link>

                <button
                  onClick={() => handleUpdateRawCart([])}
                  className="font-semibold text-slate-400 hover:text-unitech-red transition-colors cursor-pointer"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Right Summary Card */}
            <div className="lg:col-span-4 bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4 sticky top-24">
              <h2 className="font-heading font-black text-base sm:text-lg text-slate-950 pb-3 border-b border-slate-100">
                Invoice Breakdown
              </h2>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Hardware Subtotal:</span>
                  <span className="font-bold text-slate-800">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (18% Input Tax Credit):</span>
                  <span className="font-bold text-slate-800">{formatINR(gst18)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Pan-India Factory Dispatch:</span>
                  <span className="text-emerald-700 font-bold">Free Shipping</span>
                </div>

                <div className="border-t border-slate-200 pt-3.5 flex justify-between items-baseline">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Total Payable
                    </span>
                    <span className="font-heading text-2xl sm:text-3xl font-black text-slate-950">
                      {formatINR(total)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">Incl. All Taxes</span>
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <Link
                  href="/checkout"
                  className="w-full py-3.5 rounded-full bg-unitech-red hover:bg-unitech-darkred text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-unitech-red/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href={`https://wa.me/918700317239?text=${cartWhatsAppMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  title="Forward complete BOM itemized quotation to factory sales desk on WhatsApp"
                >
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>Request Official GST PDF Invoice</span>
                </a>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 text-center pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>GST Invoicing · 2-Year Replacement Warranty</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
