export type CategorySlug =
  | "cctv-cameras"
  | "dvr-nvr"
  | "networking-poe"
  | "cables"
  | "network-racks"
  | "power-accessories"
  | (string & {});

export interface CategorySeries {
  id: string;
  categoryId: string;
  label: string;
  slug: string;
  position: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  shortLabel?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  position: number;
  isActive: boolean;
  showInMenu: boolean;
  showInFooter: boolean;
  productCount?: number;
  series?: CategorySeries[];
  count?: number; // compatibility
  image?: string; // compatibility
  createdAt?: string;
  updatedAt?: string;
}

export interface CableLengthOption {
  label: string; // e.g. "90 Yards / 90m Roll (Standard Coil)"
  priceDelta: number; // e.g. 0, 1350, 2900
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  modelCode: string;
  category: CategorySlug;
  categoryLabel: string;
  series?: string;
  price: number; // Regular B2B/Retail Price (1-9 Units)
  tier2Price?: number; // 10-49 Units Wholesale Tier Price
  dealerPrice: number; // Verified Dealer Tier Price (50+ Units)
  mrp: number; // Maximum Retail Price (MSRP)
  stockQuantity: number;
  isBestseller?: boolean;
  isNew?: boolean;
  isPromo?: boolean;
  rating: number;
  reviewCount: number;
  datasheetPdfUrl?: string;
  warrantyYears: number;
  connectivity?: "wired" | "wireless";
  specs: Record<string, string>;
  highlights: string[];
  imageUrl?: string;
  placeholderLabel: string;
  placeholderSubtext: string;
  cableLengths?: CableLengthOption[];
  images?: ProductImage[];
  imageCount?: number;
}

export type CategoryScenePreset =
  | "graphite"
  | "navy"
  | "grid"
  | "sand"
  | "concrete"
  | "red"
  | "custom_image";

export interface HomepageCategoryCard {
  id: string;
  categoryId: string;
  position: number;
  isVisible: boolean;
  title: string;
  badge?: string;
  buttonText?: string;
  description: string;
  chips: string[];
  scenePreset: CategoryScenePreset;
  backgroundImageUrl?: string;
  productImageUrls: string[];
  linkUrl: string;
  skuCount?: number;
  updatedAt?: string;
  updatedBy?: string;
}

export type ProductImageLabel =
  | "Front view"
  | "Side view"
  | "Back view"
  | "Lens close-up"
  | "Mount & bracket"
  | "Ports & connectors"
  | "Installed on wall"
  | "In the box"
  | "Dimensions"
  | "Other";

export interface ProductImage {
  id?: string;
  productId?: string;
  url: string;
  thumbUrl: string;
  width?: number;
  height?: number;
  label: ProductImageLabel | string;
  alt: string;
  position: number;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface SearchPopularTerm {
  id: string;
  label: string;
  query: string;
  linkUrl?: string | null;
  position: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface SearchQueryLog {
  id?: number | string;
  termNormalized: string;
  resultsCount: number;
  source: "panel" | "results_page" | "chip";
  createdAt?: string;
}

export interface SearchInsightsData {
  top_terms: Array<{ term: string; count: number }>;
  zero_result_terms: Array<{ term: string; count: number }>;
  total_searches: number;
}

export interface GoogleReview {
  id: string;
  authorName: string;
  authorRole: string; // e.g. "Local Guide", "CCTV Installer", "Authorized Dealer"
  rating: number; // 1-5
  reviewText: string;
  relativeTime: string;
  isFeatured: boolean;
  source: "GOOGLE" | "DIRECT_DEALER" | "GEM_VENDOR";
  companyName?: string;
  city?: string;
  dealerTier?: string;
  hardwareVolume?: string;
  isVerifiedPartner?: boolean;
}

export interface ProductReviewItem {
  id: string;
  productId: string;
  authorName: string;
  rating: number; // 1 to 5
  reviewText: string;
  createdAt: string;
}

export interface DealerHub {
  id: string;
  state: string;
  city: string;
  address: string;
  contact: string;
  type: string;
  isActive?: boolean;
}

export type EnquiryType =
  | "DISTRIBUTOR"
  | "PRODUCT_QUOTE"
  | "GEM_TENDER"
  | "OEM"
  | "SERVICE_WARRANTY"
  | "CAREER";

export type EnquiryStatus =
  | "NEW"
  | "CONTACTED"
  | "QUOTE_SENT"
  | "CONVERTED"
  | "REJECTED";

export interface CustomerEnquiry {
  id: string;
  type: EnquiryType;
  fullName: string;
  companyName?: string;
  gstin?: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  productModel?: string;
  details: string;
  status: EnquiryStatus;
  createdAt: string;
  budget?: string;
  adminNotes?: string;
}

export interface AnnouncementBanner {
  id: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  ctaText?: string;
  ctaLink?: string;
  type: "TOP_TICKER" | "HERO_SLIDE" | "FLASH_SALE";
  isActive: boolean;
  discountPercent?: number;
  startDate?: string;
  endDate?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  accentStyle?: "red" | "emerald" | "amber" | "slate";
  customTags?: string[];
  sortOrder?: number;
}

export interface TickerSettings {
  id: number;
  isEnabled: boolean;
  rotationSeconds: number;
  animation: "fade" | "slide-up" | "marquee";
  pauseOnHover: boolean;
  showPlantDesk: boolean;
  plantDeskText: string;
  showPhone: boolean;
  phoneDisplay: string;
  phoneTel: string;
  showWhatsapp: boolean;
  whatsappLabel: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface LiveDocumentAsset {
  id: string;
  title: string;
  category: "Catalogues" | "Datasheets" | "Engineering Guides" | "Policy" | "Software" | "Utilities" | "Compliance" | string;
  section?: "catalogues" | "software" | "warranty-rma";
  fileUrl: string;
  version: string;
  fileSize: string;
  format: "PDF" | "EXE" | "ZIP" | "BIN" | "APK";
  updatedDate: string;
  isLive: boolean;
  revisionSummary?: string;
}

export interface HeroSlideSpec {
  label: string;
  value: string;
  detail: string;
}

export interface HeroSlideCard {
  id: string;
  tabLabel: string;
  category: string;
  badgeTag: string;
  badgeDetail: string;
  headline: string;
  highlightText: string;
  description: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  productName: string;
  sku: string;
  stockStatus: string;
  warranty: string;
  specs: HeroSlideSpec[];
  highlights: string[];
  type: "rack" | "camera" | "cable" | "dvr" | "offer" | "scheme";
  imageUrl?: string;
  isActive?: boolean;
  isOffer?: boolean;
  offerPrice?: number;
  mrpPrice?: number;
  savingsText?: string;
  schemaDetails?: { label: string; value: string }[];
  certTag?: string;
  certBadgeRight?: string;
  certBadgeRightClass?: string;
  certTitle?: string;
  certSubtitle?: string;
  certDetail?: string;
  bundleCards?: { title: string; style?: string }[];
  dispatchNote?: string;
  productSaleData?: any;
}

export interface ProductSaleSlideData {
  id: string;
  type: "product_sale";
  enabled: boolean;
  position: number;
  badgeText: string;
  category: string;
  productName: string;
  tagline: string;
  headlineSuffix: string;
  mrp: number;
  offerPrice: number;
  discountPercent?: number;
  discountOverride?: boolean;
  gstNote: string;
  showGstNote: boolean;
  specs: string[];
  stockLeft?: number | null;
  productImage: string;
  imageAlt: string;
  primaryCta: {
    label: string;
    url: string;
  };
  secondaryCta: {
    label: string;
    url: string;
  };
  startsAt?: string | null;
  endsAt: string;
  afterEnd: "hide_slide" | "show_without_countdown";
  status: "draft" | "published";
  updatedAt?: string;
  updatedBy?: string;
}

export interface KitConfig {
  siteType: "HOME" | "RETAIL_SHOP" | "WAREHOUSE_FACTORY" | "OFFICE";
  cameraResolution: "2MP_FULL_HD" | "4MP_COLOUR_NIGHT" | "8MP_4K_ULTRA";
  cameraCount: number;
  recordingDays: number;
  calculatedHddTb: number;
  recommendedDvrChannels: number;
  cableMeters: number;
  estimatedPrice: number;
}

export type FlashSaleStatus = "draft" | "published";
export type FlashSaleTrigger = "delay" | "immediate" | "exit_intent" | "scroll_50";
export type FlashSaleFrequency = "once_per_session" | "once_per_day" | "every_visit";
export type FlashSaleShowOn = "home_and_products" | "all_pages" | "home_only";

export interface FlashSaleItem {
  id: string;
  flashSaleId?: string;
  position: number;
  imageUrl: string;
  qty: number;
  name: string;
  shortName?: string;
  spec?: string;
}

export interface FlashSaleData {
  id: string;
  status: FlashSaleStatus;
  isEnabled: boolean;
  startsAt: string | null;
  endsAt: string;
  showTrigger: FlashSaleTrigger;
  showDelaySeconds: number;
  frequency: FlashSaleFrequency;
  showOn: FlashSaleShowOn;
  badge: string;
  badge2: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  heroImageUrl: string;
  heroImageAlt: string;
  heroBadge?: string;
  heroBadgeCaption?: string;
  mrp: number;
  price: number;
  discountOverride: number | null;
  unitsInKit: number;
  unitLabel: string;
  gstNote: string;
  perks: string[];
  stockTotal: number;
  stockLeft: number;
  ctaLabel: string;
  ctaShortLabel: string;
  whatsappNumber: string;
  bulkLabel: string;
  bulkUrl: string;
  dismissLabel: string;
  linkedProductId?: string | null;
  linkedBundleSku?: string | null;
  viewsCount: number;
  claimsCount: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  items: FlashSaleItem[];
}

export interface FlashSalePublicPayload extends FlashSaleData {
  serverNow: string;
  discount: number;
  save: number;
  perUnit: number;
  barPct: number;
  stockPct: number;
}

export interface CheckoutOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  companyName?: string | null;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string | null;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  paymentMode: "UPI" | "BANK_TRANSFER" | string;
  utrNumber?: string | null;
  paymentStatus: "AWAITING_PAYMENT" | "PENDING_VERIFICATION" | "CONFIRMED" | "REJECTED" | string;
  orderStatus: "PLACED" | "PROCESSING" | "DISPATCHED" | "DELIVERED" | "CANCELLED" | string;
  adminNotes?: string | null;
  items: any[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface EmailSettings {
  id: number;
  isEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword?: string;
  hasPassword?: boolean;
  senderEmail: string;
  senderName: string;
  adminNotificationEmails: string[];
  notifyOnOrderReceived: boolean;
  notifyOnPaymentConfirmed: boolean;
  notifyOnPaymentRejected: boolean;
  notifyAdminOnOrder: boolean;
  notifyAdminOnEnquiry: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface EmailLogEntry {
  id: string;
  toEmail: string;
  subject: string;
  templateType: "order_received" | "payment_confirmed" | "payment_rejected" | "admin_order_alert" | "admin_enquiry_alert" | "test_email" | string;
  status: "sent" | "failed" | "disabled";
  errorMessage?: string | null;
  createdAt: string;
}
