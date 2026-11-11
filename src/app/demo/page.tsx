import Link from "next/link";
import { demoResult } from "./demo-data";
import { DemoButtonEs } from "./demo-button";

export const metadata = {
  title: "Demo Interactiva - Controlador de Documentos",
  description: "Mira cómo nuestro motor detecta errores críticos de aranceles y pesos en la documentación aduanera. Pruébalo sin registrarte.",
  openGraph: {
    title: "Demo: Detecta errores en aduanas antes de que sea tarde",
    description: "Explora un ejemplo interactivo y descubre cómo cruzamos la factura, el packing list y el transporte.",
    url: "https://www.controladordocumentos.com/demo",
    siteName: "Controlador de Documentos",
    images: [
      {
        url: "https://www.controladordocumentos.com/og/demo-og.png",
        width: 1200,
        height: 630,
        alt: "Demo de Controlador de Documentos",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
};

export default function DemoPageEs() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-surface">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            <img src="/logocd.png" alt="Logo" className="w-9 h-9 rounded-lg" />
            <span className="font-semibold text-foreground text-base">Controlador de Documentos</span>
          </Link>
          <Link href="/" className="text-sm text-muted hover:text-foreground">← Volver</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 w-full flex-1">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Ejemplo Interactivo</h1>
          <p className="text-muted">Este es un resultado precalculado de un envío ficticio.</p>
        </div>

        {/* Banner de Error */}
        <div className="bg-high-bg border-l-4 border-high-text rounded-r-lg p-5 mb-6 shadow-sm">
          <h2 className="text-lg font-bold text-high-text uppercase">{demoResult.status} — Hay discrepancias graves</h2>
          <p className="text-sm text-high-text mt-1">
            Factura: <strong className="font-semibold">{demoResult.invoice_ref}</strong> · Packing: <strong className="font-semibold">{demoResult.packing_ref}</strong>
          </p>
        </div>

        {/* Lista de Errores */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6 shadow-sm">
          <div className="p-4 bg-high-bg border-b border-red-200">
            <h3 className="font-semibold text-high-text">Discrepancias graves ({demoResult.discrepancies.length})</h3>
          </div>
          <ul className="divide-y divide-border">
            {demoResult.discrepancies.map((disc) => (
              <li key={disc.code} className="p-6">
                <div className="mb-2">
                  <span className="text-xs font-mono text-muted mr-2">[{disc.code}]</span>
                  <span className="font-semibold text-foreground text-sm">{disc.title}</span>
                </div>
                <p className="text-sm text-muted mb-3">{disc.description}</p>
                <p className="text-sm">
                  <span className="font-semibold text-primary">Acción sugerida: </span>
                  <span className="text-muted">{disc.action}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* No comprobables */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6 shadow-sm">
           <div className="p-4 border-b border-border flex justify-between items-center cursor-not-allowed">
            <h3 className="font-semibold text-foreground">Reglas no comprobables (1)</h3>
            <span className="text-muted">+</span>
          </div>
          <div className="p-4 text-sm text-muted">
            No son errores: son comprobaciones que no se han podido hacer por falta de información en los documentos.
          </div>
        </div>

        {/* Resumen Footer */}
        <div className="bg-neutral-bg p-4 rounded-xl border border-border text-sm text-neutral-text mb-10">
          <strong>Resumen:</strong> {demoResult.summary.rules_run} reglas ejecutadas · {demoResult.summary.discrepancies} discrepancias · {demoResult.summary.uncheckable} no comprobables · {demoResult.summary.correct} correctas
        </div>

        {/* CTA */}
        <div className="text-center p-8 bg-primary-light border border-blue-200 rounded-xl">
          <h2 className="text-xl font-bold text-foreground mb-2">¿Quieres revisar tus propios documentos?</h2>
          <p className="text-muted mb-6">Crea una cuenta y consigue 3 análisis gratuitos. Sin tarjeta.</p>
          <DemoButtonEs/>
        </div>
      </main>
    </div>
  );
}