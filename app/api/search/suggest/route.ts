import { NextRequest, NextResponse } from "next/server";
import { getDbProducts, getDbCategories } from "@/lib/server/db";
import { Product, Category } from "@/lib/types";

export const dynamic = "force-dynamic";

function normalizeStr(str: string): string {
  return str.toLowerCase().replace(/[\s\-_.,\/]+/g, "");
}

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  "cctv-cameras": "/images/products/cat-cctv.png",
  "dvr-nvr": "/images/products/cat-dvr.png",
  "networking-poe": "/images/products/cat-poe.png",
  cables: "/images/products/cat-cables.png",
  "network-racks": "/images/products/cat-racks.png",
  "power-accessories": "/images/products/cat-smps.png",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = (searchParams.get("q") || "").trim();

    if (!rawQuery) {
      return NextResponse.json({
        success: true,
        products: [],
        categories: [],
        series: [],
        documents: [],
        total: 0,
      });
    }

    // 1. Fetch live products and categories from DB
    let allProducts: Product[] = [];
    let allCategories: Category[] = [];
    try {
      allProducts = await getDbProducts();
    } catch {
      allProducts = [];
    }
    try {
      allCategories = await getDbCategories({ activeOnly: true });
    } catch {
      allCategories = [];
    }

    const qLower = rawQuery.toLowerCase();
    const qClean = normalizeStr(rawQuery);
    const queryTokens = qLower.split(/[\s]+/).filter(Boolean);

    // 2. Filter & Rank Products
    const matchedProducts: Array<{
      product: Product;
      score: number;
      isExactModel: boolean;
    }> = [];

    for (const p of allProducts) {
      const name = p.name || "";
      const model = p.modelCode || "";
      const cat = p.category || "";
      const catLabel = p.categoryLabel || "";
      const catObj = allCategories.find((c) => c.id === p.category);
      const catFullName = catObj ? catObj.name : "";
      const catDesc = catObj ? catObj.description : "";
      const specsStr = p.specs ? Object.values(p.specs).join(" ") : "";
      const highlightsStr = Array.isArray(p.highlights) ? p.highlights.join(" ") : "";
      const combined = `${name} ${model} ${cat} ${catLabel} ${catFullName} ${catDesc} ${specsStr} ${highlightsStr}`.toLowerCase();
      const combinedClean = normalizeStr(combined);

      // Check if every query token matches (with support for hyphen-free and sub-words)
      const allTokensMatch =
        queryTokens.length > 0 &&
        queryTokens.every((token) => {
          if (combined.includes(token)) return true;
          const tokenClean = normalizeStr(token);
          if (tokenClean.length >= 2 && combinedClean.includes(tokenClean)) return true;
          const subWords = token.split(/[\-_]+/).filter(Boolean);
          if (subWords.length > 1) {
            return subWords.every(
              (sub) => combined.includes(sub) || combinedClean.includes(normalizeStr(sub))
            );
          }
          return false;
        });

      const cleanMatch = combinedClean.includes(qClean);

      if (!allTokensMatch && !cleanMatch) continue;

      const modelClean = normalizeStr(model);
      const isExactModel = modelClean === qClean || model.toLowerCase() === qLower;

      let score = 0;
      if (isExactModel) {
        score = 1000;
      } else if (modelClean.startsWith(qClean)) {
        score = 800;
      } else if (normalizeStr(name).startsWith(qClean)) {
        score = 600;
      } else if (name.toLowerCase().includes(qLower) || normalizeStr(name).includes(qClean)) {
        score = 400;
      } else {
        score = 200;
      }

      if (p.isBestseller) score += 50;

      matchedProducts.push({
        product: p,
        score,
        isExactModel,
      });
    }

    // Sort products by score DESC, then name ASC
    matchedProducts.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.product.name.localeCompare(b.product.name);
    });

    const totalProductMatches = matchedProducts.length;
    const topProducts = matchedProducts.slice(0, 6).map((m) => {
      const p = m.product;
      return {
        id: p.id,
        name: p.name,
        modelCode: p.modelCode,
        category: p.category,
        categoryLabel: p.categoryLabel,
        slug: p.slug,
        price: p.price,
        stockQuantity: p.stockQuantity ?? 100,
        imageUrl: p.imageUrl || "/images/products/utipbcp-4101.png",
        datasheetPdfUrl: p.datasheetPdfUrl || "/downloads/unitech-2026-master-catalog.pdf",
        isExactModel: m.isExactModel,
        isBestseller: p.isBestseller,
      };
    });

    // 3. Match Categories
    const matchedCategories = allCategories.filter((c) => {
      const name = c.name.toLowerCase();
      const desc = (c.description || "").toLowerCase();
      const id = c.id.toLowerCase();
      const catCombined = `${name} ${desc} ${id}`;
      const catClean = normalizeStr(catCombined);

      if (
        catCombined.includes(qLower) ||
        catClean.includes(qClean) ||
        name.includes(qLower) ||
        desc.includes(qLower) ||
        normalizeStr(name).includes(qClean) ||
        normalizeStr(id).includes(qClean)
      ) {
        return true;
      }

      // Match significant query tokens (e.g. "smps", "camera", "dvr", "cable", "rack", "poe")
      return queryTokens.some((token) => {
        if (token.length < 3) return false;
        const tClean = normalizeStr(token);
        return (
          name.includes(token) ||
          id.includes(token) ||
          catClean.includes(tClean) ||
          token.split(/[\-_]+/).some((sub) => sub.length >= 3 && catClean.includes(normalizeStr(sub)))
        );
      });
    }).map((c) => {
      const count = allProducts.filter((p) => p.category === c.id).length;
      return {
        id: c.id,
        name: c.name,
        count: count > 0 ? count : (c.productCount ?? 0),
        imageUrl: c.coverImageUrl || c.image || CATEGORY_IMAGE_MAP[c.id] || `/images/products/cat-${c.id}.png`,
        linkUrl: `/catalogue?category=${c.id}`,
      };
    });

    // 4. Match Series
    const seriesSet = new Set<string>();
    for (const p of allProducts) {
      if (p.categoryLabel) {
        const lbl = p.categoryLabel;
        if (
          lbl.toLowerCase().includes(qLower) ||
          normalizeStr(lbl).includes(qClean)
        ) {
          seriesSet.add(lbl);
        }
      }
    }
    const matchedSeries = Array.from(seriesSet).slice(0, 4).map((s) => ({
      name: s,
      linkUrl: `/catalogue?search=${encodeURIComponent(s)}`,
    }));

    // 5. Match Documents (Datasheets)
    const matchedDocuments: Array<{
      model: string;
      productName: string;
      fileUrl: string;
    }> = [];
    const seenDocs = new Set<string>();

    for (const p of allProducts) {
      if (p.datasheetPdfUrl) {
        const matchesQuery =
          p.name.toLowerCase().includes(qLower) ||
          p.modelCode.toLowerCase().includes(qLower) ||
          normalizeStr(p.modelCode).includes(qClean) ||
          normalizeStr(p.name).includes(qClean);

        if (matchesQuery && !seenDocs.has(p.datasheetPdfUrl)) {
          seenDocs.add(p.datasheetPdfUrl);
          matchedDocuments.push({
            model: p.modelCode,
            productName: p.name,
            fileUrl: p.datasheetPdfUrl,
          });
          if (matchedDocuments.length >= 3) break;
        }
      }
    }

    const total =
      totalProductMatches +
      matchedCategories.length +
      matchedSeries.length +
      matchedDocuments.length;

    return NextResponse.json({
      success: true,
      products: topProducts,
      totalProductMatches,
      categories: matchedCategories,
      series: matchedSeries,
      documents: matchedDocuments,
      total,
    });
  } catch (error: any) {
    console.error("[API GET /api/search/suggest] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate search suggestions." }, { status: 500 });
  }
}
