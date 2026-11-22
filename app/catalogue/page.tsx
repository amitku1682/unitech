import { Suspense } from "react";
import { getDbCategories, getDbProducts } from "@/lib/server/db";
import { CatalogueContent } from "@/components/store/CatalogueContent";
import { Category, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CataloguePage() {
  let initialCategories: Category[] = [];
  let initialProducts: Product[] = [];
  try {
    initialCategories = (await getDbCategories({ activeOnly: true, includeSeries: true })) as Category[];
    initialProducts = await getDbProducts();
  } catch (err) {
    // Graceful fallback during container build or offline DB
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
        </div>
      }
    >
      <CatalogueContent initialCategories={initialCategories} initialProducts={initialProducts} />
    </Suspense>
  );
}
