"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Category } from "@/lib/types";
import { ArrowRight, Layers } from "lucide-react";

interface CategoryGridProps {
  categories?: Category[];
  onSelectCategory?: (categorySlug: string) => void;
}

const CATEGORY_HIGHLIGHTS: Record<string, string[]> = {
  "cctv-cameras": ["4MP & 8MP 4K", "Warm-Light Color", "IP67 Alloy", "Starlight Optics"],
  "dvr-nvr": ["4-CH to 32-CH", "H.265+ Encoding", "4K HDMI Output", "Hybrid DVR & NVR"],
  "networking-poe": ["Gigabit PoE+", "Industrial Surge", "VLAN Isolation", "250m Long Range"],
  "cables": ["100% Solid Copper", "Zero CCA Guarantee", "Cat6 550MHz", "3+1 CCTV Coaxial"],
  "network-racks": ["2U to 12U Standard", "Toughened Glass", "Dual Key Lock", "60 Kg Safe Load"],
  "power-accessories": ["Surge Protected", "1A to 20A Options", "Copper Transformer", "Multi-Channel SMPS"],
};

// Tight high-resolution cropped category assets that fill the display frame completely
const CATEGORY_IMAGES: Record<string, string> = {
  "cctv-cameras": "/images/products/cat-cctv.png",
  "dvr-nvr": "/images/products/cat-dvr.png",
  "networking-poe": "/images/products/cat-poe.png",
  "cables": "/images/products/cat-cables.png",
  "network-racks": "/images/products/cat-racks.png",
  "power-accessories": "/images/products/cat-smps.png",
};

interface CategoryCardItemProps {
  cat: Category;
  highlights: string[];
  imgSrc: string;
  index: number;
  isVisible: boolean;
  onSelect?: () => void;
}

function CategoryCardItem({
  cat,
  highlights,
  imgSrc,
  index,
  isVisible,
  onSelect,
}: CategoryCardItemProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const [spotlight, setSpotlight] = useState<{ x: number; y: number; opacity: number }>({
    x: 0,
    y: 0,
    opacity: 0,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = x / rect.width;
    const yPercent = y / rect.height;

    // Subtle 3D tilt calculation (max ±8 degrees for a luxurious, controlled feel)
    const rotateX = Number(((0.5 - yPercent) * 9).toFixed(2));
    const rotateY = Number(((xPercent - 0.5) * 11).toFixed(2));

    setTilt({ x: rotateX, y: rotateY, active: true });
    setSpotlight({ x, y, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, active: false });
    setSpotlight((prev) => ({ ...prev, opacity: 0 }));
  };

  const entranceClass = isVisible ? `anim-assemble-${index}` : "opacity-0";

  return (
    <div
      ref={cardRef}
      onClick={onSelect}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: tilt.active
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-8px)`
          : "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)",
        transition: tilt.active
          ? "transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease-out"
          : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease-out",
        transformStyle: "preserve-3d",
      }}
      className={`group cursor-pointer rounded-3xl bg-white p-6 sm:p-7 border border-slate-200/90 shadow-[0_4px_16px_-4px_rgba(15,23,42,0.06)] hover:shadow-[0_22px_45px_-10px_rgba(230,0,0,0.18)] hover:border-red-300 transition-all flex flex-col justify-between relative overflow-hidden select-none ${entranceClass}`}
    >
      {/* Interactive Light Spotlight Follow Beam */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-300 z-10"
        style={{
          background: `radial-gradient(420px circle at ${spotlight.x}px ${spotlight.y}px, rgba(230,0,0,0.06), transparent 70%)`,
          opacity: spotlight.opacity,
        }}
      />

      <div className="relative z-10">
        {/* Amplified Hardware Category Showcase Stage - Seamless with Card */}
        <div className="relative w-full h-56 sm:h-64 lg:h-72 rounded-2xl bg-slate-50/60 p-4 sm:p-5 mb-5 flex items-center justify-center overflow-hidden border border-slate-100 group-hover:border-red-200 group-hover:bg-white transition-all duration-300">
          {/* SKU Count Badge with Micro Pulse */}
          <span className="absolute top-3.5 right-3.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs border border-slate-200/90 text-[11px] font-mono font-black text-slate-500 shadow-2xs group-hover:border-red-200 group-hover:text-unitech-red transition-colors z-20">
            {cat.count} SKUs
          </span>

          {/* Elevated 3D Product Hardware Image Stage */}
          <div
            className="w-full h-full flex flex-col items-center justify-center p-2 transition-transform duration-300"
            style={{
              transform: tilt.active ? "scale(1.09) translateZ(35px)" : "scale(1) translateZ(0)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={cat.name}
              className="max-h-[86%] max-w-[90%] w-auto h-auto object-contain p-1 mix-blend-multiply transition-transform duration-300"
              loading="lazy"
            />
            {/* Clean soft elliptical floor shadow (seamless on white, zero harsh bounding boxes) */}
            <div className="w-3/5 h-3.5 bg-slate-900/10 rounded-full blur-md pointer-events-none -mt-1.5" />
          </div>
        </div>

        {/* Bold Black Category Title */}
        <div className="mb-2">
          <h3 className="font-heading font-black text-xl sm:text-2xl text-slate-950 group-hover:text-unitech-red transition-colors tracking-tight">
            {cat.name}
          </h3>
        </div>

        {/* Greyish Non-Title Description */}
        <p className="text-xs sm:text-sm font-semibold text-slate-500 leading-relaxed mb-3.5">
          {cat.description}
        </p>

        {/* Greyish Feature Badges */}
        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {highlights.map((tag, tIdx) => (
              <span
                key={tIdx}
                className="px-2.5 py-1 rounded-lg bg-slate-100/90 text-slate-500 text-[11px] sm:text-xs font-bold tracking-tight border border-slate-200/60 group-hover:bg-red-50 group-hover:border-red-200/80 group-hover:text-unitech-red transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer: Greyish Link with Animated Red Pill Button */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-slate-500 group-hover:text-unitech-red transition-colors relative z-10">
        <span className="text-xs sm:text-sm font-bold tracking-tight">
          Browse Category Series
        </span>
        <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-unitech-red group-hover:text-white flex items-center justify-center transition-all shadow-2xs group-hover:translate-x-1">
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </div>
      </div>
    </div>
  );
}

export function CategoryGrid({ categories = [], onSelectCategory }: CategoryGridProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [internalCategories, setInternalCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (categories.length === 0) {
      fetch("/api/categories")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) {
            setInternalCategories(json.data);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [categories]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="categories"
      className="py-14 sm:py-20 bg-[#faf9f5] border-b border-slate-200/80 relative overflow-hidden"
    >
      {/* ------------------------------------------------------------- */}
      {/* STAGGERED ASSEMBLY LINE ENTRANCE KEYFRAMES                    */}
      {/* ------------------------------------------------------------- */}
      <style jsx global>{`
        @keyframes categoryAssembleIn {
          0% {
            opacity: 0;
            transform: translateY(32px) scale(0.94);
          }
          65% {
            opacity: 1;
            transform: translateY(-4px) scale(1.015);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .anim-assemble-0 { animation: categoryAssembleIn 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s both; }
        .anim-assemble-1 { animation: categoryAssembleIn 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) 0.12s both; }
        .anim-assemble-2 { animation: categoryAssembleIn 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) 0.19s both; }
        .anim-assemble-3 { animation: categoryAssembleIn 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) 0.26s both; }
        .anim-assemble-4 { animation: categoryAssembleIn 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) 0.33s both; }
        .anim-assemble-5 { animation: categoryAssembleIn 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) 0.40s both; }
      `}</style>

      {/* Full Width Edge-to-Edge Container (Lenskart Format) */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        
        {/* Section Heading: Edge-to-Edge Spanning */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-unitech-red border border-red-200/90 text-xs font-black uppercase tracking-wider mb-2.5 shadow-2xs">
              <Layers className="w-3.5 h-3.5" />
              <span>Full Product Hierarchy</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-[42px] font-black text-slate-950 tracking-tight leading-tight">
              Hardware Manufacturing Categories
            </h2>
            <p className="text-slate-600 text-sm sm:text-base font-semibold mt-2 leading-relaxed">
              Engineered, tested, and assembled at our Sahibabad Industrial Area facility with direct OEM warranty.
            </p>
          </div>

          <Link
            href="/catalogue"
            className="px-5 py-3 rounded-full bg-white hover:bg-slate-50 border border-slate-300/90 text-slate-900 hover:text-unitech-red text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-2xs hover:shadow-xs transition-all group shrink-0 self-start md:self-auto cursor-pointer"
          >
            <span>View All Hardware Products</span>
            <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-unitech-red group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

        {/* Category Tiles: Full Width 3-Column Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-200/60 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
            {(categories.length > 0 ? categories : internalCategories)
              .filter((c) => c.isActive)
              .map((cat, idx) => {
                const highlights =
                  cat.series && cat.series.length > 0
                    ? cat.series.map((s) => s.label).slice(0, 4)
                    : CATEGORY_HIGHLIGHTS[cat.id] || [];
                const imgSrc =
                  cat.coverImageUrl || cat.image || CATEGORY_IMAGES[cat.id] || `/images/products/cat-${cat.id}.png`;

                return (
                  <CategoryCardItem
                    key={cat.id}
                    cat={cat}
                    highlights={highlights}
                    imgSrc={imgSrc}
                    index={idx}
                    isVisible={isVisible}
                    onSelect={() => onSelectCategory?.(cat.id)}
                  />
                );
              })}
          </div>
        )}

      </div>
    </section>
  );
}
