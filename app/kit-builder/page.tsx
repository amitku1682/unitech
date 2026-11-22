"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/store/Navbar";
import { Footer } from "@/components/store/Footer";
import { KitBuilder } from "@/components/store/KitBuilder";

export default function KitBuilderPage() {
  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col">
      <Navbar />

      {/* Breadcrumb Strip - Full Width Edge-to-Edge */}
      <div className="bg-white border-b border-slate-200/80 py-3.5 sm:py-4">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Interactive 60-Second CCTV Kit Builder</span>
        </div>
      </div>

      <div className="flex-1">
        <KitBuilder
          onAddKitToCart={(kit) => {
            try {
              const raw = localStorage.getItem("unitech_cart");
              const cart = raw ? JSON.parse(raw) : [];
              cart.push({
                id: `kit-${Date.now()}`,
                name: `Custom CCTV Kit: ${kit.cameraCount}x ${kit.cameraType}`,
                modelCode: `KIT-${kit.siteType}-${kit.cameraCount}CAM`,
                price: kit.subtotal,
                quantity: 1,
              });
              localStorage.setItem("unitech_cart", JSON.stringify(cart));
              window.dispatchEvent(new Event("storage"));
            } catch {}
          }}
          onOpenQuoteModal={(kit) => {
            window.location.href = `/contact?type=PRODUCT_QUOTE&details=${encodeURIComponent(
              `Kit Quote: ${kit.cameraCount}x ${kit.cameraType}, ${kit.dvr}, ${kit.hdd}`
            )}`;
          }}
        />
      </div>

      <Footer />
    </div>
  );
}
