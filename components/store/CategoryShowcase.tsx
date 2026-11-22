"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Layers, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { HomepageCategoryCard, CategoryScenePreset } from "@/lib/types";

const CATEGORY_TAGLINES: Record<string, string> = {
  "cctv-cameras": "Sharp by day, colour by night",
  "dvr-nvr": "Record more, store less",
  "networking-poe": "Power and data on one cable",
  cables: "100% copper, zero signal loss",
  "network-racks": "Neat, secure installs",
  "power-accessories": "Clean, surge-protected power",
};

interface CategoryShowcaseProps {
  onSelectCategory?: (categorySlug: string) => void;
}

export function CategoryShowcase({ onSelectCategory }: CategoryShowcaseProps) {
  const [cards, setCards] = useState<HomepageCategoryCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [viewportWidth, setViewportWidth] = useState<number>(1280);
  const [isClient, setIsClient] = useState<boolean>(false);

  // References
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef<boolean>(false);
  const wheelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drag / swipe gesture tracking
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftRef = useRef<number>(0);
  const hasDraggedState = useRef<boolean>(false);

  // Synchronized scroll state for progress bar, counter, and navigation buttons
  const [scrollState, setScrollState] = useState({
    thumbWidth: 33,
    thumbLeft: 0,
    counterText: "01–02 / 06",
    activeIdx: 0,
    canPrev: false,
    canNext: true,
  });

  // 1. Fetch live cards from database
  useEffect(() => {
    setIsClient(true);
    if (trackRef.current) {
      trackRef.current.scrollLeft = 0;
    }
    const updateSize = () => {
      setViewportWidth(window.innerWidth);
    };
    updateSize();
    window.addEventListener("resize", updateSize);

    fetch("/api/homepage-categories")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setCards(json.data);
        }
      })
      .catch((err) => console.warn("[CategoryShowcase fetch warning]:", err))
      .finally(() => setIsLoading(false));

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const totalCards = cards.length;
  const isDesktop = viewportWidth >= 1024;
  const isTablet = viewportWidth >= 640 && viewportWidth < 1024;

  // Sizing calculation
  const cardWidth = isDesktop ? 480 : isTablet ? 340 : 300;
  const cardGap = isDesktop ? 28 : isTablet ? 20 : 14;

  // 2. Synchronize progress bar, counter & navigation state on scroll
  const updateScrollMetrics = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const { scrollLeft, scrollWidth, clientWidth } = track;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);

    // Thumb width & left position (percentage based on scrollWidth)
    const thumbWidth = scrollWidth > 0 ? Math.max(10, (clientWidth / scrollWidth) * 100) : 33;
    const thumbLeft = scrollWidth > 0 ? Math.min(100 - thumbWidth, (scrollLeft / scrollWidth) * 100) : 0;

    // Previous / Next button enabled states
    const canP = scrollLeft > 5;
    const canN = scrollLeft < maxScroll - 5;

    // Step calculation
    const firstCard = track.firstElementChild as HTMLElement | null;
    const cardW = firstCard?.offsetWidth || cardWidth;
    const computed = window.getComputedStyle(track);
    const gap = parseFloat(computed.columnGap || computed.gap) || cardGap;
    const step = cardW + gap;

    const currentIdx = Math.min(totalCards - 1, Math.max(0, Math.round(scrollLeft / step)));
    const visibleCount = Math.max(1, Math.floor(clientWidth / step));
    const startNum = String(currentIdx + 1).padStart(2, "0");
    const endNum = String(Math.min(totalCards, currentIdx + visibleCount)).padStart(2, "0");
    const totalNum = String(totalCards).padStart(2, "0");

    const counter = isDesktop ? `${startNum}–${endNum} / ${totalNum}` : `${startNum} / ${totalNum}`;

    setScrollState({
      thumbWidth,
      thumbLeft,
      counterText: counter,
      activeIdx: currentIdx,
      canPrev: canP,
      canNext: canN,
    });
  }, [cardWidth, cardGap, totalCards, isDesktop]);

  // Update metrics on initial load and resize
  useEffect(() => {
    updateScrollMetrics();
  }, [updateScrollMetrics, cards]);

  // 3. KEYBOARD ARROWS & NON-PASSIVE MOUSE WHEEL (One useEffect)
  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    // A) IntersectionObserver on the section (threshold 0.5) to track visibility
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === section) {
            isVisibleRef.current = entry.isIntersecting;
          }
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(section);

    // B) Keydown listener on document (active only while section is visible & conditions met)
    const onKeyDown = (e: KeyboardEvent) => {
      // Do not react to ArrowUp / ArrowDown
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        return;
      }
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") {
        return;
      }
      if (!isVisibleRef.current) {
        return;
      }

      // Check focused element: ignore if input, textarea, select, or contenteditable
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl) {
        const tag = activeEl.tagName.toLowerCase();
        if (
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          activeEl.isContentEditable ||
          activeEl.getAttribute("contenteditable") === "true"
        ) {
          return;
        }
      }

      // Check if modal, menu, or search panel is open (scroll lock or [aria-modal="true"])
      const hasScrollLock =
        document.body.style.overflow === "hidden" ||
        document.documentElement.style.overflow === "hidden";
      const hasAriaModal = !!document.querySelector('[aria-modal="true"]');
      if (hasScrollLock || hasAriaModal) {
        return;
      }

      e.preventDefault();
      const firstCard = track.firstElementChild as HTMLElement | null;
      const cardW = firstCard?.offsetWidth || 480;
      const computed = window.getComputedStyle(track);
      const gap = parseFloat(computed.columnGap || computed.gap) || 40;
      const delta = cardW + gap;

      track.scrollBy({
        left: e.key === "ArrowRight" ? delta : -delta,
        behavior: "smooth",
      });
    };
    document.addEventListener("keydown", onKeyDown);

    // C) Non-passive mouse wheel listener on track
    const onWheel = (e: WheelEvent) => {
      // If horizontal swipe (e.g. trackpad): do nothing, works natively
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return;
      }

      const max = track.scrollWidth - track.clientWidth;
      const atStart = track.scrollLeft <= 1;
      const atEnd = track.scrollLeft >= max - 1;

      if ((e.deltaY > 0 && !atEnd) || (e.deltaY < 0 && !atStart)) {
        e.preventDefault();
        track.style.scrollSnapType = "none";
        track.scrollLeft += e.deltaY;

        if (wheelTimeoutRef.current) {
          clearTimeout(wheelTimeoutRef.current);
        }
        wheelTimeoutRef.current = setTimeout(() => {
          if (trackRef.current) {
            trackRef.current.style.scrollSnapType = "";
          }
        }, 150);
      }
      // Otherwise (atStart or atEnd): do NOT preventDefault, page scrolls normally
    };
    track.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", onKeyDown);
      track.removeEventListener("wheel", onWheel);
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
    };
  }, []);

  // Arrow button handlers
  const handlePrev = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const firstCard = track.firstElementChild as HTMLElement | null;
    const cardW = firstCard?.offsetWidth || cardWidth;
    const computed = window.getComputedStyle(track);
    const gap = parseFloat(computed.columnGap || computed.gap) || cardGap;
    track.scrollBy({ left: -(cardW + gap), behavior: "smooth" });
  }, [cardWidth, cardGap]);

  const handleNext = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const firstCard = track.firstElementChild as HTMLElement | null;
    const cardW = firstCard?.offsetWidth || cardWidth;
    const computed = window.getComputedStyle(track);
    const gap = parseFloat(computed.columnGap || computed.gap) || cardGap;
    track.scrollBy({ left: cardW + gap, behavior: "smooth" });
  }, [cardWidth, cardGap]);

  // Pointer drag gestures
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    scrollLeftRef.current = track.scrollLeft;
    hasDraggedState.current = false;
    track.style.scrollSnapType = "none";
    track.style.scrollBehavior = "auto";
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const track = trackRef.current;
    if (!track) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > 6) {
      hasDraggedState.current = true;
    }
    track.scrollLeft = scrollLeftRef.current - delta;
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const track = trackRef.current;
    if (track) {
      track.style.scrollSnapType = "";
      track.style.scrollBehavior = "smooth";
    }
    setTimeout(() => {
      hasDraggedState.current = false;
    }, 50);
  };

  const handleCardClick = (e: React.MouseEvent, card: HomepageCategoryCard) => {
    if (hasDraggedState.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (onSelectCategory) {
      e.preventDefault();
      onSelectCategory(card.categoryId);
    }
  };

  // Align track left padding with Unitech standard edge padding
  const containerPaddingLeft = isClient
    ? viewportWidth >= 1280
      ? 40
      : viewportWidth >= 1024
      ? 32
      : viewportWidth >= 640
      ? 24
      : 16
    : 40;

  return (
    <section
      ref={sectionRef}
      id="categories"
      tabIndex={0}
      aria-label="Hardware Manufacturing Categories"
      className="cat-showcase relative bg-[#FAFAFB] py-14 sm:py-20 lg:py-24 border-b border-slate-200/80 outline-none select-none"
      style={{ overflowX: "clip" }}
    >
      <style jsx global>{`
        /* Built-in high-end scenes (pure CSS/SVG) */
        .cat-scene-graphite {
          background: radial-gradient(circle at 50% 35%, #1c1d21 0%, #0e0f12 100%);
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .cat-scene-navy {
          background: linear-gradient(145deg, #0e1b2a 0%, #060b12 100%);
        }
        .cat-scene-navy::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 85% 15%, rgba(46, 125, 246, 0.22) 0%, transparent 60%);
          pointer-events: none;
        }

        .cat-scene-grid {
          background: linear-gradient(145deg, #0f1b1f 0%, #0a1013 100%);
          background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
          background-size: 20px 20px;
        }

        .cat-scene-sand {
          background: linear-gradient(145deg, #1e1a17 0%, #0f0d0c 100%);
          background-image: repeating-linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.02) 0,
            rgba(255, 255, 255, 0.02) 2px,
            transparent 2px,
            transparent 14px
          );
        }

        .cat-scene-concrete {
          background: linear-gradient(180deg, #1a1d20 0%, #0e1012 100%);
          background-image: repeating-linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.015) 0,
            rgba(255, 255, 255, 0.015) 1px,
            transparent 1px,
            transparent 8px
          );
        }

        .cat-scene-red {
          background: linear-gradient(145deg, #151113 0%, #0a090a 100%);
        }
        .cat-scene-red::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 15% 85%, rgba(227, 20, 27, 0.26) 0%, transparent 65%);
          pointer-events: none;
        }

        /* Scoped scroll track overrides */
        .cat-showcase .trk {
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
        }
        .cat-showcase .trk::-webkit-scrollbar {
          display: none;
        }
        .cat-showcase .trk:focus-visible {
          box-shadow: 0 0 0 3px rgba(227, 20, 27, 0.35);
          border-radius: 20px;
        }

        /* Scoped animations & interactions */
        .cat-showcase-card {
          isolation: isolate;
          transition: transform 0.4s cubic-bezier(0.2, 0.7, 0.2, 1), box-shadow 0.4s ease;
        }

        .cat-showcase-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 40px 70px -40px rgba(17, 17, 20, 0.6);
        }

        .cat-showcase-card:focus-visible {
          outline: 3px solid #e3141b;
          outline-offset: 3px;
        }

        @keyframes catFloatGlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      {/* ------------------------------------------------------------- */}
      {/* 1. SECTION HEADER (Matching Unitech standard edge padding)     */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 mb-8 sm:mb-10">
        <div className="w-full flex flex-col lg:flex-row lg:items-end justify-between gap-4 xl:gap-6">
          {/* Left Column: Pill, Title, Subtitle stretched completely in 1 line on desktop */}
          <div className="flex-1 min-w-0 flex flex-col gap-2.5">
            <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-[#FDECEC] border border-[#F8C9CB] shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-[#C3101A]" />
              <span className="text-[12px] sm:text-[12.5px] font-bold text-[#C3101A] tracking-[0.06em] uppercase">
                Full Product Hierarchy
              </span>
            </div>

            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-[40px] xl:text-[46px] 2xl:text-[50px] font-extrabold text-[#111114] tracking-tight leading-tight lg:whitespace-nowrap">
              Hardware Manufacturing Categories
            </h2>

            <p className="text-[#5F6368] text-xs sm:text-sm lg:text-[16px] font-normal leading-relaxed lg:whitespace-nowrap">
              Engineered, tested and assembled at our Sahibabad Industrial Area facility with direct OEM warranty.
            </p>
          </div>

          {/* Right Column: "View all hardware →" link + ‹ › round buttons (Desktop) */}
          <div className="hidden lg:flex items-center gap-5 shrink-0 pb-1">
            <Link
              href="/catalogue"
              className="text-[15px] font-bold text-[#111114] hover:text-[#E3141B] flex items-center gap-1.5 transition-colors group cursor-pointer whitespace-nowrap"
            >
              <span>View all hardware</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <div className="flex items-center gap-2.5">
              {/* Previous Button */}
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous categories"
                aria-disabled={scrollState.canPrev ? "false" : "true"}
                className={`w-[52px] h-[52px] rounded-full border border-[#DADADF] bg-white flex items-center justify-center transition-all ${
                  scrollState.canPrev
                    ? "text-[#111114] hover:bg-[#111114] hover:text-white hover:border-[#111114] cursor-pointer shadow-xs active:scale-95"
                    : "opacity-35 cursor-not-allowed text-[#111114]"
                }`}
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Next Button */}
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next categories"
                aria-disabled={scrollState.canNext ? "false" : "true"}
                className={`w-[52px] h-[52px] rounded-full border border-[#DADADF] bg-white flex items-center justify-center transition-all ${
                  scrollState.canNext
                    ? "text-[#111114] hover:bg-[#111114] hover:text-white hover:border-[#111114] cursor-pointer shadow-xs active:scale-95"
                    : "opacity-35 cursor-not-allowed text-[#111114]"
                }`}
              >
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. THE SHOWCASE ROW TRACK (Full Bleed Right Edge)              */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full relative">
        <div
          ref={trackRef}
          role="list"
          tabIndex={0}
          aria-label="Hardware categories — use left and right arrow keys to browse"
          onScroll={updateScrollMetrics}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="trk flex items-stretch overflow-x-auto outline-none select-none cursor-grab active:cursor-grabbing"
          style={{
            scrollSnapType: "x mandatory",
            scrollBehavior: "smooth",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingLeft: `${containerPaddingLeft}px`,
            scrollPaddingLeft: `${containerPaddingLeft}px`,
            paddingRight: "40px",
            gap: `${cardGap}px`,
          }}
        >
          {cards.map((card, idx) => {
            const presetClass = getPresetClass(card.scenePreset);
            const mainImg = card.productImageUrls?.[0] || `/images/products/cat-${card.categoryId}.png`;

            return (
              <div
                key={card.id || card.categoryId || idx}
                style={{
                  width: `${cardWidth}px`,
                  flex: "0 0 auto",
                  scrollSnapAlign: "start",
                }}
              >
                <Link
                  href={card.linkUrl || `/catalogue?category=${card.categoryId}`}
                  role="listitem"
                  onClick={(e) => handleCardClick(e, card)}
                  className={`cat-showcase-card group relative block w-full rounded-[22px] sm:rounded-[22px] max-sm:rounded-[18px] overflow-hidden bg-[#111114] border border-white/10 select-none cursor-pointer ${
                    isDesktop ? "h-[620px]" : isTablet ? "h-[460px]" : "h-[400px]"
                  }`}
                >
                  {/* LAYER 1: Scene Background with Custom Architectural Scenes */}
                  <div className="absolute inset-0 w-full h-full overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] will-change-[filter,transform] group-hover:lg:blur-[14px] group-hover:lg:brightness-[0.55] group-hover:lg:scale-[1.06] group-focus-within:lg:blur-[14px] group-focus-within:lg:brightness-[0.55] group-focus-within:lg:scale-[1.06]">
                    <CategoryCardScene card={card} />
                  </div>

                  {/* LAYER 2: Readability Shade Overlay (Above Scene, Below Text) */}
                  <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-[4]"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(8,8,10,0.82) 0%, rgba(8,8,10,0.3) 32%, transparent 60%)",
                    }}
                  />

                  {/* LAYER 3: Dark Layer Fades In On Desktop Hover (background rgba(18,18,22,.55), transition .4s) */}
                  <div
                    className="hidden lg:block absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-400 z-[5]"
                    style={{ background: "rgba(18, 18, 22, 0.55)" }}
                  />

                  {/* LAYER 4: Resting State Info (Title only; fades out on desktop hover) */}
                  <div
                    className="absolute bottom-6 sm:bottom-7 left-5 sm:left-[30px] right-5 sm:right-[30px] z-10 flex flex-col gap-2 transition-opacity duration-250 lg:group-hover:opacity-0 lg:group-focus-within:opacity-0"
                  >
                    {/* Badge and Live SKU indicator */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {card.badge && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-unitech-red text-white shadow-xs">
                          {card.badge}
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/15 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{card.skuCount ?? 0} Live SKUs</span>
                      </span>
                    </div>

                    {/* Card Title */}
                    <h3 className="font-heading font-extrabold text-white tracking-[-0.015em] leading-[1.08] text-[26px] sm:text-[28px] lg:text-[34px]">
                      {card.title}
                    </h3>

                    {/* Mobile / Tablet Compact Browse Row */}
                    <div className="lg:hidden flex items-center justify-between text-white/80 pt-1">
                      <span className="text-xs font-bold tracking-tight">{card.buttonText || "Explore Category"}</span>
                      <div className="w-7 h-7 rounded-full bg-[#E3141B] text-white flex items-center justify-center shadow-xs">
                        <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    </div>
                  </div>

                  {/* LAYER 5: Desktop Hikvision-Style Hover Block */}
                  {/* Fades in from translateY(12px) to 0 (opacity 0 → 1, .45s, delay .05s), absolutely positioned, inset 0, padding 56px 52px 40px, flex column */}
                  <div
                    className="hidden lg:flex absolute inset-0 z-20 flex-col p-[56px_52px_40px] pointer-events-none opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-450 delay-[50ms] ease-[cubic-bezier(0.2,0.7,0.2,1)]"
                  >
                    {/* Badge and Live SKU indicator on hover */}
                    <div className="flex items-center gap-2 mb-2">
                      {card.badge && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-unitech-red text-white shadow-xs">
                          {card.badge}
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/15 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{card.skuCount ?? 0} Live SKUs</span>
                      </span>
                    </div>

                    {/* Title: same text, 36px, weight 800, white, line-height 1.15 */}
                    <h3 className="font-heading font-extrabold text-[36px] text-white leading-[1.15] tracking-tight">
                      {card.title}
                    </h3>

                    {/* Dashed divider: margin 28px 0, border-top 1px dashed rgba(255,255,255,.35) */}
                    <div className="my-[28px] border-t border-dashed border-white/35" />

                    {/* Tagline: 20px, weight 700, white */}
                    <div className="text-[20px] font-bold text-white leading-snug">
                      {CATEGORY_TAGLINES[card.categoryId] || "Precision Engineered Surveillance"}
                    </div>

                    {/* Description: 16px, line-height 1.6, rgba(255,255,255,.88), margin-top 14px */}
                    <p className="text-[16px] leading-[1.6] text-white/90 font-normal mt-[14px]">
                      {card.description}
                    </p>

                    {/* Spec chips row (existing chips), margin-top 18px */}
                    {Array.isArray(card.chips) && card.chips.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-[18px]">
                        {card.chips.map((chip, cIdx) => (
                          <span
                            key={cIdx}
                            className="text-[12px] font-semibold text-white/95 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 tracking-tight"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* At bottom: Explore button label and circle arrow icon */}
                    <div className="mt-auto flex items-center justify-between w-full pt-4">
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        {card.buttonText || "Explore Catalogue"}
                      </span>
                      <div className="w-[44px] h-[44px] rounded-full border-[1.5px] border-white text-white flex items-center justify-center transition-colors duration-200 group-hover:hover:bg-white group-hover:hover:text-[#111114]">
                        <ArrowRight className="w-5 h-5 stroke-[2]" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. BELOW TRACK: PROGRESS BAR & MONOSPACE COUNTER               */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 mt-7 sm:mt-9">
        {isDesktop ? (
          /* Desktop Progress Bar + Monospace Counter */
          <div className="flex items-center justify-between gap-6">
            {/* 3px Progress Track with Dark Thumb */}
            <div className="relative flex-1 h-[3px] bg-[#E4E4E8] rounded-full overflow-hidden">
              <div
                className="absolute top-0 bottom-0 bg-[#111114] rounded-full transition-all duration-150 ease-out"
                style={{
                  width: `${scrollState.thumbWidth}%`,
                  left: `${scrollState.thumbLeft}%`,
                }}
              />
            </div>

            {/* Monospace Counter */}
            <div
              aria-live="polite"
              className="text-[12.5px] font-mono font-bold text-[#5F6368] tracking-wider shrink-0"
            >
              {scrollState.counterText}
            </div>
          </div>
        ) : (
          /* Mobile / Tablet Controls: Dots + ‹ › Buttons + Hint Text */
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              {/* Dot Indicators */}
              <div className="flex items-center gap-1.5">
                {cards.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => {
                      const track = trackRef.current;
                      if (!track) return;
                      const firstCard = track.firstElementChild as HTMLElement | null;
                      const cardW = firstCard?.offsetWidth || cardWidth;
                      const computed = window.getComputedStyle(track);
                      const gap = parseFloat(computed.columnGap || computed.gap) || cardGap;
                      track.scrollTo({ left: dotIdx * (cardW + gap), behavior: "smooth" });
                    }}
                    aria-label={`Go to category slide ${dotIdx + 1}`}
                    className={`h-[6px] rounded-full transition-all duration-300 cursor-pointer ${
                      dotIdx === scrollState.activeIdx ? "w-5 bg-[#E3141B]" : "w-1.5 bg-[#DADADF]"
                    }`}
                  />
                ))}
              </div>

              {/* Mobile 44x44 Prev / Next Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous category"
                  aria-disabled={scrollState.canPrev ? "false" : "true"}
                  className={`w-11 h-11 rounded-full border border-[#DADADF] bg-white flex items-center justify-center transition-all ${
                    scrollState.canPrev
                      ? "text-[#111114] active:scale-95 cursor-pointer shadow-xs"
                      : "opacity-35 cursor-not-allowed text-[#111114]"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next category"
                  aria-disabled={scrollState.canNext ? "false" : "true"}
                  className={`w-11 h-11 rounded-full border border-[#DADADF] bg-white flex items-center justify-center transition-all ${
                    scrollState.canNext
                      ? "text-[#111114] active:scale-95 cursor-pointer shadow-xs"
                      : "opacity-35 cursor-not-allowed text-[#111114]"
                  }`}
                >
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Mobile Full-width View All Hardware Button */}
            <Link
              href="/catalogue"
              className="w-full py-3.5 rounded-full bg-white border border-[#DADADF] hover:border-slate-400 text-[#111114] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-2xs active:scale-98 transition-all"
            >
              <span>View all hardware products</span>
              <ArrowRight className="w-4 h-4 text-[#E3141B]" />
            </Link>

            {/* Hint text */}
            <p className="text-center text-xs text-[#5F6368] font-medium">
              Swipe to explore · tap a card to open the category
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function getPresetClass(preset: CategoryScenePreset): string {
  switch (preset) {
    case "navy":
      return "cat-scene-navy";
    case "grid":
      return "cat-scene-grid";
    case "sand":
      return "cat-scene-sand";
    case "concrete":
      return "cat-scene-concrete";
    case "red":
      return "cat-scene-red";
    case "graphite":
    default:
      return "cat-scene-graphite";
  }
}

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  "cctv-cameras": "/images/categories/cctv-cameras.jpg",
  "dvr-nvr": "/images/categories/dvr-nvr-recorders.jpg",
  "networking-poe": "/images/categories/networking-poe.jpg",
  cables: "/images/categories/surveillance-cables.jpg",
  "network-racks": "/images/categories/dvr-server-racks.jpg",
  "power-accessories": "/images/categories/power-supplies-smps.jpg",
};

/**
 * Standard Full-Bleed Unitech Category Photo Scene
 * Fits perfectly into the standard 480x620 (or 960x1240 2x retina) frame
 */
function CategoryCardScene({ card }: { card: HomepageCategoryCard }) {
  const categoryId = card.categoryId;
  const imageSrc =
    card.backgroundImageUrl ||
    DEFAULT_CATEGORY_IMAGES[categoryId] ||
    "/images/categories/cctv-cameras.jpg";

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#111114]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt={card.title}
        className="w-full h-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-105"
        loading="lazy"
      />
    </div>
  );
}
