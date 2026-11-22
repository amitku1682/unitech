"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/store/Navbar";
import { Footer } from "@/components/store/Footer";
import { DownloadsHub } from "@/components/store/DownloadsHub";
import { HelpCircle, Phone, MessageCircle, FileText, Wrench } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col">
      <Navbar />

      {/* Breadcrumb Strip */}
      <div className="bg-white border-b border-slate-200/80 py-3.5">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Support & Downloads Hub</span>
        </div>
      </div>

      {/* Main Support Header */}
      <div className="bg-white border-b border-slate-200/80 py-8 sm:py-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-unitech-red/10 text-unitech-red border border-unitech-red/20 mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Installer & Dealer Engineering Desk</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
            Firmware, VMS Utilities & Warranty Support
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-3xl leading-relaxed">
            Download official Unitech CMS client software, device search tools, and firmware files. For technical RMA assistance, contact our Sahibabad engineers.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <a
              href="tel:+919911961407"
              className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-unitech-red" />
              <span>Helpline: (+91) 99119 61407</span>
            </a>
            <a
              href={`https://wa.me/919911961407?text=${encodeURIComponent(
                `🛠️ *UNITECH TECHNICAL & RMA SUPPORT DESK*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n• Device Model / Hardware: \n• Serial / MAC ID (if known): \n• Support Type: Firmware / Configuration / RMA Replacement\n• Description of Query: \n\nHi Unitech Engineers, please assist me with the technical ticket above.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Tech Desk</span>
            </a>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <DownloadsHub />
      </div>

      <Footer />
    </div>
  );
}
