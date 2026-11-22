"use client";

import React, { useState } from "react";
import {
  CustomerEnquiry,
  Product,
  AnnouncementBanner,
  GoogleReview,
  EnquiryStatus,
  EnquiryType,
} from "@/lib/types";
import { formatINR } from "@/lib/utils";
import {
  X,
  LayoutDashboard,
  Users,
  Layers,
  Megaphone,
  Star,
  Settings,
  Check,
  Phone,
  MessageCircle,
  FileText,
  Save,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
} from "lucide-react";

interface AdminControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  enquiries: CustomerEnquiry[];
  onUpdateEnquiryStatus: (id: string, status: EnquiryStatus) => void;
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  banners: AnnouncementBanner[];
  onToggleBanner: (id: string) => void;
  onUpdateBannerText: (text: string) => void;
  reviews: GoogleReview[];
  onToggleReviewFeatured: (id: string) => void;
  onAddNewReview: (review: GoogleReview) => void;
}

export function AdminControlPanel({
  isOpen,
  onClose,
  enquiries,
  onUpdateEnquiryStatus,
  products,
  onUpdateProduct,
  banners,
  onToggleBanner,
  onUpdateBannerText,
  reviews,
  onToggleReviewFeatured,
  onAddNewReview,
}: AdminControlPanelProps) {
  const [activeTab, setActiveTab] = useState<
    "DASHBOARD" | "ENQUIRIES" | "CMS" | "BANNERS" | "REVIEWS"
  >("ENQUIRIES");

  // Enquiries filter
  const [enquiryFilter, setEnquiryFilter] = useState<string>("ALL");

  // CMS editable states
  const [tickerText, setTickerText] = useState(
    "GST INVOICE & PAN-INDIA DISPATCH ON ALL SURVEILLANCE HARDWARE"
  );
  const [cataloguePdfUrl, setCataloguePdfUrl] = useState(
    "/downloads/unitech-2026-master-catalog.pdf"
  );
  const [saveCmsNotice, setSaveCmsNotice] = useState(false);

  // Editable product prices
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDealerPrice, setEditDealerPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);

  // New review form
  const [showAddReview, setShowAddReview] = useState(false);
  const [newReviewForm, setNewReviewForm] = useState({
    authorName: "",
    authorRole: "Verified Dealer",
    rating: 5,
    reviewText: "",
    source: "GOOGLE" as const,
  });

  const handleSaveCms = () => {
    onUpdateBannerText(tickerText);
    setSaveCmsNotice(true);
    setTimeout(() => setSaveCmsNotice(false), 2500);
  };

  const handleSaveProductEdit = (prod: Product) => {
    onUpdateProduct({
      ...prod,
      price: editPrice,
      dealerPrice: editDealerPrice,
      stockQuantity: editStock,
    });
    setEditingProductId(null);
  };

  const handleCreateReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewForm.authorName || !newReviewForm.reviewText) return;
    onAddNewReview({
      id: `rev-${Date.now()}`,
      authorName: newReviewForm.authorName,
      authorRole: newReviewForm.authorRole,
      rating: newReviewForm.rating,
      reviewText: newReviewForm.reviewText,
      relativeTime: "Just now",
      isFeatured: true,
      source: newReviewForm.source,
    });
    setShowAddReview(false);
    setNewReviewForm({
      authorName: "",
      authorRole: "Verified Dealer",
      rating: 5,
      reviewText: "",
      source: "GOOGLE",
    });
  };

  const filteredEnquiries = enquiries.filter((e) => {
    if (enquiryFilter === "DISTRIBUTOR") return e.type === "DISTRIBUTOR";
    if (enquiryFilter === "PRODUCT_QUOTE") return e.type === "PRODUCT_QUOTE";
    if (enquiryFilter === "GEM_TENDER") return e.type === "GEM_TENDER";
    if (enquiryFilter === "SERVICE") return e.type === "SERVICE_WARRANTY";
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
      {/* Dark Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/85 backdrop-blur-md" />

      {/* Main Admin Panel Modal Window */}
      <div className="relative bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-6xl h-[92vh] shadow-2xl flex flex-col z-10 overflow-hidden">
        {/* Top Header Bar */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-unitech-red text-white flex items-center justify-center font-black shadow-md shadow-unitech-red/30">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-black text-lg text-white">
                  Unitech Master Control Panel
                </h2>
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live Production CMS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5">
                Centralized Operations · Enquiries · Pricing · Banners · Google Reviews
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Back to Live Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-1 px-4 sm:px-6 py-2 bg-slate-950 border-b border-slate-800/80 overflow-x-auto shrink-0 no-scrollbar">
          {[
            { id: "ENQUIRIES", label: "Customer Enquiries", icon: Users, badge: enquiries.length },
            { id: "CMS", label: "Live Website CMS", icon: Layers },
            { id: "BANNERS", label: "Sales & Announcement Banners", icon: Megaphone },
            { id: "REVIEWS", label: "Google Reviews Curator (4.2★)", icon: Star },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-unitech-red text-white shadow-md shadow-unitech-red/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900/90">
          {/* TAB 1: CUSTOMER ENQUIRIES (SEGREGATED) */}
          {activeTab === "ENQUIRIES" && (
            <div className="space-y-6">
              {/* Filter Tabs Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {[
                    { id: "ALL", label: "All Enquiries" },
                    { id: "DISTRIBUTOR", label: "🏢 B2B Distributors" },
                    { id: "PRODUCT_QUOTE", label: "📦 Product Quotes" },
                    { id: "GEM_TENDER", label: "🏛️ GeM Tenders" },
                    { id: "SERVICE", label: "🛠️ RMA & Service" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setEnquiryFilter(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                        enquiryFilter === f.id
                          ? "bg-slate-800 text-white border border-slate-700"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <span className="text-xs text-slate-400 font-mono">
                  Showing {filteredEnquiries.length} Lead(s)
                </span>
              </div>

              {/* Enquiries Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEnquiries.map((enq) => {
                  const getStatusBadge = (status: EnquiryStatus) => {
                    switch (status) {
                      case "NEW":
                        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
                      case "CONTACTED":
                        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
                      case "QUOTE_SENT":
                        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
                      case "CONVERTED":
                        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
                      default:
                        return "bg-slate-700 text-slate-300";
                    }
                  };

                  return (
                    <div
                      key={enq.id}
                      className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Metadata */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                            #{enq.id} · {enq.type}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(
                              enq.status
                            )}`}
                          >
                            {enq.status}
                          </span>
                        </div>

                        {/* Customer Info */}
                        <h3 className="font-heading font-black text-white text-base">
                          {enq.fullName}
                        </h3>
                        {enq.companyName && (
                          <div className="text-xs text-slate-300 font-semibold">
                            {enq.companyName} {enq.gstin && `(GSTIN: ${enq.gstin})`}
                          </div>
                        )}
                        <div className="text-xs text-slate-400">
                          Location: {enq.city}, {enq.state}
                        </div>

                        {enq.productModel && (
                          <div className="text-xs text-amber-400 font-semibold mt-1">
                            Interested In: {enq.productModel}
                          </div>
                        )}

                        <p className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800 mt-2 italic">
                          "{enq.details}"
                        </p>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                        {/* Quick Contact Buttons */}
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`https://wa.me/${enq.phone.replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(
                              enq.fullName
                            )}%2C%20thank%20you%20for%20contacting%20Unitech%20CCTV.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 transition-colors"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>

                          <a
                            href={`tel:${enq.phone}`}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Phone className="w-3 h-3 text-unitech-red" />
                            <span>Call</span>
                          </a>
                        </div>

                        {/* Status Change Selector */}
                        <select
                          value={enq.status}
                          onChange={(e) =>
                            onUpdateEnquiryStatus(enq.id, e.target.value as EnquiryStatus)
                          }
                          className="bg-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 border border-slate-700 focus:outline-none focus:border-unitech-red"
                        >
                          <option value="NEW">Set: New</option>
                          <option value="CONTACTED">Set: Contacted</option>
                          <option value="QUOTE_SENT">Set: Quote Sent</option>
                          <option value="CONVERTED">Set: Converted (Won)</option>
                          <option value="REJECTED">Set: Closed/Lost</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE WEBSITE CMS (CONTROL PANEL) */}
          {activeTab === "CMS" && (
            <div className="space-y-8">
              {saveCmsNotice && (
                <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg animate-fade-in">
                  <Check className="w-4 h-4" />
                  <span>Live Site Updated! Changes are instantly reflected on the homepage.</span>
                </div>
              )}

              {/* Section 1: Global Banners & PDF Links */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-heading font-black text-white text-base">
                      Global Banners & PDF Catalogue Management
                    </h3>
                    <p className="text-xs text-slate-400">
                      Update ticker announcements and live download links without code changes.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveCms}
                    className="px-4 py-2 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-unitech-red/25 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Publish Updates Live</span>
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">
                      Top Announcement Ticker Text:
                    </label>
                    <input
                      type="text"
                      value={tickerText}
                      onChange={(e) => setTickerText(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-unitech-red"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">
                      Master Catalogue PDF Download Link:
                    </label>
                    <input
                      type="text"
                      value={cataloguePdfUrl}
                      onChange={(e) => setCataloguePdfUrl(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-unitech-red font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Live Price & Inventory Control Panel */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div>
                  <h3 className="font-heading font-black text-white text-base">
                    Live Product Catalog, Pricing & Stock Editor
                  </h3>
                  <p className="text-xs text-slate-400">
                    Directly update factory retail price, dealer tier pricing, and warehouse stock.
                  </p>
                </div>

                <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 overflow-hidden">
                  {products.map((p) => {
                    const isEditing = editingProductId === p.id;

                    return (
                      <div
                        key={p.id}
                        className="p-4 bg-slate-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
                      >
                        <div className="flex-1">
                          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                            {p.modelCode}
                          </span>
                          <h4 className="font-bold text-white text-sm">{p.name}</h4>
                          <span className="text-slate-400 text-[11px]">{p.categoryLabel}</span>
                        </div>

                        {isEditing ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Unit Price (₹):</span>
                              <input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(Number(e.target.value))}
                                className="w-24 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-mono text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Dealer Tier (₹):</span>
                              <input
                                type="number"
                                value={editDealerPrice}
                                onChange={(e) => setEditDealerPrice(Number(e.target.value))}
                                className="w-24 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-mono text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Stock Qty:</span>
                              <input
                                type="number"
                                value={editStock}
                                onChange={(e) => setEditStock(Number(e.target.value))}
                                className="w-20 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-mono text-xs"
                              />
                            </div>

                            <div className="flex items-center gap-1 self-end pt-3">
                              <button
                                onClick={() => handleSaveProductEdit(p)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingProductId(null)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="text-slate-400 text-[10px]">Factory B2B:</div>
                              <div className="font-heading font-black text-white text-sm">
                                {formatINR(p.price)}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-emerald-400 text-[10px]">Dealer Tier:</div>
                              <div className="font-heading font-black text-emerald-400 text-sm">
                                {formatINR(p.dealerPrice)}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-slate-400 text-[10px]">Stock:</div>
                              <div className="font-bold text-white text-xs">{p.stockQuantity} pcs</div>
                            </div>

                            <button
                              onClick={() => {
                                setEditingProductId(p.id);
                                setEditPrice(p.price);
                                setEditDealerPrice(p.dealerPrice);
                                setEditStock(p.stockQuantity);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                            >
                              Edit Rate
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SALES & ANNOUNCEMENT BANNERS */}
          {activeTab === "BANNERS" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-heading font-black text-white text-base">
                    Sales & Announcement Banner Engine
                  </h3>
                  <p className="text-xs text-slate-400">
                    Schedule and activate promotional banners across the top ticker and hero section.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {banners.map((ban) => (
                  <div
                    key={ban.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      ban.isActive
                        ? "bg-slate-950 border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                        : "bg-slate-950/60 border-slate-800 opacity-60"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                            {ban.type}
                          </span>
                          {ban.badgeText && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-unitech-red/20 text-unitech-red border border-unitech-red/30">
                              {ban.badgeText}
                            </span>
                          )}
                        </div>
                        <h4 className="font-heading font-bold text-sm text-white">{ban.title}</h4>
                        {ban.subtitle && (
                          <p className="text-xs text-slate-400 mt-0.5">{ban.subtitle}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          {ban.isActive ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Active on Live Site
                            </span>
                          ) : (
                            <span className="text-slate-500">Disabled</span>
                          )}
                        </span>

                        <button
                          onClick={() => onToggleBanner(ban.id)}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            ban.isActive
                              ? "bg-rose-600 hover:bg-rose-700 text-white"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                        >
                          {ban.isActive ? "Turn Off" : "Make Live"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: GOOGLE REVIEWS & SOCIAL PROOF CURATOR */}
          {activeTab === "REVIEWS" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <h3 className="font-heading font-black text-white text-lg">
                      Google Reviews & Testimonials Curator
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage which authentic 4★ and 5★ customer reviews appear on the live homepage.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Overall Rating</div>
                    <div className="text-xl font-black text-amber-400">4.2 / 5.0 (60 Reviews)</div>
                  </div>
                  <button
                    onClick={() => setShowAddReview(!showAddReview)}
                    className="px-3.5 py-2 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Custom Dealer Testimonial</span>
                  </button>
                </div>
              </div>

              {/* Add New Review Form Modal/Drawer */}
              {showAddReview && (
                <form
                  onSubmit={handleCreateReview}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-700 space-y-3 text-xs"
                >
                  <h4 className="font-bold text-white text-sm">Add New Verified Testimonial</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Author Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Patel"
                        value={newReviewForm.authorName}
                        onChange={(e) =>
                          setNewReviewForm({ ...newReviewForm, authorName: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Role / Territory</label>
                      <input
                        type="text"
                        placeholder="e.g. Distributor (Gujarat)"
                        value={newReviewForm.authorRole}
                        onChange={(e) =>
                          setNewReviewForm({ ...newReviewForm, authorRole: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Star Rating</label>
                      <select
                        value={newReviewForm.rating}
                        onChange={(e) =>
                          setNewReviewForm({ ...newReviewForm, rating: Number(e.target.value) })
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                      >
                        <option value={5}>5 Stars (⭐⭐⭐⭐⭐)</option>
                        <option value={4}>4 Stars (⭐⭐⭐⭐)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Review Text *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Enter verified customer feedback..."
                      value={newReviewForm.reviewText}
                      onChange={(e) =>
                        setNewReviewForm({ ...newReviewForm, reviewText: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddReview(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      Save & Feature on Homepage
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      rev.isFeatured
                        ? "bg-slate-950 border-emerald-500/40 shadow-sm"
                        : "bg-slate-950/60 border-slate-800 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-white text-sm">{rev.authorName}</h4>
                        <span className="text-[11px] text-slate-400">
                          {rev.authorRole} · {rev.source}
                        </span>
                      </div>
                      <div className="flex text-amber-400">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 italic mb-4">"{rev.reviewText}"</p>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                      <span className="text-slate-400 font-mono text-[11px]">
                        Status:{" "}
                        {rev.isFeatured ? (
                          <span className="text-emerald-400 font-bold">Featured on Home</span>
                        ) : (
                          <span className="text-slate-500">Hidden</span>
                        )}
                      </span>

                      <button
                        onClick={() => onToggleReviewFeatured(rev.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          rev.isFeatured
                            ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        {rev.isFeatured ? "Hide from Home" : "Pin to Home"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
