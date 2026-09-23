import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Preguntas frecuentes sobre el Controlador de Documentos de Comercio Exterior: privacidad, funcionamiento, alcance y limitaciones.",
};

const PREGUNTAS = [
  {
    pregunta: "¿Qué hace exactamente esta herramienta?",
    respuesta:
      "Subes los documentos de una operación de comercio exterior (factura comercial, packing list y opcionalmente el documento de transporte) y el sistema los compara automáticamente para detectar incoherencias entre ellos: cantidades que no cuadran, pesos que no coinciden, bultos distintos, descripciones demasiado genéricas, Incoterm mal indicado, etc. Te devuelve una lista de alertas priorizadas por gravedad.",
  },
  {
    pregunta: "¿Guardáis mis documentos?",
    respuesta:
      "No. Los PDFs que subes se procesan en el momento y se eliminan inmediatamente después del análisis. No se almacenan en ningún servidor, no se guardan en bases de datos y no se comparten con terceros. Una vez que ves el resultado, los archivos ya no existen.",
  },
  {
    pregunta: "¿Y si la herramienta usa inteligencia artificial, mis datos van a entrenar modelos?",
    respuesta:
      "No. Trabajamos con la API de Gemini en modo de pago, que garantiza que los datos enviados no se utilizan para entrenar modelos. Además, los PDFs se eliminan tan pronto como termina el análisis.",
  },
  {
    pregunta: "¿Sustituye al despachante o al agente de aduanas?",
    respuesta:
      "No, en absoluto. Es una herramienta de apoyo para la fase previa al despacho: ayuda a revisar la documentación antes de enviarla al agente. El criterio profesional del despachante sigue siendo imprescindible y es quien toma las decisiones finales.",
  },
  {
    pregunta: "¿Clasifica aranceles o calcula impuestos?",
    respuesta:
      "No. La herramienta no clasifica mercancías, no calcula aranceles y no emite dictámenes legales. Solo compara los documentos entre sí para detectar incoherencias. Cualquier sugerencia debe validarse siempre por un profesional.",
  },
  {
    pregunta: "¿Qué documentos puedo subir?",
    respuesta:
      "Factura comercial (obligatoria), packing list (obligatorio) y documento de transporte (opcional). El documento de transporte puede ser un B/L marítimo, un AWB aéreo o un CMR de carretera. La herramienta detecta automáticamente el tipo o puedes indicarlo manualmente.",
  },
  {
    pregunta: "¿Cuánto tarda el análisis?",
    respuesta:
      "Entre 30 y 90 segundos, dependiendo del tamaño de los PDFs y de la carga del servicio de IA en ese momento. Si el servicio está saturado, puede tardar hasta 2-3 minutos. En cualquier caso, se hace en tiempo real.",
  },
  {
    pregunta: "¿Qué tipos de alertas genera?",
    respuesta:
      "Las alertas se clasifican en tres niveles: graves (afectan directamente al despacho: cantidades, pesos, valores), medias (importantes pero no críticas: Incoterm, partes, fechas) y leves (sugerencias: descripciones mejorables). Cada alerta incluye una acción sugerida para resolverla.",
  },
  {
    pregunta: "¿Puedo descargar el resultado?",
    respuesta:
      "Sí. Después del análisis puedes descargar un informe en PDF con el veredicto global, las alertas agrupadas por gravedad y las acciones sugeridas. Puedes añadir tu nombre o el de tu empresa para adjuntarlo a tu expediente.",
  },
  {
    pregunta: "¿Es gratis?",
    respuesta:
      "Sí, actualmente está en fase de validación y el uso es gratuito. En el futuro habrá un plan de pago para empresas que lo usen de forma intensiva, pero siempre habrá una versión de prueba accesible.",
  },
  {
    pregunta: "¿En qué idiomas está disponible?",
    respuesta:
      "Actualmente en español. Está pensado para el mercado hispanohablante (España y Latinoamérica). Se está valorando añadir otros idiomas en el futuro.",
  },
  {
    pregunta: "¿Cómo puedo dar feedback o sugerir mejoras?",
    respuesta:
      "Nos encantaría conocer tu opinión. Puedes escribirnos desde el enlace de contacto que aparece en el pie de página. Todo el feedback que recibimos se tiene en cuenta para las siguientes versiones.",
  },
];

export default function FAQPage() {
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
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Preguntas frecuentes
        </h1>
        <p className="text-muted mb-10">
          Todo lo que necesitas saber antes de usar la herramienta.
        </p>

        <div className="space-y-6">
          {PREGUNTAS.map((item, i) => (
            <div
              key={i}
              className="bg-surface border border-border rounded-lg p-6"
            >
              <h2 className="font-semibold text-foreground mb-2 text-[15px]">
                {item.pregunta}
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                {item.respuesta}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-primary-light border border-blue-200 rounded-lg">
          <p className="text-sm text-foreground">
            ¿Tienes otra pregunta?{" "}
            <a
              href="mailto:hola@controladordocumentos.com"
              className="text-primary hover:text-primary-hover font-medium"
            >
              Escríbenos
            </a>{" "}
            y te respondemos lo antes posible.
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