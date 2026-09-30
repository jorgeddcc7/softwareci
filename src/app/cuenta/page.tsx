import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { BotonPortal } from "./boton-portal";
import { FormLogo } from "./form-logo";

export const metadata = {
  title: "Mi cuenta",
};

export default async function CuentaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/cuenta");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "email, subscription_status, subscription_tier, analyses_count, monthly_analyses_count, monthly_analyses_month, company_name, logo_url"
    )
    .eq("id", user.id)
    .single();

  const tieneSuscripcion = profile?.subscription_status === "active";
  const tier = profile?.subscription_tier ?? "free";

  const mesActual = new Date().toISOString().slice(0, 7);
  const analisisMes =
    profile?.monthly_analyses_month === mesActual
      ? profile?.monthly_analyses_count ?? 0
      : 0;

  const nombrePlan = tieneSuscripcion
    ? tier === "pro"
      ? "Despacho Pro"
      : "Despacho"
    : "Prueba gratuita";

  const precioPlan = tieneSuscripcion
    ? tier === "pro"
      ? "249€/mes + IVA"
      : "79€/mes + IVA"
    : "Gratis";

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

      <main className="max-w-3xl mx-auto px-6 py-12 w-full flex-1">
        <h1 className="text-3xl font-bold text-foreground mb-8">Mi cuenta</h1>

        <div className="bg-surface border border-border rounded-xl p-6 mb-6">
          <p className="text-xs text-muted uppercase tracking-wide mb-1">
            Email
          </p>
          <p className="text-base text-foreground">{profile?.email}</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 mb-6">
          <p className="text-xs text-muted uppercase tracking-wide mb-1">
            Plan actual
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-semibold text-foreground">
                {nombrePlan}
              </p>
              <p className="text-sm text-muted mt-1">{precioPlan}</p>
            </div>
            {tieneSuscripcion && (
              <span className="px-3 py-1 bg-primary-light text-primary text-xs font-medium rounded-full">
                Activo
              </span>
            )}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 mb-6">
          <p className="text-xs text-muted uppercase tracking-wide mb-3">
            Uso del servicio
          </p>

          {!tieneSuscripcion && (
            <div>
              <p className="text-sm text-foreground mb-2">
                Análisis gratuitos usados:{" "}
                <strong>{profile?.analyses_count ?? 0} de 3</strong>
              </p>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      ((profile?.analyses_count ?? 0) / 3) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted">
                Al agotar los 3 análisis, necesitarás suscribirte para seguir
                usando la herramienta.
              </p>
            </div>
          )}

          {tieneSuscripcion && tier === "despacho" && (
            <div>
              <p className="text-sm text-foreground mb-2">
                Análisis este mes:{" "}
                <strong>{analisisMes} de 100</strong>
              </p>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min((analisisMes / 100) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted">
                El contador se reinicia al inicio de cada mes.
              </p>
            </div>
          )}

          {tieneSuscripcion && tier === "pro" && (
            <p className="text-sm text-foreground">
              Análisis <strong>ilimitados</strong>. Sin restricciones.
            </p>
          )}
        </div>

        <FormLogo
          esPro={tieneSuscripcion && tier === "pro"}
          companyNameActual={profile?.company_name ?? null}
          logoUrlActual={profile?.logo_url ?? null}
        />

        <div className="bg-surface border border-border rounded-xl p-6">
          <p className="text-xs text-muted uppercase tracking-wide mb-3">
            Gestionar suscripción
          </p>

          {tieneSuscripcion ? (
            <>
              <p className="text-sm text-muted mb-4">
                Puedes cambiar de plan, actualizar el método de pago o cancelar
                la suscripción desde el portal de Stripe.
              </p>
              <BotonPortal />
            </>
          ) : (
            <>
              <p className="text-sm text-muted mb-4">
                Suscríbete para seguir usando la herramienta sin límites.
              </p>
              <Link
                href="/precios"
                className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
              >
                Ver planes
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}