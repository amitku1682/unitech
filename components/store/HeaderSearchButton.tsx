"use client";

import React, { forwardRef } from "react";
import { Search } from "lucide-react";

interface HeaderSearchButtonProps {
  onClick: () => void;
  isOpen?: boolean;
  className?: string;
}

export const HeaderSearchButton = forwardRef<HTMLButtonElement, HeaderSearchButtonProps>(
  ({ onClick, isOpen = false, className = "" }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label="Search products"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`w-11 h-11 rounded-full bg-transparent hover:bg-[#F2F2F4] text-[#111114] flex items-center justify-center transition-colors focus:outline-none focus-visible:outline-none cursor-pointer ${className}`}
      >
        <Search className="w-5 h-5 stroke-[2] text-[#111114]" />
      </button>
    );
  }
);

HeaderSearchButton.displayName = "HeaderSearchButton";
