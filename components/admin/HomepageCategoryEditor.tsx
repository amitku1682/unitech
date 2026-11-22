"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Layers,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Edit3,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";
import { HomepageCategoryCard, Category } from "@/lib/types";

interface HomepageCategoryEditorProps {
  onShowToast: (msg: string) => void;
}

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  "cctv-cameras": "/images/categories/cctv-cameras.jpg",
  "dvr-nvr": "/images/categories/dvr-nvr-recorders.jpg",
  "networking-poe": "/images/categories/networking-poe.jpg",
  cables: "/images/categories/surveillance-cables.jpg",
  "network-racks": "/images/categories/dvr-server-racks.jpg",
  "power-accessories": "/images/categories/power-supplies-smps.jpg",
};

const CATEGORY_TAGLINES: Record<string, string> = {
  "cctv-cameras": "Sharp by day, colour by night",
  "dvr-nvr": "Record more, store less",
  "networking-poe": "Power and data on one cable",
  cables: "100% copper, zero signal loss",
  "network-racks": "Neat, secure installs",
  "power-accessories": "Clean, surge-protected power",
};

const FACTORY_SCENES = [
  {
    categoryId: "cctv-cameras",
    label: "CCTV Cameras",
    imageUrl: "/images/categories/cctv-cameras.jpg",
  },
  {
    categoryId: "dvr-nvr",
    label: "DVR & NVR Recorders",
    imageUrl: "/images/categories/dvr-nvr-recorders.jpg",
  },
  {
    categoryId: "networking-poe",
    label: "Networking & PoE",
    imageUrl: "/images/categories/networking-poe.jpg",
  },
  {
    categoryId: "cables",
    label: "Surveillance Cables",
    imageUrl: "/images/categories/surveillance-cables.jpg",
  },
  {
    categoryId: "network-racks",
    label: "DVR & Server Racks",
    imageUrl: "/images/categories/dvr-server-racks.jpg",
  },
  {
    categoryId: "power-accessories",
    label: "Power Supplies & SMPS",
    imageUrl: "/images/categories/power-supplies-smps.jpg",
  },
];

const BASELINE_CARD_IDS = new Set([
  "cat-cctv-cameras",
  "cat-network-racks",
  "cat-networking-poe",
  "cat-dvr-nvr",
  "cat-cables",
  "cat-power-accessories",
]);

function isBaselineCard(card: HomepageCategoryCard): boolean {
  if (!card) return false;
  return BASELINE_CARD_IDS.has(card.id);
}

function getCardImage(card: Partial<HomepageCategoryCard> | null | undefined): string {
  if (!card) return "/images/categories/cctv-cameras.jpg";
  return (
    card.backgroundImageUrl ||
    (card.categoryId ? DEFAULT_CATEGORY_IMAGES[card.categoryId] : undefined) ||
    card.productImageUrls?.[0] ||
    "/images/categories/cctv-cameras.jpg"
  );
}

export function HomepageCategoryEditor({ onShowToast }: HomepageCategoryEditorProps) {
  const [cards, setCards] = useState<HomepageCategoryCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);

  // Edit drawer state
  const [editForm, setEditForm] = useState<HomepageCategoryCard | null>(null);
  const [previewHover, setPreviewHover] = useState<boolean>(false);
  const [newChipInput, setNewChipInput] = useState<string>("");
  const [isUploadingBg, setIsUploadingBg] = useState<boolean>(false);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation modal state
  const [cardToDelete, setCardToDelete] = useState<HomepageCategoryCard | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setCategories(json.data);
        }
      })
      .catch(() => { });
  }, []);

  // Fetch current cards from admin API
  useEffect(() => {
    fetch("/api/admin/homepage-categories")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const loaded = json.data.map((c: HomepageCategoryCard) => ({
            ...c,
            backgroundImageUrl:
              c.backgroundImageUrl ||
              DEFAULT_CATEGORY_IMAGES[c.categoryId] ||
              "/images/categories/cctv-cameras.jpg",
            scenePreset: "custom_image",
          }));
          setCards(loaded);
        }
      })
      .catch((err) => {
        console.warn("[Admin Category Editor fetch warning]:", err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Reorder: Move Up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...cards];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    updated.forEach((c, idx) => {
      c.position = idx;
    });
    setCards(updated);
  };

  // Reorder: Move Down
  const handleMoveDown = (index: number) => {
    if (index >= cards.length - 1) return;
    const updated = [...cards];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    updated.forEach((c, idx) => {
      c.position = idx;
    });
    setCards(updated);
  };

  // Toggle visibility
  const handleToggleVisibility = (index: number) => {
    const updated = [...cards];
    updated[index] = {
      ...updated[index],
      isVisible: !updated[index].isVisible,
    };
    setCards(updated);
  };

    // Open Add Card Modal
  const handleOpenAdd = () => {
    const activeCats = categories.filter((c) => c.isActive !== false);
    const defaultCat = activeCats[0] || categories[0];
    const defaultCatId = defaultCat?.id || "cctv-cameras";
    const defaultCount = defaultCat?.productCount || 0;

    const newCard: HomepageCategoryCard = {
      id: `cat-card-${defaultCatId}-${Date.now()}`,
      categoryId: defaultCatId,
      position: cards.length,
      isVisible: true,
      title: "",
      badge: "NEW",
      buttonText: "Explore Catalogue",
      description: "",
      chips: [],
      scenePreset: "custom_image",
      backgroundImageUrl: "",
      productImageUrls: [],
      linkUrl: `/catalogue?category=${defaultCatId}`,
      skuCount: defaultCount,
    };

    setEditingCardIndex(-1);
    setEditForm(newCard);
    setPreviewHover(false);
    setNewChipInput("");
  };

  // Open Edit Modal
  const handleOpenEdit = (index: number) => {
    const card = JSON.parse(JSON.stringify(cards[index])) as HomepageCategoryCard;
    if (!card.backgroundImageUrl) {
      card.backgroundImageUrl = DEFAULT_CATEGORY_IMAGES[card.categoryId] || "/images/categories/cctv-cameras.jpg";
    }
    card.scenePreset = "custom_image";
    setEditingCardIndex(index);
    setEditForm(card);
    setPreviewHover(false);
    setNewChipInput("");
  };

  // Close Edit Modal
  const handleCloseEdit = () => {
    setEditingCardIndex(null);
    setEditForm(null);
  };

  // Save changes from Edit / Add Modal to cards array AND persist to PostgreSQL immediately!
  const handleApplyEdit = async () => {
    if (editingCardIndex === null || !editForm) return;

    if (!editForm.title.trim()) {
      alert("Title is required.");
      return;
    }
    if (!editForm.description.trim()) {
      alert("Description is required.");
      return;
    }
    if (!editForm.categoryId) {
      alert("Linked catalogue category is required.");
      return;
    }

    const cleanedCard: HomepageCategoryCard = {
      ...editForm,
      id: editForm.id || `cat-card-${editForm.categoryId}-${Date.now()}`,
      title: editForm.title.trim().substring(0, 40),
      badge: editForm.badge?.trim() ? editForm.badge.trim().substring(0, 32) : undefined,
      buttonText: editForm.buttonText?.trim() ? editForm.buttonText.trim().substring(0, 64) : "Explore Catalogue",
      description: editForm.description.trim().substring(0, 110),
      chips: editForm.chips.map((c) => c.trim().substring(0, 22)).filter(Boolean).slice(0, 4),
      backgroundImageUrl:
        editForm.backgroundImageUrl ||
        DEFAULT_CATEGORY_IMAGES[editForm.categoryId] ||
        "/images/categories/cctv-cameras.jpg",
      linkUrl: editForm.linkUrl || `/catalogue?category=${editForm.categoryId}`,
      scenePreset: "custom_image",
    };

    let updated: HomepageCategoryCard[];
    const isAdding = editingCardIndex === -1;
    if (isAdding) {
      cleanedCard.position = cards.length;
      updated = [...cards, cleanedCard];
    } else {
      updated = [...cards];
      updated[editingCardIndex] = cleanedCard;
    }

    setCards(updated);
    handleCloseEdit();

    // Auto-persist directly to PostgreSQL so the user never needs a 2-step save!
    try {
      setIsSaving(true);
      const res = await fetch("/api/admin/homepage-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards: updated }),
      });
      const json = await res.json();
      if (json.success) {
        if (Array.isArray(json.data)) {
          setCards(
            json.data.map((c: HomepageCategoryCard) => ({
              ...c,
              backgroundImageUrl:
                c.backgroundImageUrl ||
                DEFAULT_CATEGORY_IMAGES[c.categoryId] ||
                "/images/categories/cctv-cameras.jpg",
              scenePreset: "custom_image",
            }))
          );
        }
        onShowToast(
          isAdding
            ? "New category card added & published live to homepage!"
            : "Category card saved to database and live on homepage!"
        );
      } else {
        alert(json.error || "Failed to save category showcase.");
      }
    } catch (err: any) {
      console.error("[Auto-save error]:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Custom Category Card Handlers
  const handleDeleteClick = (card: HomepageCategoryCard) => {
    if (isBaselineCard(card)) {
      alert("Baseline system category cards are protected and cannot be deleted.");
      return;
    }
    setCardToDelete(card);
  };

  const handleConfirmDelete = async () => {
    if (!cardToDelete) return;
    const updated = cards
      .filter((c) => c.id !== cardToDelete.id)
      .map((c, idx) => ({ ...c, position: idx }));
    setCards(updated);
    setCardToDelete(null);

    try {
      setIsDeleting(true);
      const res = await fetch("/api/admin/homepage-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards: updated }),
      });
      const json = await res.json();
      if (json.success) {
        if (Array.isArray(json.data)) {
          setCards(
            json.data.map((c: HomepageCategoryCard) => ({
              ...c,
              backgroundImageUrl:
                c.backgroundImageUrl ||
                DEFAULT_CATEGORY_IMAGES[c.categoryId] ||
                "/images/categories/cctv-cameras.jpg",
              scenePreset: "custom_image",
            }))
          );
        }
        onShowToast("Category card deleted successfully!");
      } else {
        alert(json.error || "Failed to delete category card.");
      }
    } catch (err: any) {
      console.error("[Delete error]:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Add Spec Chip
  const handleAddChip = () => {
    if (!editForm) return;
    const chip = newChipInput.trim().substring(0, 22);
    if (!chip) return;
    if (editForm.chips.length >= 4) {
      alert("Maximum 4 chips allowed per category card.");
      return;
    }
    setEditForm({
      ...editForm,
      chips: [...editForm.chips, chip],
    });
    setNewChipInput("");
  };

  // Remove Spec Chip
  const handleRemoveChip = (chipIdx: number) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      chips: editForm.chips.filter((_, idx) => idx !== chipIdx),
    });
  };

  // Upload Custom Background Image
  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editForm) return;

    setIsUploadingBg(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/admin/uploads/product-image", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (json.success && json.url) {
        setEditForm({
          ...editForm,
          scenePreset: "custom_image",
          backgroundImageUrl: json.url,
        });
        onShowToast("Card background image uploaded & auto-framed to Unitech standard (480×620 px)!");
      } else {
        alert(json.error || "Failed to upload image.");
      }
    } catch (err: any) {
      alert(err.message || "Upload error");
    } finally {
      setIsUploadingBg(false);
      if (bgFileInputRef.current) bgFileInputRef.current.value = "";
    }
  };

  // Select Official Factory Scene
  const handleSelectFactoryScene = (url: string) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      scenePreset: "custom_image",
      backgroundImageUrl: url,
    });
    onShowToast("Assigned Unitech factory scene to card!");
  };

  // Reset Image to this category's factory default
  const handleResetCurrentFactory = () => {
    if (!editForm) return;
    const defaultImg =
      DEFAULT_CATEGORY_IMAGES[editForm.categoryId] || "/images/categories/cctv-cameras.jpg";
    setEditForm({
      ...editForm,
      scenePreset: "custom_image",
      backgroundImageUrl: defaultImg,
    });
    onShowToast("Restored factory default scene image!");
  };

  // Save All Changes to PostgreSQL and invalidate edge cache
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/homepage-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards }),
      });
      const json = await res.json();
      if (json.success) {
        if (Array.isArray(json.data)) {
          setCards(
            json.data.map((c: HomepageCategoryCard) => ({
              ...c,
              backgroundImageUrl:
                c.backgroundImageUrl ||
                DEFAULT_CATEGORY_IMAGES[c.categoryId] ||
                "/images/categories/cctv-cameras.jpg",
              scenePreset: "custom_image",
            }))
          );
        }
        onShowToast("Homepage categories showcase saved and edge cache invalidated!");
      } else {
        alert(json.error || "Failed to save category showcase.");
      }
    } catch (err: any) {
      alert(err.message || "Network error while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to Factory Defaults
  const handleResetDefaults = () => {
    if (confirm("Reset all category cards to factory defaults? All official 960×1240 scenes will be restored.")) {
      const defaults: HomepageCategoryCard[] = (categories.length > 0 ? categories : []).map((c, idx) => ({
        id: `card-${c.id}`,
        categoryId: c.id,
        position: idx,
        isVisible: true,
        title: c.name,
        description: c.description || "Direct OEM manufacturing & supply",
        chips: c.series?.map((s) => s.label).slice(0, 3) || [],
        scenePreset: "custom_image" as const,
        backgroundImageUrl: c.coverImageUrl || c.image || DEFAULT_CATEGORY_IMAGES[c.id] || "/images/categories/cctv-cameras.jpg",
        productImageUrls: [],
        linkUrl: `/catalogue?category=${c.id}`,
        skuCount: c.productCount || 10,
      }));
      setCards(defaults);
      onShowToast("Restored factory defaults in buffer. Click 'Save All Changes' to save.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-unitech-red border border-red-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Storefront Showcase Editor</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Homepage Manufacturing Categories Row
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Reorder cards, customize full-bleed scene images (480×620 standard), and edit copy with instant live preview.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Category Card</span>
          </button>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAll}
            className="px-5 py-2.5 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving to Database..." : "Save All Changes"}</span>
          </button>
        </div>
      </div>

      {/* Cards List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
              Active Category Cards ({cards.filter((c) => c.isVisible).length} / {cards.length} Visible)
            </span>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
              Live SKU Calculation Active
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Use ↑ / ↓ to adjust slide sequence on homepage
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {cards.map((card, idx) => {
            const cardImg = getCardImage(card);

            return (
              <div
                key={card.id || card.categoryId || idx}
                className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${!card.isVisible ? "bg-slate-50/70 opacity-60" : "hover:bg-slate-50/50"
                  }`}
              >
                {/* Left: Reorder arrows + Preview + Details */}
                <div className="flex items-center gap-4">
                  {/* Position Arrows */}
                  <div className="flex flex-col gap-1 items-center">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveUp(idx)}
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-600 transition-colors"
                      title="Move card up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      disabled={idx === cards.length - 1}
                      onClick={() => handleMoveDown(idx)}
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-600 transition-colors"
                      title="Move card down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Visual Scene Mini Card Thumbnail (Framed Full Bleed) */}
                  <div className="w-16 h-20 sm:w-20 sm:h-26 rounded-xl relative overflow-hidden shrink-0 border border-slate-300 shadow-2xs bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cardImg}
                      alt={card.title}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>

                  {/* Title & Category Details */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                        {card.title}
                      </h4>
                      <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                        {card.categoryId}
                      </span>
                      <span className="text-[10px] font-bold text-unitech-red bg-red-50 border border-red-200/60 px-2 py-0.5 rounded-full">
                        {card.skuCount ?? 10} Live SKUs
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                      {card.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-semibold text-slate-400">
                        Standard Frame: <span className="text-emerald-700 font-mono">480×620 px Full-Bleed</span>
                      </span>
                      <span className="text-slate-300">·</span>
                      {card.chips.slice(0, 3).map((chip, cIdx) => (
                        <span
                          key={cIdx}
                          className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  {/* Visibility Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleVisibility(idx)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${card.isVisible
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "border-slate-300 bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                  >
                    {card.isVisible ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Visible</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hidden</span>
                      </>
                    )}
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(idx)}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Card</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================= */}
      {/* EDIT MODAL / DRAWER WITH UNITECH DESIGN SYSTEM PREVIEW        */}
      {/* ============================================================= */}
{/* ============================================================= */}
      {/* DELETE CONFIRMATION MODAL                                     */}
      {/* ============================================================= */}
      {cardToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-black text-lg text-slate-900">Delete Category Card</h3>
                <p className="text-xs text-slate-500">This action will remove the card from the homepage showcase.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete the homepage category card <strong>&quot;{cardToDelete.title}&quot;</strong>?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCardToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Card"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-unitech-red flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-lg sm:text-xl text-slate-900">
                    Edit Category Card: {editForm.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update card image, typography, spec chips, and target destination link.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseEdit}
                className="w-8 h-8 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Split Form + Live Preview */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Form Controls (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                {/* Category ID & Live SKU Pill */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hardware Category Mapping *
                  </label>
                  <select
                    value={editForm.categoryId}
                    onChange={(e) => {
                      const catId = e.target.value;
                      const cat = categories.find((c) => c.id === catId);
                      const count = cat?.productCount || 0;
                      setEditForm({
                        ...editForm,
                        categoryId: catId,
                        skuCount: count > 0 ? count : (editForm.skuCount || 10),
                        linkUrl: `/catalogue?category=${catId}`,
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-red-500 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Live SKU Count: <span className="font-bold text-slate-900">{editForm.skuCount ?? 10} SKUs</span> (queried dynamically from products table).
                  </p>
                </div>

                {/* Card Title (max 40) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Card Title *
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {editForm.title.length}/40
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={40}
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:border-red-500"
                    placeholder="e.g. CCTV Cameras"
                  />
                </div>

                {/* Description (max 110) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Description Subtext *
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {editForm.description.length}/110
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={110}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-red-500 leading-relaxed"
                    placeholder="Brief highlight of features, specs, and warranty..."
                  />
                </div>

                {/* Spec Chips (up to 4 items, max 22 chars each) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <span>Feature Spec Chips</span>
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        {editForm.chips.length} / 4 chips
                      </span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">Max 22 chars per chip</span>
                  </div>

                  {/* Existing Chips List */}
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {editForm.chips.map((chip, chipIdx) => (
                      <span
                        key={chipIdx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 shadow-xs"
                      >
                        <span>{chip}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChip(chipIdx)}
                          className="w-4 h-4 rounded-full hover:bg-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
                          title="Remove this chip"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {editForm.chips.length === 0 && (
                      <span className="text-xs text-slate-400 italic">No spec chips added yet. Add up to 4 chips below.</span>
                    )}
                  </div>

                  {/* Add New Chip Input & Action */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          maxLength={22}
                          value={newChipInput}
                          onChange={(e) => setNewChipInput(e.target.value)}
                          disabled={editForm.chips.length >= 4}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddChip();
                            }
                          }}
                          placeholder={
                            editForm.chips.length >= 4
                              ? "Maximum 4 chips reached (click × above to remove one)"
                              : "e.g. 4MP & 8MP 4K (max 22 chars)"
                          }
                          className="w-full px-3 py-1.5 pr-14 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-red-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">
                          {newChipInput.length}/22
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddChip}
                        disabled={editForm.chips.length >= 4 || !newChipInput.trim()}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-black disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Chip</span>
                      </button>
                    </div>

                    {editForm.chips.length >= 4 ? (
                      <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Maximum 4 chips reached for this category card. Click the <strong>×</strong> on any chip above to remove or replace it.</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        Type a short feature and press Enter or click <strong>Add Chip</strong> ({4 - editForm.chips.length} remaining).
                      </p>
                    )}
                  </div>
                </div>

                {/* ============================================================= */}
                {/* UNITECH CARD BACKGROUND IMAGE & FRAMING SYSTEM                */}
                {/* ============================================================= */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-unitech-red" />
                      <span className="text-xs font-black uppercase text-slate-900 tracking-wider">
                        Card Background Image & Frame
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">
                      Standard: 480 × 620 px
                    </span>
                  </div>

                  {/* Specification Guidance Callout */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-[11.5px] text-slate-600 leading-relaxed space-y-1">
                    <p className="font-semibold text-slate-800">
                      Unitech Hardware Card Design System Specification:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-500 text-[11px]">
                      <li>
                        <strong>Standard Ratio:</strong> 480 × 620 px (or 960 × 1240 px 2× Retina), aspect ratio ~12:15.5.
                      </li>
                      <li>
                        <strong>Full-Bleed Framing:</strong> Images are auto-framed with <code className="font-mono text-slate-700 bg-slate-100 px-1 rounded">object-cover</code> to fill the complete rounded frame without blank bars or distortion.
                      </li>
                      <li>
                        <strong>Formats:</strong> JPG, PNG, or WebP.
                      </li>
                    </ul>
                  </div>

                  {/* Current Image Preview & Upload Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white p-3.5 rounded-xl border border-slate-200">
                    <div className="w-20 h-26 rounded-lg overflow-hidden border border-slate-300 shrink-0 bg-slate-900 shadow-2xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getCardImage(editForm)}
                        alt="Current card preview"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">Current Scene Image:</span>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                          {editForm.backgroundImageUrl?.startsWith("/uploads/")
                            ? "Custom Uploaded Photo"
                            : "Factory Standard Scene"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="file"
                          ref={bgFileInputRef}
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          onChange={handleBgUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={isUploadingBg}
                          onClick={() => bgFileInputRef.current?.click()}
                          className="px-4 py-2 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploadingBg ? "Uploading..." : "Upload New Card Image"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleResetCurrentFactory}
                          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Restore factory default scene"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Restore Factory Scene</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Direct Image URL Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Direct Image Path / URL
                    </label>
                    <input
                      type="text"
                      value={editForm.backgroundImageUrl || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          backgroundImageUrl: e.target.value,
                          scenePreset: "custom_image",
                        })
                      }
                      placeholder="/images/categories/..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-800 bg-white"
                    />
                  </div>

                  {/* Quick-Select from 6 Official Factory Scenes */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Or Quick-Select from Official Factory Scenes:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {FACTORY_SCENES.map((scene) => {
                        const isCurrent = editForm.backgroundImageUrl === scene.imageUrl;
                        return (
                          <button
                            key={scene.categoryId}
                            type="button"
                            onClick={() => handleSelectFactoryScene(scene.imageUrl)}
                            className={`p-1.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${isCurrent
                              ? "border-unitech-red bg-red-50/50 ring-2 ring-red-500/20 shadow-xs"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                              }`}
                          >
                            <div className="w-9 h-12 rounded-md overflow-hidden shrink-0 border border-slate-300 bg-slate-900">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={scene.imageUrl}
                                alt={scene.label}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {scene.label}
                              </div>
                              <div className="text-[10px] text-slate-400">960×1240 Photo</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Destination Link URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Link URL *
                  </label>
                  <input
                    type="text"
                    value={editForm.linkUrl}
                    onChange={(e) => setEditForm({ ...editForm, linkUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-red-500"
                    placeholder="/catalogue?category=cctv-cameras"
                  />
                </div>
              </div>

              {/* Right Column: Live Interactive Preview (5 cols) */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                    Interactive Live Card Preview
                  </span>
                  {/* Resting vs Hover toggle */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPreviewHover(false)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${!previewHover
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900"
                        }`}
                    >
                      Resting State
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewHover(true)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${previewHover
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900"
                        }`}
                    >
                      Hover Expanded
                    </button>
                  </div>
                </div>

                {/* Scaled Preview Box matching storefront 480x620 proportion */}
                <div
                  onMouseEnter={() => setPreviewHover(true)}
                  onMouseLeave={() => setPreviewHover(false)}
                  className="w-full max-w-[340px] aspect-[480/620] rounded-[22px] overflow-hidden bg-[#111114] border border-white/10 shadow-2xl relative select-none cursor-pointer"
                >
                  {/* Layer 1: Full-Bleed Card Background Photo */}
                  <div className="absolute inset-0 w-full h-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getCardImage(editForm)}
                      alt={editForm.title}
                      className="w-full h-full object-cover object-center transition-all duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)]"
                      style={{
                        transform: previewHover ? "scale(1.06)" : "scale(1)",
                        filter: previewHover ? "brightness(0.55) blur(10px)" : "brightness(1)",
                      }}
                    />
                  </div>

                  {/* Layer 2: Readability Shade Overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-[4]"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(8,8,10,0.85) 0%, rgba(8,8,10,0.35) 35%, transparent 65%)",
                    }}
                  />

                  {/* Layer 3: Dark Layer Fades In On Hover */}
                  <div
                    className={`absolute inset-0 pointer-events-none transition-opacity duration-400 z-[5] ${previewHover ? "opacity-100" : "opacity-0"
                      }`}
                    style={{ background: "rgba(18, 18, 22, 0.55)" }}
                  />

                  {/* Layer 4: Resting State Info (Title only) */}
                  <div
                    className={`absolute bottom-6 left-5 right-5 z-10 flex flex-col gap-2 transition-opacity duration-250 ${previewHover ? "opacity-0 pointer-events-none" : "opacity-100"
                      }`}
                  >
                    <h3 className="font-heading font-extrabold text-white text-[24px] sm:text-[26px] leading-[1.1] tracking-tight">
                      {editForm.title || "Category Title"}
                    </h3>

                    <div className="text-[11px] text-white/50 italic pt-0.5">
                      Hover card or click &apos;Hover Expanded&apos; to view details
                    </div>
                  </div>

                  {/* Layer 5: Desktop Hikvision-Style Hover Block */}
                  <div
                    className={`absolute inset-0 z-20 flex flex-col p-6 pointer-events-none transition-all duration-400 ${previewHover
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-3"
                      }`}
                  >
                    <h3 className="font-heading font-extrabold text-[24px] text-white leading-tight tracking-tight">
                      {editForm.title || "Category Title"}
                    </h3>

                    <div className="my-3 border-t border-dashed border-white/35" />

                    <div className="text-xs font-bold text-white leading-snug">
                      {CATEGORY_TAGLINES[editForm.categoryId] || "Precision Engineered Surveillance"}
                    </div>

                    <p className="text-[11px] leading-relaxed text-white/90 font-normal mt-2 line-clamp-2">
                      {editForm.description}
                    </p>

                    {Array.isArray(editForm.chips) && editForm.chips.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {editForm.chips.map((chip, cIdx) => (
                          <span
                            key={cIdx}
                            className="text-[10px] font-semibold text-white/95 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-2 py-0.5"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-auto pt-3">
                      <span className="text-xs font-bold text-white">Browse Series</span>
                      <div className="w-5 h-5 rounded-full bg-[#E3141B] text-white flex items-center justify-center">
                        <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-3 text-xs text-slate-400">
                  Matches Unitech storefront 480 × 620 px hardware card design system.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/60">
              <button
                type="button"
                onClick={handleCloseEdit}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyEdit}
                className="px-5 py-2.5 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>{editingCardIndex === -1 ? "Create & Publish Card" : "Save & Update Card"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
