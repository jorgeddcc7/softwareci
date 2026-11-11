import Link from "next/link";
import { demoResult } from "./demo-data";
import { DemoButtonEn } from "./demo-button";

export const metadata = {
  title: "Interactive Demo - Trade Document Controller",
  description: "See how our engine catches critical tariff and weight errors in customs documentation. Try it without signing up.",
  openGraph: {
    title: "Demo: Spot customs discrepancies before they cost you",
    description: "Explore an interactive example and see how we cross-check the invoice, packing list, and transport document.",
    url: "https://www.controladordocumentos.com/en/demo",
    siteName: "Trade Document Controller",
    images: [
      {
        url: "https://www.controladordocumentos.com/og/demo-og.jpg",
        width: 1200,
        height: 630,
        alt: "Trade Document Controller Demo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function DemoPageEn() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-surface">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/en" className="flex items-center gap-1.5">
            <img src="/logocd.png" alt="Logo" className="w-9 h-9 rounded-lg" />
            <span className="font-semibold text-foreground text-base">Trade Document Controller</span>
          </Link>
          <Link href="/en" className="text-sm text-muted hover:text-foreground">← Back</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 w-full flex-1">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Interactive Example</h1>
          <p className="text-muted">This is a pre-calculated result from a fictional shipment.</p>
        </div>

        {/* Banner de Error */}
        <div className="bg-high-bg border-l-4 border-high-text rounded-r-lg p-5 mb-6 shadow-sm">
          <h2 className="text-lg font-bold text-high-text uppercase">{demoResult.status} — Critical discrepancies found</h2>
          <p className="text-sm text-high-text mt-1">
            Invoice: <strong className="font-semibold">{demoResult.invoice_ref}</strong> · Packing: <strong className="font-semibold">{demoResult.packing_ref}</strong>
          </p>
        </div>

        {/* Lista de Errores */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6 shadow-sm">
          <div className="p-4 bg-high-bg border-b border-red-200">
            <h3 className="font-semibold text-high-text">Critical discrepancies ({demoResult.discrepancies.length})</h3>
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
                  <span className="font-semibold text-primary">Suggested action: </span>
                  <span className="text-muted">{disc.action}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* No comprobables */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6 shadow-sm">
           <div className="p-4 border-b border-border flex justify-between items-center cursor-not-allowed">
            <h3 className="font-semibold text-foreground">Uncheckable rules (1)</h3>
            <span className="text-muted">+</span>
          </div>
          <div className="p-4 text-sm text-muted">
            Not errors: checks that could not be performed due to missing information in the documents.
          </div>
        </div>

        {/* Resumen Footer */}
        <div className="bg-neutral-bg p-4 rounded-xl border border-border text-sm text-neutral-text mb-10">
          <strong>Summary:</strong> {demoResult.summary.rules_run} rules executed · {demoResult.summary.discrepancies} discrepancies · {demoResult.summary.uncheckable} uncheckable · {demoResult.summary.correct} correct
        </div>

        {/* CTA */}
        <div className="text-center p-8 bg-primary-light border border-blue-200 rounded-xl">
          <h2 className="text-xl font-bold text-foreground mb-2">Want to check your own documents?</h2>
          <p className="text-muted mb-6">Create an account and get 3 free analyses. No card required.</p>
          <DemoButtonEn/>
        </div>
      </main>
    </div>
  );
}