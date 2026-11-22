"use client";

import { useState } from "react";
import { ModalEditar } from "./modal-editar";
import Link from "next/link";

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
      <div className="overflow-x-auto">
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
                <td className="px-5 py-3 text-sm text-right">
                  <div className="flex items-center justify-end gap-4 whitespace-nowrap">
                    <Link
                      href={`/expedientes/${op.id}`}
                      className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                    >
                      Abrir expediente →
                    </Link>

                    <button
                      type="button"
                      onClick={() => setEditando(op)}
                      className="text-xs text-primary hover:text-primary-hover transition-colors"
                    >
                      Editar
                    </button>
                  </div>
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