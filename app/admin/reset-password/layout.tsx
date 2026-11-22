import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Admin Password | Unitech Security Systems",
  robots: {
    index: false,
    follow: false,
  },
  referrer: "no-referrer",
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
