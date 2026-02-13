import { NextRequest, NextResponse } from "next/server";
import { createAutomatedOfficialPost } from "@/lib/official-post";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const secret = env.officialPostCronSecret;
  if (!secret) return false;

  const headerSecret = request.headers.get("x-cron-secret");
  if (headerSecret && headerSecret === secret) return true;

  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return false;
  return auth.slice("Bearer ".length).trim() === secret;
}

async function runCron(request: NextRequest) {
  if (!env.officialPostCronSecret) {
    return NextResponse.json(
      { error: "cron_secret_not_configured", message: "OFFICIAL_POST_CRON_SECRET is required." },
      { status: 503 }
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const force = request.nextUrl.searchParams.get("force") === "1";

  try {
    const result = await createAutomatedOfficialPost({ source: "cron", force });
    return NextResponse.json({
      ok: true,
      ...result
    });
  } catch {
    return NextResponse.json({ ok: false, error: "failed_to_create_official_post" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return runCron(request);
}

export async function POST(request: NextRequest) {
  return runCron(request);
}
