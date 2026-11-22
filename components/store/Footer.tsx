"use client";

import React from "react";
import Link from "next/link";
import { UnitechLogo } from "@/components/brand/UnitechLogo";
import { Shield, Phone, Mail, MapPin, ExternalLink, MessageCircle, Facebook, Instagram, Linkedin, Youtube, Globe } from "lucide-react";
import { useSocialLinks } from "@/lib/hooks/useSocialLinks";

export function Footer() {
  const { links: socialLinks } = useSocialLinks();
  const [footerCategories, setFooterCategories] = React.useState<Array<{ id: string; name: string }>>([]);

  React.useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setFooterCategories(json.data.filter((c: any) => c.showInFooter !== false));
        }
      })
      .catch(() => {});
  }, []);

  const renderSocialIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "instagram":
        return <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "youtube":
        return <Youtube className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "linkedin":
        return <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "x":
        return (
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        );
      case "whatsapp":
        return <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />;
      case "google_business":
        return <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />;
      default:
        return <Globe className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };
  return (
    <footer className="bg-slate-950 text-white border-t border-slate-800">
      {/* Main Footer Links & Info - Full Width Edge-to-Edge Container */}
      <div className="w-full px-5 sm:px-6 lg:px-8 xl:px-10 py-14 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-8 xl:gap-12 2xl:gap-16">
          
          {/* Column 1: Brand & Direct Plant Headquarters (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-4 max-w-md">
            {/* Authentic Unitech Brand Logo */}
            <Link href="/" className="inline-flex flex-col items-start group">
              <UnitechLogo theme="dark" heightClass="h-16 sm:h-20" />
            </Link>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
              26+ Years of Trust: Unitech Security Systems Pvt. Ltd. is a leading Indian manufacturer
              of Cat6 &amp; 3+1 cables, PoE switches, power supplies, and metal racks, alongside in-house
              CCTV assembly and security accessories—serving 5,000+ dealers and government projects
              nationwide.
            </p>

            <div className="pt-2 text-xs sm:text-[13px] text-slate-300 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-unitech-red shrink-0 mt-0.5" />
                <span className="leading-snug">
                  Site 2, Ajanta Compound, Plot no. 3/8 Industrial Area, Loni Rd, Mohan Nagar, Sahibabad, Ghaziabad, UP 201007
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-unitech-red shrink-0" />
                <div className="font-medium">
                  <a href="tel:18008899371" className="hover:text-white transition-colors">
                    1800 8899 371
                  </a>
                  <span className="text-slate-500 mx-1.5">/</span>
                  <a href="tel:+918700317239" className="hover:text-white transition-colors">
                    (+91) 87003 17239
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-unitech-red shrink-0" />
                <div className="font-medium break-words">
                  <a href="mailto:sales@unitechcctv.com" className="hover:text-white transition-colors">
                    sales@unitechcctv.com
                  </a>
                  <span className="text-slate-500 mx-1.5">/</span>
                  <a href="mailto:info@unitechcctv.com" className="hover:text-white transition-colors">
                    info@unitechcctv.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: About */}
          <div>
            <h4 className="font-heading font-black text-xs uppercase text-white tracking-wider mb-4 sm:mb-5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-unitech-red" />
              <span>About</span>
            </h4>
            <ul className="space-y-3 text-xs sm:text-[13px] text-slate-400">
              <li>
                <Link href="/about#overview" className="hover:text-white transition-colors">
                  Company Overview
                </Link>
              </li>
              <li>
                <Link href="/about#leadership" className="hover:text-white transition-colors">
                  Board of Directors
                </Link>
              </li>
              <li>
                <Link href="/about#factory-infra" className="hover:text-white transition-colors">
                  Sahibabad Plant
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Categories */}
          <div>
            <h4 className="font-heading font-black text-xs uppercase text-white tracking-wider mb-4 sm:mb-5">
              Categories
            </h4>
            <ul className="space-y-3 text-xs sm:text-[13px] text-slate-400">
              {footerCategories.length > 0 ? (
                footerCategories.map((c) => (
                  <li key={c.id}>
                    <Link href={`/catalogue?category=${encodeURIComponent(c.id)}`} className="hover:text-white transition-colors">
                      {c.name}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link href="/catalogue?category=cctv-cameras" className="hover:text-white transition-colors">
                      CCTV Cameras
                    </Link>
                  </li>
                  <li>
                    <Link href="/catalogue?category=dvr-nvr" className="hover:text-white transition-colors">
                      DVR &amp; NVR Recorders
                    </Link>
                  </li>
                  <li>
                    <Link href="/catalogue?category=networking-poe" className="hover:text-white transition-colors">
                      Networking &amp; PoE
                    </Link>
                  </li>
                  <li>
                    <Link href="/catalogue?category=cables" className="hover:text-white transition-colors">
                      Surveillance Cables
                    </Link>
                  </li>
                  <li>
                    <Link href="/catalogue?category=network-racks" className="hover:text-white transition-colors">
                      DVR &amp; Server Racks
                    </Link>
                  </li>
                  <li>
                    <Link href="/catalogue?category=power-accessories" className="hover:text-white transition-colors">
                      Power Supplies &amp; SMPS
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Column 4 & 5 Group (Catalogues, Contact & Support, and Social Media Icons in empty space) */}
          <div className="md:col-span-2 lg:col-span-2 flex flex-col justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-8 xl:gap-12 2xl:gap-16">
              {/* Column 4: Catalogues */}
              <div>
                <h4 className="font-heading font-black text-xs uppercase text-white tracking-wider mb-4 sm:mb-5">
                  Catalogues
                </h4>
                <ul className="space-y-3 text-xs sm:text-[13px] text-slate-400">
                  <li>
                    <Link href="/kit-builder" className="hover:text-white transition-colors text-amber-400 font-bold">
                      60-Sec CCTV Kit Builder
                    </Link>
                  </li>
                  <li>
                    <Link href="/support" className="hover:text-white transition-colors">
                      2026 Master PDF Catalogue
                    </Link>
                  </li>
                  <li>
                    <Link href="/support" className="hover:text-white transition-colors">
                      VMS Software (Windows)
                    </Link>
                  </li>
                  <li>
                    <Link href="/support" className="hover:text-white transition-colors">
                      Smart IP Search Utility
                    </Link>
                  </li>
                  <li>
                    <Link href="/support" className="hover:text-white transition-colors">
                      DVR Firmware Updates
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 5: Contact & Support */}
              <div>
                <h4 className="font-heading font-black text-xs uppercase text-white tracking-wider mb-4 sm:mb-5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Contact & Support</span>
                </h4>
                <ul className="space-y-3 text-xs sm:text-[13px] text-slate-400">
                  <li>
                    <Link href="/contact" className="hover:text-white transition-colors text-white font-bold">
                      Contact Factory Desk
                    </Link>
                  </li>
                  <li>
                    <Link href="/inquiry?type=DISTRIBUTOR" className="hover:text-white transition-colors text-emerald-400 font-bold">
                      Apply for Dealership
                    </Link>
                  </li>
                  <li>
                    <Link href="/dealers" className="hover:text-white transition-colors">
                      Find Nearest Dealer
                    </Link>
                  </li>
                  <li>
                    <Link href="/inquiry?type=GEM_TENDER" className="hover:text-white transition-colors">
                      GeM Tender Supply Desk
                    </Link>
                  </li>
                  <li>
                    <Link href="/inquiry?type=SERVICE_WARRANTY" className="hover:text-white transition-colors">
                      Warranty & RMA Center
                    </Link>
                  </li>
                  <li>
                    <a
                      href={`https://wa.me/919911961407?text=${encodeURIComponent(
                        `🛠️ *UNITECH TECHNICAL & RMA SUPPORT DESK*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n• Device Model:\n• Issue / Technical Query:\n\nHi Unitech Engineers, please assist me with technical support.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-slate-300 font-medium"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>WhatsApp Tech Desk</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Social Media Icons directly below Catalogues & Contact & Support in that empty space */}
            <div className="pt-6 sm:pt-8 flex flex-wrap items-center gap-5 sm:gap-6 text-slate-400">
              {socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${link.label || link.platform} — Unitech`}
                  className="hover:text-white transition-colors"
                >
                  {renderSocialIcon(link.platform)}
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Strip with Discrete Admin Link */}
        <div className="border-t border-slate-900 mt-14 sm:mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-400">
          <div>
            © {new Date().getFullYear()} Unitech Security Systems Pvt. Ltd. All rights reserved.
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <Link href="/about" className="hover:text-white transition-colors">
              About Us
            </Link>
            <span>·</span>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
            <span>·</span>
            <span>GST Registered</span>
            <span>·</span>
            <span>Make In India</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
