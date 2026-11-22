"use client";

import React, { useState } from "react";
import { formatINR } from "@/lib/utils";
import {
  SlidersHorizontal,
  Home,
  Store,
  Factory,
  Building2,
  HardDrive,
  Camera,
  Cable,
  Check,
  ShoppingBag,
  FileText,
  Sparkles,
  ShieldCheck,
  Zap,
  MessageCircle,
} from "lucide-react";

interface KitBuilderProps {
  onAddKitToCart: (kitDetails: any) => void;
  onOpenQuoteModal: (kitDetails: any) => void;
}

export function KitBuilder({ onAddKitToCart, onOpenQuoteModal }: KitBuilderProps) {
  const [siteType, setSiteType] = useState<string>("SHOP");
  const [cameraType, setCameraType] = useState<string>("4MP");
  const [cameraCount, setCameraCount] = useState<number>(8);
  const [retentionDays, setRetentionDays] = useState<number>(15);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  // Dynamic calculations based on CCTV industry standard H.265+ bitrate:
  const getCalculatedStorage = () => {
    let mbPerDayPerCamera = 25; // H.265+ 2MP
    if (cameraType === "4MP") mbPerDayPerCamera = 45;
    if (cameraType === "8MP") mbPerDayPerCamera = 90;

    const totalGb = (cameraCount * mbPerDayPerCamera * retentionDays) / 1000;
    if (totalGb <= 1000) return 1;
    if (totalGb <= 2000) return 2;
    if (totalGb <= 4000) return 4;
    if (totalGb <= 8000) return 8;
    return 12;
  };

  const calculatedHddTb = getCalculatedStorage();

  // Recommended DVR
  const getRecommendedDvr = () => {
    if (cameraCount <= 4) return "Unitech 4-CH 5MP Hybrid DVR";
    if (cameraCount <= 8) return "Unitech 8-CH 5MP Hybrid DVR";
    if (cameraCount <= 16) return "Unitech 16-CH 4K Hybrid DVR";
    return "Unitech 32-CH 4K Hybrid DVR";
  };

  // Cable rolls required (90m rolls)
  const cableRolls = Math.max(1, Math.ceil(cameraCount / 4));

  // SMPS Power
  const smpsModel =
    cameraCount <= 4
      ? "Unitech 4-CH 5A SMPS"
      : cameraCount <= 8
      ? "Unitech 8-CH 10A SMPS"
      : "Unitech 16-CH 20A SMPS";

  // Price estimation
  const getBaseCameraPrice = () => {
    if (cameraType === "2MP") return 780;
    if (cameraType === "4MP") return 1850;
    return 4200;
  };

  const dvrPrice = cameraCount <= 4 ? 1800 : cameraCount <= 8 ? 2600 : cameraCount <= 16 ? 4800 : 8900;
  const hddPrice = calculatedHddTb === 1 ? 2800 : calculatedHddTb === 2 ? 4200 : calculatedHddTb === 4 ? 7400 : 12500;
  const cablePrice = cableRolls * 1150;
  const smpsPrice = cameraCount <= 4 ? 420 : cameraCount <= 8 ? 620 : 1150;
  const accessoriesPrice = cameraCount * 90; // BNC & DC pins

  const subtotal =
    cameraCount * getBaseCameraPrice() +
    dvrPrice +
    hddPrice +
    cablePrice +
    smpsPrice +
    accessoriesPrice;

  const gst18 = Math.round(subtotal * 0.18);
  const totalWithGst = subtotal + gst18;

  const kitSummary = {
    siteType,
    cameraType:
      cameraType === "2MP"
        ? "2.4MP Full HD"
        : cameraType === "4MP"
        ? "4MP Warm Light Full-Color"
        : "8MP 4K Ultra HD",
    cameraCount,
    retentionDays,
    dvr: getRecommendedDvr(),
    hdd: `${calculatedHddTb}TB Surveillance Hard Drive`,
    cable: `${cableRolls} Roll(s) 3+1 Solid Copper (90m each)`,
    smps: smpsModel,
    subtotal,
    gst18,
    totalWithGst,
  };

  const handleAddKit = () => {
    onAddKitToCart(kitSummary);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <section id="kit-builder" className="py-10 sm:py-16 pb-24 lg:pb-16 bg-[#faf9f5] border-b border-slate-200/80">
      <div className="w-full px-5 sm:px-6 lg:px-8 xl:px-10">
        
        {/* Section Header - Studio Alignment */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 text-unitech-red border border-red-200/90 text-xs font-black uppercase tracking-wider shadow-2xs mb-3.5">
            <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Interactive Surveillance Planner</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
            The 60-Second CCTV Kit Builder
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm lg:text-[15px] mt-2.5 leading-relaxed max-w-2xl mx-auto font-normal line-clamp-2 sm:line-clamp-none">
            Configure your enterprise CCTV setup in 3 clean steps. Our engineering engine
            automatically calculates storage retention, matches DVR channels, and sizes 100% solid copper cables.
          </p>
        </div>

        {/* 2-Column Interactive Workspace - Stretched Edge-to-Edge */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-start">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: Simplified 3-Step Configurator (lg:col-span-7) */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-6 sm:space-y-8 bg-white border border-slate-200/90 p-6 sm:p-8 lg:p-9 rounded-2xl sm:rounded-3xl shadow-xs">
            
            {/* Step 1: Select Installation Environment */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-unitech-red text-white text-xs font-black flex items-center justify-center shrink-0 shadow-sm shadow-unitech-red/30">
                    1
                  </span>
                  <h3 className="font-heading font-black text-slate-950 text-base sm:text-lg tracking-tight">
                    Choose Site / Environment
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono font-bold hidden sm:inline">
                  Step 1 of 3
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: "HOME", label: "Home / Flat", sub: "2-4 Cams", icon: Home },
                  { id: "SHOP", label: "Retail Shop", sub: "4-8 Cams", icon: Store },
                  { id: "OFFICE", label: "Corporate Office", sub: "8-16 Cams", icon: Building2 },
                  { id: "FACTORY", label: "Factory / Plant", sub: "16-32 Cams", icon: Factory },
                ].map((site) => {
                  const Icon = site.icon;
                  const isSelected = siteType === site.id;

                  return (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => {
                        setSiteType(site.id);
                        if (site.id === "HOME") setCameraCount(4);
                        if (site.id === "SHOP") setCameraCount(8);
                        if (site.id === "OFFICE") setCameraCount(16);
                        if (site.id === "FACTORY") setCameraCount(32);
                      }}
                      className={`p-4 sm:p-5 rounded-2xl text-left border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? "bg-red-50/60 border-unitech-red text-slate-950 ring-2 ring-unitech-red/25 shadow-xs"
                          : "bg-slate-50/70 border border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-unitech-red text-white flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                      <Icon className={`w-5 h-5 mb-3.5 ${isSelected ? "text-unitech-red" : "text-slate-500"}`} />
                      <div>
                        <div className="font-heading font-black text-xs sm:text-sm text-slate-950 leading-tight">
                          {site.label}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 font-medium">{site.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Camera Type & Quantity */}
            <div className="border-t border-slate-100 pt-6 sm:pt-7">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-unitech-red text-white text-xs font-black flex items-center justify-center shrink-0 shadow-sm shadow-unitech-red/30">
                    2
                  </span>
                  <h3 className="font-heading font-black text-slate-950 text-base sm:text-lg tracking-tight">
                    Select Camera Clarity & Quantity
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono font-bold hidden sm:inline">
                  Step 2 of 3
                </span>
              </div>

              {/* 3 Clarity Tiers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {[
                  {
                    id: "2MP",
                    title: "2.4MP Full HD",
                    desc: "Crisp Day / IR Night Vision",
                    tag: "Economy",
                    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
                  },
                  {
                    id: "4MP",
                    title: "4MP Warm Light",
                    desc: "24/7 Vivid Color in Darkness",
                    tag: "★ Recommended",
                    badgeColor: "bg-red-50 text-unitech-red border-red-200 font-bold",
                  },
                  {
                    id: "8MP",
                    title: "8MP 4K Ultra HD",
                    desc: "Extreme License Plate Clarity",
                    tag: "High Security",
                    badgeColor: "bg-amber-50 text-amber-800 border-amber-200 font-bold",
                  },
                ].map((cam) => {
                  const isSelected = cameraType === cam.id;

                  return (
                    <button
                      key={cam.id}
                      type="button"
                      onClick={() => setCameraType(cam.id)}
                      className={`p-4 sm:p-5 rounded-2xl text-left border transition-all cursor-pointer relative ${
                        isSelected
                          ? "bg-red-50/60 border-unitech-red text-slate-950 ring-2 ring-unitech-red/25 shadow-xs"
                          : "bg-slate-50/70 border border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="font-heading font-black text-xs sm:text-sm text-slate-950">
                          {cam.title}
                        </span>
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.5 rounded border ${cam.badgeColor}`}
                        >
                          {cam.tag}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 leading-relaxed font-medium">{cam.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Camera Quantity Presets */}
              <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-950 block">Number of Cameras</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Total camera endpoints for this site ({cameraCount} selected)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {[4, 8, 16, 24, 32].map((num) => {
                    const isSelected = cameraCount === num;

                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCameraCount(num)}
                        className={`w-11 h-11 rounded-xl font-heading font-black text-xs sm:text-sm transition-all cursor-pointer ${
                          isSelected
                            ? "bg-unitech-red text-white shadow-md shadow-unitech-red/30 scale-105"
                            : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 3: Recording Retention Days */}
            <div className="border-t border-slate-100 pt-6 sm:pt-7">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-unitech-red text-white text-xs font-black flex items-center justify-center shrink-0 shadow-sm shadow-unitech-red/30">
                    3
                  </span>
                  <h3 className="font-heading font-black text-slate-950 text-base sm:text-lg tracking-tight">
                    Recording Retention Period
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono font-bold hidden sm:inline">
                  Step 3 of 3
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[7, 15, 30, 60].map((days) => {
                  const isSelected = retentionDays === days;

                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setRetentionDays(days)}
                      className={`p-4 rounded-2xl font-heading text-center border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50/70 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/25 shadow-xs"
                          : "bg-slate-50/70 border border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-black text-xs sm:text-sm text-slate-950">{days} Days</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Continuous 24/7</div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3.5 flex items-center gap-2.5 text-xs text-amber-900 bg-amber-50/80 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-amber-200/80 shadow-2xs">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Auto-calculated storage provisioned:{" "}
                  <strong className="text-slate-950 font-bold">{calculatedHddTb}TB Surveillance Grade HDD</strong> based on H.265+ smart compression.
                </span>
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: Live Bill of Materials (BOM) & Calculation */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 xl:col-span-5 bg-white text-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/90 lg:sticky lg:top-24 space-y-5">
            
            {/* Header */}
            <div id="custom-kit-breakdown" className="pb-4 border-b border-slate-100">
              <span className="text-[11px] uppercase font-extrabold text-unitech-red tracking-wider block mb-0.5">
                Live Bill of Materials (BOM)
              </span>
              <h3 className="font-heading font-black text-slate-950 text-xl sm:text-2xl tracking-tight">
                Custom Kit Breakdown
              </h3>
              <div className="mt-2">
                <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  100% Compatible
                </span>
              </div>
            </div>

            {/* Itemized Kit Components */}
            <div className="space-y-2.5 text-xs">
              
              {/* Cameras */}
              <div className="flex items-center justify-between p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-unitech-red flex items-center justify-center shrink-0 border border-red-200/80 shadow-2xs">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-950 block text-xs sm:text-[13px]">
                      {cameraCount}× {kitSummary.cameraType}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">IP67 Weatherproof Metal Housing</span>
                  </div>
                </div>
                <span className="font-black text-slate-950 text-xs sm:text-sm">
                  {formatINR(cameraCount * getBaseCameraPrice())}
                </span>
              </div>

              {/* DVR */}
              <div className="flex items-center justify-between p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/80 shadow-2xs">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-950 block text-xs sm:text-[13px]">{kitSummary.dvr}</span>
                    <span className="text-[11px] text-slate-500 font-medium">H.265+ 4K Hybrid Standalone</span>
                  </div>
                </div>
                <span className="font-black text-slate-950 text-xs sm:text-sm">{formatINR(dvrPrice)}</span>
              </div>

              {/* Hard Drive */}
              <div className="flex items-center justify-between p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/80 shadow-2xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-950 block text-xs sm:text-[13px]">{kitSummary.hdd}</span>
                    <span className="text-[11px] text-emerald-700 font-bold">
                      Auto-sized for {retentionDays} Days Storage
                    </span>
                  </div>
                </div>
                <span className="font-black text-slate-950 text-xs sm:text-sm">{formatINR(hddPrice)}</span>
              </div>

              {/* Cable Rolls */}
              <div className="flex items-center justify-between p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/80 shadow-2xs">
                    <Cable className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-950 block text-xs sm:text-[13px]">{kitSummary.cable}</span>
                    <span className="text-[11px] text-slate-500 font-medium">100% Solid Annealed Copper</span>
                  </div>
                </div>
                <span className="font-black text-slate-950 text-xs sm:text-sm">{formatINR(cablePrice)}</span>
              </div>

              {/* SMPS & Connectors */}
              <div className="flex items-center justify-between p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-950 block text-xs sm:text-[13px]">{kitSummary.smps}</span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Plus {cameraCount * 2} BNC & {cameraCount} DC Connectors
                    </span>
                  </div>
                </div>
                <span className="font-black text-slate-950 text-xs sm:text-sm">
                  {formatINR(smpsPrice + accessoriesPrice)}
                </span>
              </div>
            </div>

            {/* Total Pricing Calculation Box */}
            <div className="p-5 rounded-2xl bg-slate-950 text-white shadow-inner space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                <span>Hardware Subtotal:</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium pb-2">
                <span>GST (18% Input Credit):</span>
                <span>{formatINR(gst18)}</span>
              </div>
              <div className="border-t border-slate-800 pt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                    Complete Kit Price
                  </span>
                  <span className="font-heading text-2xl sm:text-3xl font-black text-white">
                    {formatINR(totalWithGst)}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium text-right">
                  Incl. GST & 2-Yr Warranty
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleAddKit}
                className={`w-full py-4 px-6 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(230,0,0,0.3)] hover:shadow-[0_6px_20px_rgba(230,0,0,0.4)] hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
                  isAdded
                    ? "bg-emerald-600 text-white"
                    : "bg-unitech-red hover:bg-unitech-darkred text-white"
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Complete Kit Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add Complete Kit to Cart</span>
                  </>
                )}
              </button>

              <a
                href={`https://wa.me/918700317239?text=${encodeURIComponent(
                  `Hello Unitech Sales Desk, please share the Official 18% GST PDF Quotation for this configured CCTV Kit:\n\n• Deployment Site: ${kitSummary.siteType}\n• Cameras: ${kitSummary.cameraCount}x ${kitSummary.cameraType}\n• Recorder / DVR: ${kitSummary.dvr}\n• Surveillance Storage: ${kitSummary.hdd}\n• Cabling: ${kitSummary.cable}\n• Power Supply: ${kitSummary.smps}\n• Estimated Total: ${formatINR(kitSummary.totalWithGst)} (Incl. 18% GST & 2-Yr SLA Warranty)\n\nPlease generate and send the official GST PDF quotation to this number.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 rounded-full text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/90 transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:scale-95"
              >
                <FileText className="w-4 h-4 text-slate-600" />
                <span>Request Official GST PDF Quotation</span>
              </a>

              <a
                href={`https://wa.me/918700317239?text=${encodeURIComponent(
                  `Hi Unitech, I configured a CCTV Kit on your website:\n- Site: ${kitSummary.siteType}\n- Cameras: ${kitSummary.cameraCount}x ${kitSummary.cameraType}\n- DVR: ${kitSummary.dvr}\n- Storage: ${kitSummary.hdd}\n- Cable: ${kitSummary.cable}\n- Power: ${kitSummary.smps}\n- Total Price: ${formatINR(kitSummary.totalWithGst)} (Incl. 18% GST)\nPlease share bulk dealer pricing.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 rounded-full text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Instant Inquiry</span>
              </a>
            </div>

          </div>

        </div>
      </div>

      {/* Mobile Sticky Bottom Bar (<900px) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-5 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kit Total (Incl. GST)</span>
          <span className="font-heading font-black text-base text-slate-950 truncate">
            {formatINR(kitSummary.totalWithGst)}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="#custom-kit-breakdown"
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center transition-colors"
          >
            View kit
          </a>
          <button
            type="button"
            onClick={handleAddKit}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs ${
              isAdded ? "bg-emerald-600" : "bg-unitech-red hover:bg-unitech-darkred"
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
