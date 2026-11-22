import { CustomerEnquiry, EnquiryStatus } from "@/lib/types";
import {
  getDbEnquiries,
  createDbEnquiry,
  updateDbEnquiry,
  deleteDbEnquiry,
} from "@/lib/server/db";

// DEPRECATED COMPATIBILITY WRAPPER: Routes queries directly to PostgreSQL
export async function getFileEnquiries(
  status?: EnquiryStatus | "ALL",
  search?: string
): Promise<CustomerEnquiry[]> {
  try {
    let list = await getDbEnquiries();
    if (status && status !== "ALL") {
      list = list.filter((e) => e.status === status);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.fullName.toLowerCase().includes(q) ||
          e.phone.toLowerCase().includes(q) ||
          (e.email && e.email.toLowerCase().includes(q))
      );
    }
    return list;
  } catch (error) {
    console.error("[enquiriesStore -> PostgreSQL] Error reading enquiries:", error);
    return [];
  }
}

export async function addFileEnquiry(
  payload: Omit<CustomerEnquiry, "id" | "createdAt" | "status">
): Promise<CustomerEnquiry> {
  try {
    return await createDbEnquiry({
      ...payload,
      status: "NEW",
    });
  } catch (error) {
    console.error("[enquiriesStore -> PostgreSQL] Error creating enquiry:", error);
    throw error;
  }
}

export async function updateFileEnquiry(
  id: string,
  updates: Partial<CustomerEnquiry>
): Promise<CustomerEnquiry | null> {
  try {
    return await updateDbEnquiry(id, updates);
  } catch (error) {
    console.error("[enquiriesStore -> PostgreSQL] Error updating enquiry:", error);
    return null;
  }
}

export async function deleteFileEnquiry(id: string): Promise<boolean> {
  try {
    return await deleteDbEnquiry(id);
  } catch (error) {
    console.error("[enquiriesStore -> PostgreSQL] Error deleting enquiry:", error);
    return false;
  }
}
