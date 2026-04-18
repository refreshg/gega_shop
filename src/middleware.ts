import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "auth_session";

function getSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET?.trim();
  const raw = s && s.length >= 16 ? s : "dev-only-change-AUTH_SECRET-min-16-chars";
  return new TextEncoder().encode(raw);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = String(payload.userId ?? "");
    const name = String(payload.name ?? "");
    if (!userId || !name) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
