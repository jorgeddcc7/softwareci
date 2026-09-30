import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "Historial de operaciones",
};

export default async function HistorialPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/historial");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_tier")
    .eq("id", user.id)
    .single();

  const esPro =
    profile?.subscription_status === "active" &&
    profile?.subscription_tier === "pro";

  if (!esPro) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-border bg-surface">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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

        <main className="max-w-2xl mx-auto px-6 py-24 w-full flex-1 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Historial de operaciones
          </h1>
          <p className="text-muted mb-8">
            El historial de operaciones está disponible en el plan Despacho Pro.
          </p>
          <Link
            href="/precios"
            className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            Ver planes
          </Link>
        </main>
      </div>
    );
  }

  const { data: operations } = await supabase
    .from("operations")
    .select(
      "id, factura_numero, packing_numero, transporte_numero, transporte_tipo, resultado_global, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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

      <main className="max-w-5xl mx-auto px-6 py-12 w-full flex-1">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Historial de operaciones
        </h1>
        <p className="text-muted mb-8">
          Tus últimas {operations?.length ?? 0} operaciones.
        </p>

        {!operations || operations.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-12 text-center">
            <p className="text-muted mb-4">
              Todavía no has analizado ninguna operación.
            </p>
            <Link
              href="/analizar"
              className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
            >
              Analizar documentos
            </Link>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-border">
                <tr>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-5 py-3">
                    Fecha
                  </th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-5 py-3">
                    Factura
                  </th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-5 py-3">
                    Packing
                  </th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-5 py-3">
                    Transporte
                  </th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-5 py-3">
                    Resultado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {operations.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-sm text-foreground">
                      {new Date(op.created_at).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3 text-sm text-foreground">
                      {op.factura_numero ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-foreground">
                      {op.packing_numero ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-foreground">
                      {op.transporte_numero
                        ? `${op.transporte_tipo === "air_waybill" ? "AWB" : op.transporte_tipo === "cmr" ? "CMR" : "B/L"} ${op.transporte_numero}`
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          op.resultado_global === "no_apto"
                            ? "bg-high-bg text-high-text"
                            : op.resultado_global === "revisar"
                              ? "bg-medium-bg text-medium-text"
                              : "bg-low-bg text-low-text"
                        }`}
                      >
                        {op.resultado_global === "no_apto"
                          ? "NO APTO"
                          : op.resultado_global === "revisar"
                            ? "REVISAR"
                            : "APTO"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}