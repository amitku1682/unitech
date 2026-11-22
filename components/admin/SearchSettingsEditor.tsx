"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  TrendingUp,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  Link as LinkIcon,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { SearchPopularTerm, SearchInsightsData } from "@/lib/types";

interface SearchSettingsEditorProps {
  onShowToast: (msg: string) => void;
}

export function SearchSettingsEditor({ onShowToast }: SearchSettingsEditorProps) {
  const [chips, setChips] = useState<SearchPopularTerm[]>([]);

  const [initialChips, setInitialChips] = useState<SearchPopularTerm[]>([]);
  const [expandedLinks, setExpandedLinks] = useState<Record<number, boolean>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Insights state
  const [insightsDays, setInsightsDays] = useState<7 | 30>(7);
  const [insights, setInsights] = useState<SearchInsightsData>({
    top_terms: [],
    zero_result_terms: [],
    total_searches: 0,
  });
  const [isLoadingInsights, setIsLoadingInsights] = useState<boolean>(false);

  // Fetch popular chips from Admin API
  useEffect(() => {
    fetch("/api/admin/search/popular")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setChips(json.data);
          setInitialChips(JSON.parse(JSON.stringify(json.data)));
        } else {
          setInitialChips(JSON.parse(JSON.stringify(chips)));
        }
      })
      .catch((err) => {
        console.warn("[Admin Search Popular fetch error]:", err);
      });
  }, []);

  // Fetch insights
  useEffect(() => {
    setIsLoadingInsights(true);
    fetch(`/api/admin/search/insights?days=${insightsDays}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setInsights(json.data);
        }
      })
      .catch((err) => {
        console.warn("[Admin Search Insights fetch error]:", err);
      })
      .finally(() => setIsLoadingInsights(false));
  }, [insightsDays]);

  // Warn before leaving if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const activeCount = chips.filter((c) => c.isActive).length;
  const isMaxActive = activeCount >= 10;

  // Reorder chips
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...chips];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    updated.forEach((c, idx) => (c.position = idx));
    setChips(updated);
    setHasUnsavedChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index >= chips.length - 1) return;
    const updated = [...chips];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    updated.forEach((c, idx) => (c.position = idx));
    setChips(updated);
    setHasUnsavedChanges(true);
  };

  // Toggle active
  const handleToggleActive = (index: number) => {
    const updated = [...chips];
    const current = updated[index];
    if (!current.isActive && isMaxActive) {
      alert("Maximum 10 active chips allowed. Please deactivate or delete another chip first.");
      return;
    }
    updated[index] = { ...current, isActive: !current.isActive };
    setChips(updated);
    setHasUnsavedChanges(true);
  };

  // Update field
  const handleUpdateChip = (index: number, field: keyof SearchPopularTerm, value: any) => {
    const updated = [...chips];
    updated[index] = { ...updated[index], [field]: value };
    setChips(updated);
    setHasUnsavedChanges(true);
  };

  // Delete chip
  const handleDeleteChip = (index: number) => {
    const target = chips[index];
    if (confirm(`Delete chip "${target.label}"?`)) {
      const updated = chips.filter((_, idx) => idx !== index);
      updated.forEach((c, idx) => (c.position = idx));
      setChips(updated);
      setHasUnsavedChanges(true);
    }
  };

  // Add new chip
  const handleAddChip = (initialTerm = "", initialLink = "") => {
    if (isMaxActive) {
      alert("Maximum 10 active chips allowed. Please deactivate an existing chip first.");
      return;
    }

    const newIndex = chips.length;
    const label = initialTerm.substring(0, 32) || "New search term";
    const newChip: SearchPopularTerm = {
      id: `pop-new-${Date.now().toString(36)}`,
      label,
      query: label.substring(0, 60),
      linkUrl: initialLink || null,
      position: newIndex,
      isActive: true,
    };

    setChips([...chips, newChip]);
    if (initialLink) {
      setExpandedLinks((prev) => ({ ...prev, [newIndex]: true }));
    }
    setHasUnsavedChanges(true);
  };

  // Toggle Link field
  const toggleLinkField = (index: number) => {
    setExpandedLinks((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Cancel changes
  const handleCancelChanges = () => {
    if (confirm("Discard unsaved edits and restore last saved state?")) {
      setChips(JSON.parse(JSON.stringify(initialChips)));
      setHasUnsavedChanges(false);
      onShowToast("Edits discarded. Reverted to last saved settings.");
    }
  };

  // Save & publish
  const handleSaveAndPublish = async () => {
    // Validate
    for (let i = 0; i < chips.length; i++) {
      const c = chips[i];
      if (!c.label.trim()) {
        alert(`Chip #${i + 1} has an empty label.`);
        return;
      }
    }

    if (activeCount > 10) {
      alert("Maximum 10 active chips allowed.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/search/popular", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terms: chips }),
      });

      const json = await res.json();
      if (json.success) {
        setChips(json.data);
        setInitialChips(JSON.parse(JSON.stringify(json.data)));
        setHasUnsavedChanges(false);
        onShowToast("Popular searches updated · live on the website");
      } else {
        onShowToast(`Error: ${json.error || "Failed to update popular searches"}`);
      }
    } catch (err: any) {
      onShowToast(`Save failed: ${err.message || "Network error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-unitech-red border border-red-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Search className="w-3.5 h-3.5" />
            <span>Storefront Smart Search Engine</span>
          </div>
          <h3 className="font-heading font-black text-xl text-slate-900">
            Search — Popular Searches & Search Insights
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Manage the trending chips shown in the search panel before the visitor types. Monitor live customer queries and missing search terms to optimize conversions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span
            className={`text-xs font-mono font-bold px-3 py-1.5 rounded-full border ${
              activeCount <= 10
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {activeCount}/10 active
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout (>= 1280px 2-cols, stacked below) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* ============================================================= */}
        {/* LEFT COLUMN (7 cols): POPULAR CHIPS EDITOR                    */}
        {/* ============================================================= */}
        <div className="xl:col-span-7 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">Popular Searches Editor</h4>
              <p className="text-xs text-slate-500">
                Shown in the search panel before the visitor types. Max 10 active chips.
              </p>
            </div>

            <button
              type="button"
              disabled={isMaxActive}
              onClick={() => handleAddChip()}
              title={isMaxActive ? "Maximum 10 active chips reached" : "Add new popular search chip"}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add chip</span>
            </button>
          </div>

          {/* List of Chips */}
          <div className="space-y-2.5">
            {chips.map((chip, idx) => {
              const isExpandedLink = Boolean(expandedLinks[idx] || chip.linkUrl);

              return (
                <div
                  key={chip.id || idx}
                  className={`p-3.5 rounded-xl border transition-all ${
                    chip.isActive
                      ? "bg-white border-slate-200 shadow-2xs hover:border-slate-300"
                      : "bg-slate-50/70 border-slate-200 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Position / Up-Down Controls */}
                    <div className="flex flex-col gap-0.5 items-center shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveUp(idx)}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-20 text-slate-500"
                        title="Move up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        disabled={idx === chips.length - 1}
                        onClick={() => handleMoveDown(idx)}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-20 text-slate-500"
                        title="Move down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Chip Label Input */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Chip Label
                        </label>
                        <span className="text-[10px] font-mono text-slate-400">
                          {chip.label.length}/32
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={32}
                        value={chip.label}
                        onChange={(e) => handleUpdateChip(idx, "label", e.target.value)}
                        placeholder="e.g. 4MP warm-light camera"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-red-500"
                      />
                    </div>

                    {/* Search Query Input */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Search Query
                        </label>
                        <span className="text-[10px] font-mono text-slate-400">
                          {(chip.query || "").length}/60
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={60}
                        value={chip.query || ""}
                        onChange={(e) => handleUpdateChip(idx, "query", e.target.value)}
                        placeholder="Same as label"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:border-red-500"
                      />
                    </div>

                    {/* Link Toggle Button */}
                    <button
                      type="button"
                      onClick={() => toggleLinkField(idx)}
                      className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 ${
                        chip.linkUrl
                          ? "bg-red-50 text-unitech-red border-red-200"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                      title={chip.linkUrl ? "Has destination URL" : "Set direct destination URL"}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px]">
                        {chip.linkUrl ? "Linked" : "+ Link"}
                      </span>
                    </button>

                    {/* Active Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(idx)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                        chip.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-200 text-slate-600 border border-slate-300"
                      }`}
                    >
                      {chip.isActive ? "Active" : "Off"}
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteChip(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                      title="Delete chip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Expanded Optional Link URL Field */}
                  {isExpandedLink && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500 shrink-0">
                        Link URL:
                      </span>
                      <input
                        type="text"
                        value={chip.linkUrl || ""}
                        onChange={(e) => handleUpdateChip(idx, "linkUrl", e.target.value)}
                        placeholder="e.g. /catalogue?category=cctv-cameras"
                        className="flex-1 px-3 py-1 rounded-lg border border-slate-300 text-xs font-mono text-slate-800"
                      />
                      {chip.linkUrl && (
                        <button
                          type="button"
                          onClick={() => handleUpdateChip(idx, "linkUrl", null)}
                          className="text-[11px] text-rose-600 hover:underline shrink-0"
                        >
                          Clear Link
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Live Preview Strip */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-mono font-bold tracking-[0.12em] text-[#6E6E78] uppercase">
                Storefront Live Preview (Active Only)
              </span>
              <span className="text-[11px] text-slate-400">
                Matches exact storefront appearance
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {chips
                .filter((c) => c.isActive)
                .map((chip, pIdx) => (
                  <div
                    key={pIdx}
                    className="min-h-[36px] px-3.5 rounded-full border border-[#E4E4E8] bg-white text-[13.5px] font-semibold text-slate-800 flex items-center gap-1.5 shadow-2xs"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-[#E3141B] stroke-[2.5]" />
                    <span>{chip.label}</span>
                    {chip.linkUrl && (
                      <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {hasUnsavedChanges && (
                <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5 animate-pulse">
                  <AlertCircle className="w-4 h-4" />
                  <span>Unsaved changes in buffer</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCancelChanges}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all"
              >
                Cancel changes
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveAndPublish}
                className="px-5 py-2 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Publishing..." : "Save & publish"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* RIGHT COLUMN (5 cols): SEARCH INSIGHTS (Read-Only)            */}
        {/* ============================================================= */}
        <div className="xl:col-span-5 space-y-6 xl:border-l xl:border-slate-100 xl:pl-8">
          {/* Header & Segmented Control */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">Search Insights</h4>
              <p className="text-xs text-slate-500">Live visitor query telemetry</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                {insights.total_searches} searches
              </span>

              {/* Segmented Control */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setInsightsDays(7)}
                  className={`px-2 py-1 rounded-md transition-all ${
                    insightsDays === 7 ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                  }`}
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setInsightsDays(30)}
                  className={`px-2 py-1 rounded-md transition-all ${
                    insightsDays === 30 ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                  }`}
                >
                  30 Days
                </button>
              </div>
            </div>
          </div>

          {/* Top Searches List */}
          <div className="space-y-3">
            <div className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center justify-between">
              <span>Top Searches (Last {insightsDays} Days)</span>
              <span className="text-[10px] text-slate-400 font-normal">Ranked by volume</span>
            </div>

            {insights.top_terms.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-400">
                No searches recorded yet.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {insights.top_terms.map((item, idx) => {
                  const alreadyChip = chips.some(
                    (c) => c.label.toLowerCase() === item.term.toLowerCase()
                  );

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 font-mono font-bold text-slate-400 text-[11px]">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800 truncate">
                          {item.term}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                          {item.count}×
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={alreadyChip || isMaxActive}
                        onClick={() => handleAddChip(item.term)}
                        title={
                          alreadyChip
                            ? "Already in popular chips"
                            : isMaxActive
                            ? "Max 10 active chips"
                            : "Add as popular chip"
                        }
                        className="text-[11px] font-bold text-unitech-red hover:underline disabled:opacity-30 disabled:no-underline shrink-0 ml-2"
                      >
                        {alreadyChip ? "Added" : "+ Add as chip"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Searches with No Results */}
          <div className="space-y-3 pt-2">
            <div>
              <div className="text-xs font-black uppercase text-rose-700 tracking-wider flex items-center justify-between">
                <span>Searches with No Results</span>
                <span className="text-[10px] text-rose-500 font-normal">0 items returned</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Visitors looked for these but found nothing. Consider adding the product, a synonym/tag, or a chip that links to the closest category.
              </p>
            </div>

            {insights.zero_result_terms.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-400">
                No zero-result searches recorded yet.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {insights.zero_result_terms.map((item, idx) => {
                  const alreadyChip = chips.some(
                    (c) => c.label.toLowerCase() === item.term.toLowerCase()
                  );

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-rose-50/50 border border-rose-100 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-slate-900 truncate">
                          &ldquo;{item.term}&rdquo;
                        </span>
                        <span className="font-mono text-[10px] text-rose-600 bg-white px-1.5 py-0.5 rounded border border-rose-200 shrink-0">
                          {item.count} misses
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={alreadyChip || isMaxActive}
                        onClick={() => handleAddChip(item.term, "/catalogue")}
                        title={
                          alreadyChip
                            ? "Already in chips"
                            : "Add chip and customize target link"
                        }
                        className="text-[11px] font-bold text-rose-700 hover:underline disabled:opacity-30 shrink-0 ml-2"
                      >
                        + Add as chip
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
