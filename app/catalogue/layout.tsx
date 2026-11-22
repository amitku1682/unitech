import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Master Surveillance Equipment Catalogue | Unitech CCTV",
  description:
    "Browse 4K/4MP IP Cameras, Warm Light HD Analog Cameras, PoE NVRs, Hybrid DVRs, CCTV Cables, Power Supplies & Server Racks. Factory-direct wholesale pricing.",
  openGraph: {
    title: "Master Surveillance Equipment Catalogue | Unitech CCTV",
    description:
      "Browse 4K/4MP IP Cameras, Warm Light HD Analog Cameras, PoE NVRs, Hybrid DVRs, CCTV Cables, Power Supplies & Server Racks.",
    url: "https://unitechcctv.com/catalogue",
  },
};

export default function CatalogueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
