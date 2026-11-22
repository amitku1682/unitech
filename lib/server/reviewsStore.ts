import { GoogleReview } from "@/lib/types";
import {
  getDbReviews,
  createDbReview,
  updateDbReview,
  deleteDbReview,
} from "@/lib/server/db";

// DEPRECATED COMPATIBILITY WRAPPER: Routes queries directly to PostgreSQL
export async function getFileReviews(): Promise<GoogleReview[]> {
  try {
    return await getDbReviews();
  } catch (error) {
    console.error("[reviewsStore -> PostgreSQL] Error reading reviews:", error);
    return [];
  }
}

export async function saveFileReviews(reviews: GoogleReview[]): Promise<boolean> {
  try {
    for (const r of reviews) {
      await createDbReview(r);
    }
    return true;
  } catch (error) {
    console.error("[reviewsStore -> PostgreSQL] Error saving reviews:", error);
    return false;
  }
}

export async function addFileReview(review: GoogleReview): Promise<GoogleReview> {
  try {
    return await createDbReview(review);
  } catch (error) {
    console.error("[reviewsStore -> PostgreSQL] Error adding review:", error);
    throw error;
  }
}

export async function updateFileReview(
  id: string,
  updates: Partial<GoogleReview>
): Promise<GoogleReview | null> {
  try {
    return await updateDbReview(id, updates);
  } catch (error) {
    console.error("[reviewsStore -> PostgreSQL] Error updating review:", error);
    return null;
  }
}

export async function deleteFileReview(id: string): Promise<boolean> {
  try {
    return await deleteDbReview(id);
  } catch (error) {
    console.error("[reviewsStore -> PostgreSQL] Error deleting review:", error);
    return false;
  }
}
