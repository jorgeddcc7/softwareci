import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "¿Por qué usar Controlador de Documentos?",
  description:
    "Descubre cuánto cuesta un error documental en una operación de importación y cómo detectarlo antes del despacho aduanero.",
};

export default function PorQuePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
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

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground max-w-3xl mx-auto leading-[1.15] tracking-tight">
          ¿Por qué usar Controlador de Documentos?
        </h1>
        <p className="mt-6 text-lg text-muted max-w-2xl mx-auto leading-relaxed">
          Porque un error documental que se detecta a tiempo cuesta cero. El
          mismo error detectado en aduana cuesta cientos o miles de euros.
        </p>
      </section>

      {/* El problema */}
      <section className="bg-surface border-y border-border">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-semibold text-foreground text-center mb-4">
            El problema real
          </h2>
          <p className="text-muted text-center max-w-2xl mx-auto mb-12">
            Los errores documentales en importación no son raros. Y cuando se
            detectan en aduana, el coste se dispara.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-primary-light border border-blue-200 rounded-xl">
              <p className="text-3xl font-bold text-primary mb-2">
                100 - 6.000 €
              </p>
              <p className="text-sm text-foreground font-medium mb-2">
                Multa por error documental
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Sin perjuicio económico. Sanción del 1% del valor de la
                mercancía (Art. 199 LGT). Mínimo 600 € si afecta a la ENS.
              </p>
            </div>
            <div className="p-6 bg-primary-light border border-blue-200 rounded-xl">
              <p className="text-3xl font-bold text-primary mb-2">50 - 150%</p>
              <p className="text-sm text-foreground font-medium mb-2">
                Si hay impago de aranceles o IVA
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Sobre la cuota no ingresada. Más el 100% de la deuda y los
                intereses de demora (Arts. 191-195 LGT).
              </p>
            </div>
            <div className="p-6 bg-primary-light border border-blue-200 rounded-xl">
              <p className="text-3xl font-bold text-primary mb-2">
                40 - 200 €/día
              </p>
              <p className="text-sm text-foreground font-medium mb-2">
                Coste por retención en aduana
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Almacenaje y manipulación en canal rojo. Suele durar entre 2 y
                7 días.
              </p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto p-6 bg-slate-50 rounded-xl">
            <p className="text-sm text-slate-700 leading-relaxed text-center">
              A esto hay que sumar el <strong>retraso en producción</strong>,
              la <strong>pérdida de ventas</strong> y el{" "}
              <strong>tiempo dedicado a resolver el problema</strong>. En una
              sola operación, el coste total puede superar varias veces el
              precio anual de esta herramienta.
            </p>
          </div>

          <p className="mt-6 text-xs text-muted text-center max-w-2xl mx-auto">
            Fuentes: Artículo 199 de la Ley 58/2003 General Tributaria
            (régimen sancionador aduanero sin perjuicio económico) y Artículos
            191-195 de la misma Ley (con perjuicio económico). Los importes
            exactos pueden variar según el caso.
          </p>
        </div>
      </section>

      {/* La solución */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-semibold text-foreground text-center mb-4">
          Qué hace la herramienta
        </h2>
        <p className="text-muted text-center max-w-2xl mx-auto mb-14">
          Tres pasos. Uno o dos minutos.
        </p>

        <div className="grid md:grid-cols-3 gap-10">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-5 text-lg font-semibold">
              1
            </div>
            <h3 className="font-semibold text-foreground mb-2 text-[15px]">
              Sube los documentos
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Factura comercial, packing list y, si la tienes, el documento de
              transporte (B/L, AWB o CMR).
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-5 text-lg font-semibold">
              2
            </div>
            <h3 className="font-semibold text-foreground mb-2 text-[15px]">
              La IA los lee
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Extrae los datos clave de cada documento y los compara entre sí
              automáticamente.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-5 text-lg font-semibold">
              3
            </div>
            <h3 className="font-semibold text-foreground mb-2 text-[15px]">
              Recibes las alertas
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Lista priorizada por gravedad con la referencia al documento y
              campo exacto en conflicto. Con acción sugerida.
            </p>
          </div>
        </div>
      </section>

      {/* Comparativa */}
      <section className="bg-surface border-y border-border">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-semibold text-foreground text-center mb-14">
            Antes y después
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border-2 border-slate-200 rounded-xl">
              <p className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wide">
                Sin la herramienta
              </p>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">✗</span>
                  <span>
                    Revisión manual bajo presión de tiempo
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">✗</span>
                  <span>
                    Errores que se escapan por cansancio o prisa
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">✗</span>
                  <span>
                    Problemas que aparecen en aduana (multa + retención)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">✗</span>
                  <span>
                    Tiempo perdido reclamando documentación al proveedor
                  </span>
                </li>
              </ul>
            </div>

            <div className="p-6 border-2 border-primary rounded-xl bg-primary-light">
              <p className="text-sm font-semibold text-primary mb-4 uppercase tracking-wide">
                Con la herramienta
              </p>
              <ul className="space-y-3 text-sm text-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>
                    Análisis automático en menos de un minuto
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>
                    Detección sistemática: nada se escapa
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>
                    Incoherencias detectadas antes del despacho
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>
                    Acción sugerida para cada alerta: sabes qué hacer
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Para quién */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-semibold text-foreground text-center mb-14">
          ¿Para quién es?
        </h2>

        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <h3 className="font-semibold text-foreground mb-2 text-[15px]">
              Despachos de aduanas
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Revisa la documentación de tus clientes antes de presentarla.
              Reduce incidencias en aduana y gana tiempo.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2 text-[15px]">
              Pymes importadoras
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Detecta incoherencias antes de enviar los documentos a tu agente.
              Evita retrasos y sobrecostes.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2 text-[15px]">
              Transitarios
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Verifica que la documentación de cada operación cuadra entre sí.
              Menos incidencias, más confianza del cliente.
            </p>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-surface border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Pruébalo con una operación real
          </h2>
          <p className="text-muted mb-8 max-w-xl mx-auto">
            5 análisis gratuitos, sin registro y sin guardar tus documentos.
            Compruébalo tú mismo.
          </p>
          <Link
            href="/analizar"
            className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
          >
            Probar gratis →
          </Link>
          <p className="mt-6 text-sm text-muted">
            Sin tarjeta. Sin compromiso.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted">
          <p>Controlador de Documentos · Prototipo v0.1</p>
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <Link href="/por-que" className="hover:text-foreground transition-colors">
              Por qué
            </Link>
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