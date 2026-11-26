import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "¿Por qué usar Controlador de Documentos?",
  description:
    "Descubre cuánto cuesta realmente un error documental, un sobrecoste logístico o un infraseguro, y cómo nuestra suite puede proteger tu margen comercial.",
  alternates: {
    canonical: "https://www.controladordocumentos.com/por-que",
  },
};

export default function PorQuePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      
      {/* Hero Editorial */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">
          El coste real de la operativa
        </p>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 max-w-4xl mx-auto leading-[1.1] tracking-tight mb-8">
          Un error que se detecta a tiempo cuesta cero. <br className="hidden md:block" />
          <span className="text-slate-400">El mismo error en aduana cuesta miles de euros.</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          No se trata de trabajar más rápido. Se trata de tener la certeza de que tu documentación, tus facturas logísticas y tus seguros están blindados antes de que sea tarde.
        </p>
      </section>

      {/* Sección 1: La cruda realidad (Datos y Fuentes) */}
      <section className="bg-slate-50 border-y border-slate-200 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 border-l-4 border-slate-800 pl-4">
            ¿A cuánto asciende el fallo?
          </h2>
          
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start">
              <div className="md:w-1/3 shrink-0">
                <span className="block text-4xl font-black text-slate-900 font-mono">100 - 6.000 €</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-2 block">Multa Aduanera</span>
              </div>
              <div className="md:w-2/3 text-slate-600 text-sm leading-relaxed">
                <p className="mb-2">La sanción por error documental sin perjuicio económico suele ser del <strong>1% del valor de la mercancía</strong>. Si afecta a la seguridad (ENS), el mínimo se establece en 600 €.</p>
                <p className="text-xs text-slate-400 italic">Fuente: Artículo 199 de la Ley 58/2003 General Tributaria.</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start pt-8 border-t border-slate-200">
              <div className="md:w-1/3 shrink-0">
                <span className="block text-4xl font-black text-slate-900 font-mono">50 - 150%</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-2 block">Impago de Aranceles</span>
              </div>
              <div className="md:w-2/3 text-slate-600 text-sm leading-relaxed">
                <p className="mb-2">Si el error provoca un impago de aranceles o IVA, la sanción se aplica sobre la cuota no ingresada. A esto se suma el <strong>100% de la deuda y los intereses de demora</strong>.</p>
                <p className="text-xs text-slate-400 italic">Fuente: Artículos 191-195 de la Ley 58/2003 General Tributaria.</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start pt-8 border-t border-slate-200">
              <div className="md:w-1/3 shrink-0">
                <span className="block text-4xl font-black text-slate-900 font-mono">40 - 200 €</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-2 block">Coste por día retenido</span>
              </div>
              <div className="md:w-2/3 text-slate-600 text-sm leading-relaxed">
                <p className="mb-2">Cada día que tu mercancía pasa en el canal rojo de la aduana, generas costes de almacenaje y manipulación. Y el problema no se resuelve solo.</p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <p className="text-slate-700 text-sm leading-relaxed">
              <strong>El efecto dominó:</strong> A la multa hay que sumarle el retraso en producción, la pérdida de ventas (si tienes un cliente esperando la mercancía) y el tiempo de tu equipo resolviendo el problema con el agente de aduanas. En una sola operación fallida, <strong>el coste total puede superar varias veces el precio anual de esta suite.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Sección 2: La solución (Las 3 palancas de ahorro) */}
      <section className="max-w-4xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center">
          Tres palancas para proteger tu margen
        </h2>
        <p className="text-slate-500 text-center mb-16 max-w-2xl mx-auto">
          No es solo "revisar documentos". Es auditar la operación completa para que no pierdas dinero en ninguna de sus fases.
        </p>

        <div className="space-y-16">
          
          {/* Palanca 1 */}
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase rounded-full mb-4">Fase 1: Antes del despacho</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">El seguro de Aduanas</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                Evita que la mercancía se quede parada. Cruzamos factura, packing y transporte para detectar incoherencias (pesos, bultos, Incoterms) antes de enviarlo al agente.
              </p>
              <ul className="space-y-2 text-sm text-slate-700 font-medium">
                <li className="flex gap-2"><span className="text-slate-400">→</span> Evitas multas y retenciones.</li>
                <li className="flex gap-2"><span className="text-slate-400">→</span> Duermes tranquilo ante una inspección.</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 text-center">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Ahorro medio</p>
              <p className="text-5xl font-black text-slate-900 font-mono">600 €</p>
              <p className="text-xs text-slate-500 mt-2">Evitando solo una multa al año.</p>
            </div>
          </div>

          {/* Palanca 2 */}
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1 bg-emerald-50 rounded-2xl p-8 border border-emerald-100 text-center">
              <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-2">Ahorro medio</p>
              <p className="text-5xl font-black text-emerald-700 font-mono">10-20%</p>
              <p className="text-xs text-emerald-600 mt-2">Del coste total de tu factura logística.</p>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase rounded-full mb-4">Fase 2: Al recibir la factura</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">El Auditor de Transitarios</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                Los transitarios aplican recargos que no estaban en la cotización. Nuestra IA compara el presupuesto inicial con la factura final para detectar cargos fantasma.
              </p>
              <ul className="space-y-2 text-sm text-slate-700 font-medium">
                <li className="flex gap-2"><span className="text-emerald-500">→</span> Detectas cobros indebidos al instante.</li>
                <li className="flex gap-2"><span className="text-emerald-500">→</span> Generas la reclamación automáticamente.</li>
              </ul>
            </div>
          </div>

          {/* Palanca 3 */}
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase rounded-full mb-4">Fase 3: Protección de activos</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">El Verificador de Seguros</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                Un siniestro con un seguro mal calculado es la ruina. Validamos que tu póliza cumpla la regla del 110%, que las cláusulas (A, B o C) sean las correctas y que las rutas coincidan.
              </p>
              <ul className="space-y-2 text-sm text-slate-700 font-medium">
                <li className="flex gap-2"><span className="text-blue-500">→</span> Evitas el infraseguro.</li>
                <li className="flex gap-2"><span className="text-blue-500">→</span> Te aseguras de que la cobertura es real.</li>
              </ul>
            </div>
            <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100 text-center">
              <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">Riesgo evitado</p>
              <p className="text-5xl font-black text-blue-700 font-mono">100%</p>
              <p className="text-xs text-blue-600 mt-2">Del valor de la mercancía ante un siniestro.</p>
            </div>
          </div>

        </div>
      </section>

      {/* Sección 3: Antes y después (Estilo Editorial) */}
      <section className="border-t border-slate-200 py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">
            La diferencia es el control
          </h2>
          
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 p-6 md:p-8 bg-white border border-slate-200 rounded-xl">
              <div className="md:w-1/3">
                <span className="text-sm font-bold text-red-500 uppercase tracking-wider block mb-1">Sin la suite</span>
                <span className="text-xs text-slate-400">El método tradicional</span>
              </div>
              <div className="md:w-2/3 text-slate-600 text-sm leading-relaxed">
                Revisas los PDFs a mano bajo presión, pagas la factura del transitario sin auditar, confías en que el seguro cubre lo que debe, y descubres los problemas cuando la aduana ya los ha visto o cuando ocurre el siniestro.
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 p-6 md:p-8 bg-white border-l-4 border-slate-900 border-y border-r border-slate-200 rounded-xl shadow-sm">
              <div className="md:w-1/3">
                <span className="text-sm font-bold text-slate-900 uppercase tracking-wider block mb-1">Con la suite</span>
                <span className="text-xs text-slate-400">El estándar moderno</span>
              </div>
              <div className="md:w-2/3 text-slate-900 text-sm font-medium leading-relaxed">
                La IA hace la revisión cruzada en segundos, auditas las facturas recuperando tu margen, validas las pólizas antes de operar y tienes expedientes organizados. Te adelantas a los problemas.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección 4: Quién está detrás */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          Quién está detrás
        </h2>
        <p className="text-slate-600 leading-relaxed mb-6">
          Controlador de Documentos nace de la experiencia directa en operaciones de comercio exterior. La herramienta está diseñada por personas que han visto de cerca los problemas que intenta resolver: documentos que no cuadran, facturas infladas y seguros que no cubren.
        </p>
        <p className="text-slate-600 leading-relaxed">
          No somos una consultora. No vendemos asesoría. Construimos software sencillo para problemas concretos del día a día del sector. Todo lo que hacemos parte de conversaciones con despachantes, transitarios y pymes importadoras.
        </p>
      </section>

      {/* CTA final */}
      <section className="bg-slate-900 py-20 text-center px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Listo para dejar de perder dinero?
          </h2>
          <p className="text-slate-300 mb-10 text-lg">
            Prueba la suite completa con 3 análisis gratuitos. Sin tarjeta de crédito. Sin compromisos.
          </p>
          <Link
            href="/analizar"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-all hover:-translate-y-0.5 text-base"
          >
            Empezar gratis →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© 2026 Controlador de Documentos</p>
          <div className="flex flex-wrap gap-6 items-center justify-center">
            <Link href="/por-que" className="hover:text-slate-900 transition-colors">Por qué</Link>
            <Link href="/faq" className="hover:text-slate-900 transition-colors">FAQ</Link>
            <a href="mailto:hola@controladordocumentos.com" className="hover:text-slate-900 transition-colors">Contacto</a>
            <Link href="/seguridad" className="hover:text-slate-900 transition-colors">Seguridad</Link>
            <Link href="/privacidad" className="hover:text-slate-900 transition-colors">Privacidad</Link>
            <Link href="/aviso-legal" className="hover:text-slate-900 transition-colors">Aviso legal</Link>
            <Link href="/terminos" className="hover:text-slate-900 transition-colors">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}