import fs from "fs/promises";
import path from "path";

import {
  promptPresupuestoLogistico,
  promptFacturaLogistica,
} from "./prompt-auditoria-logistica";

import { parsearDocumentoLogistico } from "./validar-auditoria-logistica";

import type {
  DocumentoCostesLogisticos,
  TipoDocumentoLogistico,
} from "@/types/auditoria-logistica";

import { 
  subirPdf, 
  analizarPdf as geminiAnalizarPdf, 
  eliminarPdfRemoto 
} from "./gemini";

export type AnalizarPDFGemini = (
  rutaPDF: string,
  prompt: string
) => Promise<string>;

export const analizarPDF: AnalizarPDFGemini = async (
  rutaPDF,
  prompt
): Promise<string> => {
  let nombreArchivoRemoto: string | null = null;

  try {
    const uriPDF = await subirPdf(
      rutaPDF,
      (nombre) => {
        nombreArchivoRemoto = nombre;
      }
    );
    return await geminiAnalizarPdf(uriPDF, prompt, rutaPDF);
  } finally {
    if (nombreArchivoRemoto) {
      try {
        await eliminarPdfRemoto(nombreArchivoRemoto);
      } catch (error) {
        console.error("[Auditor logístico] Error eliminando PDF remoto:", error);
      }
    }
  }
};

export async function extraerDocumentoLogistico(
  rutaPDF: string,
  tipo: TipoDocumentoLogistico,
  analizarPDFFunction: AnalizarPDFGemini
): Promise<DocumentoCostesLogisticos> {
  if (!rutaPDF) {
    throw new Error("No se ha proporcionado la ruta del PDF.");
  }

  const prompt = tipo === "presupuesto" ? promptPresupuestoLogistico() : promptFacturaLogistica();
  
  // LÓGICA DE CACHÉ PARA AHORRAR CRÉDITOS EN DESARROLLO
  const cachePath = path.join(process.cwd(), `cache-debug-${tipo}.json`);
  let respuesta: string;

  try {
    // Intenta leer de la caché
    respuesta = await fs.readFile(cachePath, "utf-8");
    console.log(`[Caché] Usando respuesta guardada para ${tipo}. No se ha llamado a Gemini.`);
  } catch {
    // Si no existe, llama a Gemini y guarda el resultado
    console.log(`[API] Llamando a Gemini para ${tipo}...`);
    respuesta = await analizarPDFFunction(rutaPDF, prompt);
    await fs.writeFile(cachePath, respuesta, "utf-8");
    console.log(`[Caché] Respuesta guardada en ${cachePath}`);
  }

  if (!respuesta || !respuesta.trim()) {
    throw new Error(`Gemini no ha devuelto contenido para el documento: ${tipo}.`);
  }

  return parsearDocumentoLogistico(respuesta, tipo);
}