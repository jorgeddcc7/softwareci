import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_JSON_BYTES = 2 * 1024 * 1024;

type HallazgoSeguro = {
  id: string;
  estado:
    | "correcto"
    | "error_critico"
    | "advertencia"
    | "pendiente";
  titulo: string;
  descripcion: string;
};

function esObjeto(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function validarHallazgos(
  value: unknown
): value is HallazgoSeguro[] {
  if (!Array.isArray(value)) return false;

  return value.every((item) => {
    if (!esObjeto(item)) return false;

    const estados = [
      "correcto",
      "error_critico",
      "advertencia",
      "pendiente",
    ];

    return (
      typeof item.id === "string" &&
      typeof item.titulo === "string" &&
      typeof item.descripcion === "string" &&
      typeof item.estado === "string" &&
      estados.includes(item.estado)
    );
  });
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(
      request.headers.get("content-length") ?? 0
    );

    if (
      contentLength > 0 &&
      contentLength > MAX_JSON_BYTES
    ) {
      return NextResponse.json(
        { success: false, error: "El informe es demasiado grande." },
        { status: 413 }
      );
    }

    const body: unknown = await request.json();

    const bodyBytes = new TextEncoder().encode(
      JSON.stringify(body)
    ).byteLength;

    if (bodyBytes > MAX_JSON_BYTES) {
      return NextResponse.json(
        { success: false, error: "El informe es demasiado grande." },
        { status: 413 }
      );
    }

    if (
      !esObjeto(body) ||
      !esObjeto(body.factura) ||
      !esObjeto(body.seguro) ||
      !validarHallazgos(body.hallazgos)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Los datos de la verificación no tienen un formato válido.",
        },
        { status: 400 }
      );
    }

    // 1. Verificar sesión
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Debes iniciar sesión." },
        { status: 401 }
      );
    }

    // 2. Comprobar plan Pro
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("subscription_status, subscription_tier")
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: "No se ha podido comprobar tu suscripción.",
        },
        { status: 403 }
      );
    }

    const isPro =
      profile.subscription_status === "active" &&
      profile.subscription_tier === "pro";

    if (!isPro) {
      return NextResponse.json(
        {
          success: false,
          error: "Necesitas un plan Pro para guardar verificaciones.",
        },
        { status: 403 }
      );
    }

    // 3. Guardar con admin client
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("insurance_audits")
      .insert({
        user_id: user.id,
        factura: body.factura,
        seguro: body.seguro,
        hallazgos: body.hallazgos,
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error(
        "Error guardando verificación de seguro:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: "No se ha podido guardar la verificación.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      created_at: data.created_at,
    });
  } catch (error) {
    console.error("Error en guardar verificación:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error interno al guardar la verificación.",
      },
      { status: 500 }
    );
  }
}