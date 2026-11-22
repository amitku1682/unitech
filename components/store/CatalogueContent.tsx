"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Product, Category } from "@/lib/types";
import { formatINR } from "@/lib/utils";

import { Navbar } from "@/components/store/Navbar";
import { Footer } from "@/components/store/Footer";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import {
  Search,
  Check,
  ArrowRight,
  ShoppingBag,
  SlidersHorizontal,
  RotateCcw,
  ShieldCheck,
  Truck,
  CheckCircle2,
  X,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type PriceRangeKey = "ALL" | "UNDER_1500" | "1500_3000" | "3000_6000" | "ABOVE_6000";
type ConnectivityKey = "ALL" | "wired" | "wireless";

function getPaginationRange(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | string)[] = [];
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, "...", total);
  } else if (current >= total - 3) {
    pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total);
  }
  return pages;
}

export function CatalogueContent({ initialCategories = [], initialProducts = [] }: { initialCategories?: Category[]; initialProducts?: Product[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Dynamic Products State (synced with Admin portal)
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isLoading, setIsLoading] = useState<boolean>(initialProducts.length === 0);

  // Fetch live categories and products from PostgreSQL
  useEffect(() => {
    let mounted = true;

    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories", { cache: "no-store" });
        const json = await res.json();
        if (mounted && res.ok && json.success && Array.isArray(json.data)) {
          setCategories(json.data);
        }
      } catch (err) {
        console.warn("[Catalogue fetchCategories Error]:", err);
      }
    };

    const fetchLiveProducts = async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        const json = await res.json();
        if (mounted && res.ok && json.success && Array.isArray(json.data)) {
          setAllProducts(json.data);
          try {
            localStorage.setItem("unitech_admin_products", JSON.stringify(json.data));
          } catch {}
        }
      } catch (err) {
        console.warn("[Catalogue fetchLiveProducts Error]:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchCategories();
    fetchLiveProducts();

    const syncProducts = () => {
      try {
        const saved = localStorage.getItem("unitech_admin_products");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAllProducts(parsed);
          }
        }
      } catch {}
    };

    window.addEventListener("storage", syncProducts);
    return () => {
      mounted = false;
      window.removeEventListener("storage", syncProducts);
    };
  }, []);

  // Filter States
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [activeSeries, setActiveSeries] = useState<string>("ALL");
  const [connectivity, setConnectivity] = useState<ConnectivityKey>("ALL");
  const [priceRange, setPriceRange] = useState<PriceRangeKey>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"featured" | "price-low" | "price-high">("featured");

  // Pagination State (Strictly 8 products per page)
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Cart Feedback State
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  // Mobile Filter Drawer & View Mode State
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  // 1. SYNC URL PARAMS WITH FILTER STATE (Fixes Header Navigation)
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setActiveCategory(cat);
    } else {
      setActiveCategory("ALL");
    }

    const series = searchParams.get("series");
    if (series) {
      setActiveSeries(series);
    } else {
      setActiveSeries("ALL");
    }

    const conn = searchParams.get("connectivity") as ConnectivityKey;
    if (conn && (conn === "wired" || conn === "wireless")) {
      setConnectivity(conn);
    }

    const search = searchParams.get("q") || searchParams.get("search");
    if (search) {
      setSearchQuery(search);
    }
  }, [searchParams]);

  // Handle Category Selection
  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    setActiveSeries("ALL");
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (catId === "ALL") {
      params.delete("category");
    } else {
      params.set("category", catId);
    }
    params.delete("series");
    router.push(`/catalogue?${params.toString()}`);
  };

  // Handle Series Selection
  const handleSeriesChange = (seriesSlug: string) => {
    setActiveSeries(seriesSlug);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (seriesSlug === "ALL") {
      params.delete("series");
    } else {
      params.set("series", seriesSlug);
    }
    router.push(`/catalogue?${params.toString()}`);
  };

  // Reset All Filters
  const handleResetFilters = () => {
    setActiveCategory("ALL");
    setActiveSeries("ALL");
    setConnectivity("ALL");
    setPriceRange("ALL");
    setSearchQuery("");
    router.push("/catalogue");
  };

  const isFiltered =
    activeCategory !== "ALL" ||
    activeSeries !== "ALL" ||
    connectivity !== "ALL" ||
    priceRange !== "ALL" ||
    searchQuery.trim() !== "";

  // 2. APPLY STRICT FILTERS
  const filteredProducts = allProducts.filter((prod) => {
    // Category Filter
    const matchesCat = activeCategory === "ALL" || prod.category === activeCategory;

    // Connectivity Filter (Wired / Wireless)
    const prodConnectivity = prod.connectivity || "wired";
    const matchesConn = connectivity === "ALL" || prodConnectivity === connectivity;

    // Price Range Filter
    let matchesPrice = true;
    if (priceRange === "UNDER_1500") {
      matchesPrice = prod.price < 1500;
    } else if (priceRange === "1500_3000") {
      matchesPrice = prod.price >= 1500 && prod.price <= 3000;
    } else if (priceRange === "3000_6000") {
      matchesPrice = prod.price > 3000 && prod.price <= 6000;
    } else if (priceRange === "ABOVE_6000") {
      matchesPrice = prod.price > 6000;
    }

    // Series Filter
    let matchesSeries = true;
    if (activeSeries !== "ALL") {
      const sLower = activeSeries.toLowerCase();
      matchesSeries =
        (Boolean(prod.series) && prod.series?.toLowerCase() === sLower) ||
        (prod.specs?.["Series"] && prod.specs["Series"].toLowerCase() === sLower) ||
        prod.name.toLowerCase().includes(sLower) ||
        (prod.highlights && prod.highlights.some((h) => h.toLowerCase().includes(sLower))) ||
        (prod.specs && Object.values(prod.specs).some((v) => v.toLowerCase().includes(sLower)));
    }

    // Search Query Filter
    let matchesSearch = true;
    if (searchQuery.trim() !== "") {
      const sTokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
      const catObj = categories.find((c) => c.id === prod.category);
      const catFullName = catObj ? catObj.name : "";
      const catDesc = catObj ? (catObj.description || "") : "";
      const specsText = prod.specs ? Object.values(prod.specs).join(" ") : "";
      const highlightsText = Array.isArray(prod.highlights) ? prod.highlights.join(" ") : "";
      const pCombined = `${prod.name} ${prod.modelCode} ${prod.category} ${prod.categoryLabel} ${catFullName} ${catDesc} ${specsText} ${highlightsText}`.toLowerCase();
      const pClean = pCombined.replace(/[\s\-_.,\/]+/g, "");

      matchesSearch = sTokens.every((t) => {
        if (pCombined.includes(t)) return true;
        const tClean = t.replace(/[\s\-_.,\/]+/g, "");
        if (tClean.length >= 2 && pClean.includes(tClean)) return true;
        const subWords = t.split(/[\-_]+/).filter(Boolean);
        if (subWords.length > 1) {
          return subWords.every(
            (sub) => pCombined.includes(sub) || pClean.includes(sub.replace(/[\s\-_.,\/]+/g, ""))
          );
        }
        return false;
      });
    }

    return matchesCat && matchesSeries && matchesConn && matchesPrice && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    return 0; // "featured" maintains initial order
  });

  // Reset pagination to Page 1 when any filter or query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, activeSeries, connectivity, priceRange, searchQuery, sortBy]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (typeof window !== "undefined") {
      const topAnchor = document.getElementById("catalog-products-top");
      if (topAnchor) {
        topAnchor.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 120, behavior: "smooth" });
      }
    }
  };

  const handleAdd = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const productToAdd = allProducts.find((p) => p.id === id);
    if (productToAdd) {
      try {
        const raw = localStorage.getItem("unitech_cart");
        const cart = raw ? JSON.parse(raw) : [];
        const existingIdx = cart.findIndex(
          (item: any) => item.id === productToAdd.id || item.modelCode === productToAdd.modelCode
        );
        if (existingIdx !== -1) {
          cart[existingIdx].quantity += 1;
        } else {
          cart.push({
            id: productToAdd.id,
            name: productToAdd.name,
            modelCode: productToAdd.modelCode,
            price: productToAdd.price,
            quantity: 1,
            imageUrl: productToAdd.imageUrl || (productToAdd as any).image,
          });
        }
        localStorage.setItem("unitech_cart", JSON.stringify(cart));
        window.dispatchEvent(new Event("storage"));
      } catch (err) {
        console.error("[Catalogue handleAdd error]:", err);
      }
    }

    setAddedIds((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [id]: false }));
    }, 1800);
  };

  const getPlaceholderType = (cat: string) => {
    if (cat === "cctv-cameras") return "camera";
    if (cat === "dvr-nvr") return "dvr";
    if (cat === "cables") return "cable";
    if (cat === "network-racks") return "rack";
    return "camera";
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col">
      <Navbar />

      {/* Breadcrumb & Catalogue Header - Full Width Container */}
      <div className="bg-white border-b border-slate-200/90 py-6 sm:py-8">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-2">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Home
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold">Hardware Catalogue</span>
            {activeCategory !== "ALL" && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-unitech-red font-bold">
                  {categories.find((c) => c.id === activeCategory)?.name || activeCategory}
                </span>
                {activeSeries !== "ALL" && (
                  <>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-700 font-medium">
                      {categories.find((c) => c.id === activeCategory)?.series?.find((s) => s.slug === activeSeries)?.label || activeSeries}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">
            Surveillance & Networking Catalogue
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1.5 max-w-3xl leading-relaxed line-clamp-2 sm:line-clamp-none">
            Factory-direct production models. Transparent pricing with Indian 18% GST breakdown and
            verified installer wholesale tiers.
          </p>
        </div>
      </div>

      {/* Main 2-Column Catalogue Container - Full Width Edge-to-Edge */}
      <div className="w-full px-5 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 flex-1">
        {/* MOBILE SEARCH BOX & SINGLE CONTROL ROW (<900px) */}
        <div className="lg:hidden space-y-2.5 mb-5">
          {/* Search Box above */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by model code, spec, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400 shadow-2xs"
            />
          </div>

          {/* One control row only: Filter button + Sort select */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="flex-1 min-h-[44px] flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold active:scale-95 transition-all shadow-xs"
            >
              <SlidersHorizontal className="w-4 h-4 text-red-400" />
              <span>Filter Hardware</span>
              {isFiltered && (
                <span className="w-2 h-2 rounded-full bg-unitech-red animate-pulse" />
              )}
            </button>

            <div className="relative min-w-[130px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full min-h-[44px] bg-white border border-slate-200 text-xs text-slate-800 py-2.5 px-3 rounded-xl font-bold focus:outline-none shadow-xs"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low</option>
                <option value="price-high">Price: High</option>
              </select>
            </div>
          </div>
        </div>

        {/* MOBILE FILTER BOTTOM SHEET */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex items-end justify-center">
            <div
              className="fixed inset-0 bg-[#111114]/50 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileFilterOpen(false)}
            />
            <div className="relative w-full max-w-lg bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col justify-between overflow-y-auto p-5 z-10 animate-fade-in">
              <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-3 shrink-0" />
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2 font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
                    <SlidersHorizontal className="w-4 h-4 text-unitech-red" />
                    <span>Hardware Filters</span>
                  </div>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900"
                    aria-label="Close filters"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Filter 1: Product Categories */}
                <div className="space-y-3">
                  <div className="font-heading font-bold text-xs uppercase tracking-wider text-slate-900">
                    Product Categories
                  </div>
                  <div className="space-y-1 text-xs">
                    <button
                      onClick={() => {
                        handleCategoryChange("ALL");
                        setMobileFilterOpen(false);
                      }}
                      className={`w-full text-left px-3 min-h-[44px] transition-all flex items-center justify-between rounded-lg font-medium ${
                        activeCategory === "ALL" ? "bg-slate-900 text-white font-bold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>All Categories</span>
                      <span className="text-[10px] font-mono">{allProducts.length}</span>
                    </button>
                    {categories.filter((c) => c.isActive).map((cat) => {
                      const count = allProducts.filter((p) => p.category === cat.id).length;
                      const isSelected = activeCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            handleCategoryChange(cat.id);
                            setMobileFilterOpen(false);
                          }}
                          className={`w-full text-left px-3 min-h-[44px] transition-all flex items-center justify-between rounded-lg font-medium ${
                            isSelected ? "bg-slate-900 text-white font-bold" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="truncate pr-2">{cat.name}</span>
                          <span className="text-[10px] font-mono">{count}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Series Sub-Filter Pills for Mobile */}
                  {activeCategory !== "ALL" && (() => {
                    const currCat = categories.find((c) => c.id === activeCategory);
                    const seriesList = currCat?.series?.filter((s) => s.isActive) || [];
                    if (seriesList.length === 0) return null;
                    return (
                      <div className="pt-3 pb-1 border-t border-slate-100 mt-2 space-y-1.5">
                        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                          Series
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => {
                              handleSeriesChange("ALL");
                              setMobileFilterOpen(false);
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              activeSeries === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            All
                          </button>
                          {seriesList.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => {
                                handleSeriesChange(s.slug);
                                setMobileFilterOpen(false);
                              }}
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                activeSeries === s.slug ? "bg-unitech-red text-white" : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Filter 2: Connectivity */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="font-heading font-bold text-xs uppercase tracking-wider text-slate-900">
                    Connectivity
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {(["ALL", "wired", "wireless"] as ConnectivityKey[]).map((mode) => (
                      <label key={mode} className="flex items-center gap-2 cursor-pointer min-h-[40px]">
                        <input
                          type="radio"
                          name="mobile_conn"
                          checked={connectivity === mode}
                          onChange={() => setConnectivity(mode)}
                          className="accent-unitech-red w-4 h-4"
                        />
                        <span className="capitalize">{mode === "ALL" ? "All Connectivity" : mode}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Filter 3: Price Range */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="font-heading font-bold text-xs uppercase tracking-wider text-slate-900">
                    Price Range
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { key: "ALL", label: "All Prices" },
                      { key: "UNDER_1500", label: "Under ₹1,500" },
                      { key: "1500_3000", label: "₹1,500 – ₹3,000" },
                      { key: "3000_6000", label: "₹3,000 – ₹6,000" },
                      { key: "ABOVE_6000", label: "Above ₹6,000" },
                    ].map((rng) => (
                      <label key={rng.key} className="flex items-center gap-2 cursor-pointer min-h-[40px]">
                        <input
                          type="radio"
                          name="mobile_price"
                          checked={priceRange === rng.key}
                          onChange={() => setPriceRange(rng.key as PriceRangeKey)}
                          className="accent-unitech-red w-4 h-4"
                        />
                        <span>{rng.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Bottom Actions */}
              <div className="pt-4 mt-6 border-t border-slate-200 space-y-2 shrink-0">
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full min-h-[44px] py-3 bg-unitech-red text-white text-xs font-black rounded-xl shadow-md text-center cursor-pointer active:scale-98 transition-transform"
                >
                  Apply Filters ({filteredProducts.length} Products)
                </button>
                {isFiltered && (
                  <button
                    onClick={() => {
                      handleResetFilters();
                      setMobileFilterOpen(false);
                    }}
                    className="w-full min-h-[44px] py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl text-center cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
          {/* ========================================================= */}
          {/* LEFT SIDEBAR: STRICTLY 3 FILTERS (Desktop Only: lg:block)  */}
          {/* ========================================================= */}
          <aside className="hidden lg:block lg:col-span-3 xl:col-span-3 w-full bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6 lg:sticky lg:top-24">
            {/* Sidebar Title & Reset Button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
                <SlidersHorizontal className="w-4 h-4 text-slate-700" />
                <span>Filters</span>
              </div>
              {isFiltered && (
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] font-bold text-unitech-red hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              )}
            </div>

            {/* ---------------------------------------------------- */}
            {/* FILTER 1: PRODUCT CATEGORIES                         */}
            {/* ---------------------------------------------------- */}
            <div className="space-y-3">
              <div className="font-heading font-bold text-xs uppercase tracking-wider text-slate-900">
                Product Categories
              </div>
              <div className="space-y-1.5 text-xs">
                {/* All Products Option */}
                <button
                  onClick={() => handleCategoryChange("ALL")}
                  className={`w-full text-left px-2.5 py-1.5 transition-all flex items-center justify-between font-medium ${
                    activeCategory === "ALL"
                      ? "bg-slate-900 text-white font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>All Categories</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 font-mono ${
                      activeCategory === "ALL"
                        ? "bg-slate-800 text-slate-200"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {allProducts.length}
                  </span>
                </button>

                {/* Specific Category Options */}
                {categories.filter((c) => c.isActive).map((cat) => {
                  const count = allProducts.filter((p) => p.category === cat.id).length;
                  const isSelected = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`w-full text-left px-2.5 py-1.5 transition-all flex items-center justify-between font-medium ${
                        isSelected
                          ? "bg-slate-900 text-white font-bold"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate pr-2">{cat.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 font-mono ${
                          isSelected
                            ? "bg-slate-800 text-slate-200"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}

                {/* Series Sub-Filter Pills (When specific category is active) */}
                {activeCategory !== "ALL" && (() => {
                  const currCat = categories.find((c) => c.id === activeCategory);
                  const seriesList = currCat?.series?.filter((s) => s.isActive) || [];
                  if (seriesList.length === 0) return null;
                  return (
                    <div className="pt-3 pb-1 border-t border-slate-100 mt-2 space-y-1.5">
                      <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                        Series Tags
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => handleSeriesChange("ALL")}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                            activeSeries === "ALL"
                              ? "bg-slate-900 text-white font-bold"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          All
                        </button>
                        {seriesList.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => handleSeriesChange(s.slug)}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                              activeSeries === s.slug
                                ? "bg-unitech-red text-white font-bold"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* FILTER 2: CONNECTIVITY (Wired / Wireless)            */}
            {/* ---------------------------------------------------- */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="font-heading font-bold text-xs uppercase tracking-wider text-slate-900">
                Connectivity
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { id: "ALL", label: "All Connectivity" },
                  { id: "wired", label: "Wired (PoE & Coaxial)" },
                  { id: "wireless", label: "Wireless (Wi-Fi & 4G SIM)" },
                ].map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2.5 cursor-pointer text-slate-700 hover:text-slate-900 select-none"
                  >
                    <input
                      type="radio"
                      name="connectivity"
                      checked={connectivity === item.id}
                      onChange={() => setConnectivity(item.id as ConnectivityKey)}
                      className="w-4 h-4 text-unitech-red accent-unitech-red cursor-pointer"
                    />
                    <span className={connectivity === item.id ? "font-bold text-slate-900" : ""}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* FILTER 3: PRICE RANGE                                */}
            {/* ---------------------------------------------------- */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="font-heading font-bold text-xs uppercase tracking-wider text-slate-900">
                Price Range
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { id: "ALL", label: "All Prices" },
                  { id: "UNDER_1500", label: "Under ₹1,500" },
                  { id: "1500_3000", label: "₹1,500 – ₹3,000" },
                  { id: "3000_6000", label: "₹3,000 – ₹6,000" },
                  { id: "ABOVE_6000", label: "Above ₹6,000" },
                ].map((tier) => (
                  <label
                    key={tier.id}
                    className="flex items-center gap-2.5 cursor-pointer text-slate-700 hover:text-slate-900 select-none"
                  >
                    <input
                      type="radio"
                      name="priceRange"
                      checked={priceRange === tier.id}
                      onChange={() => setPriceRange(tier.id as PriceRangeKey)}
                      className="w-4 h-4 text-unitech-red accent-unitech-red cursor-pointer"
                    />
                    <span className={priceRange === tier.id ? "font-bold text-slate-900" : ""}>
                      {tier.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Direct Factory Assurances */}
            <div className="pt-4 border-t border-slate-200 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Genuine Factory Warranty</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Truck className="w-4 h-4 text-slate-700 shrink-0" />
                <span>Pan-India Direct Dispatch</span>
              </div>
            </div>
          </aside>

          {/* ========================================================= */}
          {/* RIGHT PRODUCT FEED: AMAZON-STYLE HORIZONTAL CARDS         */}
          {/* ========================================================= */}
          <main id="catalog-products-top" className="lg:col-span-9 xl:col-span-9 w-full space-y-5">
            {/* Top Toolbar: Search Bar, Results Count & Sorter (Desktop Only) */}
            <div className="hidden lg:flex bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-4.5 flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 shadow-xs">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by model code, spec, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
                />
              </div>

              {/* Counter & Sorter */}
              <div className="flex items-center justify-between sm:justify-end gap-3 text-xs sm:text-sm text-slate-600">
                <span className="font-semibold text-slate-800">
                  Showing{" "}
                  <span className="text-slate-900 font-black">
                    {totalItems > 0 ? `${startIndex + 1}–${endIndex}` : 0}
                  </span>{" "}
                  of <span className="text-slate-900 font-black">{totalItems}</span> products{" "}
                  {totalItems > 0 && (
                    <span className="text-slate-500 font-mono text-xs font-bold">
                      (Page {currentPage} of {totalPages})
                    </span>
                  )}
                </span>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 py-2 px-3 rounded-xl focus:outline-none font-bold"
                >
                  <option value="featured">Sort by: Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
              <div className="bg-white border border-slate-200 p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-black text-slate-900 text-base">
                  No products match the selected filters
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try clearing some filter options or searching for a different keyword or model
                  code.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold transition-all hover:bg-slate-800"
                >
                  Reset All Filters
                </button>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* 1. MOBILE 2-COLUMN PRODUCT GRID (CP PLUS STANDARD)   */}
            {/* ---------------------------------------------------- */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:hidden">
                {paginatedProducts.map((prod) => {
                  const isAdded = !!addedIds[prod.id];

                  return (
                    <div
                      key={`grid-${prod.id}`}
                      onClick={() => router.push(`/product/${prod.slug}`)}
                      className="bg-white border border-slate-200/90 rounded-xl p-2.5 flex flex-col justify-between shadow-xs hover:border-slate-400 transition-all cursor-pointer relative"
                    >
                      {/* Bestseller / Connectivity Badge */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-[#5F6368] truncate max-w-[110px]">
                          {prod.modelCode}
                        </span>
                        {prod.isBestseller ? (
                          <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-500 text-white shrink-0">
                            Hot
                          </span>
                        ) : (
                          <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-slate-50 border border-slate-200 text-slate-500 shrink-0">
                            {prod.connectivity === "wireless" ? "WiFi" : "PoE"}
                          </span>
                        )}
                      </div>

                      {/* Product Thumbnail */}
                      <div className="w-full aspect-square rounded-lg bg-slate-50 p-2 flex items-center justify-center mb-1.5 overflow-hidden">
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="max-h-full max-w-full object-contain drop-shadow-xs mix-blend-multiply"
                          />
                        ) : (
                          <PlaceholderImage
                            title={prod.placeholderLabel}
                            subtitle={prod.placeholderSubtext}
                            type={getPlaceholderType(prod.category)}
                            className="w-full h-full"
                          />
                        )}
                      </div>

                      {/* Title & Category */}
                      <div className="mb-2">
                        <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider truncate">
                          {prod.categoryLabel}
                        </div>
                        <h4 className="font-heading font-black text-xs text-slate-900 line-clamp-2 leading-snug mt-0.5">
                          {prod.name}
                        </h4>
                      </div>

                      {/* Pricing & Add Button */}
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <div className="flex items-baseline justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-heading font-black text-sm text-slate-950">
                              {formatINR(prod.price)}
                            </span>
                            {prod.mrp && prod.mrp > prod.price && (
                              <span className="text-[11px] text-slate-400 line-through">
                                {formatINR(prod.mrp)}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] sm:text-xs text-[#5F6368] font-mono font-bold">
                            +18% GST
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleAdd(prod.id, e)}
                          className={`w-full min-h-[44px] py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                            isAdded
                              ? "bg-emerald-600 text-white"
                              : "bg-unitech-red hover:bg-unitech-darkred text-white shadow-xs"
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Add to Cart</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* 2. HORIZONTAL PRODUCT CARDS (DESKTOP OR LIST VIEW)   */}
            {/* ---------------------------------------------------- */}
            <div className={`space-y-4 sm:space-y-5 ${viewMode === "grid" ? "hidden lg:block" : "block"}`}>
              {paginatedProducts.map((prod) => {
                const isAdded = !!addedIds[prod.id];
                const gstPrice = Math.round(prod.price * 1.18);
                const discountPercent = Math.round(((prod.mrp - prod.price) / prod.mrp) * 100);

                return (
                  <div
                    key={prod.id}
                    onClick={() => router.push(`/product/${prod.slug}`)}
                    className="bg-white border border-slate-200/90 rounded-2xl hover:border-slate-400/90 transition-all shadow-xs hover:shadow-xl flex flex-col md:flex-row items-stretch overflow-hidden group cursor-pointer hover:-translate-y-0.5"
                  >
                    {/* LEFT COLUMN: Hardware Image / Visual Showcase */}
                    <div className="w-full md:w-64 lg:w-72 xl:w-80 shrink-0 bg-slate-50/50 p-4 sm:p-6 flex items-center justify-center relative border-b md:border-b-0 md:border-r border-slate-200/70 overflow-hidden">
                      {/* Bestseller / New Badge */}
                      {prod.isBestseller && (
                        <div className="absolute top-3.5 left-3.5 z-10 bg-amber-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-2xs">
                          Bestseller
                        </div>
                      )}
                      {prod.isNew && !prod.isBestseller && (
                        <div className="absolute top-3.5 left-3.5 z-10 bg-unitech-red text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-2xs">
                          New Model
                        </div>
                      )}

                      {/* Connectivity Badge (Top-Right) */}
                      <div className="absolute top-3.5 right-3.5 z-10 text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
                        {prod.connectivity === "wireless" ? "Wireless" : "Wired"}
                      </div>

                      {/* Product Visual Illustration - Fills Frame Properly without Compression */}
                      <div className="w-full h-48 sm:h-56 flex items-center justify-center p-2 group-hover:scale-105 transition-transform duration-300">
                        {prod.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="max-h-full max-w-full w-auto h-auto object-contain drop-shadow-sm mix-blend-multiply"
                            loading="lazy"
                          />
                        ) : (
                          <PlaceholderImage
                            title={prod.modelCode}
                            type={getPlaceholderType(prod.category)}
                            className="w-full h-full border-none shadow-none bg-transparent"
                          />
                        )}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Enhanced Crisp Detail Format */}
                    <div className="flex-1 p-5 sm:p-6 lg:p-7 flex flex-col justify-between space-y-4">
                      {/* Top Header & Highlights */}
                      <div className="space-y-2">
                        {/* Category Label */}
                        <div className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
                          {prod.categoryLabel}
                        </div>

                        {/* Title (Linked to PDP) */}
                        <Link
                          href={`/product/${prod.slug}`}
                          className="font-heading font-black text-lg sm:text-xl lg:text-[22px] text-slate-950 group-hover:text-unitech-red transition-colors leading-snug block"
                        >
                          {prod.name}
                        </Link>

                        {/* Stock & Pan-India Dispatch Notice */}
                        <div className="flex items-center gap-2 text-xs sm:text-[13px] font-semibold text-emerald-700">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>In Stock · Direct Factory Dispatch in 24-48 hrs</span>
                        </div>

                        {/* Crisp Bullet Specifications */}
                        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-600">
                          {prod.highlights.slice(0, 4).map((highlight, hIdx) => (
                            <div key={hIdx} className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="truncate">{highlight}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Pricing & Action Section */}
                      <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        {/* Transparent Price Structure */}
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-heading font-black text-2xl sm:text-3xl text-slate-950">
                              {formatINR(prod.price)}
                            </span>
                            <span className="text-xs sm:text-sm text-slate-500 font-semibold">
                              + 18% GST ({formatINR(gstPrice)} incl. tax)
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 mt-1">
                            <span>
                              M.R.P.: <span className="line-through font-bold text-slate-500">{formatINR(prod.mrp)}</span>
                            </span>
                            <span className="text-unitech-red font-black font-mono">
                              ({discountPercent}% off)
                            </span>
                          </div>

                          {/* Dealer & Wholesale Tier Margins */}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <div className="text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200/90 px-2.5 py-1.5 rounded-xl inline-flex items-center gap-1.5 shadow-2xs">
                              <span className="text-slate-600 font-semibold text-[11px]">10-49 Units:</span>
                              <span className="font-bold text-slate-900">
                                {formatINR(prod.tier2Price || Math.round(prod.price * 0.85))}
                              </span>
                            </div>
                            <div className="text-xs font-bold text-emerald-800 bg-emerald-50/90 border border-emerald-300 px-2.5 py-1.5 rounded-xl inline-flex items-center gap-1.5 shadow-2xs">
                              <span className="text-emerald-700 font-semibold text-[11px]">Dealer (50+):</span>
                              <span className="font-black text-emerald-950">
                                {formatINR(prod.dealerPrice || Math.round(prod.price * 0.75))}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            onClick={(e) => handleAdd(prod.id, e)}
                            className={`px-6 py-3 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-xs active:scale-95 ${
                              isAdded
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-900 hover:bg-unitech-red text-white"
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>Added!</span>
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="w-4 h-4" />
                                <span>Add to Cart</span>
                              </>
                            )}
                          </button>

                          <Link
                            href={`/product/${prod.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-5 py-3 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs"
                          >
                            <span>View Full Specs</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3. PAGINATION CONTROLS BAR (STRICTLY 8 PRODUCTS PER PAGE) */}
            {totalPages > 1 && (
              <div className="pt-6 pb-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 mt-6">
                <div className="text-xs text-slate-600 font-medium text-center sm:text-left">
                  Showing <span className="font-bold text-slate-900">{startIndex + 1}–{endIndex}</span> of{" "}
                  <span className="font-bold text-slate-900">{totalItems}</span> products
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5 select-none flex-wrap justify-center">
                  {/* Previous Page Button */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 text-xs font-bold rounded-lg border flex items-center gap-1 transition-all ${
                      currentPage === 1
                        ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                        : "bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-2xs hover:text-unitech-red active:scale-95 cursor-pointer"
                    }`}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Prev</span>
                  </button>

                  {/* Page Numbers */}
                  {getPaginationRange(currentPage, totalPages).map((p, pIdx) => {
                    if (p === "...") {
                      return (
                        <span
                          key={`ellipsis-${pIdx}`}
                          className="px-2 py-2 text-xs text-slate-400 font-mono"
                        >
                          …
                        </span>
                      );
                    }
                    const pageNum = Number(p);
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                          isActive
                            ? "bg-unitech-red text-white border border-unitech-red shadow-xs font-black"
                            : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 hover:text-slate-900"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {/* Next Page Button */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 text-xs font-bold rounded-lg border flex items-center gap-1 transition-all ${
                      currentPage === totalPages
                        ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                        : "bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-2xs hover:text-unitech-red active:scale-95 cursor-pointer"
                    }`}
                    aria-label="Next page"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
