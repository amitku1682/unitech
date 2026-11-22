import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import FlashSalePopup from "@/components/store/FlashSalePopup";
import { getPublicSocialLinks } from "@/lib/server/db";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Unitech CCTV — India's Premier Security Surveillance Manufacturer",
  description:
    "Official website of Unitech Security Systems Pvt. Ltd. Manufacturer of 4MP/4K Warm Light CCTV Cameras, H.265+ Hybrid DVRs, PoE NVRs, Pure Copper 3+1 Cables & Server Racks. ISO 9001:2015 & GeM Certified.",
  keywords: [
    "Unitech CCTV",
    "CCTV manufacturer India",
    "4MP Warm Light Camera",
    "CCTV cables manufacturer Ghaziabad",
    "H.265 DVR 32 channel",
    "PoE NVR",
    "GeM CCTV supplier",
    "Make in India CCTV",
  ],
  authors: [{ name: "Unitech Security Systems Pvt. Ltd." }],
  openGraph: {
    title: "Unitech CCTV — India's Premier Security Surveillance Manufacturer",
    description:
      "Direct factory pricing, B2B distributor margins, and GST invoicing for 4K Cameras, DVRs, NVRs & Pure Copper Cables.",
    url: "https://unitechcctv.com",
    siteName: "Unitech CCTV",
    locale: "en_IN",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const socialLinks = await getPublicSocialLinks();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Unitech Security Systems Pvt. Ltd.",
    image: "https://unitechcctv.com/logo.png",
    telephone: "+91 93125 59847",
    url: "https://unitechcctv.com",
    sameAs: socialLinks.map((s) => s.url),
    address: {
      "@type": "PostalAddress",
      streetAddress:
        "Site 2, Ajanta Compound, Plot no. 3/8 Industrial Area, Loni Rd, Mohan Nagar, Sahibabad",
      addressLocality: "Ghaziabad",
      addressRegion: "Uttar Pradesh",
      postalCode: "201007",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "28.6983",
      longitude: "77.3712",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.2",
      reviewCount: "60",
      bestRating: "5",
      worstRating: "1",
    },
  };

  return (
    <html lang="en" className={`${plusJakarta.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased bg-[#faf9f5] text-slate-900 selection:bg-unitech-red selection:text-white">
        {children}
        <FlashSalePopup />
      </body>
    </html>
  );
}
