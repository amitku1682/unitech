"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Camera,
  Upload,
  RefreshCw,
  Save,
  RotateCcw,
  CheckCircle2,
  Quote,
  Sparkles,
} from "lucide-react";
import { DEFAULT_LEADERSHIP, LeadershipDirector } from "@/lib/leadershipData";

interface AboutLeadershipEditorProps {
  onNotify?: (msg: string) => void;
}

export function AboutLeadershipEditor({ onNotify }: AboutLeadershipEditorProps) {
  const [directors, setDirectors] = useState<LeadershipDirector[]>(DEFAULT_LEADERSHIP);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/about-leadership", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length >= 2) {
          setDirectors(json.data);
        }
      })
      .catch((err) => console.warn("[About leadership editor fetch error]:", err));
  }, []);

  const handleUpdate = (idx: number, field: keyof LeadershipDirector, value: any) => {
    setDirectors((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleHighlightUpdate = (dirIdx: number, hIdx: number, val: string) => {
    setDirectors((prev) => {
      const copy = [...prev];
      const hCopy = [...(copy[dirIdx].highlights || [])];
      hCopy[hIdx] = val;
      copy[dirIdx] = { ...copy[dirIdx], highlights: hCopy };
      return copy;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(directors[idx]?.id || String(idx));
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/uploads/product-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        handleUpdate(idx, "photoUrl", data.url);
        onNotify?.(`Photo uploaded successfully for Director ${idx + 1}`);
      } else {
        alert(data.error || "Failed to upload photo");
      }
    } catch (err: any) {
      alert("Photo upload error: " + (err.message || "Network issue"));
    } finally {
      setUploadingId(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/about-leadership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(directors),
      });
      const data = await res.json();
      if (data.success) {
        try {
          localStorage.setItem("unitech_about_leadership", JSON.stringify(directors));
        } catch {}
        onNotify?.("Board of Directors & Founders saved and published live!");
      } else {
        alert(data.error || "Failed to save leadership");
      }
    } catch (err: any) {
      alert("Save error: " + (err.message || "Network issue"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset Board of Directors & Founders back to official default records?")) {
      setDirectors(DEFAULT_LEADERSHIP);
      handleSave();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Strip */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-50 text-unitech-red border border-red-200 mb-2">
            <Users className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>About Page · Executive Leadership</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
            Board of Directors & Founders Manager
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Update executive portrait photos, founder titles, bio descriptions, manufacturing highlights, and leadership quotes for Director 1 and Director 2.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Publish Live</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2 Director Editing Cards (Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {directors.slice(0, 2).map((dir, idx) => {
          const isUploading = uploadingId === (dir.id || String(idx));
          const frameLabel = idx === 0 ? "Director 01 · Managing Director & Founder" : "Director 02 · Technical Director & Co-Founder";

          return (
            <div
              key={dir.id || idx}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xs space-y-5"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-mono font-black uppercase text-unitech-red tracking-wider">
                  {frameLabel}
                </span>
                <span className="text-[11px] font-mono text-slate-400 font-bold">
                  Card {idx + 1} of 2
                </span>
              </div>

              {/* Photo Upload & Preview Frame */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Executive Portrait Photo (400×480 px recommended):
                </label>
                <div className="relative aspect-[16/10] sm:aspect-[4/3] rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 hover:border-unitech-red flex flex-col items-center justify-center p-4 overflow-hidden group transition-all">
                  {dir.photoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={dir.photoUrl}
                      alt={dir.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-unitech-red mx-auto shadow-2xs">
                        <Camera className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-500 block">
                        No custom photo uploaded
                      </span>
                    </div>
                  )}

                  {/* Overlay File Input */}
                  <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer backdrop-blur-2xs">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => handleImageUpload(e, idx)}
                      className="hidden"
                    />
                    {isUploading ? (
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Uploading via Sharp...</span>
                      </div>
                    ) : (
                      <div className="text-center space-y-1">
                        <Upload className="w-6 h-6 mx-auto text-amber-400" />
                        <span className="text-xs font-bold">Click to Upload New Photo</span>
                        <span className="text-[10px] text-slate-300 block">Auto-converted to WebP</span>
                      </div>
                    )}
                  </label>
                </div>

                {/* Direct Image URL input */}
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Or enter direct image URL (/uploads/...)"
                    value={dir.photoUrl || ""}
                    onChange={(e) => handleUpdate(idx, "photoUrl", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700"
                  />
                  {dir.photoUrl && (
                    <button
                      type="button"
                      onClick={() => handleUpdate(idx, "photoUrl", "")}
                      className="text-xs font-bold text-red-600 hover:text-red-700 px-2 py-1 rounded bg-red-50 border border-red-200 shrink-0 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Director Details Form */}
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Director Full Name / Heading
                    </label>
                    <input
                      type="text"
                      value={dir.name}
                      onChange={(e) => handleUpdate(idx, "name", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Role Badge Tag
                    </label>
                    <input
                      type="text"
                      value={dir.badge}
                      onChange={(e) => handleUpdate(idx, "badge", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Bio / Executive Vision Description
                  </label>
                  <textarea
                    rows={4}
                    value={dir.bio}
                    onChange={(e) => handleUpdate(idx, "bio", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-normal"
                  />
                </div>

                {/* 3 Technical Highlights */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
                    3 Core Achievements / Highlights:
                  </label>
                  <div className="space-y-2">
                    {(dir.highlights || ["", "", ""]).slice(0, 3).map((h, hIdx) => (
                      <div key={hIdx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <input
                          type="text"
                          value={h}
                          onChange={(e) => handleHighlightUpdate(idx, hIdx, e.target.value)}
                          placeholder={`Achievement 0${hIdx + 1}`}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leadership Quote */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Leadership Quote:
                  </label>
                  <div className="relative">
                    <Quote className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <textarea
                      rows={2}
                      value={dir.quote}
                      onChange={(e) => handleUpdate(idx, "quote", e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs italic text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
