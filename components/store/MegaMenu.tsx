"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ChevronRight,
  ArrowRight,
  SlidersHorizontal,
  FileDown,
  MessageCircle,
  Package,
} from "lucide-react";
import { Product, Category } from "@/lib/types";
import { formatINR } from "@/lib/utils";

export interface MegaMenuProps {
  isOpen: boolean;
  type: "products" | null;
  onClose: () => void;
  headerBottom: number;
  products?: Product[];
  categories?: Category[];
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function MegaMenu({
  isOpen,
  type,
  onClose,
  headerBottom,
  products = [],
  categories = [],
  onMouseEnter,
  onMouseLeave,
}: MegaMenuProps) {
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("cctv-cameras");
  const [internalCategories, setInternalCategories] = useState<Category[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (categories.length === 0) {
      fetch("/api/categories")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) {
            setInternalCategories(json.data);
          }
        })
        .catch(() => {});
    }
  }, [categories.length]);

  // Keyboard accessibility: Close on Esc
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen || !type) return null;

  const displayCategories = (categories.length > 0 ? categories : internalCategories).filter(
    (c) => c.isActive && c.showInMenu
  );

  // Selected Category Info
  const selectedCat =
    displayCategories.find((c) => c.id === activeCategory) ||
    displayCategories[0] || {
      id: "cctv-cameras",
      name: "CCTV Cameras",
      coverImageUrl: "/images/products/utipbcp-4101.png",
      productCount: 0,
      series: [],
    };

  const catSeries =
    selectedCat.series
      ?.filter((s) => s.isActive)
      .map((s) => ({
        label: s.label,
        href: `/catalogue?category=${encodeURIComponent(selectedCat.id)}&series=${encodeURIComponent(s.slug)}`,
      })) || [];

  // Top 4 Products in selected category (Bestsellers first)
  const categoryProducts = products.filter((p) => p.category === selectedCat.id);
  const sortedProducts = [...categoryProducts]
    .sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0))
    .slice(0, 4);

  // Total products across all categories
  const totalProductCount = products.length > 0 ? products.length : 88;

  return createPortal(
    <div
      className="mega"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <style jsx global>{`
        @keyframes megaEnter {
          from {
            opacity: 0;
            transform: translate(-50%, -8px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .mega-panel-anim {
          animation: megaEnter 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Dimmed Backdrop (below header, header is not dimmed) */}
      <div
        onClick={onClose}
        className="fixed left-0 right-0 bottom-0 pointer-events-auto transition-opacity duration-200"
        style={{
          top: `${headerBottom}px`,
          backgroundColor: "rgba(17, 17, 20, 0.32)",
          backdropFilter: "blur(2px)",
          zIndex: 1000,
        }}
        aria-hidden="true"
      />

      {/* Floating Mega Menu Panel */}
      <div
        ref={panelRef}
        role="region"
        aria-label="Products Menu"
        className="mega-panel-anim fixed bg-white border border-[#EDEDF0] rounded-[24px] shadow-[0_40px_90px_-40px_rgba(17,17,20,0.45)] overflow-hidden"
        style={{
          top: `${headerBottom + 10}px`,
          left: "50%",
          width: "min(1280px, calc(100vw - 64px))",
          zIndex: 1001,
        }}
      >
        {/* ======================================================== */}
        {/* CASE 1: PRODUCTS MEGA MENU (3 COLUMNS + BOTTOM BAR)     */}
        {/* ======================================================== */}
        {type === "products" && (
          <div className="flex flex-col">
            {/* 3 Columns: 280px | 300px | minmax(0, 1fr) */}
            <div
              className="grid divide-x divide-[#EDEDF0] items-start"
              style={{
                gridTemplateColumns: "280px 300px minmax(0, 1fr)",
              }}
            >
              {/* Column 1: CATEGORIES (280px) */}
              <div className="p-[20px] space-y-1">
                <div className="text-[10.5px] font-mono font-bold tracking-[0.12em] text-[#6E6E78] uppercase mb-3">
                  Categories
                </div>
                <div className="space-y-1">
                  {displayCategories.map((cat) => {
                    const isActive = cat.id === selectedCat.id;
                    const catCount = cat.productCount ?? products.filter((p) => p.category === cat.id).length;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onMouseEnter={() => setActiveCategory(cat.id)}
                        onFocus={() => setActiveCategory(cat.id)}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition-all text-left group cursor-pointer ${
                          isActive
                            ? "bg-[#FFF1F1] text-[#E3141B] border-l-[3px] border-[#E3141B] pl-2.5 font-bold"
                            : "hover:bg-[#F7F7F8] text-slate-800 font-semibold"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          {/* 42x42 Grey Thumbnail */}
                          <div className="w-[42px] h-[42px] rounded-lg bg-[#F2F2F4] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={cat.coverImageUrl || cat.image || `/images/products/cat-${cat.id}.png`}
                              alt=""
                              className="max-h-full max-w-full object-contain mix-blend-multiply"
                            />
                          </div>
                          <span className="text-[14px] leading-[1.3] whitespace-normal">
                            {cat.name}
                          </span>
                        </div>

                        {/* Live Product Count Pill */}
                        <span
                          className={`text-[11px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
                            isActive
                              ? "bg-red-100 text-[#E3141B] font-bold"
                              : "bg-[#F2F2F4] text-[#6E6E78]"
                          }`}
                        >
                          {catCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Column 2: SERIES (300px) */}
              <div className="p-[20px] space-y-1">
                <div className="text-[10.5px] font-mono font-bold tracking-[0.12em] text-[#6E6E78] uppercase mb-3">
                  Series
                </div>
                <div className="flex flex-col gap-[2px]">
                  {catSeries.map((s, sIdx) => (
                    <Link
                      key={sIdx}
                      href={s.href}
                      onClick={onClose}
                      className="flex items-center justify-between p-[10px_12px] rounded-[10px] text-[14.5px] font-medium text-slate-700 hover:bg-[#F7F7F8] hover:text-[#E3141B] transition-colors group cursor-pointer"
                    >
                      <span className="leading-[1.35] whitespace-normal pr-2">
                        {s.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#E3141B] group-hover:translate-x-0.5 transition-all shrink-0 self-center" />
                    </Link>
                  ))}

                  {/* All Category Link */}
                  <Link
                    href={`/catalogue?category=${selectedCat.id}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E3141B] hover:underline mt-[8px] px-3 whitespace-nowrap"
                  >
                    <span>All {selectedCat.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </Link>
                </div>
              </div>

              {/* Column 3: TOP PRODUCTS · FACTORY B2B PRICE (minmax(0, 1fr)) */}
              <div className="p-[20px] space-y-3">
                <div className="flex items-center justify-between gap-3 mb-[14px]">
                  <div className="text-[10.5px] font-mono font-bold tracking-[0.12em] text-[#6E6E78] uppercase truncate whitespace-nowrap">
                    Top Products · Factory B2B Price
                  </div>
                  <Link
                    href={`/catalogue?category=${selectedCat.id}`}
                    onClick={onClose}
                    className="text-[11.5px] font-bold text-[#E3141B] hover:underline flex items-center gap-1 shrink-0 whitespace-nowrap"
                  >
                    <span>View all {selectedCat.name}</span>
                    <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                  </Link>
                </div>

                {/* 2x2 Horizontal Product Grid */}
                <div
                  className="grid gap-[12px]"
                  style={{
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  }}
                >
                  {sortedProducts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug}`}
                      onClick={onClose}
                      className="group p-[12px] rounded-[14px] border border-[#EDEDF0] hover:border-[#D4D4D8] hover:shadow-xs bg-white transition-all flex items-center gap-3 cursor-pointer h-full"
                    >
                      {/* Left Image Tile: width 104px, height 88px, background #F5F5F7, radius 12px, image object-fit contain, max-width 86%, max-height 80% */}
                      <div className="w-[104px] h-[88px] rounded-[12px] bg-[#F5F5F7] p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.imageUrl || "/images/products/cat-cctv.png"}
                          alt={p.name}
                          className="max-w-[86%] max-h-[80%] object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
                        />
                      </div>

                      {/* Right Text Block: gap 4px */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                        <div className="text-[15px] font-bold text-slate-900 leading-[1.3] line-clamp-2 group-hover:text-[#E3141B] transition-colors">
                          {p.name}
                        </div>
                        <div className="font-mono text-[11.5px] text-[#6E6E78] truncate">
                          {p.modelCode}
                        </div>
                        <div className="text-[15px] font-bold text-slate-900 leading-tight">
                          {formatINR(p.price)}
                          <span className="text-[12px] font-normal text-[#6E6E78] ml-1">
                            + GST
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Bar: Action tiles + All products button */}
            <div className="border-t border-[#EDEDF0] bg-[#FAFAFB] px-6 py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-6 text-xs font-semibold text-slate-800">
                <Link
                  href="/kit-builder"
                  onClick={onClose}
                  className="flex items-center gap-2 hover:text-[#E3141B] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#F2F2F4] text-[#E3141B] flex items-center justify-center shadow-2xs">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <span>Kit Builder</span>
                </Link>

                <Link
                  href="/support"
                  onClick={onClose}
                  className="flex items-center gap-2 hover:text-[#E3141B] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#F2F2F4] text-[#E3141B] flex items-center justify-center shadow-2xs">
                    <FileDown className="w-4 h-4" />
                  </div>
                  <span>Download catalogue (PDF)</span>
                </Link>

                <a
                  href="https://wa.me/918700317239?text=Hello%20Unitech%2C%20please%20share%20the%20complete%20B2B%20wholesale%20price%20list."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-[#E3141B] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#F2F2F4] text-[#E3141B] flex items-center justify-center shadow-2xs">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <span>Bulk quote on WhatsApp</span>
                </a>
              </div>

              <Link
                href="/catalogue"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111114] hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                All {totalProductCount} products →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
