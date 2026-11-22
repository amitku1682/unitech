"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/store/Navbar";
import { Footer } from "@/components/store/Footer";
import { AboutManufacturingSection } from "@/components/store/AboutManufacturingSection";
import {
  Users,
  Camera,
  CheckCircle2,
  Building2,
  Quote,
  Award,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import { DEFAULT_LEADERSHIP, LeadershipDirector } from "@/lib/leadershipData";

export default function AboutPage() {
  const [directors, setDirectors] = useState<LeadershipDirector[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("unitech_about_leadership");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_LEADERSHIP;
  });

  useEffect(() => {
    fetch("/api/about-leadership", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length >= 2) {
          setDirectors(json.data);
          try {
            localStorage.setItem("unitech_about_leadership", JSON.stringify(json.data));
          } catch {}
        }
      })
      .catch((err) => console.warn("[About leadership fetch fallback]:", err));
  }, []);

  const dir1 = directors[0] || DEFAULT_LEADERSHIP[0];
  const dir2 = directors[1] || DEFAULT_LEADERSHIP[1];
  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col">
      {/* 1. Global Navigation Bar */}
      <Navbar />

      {/* 2. Breadcrumb Navigation Strip - Full Width Edge-to-Edge */}
      <div className="bg-white border-b border-slate-200/80 py-3.5 sm:py-4">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">About Unitech</span>
        </div>
      </div>

      <main className="flex-1">
        {/* ========================================================= */}
        {/* 1. COMPANY OVERVIEW SECTION (FRAMED ENTERPRISE SHOWCASE)  */}
        {/* ========================================================= */}
        <section id="overview" className="py-8 sm:py-12 lg:py-16 bg-[#faf9f5] border-b border-slate-200/80">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
            {/* Master Enterprise Card Frame */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 lg:p-10 xl:p-12 relative overflow-hidden">
              {/* Subtle Blueprint Grid Pattern on the Master Frame */}
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(#0f172a 1px, transparent 1px)`,
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Top Row: Narrative & Brand Emblem Showcase */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center relative z-10">
                {/* Left Column: Headline and Overview Text */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-red-50 text-unitech-red border border-red-200/90 shadow-2xs">
                    <Building2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Established 2002 · Sahibabad Industrial Area (NCR)</span>
                  </div>
                  
                  <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
                    Company Overview
                  </h1>
                  
                  <p className="text-sm sm:text-base lg:text-[17px] font-bold text-slate-900 leading-snug">
                    Pioneering Indigenous Surveillance & 100% Solid Copper Cable Manufacturing in India.
                  </p>

                  <p className="text-slate-600 text-xs sm:text-sm lg:text-[15px] leading-relaxed font-normal">
                    <strong>Unitech Security Systems Pvt. Ltd.</strong> is one of India&apos;s established
                    surveillance hardware manufacturers. Established in 2002 in Sahibabad Industrial Area
                    (Ghaziabad NCR), Unitech has grown from a specialized copper extrusion workshop into a premier
                    end-to-end security hardware manufacturer supplying 4MP/5MP/4K Warm Light cameras, 32-CH hybrid DVRs,
                    PoE switches, server racks, and solid annealed copper transmission lines to over 10,000+ dealers and government infrastructure
                    projects nationwide.
                  </p>
                </div>

                {/* Right Column: Branded Studio Emblem Frame */}
                <div className="lg:col-span-4 flex items-center justify-center">
                  <div className="w-full max-w-sm bg-slate-50/80 rounded-2xl border border-slate-200/90 p-6 sm:p-7 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xs group">
                    {/* CCTV Corner Crosshairs */}
                    <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-slate-300 group-hover:border-unitech-red/50 transition-colors" />
                    <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-slate-300 group-hover:border-unitech-red/50 transition-colors" />
                    <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-slate-300 group-hover:border-unitech-red/50 transition-colors" />
                    <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-slate-300 group-hover:border-unitech-red/50 transition-colors" />

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/brand/unitech-actual-logo.png"
                      alt="Unitech Security Systems Official Logo"
                      className="w-full max-w-[190px] sm:max-w-[220px] h-auto object-contain drop-shadow-sm select-none group-hover:scale-105 transition-transform duration-300"
                    />

                    <div className="mt-4 pt-3 border-t border-slate-200/80 w-full flex items-center justify-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Official OEM · Sahibabad Plant</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: 3 Credential Cards Fitted Inside the Frame */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 mt-8 sm:mt-10 pt-8 border-t border-slate-100 relative z-10">
                {/* Card 1: ISO 9001:2015 Quality Certified */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 border border-slate-200/90 hover:border-unitech-red/40 hover:bg-white hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-unitech-red flex items-center justify-center border border-red-200/80 shadow-2xs group-hover:scale-105 transition-transform">
                        <Award className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                        Verified Standard
                      </span>
                    </div>
                    <h3 className="font-heading font-black text-slate-950 text-base sm:text-lg mb-1.5">
                      ISO 9001:2015 Quality Certified
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal">
                      Audited factory production adhering to stringent ISO quality benchmarks, 100% automated optical inspection (AOI), and continuous thermal stress testing.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] font-mono font-bold text-slate-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-unitech-red" />
                    <span>Certified Surveillance OEM</span>
                  </div>
                </div>

                {/* Card 2: Govt. GeM OEM Verified */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 border border-slate-200/90 hover:border-unitech-red/40 hover:bg-white hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/80 shadow-2xs group-hover:scale-105 transition-transform">
                        <Landmark className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                        Verified Standard
                      </span>
                    </div>
                    <h3 className="font-heading font-black text-slate-950 text-base sm:text-lg mb-1.5">
                      Govt. GeM OEM Verified
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal">
                      Accredited OEM vendor on the Government e-Marketplace, supplying PSUs, smart cities, and municipal surveillance tenders with authentic MAF authorizations.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] font-mono font-bold text-slate-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <span>Public Sector Tender Partner</span>
                  </div>
                </div>

                {/* Card 3: Make in India */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 border border-slate-200/90 hover:border-unitech-red/40 hover:bg-white hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/80 shadow-2xs group-hover:scale-105 transition-transform">
                        <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                        Verified Standard
                      </span>
                    </div>
                    <h3 className="font-heading font-black text-slate-950 text-base sm:text-lg mb-1.5">
                      Make in India
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal">
                      100% indigenous manufacturing at our Sahibabad industrial complex in Ghaziabad NCR, featuring in-house SMT circuit assembly and pure copper wire drawing.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] font-mono font-bold text-slate-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>Direct Domestic Production</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. EXECUTIVE LEADERSHIP (BOARD OF DIRECTORS & FOUNDERS)   */}
        {/* ========================================================= */}
        <section id="leadership" className="py-10 sm:py-16 lg:py-20 bg-[#faf9f5] border-b border-slate-200/80">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="text-center max-w-5xl mx-auto mb-10 sm:mb-14">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-red-50 text-unitech-red border border-red-200/90 mb-3 shadow-2xs">
                <Users className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Executive Leadership</span>
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight lg:whitespace-nowrap">
                Board of Directors & Founders
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm lg:text-[15px] mt-2.5 leading-relaxed font-normal lg:whitespace-nowrap">
                The technical vision and manufacturing leadership guiding Unitech Security Systems for over two decades.
              </p>
            </div>

            {/* Two Side-by-Side Leadership Frames (Left & Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
              
              {/* FRAME 1: LEFT SIDE (Owner / Founder Details) */}
              <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-9 shadow-xs hover:border-unitech-red/40 hover:shadow-md transition-all flex flex-col justify-between">
                <div className="space-y-5 sm:space-y-6">
                  {/* Image Placeholder Frame (Structured Professional Container) */}
                  <div className="relative w-full aspect-[16/10] sm:aspect-[4/3] rounded-2xl bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-6 text-center group overflow-hidden">
                    {dir1.photoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={dir1.photoUrl}
                        alt={dir1.name}
                        className="w-full h-full object-cover rounded-2xl mix-blend-multiply"
                      />
                    ) : (
                      <>
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm mb-3 group-hover:scale-105 transition-transform">
                          <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-unitech-red" />
                        </div>
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 block">
                          [Owner & Founder Photo Placeholder]
                        </span>
                        <span className="text-[11px] text-slate-500 mt-1 max-w-xs font-medium">
                          High-resolution executive portrait frame · 400 × 480 px recommended
                        </span>
                      </>
                    )}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[10px] font-mono font-bold shadow-xs">
                      Director Frame 01
                    </div>
                  </div>

                  {/* Owner Details */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-black text-unitech-red uppercase tracking-wider bg-red-50 px-3 py-1 rounded-full border border-red-200 shadow-2xs">
                        {dir1.badge || "Managing Director & Founder"}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">{dir1.since || "Since 2002"}</span>
                    </div>

                    <h3 className="font-heading font-black text-xl sm:text-2xl text-slate-950">
                      {dir1.name || "Managing Director & Founder"}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                      {dir1.bio}
                    </p>

                    {/* Highlights / Specializations */}
                    <div className="pt-3 space-y-2 text-xs sm:text-[13px] text-slate-700">
                      {(dir1.highlights || []).map((h, hIdx) => (
                        <div key={hIdx} className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Founder Quote Card */}
                {dir1.quote && (
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-start gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70">
                    <Quote className="w-5 h-5 text-unitech-red shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-[13px] italic text-slate-700 leading-relaxed">
                      &ldquo;{dir1.quote}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* FRAME 2: RIGHT SIDE (Co-Founder / Technical Director Details) */}
              <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-9 shadow-xs hover:border-unitech-red/40 hover:shadow-md transition-all flex flex-col justify-between">
                <div className="space-y-5 sm:space-y-6">
                  {/* Image Placeholder Frame (Structured Professional Container) */}
                  <div className="relative w-full aspect-[16/10] sm:aspect-[4/3] rounded-2xl bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-6 text-center group overflow-hidden">
                    {dir2.photoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={dir2.photoUrl}
                        alt={dir2.name}
                        className="w-full h-full object-cover rounded-2xl mix-blend-multiply"
                      />
                    ) : (
                      <>
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm mb-3 group-hover:scale-105 transition-transform">
                          <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-unitech-red" />
                        </div>
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 block">
                          [Technical Director & Co-Founder Photo Placeholder]
                        </span>
                        <span className="text-[11px] text-slate-500 mt-1 max-w-xs font-medium">
                          High-resolution executive portrait frame · 400 × 480 px recommended
                        </span>
                      </>
                    )}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[10px] font-mono font-bold shadow-xs">
                      Director Frame 02
                    </div>
                  </div>

                  {/* Owner Details */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-black text-blue-700 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-200 shadow-2xs">
                        {dir2.badge || "Technical Director & Head of Operations"}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">{dir2.since || "Since 2002"}</span>
                    </div>

                    <h3 className="font-heading font-black text-xl sm:text-2xl text-slate-950">
                      {dir2.name || "Technical Director & Co-Founder"}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                      {dir2.bio}
                    </p>

                    {/* Highlights / Specializations */}
                    <div className="pt-3 space-y-2 text-xs sm:text-[13px] text-slate-700">
                      {(dir2.highlights || []).map((h, hIdx) => (
                        <div key={hIdx} className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Founder Quote Card */}
                {dir2.quote && (
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-start gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70">
                    <Quote className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-[13px] italic text-slate-700 leading-relaxed">
                      &ldquo;{dir2.quote}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. MANUFACTURING & OEM INFRASTRUCTURE DETAILS             */}
        {/* ========================================================= */}
        <section id="manufacturing-details">
          <AboutManufacturingSection />
        </section>
      </main>

      {/* 4. Global Footer */}
      <Footer />
    </div>
  );
}
