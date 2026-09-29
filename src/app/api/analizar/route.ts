// API Route: /api/analizar
// ============================================================
// Procesa en llamadas específicas:
//   1. Factura (prompt específico).
//   2. Packing (prompt específico).
//   3. Transporte (prompt específico, si existe).
//   4. Descripciones genéricas (una por línea, en paralelo).
// Si NEXT_PUBLIC_AUTH_ENABLED=true:
//   - Requiere usuario autenticado.
//   - Comprueba contador de análisis gratis (3 de por vida).
//   - Si hay suscripción activa, no cuenta.
//   - Incrementa contador al terminar.

import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  subirPdf,
  analizarPdf,
  evaluarEspecificidad,
} from "@/extraction/gemini";
import { promptFactura, promptPackingList } from "@/extraction/prompt";
import { promptTransporte } from "@/extraction/prompt-transporte";
import { promptEspecificidad } from "@/extraction/prompt-especificidad";
import {
  FacturaComercial,
  PackingList,
  DocumentoTransporte,
  Validacion,
} from "@/types/documentos";
import {
  ejecutarReglas,
  generarValidacionesINV_021,
  ACCIONES_SUGERIDAS,
} from "@/rules/motor";
import { createClient } from "@/utils/supabase/server";

export const maxDuration = 300;

const LIMITE_GRATIS = 3;

function limpiarJson(texto: string): string {
  let limpio = texto.trim();
  if (limpio.startsWith("```")) {
    limpio = limpio.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  return limpio;
}

async function guardarTemporal(
  nombre: string,
  contenido: Buffer
): Promise<string> {
  const dirTemp = fs.mkdtempSync(path.join(os.tmpdir(), "doc-"));
  const rutaTemp = path.join(dirTemp, nombre);
  fs.writeFileSync(rutaTemp, contenido);
  return rutaTemp;
}

export async function POST(request: NextRequest) {
  try {
    // ============================================================
    // Comprobaciones de autenticación y límite (solo si auth activa)
    // ============================================================
    let userId: string | null = null;
    let contadorActual = 0;
    let tieneSuscripcionActiva = false;

    if (process.env.NEXT_PUBLIC_AUTH_ENABLED === "true") {
      const supabase = await createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json(
          { error: "Debes iniciar sesión para analizar documentos." },
          { status: 401 }
        );
      }

      userId = user.id;

      // Leer perfil
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, analyses_count")
        .eq("id", user.id)
        .single();

      if (!profile) {
        return NextResponse.json(
          { error: "No se encontró tu perfil de usuario." },
          { status: 500 }
        );
      }

      contadorActual = profile.analyses_count ?? 0;
      tieneSuscripcionActiva = profile.subscription_status === "active";

      // Comprobar si ha subido transporte (solo pago)
      const formDataCheck = await request.clone().formData();
      const tieneTransporte = formDataCheck.get("transporte") !== null;

      if (tieneTransporte && !tieneSuscripcionActiva) {
        return NextResponse.json(
          {
            error:
              "El análisis con documento de transporte requiere un plan de pago.",
          },
          { status: 402 }
        );
      }

      // Si no tiene suscripción y ya gastó los análisis gratis → bloquear
      if (!tieneSuscripcionActiva && contadorActual >= LIMITE_GRATIS) {
        return NextResponse.json(
          {
            error:
              "Has agotado tus 3 análisis gratuitos. Suscríbete para seguir usando la herramienta.",
            code: "LIMIT_REACHED",
          },
          { status: 402 }
        );
      }
    }

    // ============================================================
    // Análisis
    // ============================================================
    const formData = await request.formData();
    const facturaFile = formData.get("factura") as File | null;
    const packingFile = formData.get("packing") as File | null;
    const transporteFile = formData.get("transporte") as File | null;

    if (!facturaFile || !packingFile) {
      return NextResponse.json(
        { error: "Se requieren al menos dos archivos: factura y packing." },
        { status: 400 }
      );
    }

    const tipoTransporteRaw = formData.get("tipo_transporte") as string | null;
    const tipoTransporte: "auto" | "bill_of_lading" | "air_waybill" | "cmr" =
      tipoTransporteRaw === "bill_of_lading" ||
      tipoTransporteRaw === "air_waybill" ||
      tipoTransporteRaw === "cmr"
        ? tipoTransporteRaw
        : "auto";

    const facturaBuffer = Buffer.from(await facturaFile.arrayBuffer());
    const rutaFactura = await guardarTemporal("factura.pdf", facturaBuffer);

    const packingBuffer = Buffer.from(await packingFile.arrayBuffer());
    const rutaPacking = await guardarTemporal("packing.pdf", packingBuffer);

    let rutaTransporte: string | null = null;
    if (transporteFile) {
      const transporteBuffer = Buffer.from(await transporteFile.arrayBuffer());
      rutaTransporte = await guardarTemporal("transporte.pdf", transporteBuffer);
    }

    console.log("Extrayendo documentos en paralelo...");

    const extraerFacturaPromise = (async () => {
      const uri = await subirPdf(rutaFactura);
      const resp = await analizarPdf(uri, promptFactura(), rutaFactura);
      return JSON.parse(limpiarJson(resp)) as FacturaComercial;
    })();

    const extraerPackingPromise = (async () => {
      const uri = await subirPdf(rutaPacking);
      const resp = await analizarPdf(uri, promptPackingList(), rutaPacking);
      return JSON.parse(limpiarJson(resp)) as PackingList;
    })();

    const extraerTransportePromise = rutaTransporte
      ? (async () => {
          const uri = await subirPdf(rutaTransporte);
          const resp = await analizarPdf(
            uri,
            promptTransporte(tipoTransporte),
            rutaTransporte
          );
          return JSON.parse(limpiarJson(resp)) as DocumentoTransporte;
        })()
      : Promise.resolve(null);

    const [factura, packing, transporte] = await Promise.all([
      extraerFacturaPromise,
      extraerPackingPromise,
      extraerTransportePromise,
    ]);

    console.log("Ejecutando motor de reglas...");
    const { validaciones, advertencias, descripciones_a_evaluar } =
      ejecutarReglas(factura, packing, transporte);

    const validacionesINV021: Validacion[] = [];

    if (descripciones_a_evaluar.length > 0) {
      console.log(
        `Evaluando ${descripciones_a_evaluar.length} descripción(es) en paralelo...`
      );

      const promesas = descripciones_a_evaluar.map(async (item) => {
        try {
          const prompt = promptEspecificidad(item.descripcion, {
            pais_origen: item.pais_origen,
            valor_linea: item.valor_linea,
            moneda: item.moneda,
          });
          const resultado = await evaluarEspecificidad(prompt);
          return {
            indice_linea: item.indice_linea,
            descripcion: item.descripcion,
            ...resultado,
          };
        } catch {
          return null;
        }
      });

      const resultados = (await Promise.all(promesas)).filter(
        (r): r is NonNullable<typeof r> => r !== null
      );

      const inv021 = generarValidacionesINV_021(resultados);
      for (const v of inv021) {
        v.accion_sugerida = ACCIONES_SUGERIDAS[v.regla] ?? "";
      }
      validacionesINV021.push(...inv021);
    }

    validaciones.push(...validacionesINV021);

    const altas = validaciones.filter(
      (v) => v.resultado === "discrepancia" && v.severidad === "alta"
    );
    const medias = validaciones.filter(
      (v) => v.resultado === "discrepancia" && v.severidad === "media"
    );
    const noComprobables = validaciones.filter(
      (v) => v.resultado === "no_comprobable"
    );

    let resultadoGlobal: "apto" | "revisar" | "no_apto";
    if (altas.length > 0) resultadoGlobal = "no_apto";
    else if (medias.length > 0 || noComprobables.length > 0)
      resultadoGlobal = "revisar";
    else resultadoGlobal = "apto";

    // ============================================================
    // Incrementar contador (solo si auth activa y no hay suscripción)
    // ============================================================
    if (
      process.env.NEXT_PUBLIC_AUTH_ENABLED === "true" &&
      userId &&
      !tieneSuscripcionActiva
    ) {
      const supabase = await createClient();
      await supabase
        .from("profiles")
        .update({ analyses_count: contadorActual + 1 })
        .eq("id", userId);
    }

    // Limpiar temporales
    try {
      fs.unlinkSync(rutaFactura);
      fs.unlinkSync(rutaPacking);
      if (rutaTransporte) fs.unlinkSync(rutaTransporte);
    } catch {
      // Nada
    }

    return NextResponse.json({
      exito: true,
      factura: {
        numero: factura.numero_factura.valor,
        fecha: factura.fecha_emision.valor,
        vendedor: factura.vendedor.nombre_legal.valor,
        comprador: factura.comprador.nombre_legal.valor,
      },
      packing: {
        numero: packing.numero_documento.valor,
        referencia_factura: packing.numero_factura_referencia.valor,
      },
      transporte: transporte
        ? {
            tipo: transporte.tipo_documento,
            numero: transporte.numero_documento.valor,
            puerto_carga:
              transporte.puerto_carga.valor ??
              transporte.ciudad_carga.valor ??
              null,
            puerto_descarga:
              transporte.puerto_descarga.valor ??
              transporte.ciudad_descarga.valor ??
              null,
          }
        : null,
      resultado_global: resultadoGlobal,
      validaciones,
      advertencias,
    });
  } catch (error) {
    console.error("Error en /api/analizar:", error);
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al procesar los documentos: ${mensaje}` },
      { status: 500 }
    );
  }
}