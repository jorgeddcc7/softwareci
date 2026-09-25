// ============================================================
// Conexión con Gemini API (con fallback a OpenRouter)
// ============================================================
//
// Este archivo encapsula toda la comunicación con Gemini.
// Si Gemini falla (saturado, timeout, etc.), intenta con OpenRouter.
//
// Modelos en orden de preferencia: Flash-Lite primero (500 RPD gratis).
// ============================================================

import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { analizarConOpenRouter } from "./openrouter";
import { extraerTextoConSiliconFlow } from "./siliconflow";

/**
 * Modelos en orden de preferencia.
 * Flash-Lite tiene 500 RPD gratuitas vs 20 RPD de Flash normales.
 */
const MODELOS_FALLBACK = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash",
];

/**
 * Cache en memoria del último modelo que funcionó.
 * Se reinicia cada vez que se arranca el servidor.
 */
let modeloPreferido: string | null = null;

/**
 * Devuelve la lista de modelos ordenada, con el último que funcionó primero.
 */
function obtenerModelosOrdenados(): string[] {
  if (!modeloPreferido) return MODELOS_FALLBACK;
  const resto = MODELOS_FALLBACK.filter((m) => m !== modeloPreferido);
  return [modeloPreferido, ...resto];
}

/**
 * Verifica que la API key de Gemini esté configurada.
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
 * Ejecuta una promesa con timeout.
 */
function conTimeout<T>(
  promesa: Promise<T>,
  ms: number,
  mensaje: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout tras ${ms}ms: ${mensaje}`));
    }, ms);

    promesa
      .then((resultado) => {
        clearTimeout(timer);
        resolve(resultado);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Clasifica un error:
 * - "recuperable": 503/429/timeout → probar siguiente modelo.
 * - "modelo_no_existe": 404 → saltar al siguiente modelo.
 * - "fatal": cualquier otro → abortar.
 */
function detectarTipoError(
  error: unknown
): "recuperable" | "modelo_no_existe" | "fatal" {
  if (!error || typeof error !== "object") return "fatal";

  const err = error as {
    status?: number;
    message?: string;
    code?: string;
  };

  // 404: modelo no existe en esta cuenta
  if (err.status === 404) return "modelo_no_existe";

  // 503 o 429: recuperable
  if (err.status === 503 || err.status === 429) return "recuperable";

  // Errores de red transitorios
  if (err.code) {
    if (
      err.code === "UND_ERR_HEADERS_TIMEOUT" ||
      err.code === "UND_ERR_CONNECT_TIMEOUT" ||
      err.code === "UND_ERR_SOCKET" ||
      err.code === "ECONNRESET" ||
      err.code === "ETIMEDOUT"
    ) {
      return "recuperable";
    }
  }

  // Comprobación en el mensaje
  if (typeof err.message === "string") {
    // Timeout propio: recuperable (probar siguiente modelo)
    if (
      err.message.includes("Timeout tras") ||
      err.message.includes("no respondió en")
    ) {
      return "recuperable";
    }

    // Modelo no existe
    if (
      err.message.includes("NOT_FOUND") ||
      err.message.includes("no longer available")
    ) {
      return "modelo_no_existe";
    }

    // Saturado / rate limit
    if (
      err.message.includes("503") ||
      err.message.includes("UNAVAILABLE")
    ) {
      return "recuperable";
    }
    if (
      err.message.includes("429") ||
      err.message.includes("RESOURCE_EXHAUSTED")
    ) {
      return "recuperable";
    }
    if (err.message.includes("high demand")) return "recuperable";
    if (err.message.includes("fetch failed")) return "recuperable";
    if (err.message.includes("Headers Timeout")) return "recuperable";
    if (err.message.includes("network")) return "recuperable";
  }

  return "fatal";
}

/**
 * Sube un PDF a la API de Gemini.
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

// Análisis de PDF con fallback Gemini → OpenRouter
/**
 * Envía un PDF + prompt. Prueba los modelos de Gemini en orden.
 * Si todos fallan, usa OpenRouter.
 *
 * - 1 intento por modelo (si falla, siguiente).
 * - Timeout de 40s por intento.
 * - Si los 3 modelos fallan → OpenRouter.
 */
/**
 * Envía un PDF + prompt. Prueba los modelos de Gemini en orden.
 * Si todos fallan, usa OpenRouter con el PDF en base64.
 *
 * @param uriPdf - URI del PDF subido a Gemini (para Gemini).
 * @param prompt - Prompt de análisis.
 * @param rutaPdfLocal - Ruta local del PDF (para OpenRouter).
 */
export async function analizarPdf(
  uriPdf: string,
  prompt: string,
  rutaPdfLocal?: string
): Promise<string> {
  const cliente = crearCliente();

  const TIMEOUT_POR_INTENTO = 40000; // 40 segundos

  let ultimoError: unknown = null;

  for (const modelo of obtenerModelosOrdenados()) {
    try {
      console.log(`  Enviando a Gemini [${modelo}]...`);

      const respuesta = await conTimeout(
        cliente.models.generateContent({
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
        }),
        TIMEOUT_POR_INTENTO,
        `${modelo} no respondió en ${TIMEOUT_POR_INTENTO / 1000}s`
      );

      const texto = respuesta.text;
      if (!texto) {
        throw new Error("Gemini no devolvió texto en la respuesta.");
      }

      modeloPreferido = modelo;
      console.log(`  Respuesta recibida (${texto.length} caracteres).`);
      return texto;
    } catch (error: unknown) {
      ultimoError = error;
      const tipoError = detectarTipoError(error);

      if (tipoError === "fatal") {
        throw error;
      }

      if (tipoError === "modelo_no_existe") {
        console.log(`  [${modelo}] no existe. Probando siguiente...`);
        continue;
      }

      console.log(`  [${modelo}] no disponible. Probando siguiente...`);
    }
  }

  // Fallback a OpenRouter
  if (!rutaPdfLocal) {
    throw new Error(
      `Todos los modelos de Gemini fallaron y no hay ruta local para OpenRouter. Último error: ${String(ultimoError)}`
    );
  }

  try {
    console.log("  Todos los modelos de Gemini fallaron. Probando OpenRouter...");
    return await conTimeout(
      analizarConOpenRouter(rutaPdfLocal, prompt),
      30000,
      "OpenRouter no respondió en 30s"
    );
  } catch (openRouterError) {
    console.error("  OpenRouter también falló:", openRouterError);

    // Fallback final: DeepSeek-OCR (SiliconFlow)
    try {
      console.log("  Probando DeepSeek-OCR (SiliconFlow)...");
      const textoMarkdown = await conTimeout(
        extraerTextoConSiliconFlow(rutaPdfLocal),
        45000,
        "DeepSeek-OCR no respondió en 45s"
      );

      // El texto extraído es Markdown, no JSON.
      // Hay que devolverlo para que el route lo procese.
      // NOTA: Esto requiere un paso adicional de estructuración.
      throw new Error(
        "DeepSeek-OCR extrajo el texto pero no lo estructuró. " +
        "Se requiere integración con LLM para estructurar el JSON."
      );
    } catch (deepSeekError) {
      console.error("  DeepSeek-OCR también falló:", deepSeekError);
      throw new Error(
        `Todos los motores (Gemini + OpenRouter + DeepSeek-OCR) fallaron. ` +
        `Último error Gemini: ${String(ultimoError)}`
      );
    }
  }
}

// ============================================================
// Evaluación de especificidad de descripciones (Nivel 2)
// ============================================================

/**
 * Evalúa si una descripción comercial es suficientemente específica.
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

  const TIMEOUT_POR_INTENTO = 15000; // 15s por modelo

  let ultimoError: unknown = null;

  for (const modelo of obtenerModelosOrdenados()) {
    try {
      const respuesta = await conTimeout(
        cliente.models.generateContent({
          model: modelo,
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
        TIMEOUT_POR_INTENTO,
        `${modelo} no respondió en ${TIMEOUT_POR_INTENTO / 1000}s`
      );

      const texto = respuesta.text;
      if (!texto) {
        throw new Error("Gemini no devolvió texto en la respuesta.");
      }

      let limpio = texto.trim();
      if (limpio.startsWith("```")) {
        limpio = limpio
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/```\s*$/, "");
      }

      modeloPreferido = modelo;
      return JSON.parse(limpio);
    } catch (error: unknown) {
      ultimoError = error;
      const tipoError = detectarTipoError(error);

      if (tipoError === "fatal") throw error;
      if (tipoError === "modelo_no_existe") continue;

      // No imprimir error, solo seguir al siguiente modelo
    }
  }

  // Si todos los modelos de Gemini fallan, no evaluamos esta descripción.
  // Es una feature secundaria; el análisis principal ya está hecho.
  throw new Error(
    `No se pudo evaluar la descripción (todos los modelos saturados).`
  );
}