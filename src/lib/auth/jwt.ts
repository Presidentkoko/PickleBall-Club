import { SignJWT, jwtVerify } from "jose";

/** Claims stored inside the session JWT. Kept small — full user is loaded from DB. */
export type SessionClaims = {
  sub: string; // user id
  email: string;
  role: string; // role name (e.g. "ADMIN")
  name: string; // display name
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signToken(claims: SessionClaims): Promise<string> {
  return new SignJWT({ email: claims.email, role: claims.role, name: claims.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || "7d")
    .sign(getSecret());
}

/** Verify a token. Returns null on any failure (expired, tampered, missing). */
export async function verifyToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      role: String(payload.role ?? ""),
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}
