// ============================================================
// Conexión con Gemini API (con fallback a OpenRouter)
// ============================================================

import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { analizarConOpenRouter } from "./openrouter";

const MODELOS_FALLBACK = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
];

let modeloPreferido: string | null = null;

function obtenerModelosOrdenados(): string[] {
  if (!modeloPreferido) return MODELOS_FALLBACK;
  const resto = MODELOS_FALLBACK.filter((m) => m !== modeloPreferido);
  return [modeloPreferido, ...resto];
}

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

function crearCliente(): GoogleGenAI {
  const apiKey = verificarApiKey();
  return new GoogleGenAI({ apiKey });
}

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

function detectarTipoError(
  error: unknown
): "recuperable" | "modelo_no_existe" | "fatal" {
  if (!error || typeof error !== "object") return "fatal";

  const err = error as {
    status?: number;
    message?: string;
    code?: string;
  };

  if (err.status === 404) return "modelo_no_existe";
  if (err.status === 503 || err.status === 429) return "recuperable";

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

  if (typeof err.message === "string") {
    if (
      err.message.includes("Timeout tras") ||
      err.message.includes("no respondió en")
    ) {
      return "recuperable";
    }
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

export async function analizarPdf(
  uriPdf: string,
  prompt: string,
  rutaPdfLocal?: string
): Promise<string> {
  const cliente = crearCliente();
  const TIMEOUT_POR_INTENTO = 40000;
  let ultimoError: unknown = null;

  // Lista de modelos GRATUITOS (se prueban primero)
  const modelosGratuitos = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
  ];

  // Modelo de PAGO (solo si todos los gratuitos fallan)
  const modeloDePago = "gemini-3.8-flash";

  // 1. Intentar con modelos gratuitos
  for (const modelo of modelosGratuitos) {
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
                  fileData: { fileUri: uriPdf, mimeType: "application/pdf" },
                },
              ],
            },
          ],
        }),
        TIMEOUT_POR_INTENTO,
        `${modelo} no respondió en ${TIMEOUT_POR_INTENTO / 1000}s`
      );

      const texto = respuesta.text;
      if (!texto) throw new Error("Gemini no devolvió texto.");

      modeloPreferido = modelo;
      console.log(`  Respuesta recibida (${texto.length} caracteres).`);
      return texto;
    } catch (error: unknown) {
      ultimoError = error;
      console.log(`  [${modelo}] no disponible. Probando siguiente...`);
    }
  }

  // 2. Si todos los gratuitos fallan, intentar con el de PAGO
  console.log(`  Todos los modelos gratuitos fallaron. Probando con PAGO...`);
  try {
    const respuesta = await conTimeout(
      cliente.models.generateContent({
        model: modeloDePago,
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { fileData: { fileUri: uriPdf, mimeType: "application/pdf" } },
            ],
          },
        ],
      }),
      TIMEOUT_POR_INTENTO,
      `${modeloDePago} no respondió en ${TIMEOUT_POR_INTENTO / 1000}s`
    );

    const texto = respuesta.text;
    if (!texto) throw new Error("Gemini (pago) no devolvió texto.");

    console.log(`  Respuesta recibida (${texto.length} caracteres).`);
    return texto;
  } catch (error: unknown) {
    ultimoError = error;
    console.error(`  El modelo de pago también falló:`, error);
    throw new Error(
      `Todos los modelos fallaron. Último error: ${String(ultimoError)}`
    );
  }
}

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
  const TIMEOUT_POR_INTENTO = 25000;
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
    }
  }

  throw new Error(
    `Todos los modelos fallaron. Último error: ${String(ultimoError)}`
  );
}