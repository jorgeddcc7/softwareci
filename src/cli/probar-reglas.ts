// ============================================================
// Script de prueba del motor de reglas
// ============================================================
//
// Uso:
//   npx tsx src/cli/probar-reglas.ts
//
// Este script lee dos JSON guardados en samples/json/ y ejecuta
// el motor de reglas. No llama a ninguna API, es todo local.
// ============================================================

import * as fs from "fs";
import * as path from "path";
import { FacturaComercial, PackingList, Validacion } from "../types/documentos.js";
import { ejecutarReglas } from "../rules/motor.js";

const RUTA_FACTURA = path.resolve("samples/json/factura-test-01.json");
const RUTA_PACKING = path.resolve("samples/json/packing-test-01.json");

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

function main() {
  console.log("============================================");
  console.log("  PRUEBA DEL MOTOR DE REGLAS");
  console.log("============================================");

  const factura = leerJson<FacturaComercial>(RUTA_FACTURA);
  const packing = leerJson<PackingList>(RUTA_PACKING);

  console.log(`Factura: ${factura.numero_factura.valor}`);
  console.log(`Packing: ${packing.numero_documento.valor}`);
  console.log("--------------------------------------------");

  const { validaciones, advertencias } = ejecutarReglas(factura, packing);

  // Agrupar validaciones
  const discrepanciasAltas = validaciones.filter(
    (v) => v.resultado === "discrepancia" && v.severidad === "alta"
  );
  const discrepanciasMedias = validaciones.filter(
    (v) => v.resultado === "discrepancia" && v.severidad === "media"
  );
  const discrepanciasBajas = validaciones.filter(
    (v) => v.resultado === "discrepancia" && v.severidad === "baja"
  );
  const noComprobables = validaciones.filter((v) => v.resultado === "no_comprobable");
  const oks = validaciones.filter((v) => v.resultado === "ok");

  // Mostrar discrepancias altas primero
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
  console.log(`  Total reglas ejecutadas:  ${validaciones.length}`);
  console.log(`  Discrepancias altas:      ${discrepanciasAltas.length}`);
  console.log(`  Discrepancias medias:     ${discrepanciasMedias.length}`);
  console.log(`  Discrepancias bajas:      ${discrepanciasBajas.length}`);
  console.log(`  No comprobables:          ${noComprobables.length}`);
  console.log(`  Correctas:                ${oks.length}`);
  console.log(`  Advertencias:             ${advertencias.length}`);
  console.log("============================================");

  // Resultado global
  let resultadoGlobal: "apto" | "revisar" | "no_apto";
  if (discrepanciasAltas.length > 0) {
    resultadoGlobal = "no_apto";
  } else if (discrepanciasMedias.length > 0 || noComprobables.length > 0) {
    resultadoGlobal = "revisar";
  } else {
    resultadoGlobal = "apto";
  }
  console.log(`  RESULTADO GLOBAL: ${resultadoGlobal.toUpperCase()}`);
  console.log("============================================");
}

main();