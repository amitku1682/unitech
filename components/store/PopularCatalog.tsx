"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { Product, Category } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import {
  ShoppingBag,
  Check,
  Zap,
  Info,
  Camera,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface PopularCatalogProps {
  products: Product[];
  categories?: Category[];
  onAddToCart: (product: Product) => void;
  onOpenSpecsModal: (product: Product) => void;
}

// Clean product image loader
const getProductImage = (url?: string) => {
  if (!url) return "";
  return url;
};

export function PopularCatalog({
  products,
  categories = [],
  onAddToCart,
  onOpenSpecsModal,
}: PopularCatalogProps) {
  const [liveCategories, setLiveCategories] = useState<Category[]>(categories || []);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setLiveCategories(categories);
    }
  }, [categories]);

  useEffect(() => {
    fetch("/api/categories", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setLiveCategories(json.data);
        }
      })
      .catch((err) => console.warn("[PopularCatalog categories fetch error]:", err));
  }, []);

  // Build tabs from active categories with >= 1 active product, sorted by position, Bestsellers last
  const filterTabs = useMemo(() => {
    const activeCats = liveCategories
      .filter((c) => c.isActive !== false)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((cat) => {
        const catProds = products.filter(
          (p) => (p.category === cat.id || (p as any).categoryId === cat.id) && (p as any).isActive !== false && (p as any).is_active !== false
        );
        return {
          id: cat.id,
          name: cat.name,
          label: cat.shortLabel || cat.name,
          count: catProds.length,
          isBestseller: false,
        };
      })
      .filter((t) => t.count > 0);

    const bestsellerCount = products.filter(
      (p) => p.isBestseller && (p as any).isActive !== false && (p as any).is_active !== false
    ).length;
    const bestsellerTab = {
      id: "bestsellers",
      name: "Bestsellers",
      label: "Bestsellers",
      count: bestsellerCount,
      isBestseller: true,
    };

    return [...activeCats, bestsellerTab];
  }, [liveCategories, products]);

  // First category tab active by default
  const [activeFilter, setActiveFilter] = useState<string>("cctv-cameras");

  useEffect(() => {
    if (filterTabs.length > 0 && !filterTabs.some((t) => t.id === activeFilter)) {
      setActiveFilter(filterTabs[0].id);
    }
  }, [filterTabs, activeFilter]);

  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef<boolean>(false);
  const wheelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const handleAdd = (product: Product) => {
    onAddToCart(product);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const filteredProducts = useMemo(() => {
    if (activeFilter === "bestsellers") {
      return products.filter((p) => p.isBestseller && (p as any).isActive !== false && (p as any).is_active !== false);
    }
    return products.filter(
      (p) =>
        (p.category === activeFilter || (p as any).categoryId === activeFilter) &&
        (p as any).isActive !== false &&
        (p as any).is_active !== false
    );
  }, [products, activeFilter]);

  // Ensure all products in the selected category are present without any slice limit
  const baseList = filteredProducts.length > 0 ? filteredProducts : products;

  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanPrev(scrollLeft > 10);
    setCanNext(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  const handlePrev = useCallback(() => {
    if (!canPrev) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = Math.max(340, Math.floor(el.clientWidth * 0.75));
    el.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  }, [canPrev]);

  const handleNext = useCallback(() => {
    if (!canNext) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = Math.max(340, Math.floor(el.clientWidth * 0.75));
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }, [canNext]);

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [updateScrollState, baseList]);

  // Reset scroll position on filter tab switch
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
      setTimeout(updateScrollState, 350);
    }
  }, [activeFilter, updateScrollState]);

  // Keyboard navigation & non-passive mouse-wheel scrolling
  useEffect(() => {
    const section = sectionRef.current;
    const track = scrollContainerRef.current;
    if (!section || !track) return;

    // A) IntersectionObserver (threshold 0.5) to track section visibility
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

    // B) Keydown listener on document
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") return;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      if (!isVisibleRef.current) return;

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

      const hasScrollLock =
        document.body.style.overflow === "hidden" ||
        document.documentElement.style.overflow === "hidden";
      const hasAriaModal = !!document.querySelector('[aria-modal="true"]');
      if (hasScrollLock || hasAriaModal) return;

      e.preventDefault();
      const firstCard = track.firstElementChild as HTMLElement | null;
      const cardW = firstCard?.offsetWidth || 335;
      const computed = window.getComputedStyle(track);
      const gap = parseFloat(computed.columnGap || computed.gap) || 24;
      const step = cardW + gap;

      track.scrollBy({
        left: e.key === "ArrowRight" ? step : -step,
        behavior: "smooth",
      });
    };
    document.addEventListener("keydown", onKeyDown);

    // C) Non-passive mouse wheel listener on track
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return; // trackpad horizontal swipe works natively
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
          if (scrollContainerRef.current) {
            scrollContainerRef.current.style.scrollSnapType = "";
          }
        }, 150);
      }
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

  // Drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
    hasDraggedRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.2;
    if (Math.abs(walk) > 6) {
      hasDraggedRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  };

  const handleSpecsClick = (product: Product) => {
    if (hasDraggedRef.current) return;
    onOpenSpecsModal(product);
  };

  const handleProductAdd = (product: Product) => {
    if (hasDraggedRef.current) return;
    handleAdd(product);
  };

  return (
    <section
      ref={sectionRef}
      id="catalog"
      tabIndex={0}
      aria-label="Popular with CCTV Installers & Dealers"
      className="py-10 sm:py-14 lg:py-16 bg-white border-b border-slate-200/60 overflow-hidden outline-none select-none"
    >
      <style jsx global>{`
        .pop-track::-webkit-scrollbar {
          display: none;
        }
        .pop-track:focus-visible {
          box-shadow: 0 0 0 3px rgba(227, 20, 27, 0.35);
          border-radius: 16px;
        }
      `}</style>
      {/* Full Width Container matching complete site spacing */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        
        {/* Header Block: Left-Aligned & Amplified + Matching Left & Right Navigation Arrows */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex-1 min-w-0 pr-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-unitech-red mb-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Production Line Inventory</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight leading-tight">
              Popular with CCTV Installers & Dealers
            </h2>
            <p className="text-slate-600 text-sm sm:text-base font-semibold mt-1.5">
              Factory direct wholesale rates with transparent GST 18% calculation · Continuous Live Inventory
            </p>
          </div>

          {/* Right Column: Ready Stock badge + View full catalogue link + Round ‹ › Arrow Buttons */}
          <div className="flex items-center gap-4 shrink-0 self-start md:self-auto">
            <div className="hidden xl:flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ready Stock in Sahibabad Warehouse</span>
            </div>

            <Link
              href="/catalogue"
              className="hidden sm:flex text-[15px] font-bold text-[#111114] hover:text-[#E3141B] items-center gap-1.5 transition-colors group cursor-pointer whitespace-nowrap mr-1"
            >
              <span>View full catalogue</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <div className="flex items-center gap-2.5">
              {/* Previous Button */}
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous products"
                aria-disabled={canPrev ? "false" : "true"}
                className={`w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-full border border-[#DADADF] bg-white flex items-center justify-center transition-all ${
                  canPrev
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
                aria-label="Next products"
                aria-disabled={canNext ? "false" : "true"}
                className={`w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-full border border-[#DADADF] bg-white flex items-center justify-center transition-all ${
                  canNext
                    ? "text-[#111114] hover:bg-[#111114] hover:text-white hover:border-[#111114] cursor-pointer shadow-xs active:scale-95"
                    : "opacity-35 cursor-not-allowed text-[#111114]"
                }`}
              >
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Category Filter Pills + Bestsellers as last tab */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 sm:mb-8 no-scrollbar">
          {filterTabs.map((tab) => {
            const isSelected = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/15"
                    : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    isSelected ? "bg-white/20 text-white font-bold" : "bg-slate-200/80 text-slate-600 font-medium"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* HORIZONTAL SHOWCASE TRACK WITH SMOOTH SCROLL & DRAG SUPPORT   */}
      {/* ------------------------------------------------------------- */}
      <div className="relative w-full overflow-hidden select-none py-2">
        {/* Soft edge gradient fades */}
        <div
          className={`absolute top-0 bottom-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10 transition-opacity duration-300 ${
            canPrev ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute top-0 bottom-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10 transition-opacity duration-300 ${
            canNext ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Scrollable / Draggable Track */}
        <div
          ref={scrollContainerRef}
          role="list"
          tabIndex={0}
          aria-label="Hardware categories — use left and right arrow keys to browse"
          onScroll={updateScrollState}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="pop-track flex items-stretch gap-5 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth py-3 px-4 sm:px-6 lg:px-8 xl:px-10 cursor-grab active:cursor-grabbing outline-none"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            scrollSnapType: "x mandatory",
          }}
        >
          {baseList.map((product) => {
            const isAdded = addedIds[product.id];
            const isOutOfStock = product.stockQuantity === 0;

            return (
              <div
                key={product.id}
                style={{ scrollSnapAlign: "start" }}
                className={`w-[290px] sm:w-[320px] md:w-[335px] shrink-0 group rounded-2xl bg-white border shadow-xs hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden hover:-translate-y-1.5 ${
                  isOutOfStock
                    ? "border-rose-200/90 opacity-90"
                    : "border-slate-200/90 hover:border-slate-400"
                }`}
              >
                {/* Top Section */}
                <div className="p-3.5 sm:p-4">
                  {/* Badges Bar */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 truncate max-w-[110px]">
                      {product.modelCode}
                    </span>
                    {isOutOfStock ? (
                      <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-wide flex items-center gap-1 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                        Out of Stock
                      </span>
                    ) : product.isBestseller ? (
                      <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-unitech-red/10 text-unitech-red border border-unitech-red/20 uppercase tracking-wide shrink-0">
                        Bestseller
                      </span>
                    ) : null}
                  </div>

                  {/* Clean High-Resolution Product Image with Soft Pedestal Base */}
                  <div
                    onClick={() => handleSpecsClick(product)}
                    className="cursor-pointer mb-2 w-full h-44 sm:h-48 rounded-xl bg-slate-50/70 border border-slate-100 p-2.5 flex flex-col items-center justify-center overflow-hidden group-hover:border-slate-300 transition-all relative"
                  >
                    {product.imageUrl && !brokenImages[product.id] ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getProductImage(product.imageUrl)}
                          alt={product.name}
                          onError={() => setBrokenImages((prev) => ({ ...prev, [product.id]: true }))}
                          className="max-h-[82%] max-w-[88%] w-auto h-auto object-contain p-1 mix-blend-multiply group-hover:scale-108 transition-transform duration-300"
                        />
                        {/* Subtle soft elliptical shadow under product */}
                        <div className="w-3/5 h-3 bg-slate-900/10 rounded-full blur-md pointer-events-none -mt-1" />
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                        <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 mb-1" />
                        <span className="text-[9px] font-mono font-bold text-slate-500">{product.modelCode}</span>
                        <span className="text-[8px] text-slate-400">OEM Studio</span>
                      </div>
                    )}
                  </div>

                  {/* Category & Name */}
                  <div className="mb-1.5">
                    <span className="text-[11px] sm:text-xs uppercase font-bold text-slate-500 tracking-wider truncate block">
                      {product.categoryLabel}
                    </span>
                    <h3
                      onClick={() => handleSpecsClick(product)}
                      className="font-heading font-black text-slate-900 text-sm sm:text-base hover:text-unitech-red transition-colors cursor-pointer line-clamp-2 mt-0.5 leading-snug"
                    >
                      {product.name}
                    </h3>
                  </div>

                  {/* Highlights Bullet Points */}
                  <ul className="space-y-1 mb-2 text-[11px] sm:text-xs font-normal text-slate-600">
                    {product.highlights.slice(0, 3).map((hl, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                        <span className="line-clamp-1">{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Section (Pricing & Actions) */}
                <div className="p-3 sm:p-3.5 bg-slate-50/80 border-t border-slate-100 mt-auto">
                  {/* Pricing Tiers */}
                  <div className="mb-2.5">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="font-heading text-lg sm:text-xl font-black text-slate-950">
                          {formatINR(product.price)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">+18% GST</span>
                      </div>
                      <span className="text-xs sm:text-sm font-black text-slate-400 line-through decoration-slate-400 decoration-1">
                        {formatINR(product.mrp)}
                      </span>
                    </div>

                    {/* Synchronized Wholesale & Dealer Tiers */}
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      <div className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200/90 px-2 py-1.5 rounded-lg flex flex-col justify-center shadow-2xs">
                        <span className="text-slate-500 font-semibold uppercase text-[9px] tracking-tight">
                          10 - 49 Units
                        </span>
                        <span className="font-bold text-slate-900 text-xs">
                          {formatINR(product.tier2Price || Math.round(product.price * 0.85))}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-emerald-900 bg-emerald-50/90 border border-emerald-300/90 px-2 py-1.5 rounded-lg flex flex-col justify-center shadow-2xs">
                        <span className="text-emerald-800 font-extrabold uppercase text-[9px] tracking-tight">
                          Dealer (50+)
                        </span>
                        <span className="font-black text-xs text-emerald-700">
                          {formatINR(product.dealerPrice || Math.round(product.price * 0.75))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSpecsClick(product)}
                      className="px-2.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 touch-manipulation min-h-[36px]"
                    >
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      <span>Specs</span>
                    </button>

                    {isOutOfStock ? (
                      <button
                        type="button"
                        disabled
                        className="px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-400 cursor-not-allowed flex items-center justify-center gap-1 min-h-[36px]"
                        title="Currently Out of Stock"
                      >
                        <span>Out</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleProductAdd(product)}
                        className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 touch-manipulation min-h-[36px] ${
                          isAdded
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-900 hover:bg-unitech-red text-white"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* View All in Catalogue CTA strip */}
      {(() => {
        const currentTab = filterTabs.find((t) => t.id === activeFilter);
        const buttonHref =
          activeFilter === "bestsellers"
            ? "/catalogue?filter=bestsellers"
            : `/catalogue?category=${encodeURIComponent(activeFilter)}`;
        const buttonText =
          activeFilter === "bestsellers"
            ? `Browse Complete Bestsellers Catalogue (${currentTab?.count || filteredProducts.length} Models)`
            : `Browse Complete ${currentTab?.name || currentTab?.label || "Hardware"} Catalogue (${currentTab?.count || filteredProducts.length} Models)`;

        return (
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 mt-8 sm:mt-10 text-center">
            <Link
              href={buttonHref}
              className="inline-flex items-center gap-2 sm:gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-unitech-red hover:bg-unitech-darkred text-white text-xs sm:text-base font-bold transition-all shadow-[0_6px_20px_rgba(230,0,0,0.35)] hover:shadow-[0_8px_24px_rgba(230,0,0,0.45)] hover:-translate-y-0.5 active:scale-98 cursor-pointer"
            >
              <span>{buttonText}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
          </div>
        );
      })()}
    </section>
  );
}
