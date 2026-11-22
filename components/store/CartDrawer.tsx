"use client";

import React from "react";
import { formatINR } from "@/lib/utils";
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, CreditCard } from "lucide-react";

export interface CartItemEntry {
  id: string;
  name: string;
  modelCode: string;
  price: number;
  quantity: number;
  isKit?: boolean;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItemEntry[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onProceedCheckout: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onProceedCheckout,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const gst18 = Math.round(subtotal * 0.18);
  const total = subtotal + gst18;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-unitech-red" />
              <h2 className="font-heading font-black text-slate-900 text-base">
                Your Hardware Quote Bag
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {cartItems.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-heading font-bold text-slate-800 text-sm">
                  Your quote bag is empty
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Add cameras, DVRs, solid copper cables, or configure a complete kit.
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-unitech-red transition-colors"
                >
                  Browse Hardware Catalog
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">
                        {item.modelCode}
                      </span>
                      <h4 className="font-heading font-bold text-xs text-slate-900 line-clamp-1">
                        {item.name}
                      </h4>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-slate-400 hover:text-unitech-red p-1 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-2 py-0.5">
                      <button
                        onClick={() => onUpdateQty(item.id, -1)}
                        className="text-slate-500 hover:text-slate-900 text-xs font-bold px-1"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-slate-800 min-w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQty(item.id, 1)}
                        className="text-slate-500 hover:text-slate-900 text-xs font-bold px-1"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="font-heading font-black text-xs text-slate-900">
                        {formatINR(item.price * item.quantity)}
                      </div>
                      <div className="text-[9px] text-slate-400">+ 18% GST</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-slate-100 bg-slate-50/70 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-800">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST 18% (Input Credit Eligible):</span>
                  <span className="font-bold text-slate-800">{formatINR(gst18)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Total Invoice Amount
                    </span>
                    <span className="font-heading text-xl font-black text-slate-900">
                      {formatINR(total)}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                    Free Pan-India Delivery
                  </span>
                </div>
              </div>

              <button
                onClick={onProceedCheckout}
                className="w-full py-3.5 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold shadow-md shadow-unitech-red/25 transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Proceed to Secure Gateway</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-Bit Encrypted Checkout · Direct UPI & Bank Transfer</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
