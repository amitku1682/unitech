"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Product,
  CableLengthOption,
  CategorySlug,
  CustomerEnquiry,
  GoogleReview,
  AnnouncementBanner,
  LiveDocumentAsset,
  EnquiryStatus,
  EnquiryType,
  DealerHub,
  CheckoutOrder,
} from "@/lib/types";
import { formatINR, formatOrderCurrency } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Layers,
  Megaphone,
  Star,
  Camera,
  Image as ImageIcon,
  ExternalLink,
  Phone,
  MessageCircle,
  Save,
  Check,
  Plus,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  Search,
  Filter,
  RefreshCw,
  FileText,
  FileDown,
  Upload,
  Clock,
  Building2,
  MapPin,
  Mail,
  Award,
  Copy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit3,
  Sliders,
  Sparkles,
  BadgeCheck,
  ArrowUpDown,
  ChevronRight,
  Download,
  Box,
  Archive,
  PackageCheck,
  AlertCircle,
  Calendar,
  Hash,
  Briefcase,
  X,
  FileCheck,
  Globe,
  Radio,
  SlidersHorizontal,
  ChevronDown,
  LogOut,
  Zap,
  LayoutGrid,
  CreditCard,
  Share2,
  FolderTree,
} from "lucide-react";
import { PdfPreviewModal } from "@/components/ui/PdfPreviewModal";
import { HeroProductSaleEditor } from "@/components/admin/HeroProductSaleEditor";
import { AboutLeadershipEditor } from "@/components/admin/AboutLeadershipEditor";
import { PaymentSettingsEditor } from "@/components/admin/PaymentSettingsEditor";
import { SocialLinksEditor } from "@/components/admin/SocialLinksEditor";
import { FlashSaleEditor } from "@/components/admin/FlashSaleEditor";
import { ProductGalleryModal } from "@/components/admin/ProductGalleryModal";
import { HomepageCategoryEditor } from "@/components/admin/HomepageCategoryEditor";
import { SearchSettingsEditor } from "@/components/admin/SearchSettingsEditor";
import { CategoriesEditor } from "@/components/admin/CategoriesEditor";
import { ProductForm } from "@/components/admin/ProductForm";
import { EmailSettingsEditor } from "@/components/admin/EmailSettingsEditor";

// Official Google Profile URL
const GOOGLE_REVIEWS_URL =
  "https://www.google.com/search?q=unitech+security+systems+pvt.+ltd.+address&ludocid=3536483869333144352";

export default function AdminPage() {
  // ==========================================
  // 1. AUTHENTICATION STATE & SECURITY GUARD
  // ==========================================
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Login form inputs
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberTerminal, setRememberTerminal] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>("");
  const [isSendingForgot, setIsSendingForgot] = useState<boolean>(false);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null);
  const [forgotErrorMessage, setForgotErrorMessage] = useState<string | null>(null);

  // Change password modal state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [changePwCurrent, setChangePwCurrent] = useState<string>("");
  const [changePwNew, setChangePwNew] = useState<string>("");
  const [changePwConfirm, setChangePwConfirm] = useState<string>("");
  const [showCurrentPw, setShowCurrentPw] = useState<boolean>(false);
  const [showNewPw, setShowNewPw] = useState<boolean>(false);
  const [showConfirmPw, setShowConfirmPw] = useState<boolean>(false);
  const [isChangingPw, setIsChangingPw] = useState<boolean>(false);
  const [changePwError, setChangePwError] = useState<string | null>(null);

  // Check server auth session on mount via /api/admin/auth/me
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setIsAuthenticated(true);
          }
        }
      } catch {
        // network or server offline
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsAuthenticating(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
      } else {
        setLoginError(data.error || "Invalid email or password");
      }
    } catch {
      setLoginError("Failed to reach server. Please check your connection.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch { }
    setIsAuthenticated(false);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErrorMessage(null);
    setForgotSuccessMessage(null);
    setIsSendingForgot(true);

    try {
      const res = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setForgotErrorMessage(data.error || "Too many reset attempts. Please try again later.");
      } else {
        setForgotSuccessMessage(data.message || "If this email belongs to an admin account, a reset link has been sent.");
      }
    } catch {
      setForgotErrorMessage("Failed to send reset link. Please check your network connection.");
    } finally {
      setIsSendingForgot(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePwError(null);

    if (!changePwCurrent) {
      setChangePwError("Current password is required.");
      return;
    }
    if (changePwNew.length < 12) {
      setChangePwError("New password must be at least 12 characters long.");
      return;
    }
    if (changePwNew !== changePwConfirm) {
      setChangePwError("New password and confirmation do not match.");
      return;
    }
    if (changePwCurrent === changePwNew) {
      setChangePwError("New password cannot be the same as your current password.");
      return;
    }

    setIsChangingPw(true);
    try {
      const res = await fetch("/api/admin/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: changePwCurrent,
          newPassword: changePwNew,
          confirmPassword: changePwConfirm,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowChangePasswordModal(false);
        setToastMessage("Password updated successfully. Other active sessions were terminated.");
        setTimeout(() => setToastMessage(null), 5000);
      } else {
        setChangePwError(data.error || "Failed to update password.");
      }
    } catch {
      setChangePwError("Network error. Please try again.");
    } finally {
      setIsChangingPw(false);
    }
  };

  // ==========================================
  // 2. DASHBOARD NAVIGATION & ACTIVE STATE
  // ==========================================
  const [activeTab, setActiveTab] = useState<
    "ENQUIRIES" | "ORDERS" | "CMS" | "HOMEPAGE_CATEGORIES" | "PRODUCTS" | "PRODUCT_IMAGES" | "CATEGORIES" | "DEALERS" | "BANNERS" | "HERO_PRODUCT_SALE" | "FLASH_SALE" | "REVIEWS" | "ABOUT_LEADERSHIP" | "PAYMENT_SETTINGS" | "EMAIL_SETTINGS" | "SOCIAL_LINKS"
  >("ENQUIRIES");

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab");
        if (tab && ["ENQUIRIES", "ORDERS", "CMS", "HOMEPAGE_CATEGORIES", "PRODUCTS", "PRODUCT_IMAGES", "CATEGORIES", "DEALERS", "BANNERS", "HERO_PRODUCT_SALE", "FLASH_SALE", "REVIEWS", "ABOUT_LEADERSHIP", "PAYMENT_SETTINGS", "EMAIL_SETTINGS", "SOCIAL_LINKS"].includes(tab)) {
          setActiveTab(tab as any);
        }
      } catch { }
    }
  }, []);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ==========================================
  // 3. TAB 1: CUSTOMER ENQUIRIES (CRM COMMAND)
  // ==========================================
  const [enquiries, setEnquiries] = useState<CustomerEnquiry[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("unitech_admin_enquiries");
        if (saved) return JSON.parse(saved);
      } catch { }
    }
    return [];
  });

  const [enquiryFilter, setEnquiryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [leadSearchQuery, setLeadSearchQuery] = useState<string>("");
  const [enquiryViewMode, setEnquiryViewMode] = useState<"cards" | "table">("cards");
  const [copiedLeadId, setCopiedLeadId] = useState<string | null>(null);

  // Sync enquiries to localStorage and server
  const [isFetchingEnquiries, setIsFetchingEnquiries] = useState<boolean>(false);

  // Orders & UPI verification state
  const [orders, setOrders] = useState<CheckoutOrder[]>([]);
  const [isFetchingOrders, setIsFetchingOrders] = useState<boolean>(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>("");
  const [orderPaymentStatusFilter, setOrderPaymentStatusFilter] = useState<string>("ALL");
  const [copiedUtrId, setCopiedUtrId] = useState<string | null>(null);

  const fetchLiveOrders = async (showNotification = false) => {
    setIsFetchingOrders(true);
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        setOrders(json.data);
        if (showNotification) {
          showToast(`✓ Synced ${json.data.length} orders from PostgreSQL!`);
        }
      }
    } catch (err) {
      console.warn("[Admin Orders Fetch Error]:", err);
    } finally {
      setIsFetchingOrders(false);
    }
  };

  const handleConfirmPayment = async (orderId: string) => {
    if (!window.confirm("Verify and confirm payment for this order? This will atomically allocate inventory and advance order to PROCESSING.")) return;
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, action: "confirm_payment" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("✓ Payment confirmed & inventory decremented.");
        fetchLiveOrders(false);
        fetchLiveProducts();
      } else {
        alert(data.error || "Failed to confirm payment.");
      }
    } catch (e: any) {
      alert("Error confirming payment: " + e.message);
    }
  };

  const handleRejectPayment = async (orderId: string) => {
    const reason = window.prompt("Enter rejection reason (optional):");
    if (reason === null) return;
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, action: "reject_payment", adminNotes: reason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("✓ Payment rejected & order cancelled.");
        fetchLiveOrders(false);
      } else {
        alert(data.error || "Failed to reject payment.");
      }
    } catch (e: any) {
      alert("Error rejecting payment: " + e.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, orderStatus: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, orderStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ Order status updated to ${orderStatus}.`);
        fetchLiveOrders(false);
      } else {
        alert(data.error || "Failed to update order status.");
      }
    } catch (e: any) {
      alert("Error updating order status: " + e.message);
    }
  };

  const fetchLiveEnquiries = async (showNotification = false) => {
    setIsFetchingEnquiries(true);
    try {
      const res = await fetch("/api/enquiries", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        setEnquiries(json.data);
        try {
          localStorage.setItem("unitech_admin_enquiries", JSON.stringify(json.data));
        } catch { }
        if (showNotification) {
          showToast(`✓ Synced ${json.data.length} live leads from server backend!`);
        }
      }
    } catch (err) {
      console.error("[Admin Enquiries Fetch Error]:", err);
    } finally {
      setIsFetchingEnquiries(false);
    }
  };

  // Fetch live hardware products from PostgreSQL
  const fetchLiveProducts = async () => {
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data) && json.data.length > 0) {
        setProducts(json.data);
        try {
          localStorage.setItem("unitech_admin_products", JSON.stringify(json.data));
        } catch { }
      }
    } catch (err) {
      console.warn("[Admin fetchLiveProducts Error]:", err);
    }
  };

  // Fetch live catalogues & datasheets from PostgreSQL
  const fetchLiveDocuments = async () => {
    try {
      const res = await fetch("/api/documents", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data) && json.data.length > 0) {
        setDocuments(json.data);
        try {
          localStorage.setItem("unitech_live_catalogues", JSON.stringify(json.data));
        } catch { }
      }
    } catch (err) {
      console.warn("[Admin fetchLiveDocuments Error]:", err);
    }
  };

  // Fetch live sales & ticker banners from PostgreSQL
  const fetchLiveBanners = async () => {
    try {
      const res = await fetch("/api/banners", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data) && json.data.length > 0) {
        setBanners(json.data);
        try {
          localStorage.setItem("unitech_admin_banners", JSON.stringify(json.data));
        } catch { }
      }
    } catch (err) {
      console.warn("[Admin fetchLiveBanners Error]:", err);
    }
  };

  // Fetch live customer & dealer reviews from PostgreSQL
  const fetchLiveReviews = async () => {
    try {
      const res = await fetch("/api/reviews", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data) && json.data.length > 0) {
        setReviews(json.data);
        try {
          localStorage.setItem("unitech_admin_reviews", JSON.stringify(json.data));
        } catch { }
      }
    } catch (err) {
      console.warn("[Admin fetchLiveReviews Error]:", err);
    }
  };

  // Auto-fetch all live data from PostgreSQL on mount & poll every 12 seconds
  useEffect(() => {
    fetchLiveEnquiries(false);
    fetchLiveOrders(false);
    fetchLiveProducts();
    fetchLiveDocuments();
    fetchLiveBanners();
    fetchLiveReviews();

    const interval = setInterval(() => {
      fetchLiveEnquiries(false);
      fetchLiveOrders(false);
      fetchLiveProducts();
      fetchLiveDocuments();
      fetchLiveBanners();
      fetchLiveReviews();
      fetchLiveDealers();
    }, 12000);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "unitech_admin_enquiries") fetchLiveEnquiries(false);
      if (e.key === "unitech_admin_products") fetchLiveProducts();
      if (e.key === "unitech_live_catalogues") fetchLiveDocuments();
      if (e.key === "unitech_admin_banners") fetchLiveBanners();
      if (e.key === "unitech_admin_reviews") fetchLiveReviews();
      if (e.key === "unitech_admin_dealers") fetchLiveDealers();
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const updateEnquiriesState = (newEnqs: CustomerEnquiry[]) => {
    setEnquiries(newEnqs);
    try {
      localStorage.setItem("unitech_admin_enquiries", JSON.stringify(newEnqs));
    } catch { }
  };

  const handleStatusChange = async (id: string, status: EnquiryStatus) => {
    const updated = enquiries.map((e) => (e.id === id ? { ...e, status } : e));
    updateEnquiriesState(updated);
    showToast(`Lead #${id} status updated to: ${status}`);

    try {
      await fetch("/api/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
    } catch (err) {
      console.error("[Failed to patch status on backend]:", err);
    }
  };

  const handleCopyLeadDetails = (enq: CustomerEnquiry) => {
    const text = `Unitech Lead Reference: #${enq.id}\nName: ${enq.fullName}\nCompany: ${enq.companyName || "N/A"}\nPhone: ${enq.phone}\nEmail: ${enq.email}\nLocation: ${enq.city}, ${enq.state}\nType: ${enq.type}\nBudget: ${enq.budget || "N/A"}\nDetails: ${enq.details}`;
    navigator.clipboard.writeText(text);
    setCopiedLeadId(enq.id);
    setTimeout(() => setCopiedLeadId(null), 2000);
    showToast(`Lead #${enq.id} copied to clipboard!`);
  };

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((e) => {
      // Type filter
      if (enquiryFilter !== "ALL" && e.type !== enquiryFilter) {
        if (!(enquiryFilter === "OEM" && e.type === "SERVICE_WARRANTY")) {
          return false;
        }
      }
      // Status filter
      if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
      // Search query
      if (leadSearchQuery.trim()) {
        const q = leadSearchQuery.toLowerCase();
        const matchesName = e.fullName.toLowerCase().includes(q);
        const matchesCompany = (e.companyName || "").toLowerCase().includes(q);
        const matchesCity = e.city.toLowerCase().includes(q);
        const matchesPhone = e.phone.toLowerCase().includes(q);
        const matchesGst = (e.gstin || "").toLowerCase().includes(q);
        const matchesProduct = (e.productModel || "").toLowerCase().includes(q);
        if (!matchesName && !matchesCompany && !matchesCity && !matchesPhone && !matchesGst && !matchesProduct) {
          return false;
        }
      }
      return true;
    });
  }, [enquiries, enquiryFilter, statusFilter, leadSearchQuery]);

  // Lead metrics
  const newLeadsCount = enquiries.filter((e) => e.status === "NEW").length;
  const contactedLeadsCount = enquiries.filter((e) => e.status === "CONTACTED").length;
  const convertedLeadsCount = enquiries.filter((e) => e.status === "CONVERTED").length;

  // ==========================================
  // 4. TAB 2: LIVE WEBSITE CMS & PDF REGISTRY
  // ==========================================
  const [documents, setDocuments] = useState<LiveDocumentAsset[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("unitech_live_catalogues");
        if (saved) return JSON.parse(saved);
      } catch { }
    }
    return [];
  });

  const [topTickerText, setTopTickerText] = useState<string>(
    "Manufacturer of CCTV, cables & networking · Made in India · Pan-India dispatch"
  );

  // Edit / Replace PDF Modal state
  const [replaceModalDoc, setReplaceModalDoc] = useState<LiveDocumentAsset | null>(null);
  const [previewModalDoc, setPreviewModalDoc] = useState<LiveDocumentAsset | null>(null);
  const [pdfUploadFile, setPdfUploadFile] = useState<File | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [replaceTitle, setReplaceTitle] = useState("");
  const [replaceVersion, setReplaceVersion] = useState("");
  const [replaceSize, setReplaceSize] = useState("");
  const [replaceUrl, setReplaceUrl] = useState("");
  const [replaceRevisionNotes, setReplaceRevisionNotes] = useState("");
  const [replaceSection, setReplaceSection] = useState<"catalogues" | "software" | "warranty-rma">("catalogues");
  const [replaceFormat, setReplaceFormat] = useState<"PDF" | "EXE" | "ZIP" | "BIN" | "APK">("PDF");
  const [cmsSectionFilter, setCmsSectionFilter] = useState<"ALL" | "catalogues" | "software" | "warranty-rma">("ALL");

  // Add Document Modal State (Issue-6 Solution for all 3 support sections)
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocSection, setNewDocSection] = useState<"catalogues" | "software" | "warranty-rma">("catalogues");
  const [newDocCategory, setNewDocCategory] = useState("Datasheets");
  const [newDocVersion, setNewDocVersion] = useState("v2026.1");
  const [newDocSize, setNewDocSize] = useState("2.5 MB");
  const [newDocFormat, setNewDocFormat] = useState<"PDF" | "EXE" | "ZIP" | "BIN" | "APK">("PDF");
  const [newDocUrl, setNewDocUrl] = useState("");
  const [newDocSummary, setNewDocSummary] = useState("");
  const [newDocUploadFile, setNewDocUploadFile] = useState<File | null>(null);
  const [isUploadingNewDoc, setIsUploadingNewDoc] = useState(false);

  const handleOpenAddDocModal = () => {
    setNewDocTitle("");
    setNewDocSection(cmsSectionFilter === "ALL" ? "catalogues" : cmsSectionFilter);
    setNewDocCategory(
      cmsSectionFilter === "software"
        ? "Software"
        : cmsSectionFilter === "warranty-rma"
          ? "Policy"
          : "Datasheets"
    );
    setNewDocVersion("v2026.1");
    setNewDocSize("2.5 MB");
    setNewDocFormat(cmsSectionFilter === "software" ? "EXE" : "PDF");
    setNewDocUrl("");
    setNewDocSummary("");
    setNewDocUploadFile(null);
    setIsUploadingNewDoc(false);
    setShowAddDocModal(true);
  };

  const handleNewDocFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewDocUploadFile(file);
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(1) + " MB";
      setNewDocSize(sizeInMb);

      // Auto-detect format from extension
      const ext = file.name.split(".").pop()?.toUpperCase();
      if (ext === "PDF" || ext === "EXE" || ext === "ZIP" || ext === "APK" || ext === "BIN") {
        setNewDocFormat(ext as any);
        if (ext === "EXE" || ext === "ZIP" || ext === "APK") {
          setNewDocSection("software");
          setNewDocCategory("Software");
        }
      }

      // If title is empty, prefill title from file name
      if (!newDocTitle.trim()) {
        const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setNewDocTitle(cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1));
      }

      setIsUploadingNewDoc(true);
      showToast(`Uploading ${file.name} to server & database storage...`);

      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();
        if (json.success && json.fileUrl) {
          setNewDocUrl(json.fileUrl);
          showToast(`✓ Uploaded & Stored in PostgreSQL: ${file.name} (${json.fileSize || sizeInMb})`);
        } else {
          const sanitizedName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, "-");
          setNewDocUrl(`/downloads/${sanitizedName}`);
          showToast(`Selected: ${file.name} (${sizeInMb})`);
        }
      } catch (err) {
        console.error("[Document Upload Error]:", err);
        const sanitizedName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, "-");
        setNewDocUrl(`/downloads/${sanitizedName}`);
      } finally {
        setIsUploadingNewDoc(false);
      }
    }
  };

  const handleCreateNewDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    const now = new Date();
    const updatedMonthYear = now.toLocaleString("default", { month: "short", year: "numeric" });
    const slugId = `doc-${Date.now().toString(36)}`;

    const newDoc: LiveDocumentAsset = {
      id: slugId,
      title: newDocTitle.trim(),
      section: newDocSection,
      category: newDocCategory.trim() as any,
      version: newDocVersion.trim() || "v1.0",
      fileSize: newDocSize.trim() || "1.0 MB",
      format: newDocFormat,
      fileUrl: newDocUrl.trim() || `/downloads/${slugId}.${newDocFormat.toLowerCase()}`,
      updatedDate: updatedMonthYear,
      isLive: true,
      revisionSummary: newDocSummary.trim(),
    };

    const updated = [newDoc, ...documents];
    setDocuments(updated);
    try {
      localStorage.setItem("unitech_live_catalogues", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
    } catch { }

    fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDoc),
    }).catch((err) => console.warn("[Document Create Error]:", err));

    setShowAddDocModal(false);
    showToast(`✓ Added new resource "${newDoc.title}" to ${newDoc.section}!`);
  };

  const handleDeleteDocument = async (docId: string) => {
    const docToDelete = documents.find((d) => d.id === docId);
    const docName = docToDelete?.title || "this document";
    if (confirm(`Are you sure you want to permanently delete "${docName}" from the downloads hub?`)) {
      const updated = documents.filter((d) => d.id !== docId);
      setDocuments(updated);
      try {
        localStorage.setItem("unitech_live_catalogues", JSON.stringify(updated));
      } catch { }

      try {
        const res = await fetch(`/api/documents?id=${encodeURIComponent(docId)}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (json.success) {
          showToast(`✓ Removed "${docName}" permanently from PostgreSQL database.`);
        } else {
          showToast(`Warning: Failed to delete on database: ${json.error || "Unknown error"}`);
          fetchLiveDocuments();
        }
      } catch (err) {
        console.error("[Delete Document Error]:", err);
        showToast("Network error deleting document from database.");
        fetchLiveDocuments();
      }
    }
  };

  const handleOpenReplaceModal = (doc: LiveDocumentAsset) => {
    setReplaceModalDoc(doc);
    setReplaceTitle(doc.title);
    setReplaceVersion(doc.version);
    setReplaceSize(doc.fileSize);
    setReplaceUrl(doc.fileUrl);
    setReplaceRevisionNotes(doc.revisionSummary || "");
    setReplaceSection(doc.section || "catalogues");
    setReplaceFormat(doc.format || "PDF");
    setPdfUploadFile(null);
  };

  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfUploadFile(file);
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(1) + " MB";
      setReplaceSize(sizeInMb);

      // Auto-detect format from extension
      const ext = file.name.split(".").pop()?.toUpperCase();
      if (ext === "PDF" || ext === "EXE" || ext === "ZIP" || ext === "APK" || ext === "BIN") {
        setReplaceFormat(ext as any);
        if (ext === "EXE" || ext === "ZIP" || ext === "APK") {
          setReplaceSection("software");
        }
      }
      setIsUploadingPdf(true);
      showToast(`Uploading ${file.name} to server & database storage...`);

      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();
        if (json.success && json.fileUrl) {
          setReplaceUrl(json.fileUrl);
          showToast(`✓ Uploaded & Stored in PostgreSQL: ${file.name} (${json.fileSize || sizeInMb})`);
        } else {
          const sanitizedName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, "-");
          setReplaceUrl(`/downloads/${sanitizedName}`);
          showToast(`Selected: ${file.name} (${sizeInMb})`);
        }
      } catch (err) {
        console.error("[PDF Upload Error]:", err);
        const sanitizedName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, "-");
        setReplaceUrl(`/downloads/${sanitizedName}`);
      } finally {
        setIsUploadingPdf(false);
      }
    }
  };

  const handleSavePdfReplacement = () => {
    if (!replaceModalDoc) return;
    const now = new Date();
    const updatedMonthYear = now.toLocaleString("default", { month: "short", year: "numeric" });

    const updatedList = documents.map((d) => {
      if (d.id === replaceModalDoc.id) {
        return {
          ...d,
          title: replaceTitle,
          version: replaceVersion,
          fileSize: replaceSize,
          fileUrl: replaceUrl,
          updatedDate: updatedMonthYear,
          revisionSummary: replaceRevisionNotes,
          section: replaceSection,
          format: replaceFormat,
          isLive: true,
        };
      }
      return d;
    });

    setDocuments(updatedList);
    try {
      localStorage.setItem("unitech_live_catalogues", JSON.stringify(updatedList));
      window.dispatchEvent(new Event("storage"));
    } catch { }

    const updatedDoc = updatedList.find((d) => d.id === replaceModalDoc.id);
    if (updatedDoc) {
      fetch("/api/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDoc),
      }).catch((err) => console.warn("[Live Document Patch Error]:", err));
    }

    setReplaceModalDoc(null);
    showToast(`✓ Document Updated & Published Live: "${replaceTitle}" is now live!`);
  };

  const handlePublishAllCms = async () => {
    try {
      localStorage.setItem("unitech_live_catalogues", JSON.stringify(documents));
      localStorage.setItem("unitech_live_ticker", topTickerText);
      window.dispatchEvent(new Event("storage"));

      await fetch("/api/documents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(documents),
      });
    } catch (err) {
      console.warn("[Publish CMS Error]:", err);
    }
    showToast("✓ All CMS Changes & PDF Links Synced to PostgreSQL & Published Live!");
  };

  // ==========================================
  // 5. TAB 3: PRICING & STOCK TICKER
  // ==========================================
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("unitech_admin_products");
        if (saved) return JSON.parse(saved);
      } catch { }
    }
    return [];
  });

  const [productCategoryFilter, setProductCategoryFilter] = useState<string>("ALL");
  const [productSearch, setProductSearch] = useState<string>("");
  const [editingProdId, setEditingProdId] = useState<string | null>(null);

  // Edit fields
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editTier2Price, setEditTier2Price] = useState<number>(0);
  const [editDealerPrice, setEditDealerPrice] = useState<number>(0);
  const [editMrp, setEditMrp] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [editCableLengths, setEditCableLengths] = useState<CableLengthOption[]>([]);

  const updateProductsState = (newProds: Product[]) => {
    setProducts(newProds);
    try {
      localStorage.setItem("unitech_admin_products", JSON.stringify(newProds));
      window.dispatchEvent(new Event("storage"));
    } catch { }
  };

  // -------------------------------------------------------------
  // PRODUCT IMAGE & DATASHEET UPDATION MODAL STATE
  // -------------------------------------------------------------
  const [imageModalProduct, setImageModalProduct] = useState<Product | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImageUrlInput, setProductImageUrlInput] = useState<string>("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [isUploadingProductImage, setIsUploadingProductImage] = useState<boolean>(false);
  const [productDatasheetUrlInput, setProductDatasheetUrlInput] = useState<string>("");
  const [productDatasheetFile, setProductDatasheetFile] = useState<File | null>(null);
  const [isUploadingProductDatasheet, setIsUploadingProductDatasheet] = useState<boolean>(false);

  const handleOpenImageModal = (p: Product) => {
    setImageModalProduct(p);
    setProductImageFile(null);
    setProductImageUrlInput(p.imageUrl || "");
    setImagePreviewUrl(p.imageUrl || "");
    setIsUploadingProductImage(false);
    setProductDatasheetUrlInput(p.datasheetPdfUrl || "");
    setProductDatasheetFile(null);
    setIsUploadingProductDatasheet(false);
  };

  const handleProductImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProductImageFile(file);
    // Instant local preview
    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);

    // Upload immediately in background to server endpoint
    setIsUploadingProductImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/products/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success && data.fileUrl) {
        setProductImageUrlInput(data.fileUrl);
        setImagePreviewUrl(data.fileUrl);
      } else {
        // Fallback to base64 if upload fails
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            setProductImageUrlInput(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (uploadErr) {
      console.warn("[Product Image Upload Error]:", uploadErr);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setProductImageUrlInput(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingProductImage(false);
    }
  };

  const handleProductDatasheetFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      showToast("⚠️ Please upload a valid PDF document datasheet.");
      return;
    }

    setProductDatasheetFile(file);
    setIsUploadingProductDatasheet(true);
    showToast(`Uploading datasheet "${file.name}" to database...`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success && data.fileUrl) {
        setProductDatasheetUrlInput(data.fileUrl);
        showToast(`✓ Datasheet stored in PostgreSQL: ${file.name}`);
      } else {
        const sanitized = `/downloads/${file.name.toLowerCase().replace(/[^a-z0-9.]/g, "-")}`;
        setProductDatasheetUrlInput(sanitized);
      }
    } catch (uploadErr) {
      console.warn("[Datasheet PDF Upload Error]:", uploadErr);
      const sanitized = `/downloads/${file.name.toLowerCase().replace(/[^a-z0-9.]/g, "-")}`;
      setProductDatasheetUrlInput(sanitized);
    } finally {
      setIsUploadingProductDatasheet(false);
    }
  };

  const handleSaveProductImage = async () => {
    if (!imageModalProduct) return;
    const targetId = imageModalProduct.id;
    let newImageUrl = productImageUrlInput.trim() || undefined;
    let newDatasheetUrl = productDatasheetUrlInput.trim() || undefined;

    // If an upload is pending or blob URL exists, upload first
    if (productImageFile && (!newImageUrl || newImageUrl.startsWith("blob:"))) {
      try {
        const formData = new FormData();
        formData.append("file", productImageFile);
        const res = await fetch("/api/products/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.success && data.fileUrl) {
          newImageUrl = data.fileUrl;
        }
      } catch (err) {
        console.warn("[Save Image Upload Fallback Error]:", err);
      }
    }

    const updated = products.map((p) => {
      if (p.id === targetId) {
        return {
          ...p,
          imageUrl: newImageUrl,
          datasheetPdfUrl: newDatasheetUrl,
        };
      }
      return p;
    });

    updateProductsState(updated);
    setImageModalProduct(null);
    setProductImageFile(null);
    setProductDatasheetFile(null);
    showToast(
      `✓ Product assets & datasheet updated for "${imageModalProduct.modelCode}"! Stored in PostgreSQL.`
    );

    fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: targetId,
        imageUrl: newImageUrl,
        datasheetPdfUrl: newDatasheetUrl,
      }),
    }).catch((err) => console.warn("[Product Asset DB Sync Error]:", err));
  };

  // -------------------------------------------------------------
  // PRODUCT SPECS & FEATURES MODAL STATE & HANDLERS
  // -------------------------------------------------------------
  const [specsModalProduct, setSpecsModalProduct] = useState<Product | null>(null);
  const [isEditingSpecs, setIsEditingSpecs] = useState<boolean>(false);
  const [editableSpecs, setEditableSpecs] = useState<{ key: string; value: string }[]>([]);
  const [editableHighlights, setEditableHighlights] = useState<string[]>([]);
  const [editableDatasheetUrl, setEditableDatasheetUrl] = useState<string>("");
  const [isUploadingSpecsDatasheet, setIsUploadingSpecsDatasheet] = useState<boolean>(false);
  const [isSavingSpecs, setIsSavingSpecs] = useState<boolean>(false);

  const handleOpenSpecsModal = (p: Product) => {
    setSpecsModalProduct(p);
    const specsList = Object.entries(p.specs || {}).map(([key, value]) => ({
      key,
      value: String(value),
    }));
    setEditableSpecs(specsList);
    setEditableHighlights([...(p.highlights || [])]);
    setEditableDatasheetUrl(p.datasheetPdfUrl || "");
    setIsEditingSpecs(false);
  };

  const handleAddSpecRow = () => {
    setEditableSpecs((prev) => [...prev, { key: "", value: "" }]);
  };

  const handleRemoveSpecRow = (index: number) => {
    setEditableSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index: number, field: "key" | "value", val: string) => {
    setEditableSpecs((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleAddHighlightRow = () => {
    setEditableHighlights((prev) => [...prev, ""]);
  };

  const handleRemoveHighlightRow = (index: number) => {
    setEditableHighlights((prev) => prev.filter((_, i) => i !== index));
  };

  const handleHighlightChange = (index: number, val: string) => {
    setEditableHighlights((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleSpecsDatasheetFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      showToast("⚠️ Please upload a valid PDF document datasheet.");
      return;
    }

    setIsUploadingSpecsDatasheet(true);
    showToast(`Uploading datasheet "${file.name}" to database...`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success && data.fileUrl) {
        setEditableDatasheetUrl(data.fileUrl);
        showToast(`✓ Datasheet stored in PostgreSQL: ${file.name}`);
      } else {
        const sanitized = `/downloads/${file.name.toLowerCase().replace(/[^a-z0-9.]/g, "-")}`;
        setEditableDatasheetUrl(sanitized);
      }
    } catch (uploadErr) {
      console.warn("[Specs Datasheet PDF Upload Error]:", uploadErr);
      const sanitized = `/downloads/${file.name.toLowerCase().replace(/[^a-z0-9.]/g, "-")}`;
      setEditableDatasheetUrl(sanitized);
    } finally {
      setIsUploadingSpecsDatasheet(false);
    }
  };

  const handleSaveAndPublishSpecs = async () => {
    if (!specsModalProduct) return;
    setIsSavingSpecs(true);

    const newSpecs: Record<string, string> = {};
    for (const item of editableSpecs) {
      if (item.key.trim()) {
        newSpecs[item.key.trim()] = item.value.trim();
      }
    }

    const newHighlights = editableHighlights.map((h) => h.trim()).filter(Boolean);
    const finalDatasheetUrl = editableDatasheetUrl.trim() || undefined;

    const updatedProducts = products.map((prod) => {
      if (prod.id === specsModalProduct.id) {
        return {
          ...prod,
          specs: newSpecs,
          highlights: newHighlights,
          datasheetPdfUrl: finalDatasheetUrl,
        };
      }
      return prod;
    });

    updateProductsState(updatedProducts);
    setSpecsModalProduct((prev) =>
      prev ? { ...prev, specs: newSpecs, highlights: newHighlights, datasheetPdfUrl: finalDatasheetUrl } : null
    );
    setIsEditingSpecs(false);
    setIsSavingSpecs(false);

    showToast(
      `✓ Specifications & features published live on site for "${specsModalProduct.name}"!`
    );

    try {
      await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: specsModalProduct.id,
          specs: newSpecs,
          highlights: newHighlights,
          datasheetPdfUrl: finalDatasheetUrl || null,
        }),
      });
    } catch (apiErr) {
      console.warn("[Specs PATCH API error]:", apiErr);
    }
  };

  // -------------------------------------------------------------
  // SHARED PRODUCT FORM MODAL STATE (CREATE & EDIT)
  // -------------------------------------------------------------
  const [productFormOpen, setProductFormOpen] = useState<boolean>(false);
  const [productFormMode, setProductFormMode] = useState<"create" | "edit">("create");
  const [productFormTarget, setProductFormTarget] = useState<Product | null>(null);

  const handleOpenAddProductModal = () => {
    setProductFormMode("create");
    setProductFormTarget(null);
    setProductFormOpen(true);
  };

  const handleOpenEditProductModal = (p: Product) => {
    setProductFormMode("edit");
    setProductFormTarget(p);
    setProductFormOpen(true);
  };

  const handleProductFormSuccess = (savedProduct: Product, isNew: boolean) => {
    if (isNew) {
      const updated = [savedProduct, ...products];
      updateProductsState(updated);
    } else {
      const updated = products.map((p) => (p.id === savedProduct.id ? savedProduct : p));
      updateProductsState(updated);
    }
  };

  // -------------------------------------------------------------
  // DELETE PRODUCT STATE
  // -------------------------------------------------------------
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const handleConfirmDeleteProduct = () => {
    if (!productToDelete) return;
    const prodId = productToDelete.id;
    const updated = products.filter((p) => p.id !== prodId);
    updateProductsState(updated);
    showToast(`✓ Product "${productToDelete.modelCode}" (${productToDelete.name}) removed from catalogue.`);

    fetch(`/api/products?id=${prodId}`, {
      method: "DELETE",
    }).catch((err) => console.warn("[Delete Product DB Error]:", err));

    setProductToDelete(null);
  };

  const handleStartEditProduct = (p: Product) => {
    setEditingProdId(p.id);
    setEditPrice(p.price);
    setEditTier2Price(p.tier2Price || Math.round(p.price * 0.85));
    setEditDealerPrice(p.dealerPrice);
    setEditMrp(p.mrp);
    setEditStock(p.stockQuantity);
    setEditCableLengths(
      p.cableLengths && p.cableLengths.length > 0
        ? JSON.parse(JSON.stringify(p.cableLengths))
        : p.category === "cables"
          ? [
            { label: "90 Yards / 90m Roll (Standard Coil)", priceDelta: 0 },
            { label: "180 Yards / 180m Roll (Double Coil)", priceDelta: 935 },
            { label: "305 Meters / 1000ft (Full Drum Box)", priceDelta: 2090 },
          ]
          : []
    );
  };

  const handleSaveProductRow = (prodId: string) => {
    const updated = products.map((p) => {
      if (p.id === prodId) {
        return {
          ...p,
          price: editPrice,
          tier2Price: editTier2Price,
          dealerPrice: editDealerPrice,
          mrp: editMrp,
          stockQuantity: editStock,
          cableLengths: editCableLengths.length > 0 ? editCableLengths : p.cableLengths,
        };
      }
      return p;
    });

    updateProductsState(updated);
    setEditingProdId(null);
    showToast(
      editStock === 0
        ? `Product updated: Stock set to 0. Flagged as OUT OF STOCK on storefront!`
        : `Product rates & inventory saved for ${prodId}!`
    );

    fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: prodId,
        price: editPrice,
        tier2Price: editTier2Price,
        dealerPrice: editDealerPrice,
        mrp: editMrp,
        stockQuantity: editStock,
        cableLengths: editCableLengths.length > 0 ? editCableLengths : undefined,
      }),
    }).catch((err) => console.warn("[Product Update DB Error]:", err));
  };

  const handleStockStepper = (prodId: string, delta: number) => {
    const updated = products.map((p) => {
      if (p.id === prodId) {
        const newStock = Math.max(0, p.stockQuantity + delta);
        return { ...p, stockQuantity: newStock };
      }
      return p;
    });
    updateProductsState(updated);
    const target = updated.find((p) => p.id === prodId);
    if (target?.stockQuantity === 0) {
      showToast(`⚠️ ${target.modelCode} stock reached 0: Marked as OUT OF STOCK!`);
    }

    if (target) {
      fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: prodId,
          stockQuantity: target.stockQuantity,
        }),
      }).catch((err) => console.warn("[Stock Stepper DB Error]:", err));
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (productCategoryFilter !== "ALL" && p.category !== productCategoryFilter) return false;
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.modelCode.toLowerCase().includes(q) ||
          p.categoryLabel.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, productCategoryFilter, productSearch]);

  // Inventory stats
  const totalSkus = products.length;
  const outOfStockCount = products.filter((p) => p.stockQuantity === 0).length;
  const lowStockCount = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity < 10).length;
  const healthyStockCount = products.filter((p) => p.stockQuantity >= 10).length;

  // ==========================================
  // 6. TAB 4: SALES & TICKER BANNERS STUDIO
  // ==========================================
  const BRAND_BANNER_TEMPLATES = [
    {
      id: "tpl-factory-dispatch",
      name: "Factory Wholesale Dispatch",
      tagline: "Sahibabad Plant B2B Ticker",
      icon: "🏭",
      type: "TOP_TICKER" as const,
      tag: "FACTORY LIVE",
      title: "SAME-DAY PAN-INDIA WHOLESALE DISPATCH FROM SAHIBABAD PLANT ON 4MP & DVR ORDERS",
      subtitle: "Direct Factory Wholesale Rates · GST 18% Input Credit Tax Invoicing",
      ctaText: "Contact Sales Desk",
      ctaLink: "#contact",
      accent: "red" as const,
      customTags: ["Sahibabad Site 2", "GST 18% Invoicing", "Same-Day Dispatch"],
    },
    {
      id: "tpl-gem-tender",
      name: "GeM Govt & PSU Tender",
      tagline: "Govt Smart City Procurement",
      icon: "🏛️",
      type: "TOP_TICKER" as const,
      tag: "GEM VERIFIED",
      title: "GEM PORTAL CERTIFIED SUPPLIER FOR POLICE, SMART CITY & RAILWAY TENDERS",
      subtitle: "100% Make in India Compliant · Direct OEM BOQ Matching & Supply Support",
      ctaText: "Submit Tender BOQ",
      ctaLink: "#contact",
      accent: "emerald" as const,
      customTags: ["GeM Registered OEM", "Make In India", "PSU BOQ Match"],
    },
    {
      id: "tpl-dealer-promo",
      name: "Dealer Special Margin",
      tagline: "Tier-1 Bulk Distributor Rates",
      icon: "⚡",
      type: "FLASH_SALE" as const,
      tag: "DEALER SPECIAL",
      title: "EXCLUSIVE FACTORY ALLOCATION: FLAT 3.5% EXTRA MARGIN ON COAXIAL & CAT6 305M DRUMS",
      subtitle: "Immediate buffer stock allocation from Ghaziabad central dispatch warehouse",
      ctaText: "Claim Dealer Rates",
      ctaLink: "#catalog",
      accent: "amber" as const,
      customTags: ["100% Solid Copper", "0% CCA", "Tier-1 B2B Rate"],
    },
    {
      id: "tpl-hardware-launch",
      name: "New Hardware Series",
      tagline: "Next-Gen Product Announcement",
      icon: "📦",
      type: "HERO_SLIDE" as const,
      tag: "NEW RELEASE",
      title: "UNITECH 5MP STARLIGHT COLOR DOME SERIES NOW ROLLING OFF MASS PRODUCTION LINE",
      subtitle: "F1.0 Super Aperture · Smart Dual Warm Light LEDs · 2-Year Direct RMA Guarantee",
      ctaText: "View Master Specs",
      ctaLink: "/catalogue",
      accent: "slate" as const,
      customTags: ["Full Color 24/7", "Sony Sensor", "IP66 Vandal"],
    },
  ];

  const [banners, setBanners] = useState<AnnouncementBanner[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("unitech_admin_banners");
        if (saved) return JSON.parse(saved);
      } catch { }
    }
    return [];
  });

  // Banner Creator Studio State & Custom Fields
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<string>("tpl-factory-dispatch");
  const [studioType, setStudioType] = useState<"TOP_TICKER" | "HERO_SLIDE" | "FLASH_SALE">("TOP_TICKER");
  const [studioTag, setStudioTag] = useState<string>("FACTORY LIVE");
  const [studioTitle, setStudioTitle] = useState<string>("SAME-DAY PAN-INDIA WHOLESALE DISPATCH FROM SAHIBABAD PLANT ON 4MP & DVR ORDERS");
  const [studioSubtitle, setStudioSubtitle] = useState<string>("Direct Factory Wholesale Rates · GST 18% Input Credit Tax Invoicing");
  const [studioCtaText, setStudioCtaText] = useState<string>("Contact Sales Desk");
  const [studioCtaLink, setStudioCtaLink] = useState<string>("#contact");
  const [studioAccent, setStudioAccent] = useState<"red" | "emerald" | "amber" | "slate">("red");
  const [studioDiscount, setStudioDiscount] = useState<number>(0);
  const [studioCustomTags, setStudioCustomTags] = useState<string[]>([
    "Sahibabad Site 2",
    "GST 18% Invoicing",
    "Same-Day Dispatch",
  ]);
  const [newCustomTagInput, setNewCustomTagInput] = useState<string>("");

  const updateBannersState = (newBans: AnnouncementBanner[]) => {
    setBanners(newBans);
    try {
      localStorage.setItem("unitech_admin_banners", JSON.stringify(newBans));
    } catch { }
  };

  const handleApplyTemplate = (tpl: (typeof BRAND_BANNER_TEMPLATES)[0]) => {
    setActiveTemplateId(tpl.id);
    setStudioType(tpl.type);
    setStudioTag(tpl.tag);
    setStudioTitle(tpl.title);
    setStudioSubtitle(tpl.subtitle);
    setStudioCtaText(tpl.ctaText);
    setStudioCtaLink(tpl.ctaLink);
    setStudioAccent(tpl.accent);
    setStudioCustomTags([...tpl.customTags]);
    showToast(`Standard Template Applied: "${tpl.name}"`);
  };

  const handleAddCustomTag = () => {
    const trimmed = newCustomTagInput.trim();
    if (trimmed && !studioCustomTags.includes(trimmed)) {
      setStudioCustomTags([...studioCustomTags, trimmed]);
      setNewCustomTagInput("");
      showToast(`Added custom tag: "${trimmed}"`);
    }
  };

  const handleRemoveCustomTag = (tagToRemove: string) => {
    setStudioCustomTags(studioCustomTags.filter((t) => t !== tagToRemove));
  };

  const handleStartEditBanner = (ban: AnnouncementBanner) => {
    setEditingBannerId(ban.id);
    setStudioType(ban.type);
    setStudioTag(ban.badgeText || "");
    setStudioTitle(ban.title);
    setStudioSubtitle(ban.subtitle || "");
    setStudioCtaText(ban.ctaText || "Learn More");
    setStudioCtaLink(ban.ctaLink || "#contact");
    setStudioAccent(ban.accentStyle || "red");
    setStudioDiscount(ban.discountPercent || 0);
    setStudioCustomTags(ban.customTags || ["Sahibabad Site 2", "GST 18% Invoicing"]);
    // Smooth scroll to studio form
    window.scrollTo({ top: 100, behavior: "smooth" });
    showToast(`Loaded "${ban.id}" into Standard Template Customizer.`);
  };

  const handleCancelEditBanner = () => {
    setEditingBannerId(null);
    handleApplyTemplate(BRAND_BANNER_TEMPLATES[0]);
    showToast("Cancelled edit. Reset to standard brand template.");
  };

  const handleToggleBanner = (id: string) => {
    const updated = banners.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b));
    updateBannersState(updated);
    const target = updated.find((b) => b.id === id);
    showToast(target?.isActive ? `Banner is now LIVE on storefront!` : `Banner is now PAUSED / HIDDEN.`);

    if (target) {
      fetch("/api/banners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: target.isActive }),
      }).catch((err) => console.warn("[Toggle Banner DB Error]:", err));
    }
  };

  const handleDeleteBanner = (id: string) => {
    const updated = banners.filter((b) => b.id !== id);
    updateBannersState(updated);
    if (editingBannerId === id) {
      setEditingBannerId(null);
    }
    showToast("Banner removed from registry.");

    fetch(`/api/banners?id=${id}`, {
      method: "DELETE",
    }).catch((err) => console.warn("[Delete Banner DB Error]:", err));
  };

  const handleSaveStudioBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studioTitle.trim()) return;

    if (editingBannerId) {
      // Update existing banner
      const updated = banners.map((b) => {
        if (b.id === editingBannerId) {
          return {
            ...b,
            title: studioTitle.trim().toUpperCase(),
            subtitle: studioSubtitle.trim() || undefined,
            badgeText: studioTag.trim().toUpperCase() || undefined,
            ctaText: studioCtaText.trim() || undefined,
            ctaLink: studioCtaLink.trim() || undefined,
            type: studioType,
            accentStyle: studioAccent,
            discountPercent: studioDiscount > 0 ? studioDiscount : undefined,
            customTags: studioCustomTags,
          };
        }
        return b;
      });
      updateBannersState(updated);
      const target = updated.find((b) => b.id === editingBannerId);
      setEditingBannerId(null);
      showToast(`✓ Banner "${editingBannerId}" updated and published live!`);

      if (target) {
        fetch("/api/banners", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(target),
        }).catch((err) => console.warn("[Update Banner DB Error]:", err));
      }
    } else {
      // Create new banner
      const newBanner: AnnouncementBanner = {
        id: `ban-${Date.now()}`,
        title: studioTitle.trim().toUpperCase(),
        subtitle: studioSubtitle.trim() || undefined,
        badgeText: studioTag.trim().toUpperCase() || undefined,
        ctaText: studioCtaText.trim() || undefined,
        ctaLink: studioCtaLink.trim() || undefined,
        type: studioType,
        isActive: true,
        accentStyle: studioAccent,
        discountPercent: studioDiscount > 0 ? studioDiscount : undefined,
        customTags: studioCustomTags,
      };

      const updated = [newBanner, ...banners];
      updateBannersState(updated);
      showToast(`✓ New ${studioType} Banner Published Live to Storefront!`);

      fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBanner),
      }).catch((err) => console.warn("[Create Banner DB Error]:", err));
    }
  };



  // ==========================================
  // 7. TAB 5: GOOGLE REVIEWS & TESTIMONIALS
  // ==========================================
  const [reviews, setReviews] = useState<GoogleReview[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("unitech_admin_reviews");
        if (saved) return JSON.parse(saved);
      } catch { }
    }
    return [];
  });

  const [isFetchingGoogle, setIsFetchingGoogle] = useState<boolean>(false);
  const [lastGoogleSync, setLastGoogleSync] = useState<string>("Verified (CID: 3536483869333144352)");

  // Enhanced Dealer Testimonial modal state
  const [showAddDealerModal, setShowAddDealerModal] = useState<boolean>(false);
  const [dealerForm, setDealerForm] = useState({
    proprietorName: "",
    firmName: "",
    city: "",
    state: "",
    dealerTier: "Tier-1 Authorized Stockist",
    hardwareVolume: "200+ Cameras & DVRs Deployed",
    rating: 5,
    reviewText: "",
    isVerifiedPartner: true,
  });

  const updateReviewsState = (newRevs: GoogleReview[]) => {
    setReviews(newRevs);
    try {
      localStorage.setItem("unitech_admin_reviews", JSON.stringify(newRevs));
      window.dispatchEvent(new Event("storage"));
    } catch { }
  };

  const handleFetchLatestGoogleReviews = async () => {
    setIsFetchingGoogle(true);
    showToast("Connecting to live Google Business Profile & fetching reviews...");

    try {
      const res = await fetch("/api/reviews/fetch-google");
      const json = await res.json();

      if (!json.success || !Array.isArray(json.data)) {
        throw new Error(json.error || "Failed to retrieve reviews from Google.");
      }

      const allLatestGoogleReviews: Omit<GoogleReview, "isFeatured">[] = json.data;

      // Preserve existing admin pin selections for any previously loaded reviews
      const currentPinnedIds = new Set(reviews.filter((r) => r.isFeatured).map((r) => r.id));

      const mergedGoogleReviews: GoogleReview[] = allLatestGoogleReviews.map((item) => {
        const wasPinned = currentPinnedIds.has(item.id);
        return {
          ...item,
          isFeatured: wasPinned,
        };
      });

      // Keep custom dealer partner testimonials with their existing pin status
      const existingDealers = reviews.filter((r) => r.source === "DIRECT_DEALER");
      const merged = [...mergedGoogleReviews, ...existingDealers];

      updateReviewsState(merged);
      setIsFetchingGoogle(false);
      setLastGoogleSync(
        `Just now (${json.source === "places_api"
          ? "Google Places API"
          : json.source === "live_google_scrape"
            ? "Live Google Scraper"
            : "Verified Google Profile"
        })`
      );
      showToast(`✓ Fetched ${allLatestGoogleReviews.length} latest Google Reviews! Admin can pin up to 5 on homepage.`);

      // Batch persist to backend
      fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(merged),
      }).catch((err) => console.warn("[Google Review Batch Sync Error]:", err));
    } catch (err: any) {
      console.error("[Fetch Latest Google Reviews Error]:", err);
      setIsFetchingGoogle(false);
      showToast(`⚠️ Could not fetch reviews from Google: ${err.message || "Network error"}`);
    }
  };

  const handleToggleReviewFeatured = (id: string) => {
    const target = reviews.find((r) => r.id === id);
    if (!target) return;

    // Hard limit: maximum 5 reviews can be featured on the homepage
    if (!target.isFeatured) {
      const currentFeaturedCount = reviews.filter((r) => r.isFeatured).length;
      if (currentFeaturedCount >= 5) {
        showToast("⚠️ Maximum 5 reviews can be featured on Homepage! Please unpin a review first.");
        return;
      }
    }

    const nextFeatured = !target.isFeatured;
    const updated = reviews.map((r) => (r.id === id ? { ...r, isFeatured: nextFeatured } : r));
    updateReviewsState(updated);
    showToast(nextFeatured ? "✓ Review pinned to Homepage!" : "Review unpinned from Homepage.");

    fetch("/api/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isFeatured: nextFeatured }),
    }).catch((err) => console.warn("[Toggle Review DB Error]:", err));
  };

  const handleAddDealerTestimonial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerForm.proprietorName || !dealerForm.reviewText) return;

    const currentFeaturedCount = reviews.filter((r) => r.isFeatured).length;
    const shouldBeFeatured = currentFeaturedCount < 5;

    const newDealerReview: GoogleReview = {
      id: `dealer-${Date.now()}`,
      authorName: dealerForm.proprietorName,
      authorRole: `${dealerForm.dealerTier} · ${dealerForm.city}`,
      rating: dealerForm.rating,
      reviewText: dealerForm.reviewText,
      relativeTime: "Verified B2B Partner",
      isFeatured: shouldBeFeatured,
      source: "DIRECT_DEALER",
      companyName: dealerForm.firmName,
      city: dealerForm.city,
      dealerTier: dealerForm.dealerTier,
      hardwareVolume: dealerForm.hardwareVolume,
      isVerifiedPartner: dealerForm.isVerifiedPartner,
    };

    const updated = [newDealerReview, ...reviews];
    updateReviewsState(updated);
    setShowAddDealerModal(false);
    showToast(`✓ Verified Dealer Partner Testimonial added for ${dealerForm.firmName || dealerForm.proprietorName}!`);

    fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDealerReview),
    }).catch((err) => console.warn("[Create Dealer Testimonial DB Error]:", err));

    // Reset form
    setDealerForm({
      proprietorName: "",
      firmName: "",
      city: "",
      state: "",
      dealerTier: "Tier-1 Authorized Stockist",
      hardwareVolume: "200+ Cameras & DVRs Deployed",
      rating: 5,
      reviewText: "",
      isVerifiedPartner: true,
    });
  };

  // -------------------------------------------------------------
  // TAB: AUTHORIZED DEALERS & REGIONAL HUBS NETWORK STATE
  // -------------------------------------------------------------
  const [dealerHubs, setDealerHubs] = useState<DealerHub[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("unitech_admin_dealers");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch { }
    }
    return [];
  });

  const [dealerHubSearch, setDealerHubSearch] = useState<string>("");
  const [dealerHubTierFilter, setDealerHubTierFilter] = useState<string>("ALL");
  const [showDealerHubModal, setShowDealerHubModal] = useState<boolean>(false);
  const [editingDealerHubId, setEditingDealerHubId] = useState<string | null>(null);
  const [dealerHubForm, setDealerHubForm] = useState<{
    state: string;
    city: string;
    address: string;
    contact: string;
    type: string;
    isActive: boolean;
  }>({
    state: "",
    city: "",
    address: "",
    contact: "+91 98 1814 1759",
    type: "Authorized State Distributor",
    isActive: true,
  });
  const [dealerHubToDelete, setDealerHubToDelete] = useState<DealerHub | null>(null);

  const updateDealerHubsState = (newList: DealerHub[]) => {
    setDealerHubs(newList);
    try {
      localStorage.setItem("unitech_admin_dealers", JSON.stringify(newList));
    } catch { }
  };

  const fetchLiveDealers = async () => {
    try {
      const res = await fetch("/api/dealers", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setDealerHubs(json.data);
        try {
          localStorage.setItem("unitech_admin_dealers", JSON.stringify(json.data));
        } catch { }
      }
    } catch (err) {
      console.warn("[API GET /api/dealers error]:", err);
    }
  };

  const handleOpenAddDealerHub = () => {
    setEditingDealerHubId(null);
    setDealerHubForm({
      state: "",
      city: "",
      address: "",
      contact: "+91 ",
      type: "Authorized State Distributor",
      isActive: true,
    });
    setShowDealerHubModal(true);
  };

  const handleOpenEditDealerHub = (hub: DealerHub) => {
    setEditingDealerHubId(hub.id);
    setDealerHubForm({
      state: hub.state,
      city: hub.city,
      address: hub.address,
      contact: hub.contact,
      type: hub.type,
      isActive: hub.isActive !== false,
    });
    setShowDealerHubModal(true);
  };

  const handleSaveDealerHub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerHubForm.state.trim() || !dealerHubForm.city.trim() || !dealerHubForm.contact.trim()) {
      showToast("⚠️ State, city and contact phone are required.");
      return;
    }

    if (editingDealerHubId) {
      const updated = dealerHubs.map((d) =>
        d.id === editingDealerHubId ? { ...d, ...dealerHubForm } : d
      );
      updateDealerHubsState(updated);
      showToast(`✓ Dealer Hub "${dealerHubForm.state}" updated successfully!`);
      fetch("/api/dealers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingDealerHubId, ...dealerHubForm }),
      }).catch((err) => console.warn("[Update Dealer DB Error]:", err));
    } else {
      const newDealer: DealerHub = {
        id: `dealer-${Date.now()}`,
        state: dealerHubForm.state.trim(),
        city: dealerHubForm.city.trim(),
        address: dealerHubForm.address.trim(),
        contact: dealerHubForm.contact.trim(),
        type: dealerHubForm.type.trim() || "Authorized State Distributor",
        isActive: dealerHubForm.isActive,
      };
      const updated = [newDealer, ...dealerHubs];
      updateDealerHubsState(updated);
      showToast(`✓ New Dealer Hub "${newDealer.state}" created and live on /dealers!`);
      fetch("/api/dealers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDealer),
      }).catch((err) => console.warn("[Create Dealer DB Error]:", err));
    }

    setShowDealerHubModal(false);
  };

  const handleToggleDealerHubStatus = (id: string) => {
    const updated = dealerHubs.map((d) =>
      d.id === id ? { ...d, isActive: d.isActive === false ? true : false } : d
    );
    updateDealerHubsState(updated);
    const target = updated.find((d) => d.id === id);
    showToast(`✓ Dealer "${target?.state}" set to ${target?.isActive ? "Active (Live)" : "Inactive"}.`);
    fetch("/api/dealers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: target?.isActive }),
    }).catch((err) => console.warn("[Toggle Dealer DB Error]:", err));
  };

  const handleConfirmDeleteDealerHub = () => {
    if (!dealerHubToDelete) return;
    const id = dealerHubToDelete.id;
    const updated = dealerHubs.filter((d) => d.id !== id);
    updateDealerHubsState(updated);
    showToast(`✓ Dealer Hub "${dealerHubToDelete.state}" deleted.`);
    fetch(`/api/dealers?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      .catch((err) => console.warn("[Delete Dealer DB Error]:", err));
    setDealerHubToDelete(null);
  };

  const filteredDealerHubs = useMemo(() => {
    return dealerHubs.filter((hub) => {
      if (dealerHubTierFilter !== "ALL" && hub.type !== dealerHubTierFilter) return false;
      if (dealerHubSearch.trim()) {
        const q = dealerHubSearch.toLowerCase();
        return (
          hub.state.toLowerCase().includes(q) ||
          hub.city.toLowerCase().includes(q) ||
          hub.address.toLowerCase().includes(q) ||
          hub.contact.toLowerCase().includes(q) ||
          hub.type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [dealerHubs, dealerHubSearch, dealerHubTierFilter]);

  // ==========================================
  // VIEW: AUTHENTICATION TERMINAL (UNAUTHENTICATED)
  // ==========================================
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center text-slate-500 font-mono text-sm">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-unitech-red" />
          <span>Verifying Terminal Security...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-900 font-sans selection:bg-unitech-red selection:text-white">
        <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 relative z-10">
          {/* Header Badge */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-unitech-red text-white shadow-lg shadow-unitech-red/25 mb-3.5 border border-red-500/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                OEM Plant Terminal #01
              </span>
            </div>
            <h1 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
              Unitech Control Panel
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Master Administrative Console for Sahibabad Manufacturing Plant & B2B Distribution.
            </p>
          </div>

          {/* Error Banner */}
          {loginError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="leading-relaxed font-medium">{loginError}</div>
            </div>
          )}

          {/* Login or Forgot Password Form */}
          {showForgotPassword ? (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="space-y-1 pb-1">
                <h2 className="text-base font-black font-heading text-slate-900">
                  Reset Administrator Password
                </h2>
                <p className="text-xs text-slate-500">
                  Enter your administrator email address. If an active account matches, a secure password reset link will be sent.
                </p>
              </div>

              {forgotSuccessMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <div className="leading-relaxed">{forgotSuccessMessage}</div>
                </div>
              )}

              {forgotErrorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <div className="leading-relaxed">{forgotErrorMessage}</div>
                </div>
              )}

              {!forgotSuccessMessage && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Admin Work Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="admin@unitechcctv.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs font-medium focus:bg-white focus:outline-none focus:border-unitech-red focus:ring-1 focus:ring-unitech-red transition-all"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              {!forgotSuccessMessage && (
                <button
                  type="submit"
                  disabled={isSendingForgot || !forgotEmail}
                  className="w-full py-3 rounded-xl bg-unitech-red hover:bg-unitech-darkred active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-unitech-red/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSendingForgot ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Reset Link...</span>
                    </>
                  ) : (
                    <span>Send Password Reset Link</span>
                  )}
                </button>
              )}

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotSuccessMessage(null);
                    setForgotErrorMessage(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-900 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Login</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Field 1: Admin Work Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Admin Work Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@unitechcctv.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs font-medium focus:bg-white focus:outline-none focus:border-unitech-red focus:ring-1 focus:ring-unitech-red transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Field 2: Master Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Master Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter administrator password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs font-medium focus:bg-white focus:outline-none focus:border-unitech-red focus:ring-1 focus:ring-unitech-red transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Remember Terminal & Forgot Password Link */}
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={rememberTerminal}
                    onChange={(e) => setRememberTerminal(e.target.checked)}
                    className="rounded border-slate-300 bg-white text-unitech-red focus:ring-0"
                  />
                  <span>Remember this terminal</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setForgotEmail(loginEmail || "");
                    setForgotSuccessMessage(null);
                    setForgotErrorMessage(null);
                  }}
                  className="text-xs text-slate-500 hover:text-unitech-red font-medium transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Authenticate Submit Button */}
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 rounded-xl bg-unitech-red hover:bg-unitech-darkred active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-unitech-red/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Terminal Security...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Verify OEM Credentials & Enter Portal</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Back Link */}
          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5 transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Storefront</span>
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-[11px] text-slate-400 mt-6 text-center max-w-sm">
          Unitech Security Systems Pvt. Ltd. · Direct OEM Internal Security Gateway. Unauthorized access attempts are monitored and logged.
        </p>
      </div>
    );
  }

  // ==========================================
  // VIEW: AUTHENTICATED ADMIN CONTROL PANEL
  // ==========================================
  return (
    <div className="min-h-screen bg-[#faf9f5] text-slate-900 flex flex-col font-sans selection:bg-unitech-red selection:text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-slide-in border border-emerald-400/40">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Admin Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-unitech-red text-white flex items-center justify-center font-black shadow-md shadow-unitech-red/30">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-black text-base sm:text-lg text-slate-900">
                Unitech Control Panel
              </h1>
              <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Live Production
              </span>
            </div>
            <p className="text-[11px] text-slate-500 -mt-0.5 hidden sm:block">
              Super Admin · Sahibabad Plant OEM Terminal · 0ms Edge Cache Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            target="_blank"
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <span>Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </Link>

          <button
            type="button"
            onClick={() => {
              setShowChangePasswordModal(true);
              setChangePwCurrent("");
              setChangePwNew("");
              setChangePwConfirm("");
              setChangePwError(null);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
            title="Change Master Admin Password"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Change Password</span>
          </button>

          <button
            onClick={handleSignOut}
            className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-red-200 cursor-pointer"
            title="Logout & Exit Control Panel"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Workspace: Left Aside + Right Main */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Vertical Navigation Menu */}
        <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-3 sm:p-4 space-y-1 shrink-0 overflow-y-auto">
          {[
            { id: "ENQUIRIES", label: "Customer Enquiries", icon: Users },
            { id: "ORDERS", label: "Customer Orders & Payments", icon: ShoppingBag },
            { id: "CMS", label: "Catalogues & Datasheets", icon: Layers },
            { id: "HOMEPAGE_CATEGORIES", label: "Homepage Category Cards", icon: LayoutGrid },
            { id: "PRODUCTS", label: "Pricing & Stock Ticker", icon: DollarSign },
            { id: "PRODUCT_IMAGES", label: "Product Images & Models", icon: Camera },
            { id: "CATEGORIES", label: "Categories & Series", icon: FolderTree },
            { id: "DEALERS", label: "Authorized Dealers Network", icon: MapPin },
            { id: "BANNERS", label: "Sales & Ticker Banners", icon: Megaphone },
            { id: "HERO_PRODUCT_SALE", label: "Hero Cards Studio (All 4 Cards)", icon: Sparkles },
            { id: "FLASH_SALE", label: "Flash Sale Pop-up", icon: Zap },
            { id: "REVIEWS", label: "Google Reviews", icon: Star },
            { id: "ABOUT_LEADERSHIP", label: "About Page: Founders & Board", icon: Award },
            { id: "PAYMENT_SETTINGS", label: "Payment Settings", icon: CreditCard },
            { id: "EMAIL_SETTINGS", label: "Email Notifications", icon: Mail },
            { id: "SOCIAL_LINKS", label: "Social & Platform Links", icon: Share2 },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${isActive
                  ? "bg-unitech-red text-white shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold"
                  }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-6 px-3 text-[11px] text-slate-500 space-y-1.5 border-t border-slate-200 mt-4">
            <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              OEM Manufacturing Plant
            </div>
            <div className="text-slate-600">Sahibabad Site 2, UP (NCR)</div>
            <div>PostgreSQL Storage</div>
            <div>Manual UPI / Bank Transfer Verification</div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Edge Invalidation Ready
              </span>
            </div>
          </div>
        </aside>

        {/* Right Main Body Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#faf9f5]">
          {/* ========================================================= */}
          {/* TAB 1: CUSTOMER ENQUIRIES OVERHAUL (EXECUTIVE CRM) */}
          {/* ========================================================= */}
          {activeTab === "ENQUIRIES" && (
            <div className="space-y-6">
              {/* Header Title & Executive Metrics */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-heading font-black text-xl text-slate-900">
                      Customer Enquiries & Distributor CRM
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Review customer inquiries, dealer applications, and bulk procurement quotes.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => fetchLiveEnquiries(true)}
                      disabled={isFetchingEnquiries}
                      className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 shadow-2xs flex items-center gap-1.5 transition-all"
                      title="Fetch latest leads from server backend"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-unitech-red ${isFetchingEnquiries ? "animate-spin" : ""}`} />
                      <span>{isFetchingEnquiries ? "Syncing..." : "Sync Live Leads"}</span>
                    </button>

                    <div className="inline-flex items-center bg-slate-200/80 p-0.5 rounded-xl border border-slate-300">
                      <button
                        onClick={() => setEnquiryViewMode("cards")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${enquiryViewMode === "cards"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                          }`}
                      >
                        Cards
                      </button>
                      <button
                        onClick={() => setEnquiryViewMode("table")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${enquiryViewMode === "table"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                          }`}
                      >
                        Table
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4 Pipeline KPI Cards (Light Theme) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Total Ingested Leads
                    </span>
                    <div className="font-heading font-black text-2xl text-slate-900 mt-1">
                      {enquiries.length}
                    </div>
                    <span className="text-xs text-slate-500 mt-0.5 block">
                      From website & GeM portal
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 shadow-2xs">
                    <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                      Action Required
                    </span>
                    <div className="font-heading font-black text-2xl text-rose-600 mt-1">
                      {newLeadsCount} New
                    </div>
                    <span className="text-xs text-rose-700/80 mt-0.5 block">
                      Awaiting factory sales contact
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Quotes Dispatched
                    </span>
                    <div className="font-heading font-black text-2xl text-slate-900 mt-1">
                      {enquiries.filter((e) => e.status === "QUOTE_SENT").length}
                    </div>
                    <span className="text-xs text-slate-500 mt-0.5 block">
                      GST Proforma quotes pending
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Won (Converted)
                    </span>
                    <div className="font-heading font-black text-2xl text-emerald-700 mt-1">
                      {convertedLeadsCount} Orders
                    </div>
                    <span className="text-xs text-emerald-700/80 mt-0.5 block">
                      Wholesale deals confirmed
                    </span>
                  </div>
                </div>
              </div>

              {/* Filtering & Search Controls Bar */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                    {[
                      { id: "ALL", label: "All Leads", count: enquiries.length },
                      {
                        id: "DISTRIBUTOR",
                        label: "🏢 B2B Distributors",
                        count: enquiries.filter((e) => e.type === "DISTRIBUTOR").length,
                      },
                      {
                        id: "PRODUCT_QUOTE",
                        label: "📦 Product Quotes",
                        count: enquiries.filter((e) => e.type === "PRODUCT_QUOTE").length,
                      },
                      {
                        id: "GEM_TENDER",
                        label: "🏛️ GeM Tenders",
                        count: enquiries.filter((e) => e.type === "GEM_TENDER").length,
                      },
                      {
                        id: "OEM",
                        label: "🏭 OEM",
                        count: enquiries.filter((e) => e.type === "OEM" || e.type === "SERVICE_WARRANTY").length,
                      },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setEnquiryFilter(f.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${enquiryFilter === f.id
                          ? "bg-slate-900 text-white shadow-2xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                      >
                        <span>{f.label}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${enquiryFilter === f.id
                            ? "bg-white/20 text-white"
                            : "bg-slate-200 text-slate-700"
                            }`}
                        >
                          {f.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-600 font-bold">Status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold focus:outline-none focus:border-unitech-red"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="NEW">New Leads</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="QUOTE_SENT">Quote Sent</option>
                      <option value="CONVERTED">Won (Converted)</option>
                      <option value="REJECTED">Closed / Lost</option>
                    </select>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    value={leadSearchQuery}
                    onChange={(e) => setLeadSearchQuery(e.target.value)}
                    placeholder="Search leads by customer name, company, city, GSTIN, phone, or model requested..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-medium focus:bg-white focus:outline-none focus:border-unitech-red focus:ring-1 focus:ring-unitech-red"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  {leadSearchQuery && (
                    <button
                      onClick={() => setLeadSearchQuery("")}
                      className="text-xs text-slate-400 hover:text-slate-600 font-medium absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Enquiries Result Display */}
              {filteredEnquiries.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 space-y-2">
                  <Users className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-900">No customer enquiries found</p>
                  <p className="text-xs text-slate-500">Try modifying your filter tabs or search query.</p>
                </div>
              ) : enquiryViewMode === "cards" ? (
                /* Cards View (Clean, Non-Technical Admin POV, Zero Rainbow Colors) */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredEnquiries.map((enq) => {
                    return (
                      <div
                        key={enq.id}
                        className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          {/* Top Line: Tag & Date */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                              #{enq.id} · {enq.type.replace("_", " ")}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              {enq.createdAt}
                            </span>
                          </div>

                          {/* Customer & Company Details (High Contrast, Bold, Clean) */}
                          <div>
                            <h3 className="font-heading font-black text-slate-900 text-lg">
                              {enq.fullName}
                            </h3>
                            <div className="text-xs text-slate-600 font-semibold mt-0.5 flex flex-wrap items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{enq.companyName || "Direct Purchaser"}</span>
                              <span className="text-slate-300">·</span>
                              <span className="text-slate-800 font-bold">{enq.city}, {enq.state}</span>
                              {enq.gstin && (
                                <span className="text-slate-500 font-mono text-[11px] font-normal">
                                  (GST: {enq.gstin})
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-mono mt-1">
                              {enq.phone} · {enq.email}
                            </div>
                          </div>

                          {/* Hardware & Budget if present */}
                          {(enq.productModel || enq.budget) && (
                            <div className="text-xs bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-slate-700 font-medium flex flex-wrap items-center justify-between gap-2">
                              {enq.productModel && (
                                <span>
                                  Hardware: <strong className="text-slate-900 font-bold">{enq.productModel}</strong>
                                </span>
                              )}
                              {enq.budget && (
                                <span className="text-slate-900 font-bold font-mono">
                                  Budget: {enq.budget}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Customer Message (Clean Box, No Rainbow) */}
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-700 leading-relaxed font-normal">
                            {enq.details}
                          </div>

                          {/* Factory Note if present */}
                          {enq.adminNotes && (
                            <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-start gap-1.5">
                              <FileCheck className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                              <span>
                                <strong className="text-slate-800 font-bold">Factory Note:</strong>{" "}
                                {enq.adminNotes}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Bottom Actions & Status Selector */}
                        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                          {/* Clean Status Dropdown */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-600">Status:</span>
                            <select
                              value={enq.status}
                              onChange={(e) =>
                                handleStatusChange(enq.id, e.target.value as EnquiryStatus)
                              }
                              className="bg-white border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:border-unitech-red shadow-2xs"
                            >
                              <option value="NEW">New Lead</option>
                              <option value="CONTACTED">Contacted</option>
                              <option value="QUOTE_SENT">Quote Sent</option>
                              <option value="CONVERTED">Won (Converted)</option>
                              <option value="REJECTED">Closed / Lost</option>
                            </select>
                          </div>

                          {/* Direct Actions: WhatsApp + Call + Copy */}
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://wa.me/${enq.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                `Hello ${enq.fullName}, this is Unitech Security Systems regarding your enquiry (#${enq.id}). How can we assist you with your surveillance requirements?`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 text-xs transition-colors shadow-2xs"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>

                            <a
                              href={`tel:${enq.phone}`}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center gap-1.5 text-xs transition-colors border border-slate-200"
                            >
                              <Phone className="w-3.5 h-3.5 text-unitech-red" />
                              <span>Call</span>
                            </a>

                            <button
                              onClick={() => handleCopyLeadDetails(enq)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Copy Lead Summary"
                            >
                              {copiedLeadId === enq.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Data Table View (Clean, High Contrast, Bold Enough as Requested) */
                <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-mono text-[11px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Lead ID & Type</th>
                        <th className="py-3.5 px-4">Customer & Firm</th>
                        <th className="py-3.5 px-4">Location</th>
                        <th className="py-3.5 px-4">Hardware & Budget</th>
                        <th className="py-3.5 px-4">Current Status</th>
                        <th className="py-3.5 px-4 text-right">Direct Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredEnquiries.map((enq) => (
                        <tr key={enq.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-4 font-mono">
                            <span className="font-bold text-slate-900 block text-xs">#{enq.id}</span>
                            <span className="text-[11px] text-slate-500 font-semibold uppercase">
                              {enq.type.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-black text-slate-950 text-sm">{enq.fullName}</div>
                            {enq.companyName && (
                              <div className="text-slate-700 font-bold text-xs">{enq.companyName}</div>
                            )}
                            <div className="text-slate-500 font-mono text-xs">{enq.phone}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-900 text-xs">{enq.city}</div>
                            <div className="text-slate-500 font-medium text-xs">{enq.state}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-900 text-xs">
                              {enq.productModel || "Hardware Bulk Ingestion"}
                            </div>
                            {enq.budget && (
                              <div className="text-slate-900 font-mono text-xs font-black">
                                Budget: {enq.budget}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <select
                              value={enq.status}
                              onChange={(e) =>
                                handleStatusChange(enq.id, e.target.value as EnquiryStatus)
                              }
                              className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-unitech-red shadow-2xs"
                            >
                              <option value="NEW">New Lead</option>
                              <option value="CONTACTED">Contacted</option>
                              <option value="QUOTE_SENT">Quote Sent</option>
                              <option value="CONVERTED">Won (Converted)</option>
                              <option value="REJECTED">Closed / Lost</option>
                            </select>
                          </td>
                          <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <a
                              href={`https://wa.me/${enq.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center gap-1 text-xs shadow-2xs"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                            <a
                              href={`tel:${enq.phone}`}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold inline-flex items-center gap-1 text-xs border border-slate-200"
                            >
                              <Phone className="w-3.5 h-3.5 text-unitech-red" />
                              <span>Call</span>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: CUSTOMER ORDERS & PAYMENT RECONCILIATION */}
          {/* ========================================================= */}
          {activeTab === "ORDERS" && (
            <div className="space-y-6">
              {/* Header Title & Executive Metrics */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-heading font-black text-xl text-slate-900">
                      Customer Orders & Payment Verification
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verify customer UPI & Bank transfer payments against bank statements, reconcile UTR numbers, and allocate warehouse inventory.
                    </p>
                  </div>
                  <button
                    onClick={() => fetchLiveOrders(true)}
                    disabled={isFetchingOrders}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 transition-colors shrink-0 shadow-xs cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetchingOrders ? "animate-spin" : ""}`} />
                    <span>{isFetchingOrders ? "Syncing..." : "Sync Orders"}</span>
                  </button>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Total Orders
                    </span>
                    <div className="font-heading font-black text-2xl text-slate-900 mt-1">
                      {orders.filter((o) => o.paymentStatus !== "AWAITING_PAYMENT").length}
                    </div>
                    <span className="text-xs text-slate-500 mt-0.5 block">Lifetime received</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 shadow-2xs">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                      Pending Verification
                    </span>
                    <div className="font-heading font-black text-2xl text-amber-800 mt-1">
                      {orders.filter((o) => o.paymentStatus === "PENDING_VERIFICATION").length}
                    </div>
                    <span className="text-xs text-amber-700/80 mt-0.5 block">Awaiting UTR match</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 shadow-2xs">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Verified & Confirmed
                    </span>
                    <div className="font-heading font-black text-2xl text-emerald-800 mt-1">
                      {orders.filter((o) => o.paymentStatus === "CONFIRMED").length}
                    </div>
                    <span className="text-xs text-emerald-700/80 mt-0.5 block">Payment reconciled</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Confirmed Revenue
                    </span>
                    <div className="font-heading font-black text-2xl text-white mt-1">
                      {formatINR(
                        orders
                          .filter((o) => o.paymentStatus === "CONFIRMED")
                          .reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0)
                      )}
                    </div>
                    <span className="text-xs text-slate-400 mt-0.5 block">Net realized value</span>
                  </div>
                </div>
              </div>

              {/* Filtering & Search Controls Bar */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                    {[
                      { id: "ALL", label: "All Orders", count: orders.filter((o) => o.paymentStatus !== "AWAITING_PAYMENT").length },
                      {
                        id: "PENDING_VERIFICATION",
                        label: "Pending Verification",
                        count: orders.filter((o) => o.paymentStatus === "PENDING_VERIFICATION").length,
                      },
                      {
                        id: "CONFIRMED",
                        label: "Confirmed",
                        count: orders.filter((o) => o.paymentStatus === "CONFIRMED").length,
                      },
                      {
                        id: "REJECTED",
                        label: "Rejected",
                        count: orders.filter((o) => o.paymentStatus === "REJECTED").length,
                      },
                      {
                        id: "AWAITING_PAYMENT",
                        label: "Abandoned Drafts",
                        count: orders.filter((o) => o.paymentStatus === "AWAITING_PAYMENT").length,
                      },
                    ].map((pill) => (
                      <button
                        key={pill.id}
                        onClick={() => setOrderPaymentStatusFilter(pill.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${orderPaymentStatusFilter === pill.id
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                      >
                        {pill.label} ({pill.count})
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm("Clean up all abandoned draft orders older than 24 hours?")) return;
                        try {
                          const res = await fetch("/api/orders?action=cleanup_abandoned", { method: "DELETE" });
                          const data = await res.json();
                          if (data.success) {
                            alert(data.message || "Cleaned up abandoned drafts.");
                            fetchLiveOrders();
                          }
                        } catch {
                          alert("Failed to clean up drafts.");
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-red-700 hover:border-red-300 transition-colors cursor-pointer whitespace-nowrap"
                      title="Delete draft orders awaiting payment older than 24 hours"
                    >
                      Clean Abandoned Drafts
                    </button>
                    <div className="relative min-w-[220px]">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search Order #, Name, Mobile, UTR..."
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:border-unitech-red"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Orders List Cards */}
              {(() => {
                const filtered = orders.filter((o) => {
                  if (orderPaymentStatusFilter === "ALL") {
                    if (o.paymentStatus === "AWAITING_PAYMENT") return false;
                  } else if (o.paymentStatus !== orderPaymentStatusFilter) {
                    return false;
                  }
                  if (!orderSearchQuery.trim()) return true;
                  const q = orderSearchQuery.toLowerCase();
                  return (
                    o.orderNumber?.toLowerCase().includes(q) ||
                    o.customerName?.toLowerCase().includes(q) ||
                    o.companyName?.toLowerCase().includes(q) ||
                    o.phone?.includes(q) ||
                    o.utrNumber?.toLowerCase().includes(q)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                      <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                      <h4 className="font-bold text-slate-800 text-sm">No Orders Found</h4>
                      <p className="text-xs text-slate-500">
                        {orderSearchQuery ? "No orders matched your search criteria." : "No customer orders have been placed yet."}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {filtered.map((order) => {
                      const isPending = order.paymentStatus === "PENDING_VERIFICATION";
                      const isConfirmed = order.paymentStatus === "CONFIRMED";
                      const isRejected = order.paymentStatus === "REJECTED";
                      const isAwaiting = order.paymentStatus === "AWAITING_PAYMENT";

                      return (
                        <div
                          key={order.id}
                          className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 hover:border-slate-300 transition-all"
                        >
                          {/* Card Header: Order Number, Badges, Date */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                                #{order.orderNumber}
                              </span>
                              <span className="text-xs text-slate-400 font-medium">
                                {new Date(order.createdAt).toLocaleString("en-IN", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Payment Status Badge */}
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border flex items-center gap-1 ${isConfirmed
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : isPending
                                    ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                                    : isAwaiting
                                      ? "bg-slate-100 text-slate-700 border-slate-300"
                                      : "bg-red-50 text-red-700 border-red-200"
                                  }`}
                              >
                                {isConfirmed ? <CheckCircle2 className="w-3 h-3" /> : isPending ? <Clock className="w-3 h-3" /> : isAwaiting ? <Clock className="w-3 h-3 text-slate-400" /> : <XCircle className="w-3 h-3" />}
                                <span>{order.paymentStatus || "PENDING"}</span>
                              </span>

                              {/* Order Status Badge */}
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-700 border border-slate-200">
                                {order.orderStatus || "PLACED"}
                              </span>
                            </div>
                          </div>

                          {/* Order Body: Customer & Delivery Details + Financials & Items */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                            {/* Left: Customer & Delivery */}
                            <div className="space-y-2">
                              <div className="font-bold text-slate-900 flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-400" />
                                <span>{order.customerName}</span>
                                {order.companyName && (
                                  <span className="text-slate-500 font-normal">({order.companyName})</span>
                                )}
                              </div>

                              <div className="space-y-1 text-slate-600 pl-6">
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  <a href={`tel:${order.phone}`} className="hover:text-unitech-red font-mono">
                                    {order.phone}
                                  </a>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                                  <a href={`mailto:${order.email}`} className="hover:text-unitech-red">
                                    {order.email}
                                  </a>
                                </div>
                                <div className="flex items-start gap-2 pt-0.5">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                  <span>
                                    {order.street}, {order.city}, {order.state} - {order.pincode}
                                  </span>
                                </div>
                                {order.gstin && (
                                  <div className="flex items-center gap-2 pt-0.5">
                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="font-mono font-bold text-slate-700">GSTIN: {order.gstin}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right: Payment UTR Reference & Pricing */}
                            <div className="space-y-3">
                              {/* UTR Verification Box */}
                              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Submitted UTR / Transaction Ref:
                                  </span>
                                  {order.utrNumber && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(order.utrNumber || "");
                                        setCopiedUtrId(order.id);
                                        setTimeout(() => setCopiedUtrId(null), 2000);
                                      }}
                                      className="text-[11px] text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      {copiedUtrId === order.id ? (
                                        <>
                                          <Check className="w-3 h-3 text-emerald-600" />
                                          <span className="text-emerald-600">Copied</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          <span>Copy UTR</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                                <div className="font-mono font-black text-sm text-slate-900 tracking-wide bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                                  {order.utrNumber || "NOT SUBMITTED"}
                                </div>
                              </div>

                              {/* Items list */}
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Ordered Products ({order.items?.length || 0}):
                                </span>
                                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                  {(order.items || []).map((item: any, idx: number) => {
                                    const qty = Number(item.quantity) || 1;
                                    const unitPrice = Number(
                                      item.price ??
                                      item.unitPrice ??
                                      item.applicablePrice ??
                                      item.currentUnitPrice ??
                                      (item.lineTotal ? Number(item.lineTotal) / qty : 0)
                                    ) || 0;
                                    const lineTotal = Number(item.lineTotal ?? (unitPrice * qty)) || 0;

                                    return (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0"
                                      >
                                        <div className="truncate pr-2">
                                          <span className="font-bold text-slate-800">{item.name || item.modelCode}</span>
                                          {item.modelCode && (
                                            <span className="font-mono text-slate-400 text-[10px] ml-1.5">
                                              ({item.modelCode})
                                            </span>
                                          )}
                                          <span className="text-slate-500 text-[11px] ml-1.5">
                                            × {qty} <span className="text-slate-400 font-medium">(@ {formatOrderCurrency(unitPrice)})</span>
                                          </span>
                                        </div>
                                        <div className="font-bold text-slate-900 shrink-0 font-mono">
                                          {formatOrderCurrency(lineTotal)}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Total Financials */}
                              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                                <div className="text-slate-500">
                                  Subtotal: {formatOrderCurrency(order.subtotal)} + GST 18%: {formatOrderCurrency(order.gstAmount)}
                                </div>
                                <div className="font-heading font-black text-base text-slate-900">
                                  Total: {formatOrderCurrency(order.totalAmount)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer: Action Toolbar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                            {/* Left: Status Progression Selector */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-500">Order Status:</span>
                              <select
                                value={order.orderStatus || "PLACED"}
                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-unitech-red cursor-pointer"
                              >
                                <option value="PLACED">PLACED (Pending Verification)</option>
                                <option value="PROCESSING">PROCESSING (Payment Verified)</option>
                                <option value="DISPATCHED">DISPATCHED (In Transit)</option>
                                <option value="DELIVERED">DELIVERED (Fulfilled)</option>
                                <option value="CANCELLED">CANCELLED</option>
                              </select>
                            </div>

                            {/* Right: Payment Verification Action Buttons */}
                            <div className="flex items-center gap-2">
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => handleConfirmPayment(order.id)}
                                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Verify & Confirm Payment</span>
                                  </button>

                                  <button
                                    onClick={() => handleRejectPayment(order.id)}
                                    className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}

                              {isConfirmed && (
                                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Payment Verified · Stock Allocated</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
          {activeTab === "CMS" && (
            <div className="w-full space-y-6">
              {/* Header with Publish Button & Add Resource */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-unitech-red border border-red-200 uppercase tracking-wider">
                      Support Hub CMS (All 3 Sections)
                    </span>
                    <span className="text-xs text-slate-400">Instant Storefront Sync</span>
                  </div>
                  <h2 className="font-heading font-black text-xl text-slate-900">
                    Technical Catalogues, Utilities & Compliance Manager
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                    Manage all 3 sections of the Downloads & Support hub: <strong>1. Product Catalogues & Datasheets</strong>, <strong>2. Software & Utilities</strong>, and <strong>3. RMA & Compliance Policies</strong>. Add, edit, or replace files anytime.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenAddDocModal}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Resource</span>
                  </button>

                  <button
                    onClick={handlePublishAllCms}
                    className="px-5 py-2.5 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Publish Updates Live</span>
                  </button>
                </div>
              </div>

              {/* 3 Support Sections Selector Pills */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl w-fit">
                {[
                  { id: "ALL", label: `All Sections (${documents.length})` },
                  {
                    id: "catalogues",
                    label: `1. Catalogues & Datasheets (${documents.filter((d) => !d.section || d.section === "catalogues").length
                      })`,
                  },
                  {
                    id: "software",
                    label: `2. Software & Utilities (${documents.filter((d) => d.section === "software").length
                      })`,
                  },
                  {
                    id: "warranty-rma",
                    label: `3. RMA & Compliance (${documents.filter((d) => d.section === "warranty-rma").length
                      })`,
                  },
                ].map((tab) => {
                  const isActive = cmsSectionFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCmsSectionFilter(tab.id as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive
                        ? "bg-white text-slate-950 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* PDF Documents Assets Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-black text-base text-slate-900">
                      Active Technical Resources (
                      {
                        documents.filter((d) =>
                          cmsSectionFilter === "ALL"
                            ? true
                            : cmsSectionFilter === "catalogues"
                              ? !d.section || d.section === "catalogues"
                              : d.section === cmsSectionFilter
                        ).length
                      }
                      )
                    </h3>
                    <p className="text-xs text-slate-500">
                      Technical PDF files, software executables, and firmware utilities configured on the storefront.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                  {documents
                    .filter((d) =>
                      cmsSectionFilter === "ALL"
                        ? true
                        : cmsSectionFilter === "catalogues"
                          ? !d.section || d.section === "catalogues"
                          : d.section === cmsSectionFilter
                    )
                    .map((doc) => {
                      const sectionBadge =
                        doc.section === "software"
                          ? "Section 2: Software"
                          : doc.section === "warranty-rma"
                            ? "Section 3: RMA & Policy"
                            : "Section 1: Catalogues";

                      return (
                        <div
                          key={doc.id}
                          className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs hover:bg-slate-50/80 transition-colors"
                        >
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 text-unitech-red flex items-center justify-center shrink-0 mt-0.5 font-mono font-black text-xs">
                              {doc.format || "PDF"}
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-unitech-red border border-red-200 uppercase tracking-wider">
                                  {sectionBadge}
                                </span>
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                                  {doc.category}
                                </span>
                                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                  {doc.version}
                                </span>
                                <span className="text-xs text-slate-500 font-medium">
                                  {doc.fileSize} · Updated {doc.updatedDate}
                                </span>
                              </div>

                              <h4 className="font-heading font-black text-slate-950 text-base">
                                {doc.title}
                              </h4>

                              {doc.revisionSummary && (
                                <p className="text-xs text-slate-600 leading-normal max-w-3xl font-normal">
                                  {doc.revisionSummary}
                                </p>
                              )}

                              <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5 pt-0.5">
                                <Globe className="w-3.5 h-3.5 text-slate-400" />
                                <span>Live Path: {doc.fileUrl}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action buttons: Edit/Replace and Download Test */}
                          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                            <button
                              type="button"
                              onClick={() => setPreviewModalDoc(doc)}
                              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 transition-colors border border-slate-200 text-xs cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenReplaceModal(doc)}
                              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-black flex items-center gap-1.5 transition-all border border-slate-300 shadow-2xs text-xs hover:border-slate-400 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-unitech-red" />
                              <span>Edit / Replace</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                              title="Delete Resource"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* MODAL: ADD NEW DOCUMENT / COMPONENT (Issue-6 Solution) */}
              {showAddDocModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                  <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-unitech-red border border-red-200 flex items-center justify-center">
                          <Plus className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-heading font-black text-slate-900 text-lg">
                            Add New Support Resource
                          </h3>
                          <span className="text-xs text-slate-500">
                            Create a new downloadable file in any of the 3 Support hub sections
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddDocModal(false)}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateNewDocument} className="space-y-4 text-xs">
                      {/* Target Section */}
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Target Support Section:
                        </label>
                        <select
                          value={newDocSection}
                          onChange={(e) => setNewDocSection(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-bold text-slate-900"
                        >
                          <option value="catalogues">Section 1 · Product Catalogues & Technical Datasheets</option>
                          <option value="software">Section 2 · Software & Surveillance Utilities</option>
                          <option value="warranty-rma">Section 3 · RMA, Warranty & Compliance Policies</option>
                        </select>
                      </div>

                      {/* Title */}
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Document / Resource Title *:
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Unitech 8MP Wi-Fi Solar Camera Datasheet"
                          value={newDocTitle}
                          onChange={(e) => setNewDocTitle(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-bold text-slate-900"
                        />
                      </div>

                      {/* Category, Version, Size, Format in 2x2 grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Sub-Category:</label>
                          <input
                            type="text"
                            value={newDocCategory}
                            onChange={(e) => setNewDocCategory(e.target.value)}
                            className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-300 font-bold"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Version:</label>
                          <input
                            type="text"
                            value={newDocVersion}
                            onChange={(e) => setNewDocVersion(e.target.value)}
                            className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">File Size:</label>
                          <input
                            type="text"
                            value={newDocSize}
                            onChange={(e) => setNewDocSize(e.target.value)}
                            className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Format:</label>
                          <select
                            value={newDocFormat}
                            onChange={(e) => setNewDocFormat(e.target.value as any)}
                            className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-300 font-bold"
                          >
                            <option value="PDF">PDF</option>
                            <option value="EXE">EXE</option>
                            <option value="ZIP">ZIP</option>
                            <option value="APK">APK</option>
                            <option value="BIN">BIN</option>
                          </select>
                        </div>
                      </div>

                      {/* Direct File Uploader Dropzone */}
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Upload File (PDF, EXE, ZIP, APK, BIN):
                        </label>
                        <div className="border-2 border-dashed border-slate-300 hover:border-unitech-red rounded-2xl p-5 text-center cursor-pointer transition-colors bg-slate-50/70 relative">
                          <input
                            type="file"
                            accept=".pdf,.zip,.exe,.apk,.bin"
                            onChange={handleNewDocFileSelection}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <FileDown className="w-8 h-8 text-unitech-red mx-auto mb-2" />
                          {isUploadingNewDoc ? (
                            <div className="text-unitech-red font-bold flex items-center justify-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin text-unitech-red" />
                              <span>Uploading & Storing {newDocUploadFile?.name} in PostgreSQL...</span>
                            </div>
                          ) : newDocUploadFile ? (
                            <div className="text-emerald-700 font-bold flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>✓ Stored in Database: {newDocUploadFile.name} ({(newDocUploadFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-slate-900 font-bold block text-xs">
                                Click or drag a file to upload directly to Database
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Supports .PDF (Datasheet), .EXE / .ZIP (VMS software), .APK (Mobile app), .BIN (Firmware)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* File Path or URL */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-700 block">
                            File Path / Download URL:
                          </label>
                          <span className="text-[10px] text-slate-500 font-medium">Auto-populated on upload or enter custom</span>
                        </div>
                        <input
                          type="text"
                          placeholder="/downloads/sample-file.pdf"
                          value={newDocUrl}
                          onChange={(e) => setNewDocUrl(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-xs"
                        />
                      </div>

                      {/* Revision Summary */}
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Description / Change Summary:
                        </label>
                        <textarea
                          rows={2}
                          value={newDocSummary}
                          onChange={(e) => setNewDocSummary(e.target.value)}
                          placeholder="Short summary displayed below title..."
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs"
                        />
                      </div>

                      {/* Modal Footer */}
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => setShowAddDocModal(false)}
                          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white font-bold flex items-center gap-2 shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add to Support Hub</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL: EDIT / REPLACE PDF (LIGHT THEME) */}
              {replaceModalDoc && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                  <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-unitech-red border border-red-200 flex items-center justify-center">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-heading font-black text-slate-900 text-lg">
                            Edit / Replace Resource
                          </h3>
                          <span className="text-xs text-slate-500 font-mono">
                            ID: {replaceModalDoc.id} · {replaceModalDoc.category}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setReplaceModalDoc(null)}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4 text-xs">
                      {/* Target Section & Format */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Target Support Section:
                          </label>
                          <select
                            value={replaceSection}
                            onChange={(e) => setReplaceSection(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-bold"
                          >
                            <option value="catalogues">Section 1 · Catalogues & Datasheets</option>
                            <option value="software">Section 2 · Software & Utilities</option>
                            <option value="warranty-rma">Section 3 · RMA & Compliance</option>
                          </select>
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            File Format:
                          </label>
                          <select
                            value={replaceFormat}
                            onChange={(e) => setReplaceFormat(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-bold"
                          >
                            <option value="PDF">PDF</option>
                            <option value="EXE">EXE</option>
                            <option value="ZIP">ZIP</option>
                            <option value="APK">APK</option>
                            <option value="BIN">BIN</option>
                          </select>
                        </div>
                      </div>

                      {/* Document Title */}
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Document Title on Storefront:
                        </label>
                        <input
                          type="text"
                          value={replaceTitle}
                          onChange={(e) => setReplaceTitle(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:border-unitech-red font-semibold"
                        />
                      </div>

                      {/* Version & Size in 2 columns */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Version Tag (e.g. v2026.2):
                          </label>
                          <input
                            type="text"
                            value={replaceVersion}
                            onChange={(e) => setReplaceVersion(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-unitech-red"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            File Size (e.g. 15.4 MB):
                          </label>
                          <input
                            type="text"
                            value={replaceSize}
                            onChange={(e) => setReplaceSize(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-unitech-red"
                          />
                        </div>
                      </div>

                      {/* File Uploader Dropzone */}
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Upload New PDF File:
                        </label>
                        <div className="border-2 border-dashed border-slate-300 hover:border-unitech-red rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/60 relative">
                          <input
                            type="file"
                            accept=".pdf,.zip,.exe,.apk,.bin"
                            onChange={handleFileSelection}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <FileDown className="w-8 h-8 text-unitech-red mx-auto mb-2" />
                          {isUploadingPdf ? (
                            <div className="text-unitech-red font-bold flex items-center justify-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin text-unitech-red" />
                              <span>Uploading & Storing {pdfUploadFile?.name} in PostgreSQL...</span>
                            </div>
                          ) : pdfUploadFile ? (
                            <div className="text-emerald-700 font-bold flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>✓ File Stored in Database: {pdfUploadFile.name} ({(pdfUploadFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-slate-900 font-bold block">
                                Click or drag a new file here
                              </span>
                              <span className="text-xs text-slate-500">
                                Replaces "{replaceModalDoc.fileUrl}" across all buttons
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Download URL Path */}
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Live Path / CDN URL:
                        </label>
                        <input
                          type="text"
                          value={replaceUrl}
                          onChange={(e) => setReplaceUrl(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-unitech-red"
                        />
                      </div>

                      {/* Revision Summary Notes */}
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Revision Notes / Change Summary:
                        </label>
                        <textarea
                          rows={2}
                          value={replaceRevisionNotes}
                          onChange={(e) => setReplaceRevisionNotes(e.target.value)}
                          placeholder="e.g. Updated dealer price sheet, added new 8MP Wi-Fi solar camera specs..."
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-unitech-red"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setReplaceModalDoc(null)}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePdfReplacement}
                        className="px-5 py-2.5 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-unitech-red/30 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save & Publish Live Immediately</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* IN-WEBSITE PDF PREVIEW MODAL (ADMIN) */}
              {previewModalDoc && (
                <PdfPreviewModal
                  isOpen={!!previewModalDoc}
                  onClose={() => setPreviewModalDoc(null)}
                  title={previewModalDoc.title}
                  fileUrl={previewModalDoc.fileUrl}
                  version={previewModalDoc.version}
                  fileSize={previewModalDoc.fileSize}
                  format={previewModalDoc.format}
                />
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: HOMEPAGE MANUFACTURING CATEGORIES SHOWCASE           */}
          {/* ========================================================= */}
          {activeTab === "HOMEPAGE_CATEGORIES" && (
            <div className="w-full">
              <HomepageCategoryEditor onShowToast={showToast} />
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: PRICING & WAREHOUSE STOCK TICKER (LIGHT THEME) */}
          {/* ========================================================= */}
          {activeTab === "PRODUCTS" && (
            <div className="w-full space-y-6">
              {/* Header & KPI Summary */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="font-heading font-black text-xl text-slate-900 flex items-center gap-2">
                      <Box className="w-5 h-5 text-unitech-red" />
                      <span>Live Production Pricing, Stock & Product Catalog</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Factory B2B rates, wholesale dealer margin tiers, product image management, and dynamic inventory levels.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleOpenAddProductModal}
                      className="px-4 py-2.5 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-unitech-red/30 transition-all shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add New Hardware Product</span>
                    </button>
                  </div>
                </div>

                {/* KPI Inventory Health Strip (Light Theme) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Active Hardware SKUs
                    </span>
                    <div className="font-heading font-black text-2xl text-slate-900 mt-1">
                      {totalSkus} Models
                    </div>
                    <span className="text-xs text-slate-500 mt-0.5 block">Full OEM catalog</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                      In-Stock (Healthy)
                    </span>
                    <div className="font-heading font-black text-2xl text-emerald-700 mt-1">
                      {healthyStockCount} Models
                    </div>
                    <span className="text-xs text-emerald-700/80 mt-0.5 block">Ready for dispatch</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-2xs">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                      Low Stock Alert
                    </span>
                    <div className="font-heading font-black text-2xl text-amber-700 mt-1">
                      {lowStockCount} Models
                    </div>
                    <span className="text-xs text-amber-700/80 mt-0.5 block">&lt; 10 pcs remaining</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 shadow-2xs">
                    <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block flex items-center justify-between">
                      <span>Out of Stock</span>
                      {outOfStockCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                      )}
                    </span>
                    <div className="font-heading font-black text-2xl text-rose-600 mt-1">
                      {outOfStockCount} Models
                    </div>
                    <span className="text-xs text-rose-700/80 mt-0.5 block">
                      Marked unavailable on site
                    </span>
                  </div>
                </div>
              </div>

              {/* Search & Category Filter (Light Theme) */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {[
                    { id: "ALL", label: "All Hardware" },
                    { id: "cctv-cameras", label: "CCTV Cameras" },
                    { id: "dvr-nvr", label: "DVR & NVR" },
                    { id: "cables", label: "Cables" },
                    { id: "power-accessories", label: "Power SMPS" },
                    { id: "network-racks", label: "Server Racks" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setProductCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${productCategoryFilter === cat.id
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[220px]">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search SKU or name..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-medium focus:bg-white focus:border-unitech-red focus:outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Industrial Inventory & Product Table (Light Theme) */}
              <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                {filteredProducts.map((p) => {
                  const isEditing = editingProdId === p.id;
                  const isOutOfStock = p.stockQuantity === 0;
                  const isLowStock = p.stockQuantity > 0 && p.stockQuantity < 10;
                  const dealerMarginPercent = (
                    ((p.price - p.dealerPrice) / p.price) *
                    100
                  ).toFixed(1);

                  return (
                    <div
                      key={p.id}
                      className={`p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs transition-colors ${isOutOfStock
                        ? "bg-rose-50/50 border-l-4 border-l-rose-500"
                        : isLowStock
                          ? "bg-amber-50/40 border-l-4 border-l-amber-500"
                          : "hover:bg-slate-50/80"
                        }`}
                    >
                      {/* Left: Thumbnail & Details */}
                      <div className="flex items-start sm:items-center gap-4 flex-1">
                        {/* Product Image Thumbnail with Quick "Update Image" trigger */}
                        <div
                          onClick={() => handleOpenImageModal(p)}
                          className="group relative w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-unitech-red/50 cursor-pointer overflow-hidden flex items-center justify-center shrink-0 transition-all shadow-2xs"
                          title="Click to update / replace product image"
                        >
                          {p.imageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="max-w-full max-h-full object-contain p-1 group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="text-center p-1">
                              <Camera className="w-5 h-5 text-slate-400 group-hover:text-unitech-red transition-colors mx-auto" />
                              <span className="text-[9px] font-mono text-slate-400 block mt-0.5">No Img</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                            Change
                          </div>
                        </div>

                        {/* Name & Model */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-700 font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                              {p.modelCode}
                            </span>
                            <span className="text-xs font-medium text-slate-500">
                              {p.categoryLabel}
                            </span>
                            {p.isBestseller && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-50 text-unitech-red border border-red-200">
                                Bestseller
                              </span>
                            )}
                            {p.isNew && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                New Release
                              </span>
                            )}

                            {/* Stock Badge */}
                            {isOutOfStock ? (
                              <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                OUT OF STOCK
                              </span>
                            ) : isLowStock ? (
                              <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                Low Stock ({p.stockQuantity} pcs)
                              </span>
                            ) : (
                              <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                In Stock
                              </span>
                            )}
                          </div>

                          <h4 className="font-heading font-black text-slate-950 text-base">
                            {p.name}
                          </h4>

                          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                            <span>M.R.P: <strong className="text-slate-900 font-mono font-bold">{formatINR(p.mrp)}</strong></span>
                            <span>·</span>
                            <span className="text-emerald-700 font-mono font-bold">
                              Dealer Margin: ~{dealerMarginPercent}%
                            </span>
                            {p.imageUrl && (
                              <>
                                <span>·</span>
                                <span className="text-unitech-red font-bold flex items-center gap-1">
                                  <Camera className="w-3 h-3" /> Custom Image Active
                                </span>
                              </>
                            )}
                            <span>·</span>
                            <span
                              className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${(p.imageCount || (p.imageUrl ? 1 : 0)) >= 4
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                                }`}
                            >
                              {p.imageCount || (p.imageUrl ? 1 : 0)} photos
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Inline Editor or Price Displays */}
                      {isEditing ? (
                        <div className="flex flex-col gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-300 w-full shadow-xs">
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            <div>
                              <span className="text-[11px] text-slate-700 block font-bold mb-1">
                                1-9 Units Rate (₹):
                              </span>
                              <input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(Number(e.target.value))}
                                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-xs font-bold focus:outline-none focus:border-unitech-red"
                              />
                              <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">Standard / Sample</span>
                            </div>

                            <div>
                              <span className="text-[11px] text-slate-700 block font-bold mb-1">
                                10-49 Units (₹):
                              </span>
                              <input
                                type="number"
                                value={editTier2Price}
                                onChange={(e) => setEditTier2Price(Number(e.target.value))}
                                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-xs font-bold focus:outline-none focus:border-unitech-red"
                              />
                              <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">Wholesale Tier</span>
                            </div>

                            <div>
                              <span className="text-[11px] text-slate-700 block font-bold mb-1">
                                50+ Dealer Rate (₹):
                              </span>
                              <input
                                type="number"
                                value={editDealerPrice}
                                onChange={(e) => setEditDealerPrice(Number(e.target.value))}
                                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-emerald-800 font-mono text-xs font-bold focus:outline-none focus:border-unitech-red"
                              />
                              <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">Authorized Dealer</span>
                            </div>

                            <div>
                              <span className="text-[11px] text-slate-700 block font-bold mb-1">
                                Printed M.R.P. (₹):
                              </span>
                              <input
                                type="number"
                                value={editMrp}
                                onChange={(e) => setEditMrp(Number(e.target.value))}
                                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-xs font-bold focus:outline-none focus:border-unitech-red"
                              />
                              <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">MSRP on Box</span>
                            </div>

                            <div>
                              <span className="text-[11px] text-slate-700 block font-bold mb-1">
                                Warehouse Stock:
                              </span>
                              <input
                                type="number"
                                min={0}
                                value={editStock}
                                onChange={(e) => setEditStock(Math.max(0, Number(e.target.value)))}
                                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-xs font-bold focus:outline-none focus:border-unitech-red"
                              />
                              <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">Sahibabad Plant</span>
                            </div>
                          </div>

                          {/* Cable Lengths / Coil Metric Manager (When category is Cables) */}
                          {p.category === "cables" && (
                            <div className="pt-3 border-t border-slate-200 mt-1 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                  <span>Wiring Length / Coil Size Metrics (Dropdown Options):</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditCableLengths((prev) => [
                                      ...prev,
                                      { label: "New Coil Length Metric", priceDelta: 500 },
                                    ])
                                  }
                                  className="text-[11px] font-bold text-unitech-red hover:text-red-700 flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 border border-red-200 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>+ Add Coil Metric</span>
                                </button>
                              </div>

                              <div className="space-y-2">
                                {editCableLengths.map((opt, optIdx) => (
                                  <div
                                    key={optIdx}
                                    className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <input
                                        type="text"
                                        placeholder="Coil size / length label (e.g. 90 Yards / 90m Roll)"
                                        value={opt.label}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setEditCableLengths((prev) => {
                                            const copy = [...prev];
                                            copy[optIdx] = { ...copy[optIdx], label: val };
                                            return copy;
                                          });
                                        }}
                                        className="w-full px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                                      />
                                    </div>
                                    <div className="w-32 shrink-0 flex items-center gap-1">
                                      <span className="text-[11px] font-mono text-slate-500">+₹</span>
                                      <input
                                        type="number"
                                        placeholder="Delta Price"
                                        value={opt.priceDelta}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setEditCableLengths((prev) => {
                                            const copy = [...prev];
                                            copy[optIdx] = { ...copy[optIdx], priceDelta: val };
                                            return copy;
                                          });
                                        }}
                                        className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditCableLengths((prev) => prev.filter((_, i) => i !== optIdx))
                                      }
                                      className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                                      title="Delete length metric"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200/80">
                            <button
                              type="button"
                              onClick={() => setEditingProdId(null)}
                              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveProductRow(p.id)}
                              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Save Pricing & Metrics</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-4 sm:gap-5 w-full lg:w-auto justify-between lg:justify-end">
                          {/* Rates: 1-9 units, 10-49 units, 50+ dealer, MSRP */}
                          <div className="text-right">
                            <div className="text-slate-500 text-[10px] uppercase font-bold font-mono">
                              1-9 Units:
                            </div>
                            <div className="font-heading font-black text-slate-950 text-sm sm:text-base">
                              {formatINR(p.price)}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-slate-500 text-[10px] uppercase font-bold font-mono">
                              10-49 Units:
                            </div>
                            <div className="font-heading font-black text-slate-900 text-sm sm:text-base">
                              {formatINR(p.tier2Price || Math.round(p.price * 0.85))}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-emerald-700 text-[10px] font-bold uppercase font-mono">
                              50+ Dealer:
                            </div>
                            <div className="font-heading font-black text-emerald-700 text-sm sm:text-base">
                              {formatINR(p.dealerPrice)}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-slate-400 text-[10px] uppercase font-bold font-mono">
                              M.R.P.:
                            </div>
                            <div className="font-mono font-bold text-slate-500 text-xs sm:text-sm line-through">
                              {formatINR(p.mrp)}
                            </div>
                          </div>

                          {/* Quick Stepper for Stock Units */}
                          <div className="text-right">
                            <div className="text-slate-500 text-[11px] uppercase font-bold font-mono mb-1">
                              Stock Units:
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleStockStepper(p.id, -1)}
                                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold border border-slate-200"
                                title="Decrease Stock"
                              >
                                -
                              </button>
                              <span
                                className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg border ${isOutOfStock
                                  ? "bg-rose-100 text-rose-700 border-rose-200 font-black"
                                  : "bg-slate-50 text-slate-900 border-slate-200"
                                  }`}
                              >
                                {p.stockQuantity} pcs
                              </span>
                              <button
                                onClick={() => handleStockStepper(p.id, 1)}
                                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold border border-slate-200"
                                title="Increase Stock"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Action Buttons: Update Image, Edit Rates, Delete */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenImageModal(p)}
                              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-300 shadow-2xs text-xs hover:border-slate-400 flex items-center gap-1.5 transition-all"
                              title="Manage product gallery photos"
                            >
                              <Camera className="w-3.5 h-3.5 text-unitech-red" />
                              <span>Photos ({p.imageCount || (p.imageUrl ? 1 : 0)}/6)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditProductModal(p)}
                              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-black border border-slate-300 shadow-2xs text-xs hover:border-slate-400 transition-all"
                            >
                              Edit Rates
                            </button>

                            <button
                              type="button"
                              onClick={() => setProductToDelete(p)}
                              className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-300 transition-colors"
                              title="Remove product from catalogue"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: PRODUCT IMAGES & LIVE CATALOGUE STUDIO (LIGHT THEME) */}
          {/* ========================================================= */}
          {activeTab === "PRODUCT_IMAGES" && (
            <div className="w-full space-y-6">
              {/* Header */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-unitech-red animate-pulse" />
                    <h2 className="font-heading font-black text-xl text-slate-900 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-unitech-red" />
                      <span>Product Images & Catalogue Ingestion Studio</span>
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                    Upload & update high-resolution product photography across the storefront, ingest new hardware models directly to the live catalogue, or delete obsolete models.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                    {products.length} Models Active on Storefront
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenAddProductModal}
                    className="px-4 py-2.5 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-unitech-red/30 transition-all shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Hardware Product</span>
                  </button>
                </div>
              </div>

              {/* Search & Category Filter */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {[
                    { id: "ALL", label: "All Hardware" },
                    { id: "cctv-cameras", label: "CCTV Cameras" },
                    { id: "dvr-nvr", label: "DVR & NVR" },
                    { id: "cables", label: "Cables" },
                    { id: "power-accessories", label: "Power SMPS" },
                    { id: "network-racks", label: "Server Racks" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setProductCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${productCategoryFilter === cat.id
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[220px]">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search model code or product name..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-medium focus:bg-white focus:border-unitech-red focus:outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Product Visual Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map((p) => {
                  const hasCustomImage = Boolean(p.imageUrl);
                  const isOutOfStock = p.stockQuantity === 0;

                  return (
                    <div
                      key={p.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                    >
                      {/* Top: Image Canvas with Badges (Click to View & Edit Specs) */}
                      <div
                        onClick={() => handleOpenSpecsModal(p)}
                        className="relative rounded-xl border border-slate-200 bg-slate-50 overflow-hidden h-44 flex items-center justify-center p-3 group cursor-pointer hover:border-unitech-red transition-all"
                        title="Click to view & edit product specifications & features previewed on live site"
                      >
                        {p.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="text-center p-3">
                            <Camera className="w-10 h-10 text-slate-400 group-hover:text-unitech-red transition-colors mx-auto mb-1.5" />
                            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
                              [CAD Blueprint Placeholder]
                            </span>
                            <span className="text-xs font-heading font-black text-slate-800 line-clamp-1 mt-0.5">
                              {p.placeholderLabel}
                            </span>
                          </div>
                        )}

                        {/* Top-Left: Image Status Pill */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          {hasCustomImage ? (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              Custom Image Active
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
                              Default CAD Blueprint
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shadow-2xs ${(p.imageCount || (p.imageUrl ? 1 : 0)) >= 4
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                          >
                            {p.imageCount || (p.imageUrl ? 1 : 0)} photos
                          </span>
                        </div>

                        {/* Top-Right: Connectivity / Stock */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-white/90 border border-slate-200 text-slate-700 shadow-2xs backdrop-blur-xs">
                            {p.connectivity === "wireless" ? "Wireless" : "Wired"}
                          </span>
                        </div>

                        {/* Hover Overlay Prompt */}
                        <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-3 text-center">
                          <Sliders className="w-6 h-6 text-unitech-red mb-1.5 animate-bounce" />
                          <span className="text-xs font-bold leading-tight">Click Photo to View / Edit Specs & Features</span>
                          <span className="text-[10px] text-slate-300 mt-1 font-mono">Live Site Preview</span>
                        </div>
                      </div>

                      {/* Middle: Product Metadata */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-black text-unitech-red bg-red-50 border border-red-200 px-2 py-0.5 rounded uppercase">
                            {p.modelCode}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {p.categoryLabel}
                          </span>
                        </div>

                        <h4
                          onClick={() => handleOpenSpecsModal(p)}
                          className="font-heading font-black text-slate-900 text-sm line-clamp-2 cursor-pointer hover:text-unitech-red transition-colors"
                          title="Click product name to view & edit specifications and features previewed on site"
                        >
                          {p.name}
                        </h4>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                          <span className="text-slate-600">
                            B2B: <strong className="text-slate-900 font-mono font-bold">{formatINR(p.price)}</strong>
                          </span>
                          <span className="text-emerald-700 font-mono font-bold">
                            Dealer: {formatINR(p.dealerPrice)}
                          </span>
                          <span
                            className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${isOutOfStock
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-slate-100 text-slate-700"
                              }`}
                          >
                            {isOutOfStock ? "Out of Stock" : `${p.stockQuantity} pcs`}
                          </span>
                        </div>
                      </div>

                      {/* Bottom: Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleOpenSpecsModal(p)}
                          className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all"
                          title="Click to view & edit technical specifications and feature bullets"
                        >
                          <Sliders className="w-3.5 h-3.5 text-red-400" />
                          <span>Specs / Features</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenImageModal(p)}
                          className="flex-1 py-2 px-3 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-unitech-red/20 transition-all"
                          title="Manage product gallery photos"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Photos ({p.imageCount || (p.imageUrl ? 1 : 0)}/6)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setProductToDelete(p)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors"
                          title="Remove product from live catalogue"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SHARED MODALS FOR PRODUCT IMAGE & CATALOGUE INGESTION */}
          {/* ========================================================= */}

          {/* ========================================================= */}
          {/* MODAL 0: PRODUCT SPECS & FEATURES STUDIO (PREVIEW & EDIT)  */}
          {/* ========================================================= */}
          {specsModalProduct && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
              <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-unitech-red border border-red-200 flex items-center justify-center">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-slate-900 text-lg sm:text-xl flex items-center gap-2">
                        <span>Product Specifications & Features</span>
                        {isEditingSpecs && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 uppercase">
                            Edit Mode Active
                          </span>
                        )}
                      </h3>
                      <span className="text-xs text-slate-500 font-mono">
                        Model: {specsModalProduct.modelCode} · {specsModalProduct.categoryLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isEditingSpecs ? (
                      <button
                        type="button"
                        onClick={() => setIsEditingSpecs(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Specs & Features</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditingSpecs(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                      >
                        Preview Storefront Mode
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSpecsModalProduct(null)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                      title="Close modal"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Target Product Summary Banner */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                      {specsModalProduct.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={specsModalProduct.imageUrl}
                          alt={specsModalProduct.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <Camera className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase font-black text-unitech-red bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                        {specsModalProduct.modelCode}
                      </span>
                      <h4 className="font-heading font-black text-slate-900 text-sm sm:text-base mt-0.5">
                        {specsModalProduct.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>B2B: <strong className="text-slate-900">{formatINR(specsModalProduct.price)}</strong></span>
                        <span>Dealer: <strong className="text-emerald-700">{formatINR(specsModalProduct.dealerPrice)}</strong></span>
                        <span>Stock: <strong className="text-slate-900">{specsModalProduct.stockQuantity} pcs</strong></span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`/product/${specsModalProduct.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold text-unitech-red hover:underline shrink-0"
                  >
                    <span>View on Live Site</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* CONTENT AREA: PREVIEW MODE VS EDIT MODE */}
                {!isEditingSpecs ? (
                  /* =================================================== */
                  /* 1. STOREFRONT PREVIEW MODE (MATCHES LIVE SITE)     */
                  /* =================================================== */
                  <div className="space-y-6">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-semibold">
                          Live Storefront Preview: How specs & features appear to customers on product pages & quick modals.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingSpecs(true)}
                        className="font-bold underline hover:text-blue-700 shrink-0 cursor-pointer"
                      >
                        Click to Edit
                      </button>
                    </div>

                    {/* Technical Specifications Matrix */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <h4 className="font-heading font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                          <Sliders className="w-4 h-4 text-unitech-red" />
                          <span>Verified Technical Specifications Matrix</span>
                        </h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          {Object.keys(specsModalProduct.specs || {}).length} Parameters Configured
                        </span>
                      </div>

                      <div className="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
                        {Object.entries(specsModalProduct.specs || {}).length > 0 ? (
                          Object.entries(specsModalProduct.specs || {}).map(([specKey, specVal]) => (
                            <div key={specKey} className="grid grid-cols-3 p-3 bg-slate-50/50 hover:bg-slate-50">
                              <span className="font-bold text-slate-600 col-span-1">{specKey}</span>
                              <span className="text-slate-900 font-medium col-span-2">{specVal}</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400">
                            No technical specifications added yet. Click &apos;Edit Specs & Features&apos; to add parameters.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Key Product Highlights & Features */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <h4 className="font-heading font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Key Product Highlights & Feature Bullets</span>
                        </h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          {(specsModalProduct.highlights || []).length} Bullets
                        </span>
                      </div>

                      <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        {(specsModalProduct.highlights || []).length > 0 ? (
                          (specsModalProduct.highlights || []).map((hl, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-xs text-slate-800">
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="font-medium">{hl}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-xs text-slate-400 py-2">
                            No feature bullet points added yet.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Official Technical PDF Datasheet Storefront Preview */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <h4 className="font-heading font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-unitech-red" />
                          <span>Official Technical PDF Datasheet</span>
                        </h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          Storefront Download Button
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-red-50 text-unitech-red border border-red-200 flex items-center justify-center shrink-0">
                            <FileDown className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 block">
                              PDF Datasheet Document
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 truncate block">
                              {specsModalProduct.datasheetPdfUrl || "/downloads/unitech-2026-master-catalog.pdf"}
                            </span>
                          </div>
                        </div>

                        <a
                          href={specsModalProduct.datasheetPdfUrl || "/downloads/unitech-2026-master-catalog.pdf"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-unitech-red border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>Download PDF Datasheet</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSpecsModalProduct(null)}
                        className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Close Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingSpecs(true)}
                        className="px-6 py-2.5 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Specifications & Features</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* =================================================== */
                  /* 2. SPECIFICATIONS & FEATURES EDITING FORM          */
                  /* =================================================== */
                  <div className="space-y-6">
                    {/* Section 1: Specifications Key-Value Pairs */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-heading font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                            <Sliders className="w-4 h-4 text-unitech-red" />
                            <span>Technical Specifications Parameters</span>
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Configure parameters such as Resolution, Optical Lens, Night Vision, Housing, Power, etc.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddSpecRow}
                          className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-unitech-red border border-red-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Spec Row</span>
                        </button>
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {editableSpecs.map((spec, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <input
                              type="text"
                              value={spec.key}
                              onChange={(e) => handleSpecChange(sIdx, "key", e.target.value)}
                              placeholder="Spec Name (e.g. Resolution)"
                              className="w-1/3 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-unitech-red"
                            />
                            <input
                              type="text"
                              value={spec.value}
                              onChange={(e) => handleSpecChange(sIdx, "value", e.target.value)}
                              placeholder="Spec Value (e.g. 4 MP 2560x1440 @ 25fps)"
                              className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-unitech-red"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveSpecRow(sIdx)}
                              className="w-8 h-8 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 2: Features & Highlights List */}
                    <div className="space-y-3 pt-3 border-t border-slate-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-heading font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Feature Bullets & Marketing Highlights</span>
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Bullet points previewed with green checkmarks on product detail pages.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddHighlightRow}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Feature Bullet</span>
                        </button>
                      </div>

                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {editableHighlights.map((hl, hIdx) => (
                          <div key={hIdx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <span className="text-[11px] font-mono text-slate-400 w-6 text-center font-bold">
                              0{hIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={hl}
                              onChange={(e) => handleHighlightChange(hIdx, e.target.value)}
                              placeholder="Feature description (e.g. 1/3'' 3.6 mm Optical Lens with ONVIF & PoE)"
                              className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-unitech-red"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveHighlightRow(hIdx)}
                              className="w-8 h-8 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                              title="Delete feature"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 3: Technical PDF Datasheet Upload & Link */}
                    <div className="space-y-3 pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-heading font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-unitech-red" />
                            <span>Technical PDF Datasheet (for &quot;Download PDF Datasheet&quot; Button)</span>
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Upload official product PDF datasheet or paste URL to update the storefront download button.
                          </p>
                        </div>
                        {editableDatasheetUrl && (
                          <a
                            href={editableDatasheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-unitech-red hover:underline flex items-center gap-1 shrink-0"
                          >
                            <span>View Current PDF</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <div className="relative border-2 border-dashed border-slate-300 hover:border-unitech-red rounded-2xl p-4 text-center bg-slate-50/50 hover:bg-red-50/20 transition-all cursor-pointer">
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handleSpecsDatasheetFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <FileDown className="w-6 h-6 text-unitech-red mx-auto mb-1" />
                        {isUploadingSpecsDatasheet ? (
                          <div className="text-amber-600 font-bold text-xs inline-flex items-center gap-1.5">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Uploading PDF datasheet to PostgreSQL...
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-900 font-bold block text-xs">
                              Click or drag new product PDF datasheet here
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Stored in PostgreSQL binary store and updates the &quot;Download PDF Datasheet&quot; button
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="e.g. /downloads/utr-1006-datasheet.pdf or https://..."
                          value={editableDatasheetUrl}
                          onChange={(e) => setEditableDatasheetUrl(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-unitech-red"
                        />
                      </div>
                    </div>

                    {/* Action Bar: Cancel vs Save & Publish */}
                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setIsEditingSpecs(false)}
                        className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveAndPublishSpecs}
                        disabled={isSavingSpecs}
                        className="px-6 py-2.5 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-black flex items-center gap-2 shadow-md shadow-unitech-red/30 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isSavingSpecs ? "Publishing Changes..." : "Save Changes & Publish Live"}</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODAL 1: PRODUCT MULTI-IMAGE GALLERY & DATASHEET MANAGER  */}
          {/* ========================================================= */}
          {imageModalProduct && (
            <ProductGalleryModal
              product={imageModalProduct}
              onClose={() => setImageModalProduct(null)}
              onSaveSuccess={(updatedImages, coverUrl, newDatasheet) => {
                const updated = products.map((p) => {
                  if (p.id === imageModalProduct.id) {
                    return {
                      ...p,
                      imageUrl: coverUrl || p.imageUrl,
                      images: updatedImages,
                      imageCount: updatedImages.length,
                      datasheetPdfUrl:
                        newDatasheet !== undefined ? newDatasheet : p.datasheetPdfUrl,
                    };
                  }
                  return p;
                });
                updateProductsState(updated);
                setImageModalProduct(null);
              }}
              showToast={showToast}
            />
          )}

          {/* ========================================================= */}
          {/* SHARED PRODUCT FORM MODAL (CREATE & EDIT) */}
          {/* ========================================================= */}
          {productFormOpen && (
            <ProductForm
              isOpen={productFormOpen}
              mode={productFormMode}
              product={productFormTarget}
              onClose={() => setProductFormOpen(false)}
              onSuccess={handleProductFormSuccess}
              onNotify={showToast}
            />
          )}

          {/* ========================================================= */}
          {/* MODAL 3: DELETE PRODUCT CONFIRMATION (LIGHT THEME) */}
          {/* ========================================================= */}
          {productToDelete && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
              <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-slate-900 text-lg">
                      Remove Product?
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">
                      {productToDelete.modelCode} · {productToDelete.categoryLabel}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600">
                  Are you sure you want to remove <strong>"{productToDelete.name}"</strong>? This will immediately remove it from the live catalogue and storefront.
                </p>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setProductToDelete(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteProduct}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-2xs"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: CATEGORIES & SERIES STUDIO */}
          {/* ========================================================= */}
          {activeTab === "CATEGORIES" && (
            <CategoriesEditor
              onNotify={showToast}
            />
          )}

          {/* ========================================================= */}
          {/* TAB: AUTHORIZED DEALERS & REGIONAL HUBS NETWORK */}
          {/* ========================================================= */}
          {activeTab === "DEALERS" && (
            <div className="w-full space-y-6">
              {/* Header */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h2 className="font-heading font-black text-xl text-slate-900">
                      Authorized Dealers & Regional Hubs Network
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                    Manage pan-India regional stockists, state distributors, depots, and wholesale partner hubs displayed on the public{" "}
                    <Link href="/dealers" target="_blank" className="text-unitech-red font-bold hover:underline">
                      /dealers
                    </Link>{" "}
                    directory.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <Link
                    href="/dealers"
                    target="_blank"
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
                  >
                    <span>View Public /dealers</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  </Link>
                  <button
                    type="button"
                    onClick={handleOpenAddDealerHub}
                    className="px-4 py-2.5 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-unitech-red/30 transition-all shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Dealer Card</span>
                  </button>
                </div>
              </div>

              {/* KPI Inventory Health Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Total Regional Hubs
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-heading font-black text-2xl text-slate-900">
                      {dealerHubs.length}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">Distribution Depots</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Active Live Hubs
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-heading font-black text-2xl text-emerald-600">
                      {dealerHubs.filter((d) => d.isActive !== false).length}
                    </span>
                    <span className="text-xs text-emerald-700 font-semibold">Active on /dealers</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Pan-India Footprint
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-heading font-black text-2xl text-slate-900">
                      28
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">States & Territories</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Dispatch SLA
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-heading font-black text-2xl text-slate-900">
                      24-48 Hrs
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">Pan-India Freight</span>
                  </div>
                </div>
              </div>

              {/* Search & Tier Filter Bar */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search by state, city, address or phone..."
                    value={dealerHubSearch}
                    onChange={(e) => setDealerHubSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:bg-white focus:outline-none focus:border-unitech-red"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {[
                    { id: "ALL", label: "All Tiers" },
                    { id: "Central Manufacturing & RMA Hub", label: "Central Hub" },
                    { id: "Western Regional Stockist", label: "Western Stockist" },
                    { id: "Authorized State Distributor", label: "State Distributor" },
                    { id: "State Depot Hub", label: "Depot Hub" },
                    { id: "Southern Distribution Center", label: "South Center" },
                    { id: "Authorized Wholesale Partner", label: "Wholesale Partner" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setDealerHubTierFilter(filter.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${dealerHubTierFilter === filter.id
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dealer Cards Grid */}
              {filteredDealerHubs.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 space-y-3">
                  <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-800">
                    No Authorized Dealer Hubs match your search or filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDealerHubSearch("");
                      setDealerHubTierFilter("ALL");
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDealerHubs.map((hub) => {
                    const isLive = hub.isActive !== false;
                    return (
                      <div
                        key={hub.id}
                        className={`p-6 rounded-3xl bg-white border transition-all shadow-2xs flex flex-col justify-between space-y-4 ${isLive
                          ? "border-slate-200/90 hover:border-slate-300 hover:shadow-md"
                          : "border-slate-200 opacity-60 bg-slate-50/70"
                          }`}
                      >
                        <div className="space-y-3">
                          {/* Top Row: Type Pill & Status Indicator */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 truncate">
                              {hub.type}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                                  }`}
                              />
                              <span className="text-[10px] font-mono font-bold text-slate-500">
                                {isLive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>

                          {/* State & City */}
                          <div>
                            <h3 className="font-heading font-black text-slate-900 text-base sm:text-lg mb-0.5">
                              {hub.state}
                            </h3>
                            <div className="text-xs font-semibold text-unitech-red">
                              {hub.city}
                            </div>
                          </div>

                          {/* Address */}
                          <div className="flex items-start gap-2 text-xs text-slate-600">
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 leading-relaxed">{hub.address}</span>
                          </div>

                          {/* Phone Contact */}
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{hub.contact}</span>
                          </div>
                        </div>

                        {/* Card Action Bar */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleDealerHubStatus(hub.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${isLive
                              ? "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
                              }`}
                          >
                            {isLive ? "Pause / Inactive" : "Activate"}
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditDealerHub(hub)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                              title="Edit Dealer Details"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDealerHubToDelete(hub)}
                              className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors"
                              title="Delete Dealer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* MODAL: ADD / EDIT DEALER HUB */}
          {/* ========================================================= */}
          {showDealerHubModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
              <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-unitech-red border border-red-200 flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-slate-900 text-lg">
                        {editingDealerHubId ? "Edit Dealer Hub Information" : "Add New Dealer Card"}
                      </h3>
                      <span className="text-xs text-slate-500 font-mono">
                        Pan-India Authorized Distribution Footprint · Live on /dealers
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDealerHubModal(false)}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveDealerHub} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Region / State / Territory *:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Delhi NCR & Western UP, Maharashtra, Rajasthan"
                      value={dealerHubForm.state}
                      onChange={(e) => setDealerHubForm({ ...dealerHubForm, state: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-unitech-red"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Major Cities Served *:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ghaziabad (Central Plant) & Delhi, Mumbai & Bhiwandi Logistics"
                      value={dealerHubForm.city}
                      onChange={(e) => setDealerHubForm({ ...dealerHubForm, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-unitech-red"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Hub Classification / Tier Badge *:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                      {[
                        "Central Manufacturing & RMA Hub",
                        "Western Regional Stockist",
                        "Authorized State Distributor",
                        "State Depot Hub",
                        "Southern Distribution Center",
                        "Authorized Wholesale Partner",
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setDealerHubForm({ ...dealerHubForm, type: preset })}
                          className={`px-3 py-1.5 rounded-lg border text-left text-[11px] font-bold transition-colors ${dealerHubForm.type === preset
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Or enter custom tier badge label..."
                      value={dealerHubForm.type}
                      onChange={(e) => setDealerHubForm({ ...dealerHubForm, type: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-unitech-red"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Full Physical Address *:
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. Site 2, Ajanta Compound, Mohan Nagar, Sahibabad Industrial Area, Ghaziabad"
                      value={dealerHubForm.address}
                      onChange={(e) => setDealerHubForm({ ...dealerHubForm, address: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-unitech-red resize-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Contact Phone / WhatsApp Desk *:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +91 98 1814 1759"
                      value={dealerHubForm.contact}
                      onChange={(e) => setDealerHubForm({ ...dealerHubForm, contact: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold text-xs focus:bg-white focus:outline-none focus:border-unitech-red"
                    />
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 select-none">
                      <input
                        type="checkbox"
                        checked={dealerHubForm.isActive}
                        onChange={(e) => setDealerHubForm({ ...dealerHubForm, isActive: e.target.checked })}
                        className="w-4 h-4 rounded text-unitech-red focus:ring-unitech-red accent-unitech-red"
                      />
                      <span>Active (Immediately visible on public /dealers page)</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setShowDealerHubModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-unitech-red/30 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingDealerHubId ? "Save Changes" : "Publish Dealer Card Live"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODAL: DELETE DEALER CONFIRMATION */}
          {/* ========================================================= */}
          {dealerHubToDelete && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
              <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mb-2">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-black text-slate-900 text-lg">
                  Delete Dealer Hub Card?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to permanently delete{" "}
                  <strong className="text-slate-900">{dealerHubToDelete.state}</strong> (
                  {dealerHubToDelete.city})? This dealer card will immediately be removed from the public{" "}
                  <strong>/dealers</strong> directory.
                </p>
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDealerHubToDelete(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteDealerHub}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-2xs"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: SALES & TICKER BANNERS STUDIO */}
          {/* ========================================================= */}
          {activeTab === "BANNERS" && (
            <div className="w-full space-y-6">
              {/* Header */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-unitech-red animate-pulse" />
                    <h2 className="font-heading font-black text-xl text-slate-900">
                      Top Header Ticker
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                    Manage the announcement bar shown at the top of every page.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                    {banners.filter((b) => b.isActive).length} Tickers Live
                  </span>
                </div>
              </div>

              {/* TOP HEADER ANNOUNCEMENT BAR TICKER */}
                <div className="space-y-6">
                  {/* 1. Standard Brand Corporate Template Selector */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-unitech-red" />
                          <span>1. Choose Standard Corporate Template (One-Click Setup)</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Pick a pre-approved Unitech corporate template for the top header news ticker.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {BRAND_BANNER_TEMPLATES.map((tpl) => {
                        const isSelected = activeTemplateId === tpl.id && !editingBannerId;
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => handleApplyTemplate(tpl)}
                            className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${isSelected
                              ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-unitech-red/30"
                              : "bg-slate-50/70 hover:bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-2xs"
                              }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xl">{tpl.icon}</span>
                                <span
                                  className={`text-[9px] font-mono uppercase font-black px-2 py-0.5 rounded ${tpl.accent === "red"
                                    ? "bg-red-100 text-red-700"
                                    : tpl.accent === "emerald"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : tpl.accent === "amber"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-slate-200 text-slate-700"
                                    }`}
                                >
                                  {tpl.tag}
                                </span>
                              </div>
                              <h4 className="font-heading font-bold text-xs tracking-tight">
                                {tpl.name}
                              </h4>
                              <p
                                className={`text-[11px] mt-1 line-clamp-2 ${isSelected ? "text-slate-300" : "text-slate-500"
                                  }`}
                              >
                                {tpl.tagline}
                              </p>
                            </div>
                            <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-center justify-between">
                              <span
                                className={`text-[10px] font-mono font-medium ${isSelected ? "text-slate-300" : "text-slate-400"
                                  }`}
                              >
                                {tpl.type.replace("_", " ")}
                              </span>
                              <span
                                className={`text-[10px] font-bold ${isSelected ? "text-red-400" : "text-unitech-red"
                                  }`}
                              >
                                Use Template →
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Standard Customizable Template Studio Form */}
                  <form
                    onSubmit={handleSaveStudioBanner}
                    className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-6"
                  >
                    {/* Form Title & Editing Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-unitech-red" />
                        <h3 className="font-heading font-bold text-sm text-slate-900">
                          {editingBannerId ? (
                            <span className="text-unitech-red flex items-center gap-2">
                              <span>Customizing Live Ticker:</span>
                              <code className="text-xs bg-red-50 text-unitech-red px-2 py-0.5 rounded border border-red-200">
                                {editingBannerId}
                              </code>
                            </span>
                          ) : (
                            <span>Top Header Ticker Customizable Fields</span>
                          )}
                        </h3>
                      </div>
                      {editingBannerId && (
                        <button
                          type="button"
                          onClick={handleCancelEditBanner}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                        >
                          ✕ Cancel Editing & Reset
                        </button>
                      )}
                    </div>

                    {/* Row 1: Placement, Brand Accent Theme, Badge Tag */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Placement Location:
                        </label>
                        <select
                          value={studioType}
                          onChange={(e) => setStudioType(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-unitech-red"
                        >
                          <option value="TOP_TICKER">Top News Bar Ticker</option>
                          <option value="HERO_SLIDE">Hero Showcase Ribbon</option>
                          <option value="FLASH_SALE">Flash Alert Bar</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Brand Accent Theme:
                        </label>
                        <select
                          value={studioAccent}
                          onChange={(e) => setStudioAccent(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-unitech-red"
                        >
                          <option value="red">🔴 Unitech Factory Red</option>
                          <option value="emerald">🟢 Emerald GeM Verified</option>
                          <option value="amber">🟡 Amber Priority Alert</option>
                          <option value="slate">⚪ Industrial Corporate Slate</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Badge Pill Tag (Uppercase):
                        </label>
                        <input
                          type="text"
                          value={studioTag}
                          onChange={(e) => setStudioTag(e.target.value)}
                          placeholder="e.g. FACTORY LIVE"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono uppercase focus:bg-white focus:outline-none focus:border-unitech-red"
                        />
                      </div>
                    </div>

                    {/* Row 2: Headline Message */}
                    <div className="text-xs">
                      <label className="font-bold text-slate-700 block mb-1">
                        Announcement Headline Message *:
                      </label>
                      <input
                        type="text"
                        required
                        value={studioTitle}
                        onChange={(e) => setStudioTitle(e.target.value)}
                        placeholder="Enter bold announcement text to broadcast across storefront..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-unitech-red font-medium text-xs"
                      />
                    </div>

                    {/* Row 3: Subtitle & CTA */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Supporting Subtitle / Details:
                        </label>
                        <input
                          type="text"
                          value={studioSubtitle}
                          onChange={(e) => setStudioSubtitle(e.target.value)}
                          placeholder="e.g. Direct Factory Wholesale Rates · GST 18% Input Credit Tax Invoicing"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-unitech-red text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Button Label (CTA):
                          </label>
                          <input
                            type="text"
                            value={studioCtaText}
                            onChange={(e) => setStudioCtaText(e.target.value)}
                            placeholder="e.g. Contact Sales Desk"
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-unitech-red text-xs"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            CTA Link Destination:
                          </label>
                          <input
                            type="text"
                            value={studioCtaLink}
                            onChange={(e) => setStudioCtaLink(e.target.value)}
                            placeholder="e.g. #contact or /products"
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-unitech-red font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 4: Custom Fields */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="font-bold text-slate-800 text-xs block">
                            Custom Template Highlight Tags:
                          </label>
                          <p className="text-[11px] text-slate-500">
                            Add custom bullet badges that accompany this ticker.
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newCustomTagInput}
                            onChange={(e) => setNewCustomTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddCustomTag();
                              }
                            }}
                            placeholder="Type custom field tag..."
                            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-unitech-red"
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomTag}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 transition-colors"
                          >
                            + Add Tag
                          </button>
                        </div>
                      </div>

                      {/* Render active custom tags */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {studioCustomTags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-medium shadow-2xs"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomTag(tag)}
                              className="text-slate-400 hover:text-rose-600 transition-colors"
                              title="Remove tag"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleApplyTemplate(BRAND_BANNER_TEMPLATES[0])}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all w-full sm:w-auto"
                      >
                        Reset to Default Ticker Template
                      </button>

                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-unitech-red/30 transition-all w-full sm:w-auto"
                      >
                        <Save className="w-4 h-4" />
                        <span>
                          {editingBannerId ? "Save Changes & Update Live Ticker" : "Publish Ticker Live to Storefront"}
                        </span>
                      </button>
                    </div>
                  </form>

                  {/* 3. Active & Scheduled Banners List */}
                  <div className="space-y-4">
                    <h3 className="font-heading font-bold text-base text-slate-900">
                      Active & Scheduled Header Tickers ({banners.length})
                    </h3>

                    <div className="space-y-3">
                      {banners.map((ban) => {
                        const isLive = ban.isActive;
                        return (
                          <div
                            key={ban.id}
                            className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs ${isLive
                              ? "bg-white border-slate-200 hover:border-slate-300"
                              : "bg-slate-50/70 border-slate-200/80 opacity-75"
                              }`}
                          >
                            <div className="space-y-2 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase border border-slate-200">
                                  {ban.type.replace("_", " ")}
                                </span>
                                {ban.badgeText && (
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                                    {ban.badgeText}
                                  </span>
                                )}
                                <span className="text-[10px] font-mono text-slate-400">
                                  ID: {ban.id}
                                </span>
                              </div>

                              <h4 className="font-heading font-black text-sm text-slate-900">
                                {ban.title}
                              </h4>

                              {ban.subtitle && (
                                <p className="text-xs text-slate-600">{ban.subtitle}</p>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end md:self-center">
                              <button
                                type="button"
                                onClick={() => handleToggleBanner(ban.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs border ${isLive
                                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
                                  }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-600 animate-pulse" : "bg-slate-400"}`} />
                                <span>{isLive ? "LIVE ON SITE" : "OFF / PAUSED"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStartEditBanner(ban)}
                                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                                <span>Customize</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteBanner(ban.id)}
                                className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors shadow-2xs"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              {/* ========================================================= */}
              {/* CARD: SEARCH — POPULAR SEARCHES & TELEMETRY INSIGHTS      */}
              {/* ========================================================= */}
              <SearchSettingsEditor onShowToast={showToast} />
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: HOMEPAGE HERO PRODUCT SALE SLIDE (SLIDE 04)           */}
          {/* ========================================================= */}
          {activeTab === "HERO_PRODUCT_SALE" && (
            <HeroProductSaleEditor onNotify={(msg) => showToast(msg)} />
          )}

          {/* ========================================================= */}
          {/* TAB: FLASH SALE POP-UP & BOTTOM SHEET                     */}
          {/* ========================================================= */}
          {activeTab === "FLASH_SALE" && (
            <FlashSaleEditor onNotify={(msg) => showToast(msg)} />
          )}

          {/* ========================================================= */}
          {/* TAB 5: GOOGLE REVIEWS & DEALER TESTIMONIALS */}
          {/* ========================================================= */}
          {activeTab === "REVIEWS" && (
            <div className="w-full space-y-6">
              {/* Header Card with Synchronize Button (Light Theme) */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                    <h2 className="font-heading font-black text-xl text-slate-900">
                      Google Reviews & Dealer Testimonials Curator
                    </h2>
                  </div>
                  <p className="text-xs text-slate-600 max-w-xl">
                    Official score: <strong className="text-slate-900">4.2 / 5.0 ★</strong> (60 Google Reviews). Fetch latest 5-star ratings or register verified B2B dealer partner testimonials with territory accreditation.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-[11px] font-mono text-slate-500">
                      Google Sync Status: {lastGoogleSync}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {reviews.filter((r) => r.isFeatured).length} / 5 Featured on Homepage
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {/* Fetch Button */}
                  <button
                    onClick={handleFetchLatestGoogleReviews}
                    disabled={isFetchingGoogle}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 border border-slate-200 transition-all disabled:opacity-50 shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isFetchingGoogle ? "animate-spin" : ""}`} />
                    <span>{isFetchingGoogle ? "Fetching Latest Reviews..." : "Fetch Latest Google Reviews"}</span>
                  </button>

                  {/* Add Dealer Testimonial */}
                  <button
                    onClick={() => setShowAddDealerModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-unitech-red/30 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Dealer Testimonial</span>
                  </button>
                </div>
              </div>

              {/* Reviews List (Light Theme Cards) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between space-y-4 shadow-2xs hover:border-slate-300 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-heading font-bold text-slate-900 text-sm">
                              {rev.authorName}
                            </h4>
                            {rev.isVerifiedPartner && (
                              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                                ✓ Verified Partner
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {rev.authorRole}
                          </span>
                        </div>

                        {/* Stars */}
                        <div className="flex text-amber-400 shrink-0">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>

                      {/* Firm & Scope if B2B Dealer */}
                      {rev.companyName && (
                        <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-700">
                          <span className="text-slate-500 font-semibold">Dealership Scope: </span>
                          <span className="font-medium text-slate-900">{rev.hardwareVolume || "Authorized Territory Wholesaler"}</span>
                        </div>
                      )}

                      <p className="text-xs text-slate-700 italic leading-relaxed font-medium">
                        "{rev.reviewText}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                          {rev.source}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {rev.relativeTime}
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggleReviewFeatured(rev.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${rev.isFeatured
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                          }`}
                      >
                        {rev.isFeatured ? "Featured on Home" : "Pin to Home"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* MODAL: ADD ENHANCED B2B DEALER TESTIMONIAL (LIGHT THEME) */}
              {showAddDealerModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                  <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-heading font-black text-slate-900 text-base">
                          Add Verified B2B Dealer Partner Testimonial
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Accredited wholesaler & integrator credentials for the live social proof showcase.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAddDealerModal(false)}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleAddDealerTestimonial} className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Proprietor / Contact Name *:
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Rajesh Singhal"
                            value={dealerForm.proprietorName}
                            onChange={(e) =>
                              setDealerForm({ ...dealerForm, proprietorName: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-unitech-red"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Firm / Business Name:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Singhal Electronics & Security"
                            value={dealerForm.firmName}
                            onChange={(e) =>
                              setDealerForm({ ...dealerForm, firmName: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-unitech-red"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            City & State *:
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Jaipur, Rajasthan"
                            value={dealerForm.city}
                            onChange={(e) =>
                              setDealerForm({ ...dealerForm, city: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-unitech-red"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Dealership Tier Accreditation:
                          </label>
                          <select
                            value={dealerForm.dealerTier}
                            onChange={(e) =>
                              setDealerForm({ ...dealerForm, dealerTier: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-unitech-red"
                          >
                            <option value="Tier-1 Authorized Stockist">Tier-1 Authorized Stockist</option>
                            <option value="Commercial System Integrator">Commercial System Integrator</option>
                            <option value="GeM Government Vendor">GeM Government Vendor</option>
                            <option value="Regional Wholesaler">Regional Wholesaler</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Hardware Volume Scope:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 500+ Unitech 4MP Cameras Installed"
                            value={dealerForm.hardwareVolume}
                            onChange={(e) =>
                              setDealerForm({ ...dealerForm, hardwareVolume: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-unitech-red"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Star Rating:
                          </label>
                          <select
                            value={dealerForm.rating}
                            onChange={(e) =>
                              setDealerForm({ ...dealerForm, rating: Number(e.target.value) })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-unitech-red"
                          >
                            <option value={5}>5 Stars (⭐⭐⭐⭐⭐)</option>
                            <option value={4}>4 Stars (⭐⭐⭐⭐)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Testimonial Statement *:
                        </label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Provide the dealer's verified feedback regarding hardware reliability, night vision, cable quality, or factory warranty service..."
                          value={dealerForm.reviewText}
                          onChange={(e) =>
                            setDealerForm({ ...dealerForm, reviewText: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-unitech-red"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setShowAddDealerModal(false)}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white font-bold flex items-center gap-1.5 shadow-sm shadow-unitech-red/30 transition-all"
                        >
                          <Save className="w-4 h-4" />
                          <span>Publish Dealer Testimonial Live</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: ABOUT PAGE: FOUNDERS & BOARD OF DIRECTORS             */}
          {/* ========================================================= */}
          {activeTab === "ABOUT_LEADERSHIP" && (
            <AboutLeadershipEditor onNotify={(msg) => showToast(msg)} />
          )}

          {/* ========================================================= */}
          {/* TAB: PAYMENT SETTINGS (ADMIN ONLY)                        */}
          {/* ========================================================= */}
          {activeTab === "PAYMENT_SETTINGS" && (
            <PaymentSettingsEditor onNotify={(msg) => showToast(msg)} />
          )}

          {/* ========================================================= */}
          {/* TAB: EMAIL NOTIFICATIONS (ADMIN ONLY)                      */}
          {/* ========================================================= */}
          {activeTab === "EMAIL_SETTINGS" && (
            <EmailSettingsEditor onNotify={(msg) => showToast(msg)} />
          )}

          {/* ========================================================= */}
          {/* TAB: SOCIAL & PLATFORM LINKS (ADMIN ONLY)                 */}
          {/* ========================================================= */}
          {activeTab === "SOCIAL_LINKS" && (
            <SocialLinksEditor onNotify={(msg) => showToast(msg)} />
          )}
        </main>
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-unitech-red/20 border border-unitech-red/40 flex items-center justify-center text-unitech-red">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-sm">Change Administrator Password</h3>
                  <p className="text-[11px] text-slate-400">All other active sessions will be terminated</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="p-6 space-y-4">
              {changePwError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <div className="leading-relaxed">{changePwError}</div>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? "text" : "password"}
                    required
                    value={changePwCurrent}
                    onChange={(e) => setChangePwCurrent(e.target.value)}
                    placeholder="Enter current master password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:border-unitech-red focus:ring-1 focus:ring-unitech-red"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showCurrentPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password <span className="text-slate-400 font-normal">(min 12 chars)</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? "text" : "password"}
                    required
                    value={changePwNew}
                    onChange={(e) => setChangePwNew(e.target.value)}
                    placeholder="Enter new master password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:border-unitech-red focus:ring-1 focus:ring-unitech-red"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {changePwNew.length > 0 && (
                  <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                    <span className={`font-mono font-bold ${changePwNew.length >= 12 ? "text-emerald-600" : "text-amber-600"}`}>
                      {changePwNew.length}/12 chars
                    </span>
                    {changePwNew.length >= 12 ? (
                      <span className="text-emerald-600 font-medium">✓ Valid length</span>
                    ) : (
                      <span className="text-amber-600 font-medium">(needs {12 - changePwNew.length} more)</span>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    required
                    value={changePwConfirm}
                    onChange={(e) => setChangePwConfirm(e.target.value)}
                    placeholder="Re-type new master password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:border-unitech-red focus:ring-1 focus:ring-unitech-red"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showConfirmPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPw || changePwNew.length < 12 || changePwNew !== changePwConfirm}
                  className="px-5 py-2.5 rounded-xl bg-unitech-red hover:bg-unitech-darkred text-white text-xs font-bold shadow-md shadow-unitech-red/25 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isChangingPw ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
