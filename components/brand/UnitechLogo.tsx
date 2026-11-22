"use client";

import React from "react";

interface UnitechLogoProps {
  theme?: "light" | "dark";
  className?: string;
  heightClass?: string;
}

export function UnitechLogo({
  theme = "light",
  className = "",
  heightClass = "h-16 sm:h-20 lg:h-[96px]",
}: UnitechLogoProps) {
  const isDark = theme === "dark";
  const logoSrc = isDark
    ? "/images/brand/unitech-actual-logo-dark.png"
    : "/images/brand/unitech-actual-logo.png";

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <img
        src={logoSrc}
        alt="UNITECH - In Safe Hands"
        className={`w-auto ${heightClass} object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-xs`}
        loading="eager"
      />
    </div>
  );
}
