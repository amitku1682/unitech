"use client";

import React from "react";
import Link from "next/link";
import {
  MapPin,
  Headphones,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { useSocialLinks } from "@/lib/hooks/useSocialLinks";

export function ContactHub() {
  const { getLink } = useSocialLinks();
  return (
    <section className="py-8 sm:py-12 bg-[#faf9f5]">
      <div className="w-full px-5 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-stretch">
          
          {/* ========================================================= */}
          {/* LEFT PANEL: Interactive Google Map Location (lg:col-span-7) */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs flex flex-col h-full">
              
              {/* Map Header Card */}
              <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Verified Factory Location</span>
                  </div>
                  <h3 className="font-heading font-black text-slate-950 text-lg sm:text-xl tracking-tight">
                    Sahibabad Manufacturing Complex & Service Depot
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Plot no. 3/8 Industrial Area, Mohan Nagar, Ghaziabad NCR
                  </p>
                </div>

                <a
                  href="https://maps.google.com/?cid=3536483869333144352"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-unitech-red" />
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>

              {/* Responsive Google Map Embed */}
              <div className="w-full flex-1 min-h-[420px] sm:min-h-[480px] bg-slate-100 relative">
                <iframe
                  title="Unitech Security Systems Pvt. Ltd. Location"
                  src="https://maps.google.com/maps?cid=3536483869333144352&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full min-h-[420px] sm:min-h-[480px] border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Landmark & Logistics Navigation Strip */}
              <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-unitech-red shrink-0" />
                  <span>
                    <strong>Landmark:</strong> Near Mohan Nagar Metro Station & Loni Road Junction
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pan-India Dispatch Hub · PIN: 201007</span>
                </div>
              </div>

            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT PANEL: Structured Contact Info (lg:col-span-5) */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-6 sm:p-7 lg:p-8 shadow-xs flex flex-col justify-between h-full space-y-6">
              
              <div>
                {/* Header Subtitle */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Registered Corporate & Factory Office
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Desk Open
                  </span>
                </div>

                <h2 className="font-heading font-black text-slate-950 text-xl sm:text-2xl tracking-tight">
                  Unitech Security Systems Pvt. Ltd.
                </h2>

                {/* Verified Physical Factory Address */}
                <div className="flex items-start gap-3 mt-3 bg-slate-50/80 p-4 rounded-xl border border-slate-100 text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                  <MapPin className="w-4 h-4 text-unitech-red shrink-0 mt-0.5" />
                  <div>
                    Site 2, Ajanta Compound,
                    <br />
                    Plot no. 3/8 Industrial Area, Loni Rd, Mohan Nagar,
                    <br />
                    Sahibabad, Ghaziabad, Uttar Pradesh 201007
                  </div>
                </div>

                {/* Phone Numbers with Red Circular Badge Icons */}
                <div className="space-y-3 mt-5">
                  {/* Sales Enquiries */}
                  <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="w-10 h-10 rounded-full border border-red-500/80 flex items-center justify-center shrink-0 text-red-500 bg-red-50/50">
                      <Headphones className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Sales & Dealer Inquiries</div>
                      <a
                        href="tel:+918700317239"
                        className="text-sm sm:text-base font-bold text-red-600 hover:text-red-700 tracking-tight block"
                      >
                        +91 87003 17239
                      </a>
                    </div>
                  </div>

                  {/* Technical Support Helpline */}
                  <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="w-10 h-10 rounded-full border border-red-500/80 flex items-center justify-center shrink-0 text-red-500 bg-red-50/50">
                      <Headphones className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Technical Support & RMA Helpline</div>
                      <a
                        href="tel:+919911961407"
                        className="text-sm sm:text-base font-bold text-red-600 hover:text-red-700 tracking-tight block"
                      >
                        +91 99119 61407
                      </a>
                    </div>
                  </div>

                  {/* All-India Toll Free */}
                  <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="w-10 h-10 rounded-full border border-red-500/80 flex items-center justify-center shrink-0 text-red-500 bg-red-50/50">
                      <Phone className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <div className="text-[11px] sm:text-xs text-slate-500 font-medium">All-India Toll Free Desk</div>
                      <a
                        href="tel:18008899371"
                        className="text-sm sm:text-base font-bold text-red-600 hover:text-red-700 tracking-tight block"
                      >
                        1800 8899 371
                      </a>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <hr className="border-slate-100 my-4" />

                {/* Official Emails & Working Hours */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3.5 px-2">
                    <div className="w-10 h-10 rounded-full border border-red-500/80 flex items-center justify-center shrink-0 text-red-500 bg-red-50/50">
                      <Mail className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Official Inquiries</div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-800 space-y-1 mt-0.5">
                        <a
                          href="mailto:sales@unitechcctv.com"
                          className="block hover:text-red-600 transition-colors break-words [word-break:break-word]"
                        >
                          sales@unitechcctv.com
                        </a>
                        <a
                          href="mailto:info@unitechcctv.com"
                          className="block hover:text-red-600 transition-colors break-words [word-break:break-word]"
                        >
                          info@unitechcctv.com
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 px-2">
                    <div className="w-10 h-10 rounded-full border border-red-500/80 flex items-center justify-center shrink-0 text-red-500 bg-red-50/50">
                      <Clock className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Plant & Desk Working Hours</div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-800">
                        Monday - Saturday · 10:00 AM to 7:00 PM (Sunday Closed)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <hr className="border-slate-100 my-4" />

                {/* Official Social Network */}
                <div className="px-2">
                  <h4 className="font-heading font-black text-slate-900 text-xs uppercase tracking-wider mb-2.5">
                    Social Network
                  </h4>
                  <div className="flex items-center gap-2.5">
                    {/* Facebook */}
                    {getLink("facebook") && (
                      <a
                        href={getLink("facebook")!.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Facebook — Unitech"
                        className="w-9 h-9 rounded-lg bg-[#1877F2] hover:bg-[#166fe5] text-white flex items-center justify-center transition-transform hover:scale-105 shadow-2xs"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </a>
                    )}

                    {/* Twitter / X */}
                    {getLink("x") && (
                      <a
                        href={getLink("x")!.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="X (Twitter) — Unitech"
                        className="w-9 h-9 rounded-lg bg-black hover:bg-slate-800 text-white flex items-center justify-center transition-transform hover:scale-105 shadow-2xs"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>
                    )}

                    {/* LinkedIn */}
                    {getLink("linkedin") && (
                      <a
                        href={getLink("linkedin")!.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn — Unitech"
                        className="w-9 h-9 rounded-lg bg-[#0A66C2] hover:bg-[#095196] text-white flex items-center justify-center transition-transform hover:scale-105 shadow-2xs"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                      </a>
                    )}

                    {/* YouTube */}
                    {getLink("youtube") && (
                      <a
                        href={getLink("youtube")!.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="YouTube — Unitech"
                        className="w-9 h-9 rounded-lg bg-[#FF0000] hover:bg-[#cc0000] text-white flex items-center justify-center transition-transform hover:scale-105 shadow-2xs"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                      </a>
                    )}

                    {/* Instagram */}
                    {getLink("instagram") && (
                      <a
                        href={getLink("instagram")!.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram — Unitech"
                        className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center transition-transform hover:scale-105 shadow-2xs"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </a>
                    )}

                    {/* WhatsApp */}
                    {getLink("whatsapp") && (
                      <a
                        href={
                          getLink("whatsapp")!.url.includes("?")
                            ? getLink("whatsapp")!.url
                            : `${getLink("whatsapp")!.url}?text=${encodeURIComponent(
                                `🤝 *UNITECH AUTHORIZED DEALERSHIP INQUIRY*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n• Firm / Business Name: \n• Contact Person: \n• City & State: \n• Line of Business: CCTV / IT / Security\n\nHi Unitech Channel Team, I would like to inquire about Dealership & Wholesale Pricing.`
                              )}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="WhatsApp — Unitech"
                        className="w-9 h-9 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center transition-transform hover:scale-105 shadow-2xs"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Direct Route to B2B Form */}
              <div className="pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Looking for Wholesale Pricing?</div>
                    <div className="text-[11px] text-slate-500">Apply for distributorship quota or request a custom proposal</div>
                  </div>
                  <Link
                    href="/inquiry"
                    className="px-4 py-2 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <span>B2B Inquiry Form</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

