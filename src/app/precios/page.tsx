import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Precios",
  description:
    "Planes y precios del Controlador de Documentos de Comercio Exterior. Empieza gratis, escala cuando lo necesites.",
};

const PLANES = [
  {
    nombre: "Prueba",
    precio: "0",
    periodo: "gratis",
    descripcion: "Para probar la herramienta sin compromiso.",
    caracteristicas: [
      "5 análisis gratuitos",
      "Factura + packing list",
      "Detección de incoherencias básicas",
      "Sin registro",
    ],
    cta: "Probar gratis",
    destacado: false,
  },
  {
    nombre: "Despacho",
    precio: "79",
    periodo: "/mes",
    descripcion: "Para despachos pequeños y pymes importadoras.",
    caracteristicas: [
      "100 análisis al mes",
      "Factura + packing + documento de transporte",
      "Detección de descripciones genéricas",
      "Informe PDF descargable",
      "Soporte por email",
    ],
    cta: "Empezar",
    destacado: true,
  },
  {
    nombre: "Despacho Pro",
    precio: "249",
    periodo: "/mes",
    descripcion: "Para transitarios y despachos con varios operadores.",
    caracteristicas: [
      "Análisis ilimitados",
      "Multi-usuario",
      "Histórico de operaciones",
      "Informe PDF con tu marca",
      "Soporte prioritario",
    ],
    cta: "Contactar",
    destacado: false,
  },
];

export default function PreciosPage() {
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
          <Link
            href="/"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            ← Volver
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 w-full flex-1">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Planes simples y transparentes
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Empieza gratis. Escala cuando lo necesites. Sin contratos anuales
            ni sorpresas.
          </p>
        </div>

        {/* Tarjetas de precios */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {PLANES.map((plan, i) => (
            <div
              key={i}
              className={`relative p-8 rounded-xl border-2 transition-all ${
                plan.destacado
                  ? "border-primary bg-surface shadow-lg scale-105"
                  : "border-border bg-surface"
              }`}
            >
              {plan.destacado && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
                  Recomendado
                </div>
              )}
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {plan.nombre}
              </h3>
              <p className="text-sm text-muted mb-6">{plan.descripcion}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">
                  {plan.precio}€
                </span>
                <span className="text-muted ml-1">{plan.periodo}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.caracteristicas.map((c, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-foreground">{c}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  plan.destacado
                    ? "bg-primary text-white hover:bg-primary-hover"
                    : "bg-white border border-border text-foreground hover:border-primary"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Bloque de ROI */}
        <div className="max-w-3xl mx-auto p-8 bg-primary-light border border-blue-200 rounded-xl">
          <h2 className="text-2xl font-semibold text-foreground mb-4 text-center">
            ¿Cuánto te cuesta un error documental?
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary mb-1">600 €</p>
              <p className="text-xs text-muted">
                Multa mínima por documentación incorrecta
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary mb-1">200 €</p>
              <p className="text-xs text-muted">
                Coste diario de retención en aduana
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary mb-1">6.000 €</p>
              <p className="text-xs text-muted">Multa máxima por inexactitud</p>
            </div>
          </div>
          <p className="text-sm text-foreground text-center leading-relaxed">
            Si evitas <strong>un solo error al año</strong>, la herramienta se
            paga sola. Si evitas <strong>dos</strong>, la rentabilidad es del{" "}
            <strong>100%</strong>.
          </p>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted">
          <p>Controlador de Documentos · Prototipo v0.1</p>
          <div className="flex flex-wrap gap-4 items-center justify-center">
            {process.env.NEXT_PUBLIC_SHOW_PRICING === "true" && (
              <Link href="/precios" className="hover:text-foreground transition-colors">
                Precios
              </Link>
            )}
            <Link href="/faq" className="hover:text-foreground transition-colors">
              FAQ
            </Link>
            <Link href="/aviso-legal" className="hover:text-foreground transition-colors">
              Aviso legal
            </Link>
            <Link href="/privacidad" className="hover:text-foreground transition-colors">
              Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}