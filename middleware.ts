import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = ["/login", "/register", "/api/auth", "/api/uploadthing"]
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  )

  if (isPublicPath) {
    return NextResponse.next()
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get("better-auth.session_token")

  // If no session and trying to access protected route, redirect to login
  if (!sessionCookie && pathname !== "/") {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If no session and on root, redirect to login
  if (!sessionCookie && pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/uploadthing).*)",
  ],
}
