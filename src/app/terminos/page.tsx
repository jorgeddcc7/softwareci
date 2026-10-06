import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description:
    "Términos y condiciones de uso de Controlador de Documentos de Comercio Exterior.",
};

export default function TerminosPage() {
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
        <h1 className="text-3xl font-bold text-foreground mb-6">
          Términos y condiciones
        </h1>

        <div className="space-y-6 text-sm text-muted leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              1. Información general
            </h2>
            <p>
              Estos términos regulan el uso del servicio{" "}
              <strong>Controlador de Documentos</strong>, accesible en{" "}
              <strong>controladordocumentos.com</strong>.
            </p>
            <p className="mt-3">
              <strong>Titular:</strong> Jorge Dueñas
              <br />
              <strong>NIF:</strong> 54407157J
              <br />
              <strong>Email de contacto:</strong>{" "}
              <a
                href="mailto:hola@controladordocumentos.com"
                className="text-primary hover:text-primary-hover"
              >
                hola@controladordocumentos.com
              </a>
            </p>
            <p className="mt-3">
              El uso del servicio implica la aceptación plena de estos términos.
              Si no estás de acuerdo, no utilices el servicio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              2. Objeto del servicio
            </h2>
            <p>
              Controlador de Documentos es una herramienta web que analiza
              documentos de operaciones de comercio exterior (factura
              comercial, packing list y documento de transporte) para detectar
              posibles incoherencias entre ellos.
            </p>
            <p className="mt-3">
              <strong>El servicio NO es:</strong>
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Un sustituto del sistema aduanero oficial de ningún país.</li>
              <li>
                Un dictamen legal, fiscal o aduanero vinculante.
              </li>
              <li>
                Un sistema de clasificación arancelaria automática.
              </li>
              <li>
                Un servicio de asesoría profesional. Las alertas generadas son
                orientativas y no eximen al usuario de su propia revisión.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              3. Cuenta de usuario
            </h2>
            <p>
              Para usar el servicio es necesario crear una cuenta con un email
              válido y una contraseña. El usuario se compromete a:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Proporcionar información veraz durante el registro.</li>
              <li>
                Mantener la confidencialidad de sus credenciales de acceso.
              </li>
              <li>
                No compartir su cuenta con terceros sin autorización.
              </li>
              <li>
                Notificar cualquier uso no autorizado de su cuenta a la
                dirección de contacto.
              </li>
            </ul>
            <p className="mt-3">
              El usuario es responsable de toda actividad realizada desde su
              cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              4. Uso aceptable
            </h2>
            <p>El usuario se compromete a no utilizar el servicio para:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                Subir documentos sobre los que no tenga derecho o autorización.
              </li>
              <li>
                Realizar actividades ilícitas, fraudulentas o contrarias a la
                legislación vigente.
              </li>
              <li>
                Intentar acceder a cuentas de otros usuarios o a partes no
                públicas del sistema.
              </li>
              <li>
                Realizar un uso automatizado masivo (scraping, bots, etc.) sin
                autorización expresa.
              </li>
              <li>
                Sobrecargar deliberadamente la infraestructura del servicio.
              </li>
            </ul>
            <p className="mt-3">
              El incumplimiento de estas normas puede suponer la suspensión o
              cancelación de la cuenta sin previo aviso.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              5. Planes y precios
            </h2>
            <p>
              El servicio ofrece diferentes planes, incluyendo una prueba
              gratuita limitada. Los planes y precios vigentes se muestran en
              la página de precios del sitio web.
            </p>
            <p className="mt-3">
              Los precios se muestran sin IVA. El IVA aplicable se añade según
              la ubicación del cliente y su condición fiscal (empresa o
              particular, dentro o fuera de la Unión Europea).
            </p>
            <p className="mt-3">
              Controlador de Documentos se reserva el derecho a modificar los
              precios, avisando con antelación razonable. Los cambios no
              afectarán al período ya pagado.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              6. Facturación, renovación y cancelación
            </h2>
            <p>
              Las suscripciones se gestionan a través de la plataforma de pagos
              Stripe. La suscripción se renueva automáticamente al final de
              cada período, salvo cancelación previa.
            </p>
            <p className="mt-3">
              El usuario puede cancelar su suscripción en cualquier momento
              desde el portal de cliente accesible en su página de cuenta. La
              cancelación es efectiva al final del período ya pagado.
            </p>
            <p className="mt-3">
              No se realizan reembolsos por períodos parciales ya iniciados,
              salvo error atribuible a Controlador de Documentos o acuerdo
              explícito entre las partes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              7. Limitación de responsabilidad
            </h2>
            <p>
              Controlador de Documentos proporciona una herramienta de apoyo a
              la revisión documental. Las alertas generadas por el sistema son
              orientativas y no sustituyen el criterio profesional del usuario
              ni el de su agente de aduanas.
            </p>
            <p className="mt-3">
              El servicio se ofrece &quot;tal cual&quot;. No garantizamos que
              detecte el 100% de las posibles incoherencias ni que esté libre
              de errores.
            </p>
            <p className="mt-3">
              El titular no será responsable de daños indirectos, lucro
              cesante, pérdida de datos o daños derivados del uso o imposibilidad
              de uso del servicio, salvo dolo o negligencia grave.
            </p>
            <p className="mt-3">
              En cualquier caso, la responsabilidad total del titular frente al
              usuario se limita al importe abonado por este en los últimos 12
              meses.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              8. Propiedad intelectual
            </h2>
            <p>
              Todos los contenidos del servicio (código, diseño, textos, marca,
              logotipos) son propiedad del titular o de sus licenciantes. Queda
              prohibida su reproducción sin autorización expresa.
            </p>
            <p className="mt-3">
              El usuario conserva la propiedad de los documentos que sube al
              sistema. Al usar el servicio, autoriza únicamente el procesamiento
              temporal de esos documentos para generar el análisis solicitado.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              9. Protección de datos
            </h2>
            <p>
              El tratamiento de datos personales se rige por nuestra{" "}
              <Link
                href="/privacidad"
                className="text-primary hover:text-primary-hover"
              >
                política de privacidad
              </Link>
              . Los documentos subidos no se almacenan y se eliminan tras el
              análisis.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              10. Modificaciones
            </h2>
            <p>
              El titular se reserva el derecho a modificar estos términos. Los
              cambios entrarán en vigor desde su publicación en el sitio web.
              Si los cambios son sustanciales, se avisará a los usuarios por
              email.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              11. Ley aplicable y jurisdicción
            </h2>
            <p>
              Estos términos se rigen por la legislación española. Cualquier
              controversia se someterá a los juzgados y tribunales de España,
              salvo que la legislación aplicable disponga otro fuero.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              12. Contacto
            </h2>
            <p>
              Para cualquier consulta relacionada con estos términos, puedes
              escribir a{" "}
              <a
                href="mailto:hola@controladordocumentos.com"
                className="text-primary hover:text-primary-hover"
              >
                hola@controladordocumentos.com
              </a>
              .
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