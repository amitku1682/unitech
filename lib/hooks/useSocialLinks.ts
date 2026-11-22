"use client";

import { useState, useEffect } from "react";

export interface SocialLinkItem {
  id: string;
  platform: string;
  label: string | null;
  url: string;
  position: number;
}

const DEFAULT_LINKS: SocialLinkItem[] = [
  { id: "soc-facebook", platform: "facebook", label: "Facebook", url: "https://facebook.com/unitechcctv", position: 1 },
  { id: "soc-instagram", platform: "instagram", label: "Instagram", url: "https://instagram.com/unitechcctv", position: 2 },
  { id: "soc-youtube", platform: "youtube", label: "YouTube", url: "https://youtube.com/@unitechcctv", position: 3 },
  { id: "soc-linkedin", platform: "linkedin", label: "LinkedIn", url: "https://linkedin.com/company/unitech-security-systems", position: 4 },
  { id: "soc-x", platform: "x", label: "X (Twitter)", url: "https://x.com/unitechcctv", position: 5 },
  { id: "soc-whatsapp", platform: "whatsapp", label: "WhatsApp Support", url: "https://wa.me/918700317239", position: 6 },
  { id: "soc-google-business", platform: "google_business", label: "Google Business Profile", url: "https://maps.google.com/maps?cid=3536483869333144352", position: 7 },
];

export function useSocialLinks() {
  const [links, setLinks] = useState<SocialLinkItem[]>(DEFAULT_LINKS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/social-links")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.links) && data.links.length > 0) {
          setLinks(data.links);
        }
      })
      .catch((err) => console.error("useSocialLinks error:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const getLink = (platform: string) => links.find((l) => l.platform === platform);

  return { links, getLink, isLoading };
}
