import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Cómo tratamos tus datos y tus documentos en el Controlador de Documentos de Comercio Exterior.",
};

export default function PrivacidadPage() {
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
        <h1 className="text-3xl font-bold text-foreground mb-6">
          Política de privacidad
        </h1>

        <div className="space-y-6 text-sm text-muted leading-relaxed">
          <div className="bg-primary-light border border-blue-200 rounded-lg p-5">
            <p className="text-foreground font-medium mb-2">
              Resumen en una frase
            </p>
            <p>
              Los documentos que subes se procesan en el momento y se eliminan
              inmediatamente después del análisis. No se almacenan, no se
              comparten y no se utilizan para entrenar modelos de IA.
            </p>
          </div>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              1. Responsable del tratamiento
            </h2>
            <p>
              El responsable del tratamiento de los datos es Jorge Dueñas,
              titular del sitio <strong>controladordocumentos.com</strong>. Para
              cualquier consulta relacionada con la privacidad puedes escribir a{" "}
              <a
                href="mailto:calculaincoterms@gmail.com"
                className="text-primary hover:text-primary-hover"
              >
                hola@controladordocumentos.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              2. Documentos que subes
            </h2>
            <p>
              Los documentos PDF que subes a la herramienta (factura comercial,
              packing list y documento de transporte) se procesan en tiempo real
              para generar el análisis solicitado. Una vez finalizado el
              análisis, los archivos se eliminan de forma inmediata de los
              servidores temporales.
            </p>
            <p className="mt-3">
              <strong>No se almacenan</strong> en bases de datos, no se conservan
              en caché, no se comparten con terceros y no se utilizan para
              entrenar modelos de inteligencia artificial.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              3. Proveedores de servicios
            </h2>
            <p>
              Para ofrecer el servicio utilizamos los siguientes proveedores,
              todos ellos con garantías de seguridad y cumplimiento del RGPD:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li>
                <strong>Vercel Inc.</strong> — hosting de la aplicación web.
              </li>
              <li>
                <strong>Google LLC (Gemini API)</strong> — servicio de
                inteligencia artificial para el análisis de documentos.
                Utilizamos el modo de pago, que garantiza que los datos no se
                usan para entrenar modelos.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              4. Datos personales
            </h2>
            <p>
              No solicitamos registro, no pedimos nombre, email ni teléfono, y
              no utilizamos cookies de seguimiento propias. Si nos escribes por
              email, conservaremos tu dirección únicamente para responderte.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              5. Tus derechos
            </h2>
            <p>
              Como usuario tienes derecho a acceder, rectificar, suprimir,
              oponerte y limitar el tratamiento de tus datos. Al no almacenar
              ningún dato personal, estos derechos se aplican exclusivamente a
              las comunicaciones por email que hayas mantenido con nosotros.
              Puedes ejercerlos escribiéndonos a la dirección indicada arriba.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              6. Cambios en esta política
            </h2>
            <p>
              Podemos actualizar esta política para reflejar cambios en el
              servicio o en la legislación aplicable. La fecha de última
              actualización se indica al pie de esta página.
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