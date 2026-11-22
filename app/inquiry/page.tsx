"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/store/Navbar";
import { Footer } from "@/components/store/Footer";
import { InquiryForm } from "@/components/store/InquiryForm";
import { Building2 } from "lucide-react";

export default function InquiryPage() {
  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col">
      <Navbar />

      {/* Breadcrumb Strip */}
      <div className="bg-white border-b border-slate-200/80 py-3.5">
        <div className="w-full px-5 sm:px-6 lg:px-8 xl:px-10 flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Factory B2B Inquiry & Distributorship</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200/80 py-8 sm:py-10">
        <div className="w-full px-5 sm:px-6 lg:px-8 xl:px-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-unitech-red/10 text-unitech-red border border-unitech-red/20 mb-3">
            <Building2 className="w-3.5 h-3.5" />
            <span>Direct Factory Operations & Dealership Desk</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
            Apply for Distributorship or Bulk B2B Quotation
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-3xl leading-relaxed">
            Join Unitech's network of 10,000+ authorized dealers and installers across India. Get exclusive wholesale margins, protected territory quotas, and dedicated technical RMA support directly from our Sahibabad manufacturing plant.
          </p>
        </div>
      </div>

      {/* Main Content Form */}
      <div className="flex-1">
        <InquiryForm />
      </div>

      <Footer />
    </div>
  );
}

