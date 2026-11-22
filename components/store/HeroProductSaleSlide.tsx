"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ProductSaleSlideData } from "@/lib/types";

export const DEFAULT_PRODUCT_SALE_SLIDE: ProductSaleSlideData = {
  id: "slide-product-sale",
  type: "product_sale",
  enabled: true,
  position: 4,
  badgeText: "Product of the week",
  category: "CCTV CAMERAS",
  productName: "4MP Warm-Light Bullet Camera",
  tagline: "Full-colour night vision up to 30 m, in an IP67 metal body.",
  headlineSuffix: "this week.",
  mrp: 4299,
  offerPrice: 2999,
  discountPercent: 30,
  discountOverride: false,
  gstNote: "+ 18% GST · full ITC",
  showGstNote: true,
  specs: [
    "4MP Ultra HD",
    "F1.0 full-colour starlight",
    "30 m warm LED range",
    "IP67 weatherproof alloy",
  ],
  stockLeft: 18,
  productImage: "/images/products/utipbcp-4101.png",
  imageAlt: "4MP Warm-Light Bullet Camera",
  primaryCta: {
    label: "Buy now",
    url: "/catalogue?category=cctv-cameras",
  },
  secondaryCta: {
    label: "Get bulk price",
    url: "/inquiry?type=PRODUCT_QUOTE",
  },
  startsAt: null,
  endsAt: "2026-11-22T23:59:59+05:30",
  afterEnd: "hide_slide",
  status: "published",
  updatedAt: "2026-11-15T10:48:00.000Z",
  updatedBy: "Admin",
};

interface HeroProductSaleSlideProps {
  data: ProductSaleSlideData;
  onSlideExpired?: () => void;
  isPreview?: boolean;
}

function calculateTimeRemaining(targetIso: string) {
  const target = new Date(targetIso).getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { total: diff, days, hours, minutes, seconds };
}

const formatNumber = (n: number) => String(n).padStart(2, "0");

export function HeroProductSaleSlide({
  data,
  onSlideExpired,
  isPreview = false,
}: HeroProductSaleSlideProps) {
  const [timeLeft, setTimeLeft] = useState(() =>
    calculateTimeRemaining(data.endsAt)
  );
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    // Reset image error on image url change
    setImgError(false);
  }, [data.productImage]);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining(data.endsAt);
      setTimeLeft(remaining);

      if (remaining.total <= 0) {
        clearInterval(timer);
        if (data.afterEnd === "hide_slide" && !isPreview) {
          onSlideExpired?.();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [data.endsAt, data.afterEnd, isPreview, onSlideExpired]);

  const discount =
    data.discountOverride && data.discountPercent
      ? data.discountPercent
      : Math.round(((data.mrp - data.offerPrice) / data.mrp) * 100);

  const formattedOfferPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(data.offerPrice);

  const formattedMrp = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(data.mrp);

  const isExpired = timeLeft.total <= 0;
  const hideCountdown = isExpired && data.afterEnd === "show_without_countdown";

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap');

    .hero-product-sale {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 30px;
      color: #111114;
      position: relative;
    }

    .hero-product-sale .ps-top-row {
      display: flex;
      flex-wrap: wrap;
      gap: 30px;
      align-items: center;
      width: 100%;
    }

    .hero-product-sale .ps-left-col {
      flex: 1 1 520px;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .hero-product-sale .ps-label-row {
      display: flex;
      align-items: center;
      gap: 12px;
      animation: ps-rise 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) 0s both;
    }

    .hero-product-sale .ps-sale-pill {
      background: #E3141B;
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 5px 10px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      line-height: 1;
    }

    .hero-product-sale .ps-badge-mono {
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      letter-spacing: 0.12em;
      color: #6E6E78;
      text-transform: uppercase;
      font-weight: 600;
      line-height: 1;
    }

    .hero-product-sale .ps-headline {
      font-family: var(--font-heading, 'Plus Jakarta Sans', sans-serif);
      font-weight: 800;
      font-size: clamp(56px, 7.4vw, 108px);
      line-height: 0.92;
      letter-spacing: -0.045em;
      color: #111114;
      margin: 0;
      animation: ps-rise 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) 0.08s both;
    }

    .hero-product-sale .ps-headline .ps-red {
      color: #E3141B;
    }

    .hero-product-sale .ps-description {
      font-size: 20px;
      line-height: 1.5;
      color: #2C2C31;
      max-width: 520px;
      margin: 0;
      animation: ps-rise 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) 0.16s both;
    }

    .hero-product-sale .ps-description strong {
      font-weight: 700;
      color: #111114;
    }

    .hero-product-sale .ps-price-row {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 14px;
      animation: ps-rise 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) 0.24s both;
    }

    .hero-product-sale .ps-price-offer {
      font-family: var(--font-heading, 'Plus Jakarta Sans', sans-serif);
      font-size: 40px;
      font-weight: 800;
      line-height: 1;
      color: #111114;
    }

    .hero-product-sale .ps-price-mrp {
      font-size: 17px;
      font-weight: 600;
      color: #8A8A93;
      text-decoration: line-through;
    }

    .hero-product-sale .ps-price-gst {
      font-size: 13px;
      color: #5F6368;
      font-weight: 500;
    }

    /* RIGHT COLUMN: PRODUCT STAGE */
    .hero-product-sale .ps-stage-col {
      flex: 1 1 520px;
      min-width: 0;
      position: relative;
      height: 440px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hero-product-sale .ps-glow {
      display: none;
    }

    .hero-product-sale .ps-ring {
      position: absolute;
      width: 380px;
      height: 380px;
      border-radius: 50%;
      border: 1px solid #E2E2E7;
      background: transparent;
      pointer-events: none;
    }

    .hero-product-sale .ps-shadow {
      position: absolute;
      left: 12%;
      bottom: 8%;
      width: 76%;
      height: 7%;
      border-radius: 50%;
      background: radial-gradient(closest-side, rgba(17, 17, 20, 0.28), rgba(17, 17, 20, 0));
      animation: ps-shadow 6s ease-in-out infinite;
      pointer-events: none;
    }

    .hero-product-sale .ps-img-wrap {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
    }

    .hero-product-sale .ps-img-inner {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
    }

    .hero-product-sale .ps-img-inner img {
      max-width: 100%;
      max-height: 380px;
      width: auto;
      height: auto;
      object-fit: contain;
      mix-blend-mode: multiply;
      display: block;
      margin: 0 auto;
      animation: ps-float 6s ease-in-out infinite;
    }

    .hero-product-sale .ps-placeholder {
      width: 260px;
      height: 260px;
      border-radius: 24px;
      background: #E4E4E8;
      border: 2px dashed #C4C4CC;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #6E6E78;
      font-size: 13px;
      font-weight: 600;
      gap: 8px;
    }

    /* SPEC STRIP */
    .hero-product-sale .ps-spec-strip {
      display: grid;
      width: 100%;
      border-top: 1px solid #E4E4E8;
      border-bottom: 1px solid #E4E4E8;
      animation: ps-rise 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) 0.30s both;
    }

    .hero-product-sale .ps-spec-cell {
      padding: 18px 18px 18px 0;
      border-right: 1px solid #E4E4E8;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .hero-product-sale .ps-spec-cell:last-child {
      border-right: none;
    }

    .hero-product-sale .ps-spec-icon {
      width: 16px;
      height: 16px;
      color: #E3141B;
      flex-shrink: 0;
    }

    .hero-product-sale .ps-spec-text {
      font-size: 15px;
      font-weight: 600;
      color: #111114;
      line-height: 1.3;
    }

    /* BOTTOM ROW */
    .hero-product-sale .ps-bottom-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 20px;
      width: 100%;
      animation: ps-rise 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) 0.36s both;
      margin-bottom: 28px;
    }

    .hero-product-sale .ps-btn-group {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .hero-product-sale .ps-btn-primary {
      background: #E3141B;
      color: #FFFFFF;
      font-size: 15px;
      font-weight: 600;
      height: 54px;
      padding: 0 28px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      box-shadow: 0 8px 20px -8px rgba(227, 20, 27, 0.55);
      transition: background-color 0.2s, transform 0.2s;
      white-space: nowrap;
    }

    .hero-product-sale .ps-btn-primary:hover {
      background: #C3101A;
      transform: translateY(-1px);
    }

    .hero-product-sale .ps-btn-primary svg {
      width: 16px;
      height: 16px;
      stroke-width: 2;
      transition: transform 0.2s;
    }

    .hero-product-sale .ps-btn-primary:hover svg {
      transform: translateX(4px);
    }

    .hero-product-sale .ps-btn-secondary {
      background: #FFFFFF;
      border: 1px solid #DADADF;
      color: #111114;
      font-size: 15px;
      font-weight: 600;
      height: 54px;
      padding: 0 24px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      text-decoration: none;
      transition: border-color 0.2s, background-color 0.2s;
      white-space: nowrap;
    }

    .hero-product-sale .ps-btn-secondary:hover {
      border-color: #111114;
      background: #F9F9FB;
    }

    .hero-product-sale .ps-countdown-block {
      margin-left: auto;
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .hero-product-sale .ps-countdown-info {
      text-align: right;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .hero-product-sale .ps-countdown-tag {
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      letter-spacing: 0.12em;
      color: #B10E16;
      font-weight: 700;
      text-transform: uppercase;
      line-height: 1;
    }

    .hero-product-sale .ps-stock-line {
      font-size: 12.5px;
      color: #5F6368;
      line-height: 1.2;
    }

    .hero-product-sale .ps-timer-group-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .hero-product-sale .ps-timer-unit {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .hero-product-sale .ps-timer-num {
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 22px;
      font-weight: 700;
      color: #111114;
      line-height: 1;
    }

    .hero-product-sale .ps-timer-lbl {
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 9.5px;
      letter-spacing: 0.12em;
      color: #8A8A93;
      text-transform: uppercase;
      margin-top: 3px;
      line-height: 1;
    }

    .hero-product-sale .ps-timer-sep {
      color: #C4C4CC;
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 18px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 12px;
      user-select: none;
    }

    /* ANIMATION KEYFRAMES */
    @keyframes ps-rise {
      0% {
        opacity: 0;
        transform: translateY(26px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes ps-enter {
      0% {
        opacity: 0;
        transform: translateX(60px) scale(0.95);
      }
      100% {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }

    @keyframes ps-float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    @keyframes ps-shadow {
      0%, 100% {
        transform: scaleX(1);
        opacity: 0.55;
      }
      50% {
        transform: scaleX(0.88);
        opacity: 0.35;
      }
    }

    /* RESPONSIVE STYLES */
    @media (min-width: 900px) and (max-width: 1199px) {
      .hero-product-sale .ps-stage-col {
        height: 380px;
      }
    }

    @media (max-width: 899px) {
      .hero-product-sale .ps-top-row {
        flex-direction: column;
        align-items: stretch;
      }
      .hero-product-sale .ps-stage-col {
        height: 300px;
        order: 2;
      }
      .hero-product-sale .ps-img-inner img {
        max-height: 260px;
      }
      .hero-product-sale .ps-left-col {
        order: 1;
      }
      .hero-product-sale .ps-spec-strip {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
      .hero-product-sale .ps-spec-cell:nth-child(2n) {
        border-right: none;
      }
      .hero-product-sale .ps-spec-cell:nth-child(n+3) {
        border-top: 1px solid #E4E4E8;
      }
      .hero-product-sale .ps-bottom-row {
        flex-direction: column;
        align-items: stretch;
      }
      .hero-product-sale .ps-btn-group {
        width: 100%;
      }
      .hero-product-sale .ps-btn-primary,
      .hero-product-sale .ps-btn-secondary {
        flex: 1;
        justify-content: center;
      }
      .hero-product-sale .ps-countdown-block {
        margin-left: 0;
        justify-content: flex-start;
      }
      .hero-product-sale .ps-countdown-info {
        text-align: left;
      }
    }

    @media (max-width: 479px) {
      .hero-product-sale .ps-headline {
        font-size: clamp(48px, 7.4vw, 108px);
      }
      .hero-product-sale .ps-spec-strip {
        grid-template-columns: 1fr !important;
      }
      .hero-product-sale .ps-spec-cell {
        border-right: none;
      }
      .hero-product-sale .ps-spec-cell:nth-child(n+2) {
        border-top: 1px solid #E4E4E8;
      }
      .hero-product-sale .ps-btn-group {
        flex-direction: column;
      }
      .hero-product-sale .ps-btn-primary,
      .hero-product-sale .ps-btn-secondary {
        width: 100%;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .hero-product-sale,
      .hero-product-sale * {
        animation: none !important;
        transition: none !important;
      }
    }
  `;

  const specCount = Math.min(4, Math.max(2, data.specs.length));

  return (
    <div className="hero-product-sale">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* 3.1 TOP ROW */}
      <div className="ps-top-row">
        {/* LEFT COLUMN: BADGE, HEADLINE, DESCRIPTION, PRICING */}
        <div className="ps-left-col">
          <div className="ps-label-row">
            <span className="ps-sale-pill">SALE</span>
            <span className="ps-badge-mono">
              {data.category.toUpperCase()} · {data.badgeText}
            </span>
          </div>

          <h2 className="ps-headline">
            Save <span className="ps-red">{discount}%</span>
            <br />
            {data.headlineSuffix}
          </h2>

          <p className="ps-description">
            <strong>{data.productName}</strong> — {data.tagline}
          </p>

          <div className="ps-price-row">
            <span className="ps-price-offer">{formattedOfferPrice}</span>
            <span className="ps-price-mrp">{formattedMrp}</span>
            {data.showGstNote && (
              <span className="ps-price-gst">{data.gstNote}</span>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: PRODUCT STAGE */}
        <div className="ps-stage-col">
          <div className="ps-glow" aria-hidden="true" />
          <div className="ps-ring" aria-hidden="true" />
          <div className="ps-shadow" aria-hidden="true" />

          <div className="ps-img-wrap">
            <div className="ps-img-inner">
              {data.productImage && !imgError ? (
                <img
                  data-scan-target
                  src={data.productImage}
                  alt={data.imageAlt || data.productName}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="ps-placeholder">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Product Image</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3.2 SPEC STRIP (full width) */}
      <div
        className="ps-spec-strip"
        style={{
          gridTemplateColumns: `repeat(${specCount}, minmax(0, 1fr))`,
        }}
      >
        {data.specs.slice(0, 4).map((spec, sIdx) => (
          <div key={sIdx} className="ps-spec-cell" data-scan-late={String(sIdx)}>
            <svg
              className="ps-spec-icon"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M13.3333 4L6 11.3333L2.66667 8"
                stroke="#E3141B"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="ps-spec-text">{spec}</span>
          </div>
        ))}
      </div>

      {/* 3.3 BOTTOM ROW */}
      <div className="ps-bottom-row">
        {/* Buttons */}
        <div className="ps-btn-group" data-scan-late="4">
          <Link href={data.primaryCta.url} className="ps-btn-primary">
            <span>{data.primaryCta.label}</span>
            <svg
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3.33334 8H12.6667M12.6667 8L8.66668 4M12.6667 8L8.66668 12"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          <Link href={data.secondaryCta.url} className="ps-btn-secondary">
            <span>{data.secondaryCta.label}</span>
          </Link>
        </div>

        {/* Countdown + Stock Info */}
        {!hideCountdown && (
          <div className="ps-countdown-block" data-scan-late="5">
            <div className="ps-countdown-info">
              <span className="ps-countdown-tag">OFFER ENDS IN</span>
              {data.stockLeft != null && data.stockLeft > 0 && (
                <span className="ps-stock-line">
                  Only {data.stockLeft} left at this price
                </span>
              )}
            </div>

            <div
              className="ps-timer-group-wrap"
              role="timer"
              aria-label={`Offer ends in ${timeLeft.days} days ${timeLeft.hours} hours ${timeLeft.minutes} minutes`}
            >
              <div className="ps-timer-unit">
                <span className="ps-timer-num" suppressHydrationWarning>
                  {formatNumber(timeLeft.days)}
                </span>
                <span className="ps-timer-lbl">DAYS</span>
              </div>
              <span className="ps-timer-sep" aria-hidden="true">
                :
              </span>
              <div className="ps-timer-unit">
                <span className="ps-timer-num" suppressHydrationWarning>
                  {formatNumber(timeLeft.hours)}
                </span>
                <span className="ps-timer-lbl">HRS</span>
              </div>
              <span className="ps-timer-sep" aria-hidden="true">
                :
              </span>
              <div className="ps-timer-unit">
                <span className="ps-timer-num" suppressHydrationWarning>
                  {formatNumber(timeLeft.minutes)}
                </span>
                <span className="ps-timer-lbl">MIN</span>
              </div>
              <span className="ps-timer-sep" aria-hidden="true">
                :
              </span>
              <div className="ps-timer-unit">
                <span className="ps-timer-num" suppressHydrationWarning>
                  {formatNumber(timeLeft.seconds)}
                </span>
                <span className="ps-timer-lbl">SEC</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
