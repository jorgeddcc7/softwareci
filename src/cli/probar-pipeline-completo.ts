// ============================================================
// Script de prueba del pipeline completo
// ============================================================
//
// Uso:
//   npx tsx src/cli/probar-pipeline-completo.ts <factura.pdf> <packing.pdf>
//   npx tsx src/cli/probar-pipeline-completo.ts <factura.pdf> <packing.pdf> --forzar
//
// Ejemplo:
//   npx tsx src/cli/probar-pipeline-completo.ts samples/factura-test-01.pdf samples/packing-test-01.pdf
//
// Comportamiento:
//   - Si existe JSON cacheado en samples/json/, lo usa (no llama a Gemini).
//   - Si no existe, o si pasas --forzar, llama a Gemini y guarda el JSON.
// ============================================================

import "dotenv/config";
import * as path from "path";
import * as fs from "fs";
import { subirPdf, analizarPdf } from "../extraction/gemini.js";
import { promptFactura, promptPackingList } from "../extraction/prompt.js";
import { FacturaComercial, PackingList, Validacion } from "../types/documentos.js";
import { ejecutarReglas } from "../rules/motor";

// ------------------------------------------------------------
// Rutas de caché
// ------------------------------------------------------------

const RUTA_FACTURA_JSON = path.resolve("samples/json/factura-test-01.json");
const RUTA_PACKING_JSON = path.resolve("samples/json/packing-test-01.json");

// ------------------------------------------------------------
// Utilidades
// ------------------------------------------------------------

function limpiarJson(texto: string): string {
  let limpio = texto.trim();
  if (limpio.startsWith("```")) {
    limpio = limpio.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  return limpio;
}

/**
 * Intenta leer un JSON cacheado. Si no existe, devuelve null.
 */
function leerCache<T>(rutaCache: string): T | null {
  if (!fs.existsSync(rutaCache)) return null;
  try {
    const contenido = fs.readFileSync(rutaCache, "utf-8");
    return JSON.parse(contenido) as T;
  } catch {
    return null;
  }
}

/**
 * Guarda un objeto como JSON en la ruta indicada.
 */
function guardarCache(rutaCache: string, datos: unknown): void {
  const dir = path.dirname(rutaCache);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(rutaCache, JSON.stringify(datos, null, 2), "utf-8");
}

/**
 * Extrae un documento: primero mira el caché, si no existe o se fuerza,
 * llama a Gemini y guarda el resultado.
 */
async function extraerConCache<T>(
  rutaPdf: string,
  rutaCache: string,
  nombreDocumento: string,
  forzar: boolean,
  extractor: (rutaPdf: string) => Promise<T>
): Promise<T> {
  if (!forzar) {
    const cache = leerCache<T>(rutaCache);
    if (cache) {
      console.log(`  [${nombreDocumento}] Usando JSON cacheado: ${path.basename(rutaCache)}`);
      return cache;
    }
  }

  console.log(`  [${nombreDocumento}] Extrayendo con Gemini...`);
  const resultado = await extractor(rutaPdf);
  guardarCache(rutaCache, resultado);
  console.log(`  [${nombreDocumento}] JSON guardado en caché: ${path.basename(rutaCache)}`);
  return resultado;
}

async function extraerFactura(rutaPdf: string): Promise<FacturaComercial> {
  const uri = await subirPdf(rutaPdf);
  const respuesta = await analizarPdf(uri, promptFactura());
  return JSON.parse(limpiarJson(respuesta)) as FacturaComercial;
}

async function extraerPacking(rutaPdf: string): Promise<PackingList> {
  const uri = await subirPdf(rutaPdf);
  const respuesta = await analizarPdf(uri, promptPackingList());
  return JSON.parse(limpiarJson(respuesta)) as PackingList;
}

// ------------------------------------------------------------
// Impresión del resultado
// ------------------------------------------------------------

function imprimirValidacion(v: Validacion) {
  const iconoResultado =
    v.resultado === "ok" ? "✅" : v.resultado === "discrepancia" ? "❌" : "⚠️";
  const iconoSeveridad = v.severidad === "alta" ? "🔴" : v.severidad === "media" ? "🟡" : "🟢";

  console.log(`${iconoResultado} ${iconoSeveridad} [${v.regla}] ${v.descripcion}`);
  console.log(`   Documentos: ${v.documentos.join(", ")}`);
  console.log(`   Campos: ${v.campos.join(", ")}`);
  if (v.nota) {
    console.log(`   Nota: ${v.nota}`);
  }
  console.log("");
}

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const forzar = process.argv.includes("--forzar");

  if (args.length < 2) {
    console.error("Uso: npx tsx src/cli/probar-pipeline-completo.ts <factura.pdf> <packing.pdf> [--forzar]");
    process.exit(1);
  }

  const rutaFactura = path.resolve(args[0]);
  const rutaPacking = path.resolve(args[1]);

  if (!fs.existsSync(rutaFactura)) {
    console.error(`No existe: ${rutaFactura}`);
    process.exit(1);
  }
  if (!fs.existsSync(rutaPacking)) {
    console.error(`No existe: ${rutaPacking}`);
    process.exit(1);
  }

  console.log("============================================");
  console.log("  PIPELINE COMPLETO");
  console.log("============================================");
  if (forzar) {
    console.log("  Modo --forzar: se ignora el caché.");
  }

  const factura = await extraerConCache(
    rutaFactura,
    RUTA_FACTURA_JSON,
    "factura",
    forzar,
    extraerFactura
  );

  const packing = await extraerConCache(
    rutaPacking,
    RUTA_PACKING_JSON,
    "packing",
    forzar,
    extraerPacking
  );

  console.log("[3/3] Ejecutando motor de reglas...\n");

  const { validaciones, advertencias } = ejecutarReglas(factura, packing);

  console.log("============================================");
  console.log("  RESULTADO");
  console.log("============================================");
  console.log(`Factura: ${factura.numero_factura.valor}`);
  console.log(`Packing: ${packing.numero_documento.valor}`);
  console.log("--------------------------------------------");

  const altas = validaciones.filter(
    (v) => v.resultado === "discrepancia" && v.severidad === "alta"
  );
  const medias = validaciones.filter(
    (v) => v.resultado === "discrepancia" && v.severidad === "media"
  );
  const bajas = validaciones.filter(
    (v) => v.resultado === "discrepancia" && v.severidad === "baja"
  );
  const noComprobables = validaciones.filter((v) => v.resultado === "no_comprobable");
  const oks = validaciones.filter((v) => v.resultado === "ok");

  if (altas.length > 0) {
    console.log("🔴 DISCREPANCIAS DE SEVERIDAD ALTA");
    console.log("--------------------------------------------");
    for (const v of altas) imprimirValidacion(v);
  }
  if (medias.length > 0) {
    console.log("🟡 DISCREPANCIAS DE SEVERIDAD MEDIA");
    console.log("--------------------------------------------");
    for (const v of medias) imprimirValidacion(v);
  }
  if (bajas.length > 0) {
    console.log("🟢 DISCREPANCIAS DE SEVERIDAD BAJA");
    console.log("--------------------------------------------");
    for (const v of bajas) imprimirValidacion(v);
  }
  if (noComprobables.length > 0) {
    console.log("⚠️  NO COMPROBABLES");
    console.log("--------------------------------------------");
    for (const v of noComprobables) imprimirValidacion(v);
  }
  if (oks.length > 0) {
    console.log(`✅ VALIDACIONES CORRECTAS (${oks.length})`);
    console.log("--------------------------------------------");
    for (const v of oks) {
      console.log(`✅ [${v.regla}] ${v.descripcion}`);
    }
    console.log("");
  }
  if (advertencias.length > 0) {
    console.log("📌 ADVERTENCIAS");
    console.log("--------------------------------------------");
    for (const a of advertencias) console.log(`- ${a}`);
    console.log("");
  }

  let resultadoGlobal: "apto" | "revisar" | "no_apto";
  if (altas.length > 0) resultadoGlobal = "no_apto";
  else if (medias.length > 0 || noComprobables.length > 0) resultadoGlobal = "revisar";
  else resultadoGlobal = "apto";

  console.log("============================================");
  console.log("  RESUMEN");
  console.log("============================================");
  console.log(`  Total reglas ejecutadas:  ${validaciones.length}`);
  console.log(`  Discrepancias altas:      ${altas.length}`);
  console.log(`  Discrepancias medias:     ${medias.length}`);
  console.log(`  Discrepancias bajas:      ${bajas.length}`);
  console.log(`  No comprobables:          ${noComprobables.length}`);
  console.log(`  Correctas:                ${oks.length}`);
  console.log(`  Advertencias:             ${advertencias.length}`);
  console.log(`  RESULTADO GLOBAL:         ${resultadoGlobal.toUpperCase()}`);
  console.log("============================================");
}

main().catch((err) => {
  console.error("Error inesperado:", err);
  process.exit(1);
});