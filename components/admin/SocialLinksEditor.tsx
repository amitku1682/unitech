"use client";

import React, { useState, useEffect } from "react";
import {
  Share2,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  X,
  Eye,
  Globe,
  Check,
} from "lucide-react";

interface SocialLink {
  id: string;
  platform: string;
  label: string | null;
  url: string;
  isActive: boolean;
  position: number;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string | null;
}

interface SocialLinksEditorProps {
  onNotify?: (msg: string) => void;
}

const PLATFORM_OPTIONS = [
  { value: "facebook", label: "Facebook", domain: "facebook.com, fb.com" },
  { value: "instagram", label: "Instagram", domain: "instagram.com" },
  { value: "youtube", label: "YouTube", domain: "youtube.com, youtu.be" },
  { value: "linkedin", label: "LinkedIn", domain: "linkedin.com" },
  { value: "x", label: "X (Twitter)", domain: "x.com, twitter.com" },
  { value: "whatsapp", label: "WhatsApp", domain: "wa.me, api.whatsapp.com" },
  { value: "google_business", label: "Google Business", domain: "maps.google.com, google.com" },
  { value: "indiamart", label: "IndiaMART", domain: "indiamart.com" },
  { value: "justdial", label: "Justdial", domain: "justdial.com" },
  { value: "pinterest", label: "Pinterest", domain: "pinterest.com, pin.it" },
  { value: "threads", label: "Threads", domain: "threads.net" },
  { value: "telegram", label: "Telegram", domain: "t.me, telegram.me" },
  { value: "other", label: "Other Website", domain: "Any valid https:// URL" },
];

export function SocialLinksEditor({ onNotify }: SocialLinksEditorProps) {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    id: "",
    platform: "facebook",
    label: "",
    url: "",
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchLinks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/social-links");
      const json = await res.json();
      if (json.success && json.links) {
        setLinks(json.links);
      }
    } catch (err) {
      console.error("[SocialLinksEditor fetch error]:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const openAddModal = () => {
    setEditingLink(null);
    setModalForm({
      id: "",
      platform: "facebook",
      label: "Facebook",
      url: "",
      isActive: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (link: SocialLink) => {
    setEditingLink(link);
    setModalForm({
      id: link.id,
      platform: link.platform,
      label: link.label || "",
      url: link.url,
      isActive: link.isActive,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handlePlatformChange = (platform: string) => {
    const opt = PLATFORM_OPTIONS.find((p) => p.value === platform);
    setModalForm((prev) => ({
      ...prev,
      platform,
      label: prev.label && prev.label !== PLATFORM_OPTIONS.find(p => p.value === prev.platform)?.label 
        ? prev.label 
        : (opt?.label || ""),
    }));
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!modalForm.url || !modalForm.url.trim().startsWith("https://")) {
      setFormError("URL must start with https://");
      return;
    }

    setIsSaving(true);
    try {
      const isEdit = Boolean(editingLink);
      const endpoint = "/api/admin/social-links";
      const method = isEdit ? "PUT" : "POST";
      const payload = isEdit
        ? {
            id: modalForm.id,
            platform: modalForm.platform,
            label: modalForm.label || null,
            url: modalForm.url.trim(),
            isActive: modalForm.isActive,
          }
        : {
            platform: modalForm.platform,
            label: modalForm.label || null,
            url: modalForm.url.trim(),
            isActive: modalForm.isActive,
          };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save link");
      }

      setIsModalOpen(false);
      await fetchLinks();
      onNotify?.(isEdit ? "Social link updated successfully!" : "New social link added!");
    } catch (err: any) {
      setFormError(err.message || "Failed to save link");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (link: SocialLink) => {
    try {
      const res = await fetch("/api/admin/social-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: link.id,
          isActive: !link.isActive,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setLinks((prev) =>
          prev.map((l) => (l.id === link.id ? { ...l, isActive: !l.isActive } : l))
        );
        onNotify?.(`"${link.label || link.platform}" set to ${!link.isActive ? "active" : "inactive"}`);
      } else {
        alert(json.error || "Failed to update link status");
      }
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  const handleDelete = async (link: SocialLink) => {
    if (!confirm(`Are you sure you want to delete the ${link.label || link.platform} link?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/social-links?id=${encodeURIComponent(link.id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setLinks((prev) => prev.filter((l) => l.id !== link.id));
        onNotify?.(`Social link removed.`);
      } else {
        alert(json.error || "Failed to delete link");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= links.length) return;

    const reordered = [...links];
    const temp = reordered[index];
    reordered[index] = reordered[newIdx];
    reordered[newIdx] = temp;

    setLinks(reordered);

    try {
      const ids = reordered.map((l) => l.id);
      const res = await fetch("/api/admin/social-links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const json = await res.json();
      if (!json.success) {
        fetchLinks();
      }
    } catch (err) {
      console.error("Reorder error:", err);
      fetchLinks();
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return <span className="font-bold text-[#1877F2]">f</span>;
      case "instagram":
        return <span className="font-bold text-[#E4405F]">IG</span>;
      case "youtube":
        return <span className="font-bold text-[#FF0000]">YT</span>;
      case "linkedin":
        return <span className="font-bold text-[#0A66C2]">in</span>;
      case "x":
        return <span className="font-bold text-slate-800">𝕏</span>;
      case "whatsapp":
        return <span className="font-bold text-[#25D366]">WA</span>;
      case "google_business":
        return <span className="font-bold text-blue-600">G</span>;
      default:
        return <Globe className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Share2 className="w-5 h-5 text-unitech-red" />
            Social &amp; Platform Links
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage links to Unitech social profiles and digital touchpoints across footer, contact pages, and search meta.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLinks}
            disabled={isLoading}
            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            title="Refresh links"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-unitech-red hover:bg-red-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Platform Link
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Links Management Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Configured Channels ({links.length})
              </span>
              <span className="text-xs text-slate-400">Order reflects storefront footer sequence</span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-unitech-red" />
                Loading channels...
              </div>
            ) : links.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No social links configured. Click &quot;Add Platform Link&quot; to add one.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {links.map((link, idx) => (
                  <div
                    key={link.id}
                    className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                      link.isActive ? "hover:bg-slate-50/80" : "bg-slate-50/40 opacity-70"
                    }`}
                  >
                    {/* Left: Reorder buttons & Icon */}
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleMove(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 hover:bg-slate-200 rounded transition-colors"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMove(idx, "down")}
                          disabled={idx === links.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 hover:bg-slate-200 rounded transition-colors"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-sm shadow-2xs shrink-0">
                        {getPlatformIcon(link.platform)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 truncate">
                            {link.label || link.platform}
                          </span>
                          {!link.isActive && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-slate-400 hover:text-slate-600 truncate flex items-center gap-1 max-w-[280px] sm:max-w-[360px]"
                        >
                          <span className="truncate">{link.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleActive(link)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                          link.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {link.isActive ? "Active" : "Disabled"}
                      </button>

                      <button
                        onClick={() => openEditModal(link)}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit link"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(link)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Live Storefront Footer Preview */}
        <div className="space-y-4">
          <div className="bg-[#0b0f19] text-white p-6 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Storefront Footer Preview
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Live order</span>
            </div>

            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Active links below will render automatically in the public website footer in this exact sequence:
            </p>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center gap-4">
              {links.filter((l) => l.isActive).length === 0 ? (
                <span className="text-xs text-slate-500 italic">No active links to display.</span>
              ) : (
                links
                  .filter((l) => l.isActive)
                  .map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${link.label || link.platform} — Unitech`}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-transform hover:scale-110 shadow-xs"
                    >
                      {getPlatformIcon(link.platform)}
                    </a>
                  ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/60 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>Domain whitelisting enabled</span>
              </div>
              <p>Strict regex protects against arbitrary external redirect injection.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Share2 className="w-4 h-4 text-unitech-red" />
                {editingLink ? "Edit Platform Link" : "Add Platform Link"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Platform Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Platform
                </label>
                <select
                  value={modalForm.platform}
                  onChange={(e) => handlePlatformChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-unitech-red bg-white"
                >
                  {PLATFORM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.domain})
                    </option>
                  ))}
                </select>
              </div>

              {/* Label Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Display Label (Optional)
                </label>
                <input
                  type="text"
                  value={modalForm.label}
                  onChange={(e) => setModalForm((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g. Official YouTube Channel"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-unitech-red"
                  maxLength={100}
                />
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Channel / Profile URL *
                </label>
                <input
                  type="url"
                  value={modalForm.url}
                  onChange={(e) => setModalForm((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder={
                    modalForm.platform === "whatsapp"
                      ? "https://wa.me/918700317239"
                      : "https://"
                  }
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-unitech-red font-mono"
                  maxLength={500}
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Allowed domain: {PLATFORM_OPTIONS.find((p) => p.value === modalForm.platform)?.domain}
                </span>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="link-is-active"
                  checked={modalForm.isActive}
                  onChange={(e) => setModalForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-unitech-red rounded border-slate-300 focus:ring-unitech-red"
                />
                <label htmlFor="link-is-active" className="text-sm font-medium text-slate-700 select-none">
                  Display publicly on storefront footer &amp; contact pages
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-unitech-red hover:bg-red-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingLink ? "Update Link" : "Add Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
