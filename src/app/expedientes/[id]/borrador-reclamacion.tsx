"use client";

import { useId, useState } from "react";
import type { Validacion } from "@/types/documentos";

type IncidenciaBorrador = Pick<
  Validacion,
  "regla" | "descripcion" | "resultado" | "severidad" | "nota"
>;

interface Props {
  facturaNumero: string | null;
  packingNumero: string | null;
  transporteNumero: string | null;
  transporteTipo: string | null;
  validaciones: IncidenciaBorrador[];
  formatoIncompleto: boolean;
}

interface Borrador {
  asunto: string;
  cuerpo: string;
  origen: string;
}

function textoEnUnaLinea(valor: string): string {
  return valor.replace(/[\r\n]+/g, " ").trim();
}

function nombreTransporte(tipo: string | null): string {
  switch (tipo) {
    case "bill_of_lading":
      return "B/L";
    case "air_waybill":
      return "AWB";
    case "cmr":
      return "CMR";
    default:
      return "Documento de transporte";
  }
}

export function BorradorReclamacion({
  facturaNumero,
  packingNumero,
  transporteNumero,
  transporteTipo,
  validaciones,
  formatoIncompleto,
}: Props) {
  const id = useId();

  // El índice original distingue incidencias con la misma regla.
  const candidatas = validaciones
    .map((validacion, indice) => ({ validacion, indice }))
    .filter(
      ({ validacion }) =>
        validacion.resultado === "discrepancia" ||
        validacion.resultado === "no_comprobable"
    );

  const [seleccionadas, setSeleccionadas] = useState<number[]>([]);
  const [destinatario, setDestinatario] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [firma, setFirma] = useState("");

  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [editado, setEditado] = useState(false);
  const [copiando, setCopiando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const elegidas = candidatas.filter(({ indice }) =>
    seleccionadas.includes(indice)
  );

  // Permite detectar cambios en las entradas sin sobrescribir
  // el texto que el usuario haya editado.
  const origenActual = JSON.stringify({
    facturaNumero,
    packingNumero,
    transporteNumero,
    transporteTipo,
    destinatario,
    empresa,
    firma,
    incidencias: elegidas,
  });

  const desactualizado =
    borrador !== null && borrador.origen !== origenActual;

  function limpiarAvisos() {
    setMensaje(null);
    setError(null);
  }

  function cambiarSeleccion(indice: number) {
    setSeleccionadas((actuales) =>
      actuales.includes(indice)
        ? actuales.filter((valor) => valor !== indice)
        : [...actuales, indice]
    );

    limpiarAvisos();
  }

  function generar() {
    if (elegidas.length === 0) return;

    if (
      borrador &&
      editado &&
      !window.confirm(
        "Regenerar reemplazará el asunto y el cuerpo que has editado. ¿Quieres continuar?"
      )
    ) {
      return;
    }

    const referencias: string[] = [];

    if (facturaNumero?.trim()) {
      referencias.push(
        `factura ${textoEnUnaLinea(facturaNumero)}`
      );
    }

    if (packingNumero?.trim()) {
      referencias.push(
        `packing list ${textoEnUnaLinea(packingNumero)}`
      );
    }

    if (transporteNumero?.trim()) {
      referencias.push(
        `${nombreTransporte(transporteTipo)} ${textoEnUnaLinea(
          transporteNumero
        )}`
      );
    }

    const referenciaAsunto = facturaNumero?.trim()
      ? `Factura ${textoEnUnaLinea(facturaNumero)}`
      : packingNumero?.trim()
        ? `Packing list ${textoEnUnaLinea(packingNumero)}`
        : transporteNumero?.trim()
          ? `${nombreTransporte(transporteTipo)} ${textoEnUnaLinea(
              transporteNumero
            )}`
          : "Revisión documental";

    const saludo = destinatario.trim()
      ? `Hola, ${textoEnUnaLinea(destinatario)}:`
      : "Hola:";

    const introduccion = referencias.length > 0
      ? `Durante la revisión de la documentación correspondiente a ${referencias.join(
          " · "
        )}, hemos identificado los siguientes puntos que requieren aclaración:`
      : "Durante la revisión de la documentación, hemos identificado los siguientes puntos que requieren aclaración:";

    const puntos = elegidas
      .map(({ validacion }, indice) => {
        const esDiscrepancia =
          validacion.resultado === "discrepancia";

        const tipo = esDiscrepancia
          ? "Discrepancia detectada"
          : "Comprobación no realizable";

        const solicitud = esDiscrepancia
          ? "Por favor, confirma los datos correctos y remite, cuando corresponda, los documentos rectificados."
          : "Por favor, facilita la información necesaria para completar esta comprobación. Este punto no implica por sí solo que el documento sea incorrecto.";

        return [
          `${indice + 1}. ${tipo}`,
          validacion.descripcion.trim(),
          validacion.nota.trim(),
          solicitud,
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n");

    const cuerpo = [
      empresa.trim()
        ? `A la atención de ${textoEnUnaLinea(empresa)}`
        : "",
      saludo,
      introduccion,
      puntos,
      "Gracias por tu colaboración.",
      firma.trim(),
    ]
      .filter(Boolean)
      .join("\n\n");

    setBorrador({
      asunto: `Solicitud de aclaración documental — ${referenciaAsunto}`,
      cuerpo,
      origen: origenActual,
    });

    setEditado(false);
    limpiarAvisos();
    setMensaje("Borrador generado. Revísalo antes de compartirlo.");
  }

  async function copiar(tipo: "asunto" | "cuerpo" | "todo") {
    if (!borrador || desactualizado || copiando) return;

    const texto =
      tipo === "asunto"
        ? borrador.asunto
        : tipo === "cuerpo"
          ? borrador.cuerpo
          : `Asunto: ${borrador.asunto}\n\n${borrador.cuerpo}`;

    if (!texto.trim()) {
      setError("No hay texto para copiar.");
      return;
    }

    limpiarAvisos();
    setCopiando(true);

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Portapapeles no disponible.");
      }

      await navigator.clipboard.writeText(texto);

      setMensaje(
        tipo === "asunto"
          ? "Asunto copiado."
          : tipo === "cuerpo"
            ? "Cuerpo copiado."
            : "Asunto y cuerpo copiados."
      );
    } catch {
      setError(
        "No se pudo copiar automáticamente. Selecciona el texto del asunto o del cuerpo y cópialo manualmente."
      );
    } finally {
      setCopiando(false);
    }
  }

  const grupos = [
    {
      titulo: "Discrepancias",
      resultado: "discrepancia" as const,
    },
    {
      titulo: "Comprobaciones no realizables",
      resultado: "no_comprobable" as const,
    },
  ];

  const claseCampo =
    "w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground text-sm";

  const claseBotonSecundario =
    "px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <section className="mt-8 p-5 bg-surface border border-border rounded-xl">
      <h2 className="text-xl font-semibold text-foreground">
        Preparar solicitud de corrección
      </h2>

      <p className="mt-2 text-sm text-muted">
        Selecciona los puntos que corresponde reclamar a este
        destinatario. Generaremos un borrador que podrás revisar,
        editar y copiar. No se envía ningún correo.
      </p>

      {formatoIncompleto && (
        <div className="mt-4 p-3 bg-medium-bg text-medium-text rounded-lg text-sm">
          Algunas validaciones no pudieron recuperarse. Este borrador
          solo puede incluir las entradas disponibles; no representa
          necesariamente todos los puntos del análisis.
        </div>
      )}

      {candidatas.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          No hay discrepancias ni comprobaciones no realizables
          disponibles para incluir en una solicitud.
        </p>
      ) : (
        <>
          <div className="mt-5 space-y-5">
            {grupos.map((grupo) => {
              const entradas = candidatas.filter(
                ({ validacion }) =>
                  validacion.resultado === grupo.resultado
              );

              if (entradas.length === 0) return null;

              return (
                <fieldset key={grupo.resultado}>
                  <legend className="font-semibold text-sm text-foreground mb-2">
                    {grupo.titulo} ({entradas.length})
                  </legend>

                  <div className="space-y-2">
                    {entradas.map(({ validacion, indice }) => (
                      <label
                        key={indice}
                        className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={seleccionadas.includes(indice)}
                          onChange={() => cambiarSeleccion(indice)}
                          className="mt-1 shrink-0"
                        />

                        <span className="min-w-0">
                          <span className="block text-sm text-foreground break-words">
                            <span className="font-mono text-xs text-muted mr-2">
                              [{validacion.regla}]
                            </span>
                            {validacion.descripcion}
                          </span>

                          <span className="block text-xs text-muted mt-1">
                            Severidad: {validacion.severidad}
                          </span>

                          {validacion.nota && (
                            <span className="block text-sm text-muted mt-2 whitespace-pre-wrap break-words">
                              {validacion.nota}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            })}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div>
              <label
                htmlFor={`${id}-destinatario`}
                className="block text-sm font-medium text-foreground mb-1"
              >
                Nombre del destinatario — opcional
              </label>
              <input
                id={`${id}-destinatario`}
                type="text"
                value={destinatario}
                maxLength={200}
                onChange={(event) => {
                  setDestinatario(event.target.value);
                  limpiarAvisos();
                }}
                className={claseCampo}
                placeholder="Ej.: María"
              />
            </div>

            <div>
              <label
                htmlFor={`${id}-empresa`}
                className="block text-sm font-medium text-foreground mb-1"
              >
                Empresa destinataria — opcional
              </label>
              <input
                id={`${id}-empresa`}
                type="text"
                value={empresa}
                maxLength={200}
                onChange={(event) => {
                  setEmpresa(event.target.value);
                  limpiarAvisos();
                }}
                className={claseCampo}
                placeholder="Ej.: Proveedor S.L."
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor={`${id}-firma`}
                className="block text-sm font-medium text-foreground mb-1"
              >
                Firma del remitente — opcional
              </label>
              <textarea
                id={`${id}-firma`}
                value={firma}
                maxLength={2000}
                rows={3}
                onChange={(event) => {
                  setFirma(event.target.value);
                  limpiarAvisos();
                }}
                className={claseCampo}
                placeholder={"Tu nombre\nEmpresa"}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              type="button"
              onClick={generar}
              disabled={elegidas.length === 0}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {borrador ? "Regenerar borrador" : "Generar borrador"}
            </button>

            <span className="text-sm text-muted">
              {elegidas.length} puntos seleccionados
            </span>
          </div>

          {borrador && (
            <div className="mt-6 pt-6 border-t border-border">
              {desactualizado && (
                <div
                  role="alert"
                  className="mb-4 p-3 bg-medium-bg text-medium-text rounded-lg text-sm"
                >
                  Han cambiado las incidencias seleccionadas o el
                  contexto. El texto conserva la versión anterior.
                  Regenera el borrador antes de copiarlo.
                </div>
              )}

              <div>
                <label
                  htmlFor={`${id}-asunto`}
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Asunto
                </label>
                <input
                  id={`${id}-asunto`}
                  type="text"
                  value={borrador.asunto}
                  onChange={(event) => {
                    const asunto = event.target.value;

                    setBorrador((actual) =>
                      actual ? { ...actual, asunto } : actual
                    );

                    setEditado(true);
                    limpiarAvisos();
                  }}
                  className={claseCampo}
                />
              </div>

              <div className="mt-4">
                <label
                  htmlFor={`${id}-cuerpo`}
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Cuerpo del correo
                </label>
                <textarea
                  id={`${id}-cuerpo`}
                  value={borrador.cuerpo}
                  rows={16}
                  onChange={(event) => {
                    const cuerpo = event.target.value;

                    setBorrador((actual) =>
                      actual ? { ...actual, cuerpo } : actual
                    );

                    setEditado(true);
                    limpiarAvisos();
                  }}
                  className={claseCampo}
                />
              </div>

              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => copiar("asunto")}
                  disabled={
                    copiando ||
                    desactualizado ||
                    !borrador.asunto.trim()
                  }
                  className={claseBotonSecundario}
                >
                  Copiar asunto
                </button>

                <button
                  type="button"
                  onClick={() => copiar("cuerpo")}
                  disabled={
                    copiando ||
                    desactualizado ||
                    !borrador.cuerpo.trim()
                  }
                  className={claseBotonSecundario}
                >
                  Copiar cuerpo
                </button>

                <button
                  type="button"
                  onClick={() => copiar("todo")}
                  disabled={
                    copiando ||
                    desactualizado ||
                    !borrador.asunto.trim() ||
                    !borrador.cuerpo.trim()
                  }
                  className={claseBotonSecundario}
                >
                  {copiando ? "Copiando..." : "Copiar todo"}
                </button>
              </div>
            </div>
          )}

          <p className="mt-4 text-xs text-muted">
            Revisa las descripciones y notas antes de compartirlas:
            pueden contener información interna o datos que no
            correspondan al destinatario. No se incluyen automáticamente
            las notas del expediente ni los valores técnicos.
          </p>

          <p className="mt-2 text-xs text-muted">
            El borrador no se guarda en el expediente. Recargar o salir
            de la página puede hacer que pierdas su contenido. Generarlo
            o copiarlo no modifica el estado ni resuelve incidencias.
          </p>

          <div role="status" aria-live="polite" className="mt-3">
            {mensaje && (
              <p className="text-sm text-primary">{mensaje}</p>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="mt-3 text-sm text-high-text"
            >
              {error}
            </p>
          )}
        </>
      )}
    </section>
  );
}