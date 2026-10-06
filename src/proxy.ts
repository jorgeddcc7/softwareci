import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  // Si la autenticación está desactivada, dejamos pasar todo
  if (process.env.NEXT_PUBLIC_AUTH_ENABLED !== "true") {
    return response;
  }

  const { pathname } = request.nextUrl;

  // Rutas públicas (no requieren autenticación)
  const publicRoutes = [
    "/",
    "/login",
    "/signup",
    "/recuperar",
    "/precios",
    "/por-que",
    "/faq",
    "/aviso-legal",
    "/privacidad",
    "/seguridad",
    "/terminos",
    "/auth/callback",
  ];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // API routes y archivos estáticos
  const isApiRoute = pathname.startsWith("/api/");
  const isStaticRoute =
    pathname.startsWith("/_next/") || pathname.includes(".");

  if (isPublicRoute || isApiRoute || isStaticRoute) {
    return response;
  }

  // Si no hay usuario, redirigir a login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};