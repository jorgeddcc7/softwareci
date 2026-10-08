import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seguridad",
  description:
    "Cómo tratamos tus documentos y datos en Controlador de Documentos. Privacidad, cifrado y proveedores.",
  alternates: {
    canonical: "https://www.controladordocumentos.com/seguridad",
  },
};

export default function SeguridadPage() {
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

      <main className="max-w-3xl mx-auto px-6 py-12 w-full flex-1">
        <h1 className="text-3xl font-bold text-foreground mb-4">Seguridad</h1>
        <p className="text-muted mb-10">
          Sabemos que subes documentación comercial sensible. Aquí explicamos
          cómo la tratamos, en lenguaje claro y sin tecnicismos innecesarios.
        </p>

        {/* Sección 1 — Para todos */}
        <div className="space-y-6 text-sm text-muted leading-relaxed">
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-base font-semibold text-foreground mb-3">
              Tus documentos no se guardan
            </h2>
            <p>
              Los PDFs que subes (factura, packing list y documento de
              transporte) se procesan en el momento y se eliminan inmediatamente
              después del análisis. No se almacenan en ningún servidor, no se
              guardan en bases de datos y no se comparten con terceros.
            </p>
            <p className="mt-3">
              Una vez que ves el resultado en pantalla, los archivos ya no
              existen.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-base font-semibold text-foreground mb-3">
              No usamos tus documentos para entrenar modelos
            </h2>
            <p>
              Trabajamos con la API de pago de Google (Gemini), que garantiza
              que los datos enviados no se utilizan para entrenar modelos.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-base font-semibold text-foreground mb-3">
              Sin publicidad, sin venta de datos
            </h2>
            <p>
              No mostramos publicidad, no vendemos datos a terceros y no
              compartimos información con anunciantes. El único objetivo de la
              herramienta es ayudarte a revisar documentación.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-base font-semibold text-foreground mb-3">
              Puedes borrar tu cuenta cuando quieras
            </h2>
            <p>
              Desde tu página de cuenta puedes eliminar tu cuenta y todos los
              datos asociados en un clic. Sin emails, sin justificaciones, sin
              preguntas.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-base font-semibold text-foreground mb-3">
              Cookies y analítica
            </h2>
            <p>
              Usamos Google Analytics 4 con el consentimiento previo del
              usuario. Las cookies analíticas solo se activan si aceptas
              expresamente. La dirección IP se anonimiza antes de ser
              almacenada.
            </p>
          </section>

          {/* Sección 2 — Detalles técnicos */}
          <section className="mt-12 pt-8 border-t border-border">
            <h2 className="text-base font-semibold text-foreground mb-4">
              Detalles técnicos
            </h2>
            <p className="mb-4">
              Para quien quiera saber más sobre la infraestructura:
            </p>

            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  <strong className="text-foreground">
                    Procesamiento de documentos:
                  </strong>{" "}
                  Gemini API (Google). Los PDFs se envían cifrados mediante
                  HTTPS y se eliminan tras el análisis.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  <strong className="text-foreground">
                    Autenticación y base de datos:
                  </strong>{" "}
                  Supabase (Postgres gestionado), con cifrado en reposo y
                  conexiones HTTPS/TLS.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  <strong className="text-foreground">Pagos:</strong> Stripe.
                  Los datos de tarjeta nunca pasan por nuestros servidores.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  <strong className="text-foreground">
                    Envío de emails automáticos:
                  </strong>{" "}
                  Resend, con servidores en la UE.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  <strong className="text-foreground">Hosting:</strong> Vercel,
                  con CDN global y certificados SSL renovados automáticamente.
                </span>
              </li>
            </ul>
          </section>

          <section className="mt-8 p-6 bg-slate-50 rounded-lg">
            <p className="text-sm text-foreground">
              ¿Tienes alguna duda sobre seguridad? Escríbenos a{" "}
              <a
                href="mailto:hola@controladordocumentos.com"
                className="text-primary hover:text-primary-hover"
              >
                hola@controladordocumentos.com
              </a>{" "}
              y te respondemos personalmente.
            </p>
          </section>

          <p className="text-xs text-slate-400 mt-10">
            Última actualización: octubre de 2026.
          </p>
        </div>
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted">
          <p>© 2026 Controlador de Documentos. Todos los derechos reservados.</p>
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <Link href="/por-que" className="hover:text-foreground transition-colors">
              Por qué
            </Link>
            <Link href="/faq" className="hover:text-foreground transition-colors">
              FAQ
            </Link>
            <a
              href="mailto:hola@controladordocumentos.com"
              className="hover:text-foreground transition-colors"
            >
              Contacto
            </a>
            <Link href="/seguridad" className="hover:text-foreground transition-colors">
              Seguridad
            </Link>
            <Link href="/privacidad" className="hover:text-foreground transition-colors">
              Privacidad
            </Link>
            <Link href="/aviso-legal" className="hover:text-foreground transition-colors">
              Aviso legal
            </Link>
            <Link href="/terminos" className="hover:text-foreground transition-colors">
              Términos
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}