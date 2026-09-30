"use client";

import { useState } from "react";
import { ModalEditar } from "./modal-editar";

interface Operation {
  id: string;
  factura_numero: string | null;
  packing_numero: string | null;
  transporte_numero: string | null;
  transporte_tipo: string | null;
  resultado_global: string | null;
  created_at: string;
  client_name: string | null;
  notes: string | null;
}

export function HistorialCliente({
  operations,
}: {
  operations: Operation[];
}) {
  const [editando, setEditando] = useState<Operation | null>(null);

  return (
    <>
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-border">
            <tr>
              <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-5 py-3">
                Fecha
              </th>
              <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-5 py-3">
                Cliente
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
              <th className="px-5 py-3"></th>
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
                  {op.client_name ?? "—"}
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
                <td className="px-5 py-3 text-sm text-right">
                  <button
                    onClick={() => setEditando(op)}
                    className="text-xs text-primary hover:text-primary-hover transition-colors"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editando && (
        <ModalEditar
          operation={editando}
          onClose={() => setEditando(null)}
        />
      )}
    </>
  );
}