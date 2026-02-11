import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

const COOKIE_NAME = "septcode_admin_session";
const secret = new TextEncoder().encode(env.authSecret);

export async function setAdminSession(adminId: string) {
  const token = await new SignJWT({ adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
}

export function clearAdminSession() {
  cookies().delete(COOKIE_NAME);
}

export async function isAdminAuthenticated() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    const payload = await jwtVerify(token, secret);
    const adminId = String(payload.payload.adminId ?? "");
    return Boolean(adminId) && adminId === env.adminLoginId;
  } catch {
    return false;
  }
}
