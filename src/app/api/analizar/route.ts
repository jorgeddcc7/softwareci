// ============================================================
// API Route: /api/analizar
// ============================================================
//
// Recibe dos PDFs (factura y packing), los procesa con Gemini,
// ejecuta el motor de reglas y devuelve el resultado.
//
// Este código se ejecuta en el SERVIDOR de Next.js (Node.js),
// no en el navegador. Por eso puede usar @google/genai, fs, etc.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { subirPdf, analizarPdf } from "@/extraction/gemini";
import { promptFactura, promptPackingList } from "@/extraction/prompt";
import { FacturaComercial, PackingList } from "@/types/documentos";
import { ejecutarReglas } from "@/rules/motor";

// Las API routes de Next.js usan el runtime de Node.js por defecto.
// Necesitamos tiempo suficiente para que Gemini responda.
export const maxDuration = 300;

/**
 * Limpia un texto que puede venir envuelto en bloques markdown.
 */
function limpiarJson(texto: string): string {
  let limpio = texto.trim();
  if (limpio.startsWith("```")) {
    limpio = limpio.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  return limpio;
}

/**
 * Guarda un archivo temporal en disco (necesario para subirlo a Gemini).
 * Devuelve la ruta del archivo.
 */
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
    // 1. Leer los archivos del FormData
    const formData = await request.formData();
    const facturaFile = formData.get("factura") as File | null;
    const packingFile = formData.get("packing") as File | null;

    if (!facturaFile || !packingFile) {
      return NextResponse.json(
        { error: "Se requieren dos archivos: factura y packing." },
        { status: 400 }
      );
    }

    // 2. Convertir a Buffer
    const facturaBuffer = Buffer.from(await facturaFile.arrayBuffer());
    const packingBuffer = Buffer.from(await packingFile.arrayBuffer());

    // 3. Guardar en archivos temporales (Gemini necesita rutas de archivo)
    const rutaFactura = await guardarTemporal("factura.pdf", facturaBuffer);
    const rutaPacking = await guardarTemporal("packing.pdf", packingBuffer);

    // 4. Extraer la factura
    const uriFactura = await subirPdf(rutaFactura);
    const respFactura = await analizarPdf(uriFactura, promptFactura());
    const factura = JSON.parse(limpiarJson(respFactura)) as FacturaComercial;

    // 5. Extraer el packing list
    const uriPacking = await subirPdf(rutaPacking);
    const respPacking = await analizarPdf(uriPacking, promptPackingList());
    const packing = JSON.parse(limpiarJson(respPacking)) as PackingList;

    // 6. Ejecutar motor de reglas
    const { validaciones, advertencias } = ejecutarReglas(factura, packing);

    // 7. Calcular resultado global
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

    // 8. Limpiar archivos temporales
    try {
      fs.unlinkSync(rutaFactura);
      fs.unlinkSync(rutaPacking);
    } catch {
      // Si falla, no pasa nada, el sistema operativo limpia /tmp
    }

    // 9. Devolver el resultado
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