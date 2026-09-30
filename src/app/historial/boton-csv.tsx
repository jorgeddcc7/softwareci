"use client";

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

export function BotonExportarCSV({
  operations,
}: {
  operations: Operation[];
}) {
  const handleExport = () => {
    const headers = [
      "Fecha",
      "Cliente",
      "Factura",
      "Packing",
      "Transporte",
      "Resultado",
      "Notas",
    ];

    const rows = operations.map((op) => {
      const fecha = new Date(op.created_at).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      const transporte = op.transporte_numero
        ? `${op.transporte_tipo === "air_waybill" ? "AWB" : op.transporte_tipo === "cmr" ? "CMR" : "B/L"} ${op.transporte_numero}`
        : "";

      const resultado =
        op.resultado_global === "no_apto"
          ? "NO APTO"
          : op.resultado_global === "revisar"
            ? "REVISAR"
            : "APTO";

      return [
        fecha,
        op.client_name ?? "",
        op.factura_numero ?? "",
        op.packing_numero ?? "",
        transporte,
        resultado,
        op.notes ?? "",
      ];
    });

    const escapar = (valor: string) => {
      if (
        valor.includes(";") ||
        valor.includes('"') ||
        valor.includes("\n")
      ) {
        return `"${valor.replace(/"/g, '""')}"`;
      }
      return valor;
    };

    const SEPARADOR = ";";

    const lineas = [
      headers.map(escapar).join(SEPARADOR),
      ...rows.map((row) => row.map(escapar).join(SEPARADOR)),
    ];

    const csv = lineas.join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });

    const fecha = new Date().toISOString().slice(0, 10);
    const nombreArchivo = `historial-operaciones-${fecha}.csv`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 bg-white border border-border text-foreground text-sm font-medium rounded-lg hover:border-primary transition-colors"
    >
      Exportar a CSV
    </button>
  );
}