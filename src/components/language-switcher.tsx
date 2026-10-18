"use client";

import { usePathname, useRouter } from "next/navigation";

const ROUTE_MAP: Record<string, string> = {
  "/": "/en",
  "/en": "/",
  "/precios": "/en/pricing",
  "/en/pricing": "/precios",
  "/seguridad": "/en/security",
  "/en/security": "/seguridad",
};

function getSwitchTarget(pathname: string): { target: string; label: string } {
  // Coincidencia exacta
  if (ROUTE_MAP[pathname]) {
    const isEn = pathname === "/en" || pathname.startsWith("/en/");
    return {
      target: ROUTE_MAP[pathname],
      label: isEn ? "ES" : "EN",
    };
  }

  // Si estamos en una ruta /en/... sin mapear, volvemos a la home ES
  if (pathname.startsWith("/en/")) {
    return { target: "/", label: "ES" };
  }

  // Cualquier otra ruta: ir a la home EN
  return { target: "/en", label: "EN" };
}

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { target, label } = getSwitchTarget(pathname);
  const currentLang = label === "EN" ? "ES" : "EN";

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    // Guardar la preferencia para que el middleware no te redirija
    document.cookie = `locale=${label.toLowerCase()}; path=/; max-age=${
      60 * 60 * 24 * 365
    }; samesite=lax`;
    router.push(target);
  }

  return (
    <button
      onClick={handleClick}
      className="text-sm text-muted hover:text-foreground transition-colors"
      aria-label={`Cambiar a ${label === "EN" ? "inglés" : "español"}`}
    >
      <span className="font-semibold text-foreground">{currentLang}</span>
      <span className="mx-1 text-border">·</span>
      <span>{label}</span>
    </button>
  );
}