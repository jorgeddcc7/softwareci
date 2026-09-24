import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { subirPdf, analizarPdf } from "@/extraction/gemini";
import { promptFactura, promptPackingList } from "@/extraction/prompt";
import { promptTransporte } from "@/extraction/prompt-transporte";
import {
  FacturaComercial,
  PackingList,
  DocumentoTransporte,
} from "@/types/documentos";
import {
  ejecutarReglas,
  generarValidacionesINV_021,
  ACCIONES_SUGERIDAS,
} from "@/rules/motor";

export const maxDuration = 300;

function limpiarJson(texto: string): string {
  let limpio = texto.trim();
  if (limpio.startsWith("```")) {
    limpio = limpio.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  return limpio;
}

async function guardarTemporal(
  nombre: string,
  contenido: Buffer
): Promise<string> {
  const dirTemp = fs.mkdtempSync(path.join(os.tmpdir(), "doc-"));
  const rutaTemp = path.join(dirTemp, nombre);
  fs.writeFileSync(rutaTemp, contenido);
  return rutaTemp;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const facturaFile = formData.get("factura") as File | null;
    const packingFile = formData.get("packing") as File | null;
    const transporteFile = formData.get("transporte") as File | null;

    if (!facturaFile || !packingFile) {
      return NextResponse.json(
        { error: "Se requieren al menos dos archivos: factura y packing." },
        { status: 400 }
      );
    }

    const tipoTransporteRaw = formData.get("tipo_transporte") as string | null;
    const tipoTransporte: "auto" | "bill_of_lading" | "air_waybill" | "cmr" =
      tipoTransporteRaw === "bill_of_lading" ||
      tipoTransporteRaw === "air_waybill" ||
      tipoTransporteRaw === "cmr"
        ? tipoTransporteRaw
        : "auto";

    const facturaBuffer = Buffer.from(await facturaFile.arrayBuffer());
    const rutaFactura = await guardarTemporal("factura.pdf", facturaBuffer);

    const packingBuffer = Buffer.from(await packingFile.arrayBuffer());
    const rutaPacking = await guardarTemporal("packing.pdf", packingBuffer);

    let rutaTransporte: string | null = null;
    if (transporteFile) {
      const transporteBuffer = Buffer.from(await transporteFile.arrayBuffer());
      rutaTransporte = await guardarTemporal("transporte.pdf", transporteBuffer);
    }

    // Extraer los 3 documentos EN PARALELO
    console.log("Extrayendo documentos en paralelo...");

    const extraerFacturaPromise = (async () => {
      const uri = await subirPdf(rutaFactura);
      const resp = await analizarPdf(uri, promptFactura());
      return JSON.parse(limpiarJson(resp));
    })();

    const extraerPackingPromise = (async () => {
      const uri = await subirPdf(rutaPacking);
      const resp = await analizarPdf(uri, promptPackingList());
      return JSON.parse(limpiarJson(resp)) as PackingList;
    })();

    const extraerTransportePromise = rutaTransporte
      ? (async () => {
          const uri = await subirPdf(rutaTransporte);
          const resp = await analizarPdf(uri, promptTransporte(tipoTransporte));
          return JSON.parse(limpiarJson(resp)) as DocumentoTransporte;
        })()
      : Promise.resolve(null);

    const [facturaRaw, packing, transporte] = await Promise.all([
      extraerFacturaPromise,
      extraerPackingPromise,
      extraerTransportePromise,
    ]);

    // Extraer la factura y las descripciones evaluadas del mismo JSON
    const factura = facturaRaw as FacturaComercial;
    const descripcionesEvaluadas =
      (facturaRaw.descripciones_evaluadas as Array<{
        indice_linea: number;
        descripcion: string;
        es_especifica: boolean;
        motivo: string;
        sugerencia: string;
        confianza: "alta" | "media" | "baja";
      }>) ?? [];

    // Motor de reglas
    console.log("Ejecutando motor de reglas...");
    const {
      validaciones,
      advertencias,
      lineas_detectadas_lista_negra,
    } = ejecutarReglas(factura, packing, transporte);

    // Nivel 2: usamos las evaluaciones que ya vienen en el JSON de la factura
    // Filtrar: solo evaluar con INV-021 las líneas que NO estén ya detectadas por lista negra
    const descripcionesFiltradas = descripcionesEvaluadas.filter(
      (d) => !lineas_detectadas_lista_negra.includes(d.indice_linea)
    );

    const validacionesINV021 = generarValidacionesINV_021(descripcionesFiltradas);
    for (const v of validacionesINV021) {
      v.accion_sugerida = ACCIONES_SUGERIDAS[v.regla] ?? "";
    }
    validaciones.push(...validacionesINV021);

    const altas = validaciones.filter(
      (v) => v.resultado === "discrepancia" && v.severidad === "alta"
    );
    const medias = validaciones.filter(
      (v) => v.resultado === "discrepancia" && v.severidad === "media"
    );
    const noComprobables = validaciones.filter(
      (v) => v.resultado === "no_comprobable"
    );

    let resultadoGlobal: "apto" | "revisar" | "no_apto";
    if (altas.length > 0) resultadoGlobal = "no_apto";
    else if (medias.length > 0 || noComprobables.length > 0)
      resultadoGlobal = "revisar";
    else resultadoGlobal = "apto";

    try {
      fs.unlinkSync(rutaFactura);
      fs.unlinkSync(rutaPacking);
      if (rutaTransporte) fs.unlinkSync(rutaTransporte);
    } catch {
      // Nada
    }

    return NextResponse.json({
      exito: true,
      factura: {
        numero: factura.numero_factura.valor,
        fecha: factura.fecha_emision.valor,
        vendedor: factura.vendedor.nombre_legal.valor,
        comprador: factura.comprador.nombre_legal.valor,
      },
      packing: {
        numero: packing.numero_documento.valor,
        referencia_factura: packing.numero_factura_referencia.valor,
      },
      transporte: transporte
        ? {
            tipo: transporte.tipo_documento,
            numero: transporte.numero_documento.valor,
            puerto_carga:
              transporte.puerto_carga.valor ??
              transporte.ciudad_carga.valor ??
              null,
            puerto_descarga:
              transporte.puerto_descarga.valor ??
              transporte.ciudad_descarga.valor ??
              null,
          }
        : null,
      resultado_global: resultadoGlobal,
      validaciones,
      advertencias,
    });
  } catch (error) {
    console.error("Error en /api/analizar:", error);
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al procesar los documentos: ${mensaje}` },
      { status: 500 }
    );
  }
}