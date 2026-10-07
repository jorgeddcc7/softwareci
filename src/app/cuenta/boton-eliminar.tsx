"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function BotonEliminar({ tieneSuscripcion }: { tieneSuscripcion: boolean }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [textoConfirmacion, setTextoConfirmacion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const puedeConfirmar = textoConfirmacion === "ELIMINAR";

  const handleEliminar = async () => {
    if (!puedeConfirmar) return;

    setLoading(true);
    setError(null);

    try {
      const respuesta = await fetch("/api/cuenta/eliminar", {
        method: "POST",
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(datos.error || "Error al eliminar la cuenta.");
        setLoading(false);
        return;
      }

      // Cerrar sesión y redirigir
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error desconocido al eliminar."
      );
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setModalAbierto(true)}
        disabled={tieneSuscripcion}
        className={`px-6 py-3 text-sm font-medium rounded-lg transition-colors ${
          tieneSuscripcion
            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
            : "bg-white border border-red-300 text-red-600 hover:bg-red-50"
        }`}
      >
        Eliminar mi cuenta y mis datos
      </button>

      {tieneSuscripcion && (
        <p className="text-xs text-muted mt-3">
          Cancela primero tu suscripción desde el portal de cliente.
        </p>
      )}

      {modalAbierto && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !loading && setModalAbierto(false)}
        >
          <div
            className="bg-surface rounded-xl border border-border w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-red-600 mb-2">
              Eliminar cuenta
            </h2>
            <p className="text-sm text-muted mb-4 leading-relaxed">
              Esta acción es <strong>permanente e irreversible</strong>. Se
              eliminarán todos tus datos: tu cuenta, tu plan, tu histórico de
              operaciones y tu logo personalizado (si lo tenías subido).
            </p>

            <p className="text-sm text-foreground mb-4">
              Para confirmar, escribe <strong>ELIMINAR</strong> en el campo de
              abajo:
            </p>

            <input
              type="text"
              value={textoConfirmacion}
              onChange={(e) => setTextoConfirmacion(e.target.value)}
              placeholder="ELIMINAR"
              disabled={loading}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary mb-4"
            />

            {error && (
              <div className="mb-4 p-3 bg-high-bg border border-red-200 rounded-lg">
                <p className="text-sm text-high-text">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setModalAbierto(false);
                  setTextoConfirmacion("");
                  setError(null);
                }}
                disabled={loading}
                className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                disabled={!puedeConfirmar || loading}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  puedeConfirmar && !loading
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                {loading ? "Eliminando..." : "Eliminar cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}