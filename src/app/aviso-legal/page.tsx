import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso legal",
  description: "Aviso legal del Controlador de Documentos de Comercio Exterior.",
};

export default function AvisoLegalPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CD</span>
            </div>
            <span className="font-semibold text-foreground text-[15px]">
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

      <main className="max-w-4xl mx-auto px-6 py-12 w-full flex-1">
        <h1 className="text-3xl font-bold text-foreground mb-6">Aviso legal</h1>

        <div className="space-y-6 text-sm text-muted leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              1. Información general
            </h2>
            <p>
              El presente aviso legal regula el uso del sitio web{" "}
              <strong>controladordocumentos.com</strong>, titularidad de Jorge
              Dueñas. El acceso y uso del sitio atribuye la condición de usuario
              y supone la aceptación plena de las condiciones aquí expuestas.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              2. Objeto del servicio
            </h2>
            <p>
              El sitio ofrece una herramienta de apoyo para la revisión de
              documentación de operaciones de comercio exterior. La herramienta
              analiza los documentos subidos por el usuario y genera alertas
              sobre posibles incoherencias entre ellos.
            </p>
            <p className="mt-3">
              <strong>Limitación de responsabilidad:</strong> la herramienta no
              constituye un dictamen legal, no clasifica mercancías, no calcula
              aranceles y no sustituye en ningún caso el criterio profesional de
              un despachante o agente de aduanas. El usuario es el único
              responsable de las decisiones que tome a partir de la información
              facilitada por la herramienta.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              3. Condiciones de uso
            </h2>
            <p>
              El usuario se compromete a hacer un uso lícito de la herramienta y
              a no subir documentos que no esté autorizado a compartir. El
              usuario declara ser titular o estar autorizado para el tratamiento
              de los documentos que sube al sitio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              4. Propiedad intelectual
            </h2>
            <p>
              Todos los contenidos del sitio (textos, diseño, código, marca)
              son propiedad de Jorge Dueñas o de sus licenciantes. Queda
              prohibida su reproducción sin autorización expresa.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              5. Modificaciones
            </h2>
            <p>
              El titular se reserva el derecho a modificar el presente aviso
              legal en cualquier momento. Las modificaciones entrarán en vigor
              desde su publicación en el sitio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              6. Contacto
            </h2>
            <p>
              Para cualquier consulta relacionada con este aviso legal, puedes
              escribir a{" "}
              <a
                href="mailto:calculaincoterms@gmail.com"
                className="text-primary hover:text-primary-hover"
              >
                hola@controladordocumentos.com
              </a>
              .
            </p>
          </section>

          <p className="text-xs text-slate-400 mt-10">
            Última actualización: septiembre de 2026.
          </p>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted">
          <p>Controlador de Documentos · Prototipo v0.1</p>
          <div className="flex gap-4">
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