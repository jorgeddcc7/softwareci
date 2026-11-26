
import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10 MB

interface ResultadoAcceso {
  autorizado: boolean;
  userId?: string;
  status?: number;
  mensaje?: string;
}

interface DatosAuditoria {
  presupuesto: Record<string, unknown>;
  factura: Record<string, unknown>;
  conciliacion: Record<string, unknown>;
}

function respuestaError(mensaje: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: mensaje,
    },
    { status }
  );
}

function esObjeto(
  valor: unknown
): valor is Record<string, unknown> {
  return (
    typeof valor === "object" &&
    valor !== null &&
    !Array.isArray(valor)
  );
}

// -----------------------------------------------------------------------------
// Comprobación de sesión y plan
// -----------------------------------------------------------------------------

async function verificarAccesoAuditor(): Promise<ResultadoAcceso> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      autorizado: false,
      status: 401,
      mensaje: "Debes iniciar sesión.",
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_tier")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return {
      autorizado: false,
      status: 500,
      mensaje: "No se pudo comprobar tu perfil.",
    };
  }

  const tieneAcceso = profile.subscription_status === "active" && 
                      (profile.subscription_tier === "despacho" || profile.subscription_tier === "pro");

  if (!tieneAcceso) {
    return {
      autorizado: false,
      status: 403,
      mensaje: "Esta función requiere un plan de pago activo (Despacho o Pro).",
    };
  }

  return {
    autorizado: true,
    userId: user.id,
  };
}

// -----------------------------------------------------------------------------
// Validación básica del contenido
// -----------------------------------------------------------------------------

function validarDatosAuditoria(
  body: unknown
): DatosAuditoria | null {
  if (!esObjeto(body)) return null;

  const { presupuesto, factura, conciliacion } = body;

  if (
    !esObjeto(presupuesto) ||
    !esObjeto(factura) ||
    !esObjeto(conciliacion)
  ) {
    return null;
  }

  // Comprobamos la estructura mínima de los documentos.
  if (
    presupuesto.schema_version !== "1.0" ||
    factura.schema_version !== "1.0" ||
    !Array.isArray(presupuesto.lineas) ||
    !Array.isArray(factura.lineas)
  ) {
    return null;
  }

  // La conciliación debe contener las filas generadas
  // por el comparador logístico.
  if (!Array.isArray(conciliacion.filas)) {
    return null;
  }

  return {
    presupuesto,
    factura,
    conciliacion,
  };
}

// -----------------------------------------------------------------------------
// POST /api/auditor-logistico/guardar
// -----------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // 1. Comprobar sesión y plan antes de procesar el contenido.
    const acceso = await verificarAccesoAuditor();

    if (!acceso.autorizado || !acceso.userId) {
      return respuestaError(
        acceso.mensaje || "No tienes acceso a esta función.",
        acceso.status || 403
      );
    }

    // 2. Comprobar tamaño de la petición.
    const contentLength = Number(
      request.headers.get("content-length") || 0
    );

    if (contentLength > MAX_BODY_SIZE) {
      return respuestaError(
        "La auditoría supera el tamaño máximo permitido.",
        413
      );
    }

    // 3. Leer JSON.
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return respuestaError(
        "El contenido enviado no es un JSON válido.",
        400
      );
    }

    // Comprobación adicional del tamaño del JSON recibido.
    const tamañoReal = new TextEncoder().encode(
      JSON.stringify(body)
    ).byteLength;

    if (tamañoReal > MAX_BODY_SIZE) {
      return respuestaError(
        "La auditoría supera el tamaño máximo permitido.",
        413
      );
    }

    // 4. Validar estructura.
    const datos = validarDatosAuditoria(body);

    if (!datos) {
      return respuestaError(
        "Los datos de la auditoría no tienen una estructura válida.",
        400
      );
    }

    // 5. Insertar mediante el cliente administrativo.
    const supabaseAdmin = await createAdminClient();

    const { data, error } = await supabaseAdmin
      .from("logistic_audits")
      .insert({
        user_id: acceso.userId,
        presupuesto: datos.presupuesto,
        factura: datos.factura,
        conciliacion: datos.conciliacion,
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error(
        "[AUDITOR LOGÍSTICO] Error guardando auditoría:",
        error
      );

      return respuestaError(
        "No se pudo guardar la auditoría.",
        500
      );
    }

    // 6. Confirmar guardado.
    return NextResponse.json({
      success: true,
      mensaje: "Auditoría guardada correctamente.",
      auditoria: {
        id: data.id,
        created_at: data.created_at,
      },
    });
  } catch (error) {
    console.error(
      "[AUDITOR LOGÍSTICO] Error inesperado:",
      error
    );

    return respuestaError(
      "Ha ocurrido un error interno al guardar la auditoría.",
      500
    );
  }
}
