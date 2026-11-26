import Link from "next/link";
import type { Metadata } from "next";
import { PlanButton } from "./plan-button";

export const metadata: Metadata = {
  title: "Precios",
  description:
    "Planes del Controlador de Documentos. Empieza gratis, escala cuando lo necesites. Aduanas, Costes y Seguros en una sola suite.",
  alternates: {
    canonical: "https://www.controladordocumentos.com/precios",
    languages: {
      es: "https://www.controladordocumentos.com/precios",
      en: "https://www.controladordocumentos.com/en/pricing",
    },
  },
};

const PLANES = [
  {
    nombre: "Prueba",
    precio: "0",
    periodo: "gratis",
    descripcion: "Para probar la suite sin compromiso.",
    caracteristicas: [
      "3 análisis gratuitos (en cualquier herramienta)",
      "Análisis Aduanero (Factura + Packing)",
      "Detección de incoherencias básicas",
      "Sin tarjeta",
    ],
    cta: "Probar gratis",
    destacado: false,
    priceId: null,
  },
  {
    nombre: "Despacho",
    precio: "79",
    periodo: "/mes + IVA",
    descripcion: "Para el día a día y evitar sustos con transitarios.",
    caracteristicas: [
      "100 Análisis Aduaneros al mes",
      "Factura + Packing + Transporte",
      "Auditor de Costes Logísticos",
      "Generador de reclamaciones a proveedores",
      "Informe PDF descargable",
    ],
    cta: "Empezar",
    destacado: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_DESPACHO ?? null,
  },
  {
    nombre: "Despacho Pro",
    precio: "149",
    periodo: "/mes + IVA",
    descripcion: "La suite definitiva para proteger tu margen.",
    caracteristicas: [
      "Análisis Aduaneros ilimitados",
      "Todo lo del plan Despacho",
      "Verificador de Seguros de Transporte",
      "Historial de Expedientes y Auditorías",
      "Exportación a CSV/Excel",
      "Soporte prioritario",
    ],
    cta: "Empezar",
    destacado: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? null,
  },
];

export default async function PreciosPage({
  searchParams,
}: {
  searchParams: Promise<{ limit_reached?: string; monthly_limit?: string }>;
}) {
  const params = await searchParams;
  const ocultarPlanGratis = params.limit_reached === "true";
  const limiteMensual = params.monthly_limit === "true";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="max-w-6xl mx-auto px-6 py-16 w-full flex-1">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Una suite. Tres formas de protegerte.
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Desde evitar que aduanas retenga tu mercancía, hasta auditar las facturas de tu transitario o comprobar que tu seguro cubre el 110%. Empieza gratis.
          </p>
          {limiteMensual && (
            <div className="mt-8 max-w-2xl mx-auto p-4 bg-primary-light border border-blue-200 rounded-lg text-sm text-foreground">
              <strong>Has alcanzado el límite de 100 análisis este mes.</strong>{" "}
              Actualiza al plan Pro para tener análisis ilimitados y acceso a todas las herramientas.
            </div>
          )}
        </div>

        {/* Tarjetas de precios */}
        <div
          className={`grid gap-6 mb-16 ${
            ocultarPlanGratis ? "md:grid-cols-2 max-w-3xl mx-auto" : "md:grid-cols-3"
          }`}
        >
          {PLANES.filter(
            (plan) => !(ocultarPlanGratis && plan.precio === "0")
          ).map((plan, i) => (
            <div
              key={i}
              className={`relative p-8 rounded-2xl border-2 transition-all flex flex-col ${
                plan.destacado
                  ? "border-primary bg-surface shadow-xl scale-105 z-10"
                  : "border-border bg-surface shadow-sm"
              }`}
            >
              {plan.destacado && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
                  Recomendado
                </div>
              )}
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {plan.nombre}
              </h3>
              <p className="text-sm text-muted mb-6 h-10">{plan.descripcion}</p>
              
              <div className="mb-6 pb-6 border-b border-border">
                <span className="text-4xl font-bold text-foreground">
                  {plan.precio}€
                </span>
                <span className="text-muted ml-1">{plan.periodo}</span>
              </div>
              
              <ul className="space-y-3 mb-8 flex-1">
                {plan.caracteristicas.map((c, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-foreground leading-snug">{c}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                {plan.priceId && (
                  <p className="text-xs text-muted text-center mb-3">
                    Cancela cuando quieras
                  </p>
                )}
                <PlanButton
                  priceId={plan.priceId}
                  label={plan.cta}
                  destacado={plan.destacado}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted text-center max-w-2xl mx-auto mb-12">
          Los precios no incluyen IVA. Los clientes en España verán añadido el
          21% de IVA en el pago. Las empresas de la UE con NIF intracomunitario
          válido y los clientes fuera de la UE no pagan IVA español.
        </p>

        {/* Bloque de ROI Actualizado */}
        <div className="max-w-4xl mx-auto p-8 bg-surface border border-border rounded-2xl shadow-sm">
          <h2 className="text-2xl font-semibold text-foreground mb-2 text-center">
            ¿Cuánto te cuesta no tener esta herramienta?
          </h2>
          <p className="text-sm text-muted text-center mb-8">Un solo error evitado paga la suscripción del año.</p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-3xl font-bold text-primary mb-1">600 €</p>
              <p className="text-xs text-muted font-medium">Multa por documentación incorrecta en aduana</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-3xl font-bold text-primary mb-1">10-20%</p>
              <p className="text-xs text-muted font-medium">Sobrecostes ocultos en facturas de transitarios</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-3xl font-bold text-primary mb-1">100%</p>
              <p className="text-xs text-muted font-medium">Pérdida de la mercancía si el seguro no cubre el 110%</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-auto bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted">
          <p>© 2026 Controlador de Documentos · Última actualización: noviembre 2026</p>
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <Link href="/por-que" className="hover:text-foreground transition-colors">Por qué</Link>
            <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
            <a href="mailto:hola@controladordocumentos.com" className="hover:text-foreground transition-colors">Contacto</a>
            <Link href="/seguridad" className="hover:text-foreground transition-colors">Seguridad</Link>
            <Link href="/privacidad" className="hover:text-foreground transition-colors">Privacidad</Link>
            <Link href="/aviso-legal" className="hover:text-foreground transition-colors">Aviso legal</Link>
            <Link href="/terminos" className="hover:text-foreground transition-colors">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}