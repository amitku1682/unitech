import { Product } from "@/lib/types";
import {
  getDbProducts,
  getDbProductBySlug,
  updateDbProduct,
  createDbProduct,
  deleteDbProduct,
} from "@/lib/server/db";

// DEPRECATED COMPATIBILITY WRAPPER: Routes queries directly to PostgreSQL
export async function getFileProducts(category?: string, search?: string): Promise<Product[]> {
  try {
    return await getDbProducts(category, search);
  } catch (error) {
    console.error("[productsStore -> PostgreSQL] Error fetching products:", error);
    return [];
  }
}

export async function getFileProductBySlug(slug: string): Promise<Product | null> {
  try {
    return await getDbProductBySlug(slug);
  } catch (error) {
    console.error("[productsStore -> PostgreSQL] Error fetching product by slug:", error);
    return null;
  }
}

export async function updateFileProduct(
  id: string,
  updates: Partial<Product>
): Promise<Product | null> {
  try {
    return await updateDbProduct(id, updates);
  } catch (error) {
    console.error("[productsStore -> PostgreSQL] Error updating product:", error);
    return null;
  }
}

export async function addFileProduct(product: Product): Promise<Product> {
  try {
    return await createDbProduct(product);
  } catch (error) {
    console.error("[productsStore -> PostgreSQL] Error adding product:", error);
    throw error;
  }
}

export async function deleteFileProduct(id: string): Promise<boolean> {
  try {
    return await deleteDbProduct(id);
  } catch (error) {
    console.error("[productsStore -> PostgreSQL] Error deleting product:", error);
    return false;
  }
}
