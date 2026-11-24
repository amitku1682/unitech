"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Zap,
  Save,
  Globe,
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  Eye,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Tag,
  DollarSign,
  Package,
  Calendar,
  ExternalLink,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  Flame,
  Check,
  X,
} from "lucide-react";
import {
  FlashSaleData,
  FlashSaleItem,
  FlashSalePublicPayload,
  FlashSaleTrigger,
  FlashSaleFrequency,
  FlashSaleShowOn,
} from "@/lib/types";
import FlashSalePopup from "@/components/store/FlashSalePopup";

interface FlashSaleEditorProps {
  onNotify?: (message: string, isError?: boolean) => void;
}

const DEFAULT_FLASH_SALE: FlashSaleData = {
  id: "fs-unitech-4cam-kit",
  status: "published",
  isEnabled: true,
  startsAt: null,
  endsAt: "2026-11-29T23:59:59.000Z",
  showTrigger: "delay",
  showDelaySeconds: 2,
  frequency: "once_per_session",
  showOn: "home_and_products",
  badge: "Flash sale",
  badge2: "Factory direct",
  eyebrow: "Limited factory scheme",
  title: "4-Camera Full-Colour CCTV Kit",
  subtitle: "8-channel DVR included — add up to 4 more cameras later.",
  heroImageUrl: "/images/products/utipbcp-4101.png",
  heroImageAlt: "Unitech 4-Camera Full-Colour CCTV Kit",
  heroBadge: "×4",
  heroBadgeCaption: "CAMERAS",
  mrp: 28000,
  price: 18499,
  discountOverride: null,
  unitsInKit: 4,
  unitLabel: "camera",
  gstNote: "+ 18% GST · GST invoice with full ITC",
  perks: [
    "Same-day dispatch",
    "Factory direct · Sahibabad",
    "2-year warranty",
  ],
  stockTotal: 50,
  stockLeft: 16,
  ctaLabel: "Claim offer · Add to cart",
  ctaShortLabel: "Claim offer",
  whatsappNumber: "+91 87003 17239",
  bulkLabel: "Need 10+ kits? Get a quote",
  bulkUrl: "/inquiry?type=PRODUCT_QUOTE",
  dismissLabel: "No thanks, browse products",
  linkedProductId: "utipbcp-4101",
  linkedBundleSku: "UT-BND-4CAM-8DVR",
  viewsCount: 142,
  claimsCount: 28,
  createdAt: "2026-11-15T12:00:00.000Z",
  updatedAt: "2026-11-15T12:00:00.000Z",
  updatedBy: "System Seed",
  items: [
    {
      id: "fsi-1",
      flashSaleId: "fs-unitech-4cam-kit",
      position: 0,
      qty: 4,
      name: "4MP Warm Light Bullet Cameras",
      shortName: "4MP Bullet ×4",
      spec: "30 m colour night vision · IP67 metal body",
      imageUrl: "/images/products/utipbcp-4101.png",
    },
    {
      id: "fsi-2",
      flashSaleId: "fs-unitech-4cam-kit",
      position: 1,
      qty: 1,
      name: "8-Channel H.265+ Hybrid DVR",
      shortName: "8-CH Hybrid DVR",
      spec: "Dual SATA · 4 channels free to expand",
      imageUrl: "/images/products/uthd-508.png",
    },
    {
      id: "fsi-3",
      flashSaleId: "fs-unitech-4cam-kit",
      position: 2,
      qty: 1,
      name: "90 m 3+1 Copper CCTV Cable",
      shortName: "3+1 Copper Cable 90 m",
      spec: "100% solid annealed copper",
      imageUrl: "/images/products/90y-tight.png",
    },
    {
      id: "fsi-4",
      flashSaleId: "fs-unitech-4cam-kit",
      position: 3,
      qty: 1,
      name: "12V 10A SMPS + Connectors",
      shortName: "12V 10A SMPS",
      spec: "Powers all cameras · BNC & DC included",
      imageUrl: "/images/products/utpsa-105.png",
    },
  ],
};

const PRESET_IMAGES = [
  { label: "4MP Bullet Camera", url: "/images/products/utipbcp-4101.png" },
  { label: "8-CH Hybrid DVR", url: "/images/products/uthd-508.png" },
  { label: "90m CCTV Cable", url: "/images/products/90y-tight.png" },
  { label: "12V 10A SMPS", url: "/images/products/utpsa-105.png" },
  { label: "PoE NVR", url: "/images/products/utnvr-316.png" },
  { label: "Dome Camera", url: "/images/products/utipdc-4101.png" },
];

export function FlashSaleEditor({ onNotify }: FlashSaleEditorProps) {
  const [data, setData] = useState<FlashSaleData>(DEFAULT_FLASH_SALE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load directly from PostgreSQL API
  useEffect(() => {
    fetch("/api/flash-sale", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setData(json.data);
        }
      })
      .catch((err) => {
        console.warn("[FlashSaleEditor load error]:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatDatetimeForInput = (isoStr?: string | null) => {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return "";
      const pad = (n: number) => String(n).padStart(2, "0");
      const year = d.getFullYear();
      const month = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return "";
    }
  };

  // Auto-calculated discount percent
  const autoDiscount =
    data.mrp > 0 && data.price > 0 && data.mrp > data.price
      ? Math.round(((data.mrp - data.price) / data.mrp) * 100)
      : 34;

  const currentDiscount =
    data.discountOverride !== null && data.discountOverride !== undefined
      ? data.discountOverride
      : autoDiscount;

  const validate = (isPublishing = false): boolean => {
    const errs: Record<string, string> = {};

    if (!data.title.trim()) {
      errs.title = "Title is required.";
    }

    if (data.mrp <= 0) {
      errs.mrp = "MRP must be greater than 0.";
    }

    if (data.price <= 0) {
      errs.price = "Sale price must be greater than 0.";
    } else if (data.price >= data.mrp) {
      errs.price = "Sale price must be lower than MRP.";
    }

    if (!data.endsAt) {
      errs.endsAt = "End date and time is required.";
    } else if (isPublishing) {
      if (new Date(data.endsAt).getTime() <= Date.now()) {
        errs.endsAt = "End date must be in the future to publish live.";
      }
    }

    if (data.startsAt && data.endsAt) {
      if (new Date(data.startsAt).getTime() >= new Date(data.endsAt).getTime()) {
        errs.startsAt = "Start date must be before end date.";
      }
    }

    if (!data.items || data.items.length === 0) {
      errs.items = "At least 1 item is required in the kit.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (publish: boolean) => {
    if (!validate(publish)) {
      onNotify?.("Please fix the validation errors before saving.", true);
      return;
    }

    setIsSaving(true);
    const updated: FlashSaleData = {
      ...data,
      status: publish ? "published" : "draft",
      isEnabled: publish ? true : data.isEnabled,
      updatedAt: new Date().toISOString(),
      updatedBy: "Admin",
    };

    try {
      // Single direct atomic save & publish call to PostgreSQL endpoint
      const res = await fetch("/api/flash-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Save failed on PostgreSQL database.");
      }

      // Update state with newly saved PostgreSQL data
      setData(json.data);

      onNotify?.(
        publish
          ? "✓ Flash Sale published live to PostgreSQL & storefront!"
          : "✓ Flash Sale draft saved to PostgreSQL successfully."
      );
    } catch (err: any) {
      console.error("[FlashSaleEditor save error]:", err);
      onNotify?.(err.message || "Failed to save flash sale.", true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        heroImageUrl: "Image file exceeds 3 MB limit.",
      }));
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/products/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success && json.fileUrl) {
        setData((prev) => ({
          ...prev,
          heroImageUrl: json.fileUrl,
        }));
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            setData((prev) => ({ ...prev, heroImageUrl: reader.result as string }));
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setData((prev) => ({ ...prev, heroImageUrl: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleItemFileUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      if (onNotify) onNotify("Image file exceeds 3 MB limit.", true);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/products/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success && json.fileUrl) {
        handleUpdateItem(idx, "imageUrl", json.fileUrl);
        if (onNotify) onNotify(`Image uploaded for item #${idx + 1}`);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            handleUpdateItem(idx, "imageUrl", reader.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          handleUpdateItem(idx, "imageUrl", reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Item repeater actions
  const handleAddItem = () => {
    if (data.items.length >= 6) return;
    const newItem: FlashSaleItem = {
      id: `fsi-${Date.now()}`,
      flashSaleId: data.id,
      position: data.items.length,
      qty: 1,
      name: "Additional Hardware Component",
      shortName: "Hardware Item",
      spec: "Factory verified specification",
      imageUrl: "/images/products/utipbcp-4101.png",
    };
    setData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleRemoveItem = (index: number) => {
    if (data.items.length <= 1) return;
    setData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleMoveItem = (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= data.items.length) return;
    const copy = [...data.items];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;
    setData((prev) => ({ ...prev, items: copy }));
  };

  const handleUpdateItem = (index: number, field: keyof FlashSaleItem, value: any) => {
    const copy = [...data.items];
    copy[index] = { ...copy[index], [field]: value };
    setData((prev) => ({ ...prev, items: copy }));
  };

  const handleResetDefaults = () => {
    if (confirm("Reset Flash Sale content to factory defaults?")) {
      setData(DEFAULT_FLASH_SALE);
      onNotify?.("Reset to default settings.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium">
        Loading Flash Sale Pop-up details...
      </div>
    );
  }

  // Derive live preview payload
  const livePreviewPayload: FlashSalePublicPayload = {
    ...data,
    discount: currentDiscount,
    save: data.mrp - data.price,
    perUnit: Math.round(data.price / Math.max(1, data.unitsInKit)),
    barPct: Math.min(100, Math.round((data.price / data.mrp) * 100)),
    stockPct: Math.min(100, Math.round((data.stockLeft / Math.max(1, data.stockTotal)) * 100)),
    serverNow: new Date().toISOString(),
  };

  const isLive = data.status === "published" && data.isEnabled;
  const isEnded = new Date(data.endsAt).getTime() <= Date.now();
  const conversionRate =
    data.viewsCount > 0 ? ((data.claimsCount / data.viewsCount) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Actions */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-unitech-red border border-red-200 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-unitech-red" />
              <span>Flash Sale Pop-up System</span>
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                isLive && !isEnded
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : isEnded
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {isLive && !isEnded
                ? "● Live on Storefront"
                : isEnded
                ? "✕ Ended"
                : "○ Draft (Unpublished)"}
            </span>
          </div>

          <h2 className="font-heading font-black text-xl text-slate-900">
            Storefront Flash Sale Pop-up & Bottom-Sheet
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Manage high-conversion limited-time schemes. Edit kit contents, countdown timer, factory-direct wholesale pricing, and trigger conditions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-all"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </a>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(false)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 disabled:opacity-50"
          >
            Save Draft
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(true)}
            className="px-5 py-2.5 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-unitech-red/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Publishing..." : "Publish Live"}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Live Analytics Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Impressions</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {data.viewsCount.toLocaleString("en-IN")}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Unique views served</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
            <span>Offers Claimed</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
            {data.claimsCount.toLocaleString("en-IN")}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Added to quote cart</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>Conversion Rate</span>
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1 font-mono">
            {conversionRate}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Claims per impression</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Factory Stock</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {data.stockLeft} <span className="text-xs text-slate-400 font-normal">/ {data.stockTotal} left</span>
          </div>
          <div className="text-[10px] text-amber-600 font-semibold mt-0.5">
            {Math.round(((data.stockTotal - data.stockLeft) / data.stockTotal) * 100)}% inventory reserved
          </div>
        </div>
      </div>

      {/* Editor & Live Preview 2-Column Split Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 5 FORM CARDS */}
        <div className="xl:col-span-6 space-y-5">
          {/* CARD 1: VISIBILITY & SCHEDULING */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-heading font-black text-sm text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-unitech-red" />
              <span>1. Visibility, Timing & Targeting</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <div className="font-bold text-slate-800">Pop-up Enabled</div>
                  <div className="text-[11px] text-slate-500">Enable or disable trigger</div>
                </div>
                <input
                  type="checkbox"
                  checked={data.isEnabled}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, isEnabled: e.target.checked }))
                  }
                  className="w-5 h-5 accent-unitech-red cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Display Trigger</label>
                <select
                  value={data.showTrigger}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      showTrigger: e.target.value as FlashSaleTrigger,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 bg-white"
                >
                  <option value="delay">Time Delay (Recommended)</option>
                  <option value="immediate">Immediate on Load</option>
                  <option value="scroll_50">Scroll 50% Down</option>
                  <option value="exit_intent">Exit Intent (Mouse Leave)</option>
                </select>
              </div>

              {data.showTrigger === "delay" && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Delay Seconds
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={data.showDelaySeconds}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        showDelaySeconds: parseInt(e.target.value, 10) || 4,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Frequency</label>
                <select
                  value={data.frequency}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      frequency: e.target.value as FlashSaleFrequency,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 bg-white"
                >
                  <option value="once_per_session">Once Per Session (Recommended)</option>
                  <option value="once_per_day">Once Per Day</option>
                  <option value="every_visit">Every Visit (Debug/Testing)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pages to Show On</label>
                <select
                  value={data.showOn}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      showOn: e.target.value as FlashSaleShowOn,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 bg-white"
                >
                  <option value="home_and_products">Homepage & Products (Default)</option>
                  <option value="home_only">Homepage Only</option>
                  <option value="all_pages">All Storefront Pages</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Offer End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formatDatetimeForInput(data.endsAt)}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      endsAt: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : prev.endsAt,
                    }))
                  }
                  className={`w-full px-3 py-2 rounded-xl border text-slate-900 ${
                    errors.endsAt ? "border-red-500" : "border-slate-200"
                  }`}
                />
                {errors.endsAt && (
                  <div className="text-[11px] text-red-600 mt-1">{errors.endsAt}</div>
                )}
              </div>
            </div>
          </div>

          {/* CARD 2: CONTENT & HERO VISUAL */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-heading font-black text-sm text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-unitech-red" />
              <span>2. Headers, Copy & Hero Visual</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Red Badge</label>
                <input
                  type="text"
                  value={data.badge}
                  onChange={(e) => setData((prev) => ({ ...prev, badge: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Secondary Pill</label>
                <input
                  type="text"
                  value={data.badge2}
                  onChange={(e) => setData((prev) => ({ ...prev, badge2: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Eyebrow Caption</label>
                <input
                  type="text"
                  value={data.eyebrow}
                  onChange={(e) => setData((prev) => ({ ...prev, eyebrow: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Offer Title *</label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => setData((prev) => ({ ...prev, title: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl border text-slate-900 font-bold ${
                    errors.title ? "border-red-500" : "border-slate-200"
                  }`}
                />
                {errors.title && (
                  <div className="text-[11px] text-red-600 mt-1">{errors.title}</div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Subtitle Description</label>
                <textarea
                  rows={2}
                  value={data.subtitle || ""}
                  onChange={(e) => setData((prev) => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>

              {/* Hero Image & Upload */}
              <div className="sm:col-span-2 space-y-2">
                <label className="block font-bold text-slate-700">Hero Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={data.heroImageUrl}
                    onChange={(e) =>
                      setData((prev) => ({ ...prev, heroImageUrl: e.target.value }))
                    }
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono text-[11px]"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? "Uploading..." : "Upload"}</span>
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-500 font-medium">Quick Pick:</span>
                  {PRESET_IMAGES.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setData((prev) => ({ ...prev, heroImageUrl: p.url }))}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Image Alt Text</label>
                <input
                  type="text"
                  value={data.heroImageAlt}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, heroImageAlt: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Floating Badge</label>
                  <input
                    type="text"
                    value={data.heroBadge || ""}
                    onChange={(e) =>
                      setData((prev) => ({ ...prev, heroBadge: e.target.value }))
                    }
                    placeholder="×4"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge Caption</label>
                  <input
                    type="text"
                    value={data.heroBadgeCaption || ""}
                    onChange={(e) =>
                      setData((prev) => ({ ...prev, heroBadgeCaption: e.target.value }))
                    }
                    placeholder="CAMERAS"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: PRICING & INVENTORY */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-heading font-black text-sm text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-unitech-red" />
              <span>3. Factory Pricing & SKU Linking</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Regular MRP (₹) *</label>
                <input
                  type="number"
                  value={data.mrp}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      mrp: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sale Offer Price (₹) *</label>
                <input
                  type="number"
                  value={data.price}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      price: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className={`w-full px-3 py-2 rounded-xl border font-mono font-bold text-slate-900 ${
                    errors.price ? "border-red-500" : "border-slate-200"
                  }`}
                />
                {errors.price && (
                  <div className="text-[11px] text-red-600 mt-1">{errors.price}</div>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <div className="font-bold text-slate-800">Discount Override</div>
                  <div className="text-[11px] text-slate-500">Auto: {autoDiscount}% OFF</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.discountOverride !== null && data.discountOverride !== undefined}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        discountOverride: e.target.checked ? autoDiscount : null,
                      }))
                    }
                    className="w-4 h-4 accent-unitech-red cursor-pointer"
                  />
                  {data.discountOverride !== null && data.discountOverride !== undefined && (
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={data.discountOverride}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          discountOverride: parseInt(e.target.value, 10) || autoDiscount,
                        }))
                      }
                      className="w-16 px-2 py-1 rounded-lg border border-slate-200 font-mono text-center"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Units In Kit</label>
                  <input
                    type="number"
                    min="1"
                    max="64"
                    value={data.unitsInKit}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        unitsInKit: parseInt(e.target.value, 10) || 1,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Label</label>
                  <input
                    type="text"
                    value={data.unitLabel}
                    onChange={(e) =>
                      setData((prev) => ({ ...prev, unitLabel: e.target.value }))
                    }
                    placeholder="camera"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">GST & Tax Notice</label>
                <input
                  type="text"
                  value={data.gstNote}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, gstNote: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Linked Bundle SKU</label>
                <input
                  type="text"
                  value={data.linkedBundleSku || ""}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, linkedBundleSku: e.target.value }))
                  }
                  placeholder="UT-BND-4CAM-8DVR"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Linked Product ID</label>
                <input
                  type="text"
                  value={data.linkedProductId || ""}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, linkedProductId: e.target.value }))
                  }
                  placeholder="utipbcp-4101"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* CARD 4: WHAT'S IN THE BOX (REPEATER) */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-sm text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-unitech-red" />
                <span>4. What&apos;s In The Kit ({data.items.length}/6 items)</span>
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={data.items.length >= 6}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 border border-slate-200 disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {data.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-white border border-slate-200 flex items-center justify-center text-[10px] font-mono">
                        {idx + 1}
                      </span>
                      <span>{item.name || "New Item"}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveItem(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveItem(idx, "down")}
                        disabled={idx === data.items.length - 1}
                        className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={data.items.length <= 1}
                        className="p-1 rounded hover:bg-red-50 text-red-600 disabled:opacity-30 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) =>
                          handleUpdateItem(idx, "qty", parseInt(e.target.value, 10) || 1)
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-center font-bold"
                      />
                    </div>

                    <div className="sm:col-span-5">
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Full Name</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(idx, "name", e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                      />
                    </div>

                    <div className="sm:col-span-5">
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Short Name (Mobile)</label>
                      <input
                        type="text"
                        value={item.shortName || ""}
                        onChange={(e) => handleUpdateItem(idx, "shortName", e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>

                    <div className="sm:col-span-12">
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Specification</label>
                      <input
                        type="text"
                        value={item.spec || ""}
                        onChange={(e) => handleUpdateItem(idx, "spec", e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700"
                      />
                    </div>

                    <div className="sm:col-span-12 space-y-1.5 pt-1.5 border-t border-slate-100">
                      <label className="block text-[10px] font-bold text-slate-700">Item Image & Media</label>
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        {/* Thumbnail preview */}
                        <div className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="w-full h-full object-contain p-0.5"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <Package className="w-4 h-4 text-slate-300" />
                          )}
                        </div>

                        {/* URL input field */}
                        <input
                          type="text"
                          value={item.imageUrl}
                          onChange={(e) => handleUpdateItem(idx, "imageUrl", e.target.value)}
                          placeholder="Image URL or upload..."
                          className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-[10px] text-slate-800"
                        />

                        {/* Upload button with hidden file input */}
                        <input
                          type="file"
                          id={`item-file-${idx}`}
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleItemFileUpload(idx, e)}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById(`item-file-${idx}`)?.click()}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 border border-slate-200 shrink-0"
                          title="Upload image"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload</span>
                        </button>

                        {/* Remove image button */}
                        {item.imageUrl && (
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(idx, "imageUrl", "")}
                            className="px-2 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold flex items-center gap-1 border border-red-200 shrink-0"
                            title="Remove image"
                          >
                            <X className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      {/* Quick Pick chips */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-[9px] text-slate-400 font-semibold">Quick Pick:</span>
                        {PRESET_IMAGES.map((p, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => handleUpdateItem(idx, "imageUrl", p.url)}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 5: PERKS, STOCK & BUTTON LABELS */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-heading font-black text-sm text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-unitech-red" />
              <span>5. Factory Perks, Stock Urgency & CTA Links</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2 space-y-2">
                <label className="block font-bold text-slate-700">Factory Perks (3 Items)</label>
                {data.perks.map((perk, pIdx) => (
                  <div key={pIdx} className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <input
                      type="text"
                      value={perk}
                      onChange={(e) => {
                        const copy = [...data.perks];
                        copy[pIdx] = e.target.value;
                        setData((prev) => ({ ...prev, perks: copy }));
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-900"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Stock Batch</label>
                <input
                  type="number"
                  min="1"
                  value={data.stockTotal}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      stockTotal: parseInt(e.target.value, 10) || 50,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Stock Left (Urgency)</label>
                <input
                  type="number"
                  min="0"
                  max={data.stockTotal}
                  value={data.stockLeft}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      stockLeft: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono font-bold text-red-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">WhatsApp Direct Number</label>
                <input
                  type="text"
                  value={data.whatsappNumber}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, whatsappNumber: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">CTA Label (Desktop)</label>
                <input
                  type="text"
                  value={data.ctaLabel}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, ctaLabel: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">CTA Short Label (Mobile)</label>
                <input
                  type="text"
                  value={data.ctaShortLabel}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, ctaShortLabel: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bulk Quote Button Text</label>
                <input
                  type="text"
                  value={data.bulkLabel}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, bulkLabel: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bulk Quote Target URL</label>
                <input
                  type="text"
                  value={data.bulkUrl}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, bulkUrl: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono text-[11px]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Dismiss Text</label>
                <input
                  type="text"
                  value={data.dismissLabel}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, dismissLabel: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All to Defaults</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: STICKY LIVE PREVIEW */}
        <div className="xl:col-span-6 sticky top-6 space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-unitech-red" />
              <span className="font-heading font-black text-sm text-slate-900">
                Live Storefront Preview
              </span>
            </div>

            {/* Toggle Desktop vs Mobile preview frame */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setPreviewMode("desktop")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  previewMode === "desktop"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop Modal</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewMode("mobile")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  previewMode === "mobile"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Sheet</span>
              </button>
            </div>
          </div>

          {/* Interactive Frame Wrapper */}
          <div className="rounded-2xl bg-slate-900/90 p-4 border border-slate-800 shadow-inner flex items-center justify-center min-h-[580px] overflow-hidden">
            {previewMode === "desktop" ? (
              <div
                className="w-full max-w-[880px] transform origin-top transition-transform"
                style={{ zoom: 0.8 }}
              >
                <FlashSalePopup
                  previewData={livePreviewPayload}
                  isMobilePreview={false}
                />
              </div>
            ) : (
              <div
                className="w-[375px] max-w-full rounded-[36px] border-4 border-slate-700 bg-white shadow-2xl overflow-hidden relative"
                style={{ height: "660px" }}
              >
                {/* Phone Speaker Notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full z-20 pointer-events-none" />
                <div className="pt-6 h-full overflow-y-auto">
                  <FlashSalePopup
                    previewData={livePreviewPayload}
                    isMobilePreview={true}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
