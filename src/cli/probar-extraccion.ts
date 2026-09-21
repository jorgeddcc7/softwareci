// ============================================================
// Script de prueba de extracción
// ============================================================
//
// Uso:
//   npx tsx src/cli/probar-extraccion.ts <ruta-pdf> <tipo-doc>
//
// Ejemplo:
//   npx tsx src/cli/probar-extraccion.ts samples/factura-test-01.pdf factura
//
// Este script es SOLO para desarrollo. No forma parte del producto final.
// ============================================================

import "dotenv/config";
import * as path from "path";
import * as fs from "fs";
import { subirPdf, analizarPdf } from "../extraction/gemini.js";
import { promptFactura, promptPackingList } from "../extraction/prompt.js";
import { promptTransporte } from "../extraction/prompt-transporte.js";

async function main() {
  // ---------------------------------------------
  // 1. Leer argumentos de línea de comandos
  // ---------------------------------------------
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Uso: npx tsx src/cli/probar-extraccion.ts <ruta-pdf> <tipo-doc>");
    console.error("  tipo-doc: factura | packing");
    process.exit(1);
  }

  const rutaPdf = path.resolve(args[0]);
  const tipoDoc = args[1].toLowerCase();

  if (!fs.existsSync(rutaPdf)) {
    console.error(`No existe el archivo: ${rutaPdf}`);
    process.exit(1);
  }

  if (
    tipoDoc !== "factura" &&
    tipoDoc !== "packing" &&
    tipoDoc !== "transporte"
  ) {
    console.error(
      'El tipo de documento debe ser "factura", "packing" o "transporte".'
    );
    process.exit(1);
  }

  console.log("============================================");
  console.log("  PRUEBA DE EXTRACCIÓN");
  console.log("============================================");
  console.log(`PDF: ${rutaPdf}`);
  console.log(`Tipo: ${tipoDoc}`);
  console.log("--------------------------------------------");

  // ---------------------------------------------
  // 2. Elegir el prompt adecuado
  // ---------------------------------------------
  let prompt: string;
  if (tipoDoc === "factura") {
    prompt = promptFactura();
  } else if (tipoDoc === "packing") {
    prompt = promptPackingList();
  } else {
    prompt = promptTransporte();
  }
  
  // ---------------------------------------------
  // 3. Subir el PDF a Gemini
  // ---------------------------------------------
  const uri = await subirPdf(rutaPdf);

  // ---------------------------------------------
  // 4. Analizar el PDF con el prompt
  // ---------------------------------------------
  const respuesta = await analizarPdf(uri, prompt);

  // ---------------------------------------------
  // 5. Limpiar la respuesta (Gemini a veces envuelve
  //    el JSON en bloques markdown ```json ... ```)
  // ---------------------------------------------
  let jsonLimpio = respuesta.trim();
  if (jsonLimpio.startsWith("```")) {
    jsonLimpio = jsonLimpio.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }

  // ---------------------------------------------
  // 6. Intentar parsear el JSON
  // ---------------------------------------------
  try {
    const datos = JSON.parse(jsonLimpio);
    console.log("--------------------------------------------");
    console.log("  JSON PARSEADO CORRECTAMENTE");
    console.log("--------------------------------------------");
    console.log(JSON.stringify(datos, null, 2));
  } catch (e) {
    console.error("--------------------------------------------");
    console.error("  ERROR: la respuesta no es JSON válido");
    console.error("--------------------------------------------");
    console.error("Respuesta cruda:");
    console.error(respuesta);
    console.error("");
    console.error("Error de parseo:", e);
    process.exit(1);
  }

  console.log("============================================");
  console.log("  FIN");
  console.log("============================================");
}

main().catch((err) => {
  console.error("Error inesperado:", err);
  process.exit(1);
});