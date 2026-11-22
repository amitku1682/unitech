"use client";

import React, { useState, useEffect } from "react";
import { CustomerEnquiry, EnquiryType } from "@/lib/types";
import {
  Building2,
  Send,
  CheckCircle,
  MessageCircle,
  ShieldCheck,
  Truck,
  Award,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  validateIndianPhone,
  validateEmail,
  validateGSTIN,
  validateText,
} from "@/lib/validation";

interface InquiryProps {
  onNewEnquirySubmitted?: (enquiry: CustomerEnquiry) => void;
}

export function InquiryForm({ onNewEnquirySubmitted }: InquiryProps) {
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
        urlType === "OEM" ||
        urlType === "SERVICE_WARRANTY"
      ) {
        setFormData((prev) => ({
          ...prev,
          type: (urlType === "SERVICE_WARRANTY" ? "OEM" : urlType) as EnquiryType,
        }));
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
    <section className="py-8 sm:py-12 bg-[#faf9f5]">
      <div className="w-full px-5 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-start">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: The Interactive Inquiry Form (lg:col-span-8) */}
          {/* ========================================================= */}
          <div className="lg:col-span-8 space-y-6">
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
                    className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div className="pb-3 border-b border-slate-200">
                    <h3 className="font-heading font-black text-slate-950 text-lg sm:text-xl">
                      Direct Factory Inquiry Form
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
                      Encrypted · Anti-Spam Protected
                    </span>
                  </div>

                  {/* Inquiry Type Radio / Tabs */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Select Inquiry Nature:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: "DISTRIBUTOR", label: "Distributor" },
                        { id: "PRODUCT_QUOTE", label: "Bulk Quote" },
                        { id: "GEM_TENDER", label: "GeM Tender" },
                        { id: "OEM", label: "OEM" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, type: t.id as EnquiryType })}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                            formData.type === t.id
                              ? "bg-slate-900 text-white border-slate-900 shadow-xs"
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
                    className="w-full min-h-[44px] py-3.5 rounded-full bg-unitech-red hover:bg-unitech-darkred disabled:opacity-70 text-white text-xs sm:text-sm font-bold shadow-md shadow-unitech-red/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
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
          {/* RIGHT COLUMN: Wholesale Partner Credentials (lg:col-span-4) */}
          {/* ========================================================= */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="font-heading font-black text-slate-950 text-base sm:text-lg border-b border-slate-100 pb-3">
                Why Partner With Unitech?
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-unitech-red border border-red-200/80 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Protected Wholesale Margins</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Exclusive dealer pricing tiers, territorial quota protection, and direct factory invoicing with 18% GST input credit.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">24-48 Hr Factory Dispatch</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Daily dispatches from Sahibabad central warehouse via express surface cargo across 28 Indian states.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">GeM OEM Tender Authorization</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Instant Manufacturer Authorization Form (MAF), BIS, CE, and RoHS certifications for government and enterprise bids.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/80 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">&lt; 0.3% Field RMA Replacement</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Industry-lowest failure rate backed by 2-year direct plant replacement and express swap service.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone Helpline Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl sm:rounded-3xl p-6 shadow-md border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                <PhoneCall className="w-4 h-4" />
                <span>Immediate Phone Assistance</span>
              </div>
              <h4 className="font-heading font-black text-base text-white">
                Speak With a B2B Sales Engineer
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Need customized OEM manufacturing, special cable lengths, or wholesale quotes right now?
              </p>
              <div className="pt-2">
                <a
                  href="tel:+918700317239"
                  className="w-full py-2.5 px-4 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-unitech-red" />
                  <span>Call: (+91) 87003 17239</span>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

