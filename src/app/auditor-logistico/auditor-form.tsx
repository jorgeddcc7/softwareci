"use client";

import { useState } from "react";
import Link from "next/link"; // <-- AÑADIDO

type FilaConciliacion = {
  id: string;
  linea_presupuesto: any;
  linea_factura: any;
  estado: string;
  importe_presupuesto: string | null;
  importe_factura: string | null;
  diferencia: string | null;
  motivo: string;
};

export function AuditorForm() {
  const [presupuesto, setPresupuesto] = useState<File | null>(null);
  const [factura, setFactura] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [resultado, setResultado] = useState<{
    documentos: any;
    conciliacion: { filas: FilaConciliacion[], diferencias_cuantificadas: FilaConciliacion[], cargos_no_localizados: FilaConciliacion[] };
  } | null>(null);

  // Estados para persistencia e interacción
  const [guardando, setGuardando] = useState(false);
  const [guardadoId, setGuardadoId] = useState<string | null>(null);
  const [accionesFilas, setAccionesFilas] = useState<Record<string, "reclamado" | "aceptado">>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!presupuesto || !factura) {
      setError("Debes seleccionar ambos PDFs.");
      return;
    }

    setLoading(true);
    setError(null);
    setResultado(null);
    setGuardadoId(null);
    setAccionesFilas({});

    const formData = new FormData();
    formData.append("presupuesto", presupuesto);
    formData.append("factura", factura);

    try {
      const res = await fetch("/api/auditor-logistico", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) setError(data.error || "Error procesando los documentos.");
      else setResultado(data);
    } catch (err) {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGuardarAuditoria() {
    if (!resultado) return;
    setGuardando(true);
    try {
      const res = await fetch("/api/auditor-logistico/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presupuesto: resultado.documentos.presupuesto,
          factura: resultado.documentos.factura,
          conciliacion: resultado.conciliacion,
        }),
      });
      const data = await res.json();
      if (res.ok) setGuardadoId(data.auditoria.id);
      else setError(data.error);
    } catch {
      setError("Error guardando la auditoría.");
    } finally {
      setGuardando(false);
    }
  }

  function handleExportarCSV() {
    if (!resultado) return;
    
    const filas = resultado.conciliacion.filas;
    let csv = "Concepto Presupuesto,Concepto Factura,Importe Presupuesto,Importe Factura,Diferencia,Estado\n";
    
    filas.forEach(f => {
      const p = (f.linea_presupuesto?.descripcion?.valor || "").replace(/,/g, "");
      const fa = (f.linea_factura?.descripcion?.valor || "").replace(/,/g, "");
      csv += `"${p}","${fa}","${f.importe_presupuesto || ""}","${f.importe_factura || ""}","${f.diferencia || ""}","${f.estado}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "auditoria_logistica.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleAccion(id: string, accion: "reclamado" | "aceptado") {
    setAccionesFilas(prev => ({ ...prev, [id]: accion }));
  }

  const filasReclamadas = resultado?.conciliacion.filas.filter(f => accionesFilas[f.id] === "reclamado") || [];
  let textoReclamacion = "Hola,\n\nRevisando la documentación de la operación, hemos detectado las siguientes diferencias en su factura:\n\n";
  filasReclamadas.forEach(f => {
    textoReclamacion += `- ${f.linea_factura?.descripcion?.valor}: Facturado ${f.importe_factura}€. ${f.diferencia ? `Diferencia de ${f.diferencia}€ respecto al presupuesto.` : f.motivo}\n`;
  });
  textoReclamacion += "\nPor favor, revisad y aclarad estos puntos.\n\nGracias.";

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="bg-surface p-8 border border-border rounded-2xl shadow-sm">
        
        <div className="grid md:grid-cols-2 gap-8 mb-8 relative">
          
          {/* Input Presupuesto */}
          <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:bg-slate-50 hover:border-slate-400 transition-all group cursor-pointer relative overflow-hidden">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-5 group-hover:-translate-y-1 transition-transform duration-300">
              <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <label className="block text-base font-bold text-foreground mb-1">
              Presupuesto Acordado
            </label>
            <p className="text-xs text-muted mb-6">La cotización inicial (PDF)</p>
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={(e) => setPresupuesto(e.target.files?.[0] || null)} 
              className="w-full text-sm text-muted file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-900 cursor-pointer transition-colors" 
            />
            {presupuesto && <span className="mt-3 block text-xs font-bold text-slate-800 truncate">{presupuesto.name}</span>}
          </div>

          {/* Separador VS central */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-border rounded-full items-center justify-center shadow-sm z-10">
            <span className="text-xs font-bold text-muted">VS</span>
          </div>

          {/* Input Factura */}
          <div className="bg-emerald-50/30 border-2 border-dashed border-emerald-200 rounded-2xl p-8 text-center hover:bg-emerald-50/60 hover:border-emerald-400 transition-all group cursor-pointer relative overflow-hidden">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-center mx-auto mb-5 group-hover:-translate-y-1 transition-transform duration-300">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 100 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <label className="block text-base font-bold text-foreground mb-1">
              Factura del Transitario
            </label>
            <p className="text-xs text-muted mb-6">Lo que te están cobrando (PDF)</p>
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={(e) => setFactura(e.target.files?.[0] || null)} 
              className="w-full text-sm text-muted file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer transition-colors" 
            />
            {factura && <span className="mt-3 block text-xs font-bold text-emerald-700 truncate">{factura.name}</span>}
          </div>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        <button 
          type="submit" 
          disabled={loading || !presupuesto || !factura} 
          className="mx-auto w-full md:w-auto px-10 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-75 disabled:cursor-not-allowed shadow-md text-base flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Cruzando datos con IA...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              Auditar y Detectar Sobrecostes
            </>
          )}
        </button>
      </form>

      {/* Tabla de resultados */}
      {resultado && resultado.conciliacion && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border bg-slate-50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Tabla de Conciliación</h2>
              <p className="text-sm text-muted mt-1">Revisa las diferencias y selecciona las que quieras reclamar.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleExportarCSV} className="px-4 py-2 bg-white border border-border text-foreground text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                Exportar CSV
              </button>
              <button onClick={handleGuardarAuditoria} disabled={guardando || !!guardadoId} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50">
                {guardando ? "Guardando..." : guardadoId ? "Auditoría Guardada" : "Guardar Auditoría"}
              </button>
            </div>
          </div>

          {/* MENSAJE DE ÉXITO AÑADIDO AQUÍ */}
          {guardadoId && (
            <div className="bg-green-50 border-b border-green-200 p-4 flex justify-between items-center text-sm text-green-800">
              <span className="font-medium">Auditoría guardada correctamente en tu cuenta.</span>
              <Link href="/guardados" className="font-semibold underline hover:text-green-900">
                Ver mis guardados →
              </Link>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 font-semibold text-foreground">Concepto (Ppto)</th>
                  <th className="px-6 py-3 font-semibold text-foreground">Concepto (Factura)</th>
                  <th className="px-6 py-3 font-semibold text-foreground text-right">Ppto</th>
                  <th className="px-6 py-3 font-semibold text-foreground text-right">Factura</th>
                  <th className="px-6 py-3 font-semibold text-foreground text-right">Diferencia</th>
                  <th className="px-6 py-3 font-semibold text-foreground">Estado</th>
                  <th className="px-6 py-3 font-semibold text-foreground text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {resultado.conciliacion.filas.map((fila) => {
                  const accion = accionesFilas[fila.id];
                  const esReclamable = ["diferencia_propuesta", "cargo_no_presupuestado"].includes(fila.estado);

                  return (
                    <tr key={fila.id} className={`transition-colors ${accion === "reclamado" ? "bg-red-50" : accion === "aceptado" ? "bg-slate-50 opacity-50" : "hover:bg-slate-50"}`}>
                      <td className="px-6 py-4 text-foreground">{fila.linea_presupuesto?.descripcion?.valor || <span className="text-muted italic">No localizado</span>}</td>
                      <td className="px-6 py-4 text-foreground">{fila.linea_factura?.descripcion?.valor || <span className="text-muted italic">No localizado</span>}</td>
                      <td className="px-6 py-4 text-right text-muted">{fila.importe_presupuesto || fila.linea_presupuesto?.importe?.valor ? `${fila.importe_presupuesto || fila.linea_presupuesto?.importe?.valor} €` : "—"}</td>
                      <td className="px-6 py-4 text-right text-muted">{fila.importe_factura || fila.linea_factura?.importe?.valor ? `${fila.importe_factura || fila.linea_factura?.importe?.valor} €` : "—"}</td>
                      <td className={`px-6 py-4 text-right font-medium ${fila.diferencia && Number(fila.diferencia) > 0 ? "text-red-600" : "text-slate-600"}`}>{fila.diferencia ? `${fila.diferencia} €` : "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          fila.estado === "coincidencia_propuesta" ? "bg-low-bg text-low-text" :
                          fila.estado === "diferencia_propuesta" ? "bg-high-bg text-high-text" :
                          fila.estado === "cargo_no_presupuestado" ? "bg-medium-bg text-medium-text" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {fila.estado.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {esReclamable && !accion && (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleAccion(fila.id, "aceptado")} className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded hover:bg-slate-200">Aceptar</button>
                            <button onClick={() => handleAccion(fila.id, "reclamado")} className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700">Reclamar</button>
                          </div>
                        )}
                        {accion === "reclamado" && <span className="text-xs font-bold text-red-600">Marcado para reclamar</span>}
                        {accion === "aceptado" && <span className="text-xs font-bold text-slate-500">Aceptado</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generador de Reclamación */}
      {filasReclamadas.length > 0 && (
        <div className="bg-surface border border-red-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-red-100 bg-red-50">
            <h2 className="text-lg font-semibold text-red-800">Borrador de Reclamación</h2>
            <p className="text-sm text-red-600 mt-1">Copia este texto y envíalo a tu proveedor logístico.</p>
          </div>
          <div className="p-6">
            <textarea 
              readOnly 
              value={textoReclamacion}
              className="w-full h-64 p-4 border border-border rounded-lg bg-slate-50 font-mono text-sm text-foreground focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
} 