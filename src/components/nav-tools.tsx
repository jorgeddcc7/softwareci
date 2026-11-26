"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tools = [
  { name: "Análisis Aduanero", href: "/analizar" },
  { name: "Auditor de Costes", href: "/auditor-logistico" },
  { name: "Verificador de Seguros", href: "/verificador-seguro" },
];

export function NavTools() {
  const pathname = usePathname();

  return (
    <div className="border-t border-border bg-slate-50/50 w-full overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 flex items-center md:justify-center overflow-x-auto no-scrollbar">
        {tools.map((tool) => {
          const isActive = pathname.startsWith(tool.href);
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className={`py-3.5 px-4 md:px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-primary text-primary bg-primary-light/30"
                  : "border-transparent text-muted hover:text-foreground hover:bg-slate-100/50"
              }`}
            >
              {tool.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}