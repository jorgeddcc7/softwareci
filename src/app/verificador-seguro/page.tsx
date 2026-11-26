import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { FormVerificadorSeguro } from "./form";

export const metadata = {
  title: "Verificador de Seguros de Transporte",
};

export default async function VerificadorSeguroPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let esPro = false;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("subscription_tier, subscription_status").eq("id", user.id).single();
    esPro = profile?.subscription_status === "active" && profile?.subscription_tier === "pro";
  }

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold tracking-wide uppercase mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Cobertura y Riesgos
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Protege tu mercancía antes del embarque
          </h1>
          <p className="text-lg text-muted leading-relaxed">
            Sube tu factura comercial y el certificado de tu seguro. Comprobaremos si el valor asegurado cumple con la norma internacional (110% del valor CIF) y si las cláusulas te cubren de verdad.
          </p>
        </div>

        {esPro ? (
          <FormVerificadorSeguro />
        ) : (
          <div className="max-w-md mx-auto bg-surface p-8 border border-border rounded-2xl shadow-lg text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
              🔒
            </div>
            <h2 className="text-xl font-bold text-foreground mb-3">Función exclusiva de Despacho Pro</h2>
            <p className="text-muted text-sm mb-8">
              El verificador de seguros está incluido en el plan Pro junto con los análisis ilimitados y el historial de expedientes.
            </p>
            <Link href="/precios" className="inline-block w-full px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors">
              Ver planes y actualizar
            </Link>
          </div>
        )}
        <div className="mt-16 pt-10 border-t border-border max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">¿Qué pasa si tu seguro no cubre lo que crees?</h2>
            <p className="text-muted mt-2">En comercio internacional, un siniestro con el seguro mal calculado puede costarte toda la mercancía.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-blue-600">%</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">La regla del 110%</h3>
              <p className="text-sm text-muted leading-relaxed">Si operas en CIF o CIP, el seguro debe cubrir al menos el 110% del valor de la factura. Si cubre menos, estás "infraasegurado" y perderás dinero ante un siniestro.</p>
            </div>
            
            <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Cláusulas A, B o C</h3>
              <p className="text-sm text-muted leading-relaxed">No todos los seguros cubren todo. La cláusula C apenas cubre desastres mayores. Si esperas cobertura "Todo Riesgo" (Cláusula A) y tienes C, el susto será mayúsculo.</p>
            </div>
            
            <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Incoherencia de Incoterms</h3>
              <p className="text-sm text-muted leading-relaxed">Si tu factura dice FOB (donde tú pones el seguro) pero el certificado lo ha pagado el proveedor, la cobertura puede no ser válida o no estar a tu nombre.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}