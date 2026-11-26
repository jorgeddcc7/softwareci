"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";

type EstadoHallazgo =
  | "correcto"
  | "error_critico"
  | "advertencia"
  | "pendiente";

type HallazgoSeguro = {
  id: string;
  estado: EstadoHallazgo;
  titulo: string;
  descripcion: string;
};

type CampoExtraido<T> = {
  valor: T | null;
  texto_original?: string | null;
  estado?: string;
  nota?: string | null;
};

type DocumentoSeguro = {
  aseguradora?: CampoExtraido<string>;
  numero_poliza?: CampoExtraido<string>;
  valor_asegurado?: CampoExtraido<string>;
  moneda?: CampoExtraido<string>;
  incoterm?: CampoExtraido<string>;
  ruta?: {
    origen?: CampoExtraido<string>;
    destino?: CampoExtraido<string>;
  };
};

type ResultadoVerificacion = {
  success: true;
  factura: Record<string, unknown>;
  seguro: DocumentoSeguro;
  hallazgos: HallazgoSeguro[];
};

function valorCampo<T>(campo?: CampoExtraido<T>): string {
  if (!campo || campo.valor === null || campo.valor === undefined) {
    return "No identificado";
  }
  return String(campo.valor);
}

function formatoEstado(estado: EstadoHallazgo) {
  switch (estado) {
    case "correcto":
      return { etiqueta: "Correcto", clase: "border-green-200 bg-green-50 text-green-900" };
    case "error_critico":
      return { etiqueta: "Error crítico", clase: "border-red-200 bg-red-50 text-red-900" };
    case "advertencia":
    case "pendiente":
      return { etiqueta: "Por revisar", clase: "border-amber-200 bg-amber-50 text-amber-900" };
  }
}

function TarjetaHallazgo({ hallazgo }: { hallazgo: HallazgoSeguro }) {
  const estilo = formatoEstado(hallazgo.estado);

  return (
    <article className={`rounded-xl border-l-4 border p-5 shadow-sm ${estilo.clase}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-base">{hallazgo.titulo}</h3>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/50 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
          {estilo.etiqueta}
        </span>
      </div>
      <p className="text-sm leading-relaxed opacity-90">{hallazgo.descripcion}</p>
    </article>
  );
}

function DatoSeguro({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">
        {etiqueta}
      </p>
      <p className="break-words text-sm font-medium text-foreground">{valor}</p>
    </div>
  );
}

export function FormVerificadorSeguro() {
  const [factura, setFactura] = useState<File | null>(null);
  const [seguro, setSeguro] = useState<File | null>(null);

  const [resultado, setResultado] = useState<ResultadoVerificacion | null>(null);

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [mensajeGuardado, setMensajeGuardado] = useState<string | null>(null);

  async function verificarDocumentos(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setMensajeGuardado(null);
    setResultado(null);

    if (!factura || !seguro) {
      setError("Selecciona la factura comercial y el certificado de seguro.");
      return;
    }

    const formData = new FormData();
    formData.append("factura", factura);
    formData.append("seguro", seguro);

    setCargando(true);

    try {
      const response = await fetch("/api/verificador-seguro", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "No se ha podido verificar la documentación.");
      }

      setResultado(data as ResultadoVerificacion);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ha ocurrido un error inesperado.");
    } finally {
      setCargando(false);
    }
  }

  async function guardarVerificacion() {
    if (!resultado) return;

    setGuardando(true);
    setError(null);
    setMensajeGuardado(null);

    try {
      const response = await fetch("/api/verificador-seguro/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          factura: resultado.factura,
          seguro: resultado.seguro,
          hallazgos: resultado.hallazgos,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "No se ha podido guardar la verificación.");
      }

      setMensajeGuardado("Verificación guardada correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la verificación.");
    } finally {
      setGuardando(false);
    }
  }

  const hallazgos = resultado?.hallazgos ?? [];
  const correctos = hallazgos.filter((h) => h.estado === "correcto").length;
  const errores = hallazgos.filter((h) => h.estado === "error_critico").length;
  const pendientes = hallazgos.filter((h) => h.estado === "advertencia" || h.estado === "pendiente").length;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <form onSubmit={verificarDocumentos} className="bg-surface p-8 border border-border rounded-2xl shadow-sm relative overflow-hidden">
        
        {/* Adorno de fondo para darle personalidad de "seguridad" */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-50 rounded-full opacity-50 pointer-events-none blur-3xl"></div>

        <div className="grid md:grid-cols-2 gap-8 mb-8 relative z-10">
          
          {/* Input Factura */}
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group">
            <div className="flex items-center gap-4 mb-5 border-b border-slate-100 pb-5">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Factura Comercial</h3>
                <p className="text-xs text-muted">Valor de la operación</p>
              </div>
            </div>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                setFactura(e.target.files?.[0] ?? null);
                setResultado(null);
              }}
              className="w-full text-sm text-muted file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer transition-colors"
              required
            />
            {factura && <span className="mt-3 block text-xs font-bold text-slate-700 truncate">{factura.name}</span>}
          </div>

          {/* Input Seguro */}
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group">
            <div className="flex items-center gap-4 mb-5 border-b border-slate-100 pb-5">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Certificado de Seguro</h3>
                <p className="text-xs text-muted">Póliza y coberturas</p>
              </div>
            </div>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                setSeguro(e.target.files?.[0] ?? null);
                setResultado(null);
              }}
              className="w-full text-sm text-muted file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover cursor-pointer transition-colors"
              required
            />
            {seguro && <span className="mt-3 block text-xs font-bold text-primary truncate">{seguro.name}</span>}
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm relative z-10">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={cargando || !factura || !seguro}
          className="mx-auto w-full md:w-auto relative z-10 px-10 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-all disabled:opacity-75 disabled:cursor-not-allowed shadow-md text-base flex items-center justify-center gap-3"
        >
          {cargando ? (
            <>
              <svg className="animate-spin -ml-1 mr-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analizando coberturas...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Validar Póliza
            </>
          )}
        </button>
      </form>

      {resultado && (
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-surface p-6 border border-border rounded-2xl shadow-sm">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Informe de Verificación</h2>
              <p className="mt-1 text-sm text-muted">Revisa los resultados antes de operar.</p>
            </div>
            <button
              onClick={guardarVerificacion}
              disabled={guardando || !!mensajeGuardado}
              className="px-6 py-2.5 bg-white border border-border text-foreground font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
            >
              {guardando ? "Guardando..." : mensajeGuardado ? "Guardado ✓" : "Guardar Verificación"}
            </button>
          </div>

          {mensajeGuardado && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 flex justify-between items-center">
              <span>{mensajeGuardado}</span>
              <Link href="/guardados" className="font-semibold underline hover:text-green-900">
                Ver mis guardados →
              </Link>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <DatoSeguro etiqueta="Aseguradora" valor={valorCampo(resultado.seguro.aseguradora)} />
            <DatoSeguro etiqueta="Número de póliza" valor={valorCampo(resultado.seguro.numero_poliza)} />
            <DatoSeguro
              etiqueta="Valor asegurado"
              valor={`${valorCampo(resultado.seguro.valor_asegurado)} ${valorCampo(resultado.seguro.moneda)}`}
            />
            <DatoSeguro
              etiqueta="Ruta asegurada"
              valor={`${valorCampo(resultado.seguro.ruta?.origen)} → ${valorCampo(resultado.seguro.ruta?.destino)}`}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center shadow-sm">
              <p className="text-3xl font-bold text-green-700">{correctos}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-green-800 mt-1">Correctos</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center shadow-sm">
              <p className="text-3xl font-bold text-red-700">{errores}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-red-800 mt-1">Errores</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center shadow-sm">
              <p className="text-3xl font-bold text-amber-700">{pendientes}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-800 mt-1">Por revisar</p>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xl font-bold text-foreground">Hallazgos</h3>
            {hallazgos.length === 0 ? (
              <div className="rounded-xl border border-border bg-slate-50 p-6 text-sm text-muted">
                No se han generado hallazgos para esta verificación.
              </div>
            ) : (
              <div className="space-y-4">
                {hallazgos.map((hallazgo) => (
                  <TarjetaHallazgo key={hallazgo.id} hallazgo={hallazgo} />
                ))}
              </div>
            )}
          </div>

          <p className="text-xs leading-relaxed text-muted bg-surface p-4 border border-border rounded-lg">
            <strong>Aviso:</strong> Este informe es una ayuda para la revisión documental. Los datos extraídos y las condiciones de cobertura deben confirmarse con la documentación original y las condiciones de la operación antes de tomar decisiones comerciales.
          </p>
        </section>
      )}
    </div>
  );
}