import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Importaciones de extracción y Gemini
import { subirPdf, analizarPdf, eliminarPdfRemoto } from "@/extraction/gemini";
import { promptFactura } from "@/extraction/prompt";
import { extraerDocumentoSeguro, type AnalizarPDFGemini } from "@/extraction/extraer-seguro";
import type { FacturaComercial } from "@/types/documentos";

// Importación del comparador
import { compararSeguroConFactura } from "@/rules/comparador-seguro";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PDF_SIZE = 15 * 1024 * 1024;

// -----------------------------------------------------------------------------
// SEGURIDAD Y ACCESO
// -----------------------------------------------------------------------------

async function verificarAcceso(): Promise<{ autorizado: boolean; userId?: string; status?: number; mensaje?: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { autorizado: false, status: 401, mensaje: "Debes iniciar sesión." };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_tier")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return { autorizado: false, status: 500, mensaje: "No se pudo comprobar tu perfil." };
  }

  const esPro = profile.subscription_status === "active" && profile.subscription_tier === "pro";
  
  if (!esPro) {
    return { autorizado: false, status: 403, mensaje: "Esta función requiere el plan Pro activo." };
  }

  return { autorizado: true, userId: user.id };
}

// -----------------------------------------------------------------------------
// ADAPTADOR DE GEMINI (Para el seguro)
// -----------------------------------------------------------------------------

const analizarPDFAdapter: AnalizarPDFGemini = async (rutaPDF, prompt) => {
  let nombreArchivoRemoto: string | null = null;
  try {
    const uriPDF = await subirPdf(rutaPDF, (nombre) => { nombreArchivoRemoto = nombre; });
    return await analizarPdf(uriPDF, prompt, rutaPDF);
  } finally {
    if (nombreArchivoRemoto) {
      try { await eliminarPdfRemoto(nombreArchivoRemoto); } catch (e) { console.error(e); }
    }
  }
};

// -----------------------------------------------------------------------------
// UTILIDAD PARA LIMPIAR EL JSON DE LA FACTURA
// -----------------------------------------------------------------------------

function limpiarJson(texto: string): string {
  let limpio = texto.trim();
  if (limpio.startsWith("```")) {
    limpio = limpio.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  return limpio;
}

// -----------------------------------------------------------------------------
// ENDPOINT POST
// -----------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let directorioTemporal: string | null = null;

  try {
    // 1. Comprobar sesión y plan
    const acceso = await verificarAcceso();
    if (!acceso.autorizado) {
      return NextResponse.json({ error: acceso.mensaje }, { status: acceso.status });
    }

    // 2. Leer archivos del FormData
    const formData = await request.formData();
    const archivoFactura = formData.get("factura");
    const archivoSeguro = formData.get("seguro");

    if (!(archivoFactura instanceof File) || !(archivoSeguro instanceof File)) {
      return NextResponse.json({ error: "Debes subir la factura y el seguro en PDF." }, { status: 400 });
    }

    if (archivoFactura.size > MAX_PDF_SIZE || archivoSeguro.size > MAX_PDF_SIZE) {
      return NextResponse.json({ error: "Uno de los archivos supera el tamaño máximo (15MB)." }, { status: 413 });
    }

    // 3. Crear directorio temporal
    directorioTemporal = await mkdtemp(path.join(tmpdir(), "verif-seguro-"));
    const rutaFactura = path.join(directorioTemporal, `factura-${randomUUID()}.pdf`);
    const rutaSeguro = path.join(directorioTemporal, `seguro-${randomUUID()}.pdf`);

    await writeFile(rutaFactura, Buffer.from(await archivoFactura.arrayBuffer()));
    await writeFile(rutaSeguro, Buffer.from(await archivoSeguro.arrayBuffer()));

    // 4. Extraer Datos (EN PARALELO para mayor velocidad)
    console.log("[VERIFICADOR SEGURO] Extrayendo datos de factura y seguro...");
    
    const [seguro, textoFacturaRaw] = await Promise.all([
      // Extraer seguro (usa la caché interna de extraerDocumentoSeguro)
      extraerDocumentoSeguro(rutaSeguro, analizarPDFAdapter),
      
      // Extraer factura (usando la misma lógica que tu endpoint /api/analizar)
      analizarPDFAdapter(rutaFactura, promptFactura())
    ]);

    // Parsear la factura
    let factura: FacturaComercial;
    try {
      factura = JSON.parse(limpiarJson(textoFacturaRaw)) as FacturaComercial;
    } catch (e) {
      console.error("[VERIFICADOR SEGURO] Error parseando la factura:", e);
      return NextResponse.json({ error: "No se pudo interpretar la factura comercial." }, { status: 422 });
    }

    // 5. Comparar
    console.log("[VERIFICADOR SEGURO] Ejecutando comparador...");
    const hallazgos = compararSeguroConFactura(seguro, factura);

    // 6. Devolver resultado
    return NextResponse.json({
      success: true,
      factura,
      seguro,
      hallazgos
    });

  } catch (error) {
    console.error("[VERIFICADOR SEGURO] Error:", error);
    return NextResponse.json({ error: "Error interno procesando la verificación." }, { status: 500 });
  } finally {
    // 7. Limpieza de archivos temporales locales
    if (directorioTemporal) {
      try {
        await rm(directorioTemporal, { recursive: true, force: true });
      } catch (e) {
        console.error("[VERIFICADOR SEGURO] Error limpiando temporales:", e);
      }
    }
  }
}