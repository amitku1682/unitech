"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/store/Navbar";
import { Footer } from "@/components/store/Footer";
import { ContactHub } from "@/components/store/ContactHub";
import { Building2, ArrowRight } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col">
      <Navbar />

      {/* Breadcrumb Strip */}
      <div className="bg-white border-b border-slate-200/80 py-3.5">
        <div className="w-full px-5 sm:px-6 lg:px-8 xl:px-10 flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Contact Factory & Office</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200/80 py-8 sm:py-10">
        <div className="w-full px-5 sm:px-6 lg:px-8 xl:px-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-unitech-red/10 text-unitech-red border border-unitech-red/20 mb-3">
              <Building2 className="w-3.5 h-3.5" />
              <span>Sahibabad Manufacturing Complex & Head Office</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
              Get in Touch with Unitech Factory Desk
            </h1>
            <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Visit our Sahibabad surveillance hardware facility or connect directly with our sales, engineering helpline, and RMA service desk.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href="/inquiry"
              className="px-6 py-3 rounded-full bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold transition-all shadow-md shadow-unitech-red/20 flex items-center gap-2"
            >
              <span>Submit B2B Inquiry Form</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <ContactHub />
      </div>

      <Footer />
    </div>
  );
}
