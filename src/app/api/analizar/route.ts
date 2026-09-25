// ============================================================
// API Route: /api/analizar
// ============================================================
//
// Procesa en llamadas específicas:
//   1. Factura (prompt específico).
//   2. Packing (prompt específico).
//   3. Transporte (prompt específico, si existe).
//   4. Descripciones genéricas (una por línea, en paralelo).
//
// Las 3 extracciones van EN PARALELO para reducir el tiempo.
// Si Gemini falla, cae a OpenRouter con el PDF en base64.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  subirPdf,
  analizarPdf,
  evaluarEspecificidad,
} from "@/extraction/gemini";
import { promptFactura, promptPackingList } from "@/extraction/prompt";
import { promptTransporte } from "@/extraction/prompt-transporte";
import { promptEspecificidad } from "@/extraction/prompt-especificidad";
import {
  FacturaComercial,
  PackingList,
  DocumentoTransporte,
  Validacion,
} from "@/types/documentos";
import {
  ejecutarReglas,
  generarValidacionesINV_021,
  ACCIONES_SUGERIDAS,
} from "@/rules/motor";
import {
  normalizarFactura,
  normalizarPacking,
  normalizarTransporte,
} from "@/extraction/normalizar";

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

    // Guardar en temporales
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
      const resp = await analizarPdf(uri, promptFactura(), rutaFactura);
      return JSON.parse(limpiarJson(resp)) as FacturaComercial;
    })();

    const extraerPackingPromise = (async () => {
      const uri = await subirPdf(rutaPacking);
      const resp = await analizarPdf(uri, promptPackingList(), rutaPacking);
      return JSON.parse(limpiarJson(resp)) as PackingList;
    })();

    const extraerTransportePromise = rutaTransporte
      ? (async () => {
          const uri = await subirPdf(rutaTransporte);
          const resp = await analizarPdf(
            uri,
            promptTransporte(tipoTransporte),
            rutaTransporte
          );
          return JSON.parse(limpiarJson(resp)) as DocumentoTransporte;
        })()
      : Promise.resolve(null);

    const [facturaRaw, packingRaw, transporteRaw] = await Promise.all([
      extraerFacturaPromise,
      extraerPackingPromise,
      extraerTransportePromise,
    ]);

    // Normalizar: rellenar campos faltantes con valores por defecto
    const factura = normalizarFactura(facturaRaw);
    const packing = normalizarPacking(packingRaw);
    const transporte = transporteRaw
      ? normalizarTransporte(transporteRaw)
      : null;

    // Motor de reglas
    console.log("Ejecutando motor de reglas...");
    const { validaciones, advertencias, descripciones_a_evaluar } =
      ejecutarReglas(factura, packing, transporte);

    // Nivel 2: evaluar descripciones genéricas EN PARALELO
    const validacionesINV021: Validacion[] = [];

    if (descripciones_a_evaluar.length > 0) {
      console.log(
        `Evaluando ${descripciones_a_evaluar.length} descripción(es) en paralelo...`
      );

      const promesas = descripciones_a_evaluar.map(async (item) => {
        try {
          const prompt = promptEspecificidad(item.descripcion, {
            pais_origen: item.pais_origen,
            valor_linea: item.valor_linea,
            moneda: item.moneda,
          });
          const resultado = await evaluarEspecificidad(prompt);
          return {
            indice_linea: item.indice_linea,
            descripcion: item.descripcion,
            ...resultado,
          };
        } catch (err) {
          // No imprimir error: es una feature secundaria.
          // Si falla, simplemente no se evalúa esa descripción.
          return null;
        }
      });

      const resultados = (await Promise.all(promesas)).filter(
        (r): r is NonNullable<typeof r> => r !== null
      );

      const inv021 = generarValidacionesINV_021(resultados);
      for (const v of inv021) {
        v.accion_sugerida = ACCIONES_SUGERIDAS[v.regla] ?? "";
      }
      validacionesINV021.push(...inv021);
    }

    validaciones.push(...validacionesINV021);

    // Resultado global
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

    // Limpiar temporales
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