"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export interface SaleProductItem {
  id: "cable" | "camera" | "dvr" | "power";
  category: string;
  discount: string;
  isHeroDiscount?: boolean;
  name: string;
  price: string;
  mrp: string;
  showGst?: boolean;
  image: string;
  alt: string;
  href: string;
}

const SALE_PRODUCTS: SaleProductItem[] = [
  {
    id: "cable",
    category: "CABLES · BESTSELLER",
    discount: "Up to 60% off",
    isHeroDiscount: true,
    name: "3+1 CCTV Cable · 90 m",
    price: "₹999",
    mrp: "₹2,499",
    showGst: true,
    image: "/images/products/90y-tight.png",
    alt: "Unitech 3+1 CCTV cable roll",
    href: "/catalogue?category=cables",
  },
  {
    id: "camera",
    category: "CAMERAS",
    discount: "30% off",
    name: "4MP Warm-Light Bullet",
    price: "₹2,999",
    mrp: "₹4,299",
    image: "/images/products/utipbcp-4101.png",
    alt: "Unitech 4MP warm-light bullet camera",
    href: "/catalogue?category=cctv-cameras",
  },
  {
    id: "dvr",
    category: "RECORDERS",
    discount: "25% off",
    name: "H.265 Hybrid DVR",
    price: "₹2,600",
    mrp: "₹3,470",
    image: "/images/products/utnr-832-tight.png",
    alt: "Unitech H.265 hybrid DVR",
    href: "/catalogue?category=dvrs-nvrs",
  },
  {
    id: "power",
    category: "POWER",
    discount: "35% off",
    name: "12V 10A SMPS",
    price: "₹1,340",
    mrp: "₹2,060",
    image: "/images/products/utpsp-016.png",
    alt: "Unitech 12V SMPS power supply",
    href: "/catalogue?category=power-supplies",
  },
];

export interface HeroSaleOfferGridProps {
  saleEndsAt?: string;
  products?: Partial<SaleProductItem>[];
}

const DEFAULT_END_DATE = "2026-11-30T23:59:59+05:30";

function calculateTimeRemaining(targetIso: string) {
  const target = new Date(targetIso).getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
}

const formatNumber = (num: number) => String(num).padStart(2, "0");

export function HeroSaleOfferGrid({
  saleEndsAt = DEFAULT_END_DATE,
  products,
}: HeroSaleOfferGridProps) {
  const [timeLeft, setTimeLeft] = useState(() =>
    calculateTimeRemaining(saleEndsAt)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeRemaining(saleEndsAt));
    }, 1000);

    return () => clearInterval(timer);
  }, [saleEndsAt]);

  const formattedDate = (() => {
    try {
      const d = new Date(saleEndsAt);
      return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(d);
    } catch {
      return "30 Nov 2026";
    }
  })();

  const activeProducts = React.useMemo(() => {
    if (!products || !Array.isArray(products) || products.length === 0) {
      return SALE_PRODUCTS;
    }
    return SALE_PRODUCTS.map((def) => {
      const custom = products.find((p) => p && p.id === def.id);
      return custom ? { ...def, ...custom } : def;
    });
  }, [products]);

  const cableItem = activeProducts.find((p) => p.id === "cable") || SALE_PRODUCTS[0];
  const cameraItem = activeProducts.find((p) => p.id === "camera") || SALE_PRODUCTS[1];
  const dvrItem = activeProducts.find((p) => p.id === "dvr") || SALE_PRODUCTS[2];
  const powerItem = activeProducts.find((p) => p.id === "power") || SALE_PRODUCTS[3];

  const arrowSvg = (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3.33334 8H12.6667M12.6667 8L8.66668 4M12.6667 8L8.66668 12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap');

    .hero-sale-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      grid-template-rows: 164px 164px 164px;
      grid-template-areas:
        "cable  camera"
        "cable  dvr"
        "power  countdown";
      gap: 12px;
      width: 100%;
      max-width: 840px;
      box-sizing: border-box;
    }

    .hero-sale-grid .sale-card {
      background: #FFFFFF;
      border: 1px solid #EDEDF0;
      border-radius: 20px;
      padding: 16px;
      box-sizing: border-box;
      display: flex;
      gap: 14px;
      color: #111114;
      text-decoration: none;
      position: relative;
      animation: sale-rise 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) both;
      transition: transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1),
                  border-color 0.35s cubic-bezier(0.2, 0.7, 0.2, 1),
                  box-shadow 0.35s cubic-bezier(0.2, 0.7, 0.2, 1);
    }

    .hero-sale-grid .sale-card:hover {
      transform: translateY(-3px);
      border-color: #E2E2E7;
      box-shadow: 0 24px 48px -28px rgba(17, 17, 20, 0.35);
    }

    .hero-sale-grid .sale-card:focus-visible {
      outline: 2px solid #E3141B;
      outline-offset: 2px;
    }

    .hero-sale-grid .sale-card--cable {
      grid-area: cable;
      animation-delay: 0.10s;
      flex-direction: column;
      gap: 14px;
    }

    .hero-sale-grid .sale-card--camera {
      grid-area: camera;
      animation-delay: 0.20s;
    }

    .hero-sale-grid .sale-card--dvr {
      grid-area: dvr;
      animation-delay: 0.30s;
    }

    .hero-sale-grid .sale-card--power {
      grid-area: power;
      animation-delay: 0.40s;
    }

    .hero-sale-grid .sale-card--countdown {
      grid-area: countdown;
      animation-delay: 0.50s;
      background: #111114;
      color: #FFFFFF;
      border-radius: 20px;
      padding: 16px 18px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 1px solid #23262D;
      text-decoration: none;
      animation: sale-rise 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) 0.50s both;
    }

    .hero-sale-grid .sale-well {
      background: #F5F5F7;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
    }

    .hero-sale-grid .sale-well img {
      object-fit: contain;
      max-width: 84%;
      max-height: 80%;
      mix-blend-mode: multiply;
      transition: transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
    }

    .hero-sale-grid .sale-card:hover .sale-well img {
      transform: scale(1.06);
    }

    .hero-sale-grid .sale-card--cable .sale-well {
      flex: 1;
      width: 100%;
      min-height: 0;
    }

    .hero-sale-grid .sale-card--cable .sale-well img {
      max-width: 78%;
      max-height: 84%;
    }

    .hero-sale-grid .sale-card--small {
      flex-direction: row;
    }

    .hero-sale-grid .sale-card--small .sale-body-horizontal {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .hero-sale-grid .sale-card--small .sale-well {
      width: 44%;
      height: 100%;
      flex-shrink: 0;
    }

    .hero-sale-grid .sale-cat {
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 10.5px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #6E6E78;
      font-weight: 600;
      line-height: 1.2;
    }

    .hero-sale-grid .sale-off {
      display: inline-flex;
      align-items: center;
      font-size: 11.5px;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 999px;
      background: #FDECEC;
      color: #B10E16;
      white-space: nowrap;
      line-height: 1.2;
    }

    .hero-sale-grid .sale-off--hero {
      background: #E3141B;
      color: #FFFFFF;
    }

    .hero-sale-grid .sale-name {
      font-size: 15px;
      font-weight: 700;
      line-height: 1.3;
      color: #111114;
    }

    .hero-sale-grid .sale-card--cable .sale-name {
      font-size: 16px;
    }

    .hero-sale-grid .sale-price-row {
      display: flex;
      gap: 8px;
      align-items: baseline;
      flex-wrap: wrap;
    }

    .hero-sale-grid .sale-price-val {
      font-size: 19px;
      font-weight: 800;
      font-family: var(--font-heading, inherit);
      color: #111114;
      line-height: 1;
    }

    .hero-sale-grid .sale-price-mrp {
      font-size: 13px;
      font-weight: 600;
      text-decoration: line-through;
      text-decoration-color: #71717A;
      color: #52525B;
      line-height: 1;
    }

    .hero-sale-grid .sale-price-gst {
      font-size: 11.5px;
      color: #6E6E78;
      font-weight: 500;
      line-height: 1;
    }

    .hero-sale-grid .sale-view-deal {
      font-size: 13px;
      font-weight: 600;
      color: #111114;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }

    .hero-sale-grid .sale-view-deal svg {
      width: 14px;
      height: 14px;
      stroke: currentColor;
      transition: transform 0.3s cubic-bezier(0.2, 0.7, 0.2, 1);
    }

    .hero-sale-grid .sale-card:hover .sale-view-deal svg {
      transform: translateX(4px);
    }

    .hero-sale-grid .sale-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .hero-sale-grid .sale-card-footer {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 10px;
    }

    .hero-sale-grid .sale-footer-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .hero-sale-grid .sale-countdown-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .hero-sale-grid .sale-countdown-tag {
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 10.5px;
      letter-spacing: 0.1em;
      color: #FF8A8F;
      font-weight: 700;
      text-transform: uppercase;
    }

    .hero-sale-grid .sale-countdown-link {
      font-size: 13px;
      font-weight: 600;
      color: #FFFFFF;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      text-decoration: none;
      transition: opacity 0.2s;
    }

    .hero-sale-grid .sale-countdown-link:hover {
      opacity: 0.85;
    }

    .hero-sale-grid .sale-countdown-link svg {
      width: 14px;
      height: 14px;
      stroke: currentColor;
      transition: transform 0.3s cubic-bezier(0.2, 0.7, 0.2, 1);
    }

    .hero-sale-grid .sale-countdown-link:hover svg {
      transform: translateX(4px);
    }

    .hero-sale-grid .sale-countdown-validity {
      font-size: 13px;
      color: #A1A1AA;
      line-height: 1.5;
    }

    .hero-sale-grid .sale-timer-wrap {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .hero-sale-grid .sale-timer-group {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .hero-sale-grid .sale-timer-num {
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 26px;
      font-weight: 700;
      color: #FFFFFF;
      line-height: 1;
    }

    .hero-sale-grid .sale-timer-lbl {
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 9.5px;
      letter-spacing: 0.12em;
      color: #A1A1AA;
      text-transform: uppercase;
      margin-top: 4px;
      line-height: 1;
    }

    .hero-sale-grid .sale-timer-sep {
      color: #52525B;
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 22px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 14px;
      user-select: none;
    }

    @keyframes sale-rise {
      0% {
        opacity: 0;
        transform: translateY(28px) scale(0.97);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @media (min-width: 900px) and (max-width: 1199px) {
      .hero-sale-grid {
        grid-template-rows: 150px 150px 150px;
      }
      .hero-sale-grid .sale-card--small .sale-well {
        width: 40% !important;
      }
    }

    @media (max-width: 899px) {
      .hero-sale-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-template-rows: 260px auto auto;
        grid-template-areas:
          "cable   cable"
          "camera  dvr"
          "power   countdown";
      }
      .hero-sale-grid .sale-card--cable {
        height: 260px;
      }
      .hero-sale-grid .sale-card--small {
        flex-direction: column !important;
        min-height: 150px;
      }
      .hero-sale-grid .sale-card--small .sale-well {
        order: -1;
        width: 100% !important;
        height: 110px !important;
        flex-shrink: 0;
      }
      .hero-sale-grid .sale-card--small .sale-body-horizontal {
        order: 1;
        width: 100%;
      }
    }

    @media (max-width: 479px) {
      .hero-sale-grid {
        grid-template-columns: 1fr;
        grid-template-rows: auto;
        grid-template-areas:
          "cable"
          "camera"
          "dvr"
          "power"
          "countdown";
      }
      .hero-sale-grid .sale-card--cable {
        height: 320px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .hero-sale-grid,
      .hero-sale-grid * {
        animation: none !important;
        transition: none !important;
      }
    }
  `;

  return (
    <div data-scan-target className="hero-sale-grid">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* 1. CABLE CARD (Spans 2 rows) */}
      <Link
        href={cableItem.href}
        className="sale-card sale-card--cable"
        aria-label={`${cableItem.name} - ${cableItem.discount}`}
      >
        <div className="sale-card-header">
          <span className="sale-cat">{cableItem.category}</span>
          <span className="sale-off sale-off--hero">{cableItem.discount}</span>
        </div>
        <div className="sale-well">
          <img src={cableItem.image} alt={cableItem.alt} data-scan-sharpen />
        </div>
        <div className="sale-card-footer">
          <div className="sale-footer-left">
            <div className="sale-name">{cableItem.name}</div>
            <div className="sale-price-row">
              <span className="sale-price-val">{cableItem.price}</span>
              <span className="sale-price-mrp">{cableItem.mrp}</span>
              {cableItem.showGst && (
                <span className="sale-price-gst">+ GST</span>
              )}
            </div>
          </div>
          <div className="sale-view-deal">
            View deal
            {arrowSvg}
          </div>
        </div>
      </Link>

      {/* 2. CAMERA CARD */}
      <Link
        href={cameraItem.href}
        data-scan-late="5"
        className="sale-card sale-card--small sale-card--camera"
        aria-label={`${cameraItem.name} - ${cameraItem.discount}`}
      >
        <div className="sale-body-horizontal">
          <div className="sale-card-header">
            <span className="sale-cat">{cameraItem.category}</span>
            <span className="sale-off">{cameraItem.discount}</span>
          </div>
          <div className="sale-name">{cameraItem.name}</div>
          <div className="sale-price-row">
            <span className="sale-price-val">{cameraItem.price}</span>
            <span className="sale-price-mrp">{cameraItem.mrp}</span>
          </div>
          <div className="sale-view-deal" style={{ marginTop: "auto" }}>
            View deal
            {arrowSvg}
          </div>
        </div>
        <div className="sale-well">
          <img src={cameraItem.image} alt={cameraItem.alt} data-scan-sharpen />
        </div>
      </Link>

      {/* 3. DVR CARD */}
      <Link
        href={dvrItem.href}
        data-scan-late="6"
        className="sale-card sale-card--small sale-card--dvr"
        aria-label={`${dvrItem.name} - ${dvrItem.discount}`}
      >
        <div className="sale-body-horizontal">
          <div className="sale-card-header">
            <span className="sale-cat">{dvrItem.category}</span>
            <span className="sale-off">{dvrItem.discount}</span>
          </div>
          <div className="sale-name">{dvrItem.name}</div>
          <div className="sale-price-row">
            <span className="sale-price-val">{dvrItem.price}</span>
            <span className="sale-price-mrp">{dvrItem.mrp}</span>
          </div>
          <div className="sale-view-deal" style={{ marginTop: "auto" }}>
            View deal
            {arrowSvg}
          </div>
        </div>
        <div className="sale-well">
          <img src={dvrItem.image} alt={dvrItem.alt} data-scan-sharpen />
        </div>
      </Link>

      {/* 4. POWER CARD */}
      <Link
        href={powerItem.href}
        data-scan-late="7"
        className="sale-card sale-card--small sale-card--power"
        aria-label={`${powerItem.name} - ${powerItem.discount}`}
      >
        <div className="sale-body-horizontal">
          <div className="sale-card-header">
            <span className="sale-cat">{powerItem.category}</span>
            <span className="sale-off">{powerItem.discount}</span>
          </div>
          <div className="sale-name">{powerItem.name}</div>
          <div className="sale-price-row">
            <span className="sale-price-val">{powerItem.price}</span>
            <span className="sale-price-mrp">{powerItem.mrp}</span>
          </div>
          <div className="sale-view-deal" style={{ marginTop: "auto" }}>
            View deal
            {arrowSvg}
          </div>
        </div>
        <div className="sale-well">
          <img src={powerItem.image} alt={powerItem.alt} data-scan-sharpen />
        </div>
      </Link>

      {/* 5. COUNTDOWN CARD */}
      <div className="sale-card--countdown" data-scan-late="8">
        <div className="sale-countdown-top">
          <span className="sale-countdown-tag">SALE ENDS IN</span>
          <Link href="/catalogue" className="sale-countdown-link">
            All deals
            {arrowSvg}
          </Link>
        </div>

        <div className="sale-countdown-validity">
          Offer valid till {formattedDate} · while stocks last
        </div>

        <div
          className="sale-timer-wrap"
          role="timer"
          aria-label={`Sale ends in ${timeLeft.days} days ${timeLeft.hours} hours ${timeLeft.minutes} minutes`}
        >
          <div className="sale-timer-group">
            <span className="sale-timer-num" suppressHydrationWarning>
              {formatNumber(timeLeft.days)}
            </span>
            <span className="sale-timer-lbl">DAYS</span>
          </div>
          <span className="sale-timer-sep" aria-hidden="true">
            :
          </span>
          <div className="sale-timer-group">
            <span className="sale-timer-num" suppressHydrationWarning>
              {formatNumber(timeLeft.hours)}
            </span>
            <span className="sale-timer-lbl">HRS</span>
          </div>
          <span className="sale-timer-sep" aria-hidden="true">
            :
          </span>
          <div className="sale-timer-group">
            <span className="sale-timer-num" suppressHydrationWarning>
              {formatNumber(timeLeft.minutes)}
            </span>
            <span className="sale-timer-lbl">MIN</span>
          </div>
          <span className="sale-timer-sep" aria-hidden="true">
            :
          </span>
          <div className="sale-timer-group">
            <span className="sale-timer-num" suppressHydrationWarning>
              {formatNumber(timeLeft.seconds)}
            </span>
            <span className="sale-timer-lbl">SEC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
