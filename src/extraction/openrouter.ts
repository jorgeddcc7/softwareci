import OpenAI from "openai";
import fs from "fs";

/**
 * Cliente de OpenRouter (compatible con la API de OpenAI).
 */
function crearClienteOpenRouter(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Falta OPENROUTER_API_KEY en el entorno.");
  }
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
  });
}

/**
 * Envía un PDF a OpenRouter usando el tipo de contenido "file"
 * (el correcto para PDFs, no "image_url").
 *
 * Usa el motor "cloudflare-ai" que convierte el PDF a markdown gratis.
 */
export async function analizarConOpenRouter(
  rutaPdfLocal: string,
  prompt: string
): Promise<string> {
  const cliente = crearClienteOpenRouter();

  if (!fs.existsSync(rutaPdfLocal)) {
    throw new Error(`No se encuentra el PDF local: ${rutaPdfLocal}`);
  }

  const buffer = fs.readFileSync(rutaPdfLocal);
  const base64 = buffer.toString("base64");
  const dataUrl = `data:application/pdf;base64,${base64}`;

  console.log("  Fallback a OpenRouter (PDF como file)[reference:1]...");

  const respuesta = await cliente.chat.completions.create({
    model: "meta-llama/llama-4-maverick:free",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "file",
            file: {
              filename: "documento.pdf",
              file_data: dataUrl,
            },
          },
        ],
      },
    ],
    // Forzar el motor de PDF gratis
    plugins: [
      {
        id: "file-parser",
        pdf: {
          engine: "cloudflare-ai",
        },
      },
    ],
  } as any);

  const texto = respuesta.choices[0]?.message?.content;
  if (!texto) {
    throw new Error("OpenRouter no devolvió texto.");
  }

  console.log(`  OpenRouter respondió (${texto.length} caracteres).`);
  return texto;
}