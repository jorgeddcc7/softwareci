// ============================================================
// Conexión con Gemini API
// ============================================================
//
// Este archivo encapsula toda la comunicación con Gemini.
// El resto del sistema no sabe cómo funciona la API; solo
// llama a estas funciones.
//
// Requisitos:
// - Variable de entorno GEMINI_API_KEY en el archivo .env
// - PDF subido a la API de Gemini (Files API)
// ============================================================

import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

/**
 * Modelo a usar. Gemini Flash es el más rápido y barato,
 * y está incluido en el nivel gratuito.
 */
const MODELOS_FALLBACK = [
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash",
];

/**
 * Verifica que la API key esté configurada.
 * Si no, lanza un error claro en lugar de fallar de forma confusa.
 */
function verificarApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey.includes("tu_clave_aqui")) {
    throw new Error(
      "Falta GEMINI_API_KEY en el archivo .env. " +
        "Crea el archivo .env en la raíz del proyecto con: GEMINI_API_KEY=AIza..."
    );
  }
  return apiKey;
}

/**
 * Crea el cliente de Gemini usando la API key del entorno.
 */
function crearCliente(): GoogleGenAI {
  const apiKey = verificarApiKey();
  return new GoogleGenAI({ apiKey });
}

/**
 * Sube un PDF a la API de Gemini.
 * Devuelve la URI del archivo subido, que luego se pasa al modelo.
 *
 * Los archivos subidos se almacenan temporalmente (48h) y se
 * pueden usar en múltiples peticiones sin volver a subirlos.
 */
export async function subirPdf(rutaPdf: string): Promise<string> {
  const cliente = crearCliente();

  if (!fs.existsSync(rutaPdf)) {
    throw new Error(`No se encuentra el archivo PDF: ${rutaPdf}`);
  }

  const nombreArchivo = path.basename(rutaPdf);
  console.log(`  Subiendo PDF: ${nombreArchivo}...`);

  const archivo = await cliente.files.upload({
    file: rutaPdf,
    config: { mimeType: "application/pdf" },
  });

if (!archivo.uri) {
  throw new Error("La API de Gemini no devolvió una URI válida para el PDF.");
}

console.log(`  PDF subido. URI: ${archivo.uri}`);
return archivo.uri;
}

/**
 * Envía un PDF ya subido + un prompt al modelo y devuelve
 * la respuesta como texto.
 *
 * Si Gemini devuelve 503 (servidor saturado) o 429 (rate limit),
 * reintenta hasta 3 veces con espera creciente entre intentos.
 */
/**
 * Envía un PDF ya subido + un prompt al modelo y devuelve
 * la respuesta como texto.
 *
 * Estrategia de fallback:
 * - Prueba cada modelo de la lista MODELOS_FALLBACK en orden.
 * - Cada modelo tiene 2 intentos con espera creciente.
 * - Si un modelo falla 2 veces, pasa al siguiente.
 * - Si todos fallan, lanza error.
 */
export async function analizarPdf(
  uriPdf: string,
  prompt: string
): Promise<string> {
  const cliente = crearCliente();

  const INTENTOS_POR_MODELO = 1;
  const ESPERA_BASE_MS = 3000; // 3 segundos (por si acaso)

  let ultimoError: unknown = null;

  for (const modelo of MODELOS_FALLBACK) {
    for (let intento = 1; intento <= INTENTOS_POR_MODELO; intento++) {
      try {
        console.log(
          `  Enviando a Gemini [${modelo}] (intento ${intento}/${INTENTOS_POR_MODELO})...`
        );

        const respuesta = await cliente.models.generateContent({
          model: modelo,
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  fileData: {
                    fileUri: uriPdf,
                    mimeType: "application/pdf",
                  },
                },
              ],
            },
          ],
        });

        const texto = respuesta.text;
        if (!texto) {
          throw new Error("Gemini no devolvió texto en la respuesta.");
        }

        console.log(`  Respuesta recibida (${texto.length} caracteres).`);
        return texto;
      } catch (error: unknown) {
        ultimoError = error;

        const esRecuperable = detectarErrorRecuperable(error);

        if (!esRecuperable) {
          // Error no recuperable: lanzamos inmediatamente
          throw error;
        }

        if (intento < INTENTOS_POR_MODELO) {
          const espera = ESPERA_BASE_MS * intento;
          console.log(
            `  [${modelo}] saturado. Reintentando en ${espera / 1000}s...`
          );
          await new Promise((resolve) => setTimeout(resolve, espera));
        } else {
          console.log(
            `  [${modelo}] falló tras ${INTENTOS_POR_MODELO} intentos. Probando siguiente modelo...`
          );
        }
      }
    }
  }

  throw new Error(
    `Todos los modelos fallaron. Último error: ${String(ultimoError)}`
  );
}

/**
 * Detecta si un error de Gemini es recuperable (503, 429)
 * y merece la pena reintentar.
 */
function detectarErrorRecuperable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  // La librería de Google lanza ApiError con campo status numérico
  const err = error as { status?: number; message?: string };

  if (err.status === 503 || err.status === 429) return true;

  // Fallback: buscar en el mensaje
  if (typeof err.message === "string") {
    if (err.message.includes("503") || err.message.includes("UNAVAILABLE")) return true;
    if (err.message.includes("429") || err.message.includes("RESOURCE_EXHAUSTED")) return true;
    if (err.message.includes("high demand")) return true;
  }

  return false;
}

// ============================================================
// Evaluación de especificidad de descripciones (Nivel 2)
// ============================================================

/**
 * Evalúa si una descripción comercial es suficientemente específica.
 * Devuelve un objeto con el resultado.
 *
 * Solo se llama para descripciones que NO han sido detectadas
 * por la lista negra determinista.
 */
/**
 * Evalúa si una descripción comercial es suficientemente específica.
 * Usa la misma estrategia de fallback que analizarPdf.
 */
export async function evaluarEspecificidad(
  prompt: string
): Promise<{
  es_especifica: boolean;
  motivo: string;
  elementos_presentes: string[];
  sugerencia: string;
  confianza: "alta" | "media" | "baja";
}> {
  const cliente = crearCliente();

  const INTENTOS_POR_MODELO = 1;
  const ESPERA_BASE_MS = 3000;

  let ultimoError: unknown = null;

  for (const modelo of MODELOS_FALLBACK) {
    for (let intento = 1; intento <= INTENTOS_POR_MODELO; intento++) {
      try {
        const respuesta = await cliente.models.generateContent({
          model: modelo,
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        });

        const texto = respuesta.text;
        if (!texto) {
          throw new Error("Gemini no devolvió texto en la respuesta.");
        }

        let limpio = texto.trim();
        if (limpio.startsWith("```")) {
          limpio = limpio.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
        }

        return JSON.parse(limpio);
      } catch (error: unknown) {
        ultimoError = error;

        const esRecuperable = detectarErrorRecuperable(error);
        if (!esRecuperable) throw error;

        if (intento < INTENTOS_POR_MODELO) {
          const espera = ESPERA_BASE_MS * intento;
          console.log(
            `  [${modelo}] saturado. Reintentando en ${espera / 1000}s...`
          );
          await new Promise((resolve) => setTimeout(resolve, espera));
        } else {
          console.log(
            `  [${modelo}] falló tras ${INTENTOS_POR_MODELO} intentos. Probando siguiente modelo...`
          );
        }
      }
    }
  }

  throw new Error(
    `Todos los modelos fallaron. Último error: ${String(ultimoError)}`
  );
}