import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";

import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://www.controladordocumentos.com/",
    languages: {
      es: "https://www.controladordocumentos.com/",
      en: "https://www.controladordocumentos.com/en",
    },
  },
};

export default async function HomePage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold tracking-wide uppercase mb-8 border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          La suite definitiva para comercio exterior
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-foreground max-w-4xl mx-auto leading-[1.1] tracking-tight">
          Controla tu documentación. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
            Protege tu margen.
          </span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
          Evita retenciones en aduanas, detecta sobrecostes en facturas logísticas y valida que tus seguros cubren de verdad la mercancía. Todo en una sola plataforma impulsada por IA.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/analizar"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full sm:w-auto text-base"
          >
            Empezar gratis
          </Link>
          <Link
            href="/precios"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-white border border-border text-foreground font-medium rounded-xl hover:bg-slate-50 transition-all w-full sm:w-auto text-base"
          >
            Ver planes
          </Link>
        </div>
        
        {/* AÑADE ESTE ENLACE AQUÍ */}
        <div className="mt-6 flex justify-center">
          <Link href="/por-que" className="text-sm font-medium text-muted hover:text-foreground transition-colors flex items-center gap-1 group">
            ¿Por qué? 
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>
        <p className="mt-6 text-sm text-muted flex items-center justify-center gap-2">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Sin tarjeta · 3 análisis gratuitos · Datos eliminados tras el análisis
        </p>
      </section>

      {/* Bento Box: Las 3 Herramientas */}
      <section className="max-w-6xl mx-auto px-6 py-12 w-full">
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Herramienta 1: Aduanas (Ocupa 2 columnas) */}
          <Link href="/analizar" className="group md:col-span-2 relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 md:p-12 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between min-h-[320px]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-primary/30 transition-colors"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/10 text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Análisis Aduanero</h2>
              <p className="text-slate-400 max-w-md text-base leading-relaxed">
                Sube la factura, el packing list y el documento de transporte. Nuestra IA los cruza en segundos para detectar incoherencias que provocan retenciones y multas.
              </p>
            </div>
            <div className="relative z-10 mt-8 flex items-center text-sm font-semibold text-primary">
              Analizar documentos
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
          </Link>

          {/* Herramienta 2: Costes (Ocupa 1 columna) */}
          <Link href="/auditor-logistico" className="group relative overflow-hidden rounded-3xl bg-white border border-border p-8 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between min-h-[320px]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100 text-emerald-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Auditor de Costes</h2>
              <p className="text-muted text-sm leading-relaxed">
                Compara el presupuesto del transitario con su factura final. Detecta cargos no pactados y diferencias de precio antes de pagar.
              </p>
            </div>
            <div className="relative z-10 mt-6 flex items-center text-sm font-semibold text-emerald-600">
              Auditar facturas
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
          </Link>

          {/* Herramienta 3: Seguros (Ocupa 3 columnas - horizontal) */}
          <Link href="/verificador-seguro" className="group md:col-span-3 relative overflow-hidden rounded-3xl bg-blue-50 border border-blue-100 p-8 md:p-12 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-blue-200 text-blue-600 shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-blue-950">Verificador de Seguros</h2>
              </div>
              <p className="text-blue-800/80 max-w-2xl text-base leading-relaxed">
                Comprueba que tu póliza cubre el 110% del valor de la factura (Regla CIF) y que las cláusulas y rutas son las correctas. No dejes tu mercancía desprotegida ante un siniestro.
              </p>
            </div>
            <div className="relative z-10 shrink-0">
              <div className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-700 font-semibold rounded-xl shadow-sm border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-all">
                Validar póliza
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>
            </div>
          </Link>

        </div>
      </section>

      {/* Sección de Valor: ¿Por qué es distinto? */}
      <section className="bg-surface border-y border-border mt-12">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              La diferencia entre "revisar" y "tener el control"
            </h2>
            <p className="text-lg text-muted">
              El comercio exterior está lleno de letra pequeña. Nuestra IA no solo lee documentos, entiende la operación y te avisa donde tú no llegarías a tiempo.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Segundos, no horas</h3>
              <p className="text-sm text-muted leading-relaxed">Lo que a tu equipo le lleva 30 minutos de revisión cruzada (y un dolor de cabeza), a nuestra IA le lleva 15 segundos.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Protección real</h3>
              <p className="text-sm text-muted leading-relaxed">No se trata de encontrar un error, se trata de evitar una multa de 600€ o de perder una mercancía de 20.000€ porque el seguro estaba mal.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Privacidad por diseño</h3>
              <p className="text-sm text-muted leading-relaxed">Tus PDFs comerciales se procesan en memoria y se eliminan inmediatamente. No guardamos tus documentos, solo los resultados.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
          ¿Listo para dejar de llevarte sorpresas?
        </h2>
        <p className="text-lg text-muted mb-10 max-w-xl mx-auto">
          Únete a los profesionales que ya están protegiendo su margen comercial con nuestra suite.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/analizar"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-base"
          >
            Probar la suite gratis
          </Link>
          <Link
            href="/precios"
            className="inline-flex items-center justify-center px-8 py-4 bg-white border border-border text-foreground font-medium rounded-xl hover:bg-slate-50 transition-all text-base"
          >
            Ver precios
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-auto bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted">
          <p>{t.footerCopyright}</p>
          <div className="flex flex-wrap gap-6 items-center justify-center">
            <Link href="/por-que" className="hover:text-foreground transition-colors">{t.footerWhy}</Link>
            <Link href="/faq" className="hover:text-foreground transition-colors">{t.footerFaq}</Link>
            <a href="mailto:hola@controladordocumentos.com" className="hover:text-foreground transition-colors">{t.footerContact}</a>
            <Link href="/seguridad" className="hover:text-foreground transition-colors">{t.footerSecurity}</Link>
            <Link href="/privacidad" className="hover:text-foreground transition-colors">{t.footerPrivacy}</Link>
            <Link href="/aviso-legal" className="hover:text-foreground transition-colors">{t.footerLegal}</Link>
            <Link href="/terminos" className="hover:text-foreground transition-colors">{t.footerTerms}</Link>
          </div>
        </div>
      </footer>

      {/* JSON-LD (Actualizado para reflejar la suite) */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Controlador de Documentos",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: "https://www.controladordocumentos.com",
          description:
            "Suite de herramientas IA para comercio exterior: análisis de documentación aduanera, auditoría de costes logísticos y verificación de seguros de transporte.",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "EUR",
            description: "Prueba gratuita con 3 análisis incluidos",
          },
          provider: {
            "@type": "Organization",
            name: "Controlador de Documentos",
            url: "https://www.controladordocumentos.com",
          },
        }}
      />
    </div>
  );
}