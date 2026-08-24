import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { signToken, verifyToken, type SessionClaims } from "./jwt";

export const COOKIE_NAME = "pikol_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function createSession(claims: SessionClaims): Promise<void> {
  const token = await signToken(claims);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionClaims(): Promise<SessionClaims | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Load the full authenticated user (with role). Cached per request. */
export const getCurrentUser = cache(async () => {
  const claims = await getSessionClaims();
  if (!claims) return null;
  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    include: { role: true },
  });
  if (!user || !user.isActive) return null;
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
