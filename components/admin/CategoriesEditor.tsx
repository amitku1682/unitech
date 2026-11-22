"use client";

import React, { useState, useEffect } from "react";
import {
  FolderTree,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  X,
  Upload,
  Layers,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Image as ImageIcon,
} from "lucide-react";
import { Category, CategorySeries } from "@/lib/types";

interface CategoriesEditorProps {
  onNotify?: (msg: string) => void;
  onCategoriesUpdated?: () => void;
}

export function CategoriesEditor({ onNotify, onCategoriesUpdated }: CategoriesEditorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isEditingCat, setIsEditingCat] = useState(false);
  const [catForm, setCatForm] = useState({
    id: "",
    name: "",
    shortLabel: "",
    description: "",
    coverImageUrl: "",
    isActive: true,
    showInMenu: true,
    showInFooter: true,
  });

  // Series Inline / Modal State
  const [newSeriesLabel, setNewSeriesLabel] = useState("");
  const [newSeriesSlug, setNewSeriesSlug] = useState("");
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
  const [editSeriesLabel, setEditSeriesLabel] = useState("");
  const [editSeriesSlug, setEditSeriesSlug] = useState("");

  // Error / Blocked Delete Alert
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [blockedDeleteCatId, setBlockedDeleteCatId] = useState<string | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      } else {
        setErrorMessage(data.error || "Failed to load categories");
      }
    } catch {
      setErrorMessage("Network error fetching categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const notify = (msg: string) => {
    if (onNotify) onNotify(msg);
    if (onCategoriesUpdated) onCategoriesUpdated();
  };

  // Reorder Categories
  const handleMoveCategory = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newCats = [...categories];
    const [moved] = newCats.splice(index, 1);
    newCats.splice(targetIndex, 0, moved);
    setCategories(newCats);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          orderedIds: newCats.map((c) => c.id),
        }),
      });
      const data = await res.json();
      if (data.success) {
        notify("Category order updated");
      } else {
        fetchCategories();
      }
    } catch {
      fetchCategories();
    }
  };

  // Category Open Modal
  const openNewCatModal = () => {
    setIsEditingCat(false);
    setCatForm({
      id: "",
      name: "",
      shortLabel: "",
      description: "",
      coverImageUrl: "",
      isActive: true,
      showInMenu: true,
      showInFooter: true,
    });
    setErrorMessage(null);
    setBlockedDeleteCatId(null);
    setIsCatModalOpen(true);
  };

  const openEditCatModal = (cat: Category) => {
    setIsEditingCat(true);
    setCatForm({
      id: cat.id,
      name: cat.name,
      shortLabel: cat.shortLabel || "",
      description: cat.description || "",
      coverImageUrl: cat.coverImageUrl || cat.image || "",
      isActive: cat.isActive,
      showInMenu: cat.showInMenu,
      showInFooter: cat.showInFooter,
    });
    setErrorMessage(null);
    setBlockedDeleteCatId(null);
    setIsCatModalOpen(true);
  };

  // Save Category
  const handleSaveCategory = async () => {
    if (!catForm.name.trim()) {
      setErrorMessage("Category name is required");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const slug = catForm.id.trim()
      ? catForm.id.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-")
      : catForm.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const payload = {
      id: slug,
      name: catForm.name.trim(),
      shortLabel: catForm.shortLabel.trim() || null,
      description: catForm.description.trim() || null,
      coverImageUrl: catForm.coverImageUrl.trim() || null,
      isActive: catForm.isActive,
      showInMenu: catForm.showInMenu,
      showInFooter: catForm.showInFooter,
    };

    try {
      const res = await fetch("/api/admin/categories", {
        method: isEditingCat ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setIsCatModalOpen(false);
        notify(isEditingCat ? "Category updated successfully" : "Category created successfully");
        fetchCategories();
      } else {
        setErrorMessage(data.error || "Failed to save category");
      }
    } catch {
      setErrorMessage("Network error saving category");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Category Status
  const handleToggleCatActive = async (cat: Category) => {
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cat.id, isActive: !cat.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        notify(`Category "${cat.name}" is now ${!cat.isActive ? "active" : "inactive"}`);
        fetchCategories();
      }
    } catch {
      notify("Failed to update status");
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;

    setErrorMessage(null);
    setBlockedDeleteCatId(null);

    try {
      const res = await fetch(`/api/admin/categories?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        notify(`Category "${name}" deleted`);
        fetchCategories();
      } else {
        setErrorMessage(data.error || "Cannot delete category");
        if (data.canDeactivate) {
          setBlockedDeleteCatId(id);
        }
      }
    } catch {
      setErrorMessage("Network error deleting category");
    }
  };

  // Deactivate Category directly from error prompt
  const handleDeactivateCategory = async (id: string) => {
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: false }),
      });
      const data = await res.json();
      if (data.success) {
        setErrorMessage(null);
        setBlockedDeleteCatId(null);
        notify(`Category deactivated successfully instead of deleting`);
        fetchCategories();
      }
    } catch {
      notify("Failed to deactivate category");
    }
  };

  // Cover Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/products/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.fileUrl) {
        setCatForm((prev) => ({ ...prev, coverImageUrl: data.fileUrl }));
        notify("Cover image uploaded to database");
      } else {
        alert(data.error || "Failed to upload image");
      }
    } catch {
      alert("Image upload failed");
    }
  };

  // ==========================================
  // SERIES MANAGEMENT
  // ==========================================

  const handleAddSeries = async (categoryId: string) => {
    if (!newSeriesLabel.trim()) return;

    const slug = newSeriesSlug.trim()
      ? newSeriesSlug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-")
      : newSeriesLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    try {
      const res = await fetch(`/api/admin/categories/${encodeURIComponent(categoryId)}/series`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newSeriesLabel.trim(),
          slug,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewSeriesLabel("");
        setNewSeriesSlug("");
        notify("Series added");
        fetchCategories();
      } else {
        alert(data.error || "Failed to add series");
      }
    } catch {
      alert("Failed to add series");
    }
  };

  const handleUpdateSeries = async (categoryId: string, seriesId: string) => {
    if (!editSeriesLabel.trim()) return;

    try {
      const res = await fetch(`/api/admin/categories/${encodeURIComponent(categoryId)}/series`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seriesId,
          label: editSeriesLabel.trim(),
          slug: editSeriesSlug.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingSeriesId(null);
        notify("Series updated");
        fetchCategories();
      } else {
        alert(data.error || "Failed to update series");
      }
    } catch {
      alert("Failed to update series");
    }
  };

  const handleToggleSeriesActive = async (categoryId: string, series: CategorySeries) => {
    try {
      const res = await fetch(`/api/admin/categories/${encodeURIComponent(categoryId)}/series`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seriesId: series.id,
          isActive: !series.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        notify(`Series "${series.label}" is now ${!series.isActive ? "active" : "inactive"}`);
        fetchCategories();
      }
    } catch {
      alert("Failed to update series");
    }
  };

  const handleDeleteSeries = async (categoryId: string, seriesId: string, label: string) => {
    if (!confirm(`Delete series "${label}"?`)) return;

    try {
      const res = await fetch(
        `/api/admin/categories/${encodeURIComponent(categoryId)}/series?seriesId=${encodeURIComponent(seriesId)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        notify("Series deleted");
        fetchCategories();
      } else {
        alert(data.error || "Failed to delete series");
      }
    } catch {
      alert("Failed to delete series");
    }
  };

  const handleMoveSeries = async (categoryId: string, index: number, direction: "up" | "down", currentSeries: CategorySeries[]) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentSeries.length) return;

    const list = [...currentSeries];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    try {
      const res = await fetch(`/api/admin/categories/${encodeURIComponent(categoryId)}/series`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          orderedIds: list.map((s) => s.id),
        }),
      });
      const data = await res.json();
      if (data.success) {
        notify("Series order updated");
        fetchCategories();
      }
    } catch {
      fetchCategories();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-indigo-600" />
            Categories & Series Studio
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage your hardware product categories, navigation menu ordering, series tags, and cover images stored in PostgreSQL.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCategories}
            disabled={isLoading}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors font-medium text-xs flex items-center gap-1.5"
            title="Refresh categories"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
            Refresh
          </button>
          <button
            onClick={openNewCatModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Category
          </button>
        </div>
      </div>

      {/* Error & Blocked Delete Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {blockedDeleteCatId && (
            <button
              onClick={() => handleDeactivateCategory(blockedDeleteCatId)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] shrink-0"
            >
              Deactivate Category Instead
            </button>
          )}
        </div>
      )}

      {/* Categories List */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading categories and series from database...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <FolderTree className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No categories found</h3>
          <p className="text-xs text-slate-400 mt-1">Get started by creating your first category.</p>
          <button
            onClick={openNewCatModal}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
          >
            Create Category
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat, idx) => {
            const isExpanded = expandedCatId === cat.id;
            const seriesList = cat.series || [];

            return (
              <div
                key={cat.id}
                className={`bg-white rounded-2xl border transition-all ${
                  !cat.isActive ? "border-slate-200 opacity-60 bg-slate-50/50" : "border-slate-200 shadow-xs"
                }`}
              >
                {/* Category Card Header */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Reorder & Thumbnail & Info */}
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => handleMoveCategory(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-100 rounded-md transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveCategory(idx, "down")}
                        disabled={idx === categories.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-100 rounded-md transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Cover Thumbnail */}
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {cat.coverImageUrl || cat.image ? (
                        <img
                          src={cat.coverImageUrl || cat.image}
                          alt={cat.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    {/* Details */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
                        <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">
                          {cat.id}
                        </code>
                        {cat.shortLabel && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold">
                            {cat.shortLabel}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {cat.productCount ?? 0} Products
                        </span>
                        {!cat.isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold">
                            Inactive
                          </span>
                        )}
                      </div>

                      {cat.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{cat.description}</p>
                      )}

                      {/* Display Badges */}
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 font-medium">
                        <span className={cat.showInMenu ? "text-emerald-600" : "text-slate-400"}>
                          • Menu: {cat.showInMenu ? "Visible" : "Hidden"}
                        </span>
                        <span className={cat.showInFooter ? "text-emerald-600" : "text-slate-400"}>
                          • Footer: {cat.showInFooter ? "Visible" : "Hidden"}
                        </span>
                        <span>• {seriesList.length} Series tags</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleToggleCatActive(cat)}
                      className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        cat.isActive
                          ? "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                          : "border-slate-200 text-slate-600 bg-slate-100 hover:bg-slate-200"
                      }`}
                      title={cat.isActive ? "Deactivate" : "Activate"}
                    >
                      {cat.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{cat.isActive ? "Active" : "Disabled"}</span>
                    </button>

                    <button
                      onClick={() => openEditCatModal(cat)}
                      className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setExpandedCatId(isExpanded ? null : cat.id)}
                      className="p-2 text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Series</span>
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Series Expandable Drawer */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 rounded-b-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        Series / Sub-filters for {cat.name}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Used as quick series filter pills in MegaMenu & Catalogue
                      </span>
                    </div>

                    {/* Add Series Input Row */}
                    <div className="flex flex-col sm:flex-row gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                      <input
                        type="text"
                        placeholder="New series label (e.g. 4K Pro Series)"
                        value={newSeriesLabel}
                        onChange={(e) => {
                          setNewSeriesLabel(e.target.value);
                          if (!newSeriesSlug) {
                            setNewSeriesSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                          }
                        }}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-600"
                      />
                      <input
                        type="text"
                        placeholder="slug (e.g. 4k-pro)"
                        value={newSeriesSlug}
                        onChange={(e) => setNewSeriesSlug(e.target.value)}
                        className="w-36 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-600"
                      />
                      <button
                        onClick={() => handleAddSeries(cat.id)}
                        disabled={!newSeriesLabel.trim()}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Series
                      </button>
                    </div>

                    {/* Series List */}
                    {seriesList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2 text-center">No series created yet for this category.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {seriesList.map((ser, sIdx) => {
                          const isEditingThisSeries = editingSeriesId === ser.id;

                          return (
                            <div
                              key={ser.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 transition-colors ${
                                !ser.isActive ? "opacity-60 bg-slate-100" : ""
                              }`}
                            >
                              {/* Left: Reorder & Info */}
                              <div className="flex items-center gap-2 flex-1">
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    onClick={() => handleMoveSeries(cat.id, sIdx, "up", seriesList)}
                                    disabled={sIdx === 0}
                                    className="text-slate-300 hover:text-slate-600 disabled:opacity-20"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveSeries(cat.id, sIdx, "down", seriesList)}
                                    disabled={sIdx === seriesList.length - 1}
                                    className="text-slate-300 hover:text-slate-600 disabled:opacity-20"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>

                                {isEditingThisSeries ? (
                                  <div className="flex items-center gap-2 flex-1 mr-2">
                                    <input
                                      type="text"
                                      value={editSeriesLabel}
                                      onChange={(e) => setEditSeriesLabel(e.target.value)}
                                      className="px-2 py-1 text-xs border border-indigo-300 rounded flex-1"
                                    />
                                    <input
                                      type="text"
                                      value={editSeriesSlug}
                                      onChange={(e) => setEditSeriesSlug(e.target.value)}
                                      className="px-2 py-1 text-xs font-mono border border-indigo-300 rounded w-28"
                                    />
                                    <button
                                      onClick={() => handleUpdateSeries(cat.id, ser.id)}
                                      className="p-1 bg-emerald-600 text-white rounded text-xs"
                                      title="Save"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingSeriesId(null)}
                                      className="p-1 bg-slate-200 text-slate-700 rounded text-xs"
                                      title="Cancel"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-medium text-slate-800">{ser.label}</span>
                                    <code className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1 py-0.5 rounded">
                                      series={ser.slug}
                                    </code>
                                    {!ser.isActive && (
                                      <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                        Hidden
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Right: Actions */}
                              {!isEditingThisSeries && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleToggleSeriesActive(cat.id, ser)}
                                    className={`p-1.5 rounded-lg border text-[11px] ${
                                      ser.isActive ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-slate-400 bg-slate-100 border-slate-200"
                                    }`}
                                    title={ser.isActive ? "Deactivate" : "Activate"}
                                  >
                                    {ser.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingSeriesId(ser.id);
                                      setEditSeriesLabel(ser.label);
                                      setEditSeriesSlug(ser.slug);
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg"
                                    title="Edit Series"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSeries(cat.id, ser.id, ser.label)}
                                    className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg"
                                    title="Delete Series"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Category Modal (Create / Edit) */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative my-8">
            <button
              onClick={() => setIsCatModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 mb-4">
              <FolderTree className="w-5 h-5 text-indigo-600" />
              {isEditingCat ? "Edit Category" : "Create New Category"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Video Door Phones"
                  value={catForm.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCatForm((prev) => ({
                      ...prev,
                      name: val,
                      id: isEditingCat
                        ? prev.id
                        : val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Slug / ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={isEditingCat}
                  placeholder="e.g. video-door-phones"
                  value={catForm.id}
                  onChange={(e) => setCatForm((prev) => ({ ...prev, id: e.target.value }))}
                  className={`w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 ${
                    isEditingCat ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""
                  }`}
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {isEditingCat ? "Category ID cannot be changed once created." : "Used in URLs (/catalogue?category=...)"}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Short Label (for pills/tabs)</label>
                <input
                  type="text"
                  placeholder="e.g. Intercoms"
                  value={catForm.shortLabel}
                  onChange={(e) => setCatForm((prev) => ({ ...prev, shortLabel: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description for SEO, MegaMenu, and category cards"
                  value={catForm.description}
                  onChange={(e) => setCatForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cover Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="/images/products/... or upload"
                    value={catForm.coverImageUrl}
                    onChange={(e) => setCatForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))}
                    className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600"
                  />
                  <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={catForm.isActive}
                    onChange={(e) => setCatForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span className="text-xs font-medium text-slate-800">Is Active</span>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={catForm.showInMenu}
                    onChange={(e) => setCatForm((prev) => ({ ...prev, showInMenu: e.target.checked }))}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span className="text-xs font-medium text-slate-800">In MegaMenu</span>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={catForm.showInFooter}
                    onChange={(e) => setCatForm((prev) => ({ ...prev, showInFooter: e.target.checked }))}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span className="text-xs font-medium text-slate-800">In Footer</span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="px-4 py-2.5 text-slate-600 hover:text-slate-900 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={isSaving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {isEditingCat ? "Update Category" : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
