import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_status, subscription_tier")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: "No se pudo comprobar tu acceso." }, { status: 500 });
    }

    if (profile.subscription_status !== "active" || profile.subscription_tier !== "pro") {
      return NextResponse.json({ error: "Esta función requiere el plan Pro activo." }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
    }

    const datos = body as Record<string, unknown>;
    const { operationId, clientName, notes } = datos;
    const camposPermitidos = ["operationId", "clientName", "notes"];

    if (Object.keys(datos).some((campo) => !camposPermitidos.includes(campo))) {
      return NextResponse.json({ error: "La solicitud contiene campos no permitidos." }, { status: 400 });
    }

    if (typeof operationId !== "string" || !UUID_REGEX.test(operationId)) {
      return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
    }

    if (
      !(clientName === null || typeof clientName === "string") ||
      !(notes === null || typeof notes === "string")
    ) {
      return NextResponse.json({ error: "Cliente y notas deben ser texto o null." }, { status: 400 });
    }

    if (
      (typeof clientName === "string" && clientName.length > 200) ||
      (typeof notes === "string" && notes.length > 5000)
    ) {
      return NextResponse.json({ error: "Cliente o notas superan la longitud permitida." }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: operation, error: updateError } = await admin
      .from("operations")
      .update({
        client_name: typeof clientName === "string" ? clientName.trim() || null : null,
        notes: typeof notes === "string" ? notes.trim() || null : null,
      })
      .eq("id", operationId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("OPERATION_EDIT_FAILED", { code: updateError.code });
      return NextResponse.json({ error: "No se pudieron guardar los cambios." }, { status: 500 });
    }

    if (!operation) {
      return NextResponse.json({ error: "Operación no encontrada." }, { status: 404 });
    }

    return NextResponse.json({ exito: true });
  } catch {
    console.error("OPERATION_EDIT_UNEXPECTED_ERROR");
    return NextResponse.json({ error: "Error inesperado al guardar." }, { status: 500 });
  }
}