import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

export type SessionPayload = {
  userId: string;
  name: string;
  role: string;
};

const COOKIE = "auth_session";

function getSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET?.trim();
  const raw = s && s.length >= 16 ? s : "dev-only-change-AUTH_SECRET-min-16-chars";
  return new TextEncoder().encode(raw);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = String(payload.userId ?? "");
    const name = String(payload.name ?? "");
    const role = String(payload.role ?? "staff");
    if (!userId || !name) return null;
    return { userId, name, role };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export { COOKIE as SESSION_COOKIE_NAME };
