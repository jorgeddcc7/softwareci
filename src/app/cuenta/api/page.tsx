import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ApiKeysClient } from "./ApiKeysClient";
import type { ApiKeyListItem } from "@/types/api-keys";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_tier")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error("No se ha podido comprobar la suscripción.");
  }

  const esPro =
    profile?.subscription_status === "active" &&
    profile?.subscription_tier === "pro";

  // --- NUEVO: PAYWALL PARA PLANES INFERIORES ---
  if (!esPro) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-8 border border-slate-200">
          <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Función exclusiva de Despacho Pro
        </h1>
        <p className="text-lg text-muted max-w-xl mx-auto mb-10 leading-relaxed">
          La API Pública te permite conectar tu ERP o TMS directamente con nuestra IA para automatizar el análisis de documentos sin salir de tu sistema. 
          <br/><br/>
          Esta función está reservada para los usuarios del plan <strong>Despacho Pro</strong>.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/precios"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-all shadow-md text-base"
          >
            Mejorar al plan Pro →
          </Link>
          <Link
            href="/cuenta"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-white border border-border text-foreground font-medium rounded-xl hover:bg-slate-50 transition-all text-base"
          >
            Volver a mi cuenta
          </Link>
        </div>
      </main>
    );
  }

  // --- SI ES PRO, MOSTRAMOS EL PANEL ---
  const { data: keys, error: keysError } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, created_at, last_used_at, is_active")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (keysError) {
    console.error("Error cargando API Keys en la página:", keysError);
    throw new Error("No se han podido cargar tus API Keys.");
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Cuenta · Desarrolladores
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          API Pública
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Conecta tu ERP o TMS con el Controlador de Documentos y automatiza el análisis de documentación de comercio internacional.
        </p>
      </div>

      <ApiKeysClient initialKeys={(keys ?? []) as ApiKeyListItem[]} />
    </main>
  );
}