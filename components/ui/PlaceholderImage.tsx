import React from "react";
import { Camera, HardDrive, Network, Radio, Server, Shield, Cable } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlaceholderProps {
  type?: "camera" | "dvr" | "cable" | "rack" | "network" | "banner" | "logo";
  title: string;
  subtitle?: string;
  aspectRatio?: "square" | "video" | "wide" | "tall";
  className?: string;
  imageUrl?: string;
}

export function PlaceholderImage({
  type = "camera",
  title,
  subtitle,
  aspectRatio = "square",
  className,
  imageUrl,
}: PlaceholderProps) {
  const getIcon = () => {
    switch (type) {
      case "camera":
        return <Camera className="w-10 h-10 text-unitech-red/70 group-hover:scale-110 transition-transform duration-300" />;
      case "dvr":
        return <HardDrive className="w-10 h-10 text-unitech-slate/70 group-hover:scale-110 transition-transform duration-300" />;
      case "cable":
        return <Cable className="w-10 h-10 text-emerald-600/70 group-hover:scale-110 transition-transform duration-300" />;
      case "rack":
        return <Server className="w-10 h-10 text-indigo-600/70 group-hover:scale-110 transition-transform duration-300" />;
      case "network":
        return <Network className="w-10 h-10 text-cyan-600/70 group-hover:scale-110 transition-transform duration-300" />;
      case "banner":
        return <Radio className="w-12 h-12 text-unitech-red/80 animate-pulse" />;
      default:
        return <Shield className="w-10 h-10 text-unitech-red/70" />;
    }
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case "video":
        return "aspect-video";
      case "wide":
        return "aspect-[21/9]";
      case "tall":
        return "aspect-[3/4]";
      default:
        return "aspect-square";
    }
  };

  return (
    <div
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border border-dashed border-slate-300 bg-gradient-to-b from-slate-50 to-slate-100/80 p-4 flex flex-col items-center justify-center text-center select-none transition-all duration-300 hover:border-unitech-red/40 hover:bg-slate-50/90",
        getAspectClass(),
        className
      )}
    >
      {/* Blueprint Grid Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#0f172a 1px, transparent 1px)`,
          backgroundSize: "16px 16px",
        }}
      />

      {/* Target Corner Crosshairs for CCTV Precision Aesthetic */}
      <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-slate-300 group-hover:border-unitech-red/40" />
      <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-slate-300 group-hover:border-unitech-red/40" />
      <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-slate-300 group-hover:border-unitech-red/40" />
      <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-slate-300 group-hover:border-unitech-red/40" />

      {imageUrl ? (
        <div className="relative z-10 w-full h-full flex items-center justify-center p-2 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-xs"
          />
        </div>
      ) : (
        <>
          {/* Center Icon */}
          <div className="relative z-10 mb-2 flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-200/60">
            {getIcon()}
          </div>

          {/* Model / Product Placeholder Text */}
          <div className="relative z-10 px-2 max-w-[90%]">
            <span className="text-[10px] font-mono tracking-widest uppercase font-semibold text-slate-400 block mb-0.5">
              [Image Placeholder]
            </span>
            <span className="font-heading font-bold text-xs text-slate-800 line-clamp-1 group-hover:text-unitech-red transition-colors">
              {title}
            </span>
            {subtitle && (
              <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                {subtitle}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
