import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CD</span>
            </div>
            <span className="font-semibold text-foreground text-[15px]">
              Controlador de Documentos
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground max-w-3xl mx-auto leading-[1.15] tracking-tight">
          Detecta incoherencias en tu documentación antes del despacho aduanero
        </h1>
        <p className="mt-6 text-lg text-muted max-w-2xl mx-auto leading-relaxed">
          Sube la factura comercial, el packing list y el documento de
          transporte. En segundos sabes si hay algo que pueda generar
          retenciones o retrasos.
        </p>
        <div className="mt-10">
          <Link
            href="/analizar"
            className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
          >
            Analizar documentos →
          </Link>
        </div>
        <p className="mt-6 text-sm text-muted">
          Sin registro · Sin guardar datos · Prototipo en desarrollo
        </p>
      </section>

      {/* Features */}
      <section className="bg-surface border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-semibold text-foreground text-center mb-14">
            ¿Qué detecta?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
            <FeatureItem
              title="Incoherencias"
              description="Cantidades, pesos o bultos que no cuadran entre documentos."
            />
            <FeatureItem
              title="Descripciones genéricas"
              description="Descripciones que pueden generar sospecha o retención en aduana."
            />
            <FeatureItem
              title="Campos ausentes"
              description="Datos obligatorios que faltan en algún documento."
            />
            <FeatureItem
              title="Incoterms"
              description="Incoterms mal indicados, incompletos o inconsistentes."
            />
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-semibold text-foreground text-center mb-14">
          Cómo funciona
        </h2>
        <div className="grid md:grid-cols-3 gap-12">
          <StepItem
            number="1"
            title="Sube los documentos"
            description="Factura, packing list y, opcionalmente, documento de transporte (B/L, AWB, CMR) en PDF."
          />
          <StepItem
            number="2"
            title="La IA los analiza"
            description="Extrae los datos clave de cada documento y los estructura."
          />
          <StepItem
            number="3"
            title="Recibes alertas"
            description="Lista priorizada por gravedad, con la referencia al documento y campo exacto en conflicto."
          />
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-surface border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-3">
            ¿Probamos con una operación tuya?
          </h2>
          <p className="text-muted mb-8">
            Sube los documentos y comprueba en segundos si hay algo que
            revisar antes del despacho.
          </p>
          <Link
            href="/analizar"
            className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            Analizar documentos
          </Link>
        </div>
      </section>

      <footer className="border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted">
          <p>Controlador de Documentos · Prototipo v0.1</p>
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <Link href="/faq" className="hover:text-foreground transition-colors">
              FAQ
            </Link>
            <Link href="/aviso-legal" className="hover:text-foreground transition-colors">
              Aviso legal
            </Link>
            <Link href="/privacidad" className="hover:text-foreground transition-colors">
              Privacidad
            </Link>
            <a
              href="mailto:calculaincoterms@gmail.com"
              className="text-primary hover:text-primary-hover transition-colors"
            >
              Contacto
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center mb-4">
        <svg
          className="w-5 h-5 text-primary"
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
      <h3 className="font-semibold text-foreground mb-2 text-[15px]">
        {title}
      </h3>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
    </div>
  );
}

function StepItem({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-5 text-lg font-semibold">
        {number}
      </div>
      <h3 className="font-semibold text-foreground mb-2 text-[15px]">
        {title}
      </h3>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
    </div>
  );
}