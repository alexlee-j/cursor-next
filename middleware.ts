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

  // 只记录文章页面的访问
  if (request.nextUrl.pathname.startsWith("/posts/")) {
    try {
      await fetch(`${request.nextUrl.origin}/api/analytics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: request.nextUrl.pathname,
        }),
      });
    } catch (error) {
      console.error("Failed to record page view:", error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
