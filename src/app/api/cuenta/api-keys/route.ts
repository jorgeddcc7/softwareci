import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { generarAPIKey } from "@/lib/api-keys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_NAME_LENGTH = 80;

function respuestaError(mensaje: string, status: number) {
  return NextResponse.json(
    { success: false, error: mensaje },
    { status }
  );
}

async function obtenerUsuarioPro() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      user: null,
      error: respuestaError("Debes iniciar sesión.", 401),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_tier")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Error consultando perfil API Keys:", profileError);
    return {
      user: null,
      error: respuestaError("No se ha podido comprobar tu suscripción.", 500),
    };
  }

  const esPro =
    profile?.subscription_status === "active" &&
    profile?.subscription_tier === "pro";

  if (!esPro) {
    return {
      user: null,
      error: respuestaError(
        "La API pública está disponible únicamente para el plan Pro.",
        403
      ),
    };
  }

  return { user, error: null };
}

/**
 * GET /api/cuenta/api-keys
 * Lista las claves del usuario autenticado.
 */
export async function GET() {
  const auth = await obtenerUsuarioPro();

  if (auth.error) return auth.error;
  if (!auth.user) return respuestaError("Debes iniciar sesión.", 401);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, created_at, last_used_at, is_active")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error listando API Keys:", error);
    return respuestaError("No se han podido cargar tus API Keys.", 500);
  }

  return NextResponse.json({
    success: true,
    keys: data ?? [],
  });
}

/**
 * POST /api/cuenta/api-keys
 * Genera una nueva clave y devuelve el secreto una sola vez.
 */
export async function POST(request: Request) {
  const auth = await obtenerUsuarioPro();

  if (auth.error) return auth.error;
  if (!auth.user) return respuestaError("Debes iniciar sesión.", 401);

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return respuestaError("El cuerpo de la solicitud no es JSON válido.", 400);
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return respuestaError("La solicitud no tiene un formato válido.", 400);
  }

  const name = (body as Record<string, unknown>).name;

  if (typeof name !== "string") {
    return respuestaError("Debes indicar un nombre para la API Key.", 400);
  }

  const nombreLimpio = name.trim();

  if (nombreLimpio.length < 2 || nombreLimpio.length > MAX_NAME_LENGTH) {
    return respuestaError(
      `El nombre debe tener entre 2 y ${MAX_NAME_LENGTH} caracteres.`,
      400
    );
  }

  try {
    // 1. Generar la clave (retorna { key, keyHash, keyPrefix })
    const apiKeyGenerada = generarAPIKey();

    const admin = createAdminClient();

    // 2. Guardar en Supabase usando el hash y el prefijo
    const { data, error } = await admin
      .from("api_keys")
      .insert({
        user_id: auth.user.id,
        name: nombreLimpio,
        key_hash: apiKeyGenerada.keyHash,
        key_prefix: apiKeyGenerada.keyPrefix,
        is_active: true,
      })
      .select("id, name, key_prefix, created_at, last_used_at, is_active")
      .single();

    if (error) {
      console.error("Error creando API Key:", error);
      return respuestaError("No se ha podido generar la API Key.", 500);
    }

    // 3. Devolver la clave en claro al usuario por única vez
    return NextResponse.json(
      {
        success: true,
        key: apiKeyGenerada.key, // <-- Aquí devolvemos el string en claro
        apiKeyRecord: data,
        warning: "Guarda esta clave ahora. No volverá a mostrarse.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error generando API Key:", error);
    return respuestaError("Ha ocurrido un error al generar la API Key.", 500);
  }
}