import Link from "next/link";
import type { Metadata } from "next";
import { ChecklistForm } from "./form";

export const metadata: Metadata = {
  title: "Checklist gratis: 12 puntos que revisa la aduana en tu packing list",
  description:
    "Descarga gratis el checklist en PDF con los 12 puntos que revisa la aduana en tu packing list. Evita retenciones y errores documentales.",
  alternates: {
    canonical: "https://www.controladordocumentos.com/checklist",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://www.controladordocumentos.com/checklist",
    siteName: "Controlador de Documentos",
    title: "Checklist gratis: 12 puntos que revisa la aduana en tu packing list",
    description:
      "PDF de 2 páginas, sin registro. Los 12 campos que revisa la aduana y los 5 errores que más se repiten.",
    images: [
      {
        url: "https://www.controladordocumentos.com/og/checklist.png",
        width: 1200,
        height: 630,
        alt: "Checklist: 12 puntos que revisa la aduana en tu packing list",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Checklist gratis: 12 puntos que revisa la aduana en tu packing list",
    description:
      "PDF de 2 páginas, sin registro. Los 12 campos que revisa la aduana y los 5 errores que más se repiten.",
    images: ["https://www.controladordocumentos.com/og/checklist.png"],
  },
};

export default function ChecklistPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            <img
              src="/logocd.png"
              alt="Controlador de Documentos"
              className="w-11 h-11 rounded-lg"
            />
            <span className="font-semibold text-foreground text-base">
              Controlador de Documentos
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            ← Volver
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-20 w-full flex-1">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
            Checklist gratuito
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
            12 puntos que revisa la aduana en tu packing list
          </h1>
          <p className="text-lg text-muted leading-relaxed">
            Descarga el checklist en PDF y revisa tu packing list antes de
            enviarlo al agente. Los 12 puntos que más retenciones generan
            cuando algo no cuadra.
          </p>
        </div>

        <ChecklistForm />

        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            ¿Qué incluye?
          </h2>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Los 12 campos que la aduana revisa con más detalle.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Los 5 errores más frecuentes y cómo evitarlos.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Formato PDF de 2 páginas, listo para imprimir o usar en pantalla.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Sin registro obligatorio. Solo tu email para enviártelo.</span>
            </li>
          </ul>
        </div>
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center text-sm text-muted">
          © 2026 Controlador de Documentos
        </div>
      </footer>
    </div>
  );
}