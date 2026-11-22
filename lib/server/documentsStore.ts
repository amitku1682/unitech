import { LiveDocumentAsset } from "@/lib/types";
import {
  getDbDocuments,
  createDbDocument,
  updateDbDocument,
  deleteDbDocument,
} from "@/lib/server/db";

// DEPRECATED COMPATIBILITY WRAPPER: Routes queries directly to PostgreSQL
export async function getFileDocuments(category?: string): Promise<LiveDocumentAsset[]> {
  try {
    return await getDbDocuments(category);
  } catch (error) {
    console.error("[documentsStore -> PostgreSQL] Error reading documents:", error);
    return [];
  }
}

export async function saveFileDocuments(docs: LiveDocumentAsset[]): Promise<boolean> {
  try {
    for (const d of docs) {
      await createDbDocument(d);
    }
    return true;
  } catch (error) {
    console.error("[documentsStore -> PostgreSQL] Error saving documents:", error);
    return false;
  }
}

export async function addFileDocument(doc: LiveDocumentAsset): Promise<LiveDocumentAsset> {
  try {
    return await createDbDocument(doc);
  } catch (error) {
    console.error("[documentsStore -> PostgreSQL] Error adding document:", error);
    throw error;
  }
}

export async function updateFileDocument(
  id: string,
  updates: Partial<LiveDocumentAsset>
): Promise<LiveDocumentAsset | null> {
  try {
    return await updateDbDocument(id, updates);
  } catch (error) {
    console.error("[documentsStore -> PostgreSQL] Error updating document:", error);
    return null;
  }
}

export async function deleteFileDocument(id: string): Promise<boolean> {
  try {
    return await deleteDbDocument(id);
  } catch (error) {
    console.error("[documentsStore -> PostgreSQL] Error deleting document:", error);
    return false;
  }
}
