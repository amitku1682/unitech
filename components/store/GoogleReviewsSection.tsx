"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { GoogleReview } from "@/lib/types";
import {
  Star,
  ShieldCheck,
  ExternalLink,
  QrCode,
  ThumbsUp,
  X,
  Sparkles,
} from "lucide-react";

interface GoogleReviewsSectionProps {
  reviews: GoogleReview[];
}

export function GoogleReviewsSection({ reviews }: GoogleReviewsSectionProps) {
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [animationStage, setAnimationStage] = useState<
    "idle" | "intro_star" | "shatter_burst" | "cards_bloom" | "settled"
  >("idle");
  const sectionRef = useRef<HTMLElement>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Strictly enforce max limit of top 5 featured reviews on the storefront
  const featuredReviews = reviews.filter((r) => r.isFeatured).slice(0, 5);

  // Official verified Google Profile URL (Review Write Form with 5-star rating)
  const GOOGLE_WRITE_REVIEW_URL =
    "https://www.google.com/search?q=unitech+security+systems+pvt.+ltd.+address&ludocid=3536483869333144352#lrd=0x390cfa51d9915ee9:0x31141d5791804320,3,,,,";

  // Official verified Google Profile URL (Full Reviews Verification Panel)
  const GOOGLE_VERIFY_URL =
    "https://www.google.com/search?q=unitech+security+systems+pvt.+ltd.+address&ludocid=3536483869333144352#lrd=0x390cfa51d9915ee9:0x31141d5791804320,1,,,,";

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  // Trigger the full Star Supernova sequence (~3.2s grand cinematic progression)
  const runSupernovaSequence = useCallback(() => {
    clearAllTimeouts();
    setAnimationStage("intro_star");

    // Phase 1: Giant Golden Star emerges and holds/pulses with grand illumination (0ms - 1300ms)
    const t1 = setTimeout(() => {
      // Phase 2: Supernova Explosion & Star Shatters into 5 flying shards (1300ms - 2300ms)
      setAnimationStage("shatter_burst");
    }, 1300);

    // Phase 3: Star Shards expand into the 5 Review Cards with staggered elastic bloom (2300ms - 3100ms)
    const t2 = setTimeout(() => {
      setAnimationStage("cards_bloom");
    }, 2300);

    // Phase 4: Settle into crystal-clear readable state (3100ms+)
    const t3 = setTimeout(() => {
      setAnimationStage("settled");
    }, 3100);

    timeoutsRef.current = [t1, t2, t3];
  }, []);

  // IntersectionObserver: trigger continuously every time user scrolls to google review section
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          runSupernovaSequence();
        } else {
          // Reset to idle when user leaves section so it replays fresh when scrolling back
          clearAllTimeouts();
          setAnimationStage("idle");
        }
      },
      { threshold: 0.18 }
    );

    observer.observe(el);
    return () => {
      clearAllTimeouts();
      observer.disconnect();
    };
  }, [runSupernovaSequence]);

  return (
    <section
      ref={sectionRef}
      id="google-reviews"
      className="py-14 sm:py-20 bg-[#faf9f5] border-y border-slate-200/80 relative overflow-hidden select-none"
    >
      {/* ------------------------------------------------------------- */}
      {/* CSS KEYFRAME ANIMATIONS FOR THE STAR EXPLOSION SEQUENCE       */}
      {/* ------------------------------------------------------------- */}
      <style jsx global>{`
        @keyframes starSupernovaIn {
          0% {
            opacity: 0;
            transform: scale(0.2) rotate(-45deg);
            filter: drop-shadow(0 0 0 rgba(245, 158, 11, 0));
          }
          65% {
            opacity: 1;
            transform: scale(1.18) rotate(10deg);
            filter: drop-shadow(0 0 45px rgba(245, 158, 11, 0.9));
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
            filter: drop-shadow(0 0 30px rgba(245, 158, 11, 0.7));
          }
        }

        @keyframes starShockwaveRing {
          0% {
            transform: scale(0.5);
            opacity: 1;
            border-width: 6px;
          }
          100% {
            transform: scale(3.2);
            opacity: 0;
            border-width: 1px;
          }
        }

        @keyframes starShardFly1 {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(-380px, 30px) scale(1.3) rotate(-60deg);
            opacity: 0;
          }
        }

        @keyframes starShardFly2 {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(-190px, -15px) scale(1.2) rotate(-30deg);
            opacity: 0;
          }
        }

        @keyframes starShardFly3 {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(0px, -40px) scale(1.4) rotate(15deg);
            opacity: 0;
          }
        }

        @keyframes starShardFly4 {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(190px, -15px) scale(1.2) rotate(30deg);
            opacity: 0;
          }
        }

        @keyframes starShardFly5 {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(380px, 30px) scale(1.3) rotate(60deg);
            opacity: 0;
          }
        }

        @keyframes reviewCardBloom {
          0% {
            opacity: 0;
            transform: scale(0.72) translateY(28px);
          }
          65% {
            opacity: 1;
            transform: scale(1.035) translateY(-3px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes starGlint {
          0% {
            transform: scale(0.7);
            filter: brightness(1);
          }
          50% {
            transform: scale(1.25);
            filter: brightness(1.6);
          }
          100% {
            transform: scale(1);
            filter: brightness(1);
          }
        }

        .anim-supernova-star {
          animation: starSupernovaIn 1.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        .anim-shockwave-ring {
          animation: starShockwaveRing 1.1s ease-out 0.2s both;
        }

        .anim-shard-1 { animation: starShardFly1 0.95s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .anim-shard-2 { animation: starShardFly2 0.95s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .anim-shard-3 { animation: starShardFly3 0.95s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .anim-shard-4 { animation: starShardFly4 0.95s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .anim-shard-5 { animation: starShardFly5 0.95s cubic-bezier(0.16, 1, 0.3, 1) both; }

        .anim-card-bloom-0 { animation: reviewCardBloom 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.08s both; }
        .anim-card-bloom-1 { animation: reviewCardBloom 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.16s both; }
        .anim-card-bloom-2 { animation: reviewCardBloom 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.24s both; }
        .anim-card-bloom-3 { animation: reviewCardBloom 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.32s both; }
        .anim-card-bloom-4 { animation: reviewCardBloom 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.40s both; }

        .anim-star-glint {
          animation: starGlint 0.55s ease-out both;
        }
      `}</style>

      {/* Ambient Radial Golden Glow behind the reviews grid */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-amber-200/25 rounded-full blur-3xl pointer-events-none" />

      {/* Full Width Container matching complete site spacing */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 relative z-10">
        
        {/* Top Header Strip */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 sm:mb-10 gap-6 border-b border-slate-200/80 pb-6 sm:pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/90 mb-2.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Verified Social Proof Engine</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight leading-tight">
              Trusted by 10,000+ CCTV Dealers & Integrators
            </h2>
            <p className="text-slate-600 text-sm sm:text-base font-semibold mt-1.5 max-w-2xl leading-relaxed">
              Authentic reviews from contractors, system integrators, and surveillance buyers across
              India relying on Unitech hardware.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Official Google Rating Counter Card */}
            <div className="flex items-center gap-4 bg-white border border-slate-200/90 p-4 sm:p-5 rounded-2xl shadow-xs shrink-0 self-stretch sm:self-auto justify-between sm:justify-start">
              {/* Google "G" Icon */}
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center p-2.5 shadow-inner shrink-0">
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-heading text-2xl sm:text-3xl font-black text-slate-950">4.2</span>
                  <div className="flex text-amber-400">
                    {[...Array(4)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                    <Star className="w-4 h-4 fill-amber-400/40" />
                  </div>
                </div>
                <span className="text-xs sm:text-[13px] text-slate-500 font-semibold">Based on 60 Google Reviews</span>
              </div>

              <a
                href={GOOGLE_VERIFY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200/80 cursor-pointer"
              >
                <span>Verify</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* REVIEWS STAGE: CENTRAL STAR SUPERNOVA OVERLAY + 5 CARDS GRID  */}
        {/* ------------------------------------------------------------- */}
        <div className="relative min-h-[290px] mb-8 sm:mb-10">

          {/* Central Star Supernova Burst Layer (Active during intro & shatter) */}
          {(animationStage === "intro_star" || animationStage === "shatter_burst") && (
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
              {/* Expanding Shockwave Ring */}
              <div className="absolute w-44 h-44 rounded-full border-4 border-amber-400/80 anim-shockwave-ring" />

              {/* Central Glowing Star Cluster */}
              <div className="relative flex flex-col items-center justify-center anim-supernova-star">
                <div className="relative">
                  <Star className="w-24 h-24 sm:w-28 sm:h-28 text-amber-400 fill-amber-400 filter drop-shadow-[0_0_35px_rgba(245,158,11,0.85)]" />
                  <Sparkles className="w-8 h-8 text-white absolute top-2 right-2 animate-ping" />
                </div>
                <div className="mt-2 px-4 py-1.5 rounded-full bg-slate-950/90 text-amber-300 font-heading font-black text-xs sm:text-sm tracking-wider uppercase border border-amber-400/50 shadow-xl backdrop-blur-md">
                  ★ 4.2 Google Verified Rating
                </div>
              </div>

              {/* 5 Radiant Star Shards Shattering Outward toward the 5 cards */}
              {animationStage === "shatter_burst" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="absolute anim-shard-1 text-amber-400">
                    <Star className="w-9 h-9 fill-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.9)]" />
                  </div>
                  <div className="absolute anim-shard-2 text-amber-400">
                    <Star className="w-8 h-8 fill-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.9)]" />
                  </div>
                  <div className="absolute anim-shard-3 text-amber-400">
                    <Star className="w-10 h-10 fill-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.9)]" />
                  </div>
                  <div className="absolute anim-shard-4 text-amber-400">
                    <Star className="w-8 h-8 fill-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.9)]" />
                  </div>
                  <div className="absolute anim-shard-5 text-amber-400">
                    <Star className="w-9 h-9 fill-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.9)]" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reviews Cards Grid (Strict Top 5 Responsive Showcase) */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-5 xl:gap-6 items-stretch transition-opacity duration-300 ${
              animationStage === "idle" || animationStage === "intro_star"
                ? "opacity-0"
                : "opacity-100"
            }`}
          >
            {featuredReviews.map((rev, idx) => {
              const bloomClass =
                animationStage === "cards_bloom" ? `anim-card-bloom-${idx}` : "";

              return (
                <div
                  key={rev.id}
                  className={`bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-5.5 flex flex-col justify-between hover:border-amber-400/90 hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 group relative ${bloomClass}`}
                >
                  <div>
                    {/* Star rating */}
                    <div className="flex items-center gap-1 text-amber-400 mb-3">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 fill-amber-400 ${
                            animationStage === "cards_bloom" ? "anim-star-glint" : ""
                          }`}
                          style={{
                            animationDelay: `${idx * 0.08 + i * 0.04}s`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Review Text - Clean, Crisp & High Legibility */}
                    <p className="text-slate-700 text-xs sm:text-[13.5px] leading-relaxed mb-4 font-normal line-clamp-5">
                      &quot;{rev.reviewText}&quot;
                    </p>
                  </div>

                  {/* Author & Source (Authentic Google Format: Name + Date) */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs mt-auto">
                    <div className="flex items-center gap-2.5 min-w-0 pr-1">
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-xs shrink-0 shadow-2xs group-hover:bg-amber-50 group-hover:border-amber-200 transition-colors">
                        {rev.authorName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-[13px] truncate">
                          {rev.authorName}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-medium block truncate">
                          {rev.relativeTime}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/70 shrink-0">
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Google</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review Booster Strip - Full Width & High Contrast */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-unitech-red flex items-center justify-center shrink-0 border border-red-200/80 shadow-2xs">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-slate-950">
                Installed Unitech hardware recently?
              </div>
              <div className="text-xs sm:text-[13px] text-slate-600 font-normal mt-0.5">
                Help fellow installers and contractors across India by reviewing your experience on Google.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/90 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-slate-600" />
              <span>Review QR Code</span>
            </button>

            <a
              href={GOOGLE_WRITE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold bg-unitech-red hover:bg-unitech-darkred text-white flex items-center gap-2 transition-all shadow-[0_4px_16px_rgba(230,0,0,0.3)] hover:shadow-[0_6px_20px_rgba(230,0,0,0.4)] hover:-translate-y-0.5 active:scale-98 cursor-pointer"
            >
              <span>Write a Review on Google</span>
              <ExternalLink className="w-4 h-4 stroke-[2.5]" />
            </a>
          </div>
        </div>

      </div>

      {/* QR Code Modal Dialog */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-slate-200 shadow-2xl relative text-center">
            <button
              type="button"
              onClick={() => setQrModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-red-50 text-unitech-red rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="font-heading font-black text-slate-900 text-lg sm:text-xl">
              Scan to Review Unitech
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Scan this QR code with any phone camera to open our official Google Business review page.
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl inline-block shadow-inner mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  GOOGLE_WRITE_REVIEW_URL
                )}`}
                alt="Unitech Google Review QR Code"
                className="w-48 h-48 mx-auto rounded-lg"
              />
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              Unitech Security Systems Pvt. Ltd. · Sahibabad Plant
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
