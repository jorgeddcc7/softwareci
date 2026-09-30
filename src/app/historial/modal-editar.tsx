"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Operation {
  id: string;
  factura_numero: string | null;
  client_name?: string | null;
  notes?: string | null;
}

export function ModalEditar({
  operation,
  onClose,
}: {
  operation: Operation;
  onClose: () => void;
}) {
  const [clientName, setClientName] = useState(operation.client_name ?? "");
  const [notes, setNotes] = useState(operation.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGuardar = async () => {
    setLoading(true);
    setError(null);

    try {
      const respuesta = await fetch("/api/operations/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operationId: operation.id,
          clientName: clientName.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(datos.error || "Error al guardar.");
        setLoading(false);
        return;
      }

      router.refresh();
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error desconocido al guardar."
      );
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl border border-border w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Editar operación
        </h2>
        <p className="text-sm text-muted mb-5">
          Factura: {operation.factura_numero ?? "—"}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Cliente
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ej: Importadora López S.L."
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Notas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Pendiente de certificado de origen"
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-high-bg border border-red-200 rounded-lg">
              <p className="text-sm text-high-text">{error}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={loading}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}