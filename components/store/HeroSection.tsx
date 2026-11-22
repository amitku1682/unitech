"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { HeroNvrLiveView } from "@/components/store/HeroNvrLiveView";
import { HeroSaleOfferGrid } from "@/components/store/HeroSaleOfferGrid";
import {
  HeroProductSaleSlide,
  DEFAULT_PRODUCT_SALE_SLIDE,
} from "@/components/store/HeroProductSaleSlide";
import { useScanReveal } from "@/components/store/useScanReveal";
import { ProductSaleSlideData } from "@/lib/types";

export interface HeroSlideData {
  id: string;
  badgeTag: string;
  badgeLabel: string;
  headline: string[];
  description: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  slideNumber: string;
  type: "cameras" | "rack" | "sale" | "product_sale";
  specs: { label: string; value: string }[];
  productSaleData?: ProductSaleSlideData;
  imageUrl?: string;
  productName?: string;
  schemaDetails?: any;
}

const HERO_SLIDES: HeroSlideData[] = [
  {
    id: "slide-cameras",
    badgeTag: "NEW",
    badgeLabel: "Warm-light colour cameras",
    headline: ["See every detail,", "day and night."],
    description:
      "4MP & 8MP HD and IP cameras with 3.6 mm lens and H.265 recording — up to 32 channels on one recorder.",
    primaryCtaText: "Shop cameras",
    primaryCtaLink: "/catalogue?category=cctv-cameras",
    secondaryCtaText: "Get best price",
    secondaryCtaLink: "/inquiry?type=PRODUCT_QUOTE",
    slideNumber: "01/04",
    type: "cameras",
    specs: [
      { label: "RESOLUTION", value: "4K & 8MP Ultra HD" },
      { label: "NIGHT OPTICS", value: "F1.0 Full-Color Starlight" },
      { label: "ILLUMINATION", value: "30m Warm LED Matrix" },
      { label: "PROTECTION", value: "IP67 Weatherproof Alloy" },
    ],
  },
  {
    id: "slide-rack",
    badgeTag: "NEW MODEL",
    badgeLabel: "Launched this season",
    headline: ["6U Folding Rack.", "Neat, secure", "installs."],
    description:
      "Wall-mount network rack with glass front door and key lock — a tidy home for DVRs, NVRs, switches and patch panels.",
    primaryCtaText: "View 6U rack",
    primaryCtaLink: "/catalogue?category=network-racks",
    secondaryCtaText: "Get a quote",
    secondaryCtaLink: "/inquiry?type=DISTRIBUTOR",
    slideNumber: "02/04",
    type: "rack",
    specs: [
      { label: "FORM FACTOR", value: "6U 19-Inch Standard" },
      { label: "LOAD CAPACITY", value: "60 Kg Tested Safe Load" },
      { label: "FRONT DOOR", value: "Toughened Tinted Glass" },
      { label: "SECURITY", value: "Dual Cam Key Safety Lock" },
    ],
  },
  {
    id: "slide-sale",
    badgeTag: "SALE",
    badgeLabel: "Limited-time offer",
    headline: ["Up to 60% off", "cables, cameras &", "power."],
    description:
      "Stock up on CCTV cable, cameras, DVRs and power supplies at factory-direct prices while the offer lasts.",
    primaryCtaText: "Shop the sale",
    primaryCtaLink: "/catalogue",
    secondaryCtaText: "Get Price",
    secondaryCtaLink: "/inquiry",
    slideNumber: "03/04",
    type: "sale",
    specs: [
      { label: "CONDUCTOR", value: "100% Solid Annealed Copper" },
      { label: "DISPATCH SLA", value: "24-48 Hr Pan-India Express" },
      { label: "TAX BENEFIT", value: "18% GST Full ITC Claim" },
      { label: "PRICING TIER", value: "Direct Factory Wholesale Rate" },
    ],
  },
];

export const isSchemeSlide = (_s: any): boolean => {
  return false;
};

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [dbHeroSlides, setDbHeroSlides] = useState<HeroSlideData[] | null>(null);

  const slideContainerRef = useRef<HTMLDivElement>(null);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [productSaleSlide, setProductSaleSlide] = useState<ProductSaleSlideData | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("unitech_product_sale_slide");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_PRODUCT_SALE_SLIDE;
  });

  // Sync latest published slides from PostgreSQL
  useEffect(() => {
    let isMounted = true;

    fetch("/api/hero-slides", { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: HeroSlideData[] = res.data.map((row: any, idx: number) => {
            const headlineArr = Array.isArray(row.headline)
              ? row.headline
              : typeof row.headline === "string" && row.headline.includes("\n")
              ? row.headline.split("\n")
              : [row.headline || "Unitech Security"];

            const specsArr = Array.isArray(row.specs)
              ? row.specs.map((s: any) => ({
                  label: s.label || "",
                  value: s.value || s.detail || "",
                }))
              : [];

            return {
              id: row.id,
              badgeTag: row.badgeTag || "NEW",
              badgeLabel: row.badgeDetail || row.badgeTag || "Surveillance",
              headline: headlineArr,
              description: row.description || "",
              primaryCtaText: row.primaryCtaText || "Explore",
              primaryCtaLink: row.primaryCtaLink || "/catalogue",
              secondaryCtaText: (row.id === "slide-sale" && row.secondaryCtaText?.toLowerCase().includes("download"))
                ? "Get price"
                : (row.secondaryCtaText || "Get quote"),
              secondaryCtaLink: (row.id === "slide-sale" && (row.secondaryCtaLink?.toLowerCase().includes("download") || !row.secondaryCtaLink))
                ? "/inquiry"
                : (row.secondaryCtaLink || "/inquiry"),
              slideNumber: `0${idx + 1}/04`,
              type: row.type || (idx === 0 ? "cameras" : idx === 1 ? "rack" : idx === 2 ? "sale" : "product_sale"),
              specs: specsArr,
              imageUrl: row.imageUrl,
              productName: row.productName,
              productSaleData: row.productSaleData || undefined,
              schemaDetails: row.schemaDetails || undefined,
            };
          });

          setDbHeroSlides(mapped);

          const saleCard = mapped.find((s) => s.type === "product_sale" && s.productSaleData);
          if (saleCard && saleCard.productSaleData) {
            setProductSaleSlide(saleCard.productSaleData);
          }
        }
      })
      .catch((err) => console.warn("[HeroSection fetch hero slides error]:", err));

    fetch("/api/hero-product-sale", { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setProductSaleSlide(res.data);
          try {
            localStorage.setItem("unitech_product_sale_slide", JSON.stringify(res.data));
          } catch {}
        }
      })
      .catch((err) => console.warn("[HeroSection fetch product sale error]:", err));

    return () => {
      isMounted = false;
    };
  }, []);

  const activeSlides = React.useMemo(() => {
    if (dbHeroSlides && dbHeroSlides.length > 0) {
      return dbHeroSlides.map((s) => {
        if (s.type === "product_sale" && productSaleSlide) {
          return {
            ...s,
            productSaleData: productSaleSlide,
          };
        }
        return s;
      });
    }

    const baseSlides = [...HERO_SLIDES];
    if (
      productSaleSlide &&
      productSaleSlide.enabled &&
      productSaleSlide.status === "published" &&
      (!productSaleSlide.startsAt || new Date(productSaleSlide.startsAt).getTime() <= Date.now()) &&
      (new Date(productSaleSlide.endsAt).getTime() > Date.now() ||
        productSaleSlide.afterEnd === "show_without_countdown")
    ) {
      const discount =
        productSaleSlide.discountOverride && productSaleSlide.discountPercent
          ? productSaleSlide.discountPercent
          : Math.round(((productSaleSlide.mrp - productSaleSlide.offerPrice) / productSaleSlide.mrp) * 100);

      const slide4: HeroSlideData = {
        id: productSaleSlide.id || "slide-product-sale",
        badgeTag: "SALE",
        badgeLabel: productSaleSlide.badgeText || "Product of the week",
        headline: [`Save ${discount}%`, productSaleSlide.headlineSuffix || "this week."],
        description: `${productSaleSlide.productName} — ${productSaleSlide.tagline}`,
        primaryCtaText: productSaleSlide.primaryCta?.label || "Buy now",
        primaryCtaLink: productSaleSlide.primaryCta?.url || "/catalogue?category=cctv-cameras",
        secondaryCtaText: productSaleSlide.secondaryCta?.label || "Get bulk price",
        secondaryCtaLink: productSaleSlide.secondaryCta?.url || "/inquiry?type=PRODUCT_QUOTE",
        slideNumber: "04/04",
        type: "product_sale",
        specs: (productSaleSlide.specs || []).map((s, idx) => ({
          label: `SPEC 0${idx + 1}`,
          value: s,
        })),
        productSaleData: productSaleSlide,
      };

      const pos = Math.max(1, Math.min(baseSlides.length + 1, productSaleSlide.position || 4)) - 1;
      baseSlides.splice(pos, 0, slide4);
    }
    return baseSlides;
  }, [dbHeroSlides, productSaleSlide]);

  const totalSlides = activeSlides.length;
  const currentIdx = Math.min(currentSlide, totalSlides - 1);
  const slide = activeSlides[currentIdx] || activeSlides[0];

  const clearAutoplay = useCallback(() => {
    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
  }, []);

  const goToSlide = useCallback((idx: number) => {
    setCurrentSlide(idx);
    setAnimKey((k) => k + 1);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
    setAnimKey((k) => k + 1);
  }, [totalSlides]);

  const handleNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
    setAnimKey((k) => k + 1);
  }, [totalSlides]);

  // Non-stop single-source-of-truth 7000ms autoplay timer (never stuck)
  useEffect(() => {
    clearAutoplay();

    // Guard against hidden tab
    if (typeof document !== "undefined" && document.hidden) return;

    autoplayTimerRef.current = setTimeout(() => {
      handleNext();
    }, 7000);

    return () => clearAutoplay();
  }, [currentSlide, animKey, handleNext, clearAutoplay]);

  // Handle visibilitychange: pause when tab hidden, resume cleanly when tab visible
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        clearAutoplay();
      } else {
        clearAutoplay();
        setAnimKey((k) => k + 1);
        autoplayTimerRef.current = setTimeout(() => {
          handleNext();
        }, 7000);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [handleNext, clearAutoplay]);

  // Hook handles scan & focus reveal animation per slide activation
  useScanReveal(slideContainerRef as any, true, animKey);

  // Touch Swipe for mobile navigation
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].screenX;
    if (diff > 50) handleNext();
    if (diff < -50) handlePrev();
  };

  return (
    <section
      className="relative w-full overflow-hidden bg-[#faf9f5] border-b border-slate-300 select-none rounded-none"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(0, 0, 0, 0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.035) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      {/* ------------------------------------------------------------- */}
      {/* CSS KEYFRAME ANIMATIONS FOR THE STAGGERED ENTRANCES           */}
      {/* ------------------------------------------------------------- */}
      <style jsx global>{`
        @keyframes heroPopIn {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(12px);
          }
          70% {
            opacity: 1;
            transform: scale(1.02) translateY(-2px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes heroDrawDashed {
          0% {
            stroke-dashoffset: 160;
            opacity: 0;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        @keyframes heroDashFlow {
          from {
            stroke-dashoffset: 24;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        .anim-lines-flow {
          animation: heroDashFlow 1s linear infinite;
        }

        @keyframes heroBadgePop {
          0% {
            opacity: 0;
            transform: scale(0.2) rotate(-20deg);
          }
          65% {
            opacity: 1;
            transform: scale(1.15) rotate(8deg);
          }
          85% {
            transform: scale(0.96) rotate(-2deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes heroCalloutIn {
          0% {
            opacity: 0;
            transform: translateY(12px) scale(0.92);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes heroWaterBubble {
          0% {
            opacity: 0;
            transform: scale(0.68) translateY(24px);
            filter: blur(8px);
          }
          55% {
            opacity: 1;
            transform: scale(1.035) translateY(-4px);
            filter: blur(0px);
          }
          80% {
            transform: scale(0.99) translateY(1px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0px);
          }
        }

        .anim-hero-bubble,
        .anim-hero-water-bubble {
          animation: heroWaterBubble 0.52s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          will-change: transform, opacity, filter;
          transform-origin: center center;
        }

        @keyframes heroCircleFill {
          0% {
            stroke-dashoffset: 81.68;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        .anim-circle-timer-fill {
          animation: heroCircleFill 7s linear forwards;
        }

        .anim-pop-1 {
          animation: heroPopIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both;
        }
        .anim-pop-2 {
          animation: heroPopIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both;
        }
        .anim-pop-3 {
          animation: heroPopIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) 0.18s both;
        }
        .anim-recorder {
          animation: heroPopIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both;
        }
        .anim-lines {
          animation: heroDrawDashed 0.4s ease-out 0.35s both;
        }
        .anim-callout-1 {
          animation: heroCalloutIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
        }
        .anim-callout-2 {
          animation: heroCalloutIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both;
        }
        .anim-badge-sale {
          animation: heroBadgePop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
        }

        .hero-scan{position:absolute;inset:0;pointer-events:none;z-index:15}
        .hero-scan__line{position:absolute;left:0;right:0;top:0;height:2px;background:#E3141B;box-shadow:0 0 14px 3px rgba(227,20,27,.55);opacity:0}
        .hero-scan__line::before{content:"";position:absolute;left:0;right:0;bottom:2px;height:90px;background:linear-gradient(to top,rgba(227,20,27,.14),rgba(227,20,27,0))}
        .hero-scan__lock{position:absolute;opacity:0;transform-origin:center;filter:drop-shadow(0 0 6px rgba(227,20,27,.45))}
        .hero-scan__lock i{position:absolute;width:36px;height:36px;border:0 solid #E3141B}
        .hero-scan__lock i:nth-child(1){left:0;top:0;border-left-width:3px;border-top-width:3px}
        .hero-scan__lock i:nth-child(2){right:0;top:0;border-right-width:3px;border-top-width:3px}
        .hero-scan__lock i:nth-child(3){left:0;bottom:0;border-left-width:3px;border-bottom-width:3px}
        .hero-scan__lock i:nth-child(4){right:0;bottom:0;border-right-width:3px;border-bottom-width:3px}
        .hero-scan__lock b{position:absolute;left:12px;top:12px;font:700 11px/1 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.12em;color:#fff;background:#E3141B;padding:6px 9px;border-radius:4px;white-space:nowrap;box-shadow:0 4px 12px rgba(227,20,27,.35)}
        @media (max-width:767px){.hero-scan__lock i{width:26px;height:26px}.hero-scan__lock b{font-size:10px}}
      `}</style>

      {/* Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-slate-200/50 rounded-full blur-3xl pointer-events-none" />

      {/* ------------------------------------------------------------- */}
      {/* FULL-WIDTH FLUSH HERO STAGE (NO ROUNDED CORNERS, EDGE-TO-EDGE)*/}
      {/* ------------------------------------------------------------- */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full"
      >
        {/* Main Stage Grid Container */}
        <div className="w-full max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-14 xl:px-16 pt-8 pb-16 lg:py-14 min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] flex items-center relative">
          {slide.type === "product_sale" && slide.productSaleData ? (
            <div
              ref={slideContainerRef}
              key={`${slide.id}-${animKey}`}
              className="w-full relative overflow-hidden"
            >
              <div className="hero-scan" aria-hidden="true">
                <span data-scan-line className="hero-scan__line" />
                <div data-scan-lock className="hero-scan__lock"><i /><i /><i /><i /><b>● FOCUS LOCKED</b></div>
              </div>
              <div
                className="w-full relative anim-hero-water-bubble"
                data-scan-content
              >
                <HeroProductSaleSlide
                  data={slide.productSaleData}
                  onSlideExpired={() => {
                    setProductSaleSlide((prev) => (prev ? { ...prev, enabled: false } : null));
                  }}
                />
              </div>
            </div>
          ) : (
            <div
              ref={slideContainerRef}
              key={`${slide.id}-${animKey}`}
              className="w-full relative overflow-hidden"
            >
              <div className="hero-scan" aria-hidden="true">
                <span data-scan-line className="hero-scan__line" />
                <div data-scan-lock className="hero-scan__lock"><i /><i /><i /><i /><b>● FOCUS LOCKED</b></div>
              </div>
              <div
                className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative anim-hero-water-bubble"
                data-scan-content
              >
            {/* ========================================================= */}
            {/* LEFT COLUMN: BADGE, HEADLINE, DESCRIPTION, 2x2 SPECS, CTAS*/}
            {/* ========================================================= */}
            <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-center space-y-4 sm:space-y-5 z-10">
              {/* Status Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/90 px-3.5 py-1.5 w-fit shadow-2xs">
                <span className="bg-[#e60000] text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  {slide.badgeTag}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-800 pr-1">
                  {slide.badgeLabel}
                </span>
              </div>

              {/* Dynamic Bold Headline (Font-heading / Plus Jakarta Sans) */}
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-[46px] xl:text-[52px] font-black text-slate-950 tracking-tight leading-[1.1]">
                {slide.headline.map((line, idx) => {
                  if (line.includes("60% off")) {
                    const parts = line.split("60% off");
                    return (
                      <span key={idx} className="block">
                        {parts[0]}
                        <span className="text-[#E3141B]">60% off</span>
                        {parts[1]}
                      </span>
                    );
                  }
                  return (
                    <span key={idx} className="block">
                      {line}
                    </span>
                  );
                })}
              </h1>

              {/* Clean Subtext Description */}
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
                {slide.description}
              </p>

              {/* ======================================================= */}
              {/* 2x2 SPECIFICATION MATRIX (2 ROWS, 2 COLUMNS - NO ...)   */}
              {/* ======================================================= */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1 max-w-xl">
                {slide.specs.map((spec, sIdx) => (
                  <div
                    key={sIdx}
                    data-scan-late={String(sIdx)}
                    className="p-3 bg-white/95 border border-slate-300/90 rounded-2xl shadow-2xs flex flex-col justify-between"
                  >
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-500">
                      {spec.label}
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold text-slate-950 mt-1 leading-snug whitespace-normal break-words">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1.5" data-scan-late="4">
                <Link
                  href={slide.primaryCtaLink}
                  className="inline-flex items-center gap-2.5 px-8 sm:px-9 py-3.5 rounded-full bg-[#e60000] hover:bg-[#cc0000] text-white font-bold text-sm sm:text-base transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer group"
                >
                  <span>{slide.primaryCtaText}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href={slide.secondaryCtaLink}
                  className="inline-flex items-center px-6 py-3.5 rounded-full bg-white/80 hover:bg-white border border-slate-300/80 text-slate-800 hover:text-slate-950 font-bold text-sm sm:text-base transition-all cursor-pointer shadow-2xs"
                >
                  <span>{slide.secondaryCtaText}</span>
                </Link>
              </div>
            </div>

            {/* ========================================================= */}
            {/* RIGHT COLUMN: PRECISE PRODUCT SHOWCASE STAGE              */}
            {/* ========================================================= */}
            <div className="lg:col-span-7 xl:col-span-7 relative flex items-center justify-center min-h-[440px] sm:min-h-[520px] lg:min-h-[600px] w-full">

              {/* ------------------------------------------------------- */}
              {/* SLIDE 1: NVR LIVE VIEW SHOWCASE                         */}
              {/* ------------------------------------------------------- */}
              {slide.type === "cameras" && <HeroNvrLiveView />}

              {/* ------------------------------------------------------- */}
              {/* SLIDE 2: 6U FOLDING RACK (PERFECT - 100% UNTOUCHED)    */}
              {/* ------------------------------------------------------- */}
              {slide.type === "rack" && (
                <div className="relative w-full max-w-[840px] h-[440px] sm:h-[500px] lg:h-[560px] flex items-center justify-center">
                  {/* Concentric Background Orbital Rings (Kept for 6U rack) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                    <div className="w-[400px] h-[400px] sm:w-[520px] sm:h-[520px] lg:w-[640px] lg:h-[640px] xl:w-[720px] xl:h-[720px] rounded-full border border-slate-300/60" />
                    <div className="absolute w-[260px] h-[260px] sm:w-[360px] sm:h-[360px] lg:w-[460px] lg:h-[460px] xl:w-[520px] xl:h-[520px] rounded-full border border-slate-300/40" />
                    <div className="absolute w-[130px] h-[130px] sm:w-[190px] sm:h-[190px] lg:w-[260px] lg:h-[260px] xl:w-[300px] xl:h-[300px] rounded-full border border-slate-200/60" />
                  </div>

                  {/* Authentic 6U Unitech Glass Door Rack - HIGH IMPACT LARGE SCALE */}
                  <div className="relative z-10 w-full flex flex-col items-center justify-center">
                    <img
                      data-scan-target
                      src={slide.imageUrl || "/images/products/utr-1006.png"}
                      alt={slide.productName || "Unitech 6U Folding Wall-Mount Rack"}
                      className="max-h-[340px] sm:max-h-[440px] lg:max-h-[500px] xl:max-h-[540px] w-auto max-w-full object-contain select-none transition-transform duration-300 hover:scale-105"
                      style={{ mixBlendMode: "multiply" }}
                    />
                    {/* Natural soft elliptical pedestal base shadow (seamless on #faf9f5, no rectangular bounding box) */}
                    <div className="w-3/5 max-w-[420px] h-6 sm:h-8 bg-slate-900/10 rounded-full blur-xl pointer-events-none -mt-4 sm:-mt-6" />
                  </div>

                  {/* Top-Left Feature Card */}
                  <div className="absolute top-4 sm:top-8 left-0 sm:left-4 lg:left-6 z-30 anim-callout-1 bg-white/95 backdrop-blur-md rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 border border-slate-300/80 shadow-lg" data-scan-late="5" data-scan-chip="true">
                    <div className="font-heading text-xs sm:text-sm font-black text-slate-950">
                      6U
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-500 font-semibold">
                      Glass door · key lock
                    </div>
                  </div>

                  {/* Bottom-Right Feature Card */}
                  <div className="absolute bottom-4 sm:bottom-8 right-0 sm:right-4 lg:right-6 z-30 anim-callout-2 bg-white/95 backdrop-blur-md rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 border border-slate-300/80 shadow-lg" data-scan-late="6" data-scan-chip="true">
                    <div className="font-heading text-xs sm:text-sm font-black text-slate-950">
                      Wall-mount
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-500 font-semibold">
                      Saves floor space
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------- */}
              {/* SLIDE 3: 5-CARD FACTORY SALE OFFER GRID                 */}
              {/* ------------------------------------------------------- */}
              {slide.type === "sale" && <HeroSaleOfferGrid products={slide.schemaDetails} />}
            </div>
          </div>
        </div>
      )}

          {/* ========================================================= */}
          {/* BOTTOM-LEFT CIRCULAR TIME COMPLETION TRACKERS             */}
          {/* ========================================================= */}
          <div className="absolute bottom-5 sm:bottom-6 left-6 sm:left-10 lg:left-14 xl:left-16 flex items-center gap-3 sm:gap-3.5 z-20">
            {activeSlides.map((s, idx) => {
              const isActive = idx === currentIdx;
              const isPast = idx < currentIdx;

              return (
                <button
                  key={s.id || idx}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  aria-label={`Jump to slide ${idx + 1}`}
                  className="relative flex items-center justify-center p-0 cursor-pointer focus:outline-none group"
                >
                  {isActive ? (
                    /* Active Circular Countdown Ring (fills over 7s autoplay) */
                    <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
                      <svg
                        key={`circle-timer-${currentIdx}-${animKey}`}
                        viewBox="0 0 32 32"
                        className="w-full h-full"
                      >
                        {/* Static Track Ring */}
                        <circle
                          cx="16"
                          cy="16"
                          r="13"
                          fill="none"
                          stroke="rgba(203, 213, 225, 0.75)"
                          strokeWidth="2.5"
                        />
                        {/* Dynamic Animated Completion Ring */}
                        <circle
                          cx="16"
                          cy="16"
                          r="13"
                          fill="none"
                          stroke="#e60000"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          style={{
                            strokeDasharray: 81.68,
                            transformOrigin: "center",
                            transform: "rotate(-90deg)",
                          }}
                          className="anim-circle-timer-fill"
                        />
                      </svg>
                      {/* Active Center Indicator Dot */}
                      <span className="absolute w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#e60000] shadow-[0_0_8px_rgba(230,0,0,0.5)] transition-transform group-hover:scale-125" />
                    </div>
                  ) : (
                    /* Inactive Slide Circle (Clickable) */
                    <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
                      <div
                        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 transition-all duration-300 group-hover:scale-125 group-hover:border-[#e60000] ${
                          isPast
                            ? "bg-slate-400 border-slate-400"
                            : "bg-white border-slate-300 group-hover:bg-red-50"
                        }`}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* ========================================================= */}
          {/* BOTTOM-RIGHT PAGINATION CHEVRON BUTTONS                   */}
          {/* ========================================================= */}
          <div className="absolute bottom-5 sm:bottom-6 right-6 sm:right-10 lg:right-14 xl:right-16 flex items-center gap-2.5 z-20">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous Slide"
              className="w-11 h-11 rounded-full bg-white hover:bg-slate-50 border border-slate-300/80 text-slate-700 hover:text-slate-950 flex items-center justify-center shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next Slide"
              className="w-11 h-11 rounded-full bg-white hover:bg-slate-50 border border-slate-300/80 text-slate-700 hover:text-slate-950 flex items-center justify-center shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FEATURE PROOF STRIP (Full-Width Edge-to-Edge Lenskart Format)  */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full border-t border-slate-200/90 bg-white/95 backdrop-blur-xs py-4 sm:py-5 xl:py-6 px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 xl:gap-5">
          {/* Card 1: Direct Manufacturer */}
          <div className="flex items-center gap-3.5 xl:gap-4 p-4 sm:p-4.5 xl:p-5 bg-white border border-slate-200/90 hover:border-red-300 rounded-2xl shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] hover:shadow-[0_8px_20px_-4px_rgba(230,0,0,0.12)] transition-all duration-200 hover:-translate-y-0.5 group cursor-default min-h-[82px] sm:min-h-[88px]">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-red-50 border border-red-200/90 text-unitech-red flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-unitech-red group-hover:text-white transition-all shadow-2xs">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.25]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-heading font-black text-sm sm:text-[15px] xl:text-base text-slate-950 leading-tight group-hover:text-unitech-red transition-colors truncate">
                Direct Manufacturer
              </div>
              <div className="text-xs sm:text-[13px] font-semibold text-slate-600 mt-1 leading-snug truncate">
                Sahibabad Plant, UP
              </div>
            </div>
          </div>

          {/* Card 2: 18% GST Invoice */}
          <div className="flex items-center gap-3.5 xl:gap-4 p-4 sm:p-4.5 xl:p-5 bg-white border border-slate-200/90 hover:border-red-300 rounded-2xl shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] hover:shadow-[0_8px_20px_-4px_rgba(230,0,0,0.12)] transition-all duration-200 hover:-translate-y-0.5 group cursor-default min-h-[82px] sm:min-h-[88px]">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-red-50 border border-red-200/90 text-unitech-red flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-unitech-red group-hover:text-white transition-all shadow-2xs">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.25]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-heading font-black text-sm sm:text-[15px] xl:text-base text-slate-950 leading-tight group-hover:text-unitech-red transition-colors truncate">
                18% GST Invoice
              </div>
              <div className="text-xs sm:text-[13px] font-semibold text-slate-600 mt-1 leading-snug truncate">
                Full ITC claim eligible
              </div>
            </div>
          </div>

          {/* Card 3: Pan-India Express */}
          <div className="flex items-center gap-3.5 xl:gap-4 p-4 sm:p-4.5 xl:p-5 bg-white border border-slate-200/90 hover:border-red-300 rounded-2xl shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] hover:shadow-[0_8px_20px_-4px_rgba(230,0,0,0.12)] transition-all duration-200 hover:-translate-y-0.5 group cursor-default min-h-[82px] sm:min-h-[88px]">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-red-50 border border-red-200/90 text-unitech-red flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-unitech-red group-hover:text-white transition-all shadow-2xs">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.25]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-heading font-black text-sm sm:text-[15px] xl:text-base text-slate-950 leading-tight group-hover:text-unitech-red transition-colors truncate">
                Pan-India Express
              </div>
              <div className="text-xs sm:text-[13px] font-semibold text-slate-600 mt-1 leading-snug truncate">
                Dispatched in 24-48 hrs
              </div>
            </div>
          </div>

          {/* Card 4: Dealer Tiers */}
          <div className="flex items-center gap-3.5 xl:gap-4 p-4 sm:p-4.5 xl:p-5 bg-white border border-slate-200/90 hover:border-red-300 rounded-2xl shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] hover:shadow-[0_8px_20px_-4px_rgba(230,0,0,0.12)] transition-all duration-200 hover:-translate-y-0.5 group cursor-default min-h-[82px] sm:min-h-[88px]">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-red-50 border border-red-200/90 text-unitech-red flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-unitech-red group-hover:text-white transition-all shadow-2xs">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.25]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-heading font-black text-sm sm:text-[15px] xl:text-base text-slate-950 leading-tight group-hover:text-unitech-red transition-colors truncate">
                Dealer Tiers
              </div>
              <div className="text-xs sm:text-[13px] font-semibold text-slate-600 mt-1 leading-snug truncate">
                Protected installer margins
              </div>
            </div>
          </div>

          {/* Card 5: 2-Year SLA Warranty */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1 flex items-center gap-3.5 xl:gap-4 p-4 sm:p-4.5 xl:p-5 bg-white border border-slate-200/90 hover:border-red-300 rounded-2xl shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] hover:shadow-[0_8px_20px_-4px_rgba(230,0,0,0.12)] transition-all duration-200 hover:-translate-y-0.5 group cursor-default min-h-[82px] sm:min-h-[88px]">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-red-50 border border-red-200/90 text-unitech-red flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-unitech-red group-hover:text-white transition-all shadow-2xs">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.25]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-heading font-black text-sm sm:text-[15px] xl:text-base text-slate-950 leading-tight group-hover:text-unitech-red transition-colors truncate">
                2-Year SLA Warranty
              </div>
              <div className="text-xs sm:text-[13px] font-semibold text-slate-600 mt-1 leading-snug truncate">
                Immediate replacement
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
