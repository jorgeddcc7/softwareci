import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

const EN_PREFIX = "/en";

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // 1. Detectar el locale según el pathname
  const locale: "es" | "en" = pathname.startsWith(EN_PREFIX) ? "en" : "es";

  // 2. Rutas que nunca deben redirigirse por idioma
  const isApiRoute = pathname.startsWith("/api/");
  const isStaticRoute =
    pathname.startsWith("/_next/") || pathname.includes(".");
  const isAuthRoute = pathname.startsWith("/auth/");

  // 3. Auto-redirect en la home para usuarios ingleses (solo primera visita)
  const hasLocaleCookie = request.cookies.get("locale")?.value;
  const acceptLang = request.headers.get("accept-language") || "";
  const prefersEnglish = acceptLang.toLowerCase().startsWith("en");

  if (
    !isApiRoute &&
    !isStaticRoute &&
    !isAuthRoute &&
    pathname === "/" &&
    !hasLocaleCookie &&
    prefersEnglish
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/en";
    return NextResponse.redirect(url);
  }

  // 4. Poner la cabecera x-locale para que el layout la lea
  response.headers.set("x-locale", locale);

  // 5. Guardar el locale en cookie para no volver a redirigir en el futuro
  if (!hasLocaleCookie) {
    response.cookies.set("locale", locale, {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      path: "/",
    });
  }

  // 6. Si la autenticación está desactivada, dejamos pasar todo
  if (process.env.NEXT_PUBLIC_AUTH_ENABLED !== "true") {
    return response;
  }

  // 7. Rutas públicas (no requieren autenticación)
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
    "/blog",
    "/auth/callback",
    // Rutas en inglés
    EN_PREFIX,
    `${EN_PREFIX}/pricing`,
    `${EN_PREFIX}/security`,
  ];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isPublicRoute || isApiRoute || isStaticRoute) {
    return response;
  }

  // 8. Si no hay usuario, redirigir a login
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