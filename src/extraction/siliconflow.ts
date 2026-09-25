import OpenAI from "openai";
import fs from "fs";

/**
 * Cliente de SiliconFlow (compatible con API de OpenAI).
 * Se usa como último recurso para extracción con DeepSeek-OCR.
 */
function crearClienteSiliconFlow(): OpenAI {
  const apiKey = process.env.SILICONFLOW_API_KEY;
  if (!apiKey) {
    throw new Error("Falta SILICONFLOW_API_KEY en el entorno.");
  }
  return new OpenAI({
    baseURL: "https://api.siliconflow.cn/v1",
    apiKey,
  });
}

/**
 * Envía un PDF a DeepSeek-OCR vía SiliconFlow.
 * Devuelve el texto extraído en formato Markdown.
 */
export async function extraerTextoConSiliconFlow(
  rutaPdfLocal: string
): Promise<string> {
  const cliente = crearClienteSiliconFlow();

  if (!fs.existsSync(rutaPdfLocal)) {
    throw new Error(`No se encuentra el PDF local: ${rutaPdfLocal}`);
  }

  const buffer = fs.readFileSync(rutaPdfLocal);
  const base64 = buffer.toString("base64");
  const dataUrl = `data:application/pdf;base64,${base64}`;

  console.log("  Fallback a DeepSeek-OCR (SiliconFlow)...");

  const respuesta = await cliente.chat.completions.create({
    model: "deepseek-ai/DeepSeek-OCR",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Extrae los datos de este documento y devuélvelos en JSON con la estructura solicitada. No devuelvas Markdown." },
          {
            type: "image_url",
            image_url: { url: dataUrl },
          },
        ],
      },
    ],
  });

  const texto = respuesta.choices[0]?.message?.content;
  if (!texto) {
    throw new Error("SiliconFlow no devolvió texto.");
  }

  console.log(`  DeepSeek-OCR respondió (${texto.length} caracteres).`);
  return texto;
}