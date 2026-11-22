"use client";

import React from "react";
import Link from "next/link";
import {
  Factory,
  Cpu,
  Cable,
  ShieldCheck,
  Truck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export function AboutManufacturingSection() {
  const capabilities = [
    {
      id: "smt-lines",
      title: "In-House SMT PCB Assembly",
      subtitle: "High-Speed Surface Mount Technology",
      description:
        "Automated Pick-and-Place SMT lines assembling multi-layer ISP processor boards, low-illumination sensor modules, and hybrid DVR motherboards with precision passive filtering.",
      icon: Cpu,
      highlights: [
        "0.02mm SMT Placement Accuracy",
        "100% Optical Automated Inspection (AOI)",
      ],
      accent: "bg-red-50 text-unitech-red border-red-200",
    },
    {
      id: "copper-extrusion",
      title: "100% Pure Solid Copper Drawing",
      subtitle: "Zero Copper-Clad Aluminium (0% CCA)",
      description:
        "Dedicated extrusion line manufacturing 3+1 coaxial surveillance cables and Cat6 UTP boxes using annealed electrolytic copper conductors for zero signal loss over 100m+ camera runs.",
      icon: Cable,
      highlights: [
        "Electrolytic Annealed Copper",
        "Flame-Retardant PVC Jacket",
      ],
      accent: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      id: "stress-testing",
      title: "72-Hour Burn-In Stress Chamber",
      subtitle: "Extreme Thermal & Voltage Testing",
      description:
        "Every production batch undergoes 72 hours of continuous thermal stress (-10°C to +55°C), dynamic power-surge cycling, and lux benchmark calibration before dispatch packing.",
      icon: ShieldCheck,
      highlights: [
        "< 0.3% Field RMA Failure Rate",
        "High-Voltage Surge Protection",
      ],
      accent: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      id: "logistics-hub",
      title: "Sahibabad Central Dispatch Depot",
      subtitle: "Rapid Pan-India Wholesale Supply",
      description:
        "State-of-the-art warehouse facility in Sahibabad Industrial Area (Ghaziabad NCR) holding buffer stock for 10,000+ active dealers with protected territory wholesale allocations.",
      icon: Truck,
      highlights: [
        "24-48 Hr Fast Wholesale Dispatch",
        "Tier-1 Pan-India Logistics Network",
      ],
      accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
  ];

  return (
    <section id="about-manufacturing" className="py-12 sm:py-20 bg-white border-y border-slate-200/80">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-14 gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-red-50 text-unitech-red border border-red-200/90 shadow-2xs">
              <Factory className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Factory Direct OEM & Infrastructure</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
              22+ Years of Precision CCTV & Cable Manufacturing in India
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm lg:text-[15px] mt-2.5 leading-relaxed font-normal">
              Established in 2002, <strong>Unitech Security Systems Pvt. Ltd.</strong> operates direct manufacturing facilities in Sahibabad (NCR). Explore our engineering workflows, strict QA stress-testing pipelines, and wholesale distributor benefits.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Link
              href="/inquiry?type=DISTRIBUTOR"
              className="px-7 py-4 rounded-full bg-unitech-red hover:bg-unitech-darkred text-white text-xs sm:text-sm font-bold transition-all shadow-[0_6px_20px_rgba(230,0,0,0.3)] hover:shadow-[0_8px_24px_rgba(230,0,0,0.4)] hover:-translate-y-0.5 flex items-center gap-2.5 active:scale-95 cursor-pointer"
            >
              <span>Apply for Dealership</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
          </div>
        </div>

        {/* 4 Operational Workaround Cards (No Truncation) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7 mb-10 sm:mb-14">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-[#faf9f5] border border-slate-200/90 rounded-2xl sm:rounded-3xl p-6 sm:p-7 flex flex-col justify-between hover:border-unitech-red/40 hover:bg-white hover:shadow-md transition-all group"
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${item.accent} group-hover:scale-105 transition-transform shadow-2xs`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading font-black text-slate-950 text-base sm:text-lg leading-tight">
                    {item.title}
                  </h3>
                  <div className="text-[11px] font-bold text-unitech-red mt-1">
                    {item.subtitle}
                  </div>
                  <p className="text-slate-600 text-xs sm:text-[13px] mt-2.5 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>

                {/* Highlight Checkmarks with Full Text (No Truncation) */}
                <div className="mt-6 pt-4 border-t border-slate-200/80 space-y-2">
                  {item.highlights.map((hl, i) => (
                    <div
                      key={i}
                      className="text-xs font-semibold text-slate-700 flex items-center gap-2 leading-snug"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Factory Metrics Strip */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-200">
            <div className="pt-2 md:pt-0">
              <div className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-slate-950">
                22+ <span className="text-unitech-red text-2xl sm:text-3xl">Yrs</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 mt-1.5">Established OEM (Est. 2002)</p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Over two decades in CCTV manufacturing</p>
            </div>

            <div className="pt-4 md:pt-0">
              <div className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-slate-950">
                10,000+
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 mt-1.5">Active Indian Dealers</p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Supplying installers across 28 states</p>
            </div>

            <div className="pt-4 md:pt-0">
              <div className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-slate-950">
                50,000+
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 mt-1.5">Sq. Ft. Plant & Buffer Depot</p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Sahibabad Industrial Area, UP</p>
            </div>

            <div className="pt-4 md:pt-0">
              <div className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-emerald-600">
                24-48 <span className="text-xl sm:text-2xl font-bold">Hrs</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 mt-1.5">Wholesale Dispatch Time</p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Same-day packing on standard batches</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
