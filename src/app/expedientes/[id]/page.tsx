import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { Validacion } from "@/types/documentos";
import { EstadoExpedienteControl } from "./estado-expediente";
import { BorradorReclamacion } from "./borrador-reclamacion";
import { esEstadoExpediente } from "@/types/expedientes";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Detalle del expediente",
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// El contenido de un JSON guardado se comprueba en tiempo de ejecución.
// No basta con convertirlo mediante "as Validacion[]".
function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return (
    typeof valor === "object" &&
    valor !== null &&
    !Array.isArray(valor)
  );
}

function esArrayTexto(valor: unknown): valor is string[] {
  return (
    Array.isArray(valor) &&
    valor.every((item) => typeof item === "string")
  );
}

function esValidacion(valor: unknown): valor is Validacion {
  if (!esObjeto(valor)) return false;

  return (
    typeof valor.regla === "string" &&
    typeof valor.descripcion === "string" &&
    (
      valor.resultado === "ok" ||
      valor.resultado === "discrepancia" ||
      valor.resultado === "no_comprobable"
    ) &&
    (
      valor.severidad === "alta" ||
      valor.severidad === "media" ||
      valor.severidad === "baja"
    ) &&
    esArrayTexto(valor.documentos) &&
    esArrayTexto(valor.campos) &&
    esObjeto(valor.valores) &&
    typeof valor.nota === "string" &&
    (
      valor.accion_sugerida === undefined ||
      typeof valor.accion_sugerida === "string"
    )
  );
}

function leerValidaciones(valor: unknown): {
  validaciones: Validacion[];
  formatoIncompleto: boolean;
} {
  if (!Array.isArray(valor)) {
    return {
      validaciones: [],
      formatoIncompleto: true,
    };
  }

  const validaciones = valor.filter(esValidacion);

  return {
    validaciones,
    formatoIncompleto: validaciones.length !== valor.length,
  };
}

function presentarResultado(resultado: string | null) {
  switch (resultado) {
    case "no_apto":
      return {
        texto: "NO APTO — Hay discrepancias graves",
        clase: "bg-high-bg text-high-text",
      };

    case "revisar":
      return {
        texto: "REVISAR — Hay puntos a comprobar",
        clase: "bg-medium-bg text-medium-text",
      };

    case "apto":
      return {
        texto: "APTO — Sin discrepancias detectadas",
        clase: "bg-low-bg text-low-text",
      };

    default:
      return {
        texto: "Resultado no disponible",
        clase: "bg-slate-100 text-slate-600",
      };
  }
}

function presentarTransporte(tipo: string | null) {
  switch (tipo) {
    case "bill_of_lading":
      return "B/L";
    case "air_waybill":
      return "AWB";
    case "cmr":
      return "CMR";
    default:
      return tipo || "No indicado";
  }
}

function presentarFecha(fecha: string) {
  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) return "No disponible";

  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function ErrorCarga() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <Link
        href="/historial"
        className="text-sm text-primary hover:underline"
      >
        ← Volver al historial
      </Link>

      <div
        role="alert"
        className="mt-6 p-6 bg-surface border border-border rounded-xl"
      >
        <h1 className="text-xl font-semibold text-foreground mb-2">
          No se pudo cargar el expediente
        </h1>
        <p className="text-sm text-muted">
          No hemos podido comprobar el acceso o recuperar los datos.
          Vuelve a intentarlo más tarde.
        </p>
      </div>
    </main>
  );
}

function FichaValidacion({ validacion: v }: { validacion: Validacion }) {
  return (
    <article className="px-5 py-4">
      <p className="font-medium text-foreground text-sm">
        <span className="font-mono text-xs text-muted mr-2">
          [{v.regla}]
        </span>
        {v.descripcion}
      </p>

      <p className="text-xs text-muted mt-2">
        Severidad: {v.severidad}
      </p>

      {v.documentos.length > 0 && (
        <p className="text-xs text-muted mt-1">
          Documentos: {v.documentos.join(", ")}
        </p>
      )}

      {v.campos.length > 0 && (
        <p className="text-xs text-muted mt-1 break-words">
          Campos: {v.campos.join(", ")}
        </p>
      )}

      {v.nota && (
        <p className="text-sm text-muted mt-2 whitespace-pre-wrap">
          {v.nota}
        </p>
      )}

      {v.accion_sugerida && (
        <p className="text-sm text-primary mt-2 whitespace-pre-wrap">
          <strong>Acción sugerida:</strong> {v.accion_sugerida}
        </p>
      )}

      {Object.keys(v.valores).length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-muted">
            Ver valores guardados
          </summary>

          <pre className="mt-2 p-3 bg-slate-50 rounded-lg text-xs text-foreground whitespace-pre-wrap break-words max-h-72 overflow-auto">
            {JSON.stringify(v.valores, null, 2)}
          </pre>
        </details>
      )}
    </article>
  );
}

function GrupoValidaciones({
  titulo,
  clase,
  validaciones,
}: {
  titulo: string;
  clase: string;
  validaciones: Validacion[];
}) {
  if (validaciones.length === 0) return null;

  return (
    <section className="mb-4 bg-surface border border-border rounded-lg overflow-hidden">
      <h3 className={`px-5 py-3 font-semibold text-sm ${clase}`}>
        {titulo} ({validaciones.length})
      </h3>

      <div className="divide-y divide-border">
        {validaciones.map((v, index) => (
          <FichaValidacion
            key={`${v.regla}-${index}`}
            validacion={v}
          />
        ))}
      </div>
    </section>
  );
}

export default async function ExpedientePage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?redirectTo=${encodeURIComponent(`/expedientes/${id}`)}`
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_tier")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("Error al comprobar acceso al expediente:", {
      code: profileError?.code ?? "PROFILE_NOT_FOUND",
    });

    return <ErrorCarga />;
  }

  const esPro =
    profile.subscription_status === "active" &&
    profile.subscription_tier === "pro";

  if (!esPro) {
    redirect("/historial");
  }

  if (!UUID_REGEX.test(id)) {
    notFound();
  }

  const { data: operation, error: operationError } = await supabase
    .from("operations")
    .select(
      "id, factura_numero, packing_numero, transporte_numero, transporte_tipo, resultado_global, validaciones, created_at, client_name, notes, estado_expediente, estado_actualizado_at"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (operationError) {
    console.error("Error al cargar expediente:", {
      code: operationError.code,
    });

    return <ErrorCarga />;
  }

  // Mismo comportamiento si no existe o pertenece a otro usuario.
  if (!operation) {
    notFound();
  }

  const estadoExpediente = esEstadoExpediente(
    operation.estado_expediente
  )
    ? operation.estado_expediente
    : null;

  const { validaciones, formatoIncompleto } = leerValidaciones(
    operation.validaciones
  );

  const resultado = presentarResultado(operation.resultado_global);

  const altas = validaciones.filter(
    (v) => v.resultado === "discrepancia" && v.severidad === "alta"
  );

  const medias = validaciones.filter(
    (v) => v.resultado === "discrepancia" && v.severidad === "media"
  );

  const bajas = validaciones.filter(
    (v) => v.resultado === "discrepancia" && v.severidad === "baja"
  );

  const noComprobables = validaciones.filter(
    (v) => v.resultado === "no_comprobable"
  );

  const correctas = validaciones.filter((v) => v.resultado === "ok");

  const discrepancias = altas.length + medias.length + bajas.length;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="font-semibold text-foreground text-base"
          >
            Controlador de Documentos
          </Link>

          <Link
            href="/historial"
            className="text-sm text-muted hover:text-foreground"
          >
            ← Volver al historial
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 w-full flex-1">
        <h1 className="text-3xl font-bold text-foreground mb-2 break-words">
          Expediente — Factura {operation.factura_numero ?? "sin número"}
        </h1>

        <p className="text-sm text-muted">
          Creado: {presentarFecha(operation.created_at)} UTC
        </p>

        <p className="text-xs text-muted mt-2 break-all">
          Identificador: {operation.id}
        </p>

        <section className="mt-6 p-5 bg-surface border border-border rounded-xl">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Datos de la operación
          </h2>

          <dl className="grid sm:grid-cols-2 gap-5 text-sm">
            <div>
              <dt className="text-muted">Cliente</dt>
              <dd className="mt-1 text-foreground break-words">
                {operation.client_name || "—"}
              </dd>
            </div>

            <div>
              <dt className="text-muted">Factura</dt>
              <dd className="mt-1 text-foreground break-words">
                {operation.factura_numero ?? "—"}
              </dd>
            </div>

            <div>
              <dt className="text-muted">Packing list</dt>
              <dd className="mt-1 text-foreground break-words">
                {operation.packing_numero ?? "—"}
              </dd>
            </div>

            <div>
              <dt className="text-muted">Documento de transporte</dt>
              <dd className="mt-1 text-foreground break-words">
                {operation.transporte_numero
                  ? `${presentarTransporte(operation.transporte_tipo)}: ${operation.transporte_numero}`
                  : "—"}
              </dd>
            </div>

            {operation.notes && (
              <div className="sm:col-span-2">
                <dt className="text-muted">Notas</dt>
                <dd className="mt-1 text-foreground whitespace-pre-wrap break-words">
                  {operation.notes}
                </dd>
              </div>
            )}
          </dl>
        </section>

        <EstadoExpedienteControl
          key={`${operation.id}-${operation.estado_expediente ?? "sin-estado"}-${operation.estado_actualizado_at ?? "sin-fecha"}`}
          operationId={operation.id}
          estadoActual={estadoExpediente}
          actualizadoAt={operation.estado_actualizado_at}
          hayPuntosPorRevisar={
            formatoIncompleto ||
            validaciones.length === 0 ||
            operation.resultado_global !== "apto" ||
            discrepancias > 0 ||
            noComprobables.length > 0
          }
        />

        <section className={`mt-6 p-5 rounded-xl ${resultado.clase}`}>
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-2">
            Resultado del análisis documental
          </h2>

          <p className="font-semibold">{resultado.texto}</p>

          <p className="text-sm mt-2">
            Este resultado no constituye una autorización de despacho
            ni una comprobación de cumplimiento aduanero completo.
          </p>
        </section>

        <div className="mt-4 p-4 bg-slate-50 border border-border rounded-lg text-sm text-muted">
          Este expediente conserva las referencias y validaciones guardadas
          del análisis. Los PDF originales y las advertencias del análisis
          inicial no están disponibles desde esta página.
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Validaciones guardadas
          </h2>

          {formatoIncompleto && (
            <div
              role="alert"
              className="mb-4 p-4 bg-medium-bg text-medium-text rounded-lg text-sm"
            >
              No se han podido recuperar todas las validaciones en el
              formato esperado. Se muestran únicamente las entradas
              compatibles. La ausencia de una entrada no significa que
              esa comprobación fuera correcta.
            </div>
          )}

          {validaciones.length === 0 ? (
            <div className="p-5 bg-surface border border-border rounded-lg text-sm text-muted">
              No hay validaciones disponibles para mostrar.
            </div>
          ) : (
            <>
              <div className="mb-5 p-4 bg-slate-100 rounded-lg text-sm text-slate-600">
                <strong>Resumen de entradas recuperadas:</strong>{" "}
                {validaciones.length} validaciones · {discrepancias}{" "}
                discrepancias · {noComprobables.length} no comprobables ·{" "}
                {correctas.length} correctas
              </div>

              <GrupoValidaciones
                titulo="Discrepancias graves"
                clase="bg-high-bg text-high-text"
                validaciones={altas}
              />

              <GrupoValidaciones
                titulo="Discrepancias medias"
                clase="bg-medium-bg text-medium-text"
                validaciones={medias}
              />

              <GrupoValidaciones
                titulo="Discrepancias leves"
                clase="bg-low-bg text-low-text"
                validaciones={bajas}
              />

              {noComprobables.length > 0 && (
                <details className="mb-4 bg-surface border border-border rounded-lg overflow-hidden">
                  <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-slate-600">
                    Reglas no comprobables ({noComprobables.length})
                  </summary>

                  <p className="px-5 pb-3 text-xs text-muted">
                    Son comprobaciones que no se pudieron completar
                    con la información disponible.
                  </p>

                  <div className="divide-y divide-border border-t border-border">
                    {noComprobables.map((v, index) => (
                      <FichaValidacion
                        key={`${v.regla}-${index}`}
                        validacion={v}
                      />
                    ))}
                  </div>
                </details>
              )}

              {correctas.length > 0 && (
                <details className="bg-surface border border-border rounded-lg overflow-hidden">
                  <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-slate-600">
                    Comprobaciones correctas ({correctas.length})
                  </summary>

                  <div className="divide-y divide-border border-t border-border">
                    {correctas.map((v, index) => (
                      <FichaValidacion
                        key={`${v.regla}-${index}`}
                        validacion={v}
                      />
                    ))}
                  </div>
                </details>
              )}
            </>
          )}
        </section>

        <BorradorReclamacion
          key={operation.id}
          facturaNumero={operation.factura_numero}
          packingNumero={operation.packing_numero}
          transporteNumero={operation.transporte_numero}
          transporteTipo={operation.transporte_tipo}
          formatoIncompleto={formatoIncompleto}
          validaciones={validaciones.map((v) => ({
            regla: v.regla,
            descripcion: v.descripcion,
            resultado: v.resultado,
            severidad: v.severidad,
            nota: v.nota,
          }))}
        />
      </main>
    </div>
  );
}