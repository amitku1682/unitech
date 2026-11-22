"use client";

import React from "react";
import { Product } from "@/lib/types";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { formatINR } from "@/lib/utils";
import { X, FileDown, ShoppingBag, ShieldCheck, Check, Cpu } from "lucide-react";

interface SpecsModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export function SpecsModal({ product, onClose, onAddToCart }: SpecsModalProps) {
  const [downloaded, setDownloaded] = React.useState(false);
  const [selectedLengthIndex, setSelectedLengthIndex] = React.useState(0);

  if (!product) return null;

  const cableOptions = product.cableLengths && product.cableLengths.length > 0
    ? product.cableLengths
    : product.category === "cables"
    ? [
        { label: "90 Yards / 90m Roll (Standard Coil)", priceDelta: 0 },
        { label: "180 Yards / 180m Roll (Double Coil)", priceDelta: Math.round(product.price * 0.85) },
        { label: "305 Meters / 1000ft (Full Drum Box)", priceDelta: Math.round(product.price * 1.9) },
      ]
    : [];

  const selectedLengthDelta = product.category === "cables" && cableOptions[selectedLengthIndex]
    ? cableOptions[selectedLengthIndex].priceDelta
    : 0;

  const currentPrice = product.price + selectedLengthDelta;
  const currentMrp = Math.round(currentPrice * 1.4);

  const handleDownloadPdf = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xs" />

      <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl z-10 border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col sm:flex-row gap-6 items-start mb-6 pb-6 border-b border-slate-100">
          <div className="w-full sm:w-48 shrink-0">
            {product.imageUrl ? (
              <div className="w-full aspect-square rounded-2xl bg-white border border-slate-200/80 p-3 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain drop-shadow-sm mix-blend-multiply"
                />
              </div>
            ) : (
              <PlaceholderImage
                type="camera"
                title={product.modelCode}
                aspectRatio="square"
              />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                {product.modelCode}
              </span>
              {product.stockQuantity > 0 ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  In Stock · {product.stockQuantity} Units Ready
                </span>
              ) : (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Out of Stock · Factory Lead Time 3-5 Days
                </span>
              )}
            </div>

            <h3 className="font-heading font-black text-xl text-slate-900 mb-2">
              {product.name}
            </h3>

            {/* Cable Length Dropdown with Dynamic Cost */}
            {product.category === "cables" && cableOptions.length > 0 && (
              <div className="mb-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-900 flex items-center justify-between">
                  <span>Wiring Length / Coil Selection:</span>
                  <span className="text-emerald-700 font-extrabold text-[10px]">
                    {selectedLengthDelta > 0 ? `+${formatINR(selectedLengthDelta)}` : "Base Length"}
                  </span>
                </label>
                <select
                  value={selectedLengthIndex}
                  onChange={(e) => setSelectedLengthIndex(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-base sm:text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-unitech-red cursor-pointer shadow-2xs"
                >
                  {cableOptions.map((opt, idx) => (
                    <option key={idx} value={idx}>
                      {opt.label} {opt.priceDelta > 0 ? `(+${formatINR(opt.priceDelta)})` : "(Base Price)"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-heading text-2xl font-black text-slate-900">
                {formatINR(currentPrice)}
              </span>
              <span className="text-xs text-slate-500">+ 18% GST</span>
              <span className="text-xs text-slate-400 line-through">
                {formatINR(currentMrp)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const customized = product.category === "cables" && cableOptions[selectedLengthIndex]
                    ? {
                        ...product,
                        price: currentPrice,
                        name: `${product.name} (${cableOptions[selectedLengthIndex].label.split(" ")[0]})`,
                      }
                    : product;
                  onAddToCart(customized);
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-unitech-red text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Quote Cart</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-600" />
                <span>{downloaded ? "Datasheet Downloaded!" : "Download PDF Datasheet"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Technical Specification Matrix */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            <Cpu className="w-3.5 h-3.5 text-unitech-red" />
            <span>Verified Technical Specifications</span>
          </div>

          <div className="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
            {Object.entries(product.specs).map(([specKey, specVal]) => (
              <div key={specKey} className="grid grid-cols-3 p-3 bg-slate-50/50 hover:bg-slate-50">
                <span className="font-bold text-slate-600 col-span-1">{specKey}</span>
                <span className="text-slate-900 font-medium col-span-2">{specVal}</span>
              </div>
            ))}
            <div className="grid grid-cols-3 p-3 bg-slate-50/50 hover:bg-slate-50">
              <span className="font-bold text-slate-600 col-span-1">Warranty</span>
              <span className="text-emerald-700 font-bold col-span-2">
                {product.warrantyYears} Years Manufacturer Replacement Warranty
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
