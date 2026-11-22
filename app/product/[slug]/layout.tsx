import type { Metadata } from "next";
import { getDbProductBySlug } from "@/lib/server/db";

export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const product = await getDbProductBySlug(params.slug);
    if (!product) {
      return {
        title: "Product Not Found | Unitech CCTV",
        description: "The requested security surveillance product could not be found.",
      };
    }

    const title = `${product.name} (${product.modelCode}) | Unitech CCTV India`;
    const description = `${product.name} - ${product.categoryLabel}. Direct factory wholesale pricing, ISO 9001:2015 & GeM Certified.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://unitechcctv.com/product/${product.slug}`,
        images: product.imageUrl ? [{ url: product.imageUrl }] : undefined,
      },
    };
  } catch (err) {
    return {
      title: "Security Surveillance Products | Unitech CCTV",
      description: "Direct factory pricing for high-definition security surveillance hardware.",
    };
  }
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
