import Link from "next/link";
import { AuthStatus } from "@/app/components/auth-status";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NavTools } from "./nav-tools";

export function Header() {
  return (
    <header className="border-b border-border bg-surface flex flex-col shadow-sm">
      {/* Fila 1: Logo, Enlaces generales y Cuenta */}
      <div className="max-w-6xl mx-auto w-full px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5">
          <img
            src="/logocd.png"
            alt="Controlador de Documentos"
            className="w-9 h-9 rounded-lg"
          />
          <span className="font-semibold text-foreground text-base">
            Controlador de Documentos
          </span>
        </Link>
        
        <div className="flex items-center gap-6">
          <Link
            href="/blog"
            className="nav-link text-sm text-muted hover:text-foreground transition-colors"
          >
            El Despacho
          </Link>
          <LanguageSwitcher />
          <AuthStatus />
        </div>
      </div>

      {/* Fila 2: Las 3 herramientas centradas */}
      <NavTools />
    </header>
  );
}