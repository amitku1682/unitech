"use client";

import React, { useState, useEffect } from "react";
import { CustomerEnquiry, EnquiryType } from "@/lib/types";
import {
  Building2,
  Mail,
  Phone,
  Clock,
  Send,
  CheckCircle,
  MessageCircle,
  Headphones,
  AlertCircle,
} from "lucide-react";
import {
  validateIndianPhone,
  validateEmail,
  validateGSTIN,
  validateText,
} from "@/lib/validation";
import { useSocialLinks } from "@/lib/hooks/useSocialLinks";

interface ContactProps {
  onNewEnquirySubmitted?: (enquiry: CustomerEnquiry) => void;
}

export function ContactAndDistributor({ onNewEnquirySubmitted }: ContactProps) {
  const { getLink } = useSocialLinks();
  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    gstin: "",
    phone: "",
    email: "",
    city: "",
    state: "Uttar Pradesh",
    type: "DISTRIBUTOR" as EnquiryType,
    details: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auto-detect inquiry type from URL query if provided
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlType = params.get("type");
      if (
        urlType === "DISTRIBUTOR" ||
        urlType === "PRODUCT_QUOTE" ||
        urlType === "GEM_TENDER" ||
        urlType === "SERVICE_WARRANTY"
      ) {
        setFormData((prev) => ({ ...prev, type: urlType as EnquiryType }));
      }
    }
  }, []);

  const validateAll = () => {
    const errs: Record<string, string> = {};

    const nameRes = validateText(formData.fullName, "Full Name", 3);
    if (!nameRes.isValid) errs.fullName = nameRes.error!;

    const phoneRes = validateIndianPhone(formData.phone);
    if (!phoneRes.isValid) errs.phone = phoneRes.error!;

    const emailRes = validateEmail(formData.email, false);
    if (!emailRes.isValid) errs.email = emailRes.error!;

    const cityRes = validateText(formData.city, "City & District", 2);
    if (!cityRes.isValid) errs.city = cityRes.error!;

    const gstinRes = validateGSTIN(formData.gstin, false);
    if (!gstinRes.isValid) errs.gstin = gstinRes.error!;

    return errs;
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateAll();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Post to unified Next.js backend endpoint
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          fullName: formData.fullName.trim(),
          companyName: formData.companyName.trim(),
          gstin: formData.gstin.trim() ? formData.gstin.trim().toUpperCase() : "",
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          details: formData.details.trim() || "Inquiry submitted via website form.",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to submit enquiry. Please try again.");
      }

      const createdEnquiry: CustomerEnquiry = result.data || {
        id: `enq-${Date.now().toString().slice(-4)}`,
        type: formData.type,
        fullName: formData.fullName.trim(),
        companyName: formData.companyName.trim(),
        gstin: formData.gstin.trim() ? formData.gstin.trim().toUpperCase() : "",
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        details: formData.details.trim() || "Inquiry submitted via website form.",
        status: "NEW",
        createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      };

      // Also sync to local storage for instant tab updates
      try {
        const stored = localStorage.getItem("unitech_admin_enquiries");
        const list = stored ? JSON.parse(stored) : [];
        localStorage.setItem("unitech_admin_enquiries", JSON.stringify([createdEnquiry, ...list]));
        window.dispatchEvent(new Event("storage"));
      } catch {}

      if (onNewEnquirySubmitted) {
        onNewEnquirySubmitted(createdEnquiry);
      }

      setSubmitted(true);
      setFormData({
        fullName: "",
        companyName: "",
        gstin: "",
        phone: "",
        email: "",
        city: "",
        state: "Uttar Pradesh",
        type: "DISTRIBUTOR",
        details: "",
      });
    } catch (err: any) {
      console.error("[Inquiry Form Submit Error]:", err);
      setSubmitError(err?.message || "Failed to submit enquiry. Please check connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-8 sm:py-10 bg-[#faf9f5] border-b border-slate-200/60">
      <div className="w-full px-5 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-start">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: Headings & Direct Factory Inquiry Form (lg:col-span-7) */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-unitech-red/10 text-unitech-red border border-unitech-red/20">
                <Building2 className="w-3.5 h-3.5" />
                <span>Direct Factory Operations</span>
              </div>

              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
                Apply for Distributorship or Bulk B2B Quotation
              </h1>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
                Join Unitech's network of 10,000+ authorized dealers and installers across India. Get
                exclusive wholesale margins, protected territory quotas, and dedicated technical RMA
                support directly from our Sahibabad manufacturing plant.
              </p>
            </div>

            {/* Interactive Secure Form Container */}
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="font-heading font-black text-2xl text-slate-900">
                    Enquiry Received Successfully!
                  </h3>
                  <p className="text-slate-600 text-sm max-w-md mx-auto">
                    Your inquiry has been logged into our secure Customer Enquiry Hub. Our regional B2B
                    sales manager will contact you within 2 business hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="pb-3 border-b border-slate-200">
                    <h3 className="font-heading font-black text-slate-900 text-lg">
                      Direct Factory Inquiry Form
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
                      Encrypted · Anti-Spam Protected
                    </span>
                  </div>

                  {/* Inquiry Type Radio / Tabs */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Select Inquiry Nature:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: "DISTRIBUTOR", label: "Distributor" },
                        { id: "PRODUCT_QUOTE", label: "Bulk Quote" },
                        { id: "GEM_TENDER", label: "GeM Tender" },
                        { id: "SERVICE_WARRANTY", label: "RMA Service" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, type: t.id as EnquiryType })}
                          className={`py-2 px-2 rounded-xl text-xs font-bold text-center border transition-all ${
                            formData.type === t.id
                              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2-Column Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Chandra"
                        value={formData.fullName}
                        onChange={(e) => handleFieldChange("fullName", e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-base sm:text-xs rounded-xl bg-slate-50/60 border focus:bg-white focus:outline-none transition-all shadow-2xs ${
                          errors.fullName
                            ? "border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-400"
                            : "border-slate-300 focus:border-unitech-red"
                        }`}
                      />
                      {errors.fullName && (
                        <p className="text-red-600 text-[10px] font-semibold mt-1">⚠️ {errors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Business / Company Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Chandra Telecom & CCTV"
                        value={formData.companyName}
                        onChange={(e) => handleFieldChange("companyName", e.target.value)}
                        className="w-full px-3.5 py-2.5 text-base sm:text-xs rounded-xl bg-slate-50/60 border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-unitech-red/20 focus:border-unitech-red transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mobile / WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => handleFieldChange("phone", e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-base sm:text-xs rounded-xl bg-slate-50/60 border focus:bg-white focus:outline-none transition-all shadow-2xs ${
                          errors.phone
                            ? "border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-400"
                            : "border-slate-300 focus:border-unitech-red"
                        }`}
                      />
                      {errors.phone && (
                        <p className="text-red-600 text-[10px] font-semibold mt-1">⚠️ {errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="contact@example.com"
                        value={formData.email}
                        onChange={(e) => handleFieldChange("email", e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-base sm:text-xs rounded-xl bg-slate-50/60 border focus:bg-white focus:outline-none transition-all shadow-2xs ${
                          errors.email
                            ? "border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-400"
                            : "border-slate-300 focus:border-unitech-red"
                        }`}
                      />
                      {errors.email && (
                        <p className="text-red-600 text-[10px] font-semibold mt-1">⚠️ {errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        City & District *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Varanasi / Ghaziabad"
                        value={formData.city}
                        onChange={(e) => handleFieldChange("city", e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-base sm:text-xs rounded-xl bg-slate-50/60 border focus:bg-white focus:outline-none transition-all shadow-2xs ${
                          errors.city
                            ? "border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-400"
                            : "border-slate-300 focus:border-unitech-red"
                        }`}
                      />
                      {errors.city && (
                        <p className="text-red-600 text-[10px] font-semibold mt-1">⚠️ {errors.city}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        GSTIN (Optional for Wholesale)
                      </label>
                      <input
                        type="text"
                        autoCapitalize="characters"
                        placeholder="e.g. 09ABCDE1234F1Z5"
                        value={formData.gstin}
                        onChange={(e) => handleFieldChange("gstin", e.target.value.toUpperCase())}
                        className={`w-full px-3.5 py-2.5 text-base sm:text-xs rounded-xl bg-slate-50/60 border focus:bg-white focus:outline-none uppercase transition-all shadow-2xs ${
                          errors.gstin
                            ? "border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-400"
                            : "border-slate-300 focus:border-unitech-red"
                        }`}
                      />
                      {errors.gstin && (
                        <p className="text-red-600 text-[10px] font-semibold mt-1">⚠️ {errors.gstin}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Requirement Specification / Message
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Specify camera counts, cable requirements, or dealership territory proposal..."
                      value={formData.details}
                      onChange={(e) => handleFieldChange("details", e.target.value)}
                      className="w-full px-3.5 py-2.5 text-base sm:text-xs rounded-xl bg-slate-50/60 border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-unitech-red/20 focus:border-unitech-red transition-all shadow-2xs"
                    />
                  </div>

                  {submitError && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                      ⚠️ {submitError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-unitech-red hover:bg-unitech-darkred disabled:opacity-70 text-white text-xs font-bold shadow-md shadow-unitech-red/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Logging Inquiry to Central CRM...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Inquiry to Factory Sales Team</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Instant WhatsApp Action Strip */}
            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-emerald-50/80 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Need Immediate Catalog on WhatsApp?</h4>
                  <p className="text-[11px] text-slate-600">Connect with our factory sales desk directly in real-time.</p>
                </div>
              </div>

              <a
                href={`https://wa.me/918700317239?text=${encodeURIComponent(
                  `🤝 *UNITECH AUTHORIZED DEALERSHIP INQUIRY*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n• Firm / Business Name: \n• Contact Person: \n• City & State: \n• GSTIN: \n• Line of Business: CCTV / Security / IT / Electrical\n\nHi Unitech Channel Team, I would like to partner with Unitech as an Authorized Dealer. Please share wholesale dealer price list and onboarding terms.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all whitespace-nowrap"
              >
                <span>WhatsApp Catalog</span>
              </a>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: Contact Details Card (lg:col-span-5) */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 space-y-3">
            <h2 className="font-heading text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Contact Details
            </h2>

            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs">
              
              {/* 1. Google Map Embed with Single Verified Pin (Using Verified Google CID) */}
              <div className="w-full h-64 sm:h-72 bg-slate-100 border-b border-slate-200/80">
                <iframe
                  title="Unitech Security Systems Pvt. Ltd. Location"
                  src="https://maps.google.com/maps?cid=3536483869333144352&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* 2. Structured Contact Info Block */}
              <div className="p-6 sm:p-7 space-y-5 text-left">
                
                {/* Official Company Name & Verified Factory Address */}
                <div>
                  <h3 className="font-heading font-black text-slate-950 text-lg sm:text-xl">
                    Unitech Security Systems Pvt. Ltd.
                  </h3>
                  <p className="text-slate-700 font-medium text-xs sm:text-sm mt-1.5 leading-relaxed">
                    Site 2, Ajanta Compound,
                    <br />
                    Plot no. 3/8 Industrial Area, Loni Rd, Mohan Nagar,
                    <br />
                    Sahibabad, Ghaziabad, Uttar Pradesh 201007
                  </p>

                  {/* Red Circle Icon Contact Channels */}
                  <div className="space-y-3.5 mt-4">
                    {/* Sales Enquiries */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full border border-red-500/80 flex items-center justify-center shrink-0 text-red-500 bg-red-50/40">
                        <Headphones className="w-5 h-5 stroke-[2]" />
                      </div>
                      <div>
                        <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Sales Enquiries</div>
                        <a
                          href="tel:+918700317239"
                          className="text-sm sm:text-base font-bold text-red-600 hover:text-red-700 tracking-tight block"
                        >
                          +91 87003 17239
                        </a>
                      </div>
                    </div>

                    {/* Technical Support No. */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full border border-red-500/80 flex items-center justify-center shrink-0 text-red-500 bg-red-50/40">
                        <Headphones className="w-5 h-5 stroke-[2]" />
                      </div>
                      <div>
                        <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Technical Support No.</div>
                        <a
                          href="tel:+919911961407"
                          className="text-sm sm:text-base font-bold text-red-600 hover:text-red-700 tracking-tight block"
                        >
                          +91 99119 61407
                        </a>
                      </div>
                    </div>

                    {/* Toll Free Number */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full border border-red-500/80 flex items-center justify-center shrink-0 text-red-500 bg-red-50/40">
                        <Phone className="w-5 h-5 stroke-[2]" />
                      </div>
                      <div>
                        <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Toll Free Number</div>
                        <a
                          href="tel:18008899371"
                          className="text-sm sm:text-base font-bold text-red-600 hover:text-red-700 tracking-tight block"
                        >
                          1800 8899 371
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Horizontal Divider */}
                <hr className="border-slate-200/90" />

                {/* Official Emails & Working Hours */}
                <div className="space-y-3.5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full border border-red-500/80 flex items-center justify-center shrink-0 text-red-500 bg-red-50/40">
                      <Mail className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Official Inquiries</div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-800">
                        <a href="mailto:sales@unitechcctv.com" className="hover:text-red-600 transition-colors">
                          sales@unitechcctv.com
                        </a>
                        <span className="text-slate-400 mx-1.5">/</span>
                        <a href="mailto:info@unitechcctv.com" className="hover:text-red-600 transition-colors">
                          info@unitechcctv.com
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full border border-red-500/80 flex items-center justify-center shrink-0 text-red-500 bg-red-50/40">
                      <Clock className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Working Hours</div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-800">
                        Monday - Saturday · 10:00 AM to 7:00 PM
                      </div>
                    </div>
                  </div>
                </div>

                {/* Horizontal Divider */}
                <hr className="border-slate-200/90" />

                {/* Social Network Section */}
                <div>
                  <h4 className="font-heading font-black text-slate-900 text-sm mb-3">
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
                        className="w-9 h-9 rounded-lg bg-[#1877F2] hover:bg-[#166fe5] text-white flex items-center justify-center transition-transform hover:scale-105 shadow-sm"
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
                        className="w-9 h-9 rounded-lg bg-black hover:bg-slate-800 text-white flex items-center justify-center transition-transform hover:scale-105 shadow-sm"
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
                        className="w-9 h-9 rounded-lg bg-[#0A66C2] hover:bg-[#095196] text-white flex items-center justify-center transition-transform hover:scale-105 shadow-sm"
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
                        className="w-9 h-9 rounded-lg bg-[#FF0000] hover:bg-[#cc0000] text-white flex items-center justify-center transition-transform hover:scale-105 shadow-sm"
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
                        className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center transition-transform hover:scale-105 shadow-sm"
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
                        className="w-9 h-9 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center transition-transform hover:scale-105 shadow-sm"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                          </svg>
                        </a>
                      )}
                    </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
