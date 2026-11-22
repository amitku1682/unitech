import { NextResponse } from "next/server";
import { incrementFlashSaleViews } from "@/lib/server/flashSaleStore";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await props.params;
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }
    const views = await incrementFlashSaleViews(id);
    return NextResponse.json({ success: true, viewsCount: views });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to increment views" },
      { status: 500 }
    );
  }
}
