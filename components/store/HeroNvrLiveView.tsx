"use client";

import React, { useState, useEffect } from "react";

export interface HeroNvrLiveViewProps {
  tileImages?: {
    ch1?: string;
    ch2?: string;
    ch3?: string;
    ch4?: string;
  };
}

export function HeroNvrLiveView({ tileImages }: HeroNvrLiveViewProps) {
  // Live clock: ticks every second, starts on mount, clears on unmount
  const [clock, setClock] = useState<{ full: string; timeOnly: string }>({
    full: "15-11-2026 12:00:00",
    timeOnly: "12:00:00",
  });

  useEffect(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const updateTime = () => {
      const now = new Date();
      const d = pad(now.getDate());
      const m = pad(now.getMonth() + 1);
      const y = now.getFullYear();
      const hh = pad(now.getHours());
      const mm = pad(now.getMinutes());
      const ss = pad(now.getSeconds());
      setClock({
        full: `${d}-${m}-${y} ${hh}:${mm}:${ss}`,
        timeOnly: `${hh}:${mm}:${ss}`,
      });
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const CHANNELS = [
    { id: "CH1", name: "Main gate", active: true },
    { id: "CH2", name: "Parking", active: true },
    { id: "CH3", name: "Reception", active: true },
    { id: "CH4", name: "Warehouse", active: true },
    { id: "CH5", name: "—", active: false },
    { id: "CH6", name: "—", active: false },
    { id: "CH7", name: "—", active: false },
    { id: "CH8", name: "—", active: false },
  ];

  return (
    <div className="hero-nvr">
      {/* Scoped CSS styles & animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap');

        .hero-nvr {
          position: relative;
          width: 100%;
          max-width: 840px;
          padding-bottom: 96px;
          animation: nvr-enter 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) 0.1s both;
        }

        .hero-nvr .nvr-window {
          background-color: #0E1014;
          border: 1px solid #23262D;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 60px 100px -40px rgba(17, 17, 20, 0.7);
        }

        .hero-nvr .nvr-mono {
          font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        .hero-nvr .nvr-dvr-wrapper {
          width: 42%;
        }

        @keyframes nvr-enter {
          0% {
            opacity: 0;
            transform: translateX(60px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes nvr-rec {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.25;
          }
        }

        @keyframes nvr-blink {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.2;
          }
        }

        @keyframes nvr-noise {
          0% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(-2%, 1%);
          }
          50% {
            transform: translate(1%, -2%);
          }
          75% {
            transform: translate(2%, 2%);
          }
          100% {
            transform: translate(0, 0);
          }
        }

        @keyframes nvr-car {
          0% {
            transform: translateX(-40%);
          }
          100% {
            transform: translateX(140%);
          }
        }

        @keyframes nvr-walk {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(60%);
          }
        }

        @keyframes nvr-playhead {
          0% {
            left: 8%;
          }
          100% {
            left: 92%;
          }
        }

        @media (max-width: 899px) {
          .hero-nvr .nvr-channels {
            display: none !important;
          }
          .hero-nvr .nvr-hdd-info {
            display: none !important;
          }
          .hero-nvr .nvr-dvr-wrapper {
            width: 56% !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-nvr,
          .hero-nvr * {
            animation: none !important;
          }
        }
      `,
        }}
      />

      {/* ========================================================= */}
      {/* LAYER A: THE NVR "SCREEN" WINDOW                         */}
      {/* ========================================================= */}
      <div
        data-scan-target
        className="nvr-window relative"
        role="img"
        aria-label="Unitech NVR live view showing four colour night-vision camera feeds"
      >
        {/* 2.1 Top bar */}
        <div
          className="nvr-topbar flex items-center gap-[14px] px-[14px] py-[10px] border-b border-[#1E2128]"
          style={{ color: "#C9CDD4", fontSize: "12px" }}
        >
          {/* Left branding */}
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily: "var(--font-plus-jakarta), sans-serif",
                fontWeight: 800,
                letterSpacing: "0.06em",
                fontSize: "13px",
                color: "#FFFFFF",
              }}
            >
              UNITECH
            </span>
            <span style={{ opacity: 0.6, fontSize: "12px" }}>NVR · Live view</span>
          </div>

          {/* Right telemetry */}
          <div className="nvr-mono ml-auto flex items-center gap-4 text-[12px]">
            <span className="nvr-hdd-info text-[#C9CDD4]">HDD 1 TB · 62%</span>
            <span className="flex items-center gap-[6px]">
              <span
                className="rounded-full shrink-0"
                style={{
                  width: "7px",
                  height: "7px",
                  backgroundColor: "#FF3B3B",
                  animation: "nvr-rec 1.2s steps(2) infinite",
                  display: "inline-block",
                }}
              />
              <span className="text-[#C9CDD4] font-bold">REC</span>
            </span>
            <span style={{ color: "#FFFFFF" }} suppressHydrationWarning>
              {clock.full}
            </span>
          </div>
        </div>

        {/* 2.2 Body = Sidebar + 2x2 Video Grid */}
        <div className="flex">
          {/* Sidebar Channels (hidden below 900px) */}
          <div className="nvr-channels flex flex-col gap-[2px] p-[10px_8px] border-r border-[#1E2128] shrink-0">
            {CHANNELS.map((ch) => (
              <div
                key={ch.id}
                className="flex items-center gap-2 rounded-[8px] px-[10px] py-[7px]"
                style={{
                  fontSize: "11.5px",
                  backgroundColor: ch.active ? "#1B1F27" : "transparent",
                  color: ch.active ? "#FFFFFF" : "#C9CDD4",
                }}
              >
                <span
                  className="rounded-full shrink-0"
                  style={{
                    width: "7px",
                    height: "7px",
                    backgroundColor: ch.active ? "#2BE07A" : "#3A3F48",
                  }}
                />
                <span className="nvr-mono font-medium">{ch.id}</span>
                <span style={{ opacity: 0.7 }}>{ch.name}</span>
              </div>
            ))}
          </div>

          {/* Video Grid (2 Columns) */}
          <div className="nvr-grid flex-1 min-w-0 p-2 grid grid-cols-2 gap-[6px]">
            {/* Tile 1: Main gate */}
            <VideoTile
              tileId="t1"
              channel="CH1 · Main gate"
              quality="4MP · 25fps · H.265"
              timeOnly={clock.timeOnly}
              imageSrc={tileImages?.ch1}
            >
              <SceneMainGate />
            </VideoTile>

            {/* Tile 2: Parking */}
            <VideoTile
              tileId="t2"
              channel="CH2 · Parking"
              quality="4MP · 25fps · H.265"
              timeOnly={clock.timeOnly}
              imageSrc={tileImages?.ch2}
            >
              <SceneParking />
            </VideoTile>

            {/* Tile 3: Reception with MOTION box */}
            <VideoTile
              tileId="t3"
              channel="CH3 · Reception"
              quality="8MP · 20fps · H.265"
              timeOnly={clock.timeOnly}
              imageSrc={tileImages?.ch3}
              hasMotionBox
            >
              <SceneReception />
            </VideoTile>

            {/* Tile 4: Warehouse */}
            <VideoTile
              tileId="t4"
              channel="CH4 · Warehouse"
              quality="4MP · 25fps · H.265"
              timeOnly={clock.timeOnly}
              imageSrc={tileImages?.ch4}
            >
              <SceneWarehouse />
            </VideoTile>
          </div>
        </div>

        {/* 2.4 Bottom Timeline Bar */}
        <div className="nvr-topbar px-[14px] pt-[10px] pb-[12px] border-t border-[#1E2128] flex items-center gap-3">
          <span className="nvr-mono text-[11px] text-[#9EA3AB]">00:00</span>

          {/* Track */}
          <div className="relative flex-1 h-[14px] rounded-[4px] bg-[#1B1F27] overflow-visible">
            {/* Event marks */}
            <div
              className="absolute top-[3px] h-[8px] rounded-[2px]"
              style={{ left: "10%", width: "6%", backgroundColor: "#E3141B" }}
            />
            <div
              className="absolute top-[3px] h-[8px] rounded-[2px]"
              style={{ left: "24%", width: "3%", backgroundColor: "#E3141B" }}
            />
            <div
              className="absolute top-[3px] h-[8px] rounded-[2px]"
              style={{ left: "41%", width: "8%", backgroundColor: "#F5A623" }}
            />
            <div
              className="absolute top-[3px] h-[8px] rounded-[2px]"
              style={{ left: "60%", width: "4%", backgroundColor: "#E3141B" }}
            />
            <div
              className="absolute top-[3px] h-[8px] rounded-[2px]"
              style={{ left: "74%", width: "10%", backgroundColor: "#F5A623" }}
            />

            {/* Playhead */}
            <div
              className="absolute pointer-events-none"
              style={{
                width: "2px",
                height: "20px",
                top: "-3px",
                backgroundColor: "#FFFFFF",
                boxShadow: "0 0 6px #ffffff",
                animation: "nvr-playhead 20s linear infinite",
              }}
            />
          </div>

          <span className="nvr-mono text-[11px] text-[#9EA3AB]">24:00</span>

          {/* Legend */}
          <div className="nvr-mono flex items-center gap-[10px] text-[10.5px] text-[#9EA3AB] pl-1">
            <span className="flex items-center gap-1.5">
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#E3141B",
                  borderRadius: "1px",
                  display: "inline-block",
                }}
              />
              <span>Motion</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#F5A623",
                  borderRadius: "1px",
                  display: "inline-block",
                }}
              />
              <span>Alarm</span>
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* LAYER B: THE DVR IMAGE UNDER THE SCREEN                   */}
      {/* ========================================================= */}
      <div
        data-scan-target
        className="nvr-dvr-wrapper absolute pointer-events-none z-10"
        style={{
          left: "50%",
          bottom: "-8px",
          transform: "translateX(-50%)",
        }}
      >
        <div className="relative w-full">
          <img
            src="/images/products/utnr-832-tight.png"
            alt="Unitech H.265 DVR"
            className="w-full h-auto block"
            style={{
              filter: "drop-shadow(0 26px 26px rgba(17, 17, 20, 0.35))",
            }}
          />
          {/* Status LED */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: "5px",
              height: "5px",
              left: "4%",
              top: "28%",
              backgroundColor: "#2BE07A",
              boxShadow: "0 0 8px #2BE07A",
              animation: "nvr-blink 1.4s ease-in-out infinite",
            }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}

// =================================================================
// VIDEO TILE WRAPPER
// =================================================================
interface VideoTileProps {
  tileId: string;
  channel: string;
  quality: string;
  timeOnly: string;
  imageSrc?: string;
  hasMotionBox?: boolean;
  children: React.ReactNode;
}

function VideoTile({
  tileId,
  channel,
  quality,
  timeOnly,
  imageSrc,
  hasMotionBox,
  children,
}: VideoTileProps) {
  return (
    <div
      className="relative rounded-[6px] overflow-hidden bg-black select-none"
      style={{ aspectRatio: "16 / 10" }}
    >
      {/* 1. Scene or Image */}
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={channel}
          className="w-full h-full object-cover block"
        />
      ) : (
        children
      )}

      {/* 2. Camera Noise Overlay */}
      <div
        className="pointer-events-none absolute"
        style={{
          inset: "-10%",
          width: "120%",
          height: "120%",
          opacity: 0.22,
          mixBlendMode: "overlay",
          animation: "nvr-noise 0.4s steps(4) infinite",
        }}
        aria-hidden="true"
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <filter id={`noise-${tileId}`} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves={1} result="noise" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#noise-${tileId})`} fill="#ffffff" />
        </svg>
      </div>

      {/* 3. Top-left label */}
      <div
        className="nvr-mono pointer-events-none absolute z-[2] flex items-center gap-[5px]"
        style={{
          left: "8px",
          top: "7px",
          fontSize: "10px",
          color: "#E6E8EC",
          textShadow: "0 1px 2px #000000",
        }}
      >
        <span
          className="rounded-full shrink-0"
          style={{
            width: "6px",
            height: "6px",
            backgroundColor: "#FF3B3B",
            animation: "nvr-rec 1.2s steps(2) infinite",
            display: "inline-block",
          }}
        />
        <span>{channel}</span>
      </div>

      {/* 4. Top-right label */}
      <div
        className="nvr-mono pointer-events-none absolute z-[2]"
        style={{
          right: "8px",
          top: "7px",
          fontSize: "10px",
          color: "#C9CDD4",
          textShadow: "0 1px 2px #000000",
        }}
        suppressHydrationWarning
      >
        {timeOnly}
      </div>

      {/* 5. Bottom-left label */}
      <div
        className="nvr-mono pointer-events-none absolute z-[2]"
        style={{
          left: "8px",
          bottom: "6px",
          fontSize: "9.5px",
          color: "#9EA3AB",
          textShadow: "0 1px 2px #000000",
        }}
      >
        {quality}
      </div>

      {/* Optional MOTION Box on Tile 3 */}
      {hasMotionBox && (
        <div
          className="pointer-events-none absolute z-[3]"
          style={{
            left: "19%",
            top: "50%",
            width: "15%",
            height: "40%",
            border: "1.5px solid #FFD84D",
            borderRadius: "2px",
            animation: "nvr-walk 10s ease-in-out infinite",
          }}
        >
          <span
            className="nvr-mono absolute block"
            style={{
              top: "-15px",
              left: "-1.5px",
              fontSize: "8.5px",
              fontWeight: 700,
              backgroundColor: "#FFD84D",
              color: "#111111",
              padding: "1px 4px",
              borderRadius: "1px",
              lineHeight: 1.2,
            }}
          >
            MOTION
          </span>
        </div>
      )}
    </div>
  );
}

// =================================================================
// 3.1 SCENE 1: MAIN GATE
// =================================================================
function SceneMainGate() {
  return (
    <svg
      viewBox="0 0 320 200"
      className="w-full h-full block"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <filter id="blur-t1" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <radialGradient id="lamp-t1" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFE6B8" />
          <stop offset="35%" stopColor="#FFB45C" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FFB45C" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ground-t1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14161B" />
          <stop offset="55%" stopColor="#2A2622" />
          <stop offset="100%" stopColor="#3B3129" />
        </linearGradient>
        <radialGradient id="vignette-t1" cx="0.5" cy="0.5" r="0.75">
          <stop offset="60%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      {/* Ground Gradient Background */}
      <rect width="320" height="200" fill="url(#ground-t1)" />

      {/* Blurred Shapes Group */}
      <g filter="url(#blur-t1)">
        <rect x="40" y="40" width="240" height="120" fill="#3A332C" />
        {/* 11 Vertical Gate Bars */}
        {Array.from({ length: 11 }).map((_, i) => (
          <rect key={i} x={50 + i * 22} y="44" width="6" height="116" fill="#1A1714" />
        ))}
        <rect x="0" y="150" width="320" height="50" fill="#4A3F34" />
      </g>

      {/* Lamp Glows */}
      <circle cx="38" cy="36" r="46" fill="url(#lamp-t1)" />
      <circle cx="290" cy="40" r="38" fill="url(#lamp-t1)" opacity="0.8" />

      {/* Warm Tint */}
      <rect x="0" y="0" width="320" height="200" fill="#FFB45C" opacity="0.07" />

      {/* Vignette */}
      <rect x="0" y="0" width="320" height="200" fill="url(#vignette-t1)" />
    </svg>
  );
}

// =================================================================
// 3.2 SCENE 2: PARKING
// =================================================================
function SceneParking() {
  return (
    <svg
      viewBox="0 0 320 200"
      className="w-full h-full block"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <filter id="blur-t2" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <radialGradient id="lamp-t2" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFE6B8" />
          <stop offset="35%" stopColor="#FFB45C" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FFB45C" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ground-t2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14161B" />
          <stop offset="55%" stopColor="#2A2622" />
          <stop offset="100%" stopColor="#3B3129" />
        </linearGradient>
        <radialGradient id="vignette-t2" cx="0.5" cy="0.5" r="0.75">
          <stop offset="60%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      {/* Ground Background */}
      <rect width="320" height="200" fill="url(#ground-t2)" />

      {/* Blurred Shapes Group */}
      <g filter="url(#blur-t2)">
        <rect x="0" y="120" width="320" height="80" fill="#2E2A26" />
        <rect x="30" y="160" width="40" height="3" fill="#CFC3AE" opacity="0.35" />
        <rect x="120" y="160" width="40" height="3" fill="#CFC3AE" opacity="0.35" />
        <rect x="210" y="160" width="40" height="3" fill="#CFC3AE" opacity="0.35" />
        <rect x="20" y="96" width="70" height="30" rx="8" fill="#5B1E1A" />
        <rect x="210" y="98" width="80" height="30" rx="8" fill="#2D3A4A" />
      </g>

      {/* Overhead Lamp */}
      <circle cx="160" cy="20" r="60" fill="url(#lamp-t2)" opacity="0.9" />

      {/* Moving Car Group */}
      <g style={{ animation: "nvr-car 6s linear infinite" }}>
        <rect x="0" y="108" width="90" height="26" rx="9" fill="#7D7F86" filter="url(#blur-t2)" />
        <circle cx="88" cy="120" r="20" fill="url(#lamp-t2)" />
        <circle cx="86" cy="120" r="5" fill="#FFF4D8" />
      </g>

      {/* Vignette */}
      <rect x="0" y="0" width="320" height="200" fill="url(#vignette-t2)" />
    </svg>
  );
}

// =================================================================
// 3.3 SCENE 3: RECEPTION (INTERIOR)
// =================================================================
function SceneReception() {
  return (
    <svg
      viewBox="0 0 320 200"
      className="w-full h-full block"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <filter id="blur-t3" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <radialGradient id="lamp-t3" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFE6B8" />
          <stop offset="35%" stopColor="#FFB45C" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FFB45C" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vignette-t3" cx="0.5" cy="0.5" r="0.75">
          <stop offset="60%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      {/* Interior Background */}
      <rect width="320" height="200" fill="#3A2F26" />

      {/* Blurred Shapes Group */}
      <g filter="url(#blur-t3)">
        <rect x="0" y="0" width="320" height="110" fill="#5A4636" />
        <rect x="30" y="20" width="70" height="70" fill="#8C6B4E" />
        <rect x="220" y="20" width="70" height="70" fill="#8C6B4E" />
        <rect x="60" y="118" width="200" height="44" fill="#6E5440" />
        <rect x="60" y="112" width="200" height="8" fill="#A07E5E" />
        <rect x="0" y="160" width="320" height="40" fill="#2A221C" />
      </g>

      {/* Ceiling Lamp Glow */}
      <circle cx="160" cy="10" r="80" fill="url(#lamp-t3)" opacity="0.6" />

      {/* Walking Person Group */}
      <g style={{ animation: "nvr-walk 10s ease-in-out infinite" }}>
        <circle cx="80" cy="118" r="9" fill="#C59A74" filter="url(#blur-t3)" />
        <rect x="70" y="128" width="20" height="36" rx="8" fill="#2F4A6B" filter="url(#blur-t3)" />
      </g>

      {/* Vignette */}
      <rect x="0" y="0" width="320" height="200" fill="url(#vignette-t3)" />
    </svg>
  );
}

// =================================================================
// 3.4 SCENE 4: WAREHOUSE
// =================================================================
function SceneWarehouse() {
  return (
    <svg
      viewBox="0 0 320 200"
      className="w-full h-full block"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <filter id="blur-t4" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <radialGradient id="lamp-t4" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFE6B8" />
          <stop offset="35%" stopColor="#FFB45C" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FFB45C" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ground-t4" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14161B" />
          <stop offset="55%" stopColor="#2A2622" />
          <stop offset="100%" stopColor="#3B3129" />
        </linearGradient>
        <radialGradient id="vignette-t4" cx="0.5" cy="0.5" r="0.75">
          <stop offset="60%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      {/* Ground Background */}
      <rect width="320" height="200" fill="url(#ground-t4)" />

      {/* Blurred Shapes Group: Racks & Boxes */}
      <g filter="url(#blur-t4)">
        {[20, 120, 220].map((rx, idx) => (
          <g key={idx}>
            <rect x={rx} y="30" width="80" height="140" stroke="#4E4740" strokeWidth="5" fill="none" />
            <rect x={rx} y="46" width="80" height="5" fill="#4E4740" />
            <rect x={rx} y="92" width="80" height="5" fill="#4E4740" />
          </g>
        ))}
        {/* Boxes */}
        <rect x="28" y="18" width="30" height="28" fill="#7A6247" />
        <rect x="142" y="62" width="30" height="30" fill="#6A5640" />
        <rect x="230" y="104" width="38" height="32" fill="#8A6E50" />
        <rect x="36" y="97" width="28" height="38" fill="#6A5640" />
        <rect x="135" y="18" width="36" height="28" fill="#7A6247" />
      </g>

      {/* Ceiling Lamps */}
      <circle cx="60" cy="6" r="34" fill="url(#lamp-t4)" opacity="0.7" />
      <circle cx="160" cy="6" r="34" fill="url(#lamp-t4)" opacity="0.7" />
      <circle cx="260" cy="6" r="34" fill="url(#lamp-t4)" opacity="0.7" />

      {/* Vignette */}
      <rect x="0" y="0" width="320" height="200" fill="url(#vignette-t4)" />
    </svg>
  );
}
