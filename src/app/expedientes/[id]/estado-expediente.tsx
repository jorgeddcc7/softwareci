"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ETIQUETAS_ESTADO,
  esEstadoExpediente,
  type EstadoExpediente,
} from "@/types/expedientes";

interface Props {
  operationId: string;
  estadoActual: EstadoExpediente | null;
  actualizadoAt: string | null;
  hayPuntosPorRevisar: boolean;
}

export function EstadoExpedienteControl({
  operationId,
  estadoActual,
  actualizadoAt,
  hayPuntosPorRevisar,
}: Props) {
  const router = useRouter();

  const [seleccionado, setSeleccionado] = useState<
    EstadoExpediente | ""
  >(estadoActual ?? "");

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    if (
      !esEstadoExpediente(seleccionado) ||
      seleccionado === estadoActual ||
      guardando
    ) {
      return;
    }

    if (seleccionado === "resuelto") {
      const mensaje = hayPuntosPorRevisar
        ? "El análisis conserva discrepancias, puntos no comprobables o información incompleta. Marcar como resuelto solo cierra tu revisión; no elimina esas incidencias. ¿Quieres continuar?"
        : "Marcar como resuelto significa que has terminado tu revisión. No constituye una autorización de despacho. ¿Quieres continuar?";

      if (!window.confirm(mensaje)) return;
    }

    setGuardando(true);
    setError(null);

    try {
      const respuesta = await fetch(
        `/api/expedientes/${operationId}/estado`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            estado: seleccionado,
            estado_anterior: estadoActual,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(datos.error || "No se pudo guardar el estado.");
        return;
      }

      // La página recuperará el estado confirmado por la base de datos.
      router.refresh();
    } catch {
      setError(
        "No se pudo confirmar el guardado. Recarga el expediente antes de volver a intentarlo."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="mt-6 p-5 bg-surface border border-border rounded-xl">
      <h2 className="text-lg font-semibold text-foreground">
        Estado del expediente
      </h2>

      <p className="text-sm text-muted mt-2">
        Estado actual:{" "}
        <strong className="text-foreground">
          {estadoActual
            ? ETIQUETAS_ESTADO[estadoActual]
            : "Estado no asignado"}
        </strong>
      </p>

      {actualizadoAt && (
        <p className="text-xs text-muted mt-1">
          Último cambio:{" "}
          {new Date(actualizadoAt).toLocaleString("es-ES", {
            timeZone: "UTC",
          })}{" "}
          UTC
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <label className="flex-1">
          <span className="sr-only">Nuevo estado del expediente</span>

          <select
            value={seleccionado}
            disabled={guardando}
            onChange={(event) => {
              const valor = event.target.value;

              if (esEstadoExpediente(valor)) {
                setSeleccionado(valor);
                setError(null);
              }
            }}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-foreground disabled:opacity-50"
          >
            <option value="" disabled>
              Selecciona un estado
            </option>
            <option value="pendiente">Pendiente</option>
            <option value="en_revision">En revisión</option>
            <option value="resuelto">Resuelto</option>
          </select>
        </label>

        <button
          type="button"
          onClick={guardar}
          disabled={
            guardando ||
            seleccionado === "" ||
            seleccionado === estadoActual
          }
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar estado"}
        </button>
      </div>

      <p className="text-xs text-muted mt-3">
        “Resuelto” indica que has cerrado tu revisión. El resultado
        automático y las validaciones guardadas no cambian.
        Puedes reabrirlo seleccionando “En revisión”.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 p-3 bg-high-bg text-high-text rounded-lg text-sm"
        >
          <p>{error}</p>

          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-2 underline"
          >
            Recargar expediente
          </button>
        </div>
      )}
    </section>
  );
}