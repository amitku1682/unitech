"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/store/Navbar";
import { Footer } from "@/components/store/Footer";
import {
  MapPin,
  Building2,
  Phone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Search,
} from "lucide-react";
import { DealerHub } from "@/lib/types";

export default function DealersPage() {
  const [searchState, setSearchState] = useState("");
  const [dealers, setDealers] = useState<DealerHub[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("unitech_admin_dealers");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    fetch("/api/dealers", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setDealers(json.data);
          try {
            localStorage.setItem("unitech_admin_dealers", JSON.stringify(json.data));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const activeHubs = dealers.filter((d) => d.isActive !== false);

  const filteredHubs = activeHubs.filter(
    (h) =>
      searchState === "" ||
      h.state.toLowerCase().includes(searchState.toLowerCase()) ||
      h.city.toLowerCase().includes(searchState.toLowerCase()) ||
      h.address.toLowerCase().includes(searchState.toLowerCase()) ||
      h.type.toLowerCase().includes(searchState.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col">
      <Navbar />

      {/* Breadcrumb Strip */}
      <div className="bg-white border-b border-slate-200/80 py-3.5">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Authorized Dealer & Distributor Network</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200/80 py-8 sm:py-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-unitech-red/10 text-unitech-red border border-unitech-red/20 mb-3">
              <Building2 className="w-3.5 h-3.5" />
              <span>Pan-India Distribution Footprint</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
              Authorized Dealers & Service Centers
            </h1>
            <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Over 10,000+ certified security dealers, wholesale stockists, and installation partners across 28 Indian states.
            </p>
          </div>

          <Link
            href="/inquiry?type=DISTRIBUTOR"
            className="px-6 py-3 rounded-full bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold transition-all shadow-md shadow-unitech-red/20 flex items-center gap-2 shrink-0"
          >
            <span>Apply for Distributorship</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8 sm:py-10 flex-1">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by state or city (e.g. Maharashtra, Jaipur)..."
              value={searchState}
              onChange={(e) => setSearchState(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-unitech-red/20 focus:border-unitech-red transition-all shadow-2xs"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredHubs.length}</strong> {filteredHubs.length === 1 ? "Authorized Hub" : "Authorized Hubs"}
          </div>
        </div>

        {/* Hubs Grid */}
        {filteredHubs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-8 shadow-2xs">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 text-sm font-semibold">
              No authorized hubs found matching "{searchState}".
            </p>
            <button
              onClick={() => setSearchState("")}
              className="mt-3 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Reset Search Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHubs.map((hub, idx) => (
              <div
                key={idx}
                className="p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
                      {hub.type}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Hub
                    </span>
                  </div>

                  <h3 className="font-heading font-black text-slate-950 text-lg tracking-tight mb-1 group-hover:text-unitech-red transition-colors">
                    {hub.state}
                  </h3>
                  <div className="text-xs font-bold text-unitech-red mb-3 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-unitech-red/70 shrink-0" />
                    <span>{hub.city}</span>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs text-slate-800 font-medium mb-5 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                    <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <span>{hub.address}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                  <a
                    href={`tel:${hub.contact.replace(/[^0-9]/g, "")}`}
                    className="font-bold text-slate-800 hover:text-unitech-red flex items-center gap-1.5 transition-colors py-1.5 px-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200"
                  >
                    <Phone className="w-3.5 h-3.5 text-unitech-red" />
                    <span>{hub.contact}</span>
                  </a>

                  <Link
                    href={`/inquiry?type=DISTRIBUTOR&region=${encodeURIComponent(hub.state)}`}
                    className="font-bold text-xs px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-unitech-red text-white transition-all shadow-xs flex items-center gap-1"
                  >
                    <span>Connect</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Distributorship CTA Card */}
        <div className="mt-12 p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-red-50/80 via-white to-slate-50/90 border-2 border-red-100/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
          {/* Subtle Background Accent Glow */}
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-red-100/50 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3 relative z-10 max-w-3xl text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-unitech-red/10 text-unitech-red border border-unitech-red/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Direct Factory Onboarding</span>
            </div>

            <h3 className="font-heading text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Partner With India's Indigenous Surveillance OEM
            </h3>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-2xl">
              Enjoy wholesale B2B pricing, guaranteed Sahibabad dispatch timelines, dedicated field engineer support, and GeM tender authorization.
            </p>

            {/* Quick Feature Credentials */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200/90 px-3 py-1 rounded-lg shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Protected Territory Margins</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200/90 px-3 py-1 rounded-lg shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>24-48 Hr Factory Dispatch</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200/90 px-3 py-1 rounded-lg shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>GeM & Govt Tender Auth</span>
              </span>
            </div>
          </div>

          <div className="relative z-10 shrink-0">
            <Link
              href="/inquiry?type=DISTRIBUTOR"
              className="px-6 py-3.5 rounded-full bg-unitech-red hover:bg-unitech-darkred text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-unitech-red/20 hover:shadow-lg hover:shadow-unitech-red/30 flex items-center gap-2"
            >
              <span>Apply for Distributorship</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
