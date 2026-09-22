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
 * Modelos en orden de preferencia.
 *
 * Criterio: priorizar los Flash-Lite porque tienen 500 RPD gratuitas
 * frente a las 20 RPD de los Flash normales.
 *
 * Si un modelo falla, se prueba el siguiente.
 */
const MODELOS_FALLBACK = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash",
];

/**
 * Cache en memoria del último modelo que funcionó. Se reinicia cada vez que se arranca el servidor. Permite no probar siempre desde el primer modelo cuando ya, sabemos cuál está funcionando en este momento.*/
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

// ============================================================
// Detección de tipo de error
// ============================================================

/**
 * Clasifica un error de Gemini:
 * - "recuperable": 503/429 → reintentar el mismo modelo.
 * - "modelo_no_existe": 404 → saltar al siguiente modelo.
 * - "fatal": cualquier otro → abortar.
 */
function detectarTipoError(
  error: unknown
): "recuperable" | "modelo_no_existe" | "fatal" {
  if (!error || typeof error !== "object") return "fatal";

  const err = error as { status?: number; message?: string; code?: string };

  // 404: modelo no existe en esta cuenta
  if (err.status === 404) return "modelo_no_existe";

  // 503 o 429: recuperable (saturado o rate limit)
  if (err.status === 503 || err.status === 429) return "recuperable";

  // Errores de red transitorios: recuperables
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

  // Comprobación en el mensaje como fallback
  if (typeof err.message === "string") {
    if (
      err.message.includes("NOT_FOUND") ||
      err.message.includes("no longer available")
    ) {
      return "modelo_no_existe";
    }
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

// ============================================================
// Análisis de PDF con fallback entre modelos
// ============================================================

/**
 * Envía un PDF ya subido + un prompt al modelo y devuelve
 * la respuesta como texto.
 *
 * Estrategia de fallback:
 * - Prueba cada modelo de MODELOS_FALLBACK en orden.
 * - Cada modelo tiene INTENTOS_POR_MODELO intentos.
 * - Si el modelo no existe (404), salta al siguiente sin esperar.
 * - Si está saturado (503/429), espera y reintenta.
 * - Si todos fallan, lanza error.
 */
export async function analizarPdf(
  uriPdf: string,
  prompt: string
): Promise<string> {
  const cliente = crearCliente();

  const RONDAS = 2; // Si todos fallan, hacemos una segunda ronda con espera
  const ESPERA_ENTRE_RONDAS = 15000; // 20 segundos

  let ultimoError: unknown = null;

  for (let ronda = 1; ronda <= RONDAS; ronda++) {
    if (ronda > 1) {
      console.log(
        `  Todos los modelos fallaron. Esperando ${ESPERA_ENTRE_RONDAS / 1000}s antes de reintentar (ronda ${ronda}/${RONDAS})...`
      );
      await new Promise((resolve) => setTimeout(resolve, ESPERA_ENTRE_RONDAS));
    }

    for (const modelo of obtenerModelosOrdenados()) {
      try {
        console.log(`  Enviando a Gemini [${modelo}] (ronda ${ronda}/${RONDAS})...`);

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

        // Recordar este modelo como preferido
        modeloPreferido = modelo;

        console.log(`  Respuesta recibida (${texto.length} caracteres).`);
        return texto;
      } catch (error: unknown) {
        ultimoError = error;
        const tipoError = detectarTipoError(error);

        // Error fatal: abortar inmediatamente
        if (tipoError === "fatal") {
          throw error;
        }

        // Modelo no existe: saltar al siguiente
        if (tipoError === "modelo_no_existe") {
          console.log(`  [${modelo}] no existe. Probando siguiente...`);
          continue;
        }

        // Recuperable (503/429/red): pasar al siguiente modelo
        console.log(`  [${modelo}] no disponible. Probando siguiente...`);
      }
    }
  }

  throw new Error(
    `Todos los modelos fallaron tras ${RONDAS} rondas. Último error: ${String(ultimoError)}`
  );
}

// ============================================================
// Evaluación de especificidad de descripciones (Nivel 2)
// ============================================================

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

  const RONDAS = 2;
  const ESPERA_ENTRE_RONDAS = 15000;

  let ultimoError: unknown = null;

  for (let ronda = 1; ronda <= RONDAS; ronda++) {
    if (ronda > 1) {
      await new Promise((resolve) => setTimeout(resolve, ESPERA_ENTRE_RONDAS));
    }

    for (const modelo of obtenerModelosOrdenados()) {
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
          limpio = limpio
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/```\s*$/, "");
        }

        // Recordar este modelo como preferido
        modeloPreferido = modelo;

        return JSON.parse(limpio);
      } catch (error: unknown) {
        ultimoError = error;
        const tipoError = detectarTipoError(error);

        if (tipoError === "fatal") throw error;
        if (tipoError === "modelo_no_existe") continue;

        console.log(`  [${modelo}] no disponible. Probando siguiente...`);
      }
    }
  }

  throw new Error(
    `Todos los modelos fallaron tras ${RONDAS} rondas. Último error: ${String(ultimoError)}`
  );
}

// ============================================================
// Análisis combinado (una sola llamada, múltiples PDFs)
// ============================================================

/**
 * Envía 2 o 3 PDFs ya subidos + un prompt combinado a Gemini y
 * devuelve la respuesta como texto.
 *
 * Usa la misma estrategia de fallback que analizarPdf.
 */
export async function analizarMultiplesPdfs(
  urisPdfs: string[],
  prompt: string
): Promise<string> {
  const cliente = crearCliente();

  const RONDAS = 2;
  const ESPERA_ENTRE_RONDAS = 15000;

  let ultimoError: unknown = null;

  for (let ronda = 1; ronda <= RONDAS; ronda++) {
    if (ronda > 1) {
      console.log(
        `  Todos los modelos fallaron. Esperando ${ESPERA_ENTRE_RONDAS / 1000}s antes de reintentar (ronda ${ronda}/${RONDAS})...`
      );
      await new Promise((resolve) => setTimeout(resolve, ESPERA_ENTRE_RONDAS));
    }

    for (const modelo of obtenerModelosOrdenados()) {
      try {
        console.log(
          `  Enviando a Gemini [${modelo}] con ${urisPdfs.length} PDF(s) (ronda ${ronda}/${RONDAS})...`
        );

        const partes: Array<
          | { text: string }
          | { fileData: { fileUri: string; mimeType: string } }
        > = [{ text: prompt }];

        for (const uri of urisPdfs) {
          partes.push({
            fileData: { fileUri: uri, mimeType: "application/pdf" },
          });
        }

        const respuesta = await cliente.models.generateContent({
          model: modelo,
          contents: [
            {
              role: "user",
              parts: partes,
            },
          ],
          config: {
            maxOutputTokens: 32000,
          },
        });

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
  }

  throw new Error(
    `Todos los modelos fallaron tras ${RONDAS} rondas. Último error: ${String(ultimoError)}`
  );
}