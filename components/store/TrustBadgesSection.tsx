"use client";

import React from "react";
import { Award, Building2, Factory, ShieldCheck, Globe, Leaf, CheckCircle2 } from "lucide-react";

export function TrustBadgesSection() {
  const certifications = [
    {
      label: "ISO 9001:2015",
      descriptor: "Certified Quality OEM",
      scope: "Audited Production & RMA",
      icon: Award,
      image: "/images/brand/ISO-9001-2015.jfif",
    },
    {
      label: "GeM Registered",
      descriptor: "Govt. e-Marketplace",
      scope: "Verified PSU & Tender OEM",
      icon: Building2,
      image: "/images/brand/final-GEM-logo.jpg",
    },
    {
      label: "Make in India",
      descriptor: "100% Domestic Assembly",
      scope: "Direct Sahibabad Factory",
      icon: Factory,
      image: "/images/brand/Make in India.jfif",
    },
    {
      label: "MSME Enterprise",
      descriptor: "Govt. Recognized Unit",
      scope: "Industrial Priority Unit",
      icon: ShieldCheck,
      image: "/images/brand/MSME-Certificate.jpeg",
    },
    {
      label: "CE & FCC Approved",
      descriptor: "International Standards",
      scope: "EMI & Surge Certified",
      icon: Globe,
      image: "/images/brand/CC-FCC.png",
    },
    {
      label: "RoHS Compliant",
      descriptor: "Hazardous-Free Hardware",
      scope: "Lead-Free & Eco-PVC",
      icon: Leaf,
      image: "/images/brand/RoHS Compliant.png",
    },
  ];

  return (
    <section className="py-14 sm:py-20 bg-white border-t border-slate-200/80">
      {/* Full Width Container matching complete site spacing */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        
        {/* Section Headline */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300/80 text-xs font-black uppercase tracking-wider mb-2.5 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
            <span>Industrial Regulatory Benchmarks</span>
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl text-slate-950 tracking-tight leading-tight">
            Certified OEM Standards for Enterprise Deployments
          </h2>
          <p className="text-slate-600 text-sm sm:text-base font-semibold mt-2 leading-relaxed">
            Every camera, hybrid DVR, and pure copper cable manufactured at Unitech adheres to national and international compliance benchmarks.
          </p>
        </div>

        {/* 6 High-Contrast Professional Seal Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 lg:gap-5 xl:gap-6">
          {certifications.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 hover:border-slate-400 hover:shadow-xl transition-all duration-300 text-center flex flex-col items-center justify-between group cursor-default hover:-translate-y-1"
              >
                {/* Official Stamp / Certificate Emblem */}
                <div className="w-full h-20 sm:h-24 flex items-center justify-center mb-4 overflow-hidden">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.label}
                      className="max-h-full max-w-[85%] object-contain drop-shadow-xs group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Icon className="w-10 h-10 stroke-[2] text-slate-900 group-hover:scale-105 transition-transform" />
                  )}
                </div>

                {/* Primary Title & Descriptors */}
                <div className="space-y-1 mb-4 w-full">
                  <h3 className="font-heading font-black text-sm sm:text-base text-slate-950 leading-tight group-hover:text-unitech-red transition-colors">
                    {item.label}
                  </h3>
                  <div className="text-xs sm:text-[13px] font-bold text-slate-800">
                    {item.descriptor}
                  </div>
                  <div className="text-xs text-slate-500 font-normal">
                    {item.scope}
                  </div>
                </div>

                {/* Verified Badge */}
                <div className="w-full pt-2.5 mt-auto border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50/90 py-1.5 rounded-xl border border-emerald-200/70 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Verified Standard</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
