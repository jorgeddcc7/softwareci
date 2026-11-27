import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/utils/supabase/admin";

const API_KEY_PREFIX = "sk_live_";
const API_KEY_RANDOM_BYTES = 32;

export type APIKeyGenerada = {
  key: string;
  keyHash: string;
  keyPrefix: string;
};

export type APIKeyValidada = {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
};

function sha256(valor: string): string {
  return createHash("sha256")
    .update(valor, "utf8")
    .digest("hex");
}

/**
 * Genera una clave secreta aleatoria.
 * La clave en claro solo se devuelve en esta función
 * para que la ruta de creación pueda mostrarla una vez.
 */
export function generarAPIKey(): APIKeyGenerada {
  const secreto = randomBytes(API_KEY_RANDOM_BYTES)
    .toString("base64url");

  const key = `${API_KEY_PREFIX}${secreto}`;

  return {
    key,
    keyHash: sha256(key),
    keyPrefix: key.slice(0, 16),
  };
}

/**
 * Calcula el hash de una API Key recibida.
 * Rechaza formatos inesperados antes de consultar la BD.
 */
export function hashearAPIKey(key: string): string | null {
  const formatoValido =
    /^sk_live_[A-Za-z0-9_-]{43}$/.test(key);

  if (!formatoValido) {
    return null;
  }

  return sha256(key);
}

/**
 * Valida una API Key activa contra Supabase.
 *
 * Devuelve los datos mínimos necesarios para autorizar
 * la petición. Nunca devuelve el hash ni la clave secreta.
 */
export async function validarAPIKey(
  key: string
): Promise<APIKeyValidada | null> {
  const keyHash = hashearAPIKey(key);

  if (!keyHash) {
    return null;
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("api_keys")
    .select("id, user_id, name, key_prefix")
    .eq("key_hash", keyHash)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Error validando API Key:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  // Actualizar último uso.
  // Si falla, no invalidamos una clave que sí es correcta:
  // last_used_at es metadato de seguimiento.
  const { error: updateError } = await admin
    .from("api_keys")
    .update({
      last_used_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (updateError) {
    console.error(
      "No se pudo actualizar last_used_at:",
      updateError
    );
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    keyPrefix: data.key_prefix,
  };
}