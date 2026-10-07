import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST() {
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

    // Comprobar que no tiene suscripción activa
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", user.id)
      .single();

    if (profile?.subscription_status === "active") {
      return NextResponse.json(
        {
          error:
            "Tienes una suscripción activa. Cancélala primero desde el portal de cliente antes de eliminar tu cuenta.",
          code: "ACTIVE_SUBSCRIPTION",
        },
        { status: 400 }
      );
    }

    // Cliente admin con Service Role Key (permisos totales)
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Borrar operaciones del usuario
    await supabaseAdmin
      .from("operations")
      .delete()
      .eq("user_id", user.id);

    // 2. Borrar logo del Storage (si existe)
    const { data: logoFiles } = await supabaseAdmin.storage
      .from("logos")
      .list(user.id);

    if (logoFiles && logoFiles.length > 0) {
      const paths = logoFiles.map((f) => `${user.id}/${f.name}`);
      await supabaseAdmin.storage.from("logos").remove(paths);
    }

    // 3. Borrar perfil (aunque el CASCADE debería hacerlo, aseguramos)
    await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", user.id);

    // 4. Borrar usuario de auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id
    );

    if (deleteError) {
      console.error("Error eliminando usuario:", deleteError);
      return NextResponse.json(
        { error: "No se pudo eliminar la cuenta. Inténtalo de nuevo." },
        { status: 500 }
      );
    }

    return NextResponse.json({ exito: true });
  } catch (error) {
    console.error("Error en /api/cuenta/eliminar:", error);
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error: ${mensaje}` },
      { status: 500 }
    );
  }
}