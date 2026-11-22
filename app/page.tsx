"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Product, GoogleReview, Category } from "@/lib/types";
import { Navbar } from "@/components/store/Navbar";
import { HeroSection } from "@/components/store/HeroSection";
import { CategoryShowcase } from "@/components/store/CategoryShowcase";
import { PopularCatalog } from "@/components/store/PopularCatalog";
import { GoogleReviewsSection } from "@/components/store/GoogleReviewsSection";
import { TrustBadgesSection } from "@/components/store/TrustBadgesSection";
import { Footer } from "@/components/store/Footer";
import {
  SlidersHorizontal,
  ArrowRight,
  ShieldCheck,
  Factory,
  Award,
  Sparkles,
  Camera,
  HardDrive,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("unitech_admin_products");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const [reviews, setReviews] = useState<GoogleReview[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("unitech_admin_reviews");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("unitech_admin_categories");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const savedProducts = localStorage.getItem("unitech_admin_products");
        if (savedProducts) setProducts(JSON.parse(savedProducts));
        const savedReviews = localStorage.getItem("unitech_admin_reviews");
        if (savedReviews) setReviews(JSON.parse(savedReviews));
        const savedCategories = localStorage.getItem("unitech_admin_categories");
        if (savedCategories) setCategories(JSON.parse(savedCategories));
      } catch {}
    };

    window.addEventListener("storage", syncFromStorage);

    // 1. Fetch live products from PostgreSQL
    fetch("/api/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setProducts(json.data);
          try {
            localStorage.setItem("unitech_admin_products", JSON.stringify(json.data));
          } catch {}
        }
      })
      .catch((err) => console.warn("[Home products fetch error]:", err));

    // 2. Fetch live reviews from PostgreSQL
    fetch("/api/reviews", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setReviews(json.data);
          try {
            localStorage.setItem("unitech_admin_reviews", JSON.stringify(json.data));
          } catch {}
        }
      })
      .catch((err) => console.warn("[Home reviews fetch error]:", err));

    // 3. Fetch live categories from PostgreSQL
    fetch("/api/categories", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setCategories(json.data);
          try {
            localStorage.setItem("unitech_admin_categories", JSON.stringify(json.data));
          } catch {}
        }
      })
      .catch((err) => console.warn("[Home categories fetch error]:", err));

    return () => window.removeEventListener("storage", syncFromStorage);
  }, []);
  return (
    <main className="min-h-screen flex flex-col bg-[#faf9f5]">
      {/* 1. Navbar (Clean Studio Light Navigation with Live News Ticker) */}
      <Navbar />

      {/* 2. Hero Moving Product Showcase Slider (6U Rack, 4MP Camera, Pure Copper Cable) */}
      <HeroSection />

      {/* 3. Hardware Manufacturing Categories */}
      <CategoryShowcase
        onSelectCategory={(catSlug) => {
          window.location.href = `/catalogue?category=${catSlug}`;
        }}
      />

      {/* 4. Popular Hardware Catalog (With links to /product/[slug]) */}
      <PopularCatalog
        products={products}
        categories={categories}
        onAddToCart={(p) => {
          try {
            const raw = localStorage.getItem("unitech_cart");
            const cart = raw ? JSON.parse(raw) : [];
            const idx = cart.findIndex((item: any) => item.id === p.id || item.modelCode === p.modelCode);
            if (idx !== -1) {
              cart[idx].quantity += 1;
            } else {
              cart.push({
                id: p.id,
                name: p.name,
                modelCode: p.modelCode,
                price: p.price,
                quantity: 1,
                imageUrl: p.imageUrl || (p as any).image,
              });
            }
            localStorage.setItem("unitech_cart", JSON.stringify(cart));
            window.dispatchEvent(new Event("storage"));
          } catch {}
          window.location.href = `/cart`;
        }}
        onOpenSpecsModal={(p) => {
          window.location.href = `/product/${p.slug}`;
        }}
      />

      {/* 5. 60-Second Kit Builder Promotional Section - Full Width Edge-to-Edge Container */}
      <section className="py-14 sm:py-20 bg-gradient-to-b from-[#faf9f5] via-white to-[#faf9f5] border-b border-slate-200/80">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-16 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 text-unitech-red border border-red-200/90 text-xs font-black uppercase tracking-wider shadow-2xs">
                <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Automated Surveillance Planner</span>
              </div>

              <h2 className="font-heading text-3xl sm:text-4xl lg:text-[42px] xl:text-[46px] font-black text-slate-950 tracking-tight leading-[1.15]">
                Design Your CCTV Setup in 60 Seconds with Automatic Storage Sizing.
              </h2>

              <p className="text-slate-600 text-sm sm:text-base lg:text-[17px] leading-relaxed max-w-2xl font-normal">
                Select your premises, choose camera clarity, and set recording retention days. Our engineering engine automatically matches 4K DVR channels, calculates surveillance hard drives, and sizes 100% pure copper cables with transparent 18% GST input credit pricing.
              </p>

              {/* Value Feature Pills */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs sm:text-[13px] font-bold text-slate-700">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Instant 18% GST Quote</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Automated HDD Storage Calculator</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Zero Guesswork Matching</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  href="/kit-builder"
                  className="px-8 py-3.5 sm:py-4 rounded-full bg-unitech-red hover:bg-unitech-darkred text-white text-xs sm:text-sm font-bold transition-all shadow-[0_6px_20px_rgba(230,0,0,0.3)] hover:shadow-[0_8px_24px_rgba(230,0,0,0.4)] hover:-translate-y-0.5 active:scale-98 flex items-center gap-2.5 cursor-pointer"
                >
                  <span>Launch 60-Sec Kit Builder</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>

                <Link
                  href="/catalogue"
                  className="px-7 py-3.5 sm:py-4 rounded-full bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-200 text-xs sm:text-sm font-bold transition-all hover:border-slate-300 shadow-2xs cursor-pointer flex items-center gap-2"
                >
                  Browse Hardware Catalogue
                </Link>
              </div>
            </div>

            {/* Right Column: Clean 3-Step Workflow Cards */}
            <div className="lg:col-span-5 xl:col-span-5 space-y-4">
              {/* Step 1 */}
              <div className="group flex items-start gap-4 p-5 sm:p-5.5 rounded-2xl bg-white border border-slate-200/80 hover:border-red-200 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className="w-11 h-11 rounded-xl bg-red-50 text-unitech-red border border-red-200/80 flex items-center justify-center font-heading font-black text-sm shrink-0 group-hover:bg-unitech-red group-hover:text-white transition-colors shadow-2xs">
                  01
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-heading font-bold text-slate-950 text-base group-hover:text-unitech-red transition-colors">
                      Pick Camera Resolution & Environment
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                      Step 1
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    Choose between 2.4MP Economy, 4MP Warm Light Full-Color, or 8MP 4K Ultra HD cameras for indoor or outdoor premises.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="group flex items-start gap-4 p-5 sm:p-5.5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-400 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-900 border border-slate-200/80 flex items-center justify-center font-heading font-black text-sm shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors shadow-2xs">
                  02
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-heading font-bold text-slate-950 text-base group-hover:text-slate-900 transition-colors">
                      Automated Storage & DVR Sizing
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                      Step 2
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    Engine calculates exact HDD Terabytes (7 to 60 Days) and automatically pairs compatible 4K DVR channels with zero guesswork.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="group flex items-start gap-4 p-5 sm:p-5.5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center font-heading font-black text-sm shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-2xs">
                  03
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-heading font-bold text-slate-950 text-base group-hover:text-emerald-700 transition-colors">
                      Instant Bill of Materials (BOM) & 18% GST
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 shrink-0">
                      Step 3
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    Get transparent itemized hardware costs, download official GST quote PDF, or checkout directly with verified dealer rates.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. Google Reviews Social Proof Engine (Clean Studio Light Theme) */}
      <GoogleReviewsSection reviews={reviews} />

      {/* 8. Dedicated Trust & Compliance Certifications Showcase */}
      <TrustBadgesSection />

      {/* 9. Footer (Enterprise Dark Theme) */}
      <Footer />
    </main>
  );
}
