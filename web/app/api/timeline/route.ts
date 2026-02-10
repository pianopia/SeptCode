import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getTimelinePage } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tabParam = searchParams.get("tab");
  const pageParam = Number(searchParams.get("page") ?? "1");
  const tab = tabParam === "following" ? "following" : "for-you";
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const userId = await getSessionUserId();
  const result = await getTimelinePage({
    tab,
    userId,
    page,
    limit: 20
  });

  return NextResponse.json(result);
}
