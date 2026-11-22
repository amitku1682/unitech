"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Product, ProductImage } from "@/lib/types";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  ZoomIn,
} from "lucide-react";

interface ProductGalleryProps {
  product: Product;
}

export function ProductGallery({ product }: ProductGalleryProps) {
  // 1. Initial images fallback to cover or product.images
  const initialImages: ProductImage[] = React.useMemo(() => {
    if (product.images && product.images.length > 0) {
      return product.images;
    }
    if (product.imageUrl) {
      return [
        {
          url: product.imageUrl,
          thumbUrl: product.imageUrl,
          label: "Front view",
          alt: `${product.name} — front view`,
          position: 0,
        },
      ];
    }
    return [];
  }, [product]);

  const [images, setImages] = useState<ProductImage[]>(initialImages);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);

  // Hover zoom states (Desktop only)
  const [isZooming, setIsZooming] = useState<boolean>(false);
  const [lensPos, setLensPos] = useState<{ x: number; y: number; px: number; py: number }>({
    x: 0,
    y: 0,
    px: 50,
    py: 50,
  });

  const mainImageContainerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchCurrentXRef = useRef<number | null>(null);

  // Fetch updated gallery from API if needed
  useEffect(() => {
    if (!product?.id) return;
    let isMounted = true;
    fetch(`/api/admin/products/${encodeURIComponent(product.id)}/images`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.images) && data.images.length > 0) {
          setImages(data.images);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [product.id]);

  // Keep activeIndex within bounds
  useEffect(() => {
    if (activeIndex >= images.length && images.length > 0) {
      setActiveIndex(images.length - 1);
    }
  }, [images.length, activeIndex]);

  const currentImage = images[activeIndex] || images[0] || null;

  // Preload images for instant switching & zero-lag zoom
  useEffect(() => {
    images.forEach((img) => {
      if (typeof window !== "undefined" && img?.url) {
        const i = new Image();
        i.src = img.url;
      }
    });
  }, [images]);

  // Navigation helpers
  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isViewerOpen) {
        if (e.key === "Escape") {
          setIsViewerOpen(false);
        } else if (e.key === "ArrowLeft") {
          handlePrev();
        } else if (e.key === "ArrowRight") {
          handleNext();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isViewerOpen, handlePrev, handleNext]);

  // Body scroll lock when full-screen viewer is open
  useEffect(() => {
    if (isViewerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isViewerOpen]);

  // Desktop Hover Zoom Handlers
  const handleMouseEnter = () => {
    // Check if device has pointer (mouse)
    if (window.matchMedia("(pointer: fine)").matches) {
      setIsZooming(true);
    }
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainImageContainerRef.current) return;
    const rect = mainImageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Lens is 38% of container width & height
    const lensW = rect.width * 0.38;
    const lensH = rect.height * 0.38;

    // Clamp lens position
    let left = x - lensW / 2;
    let top = y - lensH / 2;

    if (left < 0) left = 0;
    if (top < 0) top = 0;
    if (left > rect.width - lensW) left = rect.width - lensW;
    if (top > rect.height - lensH) top = rect.height - lensH;

    // Percentage for background position inside zoom pane
    const px = ((left) / (rect.width - lensW)) * 100;
    const py = ((top) / (rect.height - lensH)) * 100;

    setLensPos({
      x: left,
      y: top,
      px: Math.max(0, Math.min(100, px)),
      py: Math.max(0, Math.min(100, py)),
    });
  };

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchCurrentXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchCurrentXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current !== null && touchCurrentXRef.current !== null) {
      const deltaX = touchStartXRef.current - touchCurrentXRef.current;
      const SWIPE_THRESHOLD = 40;
      if (deltaX > SWIPE_THRESHOLD) {
        handleNext();
      } else if (deltaX < -SWIPE_THRESHOLD) {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
    touchCurrentXRef.current = null;
  };

  const hasMultiple = images.length > 1;

  return (
    <div className="pdp-gallery relative w-full select-none">
      <style jsx global>{`
        @keyframes gal-fade-in {
          from {
            opacity: 0;
            transform: scale(0.985);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes gal-zoom-pop {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .gal-crossfade {
          animation: gal-fade-in 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .gal-zoom-pane {
          animation: gal-zoom-pop 140ms ease-out forwards;
        }
      `}</style>

      {/* ======================================================== */}
      {/* DESKTOP (>=1024px) & TABLET VIEW                         */}
      {/* ======================================================== */}
      <div className="hidden lg:flex items-start gap-4 xl:gap-5 relative">
        {/* Left Thumbnail Rail (hidden if only 1 image) */}
        {hasMultiple && (
          <div
            className="flex flex-col gap-2.5 shrink-0 max-h-[500px] overflow-y-auto pr-1 py-0.5 custom-scrollbar"
            role="tablist"
            aria-label="Product thumbnails"
          >
            {images.map((img, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
                    }
                  }}
                  className={`relative w-[76px] h-[76px] rounded-xl overflow-hidden border transition-all duration-200 bg-white flex items-center justify-center p-1.5 focus:outline-none ${
                    isActive
                      ? "border-unitech-red shadow-sm"
                      : "border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100"
                  }`}
                  style={
                    isActive
                      ? {
                          borderColor: "#E3141B",
                          boxShadow: "0 0 0 3px rgba(227, 20, 27, 0.2)",
                        }
                      : {}
                  }
                  title={`${img.label || `Photo ${idx + 1}`} - Click to view`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.thumbUrl || img.url}
                    alt={img.alt || `${product.name} thumbnail ${idx + 1}`}
                    className="max-w-full max-h-full object-contain mix-blend-multiply"
                    loading="lazy"
                  />
                  {/* Active Indicator dot */}
                  {isActive && (
                    <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-unitech-red ring-2 ring-white" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Main Image Stage Box */}
        <div className="flex-1 relative">
          <div
            ref={mainImageContainerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            onClick={() => setIsViewerOpen(true)}
            className="group relative w-full aspect-square rounded-[20px] bg-white border border-slate-200/90 shadow-xs flex items-center justify-center p-6 sm:p-8 overflow-hidden cursor-zoom-in transition-all"
          >
            {/* Branded CCTV Corner Crosshairs */}
            <div className="absolute top-3.5 left-3.5 w-3.5 h-3.5 border-t-2 border-l-2 border-slate-300 group-hover:border-unitech-red/60 transition-colors pointer-events-none" />
            <div className="absolute top-3.5 right-3.5 w-3.5 h-3.5 border-t-2 border-r-2 border-slate-300 group-hover:border-unitech-red/60 transition-colors pointer-events-none" />
            <div className="absolute bottom-3.5 left-3.5 w-3.5 h-3.5 border-b-2 border-l-2 border-slate-300 group-hover:border-unitech-red/60 transition-colors pointer-events-none" />
            <div className="absolute bottom-3.5 right-3.5 w-3.5 h-3.5 border-b-2 border-r-2 border-slate-300 group-hover:border-unitech-red/60 transition-colors pointer-events-none" />

            {/* Main Image with smooth crossfade */}
            {currentImage ? (
              <div
                key={currentImage.url + activeIndex}
                className="gal-crossfade relative z-10 w-full h-full flex flex-col items-center justify-center p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentImage.url}
                  alt={currentImage.alt || product.name}
                  className="max-w-[92%] max-h-[86%] w-auto h-auto object-contain mix-blend-multiply filter contrast-[1.02] transition-transform duration-300 group-hover:scale-102"
                />
                {/* Floor pedestal shadow */}
                <div className="w-3/5 max-w-[280px] h-4 bg-slate-900/10 rounded-full blur-lg pointer-events-none -mt-2" />
              </div>
            ) : (
              <PlaceholderImage
                type="camera"
                title={product.placeholderLabel || product.name}
                subtitle={product.placeholderSubtext || "Unitech Precision Spec"}
                aspectRatio="square"
                className="w-full h-full border-none shadow-none bg-transparent"
              />
            )}

            {/* Zoom Lens Follower (38% x 38%) */}
            {isZooming && currentImage && (
              <div
                className="absolute border border-unitech-red/60 bg-unitech-red/10 backdrop-blur-[1px] pointer-events-none z-20 transition-opacity duration-100 rounded-lg shadow-sm"
                style={{
                  width: "38%",
                  height: "38%",
                  left: `${lensPos.x}px`,
                  top: `${lensPos.y}px`,
                }}
              />
            )}

            {/* Micro-Overlay: Top-Right Full-Screen / Expand Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsViewerOpen(true);
              }}
              className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-lg bg-white/90 hover:bg-white text-slate-700 hover:text-slate-950 border border-slate-200/90 shadow-2xs backdrop-blur-xs flex items-center justify-center transition-all opacity-80 group-hover:opacity-100"
              title="Full screen view (Esc to close)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Micro-Overlay: Bottom-Left Photo Label */}
            {currentImage?.label && (
              <div className="absolute bottom-3.5 left-3.5 z-20 pointer-events-none">
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-md bg-white/90 text-slate-800 border border-slate-200/90 shadow-2xs backdrop-blur-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-unitech-red" />
                  {currentImage.label}
                </span>
              </div>
            )}

            {/* Micro-Overlay: Bottom-Right Photo Counter (Mono font) */}
            {hasMultiple && (
              <div className="absolute bottom-3.5 right-3.5 z-20 pointer-events-none">
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-md bg-slate-900/80 text-white shadow-2xs backdrop-blur-xs tracking-wider">
                  {activeIndex + 1} / {images.length}
                </span>
              </div>
            )}

            {/* Left / Right Floating Navigation Arrows (appear on hover, hidden if 1 photo) */}
            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-800 border border-slate-200/90 shadow-md backdrop-blur-xs flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95"
                  title="Previous photo (←)"
                >
                  <ChevronLeft className="w-5 h-5 -ml-0.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-800 border border-slate-200/90 shadow-md backdrop-blur-xs flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95"
                  title="Next photo (→)"
                >
                  <ChevronRight className="w-5 h-5 -mr-0.5" />
                </button>
              </>
            )}
          </div>

          {/* Caption underneath the media box */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-2 px-1">
            <span className="flex items-center gap-1.5">
              <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
              Hover to zoom · click for full screen
            </span>
            {hasMultiple && (
              <span className="font-mono text-slate-400">
                {activeIndex + 1} of {images.length} photos
              </span>
            )}
          </div>

          {/* Illustrative Disclaimer Note */}
          <p className="text-[11.5px] sm:text-xs text-slate-900 font-black tracking-tight pt-2.5 px-1 leading-snug">
            *Images are for illustrative purposes. Actual product appearance and specifications may vary.
          </p>

          {/* 560px Hover Zoom Flyout Pane (Floats over the right column at 260% scale) */}
          {isZooming && currentImage && (
            <div
              className="gal-zoom-pane absolute top-0 left-[calc(100%+16px)] xl:left-[calc(100%+24px)] w-[480px] xl:w-[560px] h-[480px] xl:h-[560px] bg-white rounded-2xl border border-slate-300 shadow-2xl z-40 overflow-hidden pointer-events-none"
              style={{
                backgroundImage: `url(${currentImage.url})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: "260%",
                backgroundPosition: `${lensPos.px}% ${lensPos.py}%`,
              }}
            >
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2.5 py-1 rounded-md font-bold tracking-wider">
                260% HIGH-RES OPTICAL ZOOM
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MOBILE & TABLET (<1024px) SWIPE CAROUSEL                 */}
      {/* ======================================================== */}
      <div className="lg:hidden w-full space-y-3">
        {/* Carousel Container */}
        <div
          className="relative w-full aspect-square rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center p-4 overflow-hidden touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => setIsViewerOpen(true)}
        >
          {/* CCTV Corner Crosshairs */}
          <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-slate-300 pointer-events-none" />
          <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-slate-300 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-slate-300 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-slate-300 pointer-events-none" />

          {/* Main Photo */}
          {currentImage ? (
            <div
              key={currentImage.url + activeIndex}
              className="gal-crossfade relative z-10 w-full h-full flex flex-col items-center justify-center p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentImage.url}
                alt={currentImage.alt || product.name}
                className="max-w-[94%] max-h-[88%] w-auto h-auto object-contain mix-blend-multiply"
              />
              <div className="w-3/5 max-w-[220px] h-3 bg-slate-900/10 rounded-full blur-md pointer-events-none -mt-2" />
            </div>
          ) : (
            <PlaceholderImage
              type="camera"
              title={product.placeholderLabel || product.name}
              subtitle={product.placeholderSubtext || "Unitech Precision Spec"}
              aspectRatio="square"
              className="w-full h-full border-none shadow-none bg-transparent"
            />
          )}

          {/* Top-Left: Label Chip */}
          {currentImage?.label && (
            <div className="absolute top-3 left-3 z-20 pointer-events-none">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/90 text-slate-800 border border-slate-200 shadow-2xs backdrop-blur-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-unitech-red" />
                {currentImage.label}
              </span>
            </div>
          )}

          {/* Top-Right: Counter Chip */}
          {hasMultiple && (
            <div className="absolute top-3 right-3 z-20 pointer-events-none">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900/80 text-white shadow-2xs backdrop-blur-xs tracking-wider">
                {activeIndex + 1} / {images.length}
              </span>
            </div>
          )}

          {/* Mobile Arrows */}
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 text-slate-800 border border-slate-200 shadow-sm flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 text-slate-800 border border-slate-200 shadow-sm flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Bottom Dot Pagination Indicator */}
          {hasMultiple && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/40 backdrop-blur-xs">
              {images.map((_, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isActive ? "w-5 bg-unitech-red" : "w-1.5 bg-white/70 hover:bg-white"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Horizontal Scrolling Thumbnail Strip (56x56px) */}
        {hasMultiple && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 custom-scrollbar">
            {images.map((img, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`relative w-14 h-14 rounded-xl shrink-0 overflow-hidden border bg-white p-1 flex items-center justify-center transition-all ${
                    isActive
                      ? "border-unitech-red ring-2 ring-unitech-red/20 shadow-xs"
                      : "border-slate-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.thumbUrl || img.url}
                    alt={img.alt || `Photo ${idx + 1}`}
                    className="max-w-full max-h-full object-contain mix-blend-multiply"
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Illustrative Disclaimer Note (Mobile) */}
        <p className="text-[11px] text-slate-900 font-black tracking-tight text-center pt-1.5 px-1 leading-snug">
          *Images are for illustrative purposes. Actual product appearance and specifications may vary.
        </p>
      </div>

      {/* ======================================================== */}
      {/* FULL-SCREEN VIEWER MODAL OVERLAY                         */}
      {/* ======================================================== */}
      {isViewerOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col justify-between p-4 sm:p-6 md:p-8 backdrop-blur-md animate-fade-in"
          style={{ backgroundColor: "rgba(10, 10, 12, 0.94)" }}
          role="dialog"
          aria-modal="true"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between z-10 w-full max-w-6xl mx-auto pb-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-white/10 text-white border border-white/10">
                {product.modelCode}
              </span>
              <div>
                <h3 className="text-white font-heading font-black text-sm sm:text-base line-clamp-1">
                  {product.name}
                </h3>
                {currentImage?.label && (
                  <span className="text-xs text-red-400 font-medium">
                    {currentImage.label}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasMultiple && (
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/10 text-white border border-white/15">
                  {activeIndex + 1} / {images.length}
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsViewerOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/15 focus:outline-none"
                title="Close viewer (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Central Stage Image */}
          <div className="relative flex-1 flex items-center justify-center max-w-5xl mx-auto w-full my-4">
            {hasMultiple && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-0 sm:left-4 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center transition-all hover:scale-105"
                title="Previous photo (←)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {currentImage && (
              <div
                key={currentImage.url + activeIndex}
                className="gal-crossfade w-full h-full flex flex-col items-center justify-center p-4 sm:p-8"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentImage.url}
                  alt={currentImage.alt || product.name}
                  className="max-w-full max-h-[68vh] object-contain drop-shadow-2xl"
                />
                <p className="text-[11px] sm:text-xs text-white/90 font-black tracking-tight mt-3 text-center">
                  *Images are for illustrative purposes. Actual product appearance and specifications may vary.
                </p>
              </div>
            )}

            {hasMultiple && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-0 sm:right-4 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center transition-all hover:scale-105"
                title="Next photo (→)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Strip (64px) */}
          {hasMultiple && (
            <div className="z-10 w-full max-w-3xl mx-auto flex items-center justify-center gap-2 overflow-x-auto py-2 custom-scrollbar">
              {images.map((img, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border bg-white/5 p-1 flex items-center justify-center transition-all ${
                      isActive
                        ? "border-unitech-red ring-2 ring-unitech-red/50 scale-105 bg-white/15"
                        : "border-white/15 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.thumbUrl || img.url}
                      alt={img.alt || `Thumbnail ${idx + 1}`}
                      className="max-w-full max-h-full object-contain"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
