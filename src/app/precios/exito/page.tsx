import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Suscripción activada",
};

export default function ExitoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            <img
              src="/logo.png"
              alt="Controlador de Documentos"
              className="w-9 h-9 rounded-lg"
            />
            <span className="font-semibold text-foreground text-base">
              Controlador de Documentos
            </span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-24 w-full flex-1 text-center">
        <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-4">
          ¡Suscripción activada!
        </h1>
        <p className="text-muted mb-8 max-w-md mx-auto">
          Gracias por confiar en Controlador de Documentos. Tu cuenta ya tiene
          acceso completo a todas las funciones, incluyendo el análisis con
          documento de transporte.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/analizar"
            className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            Empezar a analizar
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-white border border-border text-foreground font-medium rounded-lg hover:border-primary transition-colors"
          >
            Volver al inicio
          </Link>
        </div>

        <p className="mt-10 text-xs text-muted">
          ¿Necesitas ayuda? Escríbenos a{" "}
          <a
            href="mailto:hola@controladordocumentos.com"
            className="text-primary hover:text-primary-hover"
          >
            hola@controladordocumentos.com
          </a>
        </p>
      </main>
    </div>
  );
}