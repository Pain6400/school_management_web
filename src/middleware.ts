import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define role-to-path mappings
const roleRoutes: Record<string, string[]> = {
  SUPER_ADMIN: ["/admin", "/school", "/teacher"],
  ADMIN: ["/admin", "/school", "/teacher"],
  SCHOOL_ADMIN: ["/school", "/teacher"],
  DIRECTOR: ["/school", "/teacher"],
  TEACHER: ["/teacher"],
  STUDENT: ["/student"],
  PARENT: ["/student"],
};

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const path = request.nextUrl.pathname;

  // Allow public routes
  if (path === "/login" || path === "/" || path.startsWith("/api") || path.startsWith("/_next")) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Decode JWT payload (without verification)
    const payloadBase64 = token.split(".")[1];
    const decoded = JSON.parse(atob(payloadBase64));
    const roles: string[] = decoded.roles || [];

    // Check if user has permission for the requested path
    let hasAccess = false;
    
    // Si la ruta no está protegida por rol (pero requiere estar logeado)
    if (!path.startsWith("/admin") && !path.startsWith("/school") && !path.startsWith("/teacher") && !path.startsWith("/student")) {
        hasAccess = true;
    } else {
        // Verificar contra los prefijos
        for (const role of roles) {
            const allowedPrefixes = roleRoutes[role] || [];
            if (allowedPrefixes.some(prefix => path.startsWith(prefix))) {
                hasAccess = true;
                break;
            }
        }
    }

    if (!hasAccess) {
      // Si no tiene acceso, redirigir a su dashboard principal
      let defaultPath = "/login";
      if (roles.includes("SUPER_ADMIN") || roles.includes("ADMIN")) defaultPath = "/admin";
      else if (roles.includes("SCHOOL_ADMIN") || roles.includes("DIRECTOR")) defaultPath = "/school";
      else if (roles.includes("TEACHER")) defaultPath = "/teacher";
      else if (roles.includes("STUDENT") || roles.includes("PARENT")) defaultPath = "/student";

      return NextResponse.redirect(new URL(defaultPath, request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Error decoding token in middleware:", error);
    // Si el token es inválido, limpiar cookie y redirigir
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("token");
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};