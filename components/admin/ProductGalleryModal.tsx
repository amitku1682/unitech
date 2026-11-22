"use client";

import React, { useState, useEffect, useRef } from "react";
import { Product, ProductImage, ProductImageLabel } from "@/lib/types";
import {
  Camera,
  Upload,
  RefreshCw,
  Trash2,
  Star,
  ArrowLeft,
  ArrowRight,
  FileText,
  FileDown,
  ExternalLink,
  Plus,
  AlertCircle,
  Eye,
  Check,
} from "lucide-react";

interface ProductGalleryModalProps {
  product: Product;
  onClose: () => void;
  onSaveSuccess: (updatedImages: ProductImage[], coverUrl: string, datasheetUrl?: string) => void;
  showToast: (msg: string) => void;
}

const STANDARD_LABELS: ProductImageLabel[] = [
  "Front view",
  "Side view",
  "Back view",
  "Lens close-up",
  "Mount & bracket",
  "Ports & connectors",
  "Installed on wall",
  "In the box",
  "Dimensions",
  "Other",
];

const PRESETS = [
  { label: "Bullet Camera", url: "/images/products/utipbcp-4101.png" },
  { label: "Dome Camera", url: "/images/products/utipdcp-4101.png" },
  { label: "5MP POE Bullet", url: "/images/products/utipbcp-5101.png" },
  { label: "5MP POE Dome", url: "/images/products/utipdcp-5101.png" },
  { label: "Hybrid DVR / NVR", url: "/images/products/utdvr-4101.png" },
  { label: "3+1 CCTV Cable", url: "/images/products/utc-3190.png" },
  { label: "6U Server Rack", url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=80" },
  { label: "12V SMPS Power", url: "https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=400&auto=format&fit=crop&q=80" },
];

export function ProductGalleryModal({
  product,
  onClose,
  onSaveSuccess,
  showToast,
}: ProductGalleryModalProps) {
  // Gallery list (1 to 6 items)
  const [images, setImages] = useState<ProductImage[]>(() => {
    if (product.images && product.images.length > 0) {
      return product.images.map((img, idx) => ({ ...img, position: idx }));
    }
    if (product.imageUrl) {
      return [
        {
          id: `img-${product.id}-0`,
          productId: product.id,
          url: product.imageUrl,
          thumbUrl: product.imageUrl,
          width: 1000,
          height: 1000,
          label: "Front view",
          alt: `${product.name} — front view`,
          position: 0,
        },
      ];
    }
    return [];
  });

  const [isLoadingImages, setIsLoadingImages] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);

  // Drag and drop states for file upload
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTargetIndex, setReplaceTargetIndex] = useState<number | null>(null);

  // URL input state
  const [customUrlInput, setCustomUrlInput] = useState<string>("");

  // Technical PDF Datasheet state (preserved)
  const [datasheetUrlInput, setDatasheetUrlInput] = useState<string>(product.datasheetPdfUrl || "");
  const [isUploadingDatasheet, setIsUploadingDatasheet] = useState<boolean>(false);

  // HTML5 Drag-and-drop slot reorder
  const [draggedSlotIndex, setDraggedSlotIndex] = useState<number | null>(null);

  // Load existing gallery from backend API on mount
  useEffect(() => {
    let isMounted = true;
    fetch(`/api/admin/products/${encodeURIComponent(product.id)}/images`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.images) && data.images.length > 0) {
          setImages(data.images.map((img: any, idx: number) => ({ ...img, position: idx })));
        }
      })
      .catch((err) => {
        console.warn("[Fetch gallery warning]:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingImages(false);
      });

    return () => {
      isMounted = false;
    };
  }, [product.id]);

  // Keep preview index in bounds
  useEffect(() => {
    if (activePreviewIndex >= images.length && images.length > 0) {
      setActivePreviewIndex(images.length - 1);
    }
  }, [images.length, activePreviewIndex]);

  // Handle uploading 1 or more files
  const handleUploadFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const remainingSlots = 6 - images.length;
    if (remainingSlots <= 0) {
      showToast("Maximum 6 images allowed per product.");
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      showToast(`Only ${remainingSlots} photo slot(s) available. Processing first ${remainingSlots}.`);
    }

    setIsUploading(true);
    const newItems: ProductImage[] = [];

    for (const file of filesToUpload) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/uploads/product-image", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (res.ok && data.success) {
          if (data.warning) {
            showToast(`⚠️ ${data.warning}`);
          }
          const defaultLabel: ProductImageLabel = images.length + newItems.length === 0 ? "Front view" : "Other";
          newItems.push({
            id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            productId: product.id,
            url: data.url,
            thumbUrl: data.thumb_url || data.url,
            width: data.width || 1000,
            height: data.height || 1000,
            label: defaultLabel,
            alt: `${product.name} — ${defaultLabel.toLowerCase()}`,
            position: images.length + newItems.length,
          });
        } else {
          showToast(`❌ Error: ${data.error || "Failed to process photo."}`);
        }
      } catch (err: any) {
        showToast(`❌ Upload error: ${err.message}`);
      }
    }

    if (newItems.length > 0) {
      setImages((prev) => {
        const updated = [...prev, ...newItems].slice(0, 6);
        return updated.map((item, idx) => ({ ...item, position: idx }));
      });
      showToast(`✓ Added ${newItems.length} photo(s) to gallery.`);
    }

    setIsUploading(false);
  };

  // Handle replacing a specific slot's image
  const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replaceTargetIndex === null) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/uploads/product-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setImages((prev) =>
          prev.map((img, idx) =>
            idx === replaceTargetIndex
              ? {
                  ...img,
                  url: data.url,
                  thumbUrl: data.thumb_url || data.url,
                  width: data.width || img.width,
                  height: data.height || img.height,
                }
              : img
          )
        );
        showToast("✓ Photo replaced successfully.");
      } else {
        showToast(`❌ Replace error: ${data.error || "Failed to process replacement image."}`);
      }
    } catch (err: any) {
      showToast(`❌ Replace error: ${err.message}`);
    } finally {
      setIsUploading(false);
      setReplaceTargetIndex(null);
      if (replaceInputRef.current) replaceInputRef.current.value = "";
    }
  };

  // Add via custom URL
  const handleAddUrl = () => {
    const trimmed = customUrlInput.trim();
    if (!trimmed) return;
    if (images.length >= 6) {
      showToast("Maximum 6 images allowed per product.");
      return;
    }

    const defaultLabel: ProductImageLabel = images.length === 0 ? "Front view" : "Other";
    const newItem: ProductImage = {
      id: `temp-${Date.now()}`,
      productId: product.id,
      url: trimmed,
      thumbUrl: trimmed,
      width: 1000,
      height: 1000,
      label: defaultLabel,
      alt: `${product.name} — ${defaultLabel.toLowerCase()}`,
      position: images.length,
    };

    setImages((prev) => [...prev, newItem].map((img, idx) => ({ ...img, position: idx })));
    setCustomUrlInput("");
    showToast("✓ Added image from URL.");
  };

  // Add via Preset
  const handleAddPreset = (preset: { label: string; url: string }) => {
    if (images.length >= 6) {
      showToast("Maximum 6 images allowed per product.");
      return;
    }

    const defaultLabel: ProductImageLabel = images.length === 0 ? "Front view" : "Other";
    const newItem: ProductImage = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      url: preset.url,
      thumbUrl: preset.url,
      width: 1000,
      height: 1000,
      label: defaultLabel,
      alt: `${product.name} — ${preset.label.toLowerCase()}`,
      position: images.length,
    };

    setImages((prev) => [...prev, newItem].map((img, idx) => ({ ...img, position: idx })));
    showToast(`✓ Added preset: ${preset.label}`);
  };

  // Reorder / Movement actions
  const handleMove = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((img, idx) => ({ ...img, position: idx }));
    });
  };

  const handleSetCover = (index: number) => {
    if (index === 0) return;
    handleMove(index, 0);
    setActivePreviewIndex(0);
    showToast("★ Photo set as primary storefront cover.");
  };

  const handleDelete = (index: number) => {
    if (images.length <= 1) {
      showToast("Cannot delete: Every product requires at least 1 image.");
      return;
    }
    const label = images[index]?.label || `Photo #${index + 1}`;
    if (!window.confirm(`Delete ${label}?`)) return;

    setImages((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.map((img, idx) => ({ ...img, position: idx }));
    });
    if (activePreviewIndex >= images.length - 1) {
      setActivePreviewIndex(Math.max(0, images.length - 2));
    }
    showToast("✓ Photo removed from gallery.");
  };

  // Update label or alt text
  const handleUpdateItem = (index: number, updates: Partial<ProductImage>) => {
    setImages((prev) =>
      prev.map((img, idx) => (idx === index ? { ...img, ...updates } : img))
    );
  };

  // Datasheet file upload handler
  const handleDatasheetFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      showToast("⚠️ Please upload a valid PDF document datasheet.");
      return;
    }

    setIsUploadingDatasheet(true);
    showToast(`Uploading datasheet "${file.name}"...`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success && data.fileUrl) {
        setDatasheetUrlInput(data.fileUrl);
        showToast(`✓ Datasheet stored: ${file.name}`);
      } else {
        const fallback = `/downloads/${file.name.toLowerCase().replace(/[^a-z0-9.]/g, "-")}`;
        setDatasheetUrlInput(fallback);
        showToast(`✓ Datasheet linked: ${fallback}`);
      }
    } catch {
      const fallback = `/downloads/${file.name.toLowerCase().replace(/[^a-z0-9.]/g, "-")}`;
      setDatasheetUrlInput(fallback);
      showToast(`✓ Datasheet linked: ${fallback}`);
    } finally {
      setIsUploadingDatasheet(false);
    }
  };

  // Save Gallery Action
  const handleSaveGallery = async () => {
    if (images.length === 0) {
      showToast("Please add at least 1 photo for this product.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Save gallery via PUT endpoint
      const res = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}/images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save product images.");
      }

      const savedImages: ProductImage[] = data.images;
      const coverUrl: string = data.coverUrl || savedImages[0]?.url || "";

      // 2. If datasheet URL changed, also update product
      const newDatasheet = datasheetUrlInput.trim() || undefined;
      if (newDatasheet !== product.datasheetPdfUrl) {
        try {
          await fetch("/api/products", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: product.id,
              datasheetPdfUrl: newDatasheet,
              imageUrl: coverUrl,
            }),
          });
        } catch (dsErr) {
          console.warn("[Datasheet patch warning]:", dsErr);
        }
      }

      onSaveSuccess(savedImages, coverUrl, newDatasheet);
      showToast(`✓ Product gallery (${savedImages.length}/6 photos) saved to PostgreSQL!`);
      onClose();
    } catch (err: any) {
      showToast(`❌ Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const previewImage = images[activePreviewIndex] || images[0] || null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 md:p-6 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* Hidden file input for Replace action */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleReplaceFileChange}
        className="hidden"
      />

      <div className="w-full max-w-[1180px] bg-white border border-slate-200 rounded-[24px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* ======================================================== */}
        {/* MODAL HEADER                                             */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-unitech-red border border-red-200 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-slate-900 text-lg leading-tight">
                  Product Multi-Image Gallery Manager
                </h3>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    images.length >= 4
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  {images.length} / 6 photos
                </span>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {product.modelCode} · {product.name} · {product.categoryLabel}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ======================================================== */}
        {/* MODAL BODY (SCROLLABLE)                                  */}
        {/* ======================================================== */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: Gallery Slots & Add Options */}
            <div className="lg:col-span-8 space-y-5">
              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(false);
                  if (e.dataTransfer.files) {
                    handleUploadFiles(e.dataTransfer.files);
                  }
                }}
                onClick={() => {
                  if (images.length < 6 && fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
                className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                  images.length >= 6
                    ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
                    : isDraggingFile
                    ? "border-unitech-red bg-red-50/40 cursor-copy"
                    : "border-slate-300 hover:border-unitech-red bg-slate-50/50 hover:bg-red-50/20 cursor-pointer"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  disabled={images.length >= 6 || isUploading}
                  onChange={(e) => {
                    if (e.target.files) handleUploadFiles(e.target.files);
                  }}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center gap-1.5">
                  {isUploading ? (
                    <div className="flex items-center gap-2 text-unitech-red font-bold text-xs">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Optimizing & storing photos with Sharp pipeline...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-unitech-red mb-0.5" />
                      <span className="text-slate-900 font-bold text-xs block">
                        {images.length >= 6
                          ? "Maximum 6 photos reached"
                          : `Drop photos here or click to browse (up to ${6 - images.length} more)`}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        PNG, JPG, WEBP · Min 800×800 (1000×1000 recommended) · Max 5 MB each
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Or Add by URL & Presets */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                {/* URL Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Or enter direct image URL (/images/products/... or https://...)"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddUrl();
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-unitech-red"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    disabled={!customUrlInput.trim() || images.length >= 6}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs transition-colors shrink-0"
                  >
                    + Add URL
                  </button>
                </div>

                {/* Predefined Factory Presets */}
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    Or select from Factory Visual Presets library:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddPreset(preset)}
                        disabled={images.length >= 6}
                        className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 text-left transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-md bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <span className="text-[11px] font-medium text-slate-800 line-clamp-1 group-hover:text-unitech-red">
                          {preset.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3x2 Grid of Photos */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-heading font-black text-slate-900 text-sm">
                    Gallery Slots (1 to 6 photos):
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Slot #1 is the primary storefront cover photo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {images.map((img, index) => {
                    const isCover = index === 0;
                    return (
                      <div
                        key={img.id || index}
                        draggable
                        onDragStart={() => setDraggedSlotIndex(index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggedSlotIndex !== null && draggedSlotIndex !== index) {
                            handleMove(draggedSlotIndex, index);
                          }
                          setDraggedSlotIndex(null);
                        }}
                        className={`p-3 rounded-2xl border transition-all flex flex-col justify-between space-y-2.5 bg-white ${
                          isCover
                            ? "border-amber-300 ring-2 ring-amber-400/20 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 shadow-2xs"
                        }`}
                      >
                        {/* Top: Slot badge + Cover Tag + Delete */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold text-[11px] flex items-center justify-center">
                              {index + 1}
                            </span>
                            {isCover ? (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                                Cover
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetCover(index)}
                                className="text-[10px] text-slate-500 hover:text-amber-700 hover:underline font-bold"
                                title="Promote this photo to Slot #1 cover"
                              >
                                Set as cover
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDelete(index)}
                            disabled={images.length <= 1}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                            title={
                              images.length <= 1
                                ? "Cannot delete the only photo"
                                : "Delete photo"
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Thumbnail View */}
                        <div
                          onClick={() => setActivePreviewIndex(index)}
                          className="relative aspect-square rounded-xl bg-white border border-slate-200 p-2 flex items-center justify-center cursor-pointer group overflow-hidden"
                          title="Click to preview on the right"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.thumbUrl || img.url}
                            alt={img.alt || `Photo ${index + 1}`}
                            className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-bold transition-opacity">
                            Preview
                          </div>
                        </div>

                        {/* View Label Dropdown */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">
                            Photo View Label:
                          </label>
                          <select
                            value={img.label}
                            onChange={(e) =>
                              handleUpdateItem(index, {
                                label: e.target.value as ProductImageLabel,
                              })
                            }
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 font-medium text-xs focus:outline-none focus:border-unitech-red"
                          >
                            {STANDARD_LABELS.map((lbl) => (
                              <option key={lbl} value={lbl}>
                                {lbl}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Alt Text Input */}
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                            <span>Alt Text:</span>
                            <span className="font-mono text-slate-400">
                              {(img.alt || "").length}/125
                            </span>
                          </div>
                          <input
                            type="text"
                            maxLength={125}
                            value={img.alt}
                            onChange={(e) =>
                              handleUpdateItem(index, { alt: e.target.value })
                            }
                            placeholder={`${product.name} — ${img.label.toLowerCase()}`}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-unitech-red"
                          />
                        </div>

                        {/* Card Footer: Reorder & Replace */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMove(index, index - 1)}
                              disabled={index === 0}
                              className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700"
                              title="Move left"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMove(index, index + 1)}
                              disabled={index === images.length - 1}
                              className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700"
                              title="Move right"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setReplaceTargetIndex(index);
                              if (replaceInputRef.current) {
                                replaceInputRef.current.click();
                              }
                            }}
                            className="text-[11px] font-bold text-unitech-red hover:underline"
                          >
                            Replace
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty Slot Placeholders up to 6 */}
                  {Array.from({ length: 6 - images.length }).map((_, emptyIdx) => {
                    const slotNum = images.length + emptyIdx + 1;
                    return (
                      <div
                        key={`empty-${emptyIdx}`}
                        onClick={() => {
                          if (fileInputRef.current) fileInputRef.current.click();
                        }}
                        className="p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-500 mb-2">
                          <Plus className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 block">
                          Slot #{slotNum} Empty
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          Click to add photo
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Technical PDF Datasheet Section (Preserved) */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <FileText className="w-4 h-4 text-unitech-red" />
                    <span>Product Technical PDF Datasheet (for Download Button):</span>
                  </label>
                  {datasheetUrlInput && (
                    <a
                      href={datasheetUrlInput}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-unitech-red hover:underline font-bold flex items-center gap-1"
                    >
                      <span>View Current PDF</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="relative border-2 border-dashed border-slate-300 hover:border-unitech-red rounded-2xl p-4 text-center bg-slate-50/50 hover:bg-red-50/20 transition-all cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleDatasheetFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <FileDown className="w-6 h-6 text-unitech-red mx-auto mb-1" />
                  {isUploadingDatasheet ? (
                    <span className="inline-flex items-center gap-1.5 text-amber-600 text-xs font-bold">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Uploading PDF to database...
                    </span>
                  ) : datasheetUrlInput ? (
                    <div className="text-emerald-700 font-bold text-xs">
                      <span>✓ Datasheet active: {datasheetUrlInput}</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-slate-900 font-bold block text-xs">
                        Click or drag new product PDF datasheet here
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Updates the &quot;Download PDF Datasheet&quot; button on product page instantly
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="e.g. /downloads/utr-1006-datasheet.pdf"
                    value={datasheetUrlInput}
                    onChange={(e) => setDatasheetUrlInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-unitech-red font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Live Storefront PDP Preview */}
            <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5 sticky top-0">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-heading font-black text-slate-900 text-xs flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-unitech-red" />
                  Live Storefront Preview
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {images.length > 0 ? `${activePreviewIndex + 1} / ${images.length}` : "No photos"}
                </span>
              </div>

              {/* Mini Preview Stage */}
              <div className="flex items-start gap-2.5">
                {/* Mini Left Thumbnail Rail */}
                {images.length > 1 && (
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePreviewIndex(idx)}
                        className={`w-9 h-9 rounded-lg border bg-white p-0.5 flex items-center justify-center overflow-hidden transition-all ${
                          idx === activePreviewIndex
                            ? "border-unitech-red ring-2 ring-unitech-red/20 shadow-xs"
                            : "border-slate-200 opacity-60 hover:opacity-100"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.thumbUrl || img.url}
                          alt={img.label}
                          className="max-w-full max-h-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Main Mini Stage Container */}
                <div className="flex-1 relative aspect-square rounded-xl bg-white border border-slate-200 p-3 flex items-center justify-center overflow-hidden">
                  {/* CCTV Corner Crosshairs */}
                  <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-slate-300" />
                  <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t border-r border-slate-300" />
                  <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b border-l border-slate-300" />
                  <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r border-slate-300" />

                  {previewImage ? (
                    <div className="relative z-10 w-full h-full flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewImage.url}
                        alt={previewImage.alt || product.name}
                        className="max-w-full max-h-full object-contain mix-blend-multiply"
                      />
                    </div>
                  ) : (
                    <div className="text-center text-slate-400">
                      <Camera className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      <span className="text-[10px] font-mono block">No Photo</span>
                    </div>
                  )}

                  {/* Micro label chip */}
                  {previewImage?.label && (
                    <div className="absolute bottom-2 left-2 z-20">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/90 text-slate-800 border border-slate-200 shadow-2xs backdrop-blur-xs flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-unitech-red" />
                        {previewImage.label}
                      </span>
                    </div>
                  )}

                  {/* Micro counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-2 right-2 z-20">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900/80 text-white">
                        {activePreviewIndex + 1}/{images.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* PDP Metadata snapshot */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                <span className="text-[10px] font-mono font-bold text-unitech-red bg-red-50 border border-red-200 px-1.5 py-0.2 rounded uppercase">
                  {product.modelCode}
                </span>
                <h4 className="font-heading font-black text-slate-900 text-xs line-clamp-1">
                  {product.name}
                </h4>
                <div className="text-[11px] text-slate-500">
                  Storefront gallery will support:
                  <ul className="list-disc pl-4 mt-1 space-y-0.5 text-slate-600">
                    <li>38% cursor lens + 260% zoom flyout</li>
                    <li>Full-screen viewer modal with keyboard nav</li>
                    <li>Mobile swipe carousel + pagination pill</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODAL FOOTER                                             */}
        {/* ======================================================== */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/70 shrink-0">
          <div className="text-xs text-slate-500">
            Changes apply to storefront PDP, catalogue card covers, and quick-specs immediately.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveGallery}
              disabled={isSaving || isUploading || images.length === 0}
              className="px-5 py-2.5 rounded-xl bg-unitech-red hover:bg-unitech-darkred disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-unitech-red/30 transition-all"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Gallery...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Gallery ({images.length}/6)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
