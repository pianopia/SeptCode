import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";

const secret = new TextEncoder().encode(env.authSecret);

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createAccessToken(userId: number) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secret);
}

export async function verifyAccessToken(token: string) {
  const payload = await jwtVerify(token, secret);
  const userId = Number(payload.payload.userId);
  if (!Number.isFinite(userId)) {
    throw new Error("Invalid token payload");
  }
  return userId;
}
