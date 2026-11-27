import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  const { id } = await context.params;

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json(
      {
        success: false,
        error: "El identificador de la API Key no es válido.",
      },
      { status: 400 }
    );
  }

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

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select(
        "subscription_status, subscription_tier"
      )
      .eq("id", user.id)
      .maybeSingle();

  if (profileError) {
    console.error(
      "Error comprobando plan para revocar API Key:",
      profileError
    );

    return NextResponse.json(
      {
        success: false,
        error: "No se ha podido comprobar tu suscripción.",
      },
      { status: 500 }
    );
  }

  const esPro =
    profile?.subscription_status === "active" &&
    profile?.subscription_tier === "pro";

  if (!esPro) {
    return NextResponse.json(
      {
        success: false,
        error: "La gestión de API Keys requiere el plan Pro.",
      },
      { status: 403 }
    );
  }

  const admin = createAdminClient();

  // La condición user_id impide revocar claves de otro usuario.
  const { data, error } = await admin
    .from("api_keys")
    .update({ is_active: false })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Error revocando API Key:", error);

    return NextResponse.json(
      {
        success: false,
        error: "No se ha podido revocar la API Key.",
      },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      {
        success: false,
        error:
          "La clave no existe, ya está revocada o no pertenece a tu cuenta.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "API Key revocada correctamente.",
  });
}