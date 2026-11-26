import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "Mis Guardados",
};

export default async function GuardadosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obtenemos las auditorías de costes
  const { data: auditorias } = await supabase
    .from("logistic_audits")
    .select("id, created_at, factura")
    .order("created_at", { ascending: false });

  // Obtenemos las verificaciones de seguros
  const { data: seguros } = await supabase
    .from("insurance_audits")
    .select("id, created_at, factura")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-6 py-12 w-full">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">Mis Guardados</h1>
          <p className="text-muted">Revisa el historial de tus auditorías de costes y verificaciones de seguros.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Columna Auditorías */}
          <section className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-3">
              Auditorías de Costes ({auditorias?.length || 0})
            </h2>
            {auditorias && auditorias.length > 0 ? (
              <ul className="space-y-3">
                {auditorias.map((aud) => (
                  <li key={aud.id} className="p-4 border border-border rounded-xl bg-slate-50 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        Factura: {aud.factura?.numero_documento?.valor || "Desconocida"}
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(aud.created_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    {/* Si tuvieras una página de detalle, enlazarías aquí */}
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Guardado</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted text-center py-8">No has guardado ninguna auditoría todavía.</p>
            )}
          </section>

          {/* Columna Seguros */}
          <section className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-3">
              Verificaciones de Seguros ({seguros?.length || 0})
            </h2>
            {seguros && seguros.length > 0 ? (
              <ul className="space-y-3">
                {seguros.map((seg) => (
                  <li key={seg.id} className="p-4 border border-border rounded-xl bg-slate-50 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        Factura: {seg.factura?.numero_factura?.valor || "Desconocida"}
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(seg.created_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Guardado</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted text-center py-8">No has guardado ningún seguro todavía.</p>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}