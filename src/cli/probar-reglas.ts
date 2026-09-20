// ============================================================
// Script de prueba del motor de reglas
// ============================================================
//
// Uso:
//   npx tsx src/cli/probar-reglas.ts
//   npx tsx src/cli/probar-reglas.ts <factura.json> <packing.json>
//   npx tsx src/cli/probar-reglas.ts <factura.json> <packing.json> --sin-ia
//
// Sin argumentos: usa los JSON por defecto en samples/json/.
// Con --sin-ia: no llama a Gemini para el Nivel 2.
// ============================================================

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { FacturaComercial, PackingList, Validacion } from "../types/documentos.js";
import { ejecutarReglas, generarValidacionesINV_021 } from "../rules/motor.js";
import { promptEspecificidad } from "../extraction/prompt-especificidad.js";
import { evaluarEspecificidad } from "../extraction/gemini.js";

const RUTA_FACTURA_DEFECTO = path.resolve("samples/json/factura-test-01.json");
const RUTA_PACKING_DEFECTO = path.resolve("samples/json/packing-test-01.json");

function leerJson<T>(ruta: string): T {
  if (!fs.existsSync(ruta)) {
    throw new Error(`No existe el archivo: ${ruta}`);
  }
  const contenido = fs.readFileSync(ruta, "utf-8");
  return JSON.parse(contenido) as T;
}

function iconoResultado(v: Validacion): string {
  if (v.resultado === "ok") return "✅";
  if (v.resultado === "discrepancia") return "❌";
  return "⚠️";
}

function iconoSeveridad(sev: string): string {
  if (sev === "alta") return "🔴";
  if (sev === "media") return "🟡";
  return "🟢";
}

function imprimirValidacion(v: Validacion) {
  console.log(
    `${iconoResultado(v)} ${iconoSeveridad(v.severidad)} [${v.regla}] ${v.descripcion}`
  );
  console.log(`   Documentos: ${v.documentos.join(", ")}`);
  console.log(`   Campos: ${v.campos.join(", ")}`);
  if (v.nota) {
    console.log(`   Nota: ${v.nota}`);
  }
  console.log("");
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const sinIA = process.argv.includes("--sin-ia");

  const rutaFactura = args[0] ? path.resolve(args[0]) : RUTA_FACTURA_DEFECTO;
  const rutaPacking = args[1] ? path.resolve(args[1]) : RUTA_PACKING_DEFECTO;

  console.log("============================================");
  console.log("  PRUEBA DEL MOTOR DE REGLAS");
  console.log("============================================");
  console.log(`Factura: ${rutaFactura}`);
  console.log(`Packing: ${rutaPacking}`);
  if (sinIA) {
    console.log("Modo --sin-ia: no se evalúa el Nivel 2 con IA.");
  }

  const factura = leerJson<FacturaComercial>(rutaFactura);
  const packing = leerJson<PackingList>(rutaPacking);

  console.log(`Nº factura: ${factura.numero_factura.valor}`);
  console.log(`Nº packing: ${packing.numero_documento.valor}`);
  console.log("--------------------------------------------");

  // Ejecutar reglas deterministas
  const { validaciones, advertencias, descripciones_a_evaluar } = ejecutarReglas(
    factura,
    packing
  );

  // Nivel 2 con IA: evaluar las descripciones pendientes
  const validacionesINV021: Validacion[] = [];

  if (!sinIA && descripciones_a_evaluar.length > 0) {
    console.log(
      `Nivel 2: evaluando ${descripciones_a_evaluar.length} descripción(es) con IA...`
    );
    console.log("");

    const resultados: Array<{
      indice_linea: number;
      descripcion: string;
      es_especifica: boolean;
      motivo: string;
      sugerencia: string;
      confianza: "alta" | "media" | "baja";
    }> = [];

    for (const item of descripciones_a_evaluar) {
      try {
        const prompt = promptEspecificidad(item.descripcion, {
          pais_origen: item.pais_origen,
          valor_linea: item.valor_linea,
          moneda: item.moneda,
        });

        const resultado = await evaluarEspecificidad(prompt);
        resultados.push({
          indice_linea: item.indice_linea,
          descripcion: item.descripcion,
          ...resultado,
        });

        console.log(
          `  Línea ${item.indice_linea}: "${item.descripcion}" → ${
            resultado.es_especifica ? "✅ específica" : "❌ genérica"
          } (confianza: ${resultado.confianza})`
        );
      } catch (error) {
        console.error(
          `  Error evaluando línea ${item.indice_linea}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    console.log("");

    const inv021 = generarValidacionesINV_021(resultados);
    validacionesINV021.push(...inv021);
  }

  // Combinar todas las validaciones
  const todas = [...validaciones, ...validacionesINV021];

  const discrepanciasAltas = todas.filter(
    (v) => v.resultado === "discrepancia" && v.severidad === "alta"
  );
  const discrepanciasMedias = todas.filter(
    (v) => v.resultado === "discrepancia" && v.severidad === "media"
  );
  const discrepanciasBajas = todas.filter(
    (v) => v.resultado === "discrepancia" && v.severidad === "baja"
  );
  const noComprobables = todas.filter((v) => v.resultado === "no_comprobable");
  const oks = todas.filter((v) => v.resultado === "ok");

  if (discrepanciasAltas.length > 0) {
    console.log("🔴 DISCREPANCIAS DE SEVERIDAD ALTA");
    console.log("--------------------------------------------");
    for (const v of discrepanciasAltas) imprimirValidacion(v);
  }

  if (discrepanciasMedias.length > 0) {
    console.log("🟡 DISCREPANCIAS DE SEVERIDAD MEDIA");
    console.log("--------------------------------------------");
    for (const v of discrepanciasMedias) imprimirValidacion(v);
  }

  if (discrepanciasBajas.length > 0) {
    console.log("🟢 DISCREPANCIAS DE SEVERIDAD BAJA");
    console.log("--------------------------------------------");
    for (const v of discrepanciasBajas) imprimirValidacion(v);
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

  console.log("============================================");
  console.log("  RESUMEN");
  console.log("============================================");
  console.log(`  Total reglas ejecutadas:  ${todas.length}`);
  console.log(`  Discrepancias altas:      ${discrepanciasAltas.length}`);
  console.log(`  Discrepancias medias:     ${discrepanciasMedias.length}`);
  console.log(`  Discrepancias bajas:      ${discrepanciasBajas.length}`);
  console.log(`  No comprobables:          ${noComprobables.length}`);
  console.log(`  Correctas:                ${oks.length}`);
  console.log(`  Advertencias:             ${advertencias.length}`);
  console.log("============================================");
}

main().catch((err) => {
  console.error("Error inesperado:", err);
  process.exit(1);
});