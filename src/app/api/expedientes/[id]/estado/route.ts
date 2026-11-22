import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { esEstadoExpediente } from "@/types/expedientes";
import { createAdminClient } from "@/utils/supabase/admin";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
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
      return NextResponse.json({ error: "El cuerpo no es un JSON válido." }, { status: 400 });
    }

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
    }

    const datos = body as Record<string, unknown>;

    if (!esEstadoExpediente(datos.estado)) {
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    }

    if (datos.estado_anterior !== null && !esEstadoExpediente(datos.estado_anterior)) {
      return NextResponse.json({ error: "Debes indicar el estado anterior." }, { status: 400 });
    }

    const nuevoEstado = datos.estado;
    const estadoAnterior = datos.estado_anterior;

    const { data: operation, error: operationError } = await supabase
      .from("operations")
      .select("id, estado_expediente")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (operationError) {
      return NextResponse.json({ error: "No se pudo recuperar el expediente." }, { status: 500 });
    }

    if (!operation) {
      return NextResponse.json({ error: "Expediente no encontrado." }, { status: 404 });
    }

    if (operation.estado_expediente !== estadoAnterior) {
      return NextResponse.json({ 
        error: "El estado ha cambiado. Recarga el expediente antes de guardar.",
        code: "STATE_CONFLICT",
      }, { status: 409 });
    }

    if (nuevoEstado === estadoAnterior) {
      return NextResponse.json({ exito: true });
    }

    const admin = createAdminClient();

    let query = admin
      .from("operations")
      .update({
        estado_expediente: nuevoEstado,
        estado_actualizado_at: new Date().toISOString(),
        estado_actualizado_por: user.id,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    query = estadoAnterior === null
        ? query.is("estado_expediente", null)
        : query.eq("estado_expediente", estadoAnterior);

    const { data: updated, error: updateError } = await query
      .select("id, estado_expediente, estado_actualizado_at")
      .maybeSingle();

    if (updateError) {
      console.error("EXPEDIENTE_STATE_UPDATE_ERROR", { code: updateError.code });
      return NextResponse.json({ error: "No se pudo guardar el estado." }, { status: 500 });
    }

    if (!updated) {
      return NextResponse.json({ 
        error: "No se pudo aplicar el cambio. Recarga el expediente.",
        code: "STATE_CONFLICT",
      }, { status: 409 });
    }

    return NextResponse.json({ exito: true, operation: updated });

  } catch (error) {
    console.error("EXPEDIENTE_STATE_UNEXPECTED_ERROR", error);
    return NextResponse.json({ error: "Error inesperado al actualizar el estado." }, { status: 500 });
  }
}