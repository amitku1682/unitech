"use client";

import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Clock,
  Sparkles,
  Phone,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Eye,
  Smartphone,
  Monitor,
} from "lucide-react";
import { AnnouncementBanner, TickerSettings } from "@/lib/types";

interface TickerEditorProps {
  onNotify?: (msg: string, type?: "success" | "error" | "info") => void;
}

export function TickerEditor({ onNotify }: TickerEditorProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [settings, setSettings] = useState<TickerSettings>({
    id: 1,
    isEnabled: true,
    rotationSeconds: 4,
    animation: "fade",
    pauseOnHover: true,
    showPlantDesk: true,
    plantDeskText: "Sahibabad Plant Direct Supply",
    showPhone: true,
    phoneDisplay: "+91 87003 17239",
    phoneTel: "+918700317239",
    showWhatsapp: true,
    whatsappLabel: "Quick Order via WhatsApp",
  });

  const [messages, setMessages] = useState<AnnouncementBanner[]>([]);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Load from API
  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/ticker", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        if (json.settings) setSettings(json.settings);
        if (Array.isArray(json.messages)) setMessages(json.messages);
      } else {
        setErrorMsg(json.error || "Failed to load ticker data");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect to ticker API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Live preview ticker cycling
  const activeMessages = messages.filter((m) => m.isActive);
  useEffect(() => {
    if (!settings.isEnabled || isPaused || activeMessages.length <= 1) return;
    const interval = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % activeMessages.length);
    }, settings.rotationSeconds * 1000);
    return () => clearInterval(interval);
  }, [settings.isEnabled, isPaused, activeMessages.length, settings.rotationSeconds]);

  // Current preview bulletin
  const currentMsg = activeMessages[previewIndex % (activeMessages.length || 1)] || {
    badgeText: "ANNOUNCEMENT",
    title: "Welcome to Unitech CCTV & Surveillance Hardware",
  };

  // Handlers for Messages
  const handleAddMessage = () => {
    const newMsg: AnnouncementBanner = {
      id: `ban-${Date.now()}`,
      title: "NEW ANNOUNCEMENT TITLE HERE",
      badgeText: "NOTICE",
      ctaLink: "",
      type: "TOP_TICKER",
      isActive: true,
      startsAt: null,
      endsAt: null,
      sortOrder: messages.length,
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const handleUpdateMessage = (id: string, updates: Partial<AnnouncementBanner>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const handleDeleteMessage = (id: string) => {
    if (confirm("Are you sure you want to delete this ticker message?")) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= messages.length) return;
    const updated = [...messages];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    // update sort orders
    updated.forEach((m, idx) => (m.sortOrder = idx));
    setMessages(updated);
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/admin/ticker", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings,
          messages,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaveSuccess(true);
        if (json.settings) setSettings(json.settings);
        if (Array.isArray(json.messages)) setMessages(json.messages);
        if (onNotify) onNotify("Top Header Ticker settings published successfully!", "success");
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMsg(json.error || "Failed to save ticker settings");
        if (onNotify) onNotify(json.error || "Failed to save ticker", "error");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save ticker settings");
      if (onNotify) onNotify(err.message || "Failed to save", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-mono text-xs">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-unitech-red mb-3" />
        <p>Loading Top Header Ticker Configuration...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header & Save Action */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-unitech-red animate-pulse" />
            <h2 className="font-heading font-black text-xl text-slate-900">
              Top Header Announcement Bar Ticker
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Configure rotation speed, transitions, plant desk badge, direct phone, WhatsApp links, and scheduled headline bulletins displayed on the storefront top utility strip.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-unitech-red hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save & Publish Ticker</span>
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Top Header Ticker updated and published live to the storefront!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 font-bold animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Live Preview Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-unitech-red" />
            <h3 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
              Live Top Header Strip Preview
            </h3>
            {!settings.isEnabled && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                Disabled
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setPreviewDevice("desktop")}
              className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                previewDevice === "desktop" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice("mobile")}
              className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                previewDevice === "mobile" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
          </div>
        </div>

        {/* Visual Simulated Bar */}
        <div className="p-3 bg-slate-100/80 rounded-xl border border-slate-200/90 overflow-hidden">
          {!settings.isEnabled ? (
            <div className="py-3 text-center text-xs text-slate-500 font-medium italic">
              Top Header Bar is turned OFF — this area collapses cleanly with 0px height on the storefront.
            </div>
          ) : activeMessages.length === 0 ? (
            <div className="py-3 text-center text-xs text-amber-700 font-medium">
              No active messages in schedule — Top Bar will collapse cleanly on storefront.
            </div>
          ) : (
            <div
              className={`bg-slate-50 border border-slate-200 text-xs text-slate-700 py-2 px-4 rounded-lg shadow-xs flex items-center justify-between gap-4 transition-all ${
                previewDevice === "mobile" ? "max-w-md mx-auto" : "w-full"
              }`}
              onMouseEnter={() => settings.pauseOnHover && setIsPaused(true)}
              onMouseLeave={() => settings.pauseOnHover && setIsPaused(false)}
            >
              {/* Left ticker bulletin */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-unitech-red animate-pulse shrink-0" />
                <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-unitech-red/10 text-unitech-red border border-red-200 shrink-0">
                  {currentMsg.badgeText || "NOTICE"}
                </span>
                <span className="text-[11px] font-semibold text-slate-800 truncate">
                  {currentMsg.title}
                </span>
              </div>

              {/* Right utility items (hidden on mobile preview) */}
              {previewDevice === "desktop" && (
                <div className="hidden sm:flex items-center gap-4 shrink-0 text-[11px] font-semibold text-slate-700">
                  {settings.showPlantDesk && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{settings.plantDeskText}</span>
                    </div>
                  )}
                  {settings.showPlantDesk && settings.showPhone && <span className="text-slate-300">|</span>}
                  {settings.showPhone && (
                    <span className="flex items-center gap-1 font-black text-slate-950">
                      <Phone className="w-3.5 h-3.5 text-unitech-red" />
                      <span>{settings.phoneDisplay}</span>
                    </span>
                  )}
                  {settings.showPhone && settings.showWhatsapp && <span className="text-slate-300">|</span>}
                  {settings.showWhatsapp && (
                    <span className="text-emerald-600 flex items-center gap-1 font-bold">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{settings.whatsappLabel}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Global Settings Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sliders className="w-4 h-4 text-unitech-red" />
          <h3 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
            Global Ticker Controls & Appearance
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Ticker Master Toggle */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Top Ticker Bar</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isEnabled}
                  onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-unitech-red" />
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              When disabled, the top bar is completely hidden on the storefront without layout shift.
            </p>
          </div>

          {/* 2. Rotation Seconds */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Cycle Interval</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white border border-slate-200">
                {settings.rotationSeconds}s
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="20"
              step="1"
              value={settings.rotationSeconds}
              onChange={(e) => setSettings({ ...settings, rotationSeconds: Number(e.target.value) })}
              className="w-full accent-unitech-red cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Duration each headline message stays visible before cycling.
            </p>
          </div>

          {/* 3. Transition Animation */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">Transition Style</span>
            <select
              value={settings.animation}
              onChange={(e) => setSettings({ ...settings, animation: e.target.value as any })}
              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-unitech-red"
            >
              <option value="fade">Smooth Fade In</option>
              <option value="slide-up">Slide Up</option>
              <option value="marquee">Continuous Marquee</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Visual transition effect between headline announcements.
            </p>
          </div>

          {/* 4. Pause on Hover */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Pause on Hover</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.pauseOnHover}
                  onChange={(e) => setSettings({ ...settings, pauseOnHover: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-unitech-red" />
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              Freezes headline rotation when the user hovers over the ticker bar.
            </p>
          </div>
        </div>

        {/* Right-hand utility links configuration */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Top Utility Strip Badges & Direct Links
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Plant Desk */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Plant Desk Badge</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.showPlantDesk}
                  onChange={(e) => setSettings({ ...settings, showPlantDesk: e.target.checked })}
                  className="w-4 h-4 accent-unitech-red"
                />
              </div>
              <input
                type="text"
                value={settings.plantDeskText}
                onChange={(e) => setSettings({ ...settings, plantDeskText: e.target.value })}
                placeholder="Sahibabad Plant Direct Supply"
                className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-300 text-xs font-medium text-slate-800"
              />
            </div>

            {/* Direct Phone */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-unitech-red" />
                  <span>Direct Phone Desk</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.showPhone}
                  onChange={(e) => setSettings({ ...settings, showPhone: e.target.checked })}
                  className="w-4 h-4 accent-unitech-red"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={settings.phoneDisplay}
                  onChange={(e) => setSettings({ ...settings, phoneDisplay: e.target.value })}
                  placeholder="+91 87003 17239"
                  className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-300 text-xs font-medium text-slate-800"
                  title="Display format in top bar"
                />
                <input
                  type="text"
                  value={settings.phoneTel}
                  onChange={(e) => setSettings({ ...settings, phoneTel: e.target.value })}
                  placeholder="+918700317239"
                  className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-300 text-xs font-mono text-slate-800"
                  title="tel: link target"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Link</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.showWhatsapp}
                  onChange={(e) => setSettings({ ...settings, showWhatsapp: e.target.checked })}
                  className="w-4 h-4 accent-unitech-red"
                />
              </div>
              <input
                type="text"
                value={settings.whatsappLabel}
                onChange={(e) => setSettings({ ...settings, whatsappLabel: e.target.value })}
                placeholder="Quick Order via WhatsApp"
                className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-300 text-xs font-medium text-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Messages List Studio */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-unitech-red" />
              <span>Ticker Headlines & Scheduling ({messages.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Reorder, toggle visibility, and optionally schedule start/end dates for automatic campaign launches.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddMessage}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Headline Message</span>
          </button>
        </div>

        {messages.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            No ticker messages configured. Click "Add Headline Message" to create your first announcement!
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((item, index) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  item.isActive
                    ? "bg-white border-slate-200 shadow-xs"
                    : "bg-slate-50/70 border-slate-200 opacity-60"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Reorder and Status Handle */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleMove(index, "up")}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-20 text-slate-600 cursor-pointer"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, "down")}
                        disabled={index === messages.length - 1}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-20 text-slate-600 cursor-pointer"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-400 w-5 text-center">
                      #{index + 1}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer ml-1" title="Toggle Active">
                      <input
                        type="checkbox"
                        checked={item.isActive}
                        onChange={(e) => handleUpdateMessage(item.id, { isActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                    </label>
                  </div>

                  {/* Badge Text Tag */}
                  <div className="w-full lg:w-40 shrink-0">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Badge Tag
                    </label>
                    <input
                      type="text"
                      value={item.badgeText || ""}
                      onChange={(e) => handleUpdateMessage(item.id, { badgeText: e.target.value })}
                      placeholder="e.g. FACTORY LIVE"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                    />
                  </div>

                  {/* Headline Title */}
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Headline Announcement Text *
                    </label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleUpdateMessage(item.id, { title: e.target.value })}
                      placeholder="Enter announcement text..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
                    />
                  </div>

                  {/* Link URL */}
                  <div className="w-full lg:w-48 shrink-0">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Target Link (Optional)
                    </label>
                    <input
                      type="text"
                      value={item.ctaLink || ""}
                      onChange={(e) => handleUpdateMessage(item.id, { ctaLink: e.target.value })}
                      placeholder="/catalogue or #contact"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono text-slate-700 bg-white"
                    />
                  </div>

                  {/* Delete Button */}
                  <div className="flex items-center justify-end shrink-0 pt-2 lg:pt-0">
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(item.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Scheduling Row (starts_at / ends_at) */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-bold text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Schedule (Optional):</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Starts:</span>
                    <input
                      type="datetime-local"
                      value={item.startsAt ? new Date(item.startsAt).toISOString().slice(0, 16) : ""}
                      onChange={(e) =>
                        handleUpdateMessage(item.id, {
                          startsAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                        })
                      }
                      className="px-2 py-1 rounded border border-slate-200 text-xs bg-white text-slate-700"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Ends:</span>
                    <input
                      type="datetime-local"
                      value={item.endsAt ? new Date(item.endsAt).toISOString().slice(0, 16) : ""}
                      onChange={(e) =>
                        handleUpdateMessage(item.id, {
                          endsAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                        })
                      }
                      className="px-2 py-1 rounded border border-slate-200 text-xs bg-white text-slate-700"
                    />
                  </div>
                  {(item.startsAt || item.endsAt) && (
                    <button
                      type="button"
                      onClick={() => handleUpdateMessage(item.id, { startsAt: null, endsAt: null })}
                      className="text-[10px] text-red-600 hover:underline cursor-pointer"
                    >
                      Clear Schedule
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
