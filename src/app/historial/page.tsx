import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { BotonExportarCSV } from "./boton-csv";
import { HistorialCliente } from "./historial-cliente";

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
      "id, factura_numero, packing_numero, transporte_numero, transporte_tipo, resultado_global, created_at, client_name, notes"
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

      <main className="max-w-6xl mx-auto px-6 py-12 w-full flex-1">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Historial de operaciones
            </h1>
            <p className="text-muted">
              Tus últimas {operations?.length ?? 0} operaciones.
            </p>
          </div>
          {operations && operations.length > 0 && (
            <BotonExportarCSV operations={operations} />
          )}
        </div>

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
          <HistorialCliente operations={operations} />
        )}
      </main>
    </div>
  );
}