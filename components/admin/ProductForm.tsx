"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Camera,
  Layers,
  Sparkles,
  HelpCircle,
  Tag,
  DollarSign,
  ShieldAlert,
} from "lucide-react";
import { Product, Category, CategorySeries } from "@/lib/types";

export interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  product?: Product | null;
  onSuccess: (savedProduct: Product, isNew: boolean) => void;
  onNotify?: (msg: string) => void;
}

export function ProductForm({
  isOpen,
  onClose,
  mode,
  product,
  onSuccess,
  onNotify,
}: ProductFormProps) {
  // Categories and Series loaded dynamically from admin API
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCats, setIsLoadingCats] = useState<boolean>(true);

  // Form Fields - strictly empty in create mode (no hardcoded demo values)
  const [name, setName] = useState("");
  const [modelCode, setModelCode] = useState("");
  const [category, setCategory] = useState("");
  const [series, setSeries] = useState("");
  const [connectivity, setConnectivity] = useState<"wired" | "wireless">("wired");
  const [price, setPrice] = useState<number | "">("");
  const [tier2Price, setTier2Price] = useState<number | "">("");
  const [dealerPrice, setDealerPrice] = useState<number | "">("");
  const [mrp, setMrp] = useState<number | "">("");
  const [stockQuantity, setStockQuantity] = useState<number | "">("");
  const [warrantyYears, setWarrantyYears] = useState<number | "">("");
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [placeholderLabel, setPlaceholderLabel] = useState("");
  const [placeholderSubtext, setPlaceholderSubtext] = useState("");
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([]);
  const [highlights, setHighlights] = useState<string[]>([]);

  // Inline "＋ New category…" state
  const [showInlineNewCat, setShowInlineNewCat] = useState(false);
  const [inlineCatName, setInlineCatName] = useState("");
  const [inlineCatShortLabel, setInlineCatShortLabel] = useState("");
  const [isSavingInlineCat, setIsSavingInlineCat] = useState(false);

  // Inline "＋ New series…" state
  const [showInlineNewSeries, setShowInlineNewSeries] = useState(false);
  const [inlineSeriesLabel, setInlineSeriesLabel] = useState("");
  const [isSavingInlineSeries, setIsSavingInlineSeries] = useState(false);

  // Image Upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission & Validation error
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load categories on mount
  const fetchCategories = async (selectNewCatId?: string) => {
    try {
      setIsLoadingCats(true);
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCategories(json.data);
        if (selectNewCatId) {
          setCategory(selectNewCatId);
        } else if (!category && json.data.length > 0 && mode === "create") {
          setCategory(json.data[0].id);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch categories:", err);
    } finally {
      setIsLoadingCats(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Reset or populate fields when modal opens or product changes
  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && product) {
      setName(product.name || "");
      setModelCode(product.modelCode || "");
      setCategory(product.category || "");
      setSeries((product as any).series || product.specs?.["Series"] || "");
      setConnectivity(product.connectivity || "wired");
      setPrice(product.price ?? "");
      setTier2Price(product.tier2Price ?? "");
      setDealerPrice(product.dealerPrice ?? "");
      setMrp(product.mrp ?? "");
      setStockQuantity(product.stockQuantity ?? "");
      setWarrantyYears(product.warrantyYears ?? 2);
      setIsBestseller(Boolean(product.isBestseller));
      setIsNew(Boolean(product.isNew));
      setImageUrl(product.imageUrl || "");
      setPlaceholderLabel(product.placeholderLabel || "");
      setPlaceholderSubtext(product.placeholderSubtext || "");

      const specList = Object.entries(product.specs || {})
        .filter(([k]) => k !== "Series")
        .map(([k, v]) => ({ key: k, value: String(v) }));
      setSpecs(specList);
      setHighlights([...(product.highlights || [])]);
    } else {
      // Create mode: strictly empty (no hardcoded dummy values)
      setName("");
      setModelCode("");
      setSeries("");
      setConnectivity("wired");
      setPrice("");
      setTier2Price("");
      setDealerPrice("");
      setMrp("");
      setStockQuantity("");
      setWarrantyYears(2);
      setIsBestseller(false);
      setIsNew(true);
      setImageUrl("");
      setPlaceholderLabel("");
      setPlaceholderSubtext("");
      setSpecs([]);
      setHighlights([]);
    }
    setFormError(null);
    setShowInlineNewCat(false);
    setShowInlineNewSeries(false);
    setInlineCatName("");
    setInlineCatShortLabel("");
    setInlineSeriesLabel("");
  }, [isOpen, mode, product]);

  if (!isOpen) return null;

  // Selected Category's series list
  const selectedCatObj = categories.find((c) => c.id === category);
  const currentSeriesList: CategorySeries[] = selectedCatObj?.series || [];

  // Price hierarchy validation check
  const numDealer = Number(dealerPrice) || 0;
  const numB2B = Number(price) || 0;
  const numMrp = Number(mrp) || 0;
  const hasPriceWarning =
    numDealer > 0 && numB2B > 0 && numMrp > 0 && (numDealer > numB2B || numB2B > numMrp);

  // 1. Inline New Category Creation
  const handleCreateInlineCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const catName = inlineCatName.trim();
    if (!catName) return;

    setIsSavingInlineCat(true);
    setFormError(null);

    const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: slug,
          name: catName,
          shortLabel: inlineCatShortLabel.trim() || null,
          isActive: true,
          showInMenu: true,
          showInFooter: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowInlineNewCat(false);
        setInlineCatName("");
        setInlineCatShortLabel("");
        if (onNotify) onNotify(`Category "${catName}" created and selected`);
        await fetchCategories(slug);
      } else {
        setFormError(data.error || "Failed to create category");
      }
    } catch {
      setFormError("Network error creating category");
    } finally {
      setIsSavingInlineCat(false);
    }
  };

  // 2. Inline New Series Creation
  const handleCreateInlineSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    const sLabel = inlineSeriesLabel.trim();
    if (!sLabel || !category) return;

    setIsSavingInlineSeries(true);
    setFormError(null);

    const slug = sLabel.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/(^-|-$)/g, "");

    try {
      const res = await fetch(`/api/admin/categories/${encodeURIComponent(category)}/series`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: sLabel,
          slug,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowInlineNewSeries(false);
        setInlineSeriesLabel("");
        setSeries(sLabel);
        if (onNotify) onNotify(`Series "${sLabel}" created and selected`);
        await fetchCategories();
      } else {
        setFormError(data.error || "Failed to create series");
      }
    } catch {
      setFormError("Network error creating series");
    } finally {
      setIsSavingInlineSeries(false);
    }
  };

  // 3. Image Upload via Database Storage
  const handleUploadImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setFormError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/products/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.fileUrl) {
        setImageUrl(data.fileUrl);
        if (onNotify) onNotify("Product photo uploaded to database");
      } else {
        setFormError(data.error || "Failed to upload image");
      }
    } catch {
      setFormError("Image upload failed");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 4. Specs management
  const handleAddSpecRow = () => {
    setSpecs((prev) => [...prev, { key: "", value: "" }]);
  };

  const handleUpdateSpec = (idx: number, field: "key" | "value", val: string) => {
    setSpecs((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleRemoveSpec = (idx: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== idx));
  };

  // 5. Highlights management
  const handleAddHighlight = () => {
    setHighlights((prev) => [...prev, ""]);
  };

  const handleUpdateHighlight = (idx: number, val: string) => {
    setHighlights((prev) => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const handleRemoveHighlight = (idx: number) => {
    setHighlights((prev) => prev.filter((_, i) => i !== idx));
  };

  // 6. Submit Product Form
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanModel = modelCode.trim().toUpperCase();

    if (!cleanName) {
      setFormError("Product title / name is required.");
      return;
    }
    if (!cleanModel) {
      setFormError("Model code / SKU is required.");
      return;
    }
    if (!category) {
      setFormError("Please select a hardware category.");
      return;
    }

    const numPrice = Number(price);
    const numDealerPrice = Number(dealerPrice);
    const numMrp = Number(mrp);

    if (isNaN(numPrice) || numPrice < 0) {
      setFormError("Factory B2B price must be a valid number ≥ 0.");
      return;
    }
    if (isNaN(numDealerPrice) || numDealerPrice < 0) {
      setFormError("Dealer Tier price must be a valid number ≥ 0.");
      return;
    }
    if (isNaN(numMrp) || numMrp < 0) {
      setFormError("M.R.P. price must be a valid number ≥ 0.");
      return;
    }

    setIsSaving(true);
    setFormError(null);

    // Build specs dictionary
    const specsMap: Record<string, string> = {};
    if (series.trim()) {
      specsMap["Series"] = series.trim();
    }
    specs.forEach((s) => {
      const k = s.key.trim();
      const v = s.value.trim();
      if (k && v) specsMap[k] = v;
    });

    const cleanHighlights = highlights.map((h) => h.trim()).filter(Boolean);

    const targetCategoryObj = categories.find((c) => c.id === category);
    const categoryLabel = targetCategoryObj?.name || category;

    const slug =
      mode === "edit" && product?.slug
        ? product.slug
        : cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const payload: Partial<Product> & { id: string } = {
      id: mode === "edit" && product ? product.id : `prod-${Date.now()}`,
      slug,
      name: cleanName,
      modelCode: cleanModel,
      category: category as any,
      categoryLabel,
      series: series.trim() || undefined,
      connectivity,
      price: numPrice,
      tier2Price: tier2Price !== "" ? Number(tier2Price) : undefined,
      dealerPrice: numDealerPrice,
      mrp: numMrp,
      stockQuantity: stockQuantity !== "" ? Number(stockQuantity) : 0,
      warrantyYears: warrantyYears !== "" ? Number(warrantyYears) : 2,
      isBestseller,
      isNew,
      imageUrl: imageUrl.trim() || undefined,
      placeholderLabel: placeholderLabel.trim() || cleanName,
      placeholderSubtext: placeholderSubtext.trim() || `${cleanModel} · Standard Spec`,
      specs: specsMap,
      highlights: cleanHighlights,
      rating: mode === "edit" && product?.rating ? product.rating : 4.8,
      reviewCount: mode === "edit" && product?.reviewCount ? product.reviewCount : 12,
    };

    try {
      const endpoint = "/api/products";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        const resultProduct = (data.data as Product) || (payload as Product);
        if (onNotify) {
          onNotify(
            mode === "edit"
              ? `✓ Product "${cleanName}" (${cleanModel}) rates & details updated!`
              : `✓ New Product "${cleanName}" (${cleanModel}) added to catalogue!`
          );
        }
        onSuccess(resultProduct, mode === "create");
        onClose();
      } else {
        setFormError(data.error || "Failed to save product.");
      }
    } catch {
      setFormError("Network error saving product.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-unitech-red border border-red-200 flex items-center justify-center">
              {mode === "create" ? <Plus className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-heading font-black text-slate-900 text-lg sm:text-xl">
                {mode === "create" ? "Add New Hardware Product" : `Edit Product: ${product?.name}`}
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Direct OEM Catalogue Management · PostgreSQL Database Storage
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Global Error Alert */}
        {formError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Pricing Tier Warning */}
        {hasPriceWarning && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Pricing Warning: Standard wholesale hierarchy is Dealer Tier (₹{numDealer}) ≤ Factory B2B (₹{numB2B}) ≤ M.R.P. (₹{numMrp}). Please verify your rates.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmitProduct} className="space-y-6 text-xs">
          {/* Section 1: Identification */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              1. Product Identification & Model Code
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Product Title / Name *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unitech 8MP 4K Ultra AI Bullet Camera"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!placeholderLabel) setPlaceholderLabel(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-unitech-red"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Model Code / SKU *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UT-IPBCP-8101"
                  value={modelCode}
                  onChange={(e) => {
                    setModelCode(e.target.value);
                    if (!placeholderSubtext) {
                      setPlaceholderSubtext(`${e.target.value.toUpperCase()} · Standard Spec`);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono uppercase font-bold focus:bg-white focus:outline-none focus:border-unitech-red"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Category & Series Taxonomy */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              2. Category & Series Taxonomy
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category Dropdown with inline creation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Hardware Category *:</label>
                  <button
                    type="button"
                    onClick={() => setShowInlineNewCat(!showInlineNewCat)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>＋ New category…</span>
                  </button>
                </div>

                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === "__NEW_CATEGORY__") {
                      setShowInlineNewCat(true);
                    } else {
                      setCategory(e.target.value);
                      setSeries(""); // reset series when category switches
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-unitech-red"
                >
                  {isLoadingCats && <option value="">Loading categories from database...</option>}
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {!c.isActive ? "(inactive)" : ""}
                    </option>
                  ))}
                  <option value="__NEW_CATEGORY__" className="text-indigo-600 font-bold">
                    ＋ New category…
                  </option>
                </select>

                {/* Inline New Category Popover Form */}
                {showInlineNewCat && (
                  <div className="mt-2.5 p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-900 text-xs">Create New Category</span>
                      <button
                        type="button"
                        onClick={() => setShowInlineNewCat(false)}
                        className="text-indigo-400 hover:text-indigo-600"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Name (e.g. Video Door Phones)"
                        value={inlineCatName}
                        onChange={(e) => setInlineCatName(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs text-slate-900 font-bold focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Short label (optional, e.g. VDP)"
                        value={inlineCatShortLabel}
                        onChange={(e) => setInlineCatShortLabel(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowInlineNewCat(false)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 bg-white border border-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSavingInlineCat || !inlineCatName.trim()}
                        onClick={handleCreateInlineCategory}
                        className="px-3 py-1 rounded-lg text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isSavingInlineCat ? "Creating..." : "Save & Select"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Series Dropdown filtered by category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Series Filter (Optional):</label>
                  {category && (
                    <button
                      type="button"
                      onClick={() => setShowInlineNewSeries(!showInlineNewSeries)}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>＋ New series…</span>
                    </button>
                  )}
                </div>

                <select
                  value={series}
                  onChange={(e) => {
                    if (e.target.value === "__NEW_SERIES__") {
                      setShowInlineNewSeries(true);
                    } else {
                      setSeries(e.target.value);
                    }
                  }}
                  disabled={!category}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-unitech-red disabled:opacity-50"
                >
                  <option value="">None / Standard Series</option>
                  {currentSeriesList.map((s) => (
                    <option key={s.id} value={s.label}>
                      {s.label} {!s.isActive ? "(inactive)" : ""}
                    </option>
                  ))}
                  {category && (
                    <option value="__NEW_SERIES__" className="text-indigo-600 font-bold">
                      ＋ New series…
                    </option>
                  )}
                </select>

                {/* Inline New Series Popover Form */}
                {showInlineNewSeries && (
                  <div className="mt-2.5 p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-900 text-xs">
                        Add Series to &quot;{selectedCatObj?.name}&quot;
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowInlineNewSeries(false)}
                        className="text-indigo-400 hover:text-indigo-600"
                      >
                        ✕
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Series label (e.g. Wi-Fi, Wired, 4K Pro)"
                      value={inlineSeriesLabel}
                      onChange={(e) => setInlineSeriesLabel(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs text-slate-900 font-bold focus:outline-none"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowInlineNewSeries(false)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 bg-white border border-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSavingInlineSeries || !inlineSeriesLabel.trim()}
                        onClick={handleCreateInlineSeries}
                        className="px-3 py-1 rounded-lg text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isSavingInlineSeries ? "Creating..." : "Save & Select"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Pricing & Inventory */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              3. Factory B2B, Dealer Wholesale & Retail Pricing
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Factory B2B (₹) *:
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  placeholder="e.g. 2450"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-unitech-red"
                />
              </div>

              <div>
                <label className="font-bold text-emerald-800 block mb-1">
                  Dealer Tier (₹) *:
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  placeholder="e.g. 1850"
                  value={dealerPrice}
                  onChange={(e) =>
                    setDealerPrice(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-emerald-50/50 border border-emerald-300 text-emerald-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-unitech-red"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">M.R.P. (₹) *:</label>
                <input
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  placeholder="e.g. 3600"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-unitech-red"
                />
              </div>

              <div>
                <label className="font-bold text-slate-500 block mb-1">
                  Wholesale Tier 2 (₹):
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Optional 5+ units"
                  value={tier2Price}
                  onChange={(e) =>
                    setTier2Price(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-700 font-mono focus:bg-white focus:outline-none focus:border-unitech-red"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Initial Stock:</label>
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 50"
                  value={stockQuantity}
                  onChange={(e) =>
                    setStockQuantity(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-unitech-red"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Warranty (Years):</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  placeholder="e.g. 2"
                  value={warrantyYears}
                  onChange={(e) =>
                    setWarrantyYears(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-unitech-red"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Connectivity:</label>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setConnectivity("wired")}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all text-center ${
                      connectivity === "wired"
                        ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Wired
                  </button>
                  <button
                    type="button"
                    onClick={() => setConnectivity("wireless")}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all text-center ${
                      connectivity === "wireless"
                        ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Wireless
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Photography & Badges */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              4. Product Photography & Storefront Flags
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Product Image URL / Database Upload:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. /uploads/products/image.webp"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono focus:bg-white focus:outline-none focus:border-unitech-red"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUploadImageFile}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingImage ? "..." : "Upload"}</span>
                  </button>
                </div>
                {imageUrl && (
                  <div className="mt-2 w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 p-1 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="preview" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNew}
                    onChange={(e) => setIsNew(e.target.checked)}
                    className="w-4 h-4 rounded text-unitech-red focus:ring-red-400"
                  />
                  <span className="font-bold text-slate-700">Flag as &quot;NEW&quot; Hardware Release</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBestseller}
                    onChange={(e) => setIsBestseller(e.target.checked)}
                    className="w-4 h-4 rounded text-unitech-red focus:ring-red-400"
                  />
                  <span className="font-bold text-slate-700">Flag as &quot;BESTSELLER&quot;</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 5: Technical Specifications */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                5. Technical Specifications ({specs.length} Defined)
              </h4>
              <button
                type="button"
                onClick={handleAddSpecRow}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Spec</span>
              </button>
            </div>

            {specs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No specifications defined yet. Click &quot;+ Add Spec&quot; to configure camera resolution, lens, housing, etc.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {specs.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="e.g. Resolution"
                      value={item.key}
                      onChange={(e) => handleUpdateSpec(idx, "key", e.target.value)}
                      className="w-1/3 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="e.g. 4MP Ultra HD (2560x1440)"
                      value={item.value}
                      onChange={(e) => handleUpdateSpec(idx, "value", e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 6: Feature Highlights */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                6. Storefront Feature Bullets ({highlights.length} Bullets)
              </h4>
              <button
                type="button"
                onClick={handleAddHighlight}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Bullet</span>
              </button>
            </div>

            {highlights.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No feature bullets defined yet. Click &quot;+ Add Bullet&quot; to configure key selling highlights.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {highlights.map((bullet, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="text-slate-400 font-bold text-xs pl-1">•</span>
                    <input
                      type="text"
                      placeholder="e.g. Industrial heavy-duty casing with thermal dissipation"
                      value={bullet}
                      onChange={(e) => handleUpdateHighlight(idx, e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveHighlight(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white font-bold text-xs shadow-md shadow-unitech-red/30 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{mode === "create" ? "Add Product to Catalogue" : "Save Changes"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
