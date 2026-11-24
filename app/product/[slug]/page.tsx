"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Product } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Navbar } from "@/components/store/Navbar";
import { Footer } from "@/components/store/Footer";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { ProductGallery } from "@/components/store/ProductGallery";
import {
  ShieldCheck,
  FileDown,
  ShoppingBag,
  MessageCircle,
  Truck,
  Receipt,
  Star,
  CheckCircle2,
  Cpu,
  Cable,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || "";
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  const findProductInList = (list: Product[], key: string): Product | null => {
    if (!key || !Array.isArray(list)) return null;
    const lower = key.toLowerCase();
    return (
      list.find(
        (p) =>
          p.slug.toLowerCase() === lower ||
          p.id.toLowerCase() === lower ||
          (p.modelCode && p.modelCode.toLowerCase() === lower)
      ) || null
    );
  };

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLengthIndex, setSelectedLengthIndex] = useState<number>(0);

  const cableOptions = product?.cableLengths && product.cableLengths.length > 0
    ? product.cableLengths
    : product?.category === "cables"
    ? [
        { label: "90 Yards / 90m Roll (Standard Coil)", priceDelta: 0 },
        { label: "180 Yards / 180m Roll (Double Coil)", priceDelta: Math.round((product?.price || 1500) * 0.85) },
        { label: "305 Meters / 1000ft (Full Drum Box)", priceDelta: Math.round((product?.price || 1500) * 1.9) },
      ]
    : [];

  const selectedLengthDelta = product?.category === "cables" && cableOptions[selectedLengthIndex]
    ? cableOptions[selectedLengthIndex].priceDelta
    : 0;

  const currentPrice = (product?.price || 0) + selectedLengthDelta;
  const currentDealerPrice = product?.dealerPrice
    ? product.dealerPrice + selectedLengthDelta
    : Math.round(currentPrice * 0.75);
  const currentTier2Price = product?.tier2Price
    ? product.tier2Price + selectedLengthDelta
    : Math.round(currentPrice * 0.85);
  const currentMrp = product?.mrp
    ? product.mrp + selectedLengthDelta
    : Math.max(Math.round(currentPrice * 1.4), currentPrice + 500);
  const currentSelectedLengthLabel = cableOptions[selectedLengthIndex]?.label;

  // Interactive B2B Wholesale Tier State
  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(0);

  const tier2DiscountPercent = currentMrp > 0 ? Math.round(((currentMrp - currentTier2Price) / currentMrp) * 100) : 15;
  const dealerDiscountPercent = currentMrp > 0 ? Math.round(((currentMrp - currentDealerPrice) / currentMrp) * 100) : 25;

  const tiers = [
    {
      id: "tier-1",
      label: "1 - 9 Units",
      rangeName: "Standard / Sample",
      unitPrice: currentPrice,
      minQty: 1,
      discountLabel: "Standard Base Rate",
      discountBadge: "Standard Sample",
      isBestValue: false,
    },
    {
      id: "tier-2",
      label: "10 - 49 Units",
      rangeName: "Wholesale Tier",
      unitPrice: currentTier2Price,
      minQty: 10,
      discountLabel: `Save ${tier2DiscountPercent}% Wholesale`,
      discountBadge: "Wholesale Tier",
      isBestValue: false,
    },
    {
      id: "tier-3",
      label: "50+ Dealer Tier",
      rangeName: "Authorized Dealer",
      unitPrice: currentDealerPrice,
      minQty: 50,
      discountLabel: `Save ${dealerDiscountPercent}% Factory Direct`,
      discountBadge: "Direct Dealer Rate",
      isBestValue: true,
    },
  ];

  const activeTier = tiers[selectedTierIndex] || tiers[0];
  const activeUnitPrice = activeTier.unitPrice;
  const activeBatchTotal = activeTier.unitPrice * activeTier.minQty;
  const activeBatchGst = Math.round(activeBatchTotal * 0.18);
  const activeBatchGrandTotal = activeBatchTotal + activeBatchGst;

  // Structured B2B WhatsApp inquiry with exact tier details
  const whatsappInquiryUrl = React.useMemo(() => {
    if (!product) return "";
    const msg = 
`🏭 *UNITECH HARDWARE B2B QUOTATION INQUIRY*
━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 *Product:* ${product.name}
🔢 *Model Code:* ${product.modelCode}
📂 *Category:* ${product.categoryLabel}
${product.category === "cables" && currentSelectedLengthLabel ? `📏 *Coil Length:* ${currentSelectedLengthLabel}\n` : ""}🏷️ *Selected B2B Tier:* ${activeTier.label} (${activeTier.rangeName})
💰 *Factory Unit Rate:* ${formatINR(activeTier.unitPrice)} + 18% GST (${activeTier.discountLabel})
📊 *Target Order Qty:* ${activeTier.minQty} Units
💵 *Estimated Batch Total:* ${formatINR(activeBatchTotal)} (+ 18% GST = ${formatINR(activeBatchGrandTotal)})

📍 *Delivery Requirement:* Direct Dispatch from Sahibabad Industrial Area Plant
🛡️ *GST Invoicing:* 18% Input Tax Credit (ITC) required

Hello Unitech Sales Desk, please confirm immediate factory availability and share the formal Proforma Invoice with dispatch timeline.`;

    return `https://wa.me/918700317239?text=${encodeURIComponent(msg)}`;
  }, [product, currentSelectedLengthLabel, activeTier, activeBatchTotal, activeBatchGrandTotal]);

  useEffect(() => {
    if (!slug) return;

    const syncFromStorage = () => {
      try {
        const saved = localStorage.getItem("unitech_admin_products");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const found = findProductInList(parsed, slug);
            if (found) setProduct(found);
          }
        }
      } catch {}
    };

    // 1. Initial sync from localStorage (instant 0ms response)
    syncFromStorage();
    window.addEventListener("storage", syncFromStorage);

    // 2. Fetch latest live spec & inventory from backend
    fetch(`/api/products?slug=${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setProduct(json.data);
          try {
            const saved = localStorage.getItem("unitech_admin_products");
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) {
                const updatedList = parsed.map((p: any) => (p.id === json.data.id ? json.data : p));
                localStorage.setItem("unitech_admin_products", JSON.stringify(updatedList));
              }
            }
          } catch {}
        }
      })
      .catch((err) => console.warn("[ProductDetail fetch error]:", err))
      .finally(() => setLoading(false));

    return () => window.removeEventListener("storage", syncFromStorage);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex flex-col justify-between">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full animate-pulse space-y-8">
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-square bg-slate-200 rounded-2xl" />
            <div className="space-y-6">
              <div className="h-8 w-3/4 bg-slate-200 rounded" />
              <div className="h-4 w-1/2 bg-slate-200 rounded" />
              <div className="h-10 w-1/3 bg-slate-200 rounded" />
              <div className="h-28 bg-slate-200 rounded-xl" />
              <div className="h-12 w-full bg-slate-200 rounded-lg" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex flex-col justify-between">
        <Navbar />
        <div className="text-center py-24 space-y-4">
          <h2 className="font-heading font-black text-2xl text-slate-900">Product Not Found</h2>
          <p className="text-xs text-slate-500">The requested surveillance model does not exist.</p>
          <Link href="/catalogue" className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold">
            Back to Catalogue
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const getPlaceholderType = (cat: string) => {
    if (cat === "cctv-cameras") return "camera";
    if (cat === "dvr-nvr") return "dvr";
    if (cat === "cables") return "cable";
    if (cat === "network-racks") return "rack";
    return "camera";
  };

  const handleAddToCart = () => {
    if (!product) return;
    try {
      const raw = localStorage.getItem("unitech_cart");
      const cart = raw ? JSON.parse(raw) : [];
      const itemKey = `${product.id}-${activeTier.id}${currentSelectedLengthLabel ? `-${currentSelectedLengthLabel}` : ""}`;
      const existingIdx = cart.findIndex((item: any) => item.id === itemKey);
      if (existingIdx !== -1) {
        cart[existingIdx].quantity += activeTier.minQty;
      } else {
        cart.push({
          id: itemKey,
          productId: product.id,
          name: product.name + (product.category === "cables" && currentSelectedLengthLabel ? ` (${currentSelectedLengthLabel})` : ""),
          modelCode: product.modelCode,
          price: activeTier.unitPrice,
          quantity: activeTier.minQty,
          selectedTier: activeTier.label,
          tierBadge: activeTier.discountBadge,
          imageUrl: product.imageUrl,
        });
      }
      localStorage.setItem("unitech_cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("storage"));
      setIsAddedToCart(true);
      setTimeout(() => setIsAddedToCart(false), 2500);
    } catch (e) {
      console.error("[PDP handleAddToCart Error]:", e);
    }
  };

  const trustCardsElement = (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3 text-center text-xs">
      <div className="p-3 sm:p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
        <Truck className="w-4 h-4 text-unitech-red mx-auto mb-1.5" />
        <span className="font-bold text-slate-800 block text-xs">Pan-India</span>
        <span className="text-[10px] text-slate-500">From Sahibabad</span>
      </div>
      <div className="p-3 sm:p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
        <Receipt className="w-4 h-4 text-emerald-600 mx-auto mb-1.5" />
        <span className="font-bold text-slate-800 block text-xs">GST Invoice</span>
        <span className="text-[10px] text-slate-500">Full ITC claim</span>
      </div>
      <div className="p-3 sm:p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
        <ShieldCheck className="w-4 h-4 text-slate-700 mx-auto mb-1.5" />
        <span className="font-bold text-slate-800 block text-xs">BIS & CE</span>
        <span className="text-[10px] text-slate-500">GeM OEM</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col">
      <Navbar />

      {/* Breadcrumb Strip - Full Width Container */}
      <div className="bg-white border-b border-slate-200/80 py-3.5 sm:py-4">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/catalogue" className="hover:text-slate-900 transition-colors">Products</Link>
          <span>/</span>
          <span className="text-slate-400">{product.categoryLabel}</span>
          <span>/</span>
          <span className="text-slate-900 font-bold truncate">{product.name}</span>
        </div>
      </div>

      {/* Main PDP Container - Full Width Edge-to-Edge */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-10 flex-1 pb-24 md:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-start">
          {/* Left Column: Product Studio Showcase */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-5">
            <div className="bg-white p-5 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                  {product.modelCode}
                </span>
                {product.stockQuantity > 0 ? (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
                    In Stock · {product.stockQuantity} Units Ready
                  </span>
                ) : (
                  <span className="text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                    Out of Stock · Factory Lead Time 3-5 Days
                  </span>
                )}
              </div>

              {/* Multi-Image Interactive Product Gallery */}
              <ProductGallery product={product} />
            </div>

            {/* Quick Badges Strip on Desktop (≥ 1024px) */}
            <div className="hidden lg:block">
              {trustCardsElement}
            </div>
          </div>

          {/* Right Column: Specifications & Purchasing Tiers */}
          <div className="lg:col-span-6 space-y-5 sm:space-y-6">
            <div>
              <span className="text-xs uppercase font-extrabold text-unitech-red tracking-wider">
                {product.categoryLabel}
              </span>
              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 mt-1.5 tracking-tight leading-tight">
                {product.name}
              </h1>

              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-semibold text-slate-600">
                <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px] font-bold">
                  ✓ OEM Factory Direct
                </span>
                <span className="text-slate-300">·</span>
                <span>BIS & CE Certified</span>
                <span className="text-slate-300">·</span>
                <span>Sahibabad Plant Dispatch</span>
              </div>
            </div>

            {/* Cable Length Dropdown with Dynamic Cost (When category is Cables) */}
            {product.category === "cables" && cableOptions.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-amber-50/80 border border-amber-200/90 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label htmlFor="cable-length-select" className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Cable className="w-4 h-4 text-amber-700" />
                    <span>Select Wiring Length / Coil Size:</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-200">
                    Dynamic Cost Active
                  </span>
                </div>
                <select
                  id="cable-length-select"
                  value={selectedLengthIndex}
                  onChange={(e) => setSelectedLengthIndex(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-unitech-red/30 shadow-2xs cursor-pointer"
                >
                  {cableOptions.map((opt, idx) => (
                    <option key={idx} value={idx}>
                      {opt.label} {opt.priceDelta > 0 ? `(+${formatINR(opt.priceDelta)})` : "(Base Price)"}
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium pt-0.5">
                  <span>Selected Option: <strong>{currentSelectedLengthLabel}</strong></span>
                  <span className="text-emerald-700 font-bold">
                    {selectedLengthDelta > 0 ? `+${formatINR(selectedLengthDelta)} per unit` : "Standard Base Rate"}
                  </span>
                </div>
              </div>
            )}

            {/* Price Box */}
            <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">
                      Factory Unit Rate {product.category === "cables" && `(${currentSelectedLengthLabel?.split(" ")[0]}m)`}
                    </span>
                    {activeTier.minQty > 1 && (
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {activeTier.discountLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-heading text-3xl sm:text-4xl font-black text-slate-950">
                      {formatINR(activeUnitPrice)}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-500 font-semibold">+ 18% GST / unit</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs sm:text-sm text-slate-400 line-through font-bold">
                    MSRP: {formatINR(currentMrp)}
                  </span>
                  <div className="text-xs font-bold text-emerald-700 mt-0.5">
                    {selectedTierIndex === 2
                      ? "Dealer Tier · Save 48% off MSRP"
                      : selectedTierIndex === 1
                      ? "Wholesale · Save 42% off MSRP"
                      : "Direct Factory · Save 34%"}
                  </div>
                </div>
              </div>

              {/* B2B Wholesale Tier Table (Interactive Selectable Buttons) */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-unitech-red animate-pulse" />
                    <span>B2B Wholesale Tier Pricing (Select Volume):</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-unitech-red bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                    {activeTier.discountLabel}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs" role="radiogroup" aria-label="Wholesale pricing tiers">
                  {tiers.map((tier, idx) => {
                    const isSelected = selectedTierIndex === idx;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setSelectedTierIndex(idx)}
                        role="radio"
                        aria-checked={isSelected}
                        className={`group relative p-2.5 sm:p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer focus:outline-none ${
                          isSelected
                            ? "bg-white border-unitech-red shadow-sm ring-2 ring-unitech-red/25 -translate-y-0.5"
                            : "bg-slate-50 hover:bg-white border-slate-200/90 hover:border-slate-300"
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-unitech-red text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow-2xs whitespace-nowrap">
                            Selected
                          </span>
                        )}
                        <span className={`block text-[10px] sm:text-[11px] font-bold transition-colors ${
                          isSelected ? "text-unitech-red font-black" : "text-slate-600"
                        }`}>
                          {tier.label}
                        </span>
                        <span className={`font-black text-xs sm:text-sm mt-1 block transition-colors ${
                          isSelected ? "text-slate-950 font-heading" : "text-slate-800"
                        }`}>
                          {formatINR(tier.unitPrice)}
                        </span>
                        <span className="block text-[9px] text-slate-400 font-mono mt-0.5">
                          {tier.minQty === 1 ? "Sample Rate" : `Min ${tier.minQty} pcs`}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-2 px-1">
                  <span>Batch Estimate ({activeTier.minQty} pcs): <strong className="text-slate-900 font-mono">{formatINR(activeBatchTotal)}</strong> + GST</span>
                  <span className="text-emerald-700 font-bold">{activeTier.rangeName}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="py-3.5 px-6 rounded-full bg-unitech-red hover:bg-unitech-darkred text-white text-xs sm:text-sm font-bold transition-all shadow-[0_4px_16px_rgba(230,0,0,0.3)] hover:shadow-[0_6px_20px_rgba(230,0,0,0.4)] hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {isAddedToCart
                      ? `✓ Added ${activeTier.minQty} Units to Cart!`
                      : `Add ${activeTier.minQty} Units (${activeTier.label})`}
                  </span>
                </button>

                <a
                  href={whatsappInquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3.5 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  title="Forward B2B wholesale quotation inquiry to factory desk on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Bulk Inquiry</span>
                </a>
              </div>
            </div>

            {/* Technical Specification Matrix - Moved directly below Price Box */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-unitech-red" />
                  <h3 className="font-heading font-black text-slate-950 text-sm sm:text-base">
                    Technical Specifications Matrix
                  </h3>
                </div>
                <a
                  href={product.datasheetPdfUrl || "/downloads/unitech-2026-master-catalog.pdf"}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-unitech-red hover:text-unitech-darkred flex items-center gap-1.5 transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download PDF Datasheet</span>
                </a>
              </div>

              <div className="divide-y divide-slate-100 text-xs sm:text-[13px]">
                {Object.entries(product.specs).map(([key, val]) => (
                  <div key={key} className="py-2.5 sm:py-3 grid grid-cols-3 gap-3">
                    <span className="font-bold text-slate-500 col-span-1">{key}</span>
                    <span className="text-slate-900 font-semibold col-span-2">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Engineering Highlights - Positioned directly below Technical Specifications Matrix */}
            {product.highlights && product.highlights.length > 0 && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-heading font-black text-slate-950 text-sm sm:text-base">
                    Engineering Highlights
                  </h3>
                </div>
                <div className={`grid gap-2.5 text-xs sm:text-sm text-slate-700 ${product.highlights.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
                  {product.highlights.map((hl, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 bg-slate-50/70 rounded-xl sm:rounded-2xl border border-slate-200/80">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-[13px] font-medium leading-relaxed">{hl}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Badges Strip on Mobile (< 1024px) */}
            <div className="block lg:hidden pt-1">
              {trustCardsElement}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Add to Cart Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3 md:hidden">
        <div>
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            {product.modelCode} · <span className="text-unitech-red font-bold">{activeTier.label}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-lg font-black text-slate-950">{formatINR(activeUnitPrice)}</span>
            <span className="text-[10px] text-slate-500 font-semibold">+ 18% GST</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={whatsappInquiryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs flex items-center justify-center"
            title="WhatsApp Bulk Inquiry"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={handleAddToCart}
            className="px-4 py-2.5 rounded-full bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold transition-all shadow-md shadow-unitech-red/30 flex items-center gap-1.5 active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isAddedToCart ? "✓ Added!" : `Add (${activeTier.minQty} pcs)`}</span>
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
