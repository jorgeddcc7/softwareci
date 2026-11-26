import { AuditorForm } from "./auditor-form";
import Link from "next/link";

export const metadata = {
  title: "Auditor de Costes Logísticos",
  description: "Compara presupuestos y facturas logísticas para detectar sobrecostes.",
};

export default function AuditorLogisticoPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-6 py-12 w-full">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm font-medium text-muted hover:text-foreground mb-8 transition-colors group"
        >
          <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al inicio
        </Link>
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Freight Audit
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Deja de pagar sobrecostes logísticos
          </h1>
          <p className="text-lg text-muted leading-relaxed">
            Sube el presupuesto que te envió tu transitario y la factura final. 
            Nuestro sistema cruzará ambos documentos para detectar cargos no pactados o diferencias de precio.
          </p>
        </div>

        <AuditorForm />
        <div className="mt-16 pt-10 border-t border-border max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">El problema no es lo que cotizas. Es lo que acabas pagando.</h2>
            <p className="text-muted mt-2">El 80% de las facturas de transitarios contienen algún cargo que no estaba en la cotización inicial.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Cargos "fantasma"</h3>
              <p className="text-sm text-muted leading-relaxed">Document fees, handling, surcharges por combustible... Cargos que no estaban en el presupuesto y que asumes por no revisar línea por línea.</p>
            </div>
            
            <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Tarifas desactualizadas</h3>
              <p className="text-sm text-muted leading-relaxed">El transitario aplica una tarifa de flete distinta a la acordada. Sin una auditoría automática, es casi imposible detectarlo.</p>
            </div>
            
            <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Margen protegido</h3>
              <p className="text-sm text-muted leading-relaxed">Recuperar solo un 10% de lo que pagas de más al año en fletes ya amortiza la suscripción del software con creces.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}