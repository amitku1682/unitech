"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  Check,
  ShieldCheck,
  Clock,
  Flame,
  ShoppingBag,
  ExternalLink,
  MessageCircle,
  Plus,
  Minus,
  Sparkles,
} from "lucide-react";
import { FlashSalePublicPayload } from "@/lib/types";
import styles from "./FlashSalePopup.module.css";

interface FlashSalePopupProps {
  previewData?: FlashSalePublicPayload | null;
  isMobilePreview?: boolean;
}

export default function FlashSalePopup({
  previewData,
  isMobilePreview = false,
}: FlashSalePopupProps) {
  const pathname = usePathname();
  const [data, setData] = useState<FlashSalePublicPayload | null>(
    previewData || null
  );
  const [isOpen, setIsOpen] = useState<boolean>(!!previewData);
  const [isMobile, setIsMobile] = useState<boolean>(isMobilePreview);
  const [quantity, setQuantity] = useState<number>(1);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [isClaimed, setIsClaimed] = useState<boolean>(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Countdown state
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMs: 0,
  });

  const viewReportedRef = useRef(false);

  // Sync previewData if passed in props
  useEffect(() => {
    if (previewData) {
      setData(previewData);
      setIsOpen(true);
      setIsMobile(isMobilePreview);
    }
  }, [previewData, isMobilePreview]);

  // Window resize listener to differentiate Desktop modal vs Mobile sheet
  useEffect(() => {
    if (previewData) return;
    const checkWidth = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, [previewData]);

  // Fetch active flash sale from server if not in preview mode
  useEffect(() => {
    if (previewData) return;

    // Never show on cart, checkout, or admin routes
    if (
      !pathname ||
      pathname.startsWith("/cart") ||
      pathname.startsWith("/checkout") ||
      pathname.startsWith("/admin")
    ) {
      setIsOpen(false);
      return;
    }

    let isMounted = true;

    async function fetchActive() {
      try {
        const res = await fetch("/api/flash-sale/active");
        if (res.status === 204 || !res.ok) {
          if (isMounted) setData(null);
          return;
        }
        const json = await res.json();
        const payload = (json && json.data) ? json.data : json;
        if (isMounted && payload && payload.id) {
          setData(payload);
        }
      } catch (err) {
        console.warn("[FlashSalePopup] Fetch error:", err);
      }
    }

    fetchActive();
    return () => {
      isMounted = false;
    };
  }, [pathname, previewData]);

  // Evaluate Display Rules (showOn, frequency, trigger)
  useEffect(() => {
    if (previewData || !data) return;

    // 1. Check showOn
    if (data.showOn === "home_only" && pathname !== "/") {
      return;
    }
    if (
      data.showOn === "home_and_products" &&
      pathname !== "/" &&
      !pathname.startsWith("/catalogue") &&
      !pathname.startsWith("/product")
    ) {
      return;
    }

    // 2. Check frequency
    const storageKey = `unitech_flash_sale_seen_${data.id}_${data.updatedAt || ""}`;
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const forceShow = urlParams?.has("flash_sale") || urlParams?.has("preview");

    if (!forceShow) {
      if (data.frequency === "once_per_session") {
        if (sessionStorage.getItem(storageKey)) {
          return;
        }
      } else if (data.frequency === "once_per_day") {
        const lastSeen = localStorage.getItem(storageKey);
        if (lastSeen) {
          const diffHours = (Date.now() - parseInt(lastSeen, 10)) / (1000 * 60 * 60);
          if (diffHours < 24) return;
        }
      }
    }

    const markSeen = () => {
      try {
        if (data.frequency === "once_per_session") {
          sessionStorage.setItem(storageKey, "1");
        } else if (data.frequency === "once_per_day") {
          localStorage.setItem(storageKey, Date.now().toString());
        }
      } catch {}
    };

    const triggerOpen = () => {
      setIsOpen(true);
      if (!forceShow) markSeen();

      // Track view on server once per session
      if (!viewReportedRef.current && data.id) {
        viewReportedRef.current = true;
        fetch(`/api/flash-sale/${data.id}/view`, { method: "POST" }).catch(() => {});
      }
    };

    // 3. Check trigger
    if (forceShow || data.showTrigger === "immediate") {
      triggerOpen();
    } else if (data.showTrigger === "delay") {
      const delayMs = Math.max(1, data.showDelaySeconds || 2) * 1000;
      const timer = setTimeout(triggerOpen, delayMs);
      return () => clearTimeout(timer);
    } else if (data.showTrigger === "scroll_50") {
      const handleScroll = () => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalHeight > 0 && window.scrollY / totalHeight >= 0.5) {
          triggerOpen();
          window.removeEventListener("scroll", handleScroll);
        }
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    } else if (data.showTrigger === "exit_intent") {
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 12) {
          triggerOpen();
          document.removeEventListener("mouseleave", handleMouseLeave);
        }
      };
      document.addEventListener("mouseleave", handleMouseLeave);
      return () => document.removeEventListener("mouseleave", handleMouseLeave);
    }
  }, [data, pathname, previewData]);

  // Calculate live countdown timer
  useEffect(() => {
    if (!data?.endsAt) return;

    const calculateTime = () => {
      const targetTime = new Date(data.endsAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, targetTime - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, totalMs: diff });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [data?.endsAt]);

  // Lock body scroll when open on storefront
  useEffect(() => {
    if (previewData) return;
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, previewData]);

  // Escape key listener to close
  useEffect(() => {
    if (previewData) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, previewData]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleClaimOffer = async () => {
    if (!data) return;
    setIsClaiming(true);
    setClaimError(null);

    try {
      if (previewData) {
        // In preview mode simulate success
        setTimeout(() => {
          setIsClaiming(false);
          setIsClaimed(true);
        }, 400);
        return;
      }

      const res = await fetch(`/api/flash-sale/${data.id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qty: quantity }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to claim flash sale");
      }

      // Add to local cart with server-locked price
      const cartItem = json.cartItem;
      try {
        const rawCart = localStorage.getItem("unitech_cart");
        let cart: any[] = rawCart ? JSON.parse(rawCart) : [];

        // Check if already in cart
        const existingIdx = cart.findIndex((i: any) => i.id === cartItem.id);
        if (existingIdx > -1) {
          cart[existingIdx].quantity += cartItem.quantity;
        } else {
          cart.unshift(cartItem);
        }

        localStorage.setItem("unitech_cart", JSON.stringify(cart));
        window.dispatchEvent(new Event("storage"));
      } catch (e) {
        console.warn("[FlashSalePopup] Local cart update warning:", e);
      }

      setIsClaimed(true);
    } catch (err: any) {
      setClaimError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isOpen || !data) return null;

  const padZero = (n: number) => String(n).padStart(2, "0");

  const targetWhatsappNumber = (data.whatsappNumber && !data.whatsappNumber.includes("93125")
    ? data.whatsappNumber
    : "+91 87003 17239").replace(/[^0-9]/g, "");

  const whatsappLink = `https://wa.me/${targetWhatsappNumber}?text=${encodeURIComponent(
    `Hello Unitech! I am interested in the ${data.title} (Flash Sale Offer at ₹${data.price.toLocaleString("en-IN")}).`
  )}`;

  // Wrapper for preview mode vs real dialog modal
  const contentWrapper = (children: React.ReactNode) => {
    if (previewData) {
      return (
        <div className={`flash-sale ${styles.container}`} style={{ width: "100%" }}>
          {children}
        </div>
      );
    }

    return (
      <div
        className={`flash-sale ${styles.backdrop}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-label={data.title}
      >
        {children}
      </div>
    );
  };

  // SUCCESS STATE CARD
  if (isClaimed) {
    return contentWrapper(
      <div className={styles.dialog} style={{ maxWidth: 520 }}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <Check className="w-8 h-8" />
          </div>
          <h3 className={styles.successTitle}>Offer Claimed Successfully!</h3>
          <p className={styles.successDesc}>
            <strong>{quantity}× {data.title}</strong> has been added to your quote cart at the locked factory price of{" "}
            <strong>₹{(data.price * quantity).toLocaleString("en-IN")}</strong> (+ 18% GST).
          </p>

          <div className={styles.successActions}>
            <Link
              href="/cart"
              onClick={handleClose}
              className={styles.checkoutBtn}
            >
              View Quote Cart →
            </Link>
            <button
              type="button"
              onClick={handleClose}
              className={styles.continueBtn}
            >
              Keep Browsing
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MOBILE BOTTOM SHEET (< 768px)
  if (isMobile) {
    return contentWrapper(
      <div className={styles.mobileSheet}>
        <div className={styles.mobileHandle} />
        <button
          type="button"
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className={styles.mobileContent}>
          {/* Badges & Title */}
          <div className={styles.badgeRow}>
            <span className={styles.primaryBadge}>{data.badge}</span>
            <span className={styles.secondaryBadge}>{data.badge2}</span>
          </div>

          <div className={styles.eyebrow}>{data.eyebrow}</div>
          <h2 className={styles.title} style={{ fontSize: 20 }}>
            {data.title}
          </h2>
          <p className={styles.subtitle} style={{ fontSize: 12, marginBottom: 12 }}>
            {data.subtitle}
          </p>

          {/* Slim Countdown */}
          <div className={styles.mobileTimerSlim}>
            <span className="flex items-center gap-1.5 text-xs text-red-400 font-bold">
              <span className={styles.timerDot} />
              OFFER ENDS IN
            </span>
            <span className="font-mono text-xs font-bold text-white">
              {padZero(timeLeft.days)}d : {padZero(timeLeft.hours)}h : {padZero(timeLeft.minutes)}m : {padZero(timeLeft.seconds)}s
            </span>
          </div>

          {/* Compact Hero Image */}
          <div className={styles.mobileHeroBox}>
            <Image
              src={data.heroImageUrl}
              alt={data.heroImageAlt || data.title}
              width={260}
              height={150}
              className={styles.mobileHeroImg}
              priority
            />
            {data.heroBadge && (
              <div className={styles.heroBadge} style={{ top: 8, right: 8, padding: "3px 8px" }}>
                <div className={styles.heroBadgeMain} style={{ fontSize: 13 }}>
                  {data.heroBadge}
                </div>
                {data.heroBadgeCaption && (
                  <div className={styles.heroBadgeSub} style={{ fontSize: 7 }}>
                    {data.heroBadgeCaption}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Price Block */}
          <div className={styles.priceSection} style={{ marginBottom: 14 }}>
            <div className={styles.mrpRow}>
              <span className={styles.mrpLabel}>MRP:</span>
              <span className={styles.mrpVal}>₹{data.mrp.toLocaleString("en-IN")}</span>
              <span className={styles.discountBadge}>{data.discount}% OFF</span>
            </div>
            <div className={styles.activePriceRow}>
              <span className={styles.activePrice} style={{ fontSize: 28 }}>
                ₹{data.price.toLocaleString("en-IN")}
              </span>
              <span className={styles.perUnit}>
                (₹{data.perUnit.toLocaleString("en-IN")} / {data.unitLabel})
              </span>
            </div>
            <div className={styles.gstNote}>{data.gstNote}</div>
          </div>

          {/* Items in kit 2-col compact grid */}
          <div className={styles.itemsHeading}>What&apos;s Included</div>
          <div className={styles.itemsGrid} style={{ marginBottom: 12 }}>
            {data.items.slice(0, 4).map((item) => (
              <div key={item.id} className={styles.itemCard} style={{ padding: "6px 8px" }}>
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  width={28}
                  height={28}
                  className={styles.itemImage}
                />
                <div className={styles.itemInfo}>
                  <div className={styles.itemTitleRow}>
                    <span className={styles.itemQty}>{item.qty}×</span>
                    <span className={styles.itemName} style={{ fontSize: 10 }}>
                      {item.shortName || item.name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stock Urgency */}
          <div className={styles.barSection} style={{ marginBottom: 14 }}>
            <div className={styles.barRow}>
              <div className={styles.barHeader}>
                <span className="flex items-center gap-1 text-red-600 font-bold">
                  <Flame className="w-3.5 h-3.5 fill-red-500" />
                  Only {data.stockLeft} kits left in factory stock
                </span>
                <span>{data.stockPct}% claimed</span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFillRed}
                  style={{ width: `${Math.max(8, 100 - data.stockPct)}%` }}
                />
              </div>
            </div>
          </div>

          {claimError && (
            <div className="p-2 mb-2 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg">
              {claimError}
            </div>
          )}

          {/* Secondary Actions */}
          <div className={styles.secondaryRow} style={{ marginBottom: 12 }}>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsappBtn}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
            <Link
              href={data.bulkUrl || "/inquiry"}
              onClick={handleClose}
              className={styles.bulkBtn}
            >
              {data.bulkLabel}
            </Link>
          </div>
        </div>

        {/* Sticky CTA Bottom on Mobile */}
        <div className={styles.mobileStickyCta}>
          <div className={styles.qtyControls} style={{ marginRight: 4 }}>
            <button
              type="button"
              className={styles.qtyBtn}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1 || isClaiming}
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className={styles.qtyVal}>{quantity}</span>
            <button
              type="button"
              className={styles.qtyBtn}
              onClick={() =>
                setQuantity((q) => Math.min(Math.min(10, data.stockLeft), q + 1))
              }
              disabled={quantity >= Math.min(10, data.stockLeft) || isClaiming}
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            className={styles.claimButton}
            onClick={handleClaimOffer}
            disabled={isClaiming || data.stockLeft <= 0}
          >
            <div className={styles.claimShine} />
            <ShoppingBag className="w-4 h-4" />
            <span>
              {isClaiming
                ? "Securing Price..."
                : `${data.ctaShortLabel || "Claim offer"} · ₹${(data.price * quantity).toLocaleString("en-IN")}`}
            </span>
          </button>
        </div>
      </div>
    );
  }

  // DESKTOP MODAL (≥ 768px)
  return contentWrapper(
    <div className={styles.dialog}>
      <button
        type="button"
        className={styles.closeButton}
        onClick={handleClose}
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>

      <div className={styles.desktopGrid}>
        {/* LEFT COLUMN: Visual & Kit Details */}
        <div className={styles.leftColumn}>
          <div className={styles.badgeRow}>
            <span className={styles.primaryBadge}>{data.badge}</span>
            <span className={styles.secondaryBadge}>{data.badge2}</span>
          </div>

          <div className={styles.eyebrow}>{data.eyebrow}</div>
          <h2 className={styles.title}>{data.title}</h2>
          <p className={styles.subtitle}>{data.subtitle}</p>

          {/* Hero Visual */}
          <div className={styles.heroVisualContainer}>
            <Image
              src={data.heroImageUrl}
              alt={data.heroImageAlt || data.title}
              width={340}
              height={180}
              className={styles.heroImage}
              priority
            />
            {data.heroBadge && (
              <div className={styles.heroBadge}>
                <div className={styles.heroBadgeMain}>{data.heroBadge}</div>
                {data.heroBadgeCaption && (
                  <div className={styles.heroBadgeSub}>
                    {data.heroBadgeCaption}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Kit Items */}
          <div className={styles.itemsHeading}>What&apos;s Included In The Kit</div>
          <div className={styles.itemsGrid}>
            {data.items.slice(0, 4).map((item) => (
              <div key={item.id} className={styles.itemCard}>
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  width={32}
                  height={32}
                  className={styles.itemImage}
                />
                <div className={styles.itemInfo}>
                  <div className={styles.itemTitleRow}>
                    <span className={styles.itemQty}>{item.qty}×</span>
                    <span className={styles.itemName}>
                      {item.shortName || item.name}
                    </span>
                  </div>
                  {item.spec && <div className={styles.itemSpec}>{item.spec}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Perks */}
          <div className={styles.perksList}>
            {data.perks.map((perk, i) => (
              <div key={i} className={styles.perkItem}>
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 font-bold" />
                <span>{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Urgency, Pricing & Action */}
        <div className={styles.rightColumn}>
          <div>
            {/* Live Countdown Bar */}
            <div className={styles.timerCard}>
              <div className={styles.timerLabel}>
                <span className={styles.timerDot} />
                <span>OFFER ENDS IN</span>
              </div>
              <div className={styles.timerSegments}>
                <div className={styles.timerSeg}>
                  <span className={styles.timerVal}>{padZero(timeLeft.days)}</span>
                  <span className={styles.timerUnit}>Days</span>
                </div>
                <span className={styles.timerSep}>:</span>
                <div className={styles.timerSeg}>
                  <span className={styles.timerVal}>{padZero(timeLeft.hours)}</span>
                  <span className={styles.timerUnit}>Hours</span>
                </div>
                <span className={styles.timerSep}>:</span>
                <div className={styles.timerSeg}>
                  <span className={styles.timerVal}>{padZero(timeLeft.minutes)}</span>
                  <span className={styles.timerUnit}>Mins</span>
                </div>
                <span className={styles.timerSep}>:</span>
                <div className={styles.timerSeg}>
                  <span className={styles.timerVal}>{padZero(timeLeft.seconds)}</span>
                  <span className={styles.timerUnit}>Secs</span>
                </div>
              </div>
            </div>

            {/* Price Block */}
            <div className={styles.priceSection}>
              <div className={styles.mrpRow}>
                <span className={styles.mrpLabel}>Regular Price:</span>
                <span className={styles.mrpVal}>₹{data.mrp.toLocaleString("en-IN")}</span>
                <span className={styles.discountBadge}>{data.discount}% OFF</span>
              </div>
              <div className={styles.activePriceRow}>
                <span className={styles.activePrice}>
                  ₹{data.price.toLocaleString("en-IN")}
                </span>
                <span className={styles.perUnit}>
                  (₹{data.perUnit.toLocaleString("en-IN")} / {data.unitLabel})
                </span>
              </div>
              <div className={styles.gstNote}>{data.gstNote}</div>
            </div>

            {/* Price & Stock Progress Bars */}
            <div className={styles.barSection}>
              <div className={styles.barRow}>
                <div className={styles.barHeader}>
                  <span className="flex items-center gap-1 text-red-600 font-bold">
                    <Flame className="w-3.5 h-3.5 fill-red-500" />
                    Factory Stock Urgency
                  </span>
                  <span>{data.stockLeft} of {data.stockTotal} kits left</span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFillRed}
                    style={{ width: `${Math.max(6, 100 - data.stockPct)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className={styles.actionSection}>
            {/* Quantity Selector */}
            <div className={styles.qtyRow}>
              <span className={styles.qtyLabel}>Quantity:</span>
              <div className={styles.qtyControls}>
                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isClaiming}
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className={styles.qtyVal}>{quantity}</span>
                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={() =>
                    setQuantity((q) => Math.min(Math.min(10, data.stockLeft), q + 1))
                  }
                  disabled={quantity >= Math.min(10, data.stockLeft) || isClaiming}
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {claimError && (
              <div className="p-2.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg">
                {claimError}
              </div>
            )}

            {/* Primary CTA */}
            <button
              type="button"
              className={styles.claimButton}
              onClick={handleClaimOffer}
              disabled={isClaiming || data.stockLeft <= 0}
            >
              <div className={styles.claimShine} />
              <ShoppingBag className="w-4 h-4" />
              <span>
                {isClaiming
                  ? "Securing Factory Price..."
                  : `${data.ctaLabel} (₹${(data.price * quantity).toLocaleString("en-IN")})`}
              </span>
            </button>

            {/* Secondary actions: WhatsApp & Bulk */}
            <div className={styles.secondaryRow}>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappBtn}
              >
                <MessageCircle className="w-4 h-4" />
                Chat on WhatsApp
              </a>
              <Link
                href={data.bulkUrl || "/inquiry"}
                onClick={handleClose}
                className={styles.bulkBtn}
              >
                {data.bulkLabel}
              </Link>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className={styles.dismissBtn}
            >
              {data.dismissLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
