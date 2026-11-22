"use client";

import React, { useState, useEffect, useRef } from "react";
import { ProductSaleSlideData, HeroSlideCard } from "@/lib/types";
import {
  DEFAULT_PRODUCT_SALE_SLIDE,
  HeroProductSaleSlide,
} from "@/components/store/HeroProductSaleSlide";
import {
  Sparkles,
  Save,
  Globe,
  Upload,
  Lock,
  Layers,
  Tag,
  DollarSign,
  Package,
  Calendar,
  ExternalLink,
  RotateCcw,
  RefreshCw,
  Camera,
  Archive,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
} from "lucide-react";

interface HeroProductSaleEditorProps {
  onNotify?: (message: string, isError?: boolean) => void;
}

export interface Card3OfferItem {
  id: "cable" | "camera" | "dvr" | "power";
  category: string;
  discount: string;
  name: string;
  price: string;
  mrp: string;
  image: string;
  alt: string;
  href: string;
  showGst?: boolean;
}

export const DEFAULT_CARD3_OFFER_ITEMS: Card3OfferItem[] = [
  {
    id: "cable",
    category: "CABLES · BESTSELLER",
    discount: "Up to 60% off",
    name: "3+1 CCTV Cable · 90 m",
    price: "₹999",
    mrp: "₹2,499",
    showGst: true,
    image: "/images/products/90y-tight.png",
    alt: "Unitech 3+1 CCTV cable roll",
    href: "/catalogue?category=cables",
  },
  {
    id: "camera",
    category: "CAMERAS",
    discount: "30% off",
    name: "4MP Warm-Light Bullet",
    price: "₹2,999",
    mrp: "₹4,299",
    image: "/images/products/utipbcp-4101.png",
    alt: "Unitech 4MP warm-light bullet camera",
    href: "/catalogue?category=cctv-cameras",
  },
  {
    id: "dvr",
    category: "RECORDERS",
    discount: "25% off",
    name: "H.265 Hybrid DVR",
    price: "₹2,600",
    mrp: "₹3,470",
    image: "/images/products/utnr-832-tight.png",
    alt: "Unitech H.265 hybrid DVR",
    href: "/catalogue?category=dvrs-nvrs",
  },
  {
    id: "power",
    category: "POWER",
    discount: "35% off",
    name: "12V 10A SMPS",
    price: "₹1,340",
    mrp: "₹2,060",
    image: "/images/products/utpsp-016.png",
    alt: "Unitech 12V SMPS power supply",
    href: "/catalogue?category=power-supplies",
  },
];

interface StandardHeroCardState {
  id: string;
  badgeTag: string;
  badgeLabel: string;
  headlineLine1: string;
  headlineLine2: string;
  description: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  specs: { label: string; value: string }[];
  imageUrl: string;
  productName: string;
  offerGridItems?: Card3OfferItem[];
}

const DEFAULT_STANDARD_CARDS: Record<string, StandardHeroCardState> = {
  "slide-cameras": {
    id: "slide-cameras",
    badgeTag: "NEW",
    badgeLabel: "Warm-light colour cameras",
    headlineLine1: "See every detail,",
    headlineLine2: "day and night.",
    description:
      "4MP & 8MP HD and IP cameras with 3.6 mm lens and H.265 recording — up to 32 channels on one recorder.",
    primaryCtaText: "Shop cameras",
    primaryCtaLink: "/catalogue?category=cctv-cameras",
    secondaryCtaText: "Get best price",
    secondaryCtaLink: "/inquiry?type=PRODUCT_QUOTE",
    productName: "Unitech 4MP/8MP Warm-Light Cameras",
    imageUrl: "",
    specs: [
      { label: "RESOLUTION", value: "4K & 8MP Ultra HD" },
      { label: "NIGHT OPTICS", value: "F1.0 Full-Color Starlight" },
      { label: "ILLUMINATION", value: "30m Warm LED Matrix" },
      { label: "PROTECTION", value: "IP67 Weatherproof Alloy" },
    ],
  },
  "slide-rack": {
    id: "slide-rack",
    badgeTag: "NEW MODEL",
    badgeLabel: "Launched this season",
    headlineLine1: "6U Folding Rack.",
    headlineLine2: "Neat, secure installs.",
    description:
      "Wall-mount network rack with glass front door and key lock — a tidy home for DVRs, NVRs, switches and patch panels.",
    primaryCtaText: "View 6U rack",
    primaryCtaLink: "/catalogue?category=network-racks",
    secondaryCtaText: "Get a quote",
    secondaryCtaLink: "/inquiry?type=DISTRIBUTOR",
    productName: "Unitech 6U Folding Network Rack",
    imageUrl: "/images/products/utr-1006.png",
    specs: [
      { label: "FORM FACTOR", value: "6U 19-Inch Standard" },
      { label: "LOAD CAPACITY", value: "60 Kg Tested Safe Load" },
      { label: "FRONT DOOR", value: "Toughened Tinted Glass" },
      { label: "SECURITY", value: "Dual Cam Key Safety Lock" },
    ],
  },
  "slide-sale": {
    id: "slide-sale",
    badgeTag: "SALE",
    badgeLabel: "Limited-time offer",
    headlineLine1: "Up to 60% off",
    headlineLine2: "cables, cameras & power.",
    description:
      "Stock up on CCTV cable, cameras, DVRs and power supplies at factory-direct prices while the offer lasts.",
    primaryCtaText: "Shop the sale",
    primaryCtaLink: "/catalogue",
    secondaryCtaText: "Get price",
    secondaryCtaLink: "/inquiry",
    productName: "CCTV Cable, Cameras & Power Wholesale",
    imageUrl: "/images/products/90y-tight.png",
    specs: [
      { label: "CONDUCTOR", value: "100% Solid Annealed Copper" },
      { label: "DISPATCH SLA", value: "24-48 Hr Pan-India Express" },
      { label: "TAX BENEFIT", value: "18% GST Full ITC Claim" },
      { label: "PRICING TIER", value: "Direct Factory Wholesale Rate" },
    ],
    offerGridItems: DEFAULT_CARD3_OFFER_ITEMS,
  },
};

export function HeroProductSaleEditor({ onNotify }: HeroProductSaleEditorProps) {
  const [activeCardId, setActiveCardId] = useState<string>("slide-cameras");
  const [standardCards, setStandardCards] = useState<Record<string, StandardHeroCardState>>(DEFAULT_STANDARD_CARDS);
  const [slideData, setSlideData] = useState<ProductSaleSlideData>(DEFAULT_PRODUCT_SALE_SLIDE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load all 4 cards from PostgreSQL hero-slides API
  useEffect(() => {
    let isMounted = true;

    fetch("/api/hero-slides", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted || !json.success || !Array.isArray(json.data)) return;

        const updatedCards = { ...DEFAULT_STANDARD_CARDS };

        for (const row of json.data) {
          if (row.id in updatedCards) {
            const headlineStr = Array.isArray(row.headline)
              ? row.headline.join("\n")
              : String(row.headline || "");
            const parts = headlineStr.split("\n");

            const specs = Array.isArray(row.specs)
              ? row.specs.map((s: any) => ({
                  label: s.label || "",
                  value: s.value || s.detail || "",
                }))
              : updatedCards[row.id].specs;

            let offerGridItems = updatedCards[row.id].offerGridItems;
            if (row.id === "slide-sale" && Array.isArray(row.schemaDetails) && row.schemaDetails.length > 0) {
              offerGridItems = DEFAULT_CARD3_OFFER_ITEMS.map((def) => {
                const saved = row.schemaDetails.find((s: any) => s && s.id === def.id);
                return saved ? { ...def, ...saved } : def;
              });
            }

            updatedCards[row.id] = {
              ...updatedCards[row.id],
              badgeTag: row.badgeTag || updatedCards[row.id].badgeTag,
              badgeLabel: row.badgeDetail || updatedCards[row.id].badgeLabel,
              headlineLine1: parts[0] || updatedCards[row.id].headlineLine1,
              headlineLine2: parts.slice(1).join(" ") || updatedCards[row.id].headlineLine2,
              description: row.description || updatedCards[row.id].description,
              primaryCtaText: row.primaryCtaText || updatedCards[row.id].primaryCtaText,
              primaryCtaLink: row.primaryCtaLink || updatedCards[row.id].primaryCtaLink,
              secondaryCtaText: (row.id === "slide-sale" && row.secondaryCtaText?.toLowerCase().includes("download"))
                ? "Get price"
                : (row.secondaryCtaText || updatedCards[row.id].secondaryCtaText),
              secondaryCtaLink: (row.id === "slide-sale" && row.secondaryCtaLink?.toLowerCase().includes("download"))
                ? "/inquiry"
                : (row.secondaryCtaLink || updatedCards[row.id].secondaryCtaLink),
              specs: specs.length ? specs : updatedCards[row.id].specs,
              imageUrl: row.imageUrl || updatedCards[row.id].imageUrl,
              productName: row.productName || updatedCards[row.id].productName,
              offerGridItems: offerGridItems || updatedCards[row.id].offerGridItems,
            };
          }

          if (row.type === "product_sale" && row.productSaleData) {
            setSlideData(row.productSaleData);
          }
        }

        setStandardCards(updatedCards);
      })
      .catch((err) => console.warn("[HeroCardsStudio load error]:", err));

    fetch("/api/hero-product-sale", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success && json.data) {
          setSlideData(json.data);
        }
      })
      .catch((err) => console.warn("[HeroProductSale load error]:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const currentStandardCard = standardCards[activeCardId] || DEFAULT_STANDARD_CARDS["slide-cameras"];

  // Update field for active card (Cards 1-3)
  const handleUpdateStandardField = (field: keyof StandardHeroCardState, val: any) => {
    setStandardCards((prev) => ({
      ...prev,
      [activeCardId]: {
        ...prev[activeCardId],
        [field]: val,
      },
    }));
  };

  const handleUpdateStandardSpec = (index: number, key: "label" | "value", val: string) => {
    const specs = [...currentStandardCard.specs];
    if (!specs[index]) specs[index] = { label: "", value: "" };
    specs[index][key] = val;
    handleUpdateStandardField("specs", specs);
  };

  // Upload standardized image (Cards 2, 3, 4)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCard4: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/products/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.fileUrl) {
        if (isCard4) {
          setSlideData((prev) => ({ ...prev, productImage: data.fileUrl }));
        } else {
          handleUpdateStandardField("imageUrl", data.fileUrl);
        }
        onNotify?.(`✓ Image uploaded & normalized via Sharp: ${data.filename}`);
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err: any) {
      console.warn("[Upload Error]:", err);
      onNotify?.(err.message || "Failed to upload image", true);
    } finally {
      setIsUploading(false);
    }
  };

  const [uploadingCard3ItemId, setUploadingCard3ItemId] = useState<string | null>(null);

  const handleUpdateCard3Item = (itemId: string, field: keyof Card3OfferItem, val: any) => {
    setStandardCards((prev) => {
      const items = prev["slide-sale"]?.offerGridItems || DEFAULT_CARD3_OFFER_ITEMS;
      const updated = items.map((it) => (it.id === itemId ? { ...it, [field]: val } : it));
      return {
        ...prev,
        "slide-sale": {
          ...prev["slide-sale"],
          offerGridItems: updated,
        },
      };
    });
  };

  const handleCard3ImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCard3ItemId(itemId);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/products/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.fileUrl) {
        handleUpdateCard3Item(itemId, "image", data.fileUrl);
        onNotify?.(`✓ Image uploaded & normalized via Sharp: ${data.filename}`);
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err: any) {
      console.warn("[Card 3 Upload Error]:", err);
      onNotify?.(err.message || "Failed to upload image", true);
    } finally {
      setUploadingCard3ItemId(null);
    }
  };

  // Save Standard Card (Cards 1, 2, 3) to PostgreSQL
  const handleSaveStandardCard = async () => {
    setIsSaving(true);
    const card = currentStandardCard;
    const headline = card.headlineLine2
      ? `${card.headlineLine1}\n${card.headlineLine2}`
      : card.headlineLine1;

    try {
      const res = await fetch("/api/hero-slides", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: card.id,
          badgeTag: card.badgeTag,
          badgeDetail: card.badgeLabel,
          headline,
          description: card.description,
          primaryCtaText: card.primaryCtaText,
          primaryCtaLink: card.primaryCtaLink,
          secondaryCtaText: card.secondaryCtaText,
          secondaryCtaLink: card.secondaryCtaLink,
          specs: card.specs.map((s) => ({ label: s.label, value: s.value, detail: s.value })),
          imageUrl: card.id === "slide-cameras" ? null : card.imageUrl,
          productName: card.productName,
          schemaDetails: card.id === "slide-sale" ? (card.offerGridItems || DEFAULT_CARD3_OFFER_ITEMS) : undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        onNotify?.(`✓ ${card.badgeLabel} updated in PostgreSQL and live on storefront!`);
      } else {
        throw new Error(json.error || "Save failed");
      }
    } catch (err: any) {
      console.error("[Save Hero Slide Error]:", err);
      onNotify?.(err.message || "Failed to save slide", true);
    } finally {
      setIsSaving(false);
    }
  };

  // Save Card 4 (Product Sale) to PostgreSQL
  const handleSaveCard4 = async (publish: boolean) => {
    setIsSaving(true);
    const updatedSlide: ProductSaleSlideData = {
      ...slideData,
      status: publish ? "published" : "draft",
      updatedAt: new Date().toISOString(),
      updatedBy: "Admin",
    };

    try {
      const res = await fetch("/api/hero-product-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSlide),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSlideData(json.data);
        onNotify?.(
          publish
            ? "✓ Card 4 (Product Sale) published live to PostgreSQL database!"
            : "✓ Card 4 saved as draft."
        );
      } else {
        throw new Error(json.error || "Save failed");
      }
    } catch (err: any) {
      onNotify?.(err.message || "Failed to save Card 4", true);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-unitech-red" />
        Loading All 4 Hero Cards from PostgreSQL Database...
      </div>
    );
  }

  const isCard1 = activeCardId === "slide-cameras";
  const isCard2 = activeCardId === "slide-rack";
  const isCard3 = activeCardId === "slide-sale";
  const isCard4 = activeCardId === "slide-product-sale";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-unitech-red border border-red-200 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Homepage Hero Showcase Studio
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">
              PostgreSQL · ACID Storage
            </span>
          </div>
          <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
            4-Card Homepage Showcase & Promotions
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Manage all 4 cards displayed on the homepage slider. Content & specs are editable for all 4 cards. Images are fully updatable for Cards 2, 3, and 4 (Card 1 image is locked to the interactive NVR live simulation).
          </p>
        </div>
      </div>

      {/* 4 Cards Switcher Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            id: "slide-cameras",
            num: "01/04",
            title: "Warm-light Cameras",
            sub: "Interactive NVR Simulation",
            icon: Camera,
            locked: true,
          },
          {
            id: "slide-rack",
            num: "02/04",
            title: "6U Folding Rack",
            sub: "Updatable Image & Specs",
            icon: Archive,
            locked: false,
          },
          {
            id: "slide-sale",
            num: "03/04",
            title: "Factory Wholesale Sale",
            sub: "Dynamic 5-Card Offer Grid",
            icon: Megaphone,
            locked: false,
          },
          {
            id: "slide-product-sale",
            num: "04/04",
            title: "Product of the Week",
            sub: "Live Countdown & Deal",
            icon: Sparkles,
            locked: false,
          },
        ].map((c) => {
          const Icon = c.icon;
          const isActive = activeCardId === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCardId(c.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? "bg-slate-950 text-white border-slate-950 shadow-md scale-[1.02]"
                  : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  Card {c.num}
                </span>
                <div className="flex items-center gap-1">
                  {c.locked && (
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                      <Lock className="w-3 h-3" /> NVR Sim
                    </span>
                  )}
                  <Icon className={`w-4 h-4 ${isActive ? "text-unitech-red" : "text-slate-400"}`} />
                </div>
              </div>
              <div>
                <div className="font-heading font-black text-sm">{c.title}</div>
                <div className={`text-[11px] mt-0.5 ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                  {c.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ============================================================= */}
      {/* CARD 1, 2, 3 EDITORS (Standard Hero Card Schema)             */}
      {/* ============================================================= */}
      {!isCard4 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-mono font-bold text-slate-400 block mb-0.5">
                Editing Card: {currentStandardCard.id}
              </span>
              <h3 className="font-heading font-black text-xl text-slate-900">
                {currentStandardCard.badgeLabel}
              </h3>
            </div>
            <button
              type="button"
              onClick={handleSaveStandardCard}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-full bg-unitech-red hover:bg-unitech-darkred disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save & Update Database</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs">
            {/* Left Column: Content, Headings & Specs */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Badge Tag *</label>
                  <input
                    type="text"
                    value={currentStandardCard.badgeTag}
                    onChange={(e) => handleUpdateStandardField("badgeTag", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Badge Label *</label>
                  <input
                    type="text"
                    value={currentStandardCard.badgeLabel}
                    onChange={(e) => handleUpdateStandardField("badgeLabel", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Headline (Line 1) *</label>
                  <input
                    type="text"
                    value={currentStandardCard.headlineLine1}
                    onChange={(e) => handleUpdateStandardField("headlineLine1", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Headline (Line 2) *</label>
                  <input
                    type="text"
                    value={currentStandardCard.headlineLine2}
                    onChange={(e) => handleUpdateStandardField("headlineLine2", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description Subtext *</label>
                <textarea
                  rows={2}
                  value={currentStandardCard.description}
                  onChange={(e) => handleUpdateStandardField("description", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                />
              </div>

              {/* 2x2 Specs Grid */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block text-xs">
                  4 Technical Specifications (2×2 Showcase Matrix):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentStandardCard.specs.map((spec, sIdx) => (
                    <div key={sIdx} className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1">
                      <input
                        type="text"
                        placeholder="SPEC LABEL"
                        value={spec.label}
                        onChange={(e) => handleUpdateStandardSpec(sIdx, "label", e.target.value)}
                        className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[10px] font-mono font-bold uppercase text-slate-600"
                      />
                      <input
                        type="text"
                        placeholder="Spec Value"
                        value={spec.value}
                        onChange={(e) => handleUpdateStandardSpec(sIdx, "value", e.target.value)}
                        className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-xs font-bold text-slate-900"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* CTAs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Primary CTA Label & Link</label>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="e.g. Shop cameras"
                      value={currentStandardCard.primaryCtaText}
                      onChange={(e) => handleUpdateStandardField("primaryCtaText", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 font-bold"
                    />
                    <input
                      type="text"
                      placeholder="/catalogue"
                      value={currentStandardCard.primaryCtaLink}
                      onChange={(e) => handleUpdateStandardField("primaryCtaLink", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-[11px]"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Secondary CTA Label & Link</label>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="e.g. Get best price"
                      value={currentStandardCard.secondaryCtaText}
                      onChange={(e) => handleUpdateStandardField("secondaryCtaText", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 font-bold"
                    />
                    <input
                      type="text"
                      placeholder="/inquiry"
                      value={currentStandardCard.secondaryCtaLink}
                      onChange={(e) => handleUpdateStandardField("secondaryCtaLink", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Stage / Image Upload */}
            <div className="lg:col-span-5 space-y-4">
              {isCard1 ? (
                /* Card 1 Locked Notice */
                <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 text-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-amber-800 font-bold">
                    <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>Interactive NVR Simulator Active</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Card 1 is powered by our proprietary interactive CCTV NVR Live View simulator (4 live simulated camera channels, real-time LED recorder status, and interactive PTZ camera views).
                  </p>
                  <div className="p-3 bg-white rounded-xl border border-amber-200/80 text-[11px] text-slate-600 font-medium">
                    ✓ Content, headlines, CTAs, and 4 technical specs are 100% editable.<br />
                    🔒 The right-stage simulation image is locked to preserve interactive video capability.
                  </div>
                </div>
              ) : isCard3 ? (
                /* Card 3 Dynamic Offer Grid 4-Item Visual Stage Editor */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                        <Megaphone className="w-4 h-4 text-unitech-red shrink-0" />
                        <span>Dynamic 5-Card Offer Grid: 4 Product Images</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Upload or replace product photos for each slot. Auto-normalized via Sharp.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-red-50 text-unitech-red border border-red-200 uppercase shrink-0 self-start sm:self-auto">
                      4 Active Images
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {(currentStandardCard.offerGridItems || DEFAULT_CARD3_OFFER_ITEMS).map((item) => {
                      const defaultImg = DEFAULT_CARD3_OFFER_ITEMS.find((d) => d.id === item.id)?.image || "";
                      const isItemUploading = uploadingCard3ItemId === item.id;

                      const slotLabel =
                        item.id === "cable"
                          ? "Slot 1 · Tall Cable"
                          : item.id === "camera"
                          ? "Slot 2 · Camera"
                          : item.id === "dvr"
                          ? "Slot 3 · Hybrid DVR"
                          : "Slot 4 · SMPS Power";

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            {/* Slot Header */}
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {slotLabel}
                              </span>
                              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                {item.discount}
                              </span>
                            </div>

                            {/* Category & Discount Badge Inputs (Issue-3 Editable Request) */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-0.5">
                                  Category Tag
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. CAMERAS"
                                  value={item.category || ""}
                                  onChange={(e) => handleUpdateCard3Item(item.id, "category", e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-bold text-xs text-slate-800"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-mono font-bold text-red-600 uppercase block mb-0.5">
                                  Discount Badge *
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. 30% off"
                                  value={item.discount || ""}
                                  onChange={(e) => handleUpdateCard3Item(item.id, "discount", e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-red-50/70 border border-red-200 font-bold text-xs text-red-600"
                                />
                              </div>
                            </div>

                            {/* Product Name */}
                            <div>
                              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-0.5">
                                Product Label
                              </label>
                              <input
                                type="text"
                                placeholder="Product Name"
                                value={item.name}
                                onChange={(e) => handleUpdateCard3Item(item.id, "name", e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-bold text-xs text-slate-900"
                              />
                            </div>

                            {/* Price & MRP Row */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-mono text-slate-500 uppercase block">Offer Price</label>
                                <input
                                  type="text"
                                  placeholder="₹ Price"
                                  value={item.price}
                                  onChange={(e) => handleUpdateCard3Item(item.id, "price", e.target.value)}
                                  className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 font-bold text-xs text-slate-900"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-mono text-slate-500 uppercase block">MRP</label>
                                <input
                                  type="text"
                                  placeholder="₹ MRP"
                                  value={item.mrp}
                                  onChange={(e) => handleUpdateCard3Item(item.id, "mrp", e.target.value)}
                                  className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 text-xs text-slate-600"
                                />
                              </div>
                            </div>

                            {/* Image Preview Box */}
                            <div className="w-full h-28 rounded-xl bg-[#faf9f5] border border-slate-200 flex items-center justify-center p-2 relative overflow-hidden">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="max-h-full max-w-full object-contain mix-blend-multiply"
                                />
                              ) : (
                                <div className="text-center text-slate-400 text-xs">No image</div>
                              )}
                            </div>

                            {/* Upload Button via Sharp */}
                            <div className="relative border border-dashed border-slate-300 hover:border-unitech-red rounded-xl p-2 text-center bg-slate-50/60 hover:bg-red-50/20 transition-all cursor-pointer">
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                onChange={(e) => handleCard3ImageUpload(e, item.id)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              />
                              {isItemUploading ? (
                                <span className="text-amber-600 font-bold text-[11px] inline-flex items-center gap-1.5 justify-center">
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Normalizing...
                                </span>
                              ) : (
                                <span className="text-slate-800 font-bold text-[11px] inline-flex items-center gap-1.5 justify-center">
                                  <Upload className="w-3.5 h-3.5 text-unitech-red" /> Upload Image
                                </span>
                              )}
                            </div>

                            {/* Image URL Text Input */}
                            <div>
                              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-0.5">
                                Image Path / URL
                              </label>
                              <input
                                type="text"
                                placeholder="/images/products/..."
                                value={item.image}
                                onChange={(e) => handleUpdateCard3Item(item.id, "image", e.target.value)}
                                className="w-full px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700"
                              />
                            </div>
                          </div>

                          {/* Reset to Default Button */}
                          {defaultImg && item.image !== defaultImg && (
                            <button
                              type="button"
                              onClick={() => handleUpdateCard3Item(item.id, "image", defaultImg)}
                              className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-unitech-red border border-red-200 text-[10px] font-bold transition-all w-full cursor-pointer mt-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset to Official Studio Render</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Card 2 Image Uploader & Preview */
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Stage Showcase Image (Processed with Sharp):
                    </label>
                    <div className="relative border-2 border-dashed border-slate-300 hover:border-unitech-red rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-red-50/20 transition-all cursor-pointer">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={(e) => handleImageUpload(e, false)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload className="w-7 h-7 text-unitech-red mx-auto mb-1.5" />
                      {isUploading ? (
                        <span className="text-amber-600 font-bold inline-flex items-center gap-1.5">
                          <RefreshCw className="w-4 h-4 animate-spin" /> Normalizing & Uploading to PostgreSQL...
                        </span>
                      ) : (
                        <div>
                          <span className="text-slate-900 font-bold block text-xs">
                            Upload product photo or graphic
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Auto-normalizes dimensions & handles white backgrounds via Sharp
                          </span>
                        </div>
                      )}
                    </div>
                    {isCard2 && (
                      <p className="text-[11px] text-slate-500 mt-2 font-medium">
                        Best result: transparent PNG/WebP or a product photo on a plain white background, without text or dimension labels.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Or Image URL:</label>
                    <input
                      type="text"
                      placeholder="/images/products/..."
                      value={currentStandardCard.imageUrl}
                      onChange={(e) => handleUpdateStandardField("imageUrl", e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-mono text-xs"
                    />
                    {isCard2 && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStandardField("imageUrl", "/images/products/utr-1006.png")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-unitech-red border border-red-200 text-xs font-bold transition-all cursor-pointer mt-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset to Official Studio 3D Render (/images/products/utr-1006.png)</span>
                      </button>
                    )}
                  </div>

                  {/* Live Studio Frame Preview */}
                  <div className="p-4 rounded-2xl bg-[#faf9f5] border border-slate-200">
                    <span className="text-[10px] font-mono font-bold text-slate-400 block mb-2 uppercase">
                      Studio Backdrop Preview:
                    </span>
                    <div className="w-full h-48 flex items-center justify-center p-2 overflow-hidden rounded-xl bg-white/60 border border-slate-200/60 shadow-inner">
                      {currentStandardCard.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={currentStandardCard.imageUrl}
                          alt="Preview"
                          className="max-h-full max-w-full object-contain mix-blend-multiply"
                        />
                      ) : (
                        <div className="text-center text-slate-400 text-xs font-medium">
                          No custom image set
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* CARD 4 EDITOR (Product Sale of the Week - Live Countdown)     */}
      {/* ============================================================= */}
      {isCard4 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-mono font-bold text-slate-400 block mb-0.5">
                Editing Card 04/04
              </span>
              <h3 className="font-heading font-black text-xl text-slate-900">
                Product Sale of the Week (Live Countdown Deal)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveCard4(false)}
                disabled={isSaving}
                className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleSaveCard4(true)}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-full bg-unitech-red hover:bg-unitech-darkred disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Publish Live to Database</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs">
            {/* Form Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Badge Text *</label>
                  <input
                    type="text"
                    value={slideData.badgeText}
                    onChange={(e) => setSlideData({ ...slideData, badgeText: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category *</label>
                  <input
                    type="text"
                    value={slideData.category}
                    onChange={(e) => setSlideData({ ...slideData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={slideData.productName}
                    onChange={(e) => setSlideData({ ...slideData, productName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tagline Subtext *</label>
                  <input
                    type="text"
                    value={slideData.tagline}
                    onChange={(e) => setSlideData({ ...slideData, tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300"
                  />
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">MSRP Price (₹)</label>
                  <input
                    type="number"
                    value={slideData.mrp}
                    onChange={(e) => setSlideData({ ...slideData, mrp: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Offer Price (₹)</label>
                  <input
                    type="number"
                    value={slideData.offerPrice}
                    onChange={(e) => setSlideData({ ...slideData, offerPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock Left</label>
                  <input
                    type="number"
                    value={slideData.stockLeft || 18}
                    onChange={(e) => setSlideData({ ...slideData, stockLeft: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 font-bold"
                  />
                </div>
              </div>

              {/* Countdown End Date */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Sale End Date & Time (for Live Countdown Timer) *
                </label>
                <input
                  type="datetime-local"
                  value={slideData.endsAt ? slideData.endsAt.slice(0, 16) : ""}
                  onChange={(e) => setSlideData({ ...slideData, endsAt: new Date(e.target.value).toISOString() })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-bold"
                />
              </div>

              {/* Specs */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Key Specifications (Up to 4):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {slideData.specs.map((spec, sIdx) => (
                    <input
                      key={sIdx}
                      type="text"
                      value={spec}
                      onChange={(e) => {
                        const copy = [...slideData.specs];
                        copy[sIdx] = e.target.value;
                        setSlideData({ ...slideData, specs: copy });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-medium"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Image Column */}
            <div className="lg:col-span-5 space-y-4">
              <label className="font-bold text-slate-700 block mb-1">
                Product Image (Auto-normalized via Sharp):
              </label>
              <div className="relative border-2 border-dashed border-slate-300 hover:border-unitech-red rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-red-50/20 transition-all cursor-pointer">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => handleImageUpload(e, true)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-7 h-7 text-unitech-red mx-auto mb-1.5" />
                {isUploading ? (
                  <span className="text-amber-600 font-bold inline-flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Normalizing & Uploading to PostgreSQL...
                  </span>
                ) : (
                  <div>
                    <span className="text-slate-900 font-bold block text-xs">
                      Upload Card 4 Product Photo
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Standardized to 1000x1000 square with alpha canvas
                    </span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-500 font-medium">
                Best result: transparent PNG/WebP or a product photo on a plain white background, without text or dimension labels.
              </p>

              <input
                type="text"
                placeholder="/images/products/..."
                value={slideData.productImage}
                onChange={(e) => setSlideData({ ...slideData, productImage: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-mono text-xs"
              />

              {/* Studio Frame Preview */}
              <div className="p-4 rounded-2xl bg-[#faf9f5] border border-slate-200">
                <span className="text-[10px] font-mono font-bold text-slate-400 block mb-2 uppercase">
                  Studio Presentation Preview:
                </span>
                <div className="w-full h-48 flex items-center justify-center p-2 overflow-hidden rounded-xl bg-white/60 border border-slate-200/60 shadow-inner">
                  {slideData.productImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={slideData.productImage}
                      alt="Preview"
                      className="max-h-full max-w-full object-contain mix-blend-multiply drop-shadow-md"
                    />
                  ) : (
                    <div className="text-center text-slate-400 text-xs font-medium">
                      No custom image set
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
