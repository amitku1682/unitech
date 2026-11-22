"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UnitechLogo } from "@/components/brand/UnitechLogo";
import { HeaderSearchButton } from "@/components/store/HeaderSearchButton";
import { SearchPanel } from "@/components/store/SearchPanel";
import { MegaMenu } from "@/components/store/MegaMenu";
import { Product, Category, AnnouncementBanner, TickerSettings } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import {
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Phone,
  MessageCircle,
  Search,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useSocialLinks } from "@/lib/hooks/useSocialLinks";

interface NavbarProps {
  cartCount?: number;
}

export function Navbar({ cartCount = 0 }: NavbarProps) {
  const { getLink } = useSocialLinks();
  const whatsappLink = getLink("whatsapp");

  const [liveCartCount, setLiveCartCount] = useState(cartCount);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoryDetail, setMobileCategoryDetail] = useState<string | null>(null);

  const [activeMegaMenu, setActiveMegaMenu] = useState<"products" | null>(null);
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [headerBottom, setHeaderBottom] = useState<number>(80);

  const [mounted, setMounted] = useState<boolean>(false);
  const headerRef = useRef<HTMLElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCloseMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileCategoryDetail(null);
    mobileMenuButtonRef.current?.focus();
  };

  const [tickerSettings, setTickerSettings] = useState<TickerSettings | null>(null);
  const [tickerMessages, setTickerMessages] = useState<AnnouncementBanner[]>([]);
  const [bulletinIndex, setBulletinIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [mobileOffer, setMobileOffer] = useState<{
    badge: string;
    discountText: string;
    description: string;
    ctaText: string;
    ctaLink: string;
  } | null>(null);

  // Close menus on route change
  useEffect(() => {
    setActiveMegaMenu(null);
    setMobileMenuOpen(false);
    setMobileCategoryDetail(null);
  }, [pathname]);

  // Lock body scroll, manage focus, and handle Escape when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      const focusTimer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setMobileMenuOpen(false);
          setMobileCategoryDetail(null);
          mobileMenuButtonRef.current?.focus();
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        clearTimeout(focusTimer);
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Measure header bottom position
  const updateHeaderBottom = () => {
    if (headerRef.current) {
      setHeaderBottom(Math.round(headerRef.current.getBoundingClientRect().bottom));
    }
  };

  useEffect(() => {
    updateHeaderBottom();
    window.addEventListener("scroll", updateHeaderBottom, { passive: true });
    window.addEventListener("resize", updateHeaderBottom);
    return () => {
      window.removeEventListener("scroll", updateHeaderBottom);
      window.removeEventListener("resize", updateHeaderBottom);
    };
  }, []);

  // Fetch live products for mega menu
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((json) => {
        const list = json.data && Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        if (list.length > 0) {
          setProducts(list);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch live categories for mega menu & mobile drawer
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setCategories(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingCategories(false));
  }, []);

  // Read cart count
  useEffect(() => {
    const readCart = () => {
      try {
        const raw = localStorage.getItem("unitech_cart");
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const count = list.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
            setLiveCartCount(count);
            return;
          }
        }
      } catch {}
      setLiveCartCount(cartCount);
    };

    readCart();
    window.addEventListener("storage", readCart);
    return () => window.removeEventListener("storage", readCart);
  }, [cartCount]);

  // Fetch active sale offer for mobile drawer
  useEffect(() => {
    let isMounted = true;
    async function loadSale() {
      try {
        // 1. Try active flash sale
        const fsRes = await fetch("/api/flash-sale/active");
        if (fsRes.ok && fsRes.status === 200) {
          const fsData = await fsRes.json();
          if (fsData && fsData.success && fsData.data && fsData.data.isEnabled) {
            const discountPct =
              fsData.discount ||
              Math.round(((fsData.data.mrp - fsData.data.price) / fsData.data.mrp) * 100);
            if (isMounted) {
              setMobileOffer({
                badge: fsData.data.badge || "LIMITED TIME OFFER",
                discountText: `${discountPct}% OFF`,
                description: fsData.data.title || "Direct factory wholesale rates.",
                ctaText: fsData.data.ctaLabel || "Shop the offer →",
                ctaLink: fsData.data.linkedProductId
                  ? `/product/${fsData.data.linkedProductId}`
                  : "/catalogue",
              });
              return;
            }
          }
        }

        // 2. Try Hero Slide 4 Product Sale
        const psRes = await fetch("/api/hero-product-sale");
        if (psRes.ok) {
          const psJson = await psRes.json();
          const ps = psJson.data;
          if (ps && ps.enabled) {
            const pct =
              ps.discountPercent ||
              Math.round(((ps.mrp - ps.offerPrice) / ps.mrp) * 100);
            if (isMounted) {
              setMobileOffer({
                badge: ps.badgeText || "SPECIAL DEAL",
                discountText: `${pct}% OFF`,
                description: ps.productName || ps.tagline || "Direct factory wholesale dispatch.",
                ctaText: ps.primaryCta?.label || "Shop the offer →",
                ctaLink: ps.primaryCta?.url || "/catalogue",
              });
              return;
            }
          }
        }

        if (isMounted) setMobileOffer(null);
      } catch {
        if (isMounted) setMobileOffer(null);
      }
    }
    loadSale();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch live ticker settings & messages
  useEffect(() => {
    fetch("/api/ticker")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          if (json.settings) setTickerSettings(json.settings);
          if (Array.isArray(json.messages)) setTickerMessages(json.messages);
        }
      })
      .catch((err) => console.warn("[Navbar fetch ticker error]:", err));
  }, []);

  const isTickerEnabled = tickerSettings?.isEnabled !== false;
  const rotationSeconds = tickerSettings?.rotationSeconds || 4;
  const pauseOnHover = tickerSettings?.pauseOnHover !== false;
  const tickerAnimation = tickerSettings?.animation || "fade";

  // Auto-cycle live news bulletins
  useEffect(() => {
    if (isPaused || tickerMessages.length <= 1 || !isTickerEnabled) return;
    const interval = setInterval(() => {
      setBulletinIndex((prev) => (prev + 1) % tickerMessages.length);
    }, rotationSeconds * 1000);
    return () => clearInterval(interval);
  }, [isPaused, tickerMessages.length, isTickerEnabled, rotationSeconds]);

  const currentBulletin = tickerMessages.length > 0 ? tickerMessages[bulletinIndex % tickerMessages.length] : null;

  const showPlantDesk = tickerSettings?.showPlantDesk !== false;
  const plantDeskText = tickerSettings?.plantDeskText || "Sahibabad Plant Direct Supply";
  const showPhone = tickerSettings?.showPhone !== false && Boolean(tickerSettings?.phoneDisplay);
  const phoneDisplay = tickerSettings?.phoneDisplay || "+91 87003 17239";
  const phoneTel = tickerSettings?.phoneTel || "+918700317239";
  const showWhatsapp = tickerSettings?.showWhatsapp !== false && Boolean(whatsappLink?.url);
  const whatsappUrl = whatsappLink?.url
    ? whatsappLink.url.includes("?")
      ? whatsappLink.url
      : `${whatsappLink.url}?text=${encodeURIComponent(
          "🏭 *UNITECH FACTORY SALES DESK INQUIRY*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nHi Unitech Sales Desk, I am reaching out to inquire about wholesale B2B pricing, ready stock, and dealer rates."
        )}`
    : "";

  // Hover intent logic
  const handleNavMouseEnter = (type: "products") => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    hoverTimeoutRef.current = setTimeout(() => {
      updateHeaderBottom();
      setActiveMegaMenu(type);
    }, 150);
  };

  const handleNavMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    leaveTimeoutRef.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 250);
  };

  const handleMenuMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  };

  const handleMenuMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 250);
  };

  const toggleMegaMenu = (type: "products") => {
    updateHeaderBottom();
    setActiveMegaMenu((prev) => (prev === type ? null : type));
  };

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 bg-white/98 backdrop-blur-md border-b border-slate-200/90 shadow-[0_4px_16px_-4px_rgba(15,23,42,0.06)] transition-all"
    >
      {/* 1. Top Utility Strip with Live Animated News Ticker */}
      {isTickerEnabled && tickerMessages.length > 0 && currentBulletin && (
        <div className="bg-slate-50 border-b border-slate-200/80 text-xs text-slate-700 py-1.5 sm:py-2 px-4 sm:px-6 lg:px-8 xl:px-10">
          <style jsx>{`
            @keyframes tickerFade {
              0% { opacity: 0; transform: translateY(2px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            @keyframes tickerSlideUp {
              0% { opacity: 0; transform: translateY(100%); }
              100% { opacity: 1; transform: translateY(0); }
            }
            @keyframes tickerMarquee {
              0% { transform: translateX(100%); }
              100% { transform: translateX(-100%); }
            }
            .ticker-anim-fade {
              animation: tickerFade 0.4s ease-out;
            }
            .ticker-anim-slide-up {
              animation: tickerSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .ticker-anim-marquee {
              animation: tickerMarquee 20s linear infinite;
              white-space: nowrap;
              display: inline-block;
            }
          `}</style>
          <div className="w-full flex items-center justify-between gap-3 sm:gap-6">
            {/* Left: Animated Live News Ticker */}
            <div
              className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0 cursor-pointer select-none"
              onClick={() => setBulletinIndex((prev) => (prev + 1) % tickerMessages.length)}
              onMouseEnter={() => pauseOnHover && setIsPaused(true)}
              onMouseLeave={() => pauseOnHover && setIsPaused(false)}
              onTouchStart={() => pauseOnHover && setIsPaused(true)}
              onTouchEnd={() => setTimeout(() => setIsPaused(false), 3000)}
              title="Click or tap to view next update"
            >
              <div className="flex items-center gap-1.5 shrink-0 self-center">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-unitech-red animate-pulse" />
                <span className="text-[9px] sm:text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-unitech-red/10 text-unitech-red border border-red-200 shadow-2xs whitespace-nowrap">
                  {currentBulletin.badgeText || "NOTICE"}
                </span>
              </div>

              <div className="min-w-0 flex-1 overflow-hidden text-slate-800">
                {currentBulletin.ctaLink ? (
                  <Link
                    href={currentBulletin.ctaLink}
                    key={bulletinIndex}
                    className={`font-semibold text-[11px] sm:text-xs leading-snug sm:leading-normal text-slate-800 hover:text-unitech-red sm:truncate transition-all line-clamp-2 sm:line-clamp-1 ${
                      tickerAnimation === "slide-up"
                        ? "ticker-anim-slide-up"
                        : tickerAnimation === "marquee"
                        ? "ticker-anim-marquee"
                        : "ticker-anim-fade"
                    }`}
                  >
                    {currentBulletin.title}
                  </Link>
                ) : (
                  <p
                    key={bulletinIndex}
                    className={`font-semibold text-[11px] sm:text-xs leading-snug sm:leading-normal text-slate-800 sm:truncate transition-all line-clamp-2 sm:line-clamp-1 ${
                      tickerAnimation === "slide-up"
                        ? "ticker-anim-slide-up"
                        : tickerAnimation === "marquee"
                        ? "ticker-anim-marquee"
                        : "ticker-anim-fade"
                    }`}
                  >
                    {currentBulletin.title}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Direct Factory Helpline & WhatsApp Desk */}
            <div className="hidden sm:flex items-center gap-4 xl:gap-6 shrink-0 font-semibold text-slate-700">
              {showPlantDesk && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{plantDeskText}</span>
                </div>
              )}

              {showPlantDesk && showPhone && <span className="text-slate-300">|</span>}

              {showPhone && (
                <a
                  href={`tel:${phoneTel}`}
                  className="hover:text-unitech-red flex items-center gap-1.5 font-black text-slate-950 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-unitech-red" />
                  <span>{phoneDisplay}</span>
                </a>
              )}

              {(showPlantDesk || showPhone) && showWhatsapp && <span className="text-slate-300">|</span>}

              {showWhatsapp && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-xs font-bold transition-colors"
                  title="Chat with Factory Sales Desk on WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{tickerSettings?.whatsappLabel || "WhatsApp"}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Navigation Bar */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-2 sm:py-2.5">
        <div className="w-full flex items-center justify-between gap-4 lg:gap-6 xl:gap-8">
          {/* Left Cluster: Logo + Navigation Links */}
          <div className="flex items-center gap-6 xl:gap-8 2xl:gap-10 shrink-0">
            <Link href="/" className="flex items-center shrink-0 group">
              <UnitechLogo theme="light" heightClass="h-16 sm:h-20 lg:h-[84px] xl:h-[88px]" />
            </Link>

            {/* Left-Center Navigation Links: Products ▾, Kit builder [NEW], About, Support, Dealers, Inquiry, Contact */}
            <nav className="hidden lg:flex items-center gap-4 xl:gap-6 2xl:gap-7 text-[13.5px] xl:text-sm font-bold text-slate-900 shrink-0 whitespace-nowrap">
              {/* Products Mega Menu Trigger */}
              <div
                className="relative h-full flex items-center"
                onMouseEnter={() => handleNavMouseEnter("products")}
                onMouseLeave={handleNavMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => toggleMegaMenu("products")}
                  aria-expanded={activeMegaMenu === "products"}
                  aria-controls="mega-menu-products"
                  className={`flex items-center gap-1.5 py-2.5 transition-colors cursor-pointer select-none relative ${
                    activeMegaMenu === "products"
                      ? "text-[#E3141B]"
                      : "text-slate-900 hover:text-[#E3141B]"
                  }`}
                >
                  <span>Products</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 stroke-[2.5] ${
                      activeMegaMenu === "products" ? "rotate-180 text-[#E3141B]" : "text-slate-700"
                    }`}
                  />
                  {activeMegaMenu === "products" && (
                    <span className="absolute -bottom-[9px] left-0 right-0 h-[2px] bg-[#E3141B]" />
                  )}
                </button>
              </div>

              {/* Kit Builder with Bold Red Pill Badge */}
              <Link
                href="/kit-builder"
                className="flex items-center gap-1.5 text-slate-900 hover:text-unitech-red transition-colors whitespace-nowrap"
              >
                <span>Kit builder</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-unitech-red text-white shadow-2xs">
                  New
                </span>
              </Link>

              <Link href="/about" className="text-slate-900 hover:text-unitech-red transition-colors whitespace-nowrap">
                About
              </Link>

              <Link href="/support" className="text-slate-900 hover:text-unitech-red transition-colors whitespace-nowrap">
                Support
              </Link>

              <Link href="/dealers" className="text-slate-900 hover:text-unitech-red transition-colors whitespace-nowrap">
                Dealers
              </Link>

              <Link href="/inquiry" className="text-slate-900 hover:text-unitech-red transition-colors whitespace-nowrap">
                Inquiry
              </Link>

              <Link href="/contact" className="text-slate-900 hover:text-unitech-red transition-colors whitespace-nowrap">
                Contact
              </Link>
            </nav>
          </div>

          {/* Right Cluster: Search Icon Button + Action Icons & Primary CTA Pill */}
          <div className="flex items-center gap-2 sm:gap-3 xl:gap-3.5 shrink-0 justify-end">
            {/* Header Search Icon Button */}
            <HeaderSearchButton
              ref={searchButtonRef}
              onClick={() => {
                setActiveMegaMenu(null);
                setSearchPanelOpen(true);
              }}
              isOpen={searchPanelOpen}
            />

            {/* Cart Icon */}
            <Link
              href="/cart"
              className="p-1.5 sm:p-2 rounded-full text-slate-800 hover:text-slate-950 hover:bg-slate-100 transition-colors relative"
              title="Quote Cart"
              aria-label="Quote Cart"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.25]" />
              {liveCartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-unitech-red text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                  {liveCartCount}
                </span>
              )}
            </Link>

            {/* Primary Red Pill CTA: Build your kit */}
            <Link
              href="/kit-builder"
              className="px-3 sm:px-4 lg:px-5 py-2 lg:py-2.5 rounded-full bg-unitech-red hover:bg-unitech-darkred text-white text-xs lg:text-sm font-extrabold transition-all shadow-[0_4px_14px_rgba(230,0,0,0.35)] hover:shadow-[0_6px_20px_rgba(230,0,0,0.45)] hover:-translate-y-0.5 flex items-center gap-1 active:scale-95 shrink-0 whitespace-nowrap"
            >
              <span>Build your kit</span>
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              ref={mobileMenuButtonRef}
              onClick={() => {
                if (mobileMenuOpen) {
                  handleCloseMobileMenu();
                } else {
                  setMobileMenuOpen(true);
                }
              }}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Full-Screen Mobile Drawer (< 1024px) rendered through Portal */}
      {mounted && mobileMenuOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="lg:hidden fixed inset-0 w-screen h-[100dvh] z-[99999] bg-white flex flex-col animate-fade-in"
          style={{ overscrollBehavior: "contain" }}
        >
          {/* Drawer Header (Fixed at top) */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white shrink-0">
            <Link href="/" onClick={handleCloseMobileMenu} className="flex items-center">
              <UnitechLogo theme="light" heightClass="h-12" />
            </Link>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={handleCloseMobileMenu}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 stroke-[2.25]" />
            </button>
          </div>

          {/* Drawer Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 overscroll-contain">
            {mobileCategoryDetail ? (
              /* Sub-screen: Category Drill-Down */
              (() => {
                const cat = categories.find((c) => c.id === mobileCategoryDetail) || categories[0] || {
                  id: "cctv-cameras",
                  name: "CCTV Cameras",
                  productCount: 0,
                  series: [],
                };
                const series =
                  cat.series
                    ?.filter((s) => s.isActive)
                    .map((s) => ({
                      label: s.label,
                      href: `/catalogue?category=${encodeURIComponent(cat.id)}&series=${encodeURIComponent(s.slug)}`,
                    })) || [];
                const catProducts = products
                  .filter((p) => p.category === cat.id)
                  .sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0))
                  .slice(0, 4);
                const totalCount = cat.productCount ?? (products.filter((p) => p.category === cat.id).length || 0);

                return (
                  <div className="space-y-4 animate-fade-in">
                    {/* Back Button */}
                    <button
                      type="button"
                      onClick={() => setMobileCategoryDetail(null)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E3141B] hover:underline cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                      <span>Back to Categories</span>
                    </button>

                    <div>
                      <h3 className="font-heading font-extrabold text-xl text-slate-900">{cat.name}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{totalCount} models available</p>
                    </div>

                    {/* Series Chips */}
                    {series.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                          Series
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {series.map((s, sIdx) => (
                            <Link
                              key={sIdx}
                              href={s.href}
                              onClick={handleCloseMobileMenu}
                              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-800 hover:bg-red-50 hover:text-[#E3141B] transition-colors"
                            >
                              {s.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2x2 Product Grid */}
                    <div className="space-y-2 pt-2">
                      <div className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                        Featured Models
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        {catProducts.map((p) => (
                          <Link
                            key={p.id}
                            href={`/product/${p.slug}`}
                            onClick={handleCloseMobileMenu}
                            className="p-2.5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between group"
                          >
                            <div className="w-full h-20 rounded-lg bg-slate-50 p-1 flex items-center justify-center mb-1.5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={p.imageUrl || "/images/products/utipbcp-4101.png"}
                                alt={p.name}
                                className="max-h-full max-w-full object-contain mix-blend-multiply"
                              />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-[#E3141B]">
                                {p.name}
                              </div>
                              <div className="font-mono text-[9.5px] text-slate-500 truncate mt-0.5">
                                {p.modelCode}
                              </div>
                              <div className="text-xs font-bold text-slate-900 mt-1">
                                {formatINR(p.price)}
                                <span className="text-[9px] font-normal text-slate-500 ml-0.5">+ GST</span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* View all red button */}
                    <Link
                      href={`/catalogue?category=${cat.id}`}
                      onClick={handleCloseMobileMenu}
                      className="w-full py-3 rounded-xl bg-[#E3141B] hover:bg-[#C3101A] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <span>View all {totalCount} {cat.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                );
              })()
            ) : (
              /* Main Drawer Menu */
              <>
                {/* Search Field */}
                <div
                  onClick={() => {
                    handleCloseMobileMenu();
                    setSearchPanelOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold cursor-pointer border border-slate-200/60"
                >
                  <Search className="w-4 h-4 text-slate-400" />
                  <span>Search cameras, DVRs, racks, cables…</span>
                </div>

                {/* SHOP BY CATEGORY list */}
                <div>
                  <div className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase mb-2">
                    Shop by Category
                  </div>
                  <div className="divide-y divide-slate-100">
                    {isLoadingCategories ? (
                      <div className="space-y-2 py-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      categories.filter((c) => c.isActive && c.showInMenu).map((cat) => {
                        const count = cat.productCount ?? products.filter((p) => p.category === cat.id).length;
                        const cover = cat.coverImageUrl || cat.image || `/images/products/cat-${cat.id}.png`;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setMobileCategoryDetail(cat.id)}
                            className="w-full flex items-center justify-between py-2.5 px-1 hover:bg-slate-50 rounded-lg transition-colors text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={cover}
                                  alt=""
                                  className="max-h-full max-w-full object-contain mix-blend-multiply"
                                />
                              </div>
                              <span className="text-sm font-semibold text-slate-900">{cat.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {count}
                              </span>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Dynamic Offer Card (Hidden if neither Flash Sale nor Slide 4 is active) */}
                {mobileOffer && (
                  <div
                    className="rounded-2xl p-4 text-white relative overflow-hidden"
                    style={{
                      background:
                        "radial-gradient(120% 80% at 70% 15%, #FF3B41 0%, #E3141B 40%, #8F0B13 100%)",
                    }}
                  >
                    <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-mono font-bold tracking-wider uppercase mb-1.5 backdrop-blur-xs">
                      {mobileOffer.badge}
                    </span>
                    <div className="font-heading font-black text-2xl leading-tight">
                      {mobileOffer.discountText}
                    </div>
                    <p className="text-xs text-white/90 font-medium mt-1 leading-snug line-clamp-2">
                      {mobileOffer.description}
                    </p>
                    <Link
                      href={mobileOffer.ctaLink}
                      onClick={handleCloseMobileMenu}
                      className="mt-3 inline-block py-2 px-4 rounded-full bg-white text-[#E3141B] font-bold text-xs"
                    >
                      {mobileOffer.ctaText}
                    </Link>
                  </div>
                )}

                {/* Nav Rows */}
                <div className="divide-y divide-slate-100 text-sm font-bold text-slate-900">
                  <Link
                    href="/kit-builder"
                    onClick={handleCloseMobileMenu}
                    className="flex items-center justify-between py-3 hover:text-unitech-red transition-colors"
                  >
                    <span>Kit builder</span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-unitech-red text-white shadow-2xs">
                      New
                    </span>
                  </Link>
                  <Link
                    href="/about"
                    onClick={handleCloseMobileMenu}
                    className="block py-3 hover:text-unitech-red transition-colors"
                  >
                    About
                  </Link>
                  <Link
                    href="/support"
                    onClick={handleCloseMobileMenu}
                    className="block py-3 hover:text-unitech-red transition-colors"
                  >
                    Support
                  </Link>
                  <Link
                    href="/dealers"
                    onClick={handleCloseMobileMenu}
                    className="block py-3 hover:text-unitech-red transition-colors"
                  >
                    Dealers
                  </Link>
                  <Link
                    href="/inquiry"
                    onClick={handleCloseMobileMenu}
                    className="block py-3 hover:text-unitech-red transition-colors"
                  >
                    Inquiry
                  </Link>
                  <Link
                    href="/contact"
                    onClick={handleCloseMobileMenu}
                    className="block py-3 hover:text-unitech-red transition-colors"
                  >
                    Contact
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Fixed Bottom Buttons: Call + WhatsApp */}
          <div
            className="p-3.5 bg-white border-t border-slate-200 flex gap-2.5 shrink-0"
            style={{ paddingBottom: "max(0.875rem, env(safe-area-inset-bottom, 0.875rem))" }}
          >
            <a
              href={`tel:${phoneTel}`}
              className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 text-xs shadow-xs"
            >
              <Phone className="w-4 h-4 text-[#E3141B]" />
              <span>Call {phoneDisplay}</span>
            </a>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 text-xs shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Mega Menu Portal */}
      <MegaMenu
        isOpen={!!activeMegaMenu}
        type={activeMegaMenu}
        onClose={() => setActiveMegaMenu(null)}
        headerBottom={headerBottom}
        products={products}
        categories={categories}
        onMouseEnter={handleMenuMouseEnter}
        onMouseLeave={handleMenuMouseLeave}
      />

      {/* Smart Search Panel (Dialog & Overlay) */}
      <SearchPanel
        isOpen={searchPanelOpen}
        onClose={() => setSearchPanelOpen(false)}
        triggerButtonRef={searchButtonRef}
      />
    </header>
  );
}
