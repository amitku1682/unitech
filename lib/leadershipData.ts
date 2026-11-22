export interface LeadershipDirector {
  id: string;
  name: string;
  role: string;
  badge: string;
  since: string;
  bio: string;
  photoUrl: string;
  highlights: string[];
  quote: string;
}

export const DEFAULT_LEADERSHIP: LeadershipDirector[] = [
  {
    id: "director-1",
    name: "Managing Director & Founder",
    role: "Managing Director & Founder",
    badge: "Managing Director & Founder",
    since: "Since 2002",
    bio: "With over 22+ years of foundational leadership in electronic security and specialized industrial wire drawing, steered Unitech from its early Sahibabad plant commissioning into a nationally accredited CCTV brand trusted by municipal corporations, banks, and commercial integrators.",
    photoUrl: "",
    highlights: [
      "Pioneered 100% solid annealed copper cable manufacturing standards in UP",
      "Established pan-India distribution alliances across 28 states",
      "GeM Portal Government Procurement Strategy & OEM Licensing",
    ],
    quote: "Our vision since 2002 has remained uncompromised: to give Indian system integrators world-class surveillance hardware made with genuine copper, pure optics, and rock-solid reliability.",
  },
  {
    id: "director-2",
    name: "Technical Director & Co-Founder",
    role: "Technical Director & Head of Operations",
    badge: "Technical Director & Head of Operations",
    since: "Since 2002",
    bio: "Oversees manufacturing infrastructure at the Sahibabad plant, including automated SMT assembly lines, cleanroom optical calibration, and extreme 72-hour burn-in chambers. Leads engineering R&D for 4K H.265+ codecs and ultra-low light Warm Light sensor integration.",
    photoUrl: "",
    highlights: [
      "Direct supervision of Sahibabad automated SMT pick-and-place lines",
      "Zero-compromise QA burn-in protocols for industrial power supplies",
      "Designed proprietary thermal dissipation chassis for Unitech DVR/NVRs",
    ],
    quote: "True security equipment isn't built on paper specs; it's proven in 48°C Indian summers, continuous voltage spikes, and 24/7 non-stop surveillance uptime.",
  },
];
