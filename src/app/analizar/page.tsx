"use client";

import { useState } from "react";

// ------------------------------------------------------------
// Tipos de la respuesta del API
// ------------------------------------------------------------

interface Validacion {
  regla: string;
  descripcion: string;
  resultado: "ok" | "discrepancia" | "no_comprobable";
  severidad: "alta" | "media" | "baja";
  documentos: string[];
  campos: string[];
  valores: Record<string, unknown>;
  nota: string;
}

interface ResultadoAnalisis {
  exito: boolean;
  factura: {
    numero: string | null;
    fecha: string | null;
    vendedor: string | null;
    comprador: string | null;
  };
  packing: {
    numero: string | null;
    referencia_factura: string | null;
  };
  resultado_global: "apto" | "revisar" | "no_apto";
  validaciones: Validacion[];
  advertencias: string[];
}

// ------------------------------------------------------------
// Página
// ------------------------------------------------------------

export default function AnalizarPage() {
  const [factura, setFactura] = useState<File | null>(null);
  const [packing, setPacking] = useState<File | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAnalisis | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalizar() {
    if (!factura || !packing) {
      setError("Selecciona los dos archivos antes de analizar.");
      return;
    }

    setAnalizando(true);
    setError(null);
    setResultado(null);

    try {
      const formData = new FormData();
      formData.append("factura", factura);
      formData.append("packing", packing);

      const respuesta = await fetch("/api/analizar", {
        method: "POST",
        body: formData,
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(datos.error || "Error al procesar los documentos.");
        return;
      }

      setResultado(datos as ResultadoAnalisis);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error desconocido al analizar."
      );
    } finally {
      setAnalizando(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 2rem" }}>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
        Analizar documentos
      </h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Sube la factura comercial y el packing list. El sistema los comparará y
        detectará incoherencias.
      </p>

      {/* Zonas de subida */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <ZonaSubida
          etiqueta="Factura comercial"
          archivo={factura}
          onArchivo={setFactura}
        />
        <ZonaSubida
          etiqueta="Packing list"
          archivo={packing}
          onArchivo={setPacking}
        />
      </div>

      {/* Botón */}
      <button
        onClick={handleAnalizar}
        disabled={analizando || !factura || !packing}
        style={{
          padding: "0.75rem 2rem",
          fontSize: "1rem",
          background: analizando ? "#999" : "#0066cc",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: analizando ? "not-allowed" : "pointer",
        }}
      >
        {analizando ? "Analizando..." : "Analizar documentos"}
      </button>

      {analizando && (
        <p style={{ marginTop: "1rem", color: "#666" }}>
          Procesando con IA. Esto puede tardar 20-40 segundos.
        </p>
      )}

      {error && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            background: "#ffe5e5",
            border: "1px solid #ffb3b3",
            borderRadius: 8,
            color: "#b30000",
          }}
        >
          {error}
        </div>
      )}

      {resultado && <MostrarResultado resultado={resultado} />}
    </main>
  );
}

// ------------------------------------------------------------
// Componente: zona de subida de un archivo
// ------------------------------------------------------------

function ZonaSubida({
  etiqueta,
  archivo,
  onArchivo,
}: {
  etiqueta: string;
  archivo: File | null;
  onArchivo: (f: File | null) => void;
}) {
  return (
    <div
      style={{
        border: "2px dashed #ccc",
        borderRadius: 8,
        padding: "1.5rem",
        textAlign: "center",
        background: archivo ? "#f0f8ff" : "#fafafa",
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: "0.75rem" }}>{etiqueta}</p>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => onArchivo(e.target.files?.[0] ?? null)}
        style={{ fontSize: "0.9rem" }}
      />
      {archivo && (
        <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#0066cc" }}>
          {archivo.name}
        </p>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Componente: mostrar resultado
// ------------------------------------------------------------

function MostrarResultado({ resultado }: { resultado: ResultadoAnalisis }) {
  const altas = resultado.validaciones.filter(
    (v) => v.resultado === "discrepancia" && v.severidad === "alta"
  );
  const medias = resultado.validaciones.filter(
    (v) => v.resultado === "discrepancia" && v.severidad === "media"
  );
  const bajas = resultado.validaciones.filter(
    (v) => v.resultado === "discrepancia" && v.severidad === "baja"
  );
  const noComprobables = resultado.validaciones.filter(
    (v) => v.resultado === "no_comprobable"
  );
  const oks = resultado.validaciones.filter((v) => v.resultado === "ok");

  const colorGlobal =
    resultado.resultado_global === "no_apto"
      ? "#b30000"
      : resultado.resultado_global === "revisar"
        ? "#b36b00"
        : "#008000";

  const textoGlobal =
    resultado.resultado_global === "no_apto"
      ? "NO APTO — Hay discrepancias graves"
      : resultado.resultado_global === "revisar"
        ? "REVISAR — Hay puntos a comprobar"
        : "APTO — Sin discrepancias detectadas";

  return (
    <div style={{ marginTop: "2rem" }}>
      {/* Resumen */}
      <div
        style={{
          padding: "1rem 1.5rem",
          background: "#fff",
          border: "1px solid #ddd",
          borderLeft: `4px solid ${colorGlobal}`,
          borderRadius: 8,
          marginBottom: "1.5rem",
        }}
      >
        <p style={{ fontSize: "1.1rem", fontWeight: 600, color: colorGlobal }}>
          {textoGlobal}
        </p>
        <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.5rem" }}>
          Factura: {resultado.factura.numero ?? "—"} · Packing:{" "}
          {resultado.packing.numero ?? "—"}
        </p>
      </div>

      {/* Discrepancias altas */}
      {altas.length > 0 && (
        <BloqueValidaciones
          titulo={`🔴 Discrepancias graves (${altas.length})`}
          validaciones={altas}
          color="#b30000"
        />
      )}

      {/* Discrepancias medias */}
      {medias.length > 0 && (
        <BloqueValidaciones
          titulo={`🟡 Discrepancias medias (${medias.length})`}
          validaciones={medias}
          color="#b36b00"
        />
      )}

      {/* Discrepancias bajas */}
      {bajas.length > 0 && (
        <BloqueValidaciones
          titulo={`🟢 Discrepancias leves (${bajas.length})`}
          validaciones={bajas}
          color="#007700"
        />
      )}

      {/* No comprobables */}
      {noComprobables.length > 0 && (
        <BloqueValidaciones
          titulo={`⚠️ No comprobables (${noComprobables.length})`}
          validaciones={noComprobables}
          color="#666"
        />
      )}

      {/* Advertencias */}
      {resultado.advertencias.length > 0 && (
        <div
          style={{
            padding: "1rem 1.5rem",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 8,
            marginBottom: "1rem",
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
            📌 Advertencias
          </p>
          <ul style={{ paddingLeft: "1.25rem", fontSize: "0.9rem" }}>
            {resultado.advertencias.map((a, i) => (
              <li key={i} style={{ marginBottom: "0.25rem" }}>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Resumen final */}
      <div
        style={{
          marginTop: "1.5rem",
          padding: "1rem 1.5rem",
          background: "#f5f5f7",
          borderRadius: 8,
          fontSize: "0.9rem",
          color: "#555",
        }}
      >
        <p>
          <strong>Resumen:</strong> {resultado.validaciones.length} reglas
          ejecutadas · {altas.length + medias.length + bajas.length}{" "}
          discrepancias · {noComprobables.length} no comprobables ·{" "}
          {oks.length} correctas
        </p>
      </div>
    </div>
  );
}

function BloqueValidaciones({
  titulo,
  validaciones,
  color,
}: {
  titulo: string;
  validaciones: Validacion[];
  color: string;
}) {
  return (
    <div
      style={{
        padding: "1rem 1.5rem",
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: 8,
        marginBottom: "1rem",
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: "0.75rem", color }}>
        {titulo}
      </p>
      {validaciones.map((v, i) => (
        <div
          key={i}
          style={{
            paddingTop: i > 0 ? "0.75rem" : 0,
            marginTop: i > 0 ? "0.75rem" : 0,
            borderTop: i > 0 ? "1px solid #eee" : "none",
          }}
        >
          <p style={{ fontWeight: 500, fontSize: "0.95rem" }}>
            [{v.regla}] {v.descripcion}
          </p>
          {v.nota && (
            <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.25rem" }}>
              {v.nota}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}