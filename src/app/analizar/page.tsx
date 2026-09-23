"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Link from "next/link";
import { InformeDocumento } from "./informe-pdf";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

interface Validacion {
  regla: string;
  descripcion: string;
  resultado: "ok" | "discrepancia" | "no_comprobable";
  severidad: "alta" | "media" | "baja";
  documentos: string[];
  campos: string[];
  valores: Record<string, unknown>;
  nota: string;
  accion_sugerida?: string;
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
  transporte: {
    tipo: "bill_of_lading" | "air_waybill" | "cmr";
    numero: string | null;
    puerto_carga: string | null;
    puerto_descarga: string | null;
  } | null;
  resultado_global: "apto" | "revisar" | "no_apto";
  validaciones: Validacion[];
  advertencias: string[];
}

export default function AnalizarPage() {
  const [factura, setFactura] = useState<File | null>(null);
  const [packing, setPacking] = useState<File | null>(null);
  const [transporte, setTransporte] = useState<File | null>(null);
  const [tipoTransporte, setTipoTransporte] = useState<
    "auto" | "bill_of_lading" | "air_waybill" | "cmr"
  >("auto");
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAnalisis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preparadoPor, setPreparadoPor] = useState("");

  async function handleAnalizar() {
    if (!factura || !packing) {
      setError("Selecciona al menos la factura y el packing list.");
      return;
    }

    setAnalizando(true);
    setError(null);
    setResultado(null);

    try {
      const formData = new FormData();
      formData.append("factura", factura);
      formData.append("packing", packing);
      if (transporte) {
        formData.append("transporte", transporte);
        formData.append("tipo_transporte", tipoTransporte);
      }

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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CD</span>
            </div>
            <span className="font-semibold text-foreground text-[15px]">
              Controlador de Documentos
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            ← Volver
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 w-full">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Analizar documentos
        </h1>
        <p className="text-muted mb-8">
          Sube la factura comercial, el packing list y, opcionalmente, el
          documento de transporte.
        </p>

        {/* Zonas de subida */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <ZonaSubida
            etiqueta="Factura comercial"
            requerido={true}
            archivo={factura}
            onArchivo={setFactura}
          />
          <ZonaSubida
            etiqueta="Packing list"
            requerido={true}
            archivo={packing}
            onArchivo={setPacking}
          />
          <ZonaSubida
            etiqueta="Documento de transporte"
            subtitulo="Opcional (B/L, AWB o CMR)"
            requerido={false}
            archivo={transporte}
            onArchivo={setTransporte}
          />
        </div>

        {/* Selector de tipo de transporte (solo si hay archivo) */}
        {transporte && (
          <div className="mb-6 p-4 bg-surface border border-border rounded-lg">
            <label className="block text-sm font-medium text-foreground mb-2">
              Tipo de documento de transporte
            </label>
            <div className="flex flex-wrap gap-3">
              <TipoOpcion
                valor="auto"
                etiqueta="Detectar automáticamente"
                seleccionado={tipoTransporte === "auto"}
                onSeleccionar={setTipoTransporte}
              />
              <TipoOpcion
                valor="bill_of_lading"
                etiqueta="Bill of Lading (marítimo)"
                seleccionado={tipoTransporte === "bill_of_lading"}
                onSeleccionar={setTipoTransporte}
              />
              <TipoOpcion
                valor="air_waybill"
                etiqueta="Air Waybill (aéreo)"
                seleccionado={tipoTransporte === "air_waybill"}
                onSeleccionar={setTipoTransporte}
              />
              <TipoOpcion
                valor="cmr"
                etiqueta="CMR (carretera)"
                seleccionado={tipoTransporte === "cmr"}
                onSeleccionar={setTipoTransporte}
              />
            </div>
          </div>
        )}

        {/* Botón */}
        <button
          onClick={handleAnalizar}
          disabled={analizando || !factura || !packing}
          className={`px-6 py-3 font-medium rounded-lg transition-colors ${
            analizando || !factura || !packing
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary-hover shadow-sm"
          }`}
        >
          {analizando ? "Analizando..." : "Analizar documentos"}
        </button>

        {analizando && (
          <p className="mt-4 text-sm text-muted">
            Procesando con IA. Esto puede tardar 30-90 segundos.
          </p>
        )}

        {error && (
          <div className="mt-6 p-4 bg-high-bg border border-red-200 rounded-lg text-high-text text-sm">
            <p className="mb-3">{error}</p>
            <button
              onClick={handleAnalizar}
              className="px-4 py-2 bg-white border border-high-text text-high-text text-xs font-medium rounded-lg hover:bg-red-50 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {resultado && (
          <>
            <div className="mt-6 p-4 bg-surface border border-border rounded-lg">
              <label className="block text-sm font-medium text-foreground mb-2">
                Preparado por (opcional)
              </label>
              <input
                type="text"
                value={preparadoPor}
                onChange={(e) => setPreparadoPor(e.target.value)}
                placeholder="Tu nombre o el de tu empresa"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
              />
              <div className="mt-4">
                <BotonDescargaInforme
                  resultado={resultado}
                  preparadoPor={preparadoPor}
                />
              </div>
            </div>
            <MostrarResultado resultado={resultado} />
          </>
        )}
      </main>
    </div>
  );
}

function ZonaSubida({
  etiqueta,
  subtitulo,
  requerido,
  archivo,
  onArchivo,
}: {
  etiqueta: string;
  subtitulo?: string;
  requerido: boolean;
  archivo: File | null;
  onArchivo: (f: File | null) => void;
}) {
  return (
    <label
      className={`block border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
        archivo
          ? "border-primary bg-primary-light"
          : "border-border bg-surface hover:border-primary"
      }`}
    >
      <p className="font-semibold text-foreground text-sm mb-1">{etiqueta}</p>
      <p className="text-xs text-muted mb-3">
        {subtitulo ?? (requerido ? "Requerido" : "")}
      </p>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => onArchivo(e.target.files?.[0] ?? null)}
        className="hidden"
      />
      {archivo ? (
        <p className="text-xs text-primary font-medium truncate">
          ✓ {archivo.name}
        </p>
      ) : (
        <p className="text-xs text-muted">Haz clic o arrastra el PDF</p>
      )}
    </label>
  );
}

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
      ? "#991B1B"
      : resultado.resultado_global === "revisar"
        ? "#92400E"
        : "#065F46";

  const bgGlobal =
    resultado.resultado_global === "no_apto"
      ? "#FEE2E2"
      : resultado.resultado_global === "revisar"
        ? "#FEF3C7"
        : "#D1FAE5";

  const textoGlobal =
    resultado.resultado_global === "no_apto"
      ? "NO APTO — Hay discrepancias graves"
      : resultado.resultado_global === "revisar"
        ? "REVISAR — Hay puntos a comprobar"
        : "APTO — Sin discrepancias detectadas";

  return (
    <div className="mt-10">
      {/* Resumen global */}
      <div
        className="p-5 rounded-lg mb-6 border-l-4"
        style={{
          background: bgGlobal,
          borderLeftColor: colorGlobal,
        }}
      >
        <p className="text-base font-semibold" style={{ color: colorGlobal }}>
          {textoGlobal}
        </p>
        <p className="text-sm text-slate-700 mt-2">
          Factura: <strong>{resultado.factura.numero ?? "—"}</strong> ·
          Packing: <strong>{resultado.packing.numero ?? "—"}</strong>
          {resultado.transporte && (
            <>
              {" "}
              ·{" "}
              {resultado.transporte.tipo === "air_waybill"
                ? "AWB"
                : resultado.transporte.tipo === "cmr"
                  ? "CMR"
                  : "B/L"}
              :{" "}
              <strong>{resultado.transporte.numero ?? "—"}</strong>
            </>
          )}
        </p>
        {resultado.transporte && (
          <p className="text-xs text-slate-600 mt-1">
            Ruta: {resultado.transporte.puerto_carga ?? "—"} →{" "}
            {resultado.transporte.puerto_descarga ?? "—"}
          </p>
        )}
      </div>

      {altas.length > 0 && (
        <BloqueValidaciones
          titulo={`Discrepancias graves (${altas.length})`}
          color="#991B1B"
          bgColor="#FEE2E2"
          validaciones={altas}
        />
      )}

      {medias.length > 0 && (
        <BloqueValidaciones
          titulo={`Discrepancias medias (${medias.length})`}
          color="#92400E"
          bgColor="#FEF3C7"
          validaciones={medias}
        />
      )}

      {bajas.length > 0 && (
        <BloqueValidaciones
          titulo={`Discrepancias leves (${bajas.length})`}
          color="#065F46"
          bgColor="#D1FAE5"
          validaciones={bajas}
        />
      )}

      {noComprobables.length > 0 && (
        <BloqueValidaciones
          titulo={`No comprobables (${noComprobables.length})`}
          color="#475569"
          bgColor="#F1F5F9"
          validaciones={noComprobables}
        />
      )}

      {resultado.advertencias.length > 0 && (
        <div className="p-5 bg-surface border border-border rounded-lg mb-4">
          <p className="font-semibold text-foreground mb-3 text-sm">
            Advertencias
          </p>
          <ul className="list-disc pl-5 text-sm text-muted space-y-1">
            {resultado.advertencias.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 p-4 bg-slate-100 rounded-lg text-sm text-slate-600">
        <strong>Resumen:</strong> {resultado.validaciones.length} reglas
        ejecutadas · {altas.length + medias.length + bajas.length}{" "}
        discrepancias · {noComprobables.length} no comprobables ·{" "}
        {oks.length} correctas
      </div>
    </div>
  );
}

function BloqueValidaciones({
  titulo,
  color,
  bgColor,
  validaciones,
}: {
  titulo: string;
  color: string;
  bgColor: string;
  validaciones: Validacion[];
}) {
  return (
    <div className="mb-4 bg-surface border border-border rounded-lg overflow-hidden">
      <div
        className="px-5 py-3 font-semibold text-sm"
        style={{ background: bgColor, color }}
      >
        {titulo}
      </div>
      <div className="divide-y divide-border">
        {validaciones.map((v, i) => (
          <div key={i} className="px-5 py-4">
            <p className="font-medium text-foreground text-sm">
              <span className="font-mono text-xs text-muted mr-2">
                [{v.regla}]
              </span>
              {v.descripcion}
            </p>
            {v.nota && (
              <p className="text-sm text-muted mt-1.5 leading-relaxed">
                {v.nota}
              </p>
            )}
            {v.accion_sugerida && (
              <p className="text-xs text-primary mt-2 leading-relaxed">
                <strong>Acción sugerida:</strong> {v.accion_sugerida}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TipoOpcion({
  valor,
  etiqueta,
  seleccionado,
  onSeleccionar,
}: {
  valor: "auto" | "bill_of_lading" | "air_waybill" | "cmr";
  etiqueta: string;
  seleccionado: boolean;
  onSeleccionar: (v: "auto" | "bill_of_lading" | "air_waybill" | "cmr") => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSeleccionar(valor)}
      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
        seleccionado
          ? "bg-primary text-white border-primary"
          : "bg-white text-foreground border-border hover:border-primary"
      }`}
    >
      {etiqueta}
    </button>
  );
}

function BotonDescargaInforme({
  resultado,
  preparadoPor,
}: {
  resultado: ResultadoAnalisis;
  preparadoPor: string;
}) {
  const datos = {
    numeroFactura: resultado.factura.numero ?? "—",
    numeroPacking: resultado.packing.numero ?? "—",
    numeroTransporte: resultado.transporte?.numero ?? null,
    tipoTransporte:
      resultado.transporte?.tipo === "air_waybill"
        ? "AWB"
        : resultado.transporte?.tipo === "cmr"
          ? "CMR"
          : resultado.transporte?.tipo === "bill_of_lading"
            ? "B/L"
            : null,
    ruta:
      resultado.transporte?.puerto_carga &&
      resultado.transporte?.puerto_descarga
        ? `${resultado.transporte.puerto_carga} -> ${resultado.transporte.puerto_descarga}`
        : null,
    veredicto: resultado.resultado_global,
    validaciones: resultado.validaciones,
    preparadoPor: preparadoPor || undefined,
  };

  const nombreArchivo = `informe-${resultado.factura.numero ?? "operacion"}.pdf`;

  return (
    <PDFDownloadLink
      document={<InformeDocumento datos={datos} />}
      fileName={nombreArchivo}
      className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
    >
      {({ loading }) =>
        loading ? "Generando informe..." : "Descargar informe PDF"
      }
    </PDFDownloadLink>
  );
}