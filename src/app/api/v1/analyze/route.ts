import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { mkdtemp, writeFile, rm } from "node:fs/promises";

import { validarAPIKey } from "@/lib/api-keys";
import { createAdminClient } from "@/utils/supabase/admin";
import { analizarDocumentosAduaneros } from "@/lib/analisis-aduanero";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_FILES = 3;
const MONTHLY_API_LIMIT = 100;

type ArchivoPDF = {
  file: File;
  field: "factura" | "packing" | "transporte";
};

function jsonError(
  error: string,
  status: number
) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

/**
 * Extrae el token del header Authorization.
 *
 * Acepta únicamente:
 * Authorization: Bearer sk_live_...
 */
function obtenerBearerToken(
  authorization: string | null
): string | null {
  if (!authorization) return null;

  const match = authorization.match(
    /^Bearer\s+(sk_live_[A-Za-z0-9_-]+)$/i
  );

  return match?.[1] ?? null;
}

/**
 * Comprueba que el archivo es un PDF razonablemente válido.
 * No basta con confiar en file.type o en la extensión.
 */
async function validarPDF(
  file: File,
  nombreCampo: string
): Promise<string | null> {
  if (file.size === 0) {
    return `${nombreCampo}: el archivo está vacío.`;
  }

  if (file.size > MAX_FILE_SIZE) {
    return `${nombreCampo}: el PDF supera el límite de 15 MB.`;
  }

  const mimeValido =
    file.type === "application/pdf" ||
    file.type === "application/octet-stream";

  if (!mimeValido) {
    return `${nombreCampo}: el archivo debe ser un PDF.`;
  }

  const inicio = new Uint8Array(
    await file.slice(0, 5).arrayBuffer()
  );

  const firmaPDF = [
    0x25, // %
    0x50, // P
    0x44, // D
    0x46, // F
    0x2d, // -
  ];

  const firmaValida = firmaPDF.every(
    (byte, index) => inicio[index] === byte
  );

  if (!firmaValida) {
    return `${nombreCampo}: el archivo no contiene una firma PDF válida.`;
  }

  return null;
}

/**
 * Guarda el contenido del PDF en un archivo temporal
 * con nombre aleatorio.
 */
async function guardarPDFTemporal(
  file: File,
  directorio: string
): Promise<string> {
  const nombre = `${randomUUID()}.pdf`;
  const ruta = path.join(directorio, nombre);

  const buffer = Buffer.from(
    await file.arrayBuffer()
  );

  await writeFile(ruta, buffer, {
    mode: 0o600,
    flag: "wx",
  });

  return ruta;
}

export async function POST(request: Request) {
  let directorioTemporal: string | null = null;

  try {
    // --------------------------------------------------
    // 1. Autenticación por API Key
    // --------------------------------------------------

    const token = obtenerBearerToken(
      request.headers.get("authorization")
    );

    if (!token) {
      return jsonError(
        "API Key ausente o formato Authorization inválido.",
        401
      );
    }

    let apiKeyData: Awaited<
      ReturnType<typeof validarAPIKey>
    >;

    try {
      apiKeyData = await validarAPIKey(token);
    } catch (error) {
      console.error(
        "Error validando API Key:",
        error
      );

      return jsonError(
        "No se ha podido validar la API Key.",
        500
      );
    }

    if (!apiKeyData) {
      return jsonError(
        "API Key inválida, revocada o inexistente.",
        401
      );
    }

    // --------------------------------------------------
    // 2. Verificar que el propietario sigue siendo Pro
    // --------------------------------------------------

    const admin = createAdminClient();

    const { data: profile, error: profileError } =
      await admin
        .from("profiles")
        .select(
          "subscription_status, subscription_tier"
        )
        .eq("id", apiKeyData.userId)
        .maybeSingle();

    if (profileError) {
      console.error(
        "Error consultando plan del propietario de API Key:",
        profileError
      );

      return jsonError(
        "No se ha podido comprobar el plan de la cuenta.",
        500
      );
    }

    const esPro =
      profile?.subscription_status === "active" &&
      profile?.subscription_tier === "pro";

    if (!esPro) {
      return jsonError(
        "La API pública requiere una suscripción Pro activa.",
        403
      );
    }

    // --------------------------------------------------
    // 2.5. Control de Rate Limiting (Límite mensual)
    // --------------------------------------------------
    const { data: requestsThisMonth, error: rateLimitError } =
      await admin.rpc("reservar_peticion_api", {
        p_api_key_id: apiKeyData.id,
        p_monthly_limit: MONTHLY_API_LIMIT,
      });

    if (rateLimitError) {
      console.error("Error comprobando límite de API:", rateLimitError);
      return jsonError("No se pudo comprobar el consumo de la API.", 500);
    }

    // NULL significa que la clave está desactivada o ha alcanzado el límite
    if (requestsThisMonth === null) {
      return NextResponse.json(
        {
          success: false,
          error: "Has alcanzado el límite mensual de peticiones de la API.",
          code: "MONTHLY_LIMIT_EXCEEDED",
          limit: MONTHLY_API_LIMIT,
        },
        {
          status: 429, // Too Many Requests
          headers: { "Retry-After": "86400" },
        }
      );
    }

    // --------------------------------------------------
    // 3. Recibir FormData
    // --------------------------------------------------

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return jsonError(
        "El body debe ser multipart/form-data válido.",
        400
      );
    }

    const facturaValue = formData.get("factura");
    const packingValue = formData.get("packing");
    const transporteValue = formData.get("transporte");

    if (
      !(facturaValue instanceof File) ||
      !(packingValue instanceof File)
    ) {
      return jsonError(
        "Los campos factura y packing son obligatorios y deben ser archivos PDF.",
        400
      );
    }

    if (
      transporteValue !== null &&
      !(transporteValue instanceof File)
    ) {
      return jsonError(
        "El campo transporte debe ser un archivo PDF.",
        400
      );
    }

    const archivos: ArchivoPDF[] = [
      {
        file: facturaValue,
        field: "factura",
      },
      {
        file: packingValue,
        field: "packing",
      },
    ];

    if (transporteValue instanceof File) {
      archivos.push({
        file: transporteValue,
        field: "transporte",
      });
    }

    if (archivos.length > MAX_FILES) {
      return jsonError(
        "Se permite un máximo de 3 archivos.",
        400
      );
    }

    // Validar todos antes de escribir archivos.
    for (const archivo of archivos) {
      const error = await validarPDF(
        archivo.file,
        archivo.field
      );

      if (error) {
        return jsonError(error, 400);
      }
    }

    // --------------------------------------------------
    // 4. Crear directorio temporal aislado
    // --------------------------------------------------

    directorioTemporal = await mkdtemp(
      path.join(os.tmpdir(), "api-v1-analyze-")
    );

    const rutas: {
      factura: string;
      packing: string;
      transporte?: string;
    } = {
      factura: "",
      packing: "",
    };

    for (const archivo of archivos) {
      const ruta = await guardarPDFTemporal(
        archivo.file,
        directorioTemporal
      );

      rutas[archivo.field] = ruta;
    }

    // --------------------------------------------------
    // 5. Ejecutar el mismo motor de análisis
    // --------------------------------------------------

    const resultado =
      await analizarDocumentosAduaneros(rutas);

    // --------------------------------------------------
    // 6. Respuesta JSON para ERP / TMS
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      factura: resultado.factura,
      packing: resultado.packing,
      transporte: resultado.transporte ?? null,
      resultado_global: resultado.resultado_global,
      validaciones: resultado.validaciones,
    });
  } catch (error) {
    console.error(
      "Error interno en API pública v1/analyze:",
      error
    );

    return jsonError(
      "Error interno al analizar la documentación.",
      500
    );
  } finally {
    // --------------------------------------------------
    // 7. Limpieza garantizada de archivos locales
    // --------------------------------------------------

    if (directorioTemporal) {
      try {
        await rm(directorioTemporal, {
          recursive: true,
          force: true,
        });
      } catch (cleanupError) {
        console.error(
          "Error limpiando directorio temporal de API v1:",
          cleanupError
        );
      }
    }
  }
}