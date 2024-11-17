import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

export async function middleware(request: NextRequest) {
  console.log("Middleware running for path:", request.nextUrl.pathname);

  // 需要保护的路由
  const protectedPaths = ["/dashboard"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath) {
    const token = request.cookies.get("token");
    console.log("Token found:", !!token);

    if (!token) {
      console.log("No token, redirecting to login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || "secret"
      );
      await jose.jwtVerify(token.value, secret);
      console.log("Token verified successfully");
      return NextResponse.next();
    } catch (error) {
      console.log("Token verification failed:", error);
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
