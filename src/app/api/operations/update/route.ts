import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión." },
        { status: 401 }
      );
    }

    const { operationId, clientName, notes } = await request.json();

    if (!operationId) {
      return NextResponse.json(
        { error: "Falta el ID de la operación." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("operations")
      .update({
        client_name: clientName ?? null,
        notes: notes ?? null,
      })
      .eq("id", operationId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error actualizando operación:", error);
      return NextResponse.json(
        { error: "Error al guardar los cambios." },
        { status: 500 }
      );
    }

    return NextResponse.json({ exito: true });
  } catch (error) {
    console.error("Error en /api/operations/update:", error);
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error: ${mensaje}` },
      { status: 500 }
    );
  }
}