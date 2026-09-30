import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pago cancelado",
};

export default function CanceladoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-24 w-full flex-1 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Pago cancelado
        </h1>
        <p className="text-muted mb-8 max-w-md mx-auto">
          No se ha completado el pago. No se ha realizado ningún cargo. Puedes
          volver a intentarlo cuando quieras.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/precios"
            className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            Volver a precios
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-white border border-border text-foreground font-medium rounded-lg hover:border-primary transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  );
}