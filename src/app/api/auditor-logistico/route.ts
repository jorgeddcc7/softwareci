import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import os from "os";
import path from "path";
import crypto from "crypto";
import { createClient } from "@/utils/supabase/server";
import { compararDocumentosLogisticos } from "@/rules/comparador-logistico";

import {
  extraerDocumentoLogistico,
  analizarPDF,
} from "@/extraction/extraer-documento-logistico";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TAMANO_PDF = 15 * 1024 * 1024;

const CAMPOS_DOCUMENTOS = {
  presupuesto: "presupuesto",
  factura: "factura",
} as const;

interface ResultadoAcceso {
  autorizado: boolean;
  status?: number;
  mensaje?: string;
}

// FUNCIÓN DE ACCESO INTEGRADA
async function verificarAccesoAuditor(): Promise<ResultadoAcceso> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
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

  const tieneAcceso = profile.subscription_status === "active" && 
                      (profile.subscription_tier === "despacho" || profile.subscription_tier === "pro");
  
  if (!tieneAcceso) {
    return { autorizado: false, status: 403, mensaje: "Esta función requiere un plan de pago activo (Despacho o Pro)." };
  }

  return { autorizado: true };
}

// AQUÍ ESTÁ EL TRUCO: "asserts archivo is File" en lugar de "archivo is File"
function validarArchivoPDF(
  archivo: FormDataEntryValue | null,
  nombreCampo: string
): asserts archivo is File {
  if (!(archivo instanceof File)) {
    throw new Error(`No se ha recibido el archivo ${nombreCampo}.`);
  }
  if (archivo.size === 0) {
    throw new Error(`El archivo ${nombreCampo} está vacío.`);
  }
  if (archivo.size > MAX_TAMANO_PDF) {
    throw new Error(`El archivo ${nombreCampo} supera el límite de 15 MB.`);
  }
  if (archivo.type !== "application/pdf") {
    throw new Error(`El archivo ${nombreCampo} debe ser un PDF.`);
  }
}

async function verificarFirmaPDF(archivo: File, nombreCampo: string): Promise<void> {
  const cabecera = Buffer.from(await archivo.slice(0, 5).arrayBuffer());
  if (cabecera.toString("ascii") !== "%PDF-") {
    throw new Error(`El archivo ${nombreCampo} no contiene una firma PDF válida.`);
  }
}

async function guardarPDFTemporal(archivo: File, rutaDestino: string): Promise<void> {
  const contenido = Buffer.from(await archivo.arrayBuffer());
  await fs.writeFile(rutaDestino, contenido, { flag: "wx", mode: 0o600 });
}

export async function POST(request: NextRequest) {
  let directorioTemporal: string | null = null;

  try {
    const acceso = await verificarAccesoAuditor();
    if (!acceso.autorizado) {
      return NextResponse.json({ error: acceso.mensaje || "No tienes acceso al auditor." }, { status: acceso.status || 403 });
    }

    const formData = await request.formData();
    const archivoPresupuesto = formData.get(CAMPOS_DOCUMENTOS.presupuesto);
    const archivoFactura = formData.get(CAMPOS_DOCUMENTOS.factura);

    // TypeScript ahora sabrá que son File después de estas líneas
    validarArchivoPDF(archivoPresupuesto, "presupuesto");
    validarArchivoPDF(archivoFactura, "factura");

    await Promise.all([
      verificarFirmaPDF(archivoPresupuesto, "presupuesto"),
      verificarFirmaPDF(archivoFactura, "factura"),
    ]);

    directorioTemporal = await fs.mkdtemp(path.join(os.tmpdir(), "auditor-logistico-"));

    const rutaPresupuesto = path.join(directorioTemporal, `${crypto.randomUUID()}-presupuesto.pdf`);
    const rutaFactura = path.join(directorioTemporal, `${crypto.randomUUID()}-factura.pdf`);

    await Promise.all([
      guardarPDFTemporal(archivoPresupuesto, rutaPresupuesto),
      guardarPDFTemporal(archivoFactura, rutaFactura),
    ]);

    const resultados = await Promise.all([
      extraerDocumentoLogistico(rutaPresupuesto, "presupuesto", analizarPDF).then(
        (documento) => ({ ok: true as const, documento }),
        (error: unknown) => ({ ok: false as const, error })
      ),
      extraerDocumentoLogistico(rutaFactura, "factura_logistica", analizarPDF).then(
        (documento) => ({ ok: true as const, documento }),
        (error: unknown) => ({ ok: false as const, error })
      ),
    ]);

    const resultadoPresupuesto = resultados[0];
    const resultadoFactura = resultados[1];

    if (!resultadoPresupuesto.ok || !resultadoFactura.ok) {
      console.error("[Auditor logístico] Error en extracción:", {
        presupuesto: resultadoPresupuesto.ok ? "Correcto" : resultadoPresupuesto.error,
        factura: resultadoFactura.ok ? "Correcto" : resultadoFactura.error,
      });
      return NextResponse.json(
        { error: "No se pudieron extraer correctamente ambos documentos.", codigo: "ERROR_EXTRACCION" },
        { status: 422 }
      );
    }

    // Ejecutamos el comparador
    const conciliacion = compararDocumentosLogisticos(
      resultadoPresupuesto.documento,
      resultadoFactura.documento
    );

    return NextResponse.json({
      success: true,
      documentos: {
        presupuesto: resultadoPresupuesto.documento,
        factura: resultadoFactura.documento,
      },
      conciliacion, // <-- Añadimos el resultado del comparador
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("[Auditor logístico] Error en API:", error);
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor.";

    if (
      mensaje.includes("No se ha recibido") ||
      mensaje.includes("está vacío") ||
      mensaje.includes("supera el límite") ||
      mensaje.includes("debe ser un PDF") ||
      mensaje.includes("firma PDF")
    ) {
      return NextResponse.json({ error: mensaje, codigo: "ARCHIVO_INVALIDO" }, { status: 400 });
    }

    return NextResponse.json({ error: "Se ha producido un error procesando los documentos.", codigo: "ERROR_INTERNO" }, { status: 500 });
  } finally {
    if (directorioTemporal) {
      try {
        await fs.rm(directorioTemporal, { recursive: true, force: true });
      } catch (error) {
        console.error("[Auditor logístico] Error eliminando directorio temporal:", error);
      }
    }
  }
}