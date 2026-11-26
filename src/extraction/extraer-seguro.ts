
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import type { DocumentoSeguroTransporte } from "@/types/seguro-transporte";

import { promptCertificadoSeguroTransporte } from "@/extraction/prompt-seguro";
import { validarDocumentoSeguro } from "@/extraction/validar-seguro";

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------

export type AnalizarPDFGemini = (
  rutaPDF: string,
  prompt: string
) => Promise<string>;

export interface OpcionesExtraccionSeguro {
  usarCache?: boolean;
}

export class ErrorExtraccionSeguro extends Error {
  constructor(
    message: string,
    public readonly erroresValidacion: string[] = []
  ) {
    super(message);
    this.name = "ErrorExtraccionSeguro";
  }
}

// -----------------------------------------------------------------------------
// Caché local por hash del PDF
// -----------------------------------------------------------------------------

const cacheRespuestas = new Map<string, string>();

async function obtenerHashPDF(rutaPDF: string): Promise<string> {
  const contenido = await readFile(rutaPDF);

  return createHash("sha256")
    .update(contenido)
    .digest("hex");
}

// -----------------------------------------------------------------------------
// Extracción
// -----------------------------------------------------------------------------

export async function extraerDocumentoSeguro(
  rutaPDF: string,
  analizarPDF: AnalizarPDFGemini,
  opciones: OpcionesExtraccionSeguro = {}
): Promise<DocumentoSeguroTransporte> {
  const usarCache = opciones.usarCache !== false;

  const hashPDF = await obtenerHashPDF(rutaPDF);

  let textoGemini: string | undefined;

  if (usarCache) {
    textoGemini = cacheRespuestas.get(hashPDF);
  }

  // Solo llamamos a Gemini si no existe una respuesta almacenada
  // para exactamente el mismo PDF.
  if (textoGemini === undefined) {
    const prompt = promptCertificadoSeguroTransporte();

    textoGemini = await analizarPDF(rutaPDF, prompt);

    if (usarCache) {
      // Guardamos la respuesta cruda antes de validarla.
      // Si falla el validador, una nueva prueba no consume
      // otra llamada a Gemini para el mismo archivo.
      cacheRespuestas.set(hashPDF, textoGemini);
    }
  }

  const resultado = validarDocumentoSeguro(textoGemini);

  if (!resultado.valido || !resultado.documento) {
    throw new ErrorExtraccionSeguro(
      "Gemini devolvió una respuesta que no supera la validación del certificado.",
      resultado.errores
    );
  }

  return resultado.documento;
}

// Utilidad para pruebas locales.
export function limpiarCacheSeguro(): void {
  cacheRespuestas.clear();
}
