import { redirect } from "next/navigation";

export default function AdminFlashSaleRedirect() {
  redirect("/admin?tab=FLASH_SALE");
}
