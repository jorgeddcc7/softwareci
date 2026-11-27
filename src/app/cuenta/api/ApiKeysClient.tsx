"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { ApiKeyListItem } from "@/types/api-keys";

type ApiResponse<T> = {
  success: boolean;
  error?: string;
} & T;

type NuevaClaveResponse = ApiResponse<{
  key: string;
  apiKeyRecord: ApiKeyListItem;
  warning: string;
}>;

type ListadoResponse = ApiResponse<{
  keys: ApiKeyListItem[];
}>;

function formatearFecha(
  fecha: string | null
): string {
  if (!fecha) return "Nunca";

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function ApiKeysClient({
  initialKeys,
}: {
  initialKeys: ApiKeyListItem[];
}) {
  const [keys, setKeys] =
    useState<ApiKeyListItem[]>(initialKeys);

  const [name, setName] = useState("");
  const [loadingCreate, setLoadingCreate] =
    useState(false);
  const [revokingId, setRevokingId] =
    useState<string | null>(null);

  const [revealedKey, setRevealedKey] =
    useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function cargarClaves() {
    const response = await fetch(
      "/api/cuenta/api-keys",
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const data =
      (await response.json()) as ListadoResponse;

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "No se han podido cargar las claves."
      );
    }

    setKeys(data.keys);
  }

  async function generarClave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);
    setNotice(null);
    setRevealedKey(null);
    setCopied(false);

    const cleanName = name.trim();

    if (cleanName.length < 2 || cleanName.length > 80) {
      setError(
        "El nombre debe tener entre 2 y 80 caracteres."
      );
      return;
    }

    setLoadingCreate(true);

    try {
      const response = await fetch(
        "/api/cuenta/api-keys",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: cleanName,
          }),
        }
      );

      const data =
        (await response.json()) as NuevaClaveResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "No se ha podido generar la clave."
        );
      }

      // La clave en claro solo se conserva en memoria para mostrarla.
      setRevealedKey(data.key);
      setName("");

      setKeys((previous) => [
        data.apiKeyRecord,
        ...previous.filter(
          (item) => item.id !== data.apiKeyRecord.id
        ),
      ]);

      setNotice(
        "API Key creada. Copia y guarda el secreto ahora."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error inesperado al generar la clave."
      );
    } finally {
      setLoadingCreate(false);
    }
  }

  async function copiarClave() {
    if (!revealedKey) return;

    try {
      await navigator.clipboard.writeText(revealedKey);
      setCopied(true);
    } catch {
      setError(
        "No se ha podido copiar automáticamente. Selecciona y copia la clave manualmente."
      );
    }
  }

  async function revocarClave(key: ApiKeyListItem) {
    const confirmado = window.confirm(
      `¿Quieres revocar la clave "${key.name}"? Los sistemas que la utilicen dejarán de autenticarse.`
    );

    if (!confirmado) return;

    setError(null);
    setNotice(null);
    setRevokingId(key.id);

    try {
      const response = await fetch(
        `/api/cuenta/api-keys/${encodeURIComponent(key.id)}`,
        {
          method: "DELETE",
        }
      );

      const data =
        (await response.json()) as ApiResponse<{}>;

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "No se ha podido revocar la clave."
        );
      }

      setKeys((previous) =>
        previous.map((item) =>
          item.id === key.id
            ? { ...item, is_active: false }
            : item
        )
      );

      setNotice(`La clave "${key.name}" ha sido revocada.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error inesperado al revocar la clave."
      );
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Generar una API Key
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Crea una clave independiente para cada
          integración. Por ejemplo, una para tu ERP y
          otra para tu TMS.
        </p>

        <form
          onSubmit={generarClave}
          className="mt-5 flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            maxLength={80}
            minLength={2}
            placeholder="Nombre de la integración (ej. Mi TMS)"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            required
          />

          <button
            type="submit"
            disabled={loadingCreate}
            className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingCreate
              ? "Generando..."
              : "Generar API Key"}
          </button>
        </form>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
          >
            {notice}
          </div>
        )}

        {revealedKey && (
          <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-5">
            <div className="mb-3">
              <h3 className="font-semibold text-amber-950">
                Tu nueva API Key
              </h3>

              <p className="mt-1 text-sm leading-5 text-amber-900">
                Esta es la única vez que se mostrará
                completa. Guárdala en un gestor de
                secretos o en la configuración segura
                de tu integración.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <code className="min-w-0 flex-1 break-all rounded-lg border border-amber-200 bg-white p-3 text-sm text-slate-900">
                {revealedKey}
              </code>

              <button
                type="button"
                onClick={copiarClave}
                className="shrink-0 rounded-lg bg-amber-900 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-800"
              >
                {copied
                  ? "Copiada"
                  : "Copiar al portapapeles"}
              </button>
            </div>

            <p className="mt-3 text-xs font-medium text-amber-900">
              No compartas esta clave ni la incluyas
              en código frontend o repositorios públicos.
            </p>

            <button
              type="button"
              onClick={() => {
                setRevealedKey(null);
                setCopied(false);
              }}
              className="mt-4 text-sm font-medium text-amber-950 underline underline-offset-2"
            >
              Cerrar y ocultar clave
            </button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Tus API Keys
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Las claves revocadas se conservan en el
              historial y no pueden volver a utilizarse.
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              setError(null);

              try {
                await cargarClaves();
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "No se ha podido actualizar el listado."
                );
              }
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Actualizar
          </button>
        </div>

        {keys.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-medium text-slate-800">
              Todavía no tienes API Keys
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Genera una para conectar tu ERP o TMS.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">
                    Nombre
                  </th>
                  <th className="px-6 py-3 font-medium">
                    Prefijo
                  </th>
                  <th className="px-6 py-3 font-medium">
                    Creada
                  </th>
                  <th className="px-6 py-3 font-medium">
                    Último uso
                  </th>
                  <th className="px-6 py-3 font-medium">
                    Estado
                  </th>
                  <th className="px-6 py-3 font-medium">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {keys.map((key) => (
                  <tr key={key.id}>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {key.name}
                    </td>

                    <td className="px-6 py-4">
                      <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                        {key.key_prefix}…
                      </code>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {formatearFecha(key.created_at)}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {formatearFecha(key.last_used_at)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={
                          key.is_active
                            ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800"
                            : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
                        }
                      >
                        {key.is_active
                          ? "Activa"
                          : "Revocada"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {key.is_active ? (
                        <button
                          type="button"
                          onClick={() =>
                            revocarClave(key)
                          }
                          disabled={
                            revokingId === key.id
                          }
                          className="font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          {revokingId === key.id
                            ? "Revocando..."
                            : "Revocar"}
                        </button>
                      ) : (
                        <span className="text-slate-400">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}