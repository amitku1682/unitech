"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  TrendingUp,
  Clock,
  ArrowRight,
  FileText,
  SlidersHorizontal,
  Download,
  MessageCircle,
  ArrowLeft,
  Camera,
  HardDrive,
  Network,
  Layers,
  Shield,
  Zap,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { Category } from "@/lib/types";

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  triggerButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

interface SearchSuggestResult {
  products: Array<{
    id: string;
    name: string;
    modelCode: string;
    category: string;
    categoryLabel?: string;
    slug: string;
    price: number;
    stockQuantity: number;
    imageUrl: string;
    datasheetPdfUrl?: string;
    isExactModel?: boolean;
    isBestseller?: boolean;
  }>;
  totalProductMatches: number;
  categories: Array<{
    id: string;
    name: string;
    count: number;
    imageUrl: string;
    linkUrl: string;
  }>;
  series: Array<{
    name: string;
    linkUrl: string;
  }>;
  documents: Array<{
    model: string;
    productName: string;
    fileUrl: string;
  }>;
  total: number;
}

export function SearchPanel({ isOpen, onClose, triggerButtonRef }: SearchPanelProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState<boolean>(false);
  const [headerBottom, setHeaderBottom] = useState<number>(80);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const [query, setQuery] = useState<string>("");
  const [popularChips, setPopularChips] = useState<
    Array<{ id: string; label: string; query: string; link_url?: string | null }>
  >([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setCategories(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [results, setResults] = useState<SearchSuggestResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mount on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Measure header bottom
  const measureHeaderBottom = useCallback(() => {
    if (typeof document === "undefined") return;
    const headerEl = document.querySelector("header");
    if (headerEl) {
      const rect = headerEl.getBoundingClientRect();
      setHeaderBottom(Math.round(rect.bottom));
    }
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    measureHeaderBottom();
    window.addEventListener("resize", measureHeaderBottom);
    window.addEventListener("scroll", measureHeaderBottom);
    return () => {
      window.removeEventListener("resize", measureHeaderBottom);
      window.removeEventListener("scroll", measureHeaderBottom);
    };
  }, [isOpen, measureHeaderBottom]);

  // Load recent searches from localStorage
  const loadRecentSearches = useCallback(() => {
    try {
      const raw = localStorage.getItem("unitech_recent_searches");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 5));
        }
      }
    } catch {}
  }, []);

  const saveRecentSearch = useCallback((term: string) => {
    const clean = term.trim();
    if (!clean || clean.length < 2) return;
    try {
      const raw = localStorage.getItem("unitech_recent_searches");
      const list = raw ? JSON.parse(raw) : [];
      const updated = [clean, ...list.filter((item: string) => item.toLowerCase() !== clean.toLowerCase())].slice(
        0,
        5
      );
      localStorage.setItem("unitech_recent_searches", JSON.stringify(updated));
      setRecentSearches(updated);
    } catch {}
  }, []);

  const removeRecentSearch = (e: React.MouseEvent, termToRemove: string) => {
    e.stopPropagation();
    try {
      const updated = recentSearches.filter((t) => t !== termToRemove);
      localStorage.setItem("unitech_recent_searches", JSON.stringify(updated));
      setRecentSearches(updated);
    } catch {}
  };

  // Fetch Popular Search Chips from API
  useEffect(() => {
    fetch("/api/search/popular")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setPopularChips(json.data);
        }
      })
      .catch((err) => {
        console.warn("[SearchPanel popular chips fallback]:", err);
      });
  }, []);

  // Log search query telemetry
  const logQuery = useCallback((term: string, count: number, source: "panel" | "results_page" | "chip") => {
    const clean = term.trim().toLowerCase();
    if (clean.length < 2) return;

    try {
      const sessionLogged = sessionStorage.getItem(`logged_search_${clean}`);
      if (sessionLogged) return;
      sessionStorage.setItem(`logged_search_${clean}`, "1");
    } catch {}

    fetch("/api/search/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        term: clean,
        results_count: count,
        source,
      }),
    }).catch(() => {});
  }, []);

  // Keyboard Shortcuts: "/" opens panel, Esc closes panel
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !isOpen) {
        const target = e.target as HTMLElement | null;
        const tagName = target?.tagName?.toLowerCase();
        const isEditable = target?.isContentEditable;
        if (tagName !== "input" && tagName !== "textarea" && tagName !== "select" && !isEditable) {
          e.preventDefault();
          const btn = triggerButtonRef?.current;
          if (btn) btn.click();
        }
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        if (query) {
          setQuery("");
          setResults(null);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, query, onClose, triggerButtonRef]);

  // Open / Close Management & Focus Trapping
  useEffect(() => {
    if (isOpen) {
      loadRecentSearches();
      document.body.style.overflow = "hidden";
      measureHeaderBottom();
      setTimeout(() => {
        if (window.innerWidth < 768) {
          mobileInputRef.current?.focus();
        } else {
          inputRef.current?.focus();
        }
      }, 50);
    } else {
      document.body.style.overflow = "";
      setActiveIndex(-1);
      if (triggerButtonRef?.current) {
        triggerButtonRef.current.focus();
      }
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, loadRecentSearches, triggerButtonRef, measureHeaderBottom]);

  // Search Suggest Query Debounce & Fetch
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setIsLoading(false);
      setActiveIndex(-1);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      return;
    }

    setIsLoading(true);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    debounceTimerRef.current = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(query.trim())}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setResults(json);
            setActiveIndex(-1);

            if (logTimerRef.current) clearTimeout(logTimerRef.current);
            if (query.trim().length >= 3) {
              logTimerRef.current = setTimeout(() => {
                logQuery(query, json.total || 0, "panel");
              }, 1500);
            }
          }
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            console.warn("[Search suggest error]:", err);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 150);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (logTimerRef.current) clearTimeout(logTimerRef.current);
    };
  }, [query, logQuery]);

  // Navigation Handlers
  const handleNavigateToCatalogue = (qStr: string) => {
    saveRecentSearch(qStr);
    logQuery(qStr, results?.total || 0, "results_page");
    onClose();
    router.push(`/catalogue?q=${encodeURIComponent(qStr.trim())}`);
  };

  const handleSelectProduct = (slug: string, productName: string) => {
    saveRecentSearch(productName);
    onClose();
    router.push(`/product/${slug}`);
  };

  const handleChipClick = (chip: { label: string; query: string; link_url?: string | null }) => {
    if (chip.link_url) {
      logQuery(chip.label, 1, "chip");
      onClose();
      router.push(chip.link_url);
    } else {
      setQuery(chip.query);
      logQuery(chip.query, 1, "chip");
      if (window.innerWidth < 768) {
        mobileInputRef.current?.focus();
      } else {
        inputRef.current?.focus();
      }
    }
  };

  // Keyboard Navigation inside Result List
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const productsCount = results?.products?.length || 0;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (productsCount > 0) {
        setActiveIndex((prev) => (prev < productsCount - 1 ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (productsCount > 0) {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : productsCount - 1));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && results?.products && results.products[activeIndex]) {
        const item = results.products[activeIndex];
        handleSelectProduct(item.slug, item.name);
      } else if (query.trim()) {
        handleNavigateToCatalogue(query);
      }
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search Unitech products"
      className="smart-search select-none"
    >
      <style jsx global>{`
        @keyframes ss-drop {
          0% {
            opacity: 0;
            transform: translate(-50%, -8px);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .ss-animate-drop {
          animation: ss-drop 220ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
        }
      `}</style>

      {/* Dimmed & Blurred Overlay: Starts exactly at the header's bottom edge */}
      <div
        onClick={onClose}
        className="fixed left-0 right-0 bottom-0 bg-[rgba(17,17,20,0.40)] backdrop-blur-[3px] transition-opacity"
        style={{
          top: isMobile ? 0 : `${headerBottom}px`,
          zIndex: 1000,
        }}
      />

      {/* ============================================================= */}
      {/* DESKTOP & TABLET PANEL (>= 768px)                              */}
      {/* ============================================================= */}
      <div
        ref={panelRef}
        className="ss-animate-drop hidden md:flex flex-col fixed bg-white rounded-[24px] border border-[#EDEDF0] shadow-[0_40px_90px_-40px_rgba(17,17,20,0.5)] overflow-hidden"
        style={{
          top: `${headerBottom + 12}px`,
          left: "50%",
          width: "min(1080px, calc(100vw - 64px))",
          maxHeight: `calc(100vh - ${headerBottom}px - 24px)`,
          zIndex: 1001,
        }}
      >
        {/* 3.1 TOP BAR */}
        <div className="p-3.5 sm:p-4 border-b border-[#EDEDF0] flex items-center gap-3 bg-white shrink-0">
          {/* Input Wrapper */}
          <div className="flex-1 min-h-[56px] px-4 rounded-[16px] border-2 border-[#E3141B] shadow-[0_0_0_4px_rgba(227,20,27,0.10)] flex items-center gap-3 bg-white">
            <Search className="w-[21px] h-[21px] text-[#E3141B] stroke-[2.2] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search by product, model no. (e.g. UTIPBCP-4101), category or spec…"
              autoComplete="off"
              aria-controls="smart-search-results"
              className="w-full text-[17px] font-semibold text-[#111114] placeholder:text-slate-400 focus:outline-none bg-transparent"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults(null);
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Close Button Pill */}
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-3.5 rounded-full border border-[#E4E4E8] bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer shrink-0"
          >
            <kbd className="font-mono text-[11px] font-bold text-[#5F6368] bg-white border border-[#E4E4E8] shadow-[0_1px_0_1px_#E4E4E8] rounded-[6px] px-1.5 py-0.5">
              Esc
            </kbd>
            <span className="text-xs font-bold text-slate-800">Close</span>
          </button>
        </div>

        {/* SCROLLABLE CONTENT BODY */}
        <div className="flex-1 overflow-y-auto">
          {/* 3.2 EMPTY STATE (No text typed) */}
          {!query.trim() && (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 p-5 sm:p-6 pb-2">
                {/* Left Column: Popular Searches + Recent Searches */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Popular Searches */}
                  <div>
                    <div className="text-[10.5px] font-mono font-bold tracking-[0.12em] text-[#6E6E78] uppercase mb-3">
                      Popular Searches
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {popularChips.map((chip) => (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => handleChipClick(chip)}
                          className="min-h-[36px] px-3.5 rounded-full border border-[#E4E4E8] bg-white hover:border-[#111114] text-[13.5px] font-semibold text-slate-800 flex items-center gap-1.5 shadow-2xs transition-all hover:bg-slate-50 cursor-pointer active:scale-95"
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-[#E3141B] stroke-[2.5]" />
                          <span>{chip.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recent Searches (Visitor History) */}
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="text-[10.5px] font-mono font-bold tracking-[0.12em] text-[#6E6E78] uppercase mb-2">
                        Recent Searches
                      </div>
                      <div className="divide-y divide-slate-100">
                        {recentSearches.map((term, rIdx) => (
                          <div
                            key={rIdx}
                            onClick={() => {
                              setQuery(term);
                              inputRef.current?.focus();
                            }}
                            className="group flex items-center justify-between py-2 px-1 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <Clock className="w-4 h-4 text-[#A1A1AA]" />
                              <span className="text-[14px] font-medium text-slate-800">
                                {term}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => removeRecentSearch(e, term)}
                              aria-label={`Remove ${term} from recent`}
                              className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Browse Categories 3x2 Grid */}
                <div className="lg:col-span-7">
                  <div className="text-[10.5px] font-mono font-bold tracking-[0.12em] text-[#6E6E78] uppercase mb-3">
                    Browse Categories
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {categories.filter((c) => c.isActive).map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/catalogue?category=${cat.id}`}
                        onClick={onClose}
                        className="group p-2.5 rounded-[14px] border border-[#EDEDF0] hover:border-slate-300 hover:shadow-xs transition-all bg-white flex flex-col justify-between cursor-pointer"
                      >
                        <div className="w-full h-[76px] rounded-lg bg-[#F5F5F7] mb-2 flex items-center justify-center p-2 overflow-hidden relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cat.coverImageUrl || cat.image || `/images/products/cat-${cat.id}.png`}
                            alt={cat.name}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = "none";
                              const fb = (e.currentTarget.parentElement?.querySelector(".cat-icon-fb") as HTMLElement);
                              if (fb) fb.style.display = "flex";
                            }}
                          />
                          <div className="cat-icon-fb hidden w-full h-full items-center justify-center text-slate-400">
                            {cat.id === "cctv-cameras" && <Camera className="w-6 h-6" />}
                            {cat.id === "dvr-nvr" && <HardDrive className="w-6 h-6" />}
                            {cat.id === "networking-poe" && <Network className="w-6 h-6" />}
                            {cat.id === "cables" && <Layers className="w-6 h-6" />}
                            {cat.id === "network-racks" && <Shield className="w-6 h-6" />}
                            {cat.id === "power-accessories" && <Zap className="w-6 h-6" />}
                          </div>
                        </div>
                        <div>
                          <div className="text-[13.5px] font-bold text-slate-900 group-hover:text-unitech-red transition-colors line-clamp-1">
                            {cat.name}
                          </div>
                          <div className="font-mono text-[11px] text-[#6E6E78] font-medium mt-0.5">
                            {cat.count} products
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Empty State Footer Bar */}
              <div className="p-3 sm:px-6 border-t border-[#EDEDF0] bg-[#FAFAFB] flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-600">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/kit-builder"
                    onClick={onClose}
                    className="flex items-center gap-2 hover:text-unitech-red transition-colors"
                  >
                    <div className="w-8 h-8 rounded-[9px] bg-[#F2F2F4] flex items-center justify-center text-[#E3141B]">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <span>Kit Builder</span>
                  </Link>

                  <a
                    href="/downloads/unitech-2026-master-catalog.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-unitech-red transition-colors"
                  >
                    <div className="w-8 h-8 rounded-[9px] bg-[#F2F2F4] flex items-center justify-center text-[#E3141B]">
                      <Download className="w-4 h-4" />
                    </div>
                    <span>Download catalogue</span>
                  </a>

                  <a
                    href={`https://wa.me/918700317239?text=${encodeURIComponent(
                      "Hi Unitech Sales Desk, I am looking for surveillance hardware."
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-emerald-700 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-[9px] bg-[#F2F2F4] flex items-center justify-center text-emerald-600">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <span>Ask on WhatsApp</span>
                  </a>
                </div>

                <div className="text-[#5F6368] flex items-center gap-1.5 font-medium">
                  <span>Tip: press</span>
                  <kbd className="font-mono text-[11px] font-bold text-[#5F6368] bg-white border border-[#E4E4E8] shadow-[0_1px_0_1px_#E4E4E8] rounded-[5px] px-1.5 py-0.5">
                    /
                  </kbd>
                  <span>anywhere to search</span>
                </div>
              </div>
            </div>
          )}

          {/* 3.3 TYPING STATE (Search Results) */}
          {query.trim() && results && results.total > 0 && (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-5">
                {/* Left Column (7 cols): Products List */}
                <div
                  id="smart-search-results"
                  role="listbox"
                  className="lg:col-span-7 space-y-1.5"
                >
                  <div className="text-[10.5px] font-mono font-bold tracking-[0.12em] text-[#6E6E78] uppercase mb-2">
                    Products · {results.totalProductMatches} matches
                  </div>

                  {results.products.map((item, idx) => {
                    const isActive = idx === activeIndex;
                    return (
                      <div
                        key={item.id}
                        role="option"
                        aria-selected={isActive}
                        onClick={() => handleSelectProduct(item.slug, item.name)}
                        className={`group flex items-center justify-between p-2.5 rounded-[12px] transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#FFF1F1] ring-1 ring-red-200"
                            : "hover:bg-[#FFF1F1]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* 60x54 Grey Image Tile */}
                          <div className="w-[60px] h-[54px] rounded-[10px] bg-[#F5F5F7] p-1 flex items-center justify-center shrink-0 border border-slate-200/50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="max-h-full max-w-full object-contain mix-blend-multiply"
                            />
                          </div>

                          {/* Name & Model Info */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-[14.5px] font-semibold text-slate-900 group-hover:text-unitech-red transition-colors truncate">
                                {renderHighlightedText(item.name, query)}
                              </h4>
                              {item.isExactModel && (
                                <span className="shrink-0 text-[10px] font-bold text-white bg-[#E3141B] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Exact model
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[11px] text-[#6E6E78] truncate mt-0.5">
                              {item.modelCode} · {item.categoryLabel || item.category}
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Price & Stock Status */}
                        <div className="text-right shrink-0 pl-3">
                          <div className="text-[14.5px] font-bold text-slate-900">
                            {formatINR(item.price)}
                            <span className="text-[10px] font-normal text-slate-500 ml-1">
                              + GST
                            </span>
                          </div>
                          <div className="text-[11px] font-bold mt-0.5">
                            {item.stockQuantity > 20 ? (
                              <span className="text-[#05603A]">In stock</span>
                            ) : item.stockQuantity > 0 ? (
                              <span className="text-[#B26A00]">Low stock</span>
                            ) : (
                              <span className="text-[#8A8A93]">Out of stock</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Column (5 cols): Categories, Series, Documents */}
                <div className="lg:col-span-5 space-y-5 border-l border-[#EDEDF0] lg:pl-6">
                  {results.categories.length > 0 && (
                    <div>
                      <div className="text-[10.5px] font-mono font-bold tracking-[0.12em] text-[#6E6E78] uppercase mb-2.5">
                        Categories
                      </div>
                      <div className="space-y-1.5">
                        {results.categories.map((cat) => (
                          <Link
                            key={cat.id}
                            href={cat.linkUrl}
                            onClick={onClose}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-[42px] h-[42px] rounded-lg bg-[#F5F5F7] p-1 flex items-center justify-center shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={cat.imageUrl}
                                  alt={cat.name}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = "/images/products/cat-cctv.png";
                                  }}
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>
                              <span className="text-[13.5px] font-bold text-slate-900">
                                {cat.name}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] text-[#6E6E78] bg-slate-100 px-2 py-0.5 rounded-full">
                              {cat.count}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.series.length > 0 && (
                    <div>
                      <div className="text-[10.5px] font-mono font-bold tracking-[0.12em] text-[#6E6E78] uppercase mb-2">
                        Series
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {results.series.map((s, sIdx) => (
                          <Link
                            key={sIdx}
                            href={s.linkUrl}
                            onClick={onClose}
                            className="px-3 py-1.5 rounded-full border border-[#E4E4E8] bg-white hover:border-[#111114] text-xs font-semibold text-slate-800 transition-colors"
                          >
                            {s.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.documents.length > 0 && (
                    <div>
                      <div className="text-[10.5px] font-mono font-bold tracking-[0.12em] text-[#6E6E78] uppercase mb-2.5">
                        Documents
                      </div>
                      <div className="space-y-2">
                        {results.documents.map((doc, dIdx) => (
                          <a
                            key={dIdx}
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#FFF1F1] transition-colors group"
                          >
                            <div className="w-[38px] h-[38px] rounded-lg bg-[#FFF1F1] text-[#E3141B] flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13.5px] font-bold text-slate-900 group-hover:text-unitech-red truncate">
                                {doc.model} datasheet
                              </div>
                              <div className="text-[12px] text-[#5F6368] truncate">
                                {doc.productName} · PDF
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Typing State Footer Bar */}
              <div className="p-3 sm:px-6 border-t border-[#EDEDF0] bg-[#FAFAFB] flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => handleNavigateToCatalogue(query)}
                  className="text-[14px] font-bold text-[#111114] hover:text-[#E3141B] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>
                    See all {results.total} results for &ldquo;{query}&rdquo;
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-[#5F6368] flex items-center gap-2 text-xs font-medium">
                  <span className="flex items-center gap-1">
                    <kbd className="font-mono text-[11px] font-bold text-[#5F6368] bg-white border border-[#E4E4E8] shadow-[0_1px_0_1px_#E4E4E8] rounded-[5px] px-1 py-0.5">
                      ↑
                    </kbd>
                    <kbd className="font-mono text-[11px] font-bold text-[#5F6368] bg-white border border-[#E4E4E8] shadow-[0_1px_0_1px_#E4E4E8] rounded-[5px] px-1 py-0.5">
                      ↓
                    </kbd>
                    navigate
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <kbd className="font-mono text-[11px] font-bold text-[#5F6368] bg-white border border-[#E4E4E8] shadow-[0_1px_0_1px_#E4E4E8] rounded-[5px] px-1.5 py-0.5">
                      Enter
                    </kbd>
                    open
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <kbd className="font-mono text-[11px] font-bold text-[#5F6368] bg-white border border-[#E4E4E8] shadow-[0_1px_0_1px_#E4E4E8] rounded-[5px] px-1.5 py-0.5">
                      Esc
                    </kbd>
                    close
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 3.4 NO RESULTS STATE */}
          {query.trim() && !isLoading && results && results.total === 0 && (
            <div className="text-center p-9 sm:p-12 space-y-4 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-full bg-[#F5F5F7] text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6 stroke-[2]" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  No results for &ldquo;{query}&rdquo;
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Check the spelling, or try a model number like UTIPBCP-4101.
                </p>
              </div>

              <div className="pt-2">
                <div className="text-[10.5px] font-mono font-bold tracking-[0.12em] text-[#6E6E78] uppercase mb-2">
                  Try Popular Terms
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {popularChips.slice(0, 5).map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => handleChipClick(chip)}
                      className="px-3 py-1 rounded-full border border-slate-200 bg-white hover:border-slate-800 text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3">
                <a
                  href={`https://wa.me/918700317239?text=${encodeURIComponent(
                    `Hi, I'm looking for: ${query}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E3141B] hover:bg-unitech-darkred text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Can&apos;t find it? Ask our team on WhatsApp</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* MOBILE FULL-SCREEN PANEL (< 768px)                            */}
      {/* ============================================================= */}
      <div
        className="md:hidden fixed inset-0 bg-white z-[1001] flex flex-col animate-in fade-in duration-200"
      >
        {/* Mobile Top Bar */}
        <div className="p-3 border-b border-[#EDEDF0] flex items-center gap-2 bg-white">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className="w-11 h-11 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          <div className="flex-1 min-h-[46px] px-3.5 rounded-[14px] border-2 border-[#E3141B] flex items-center gap-2 bg-white">
            <Search className="w-4 h-4 text-[#E3141B] stroke-[2.2] shrink-0" />
            <input
              ref={mobileInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search products, model codes…"
              className="w-full text-[16px] font-semibold text-[#111114] placeholder:text-slate-400 focus:outline-none bg-transparent"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults(null);
                }}
                className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!query.trim() && (
            <div className="space-y-6">
              <div>
                <div className="text-[10px] font-mono font-bold tracking-[0.12em] text-[#6E6E78] uppercase mb-2">
                  Popular Searches
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {popularChips.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => handleChipClick(chip)}
                      className="px-3 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-1.5 active:bg-slate-100 cursor-pointer"
                    >
                      <TrendingUp className="w-3 h-3 text-[#E3141B]" />
                      <span>{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono font-bold tracking-[0.12em] text-[#6E6E78] uppercase mb-2">
                  Categories
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {categories.filter((c) => c.isActive).map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/catalogue?category=${cat.id}`}
                      onClick={onClose}
                      className="p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between cursor-pointer"
                    >
                      <div className="h-16 rounded-lg bg-slate-100 flex items-center justify-center p-1 mb-1.5 relative overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cat.coverImageUrl || cat.image || `/images/products/cat-${cat.id}.png`}
                          alt={cat.name}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                            const fb = (e.currentTarget.parentElement?.querySelector(".cat-icon-fb-mob") as HTMLElement);
                            if (fb) fb.style.display = "flex";
                          }}
                        />
                        <div className="cat-icon-fb-mob hidden w-full h-full items-center justify-center text-slate-400">
                          {cat.id === "cctv-cameras" && <Camera className="w-5 h-5" />}
                          {cat.id === "dvr-nvr" && <HardDrive className="w-5 h-5" />}
                          {cat.id === "networking-poe" && <Network className="w-5 h-5" />}
                          {cat.id === "cables" && <Layers className="w-5 h-5" />}
                          {cat.id === "network-racks" && <Shield className="w-5 h-5" />}
                          {cat.id === "power-accessories" && <Zap className="w-5 h-5" />}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {cat.name}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {recentSearches.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono font-bold tracking-[0.12em] text-[#6E6E78] uppercase mb-1">
                    Recent Searches
                  </div>
                  <div className="divide-y divide-slate-100">
                    {recentSearches.map((term, rIdx) => (
                      <div
                        key={rIdx}
                        onClick={() => setQuery(term)}
                        className="py-2.5 flex items-center justify-between text-xs font-medium text-slate-800 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{term}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(e, term)}
                          className="p-1 text-slate-400 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {query.trim() && results && results.total > 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                {results.products.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectProduct(item.slug, item.name)}
                    className="p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 active:bg-red-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-14 h-12 rounded-lg bg-slate-100 p-1 flex items-center justify-center shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="max-h-full max-w-full object-contain mix-blend-multiply"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {renderHighlightedText(item.name, query)}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 truncate">
                          {item.modelCode}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-900">
                        {formatINR(item.price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleNavigateToCatalogue(query)}
                className="w-full py-3 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>See all {results.total} results</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {query.trim() && !isLoading && results && results.total === 0 && (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-5 h-5 stroke-[2]" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No results for &ldquo;{query}&rdquo;
              </h3>
              <p className="text-xs text-slate-500">
                Try checking spelling or search a model code.
              </p>
              <a
                href={`https://wa.me/918700317239?text=${encodeURIComponent(
                  `Hi, I'm looking for: ${query}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#E3141B] text-white text-xs font-bold mt-2"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Ask on WhatsApp</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

function renderHighlightedText(text: string, query: string) {
  if (!query.trim()) return text;
  const words = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (words.length === 0) return text;
  const longest = words[0];

  const escaped = longest
    .split("")
    .map((c) => c.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"))
    .join("[\\s\\-]*");
  const regex = new RegExp(`(${escaped})`, "i");

  const parts = text.split(regex);
  if (parts.length <= 1) return text;

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-[#FDE2E3] text-[#B10E16] font-bold rounded-[3px] px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
