// ============================================================
// API Route: /api/analizar
// ============================================================
//
// Recibe dos o tres PDFs (factura, packing, y opcionalmente B/L),
// los procesa con Gemini, ejecuta el motor de reglas y devuelve
// el resultado.
// ============================================================

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
import { ejecutarReglas } from "@/rules/motor";

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

    // Guardar factura
    const facturaBuffer = Buffer.from(await facturaFile.arrayBuffer());
    const rutaFactura = await guardarTemporal("factura.pdf", facturaBuffer);

    // Guardar packing
    const packingBuffer = Buffer.from(await packingFile.arrayBuffer());
    const rutaPacking = await guardarTemporal("packing.pdf", packingBuffer);

    // Guardar transporte (opcional)
    let rutaTransporte: string | null = null;
    if (transporteFile) {
      const transporteBuffer = Buffer.from(await transporteFile.arrayBuffer());
      rutaTransporte = await guardarTemporal("transporte.pdf", transporteBuffer);
    }

    // Extraer factura
    const uriFactura = await subirPdf(rutaFactura);
    const respFactura = await analizarPdf(uriFactura, promptFactura());
    const factura = JSON.parse(limpiarJson(respFactura)) as FacturaComercial;

    // Extraer packing
    const uriPacking = await subirPdf(rutaPacking);
    const respPacking = await analizarPdf(uriPacking, promptPackingList());
    const packing = JSON.parse(limpiarJson(respPacking)) as PackingList;

    // Extraer transporte (si existe)
    let transporte: DocumentoTransporte | null = null;
    if (rutaTransporte) {
      const uriTransporte = await subirPdf(rutaTransporte);
      const respTransporte = await analizarPdf(uriTransporte, promptTransporte());
      transporte = JSON.parse(limpiarJson(respTransporte)) as DocumentoTransporte;
    }

    // Ejecutar motor de reglas
    const { validaciones, advertencias } = ejecutarReglas(
      factura,
      packing,
      transporte
    );

    // Calcular resultado global
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

    // Respuesta
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
            numero: transporte.numero_documento.valor,
            puerto_carga: transporte.puerto_carga.valor,
            puerto_descarga: transporte.puerto_descarga.valor,
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