"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/recuperar/nueva`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-background">
        <div className="w-full max-w-md bg-surface border border-border rounded-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Revisa tu email
          </h1>
          <p className="text-sm text-muted mb-6">
            Si existe una cuenta con <strong>{email}</strong>, te hemos enviado
            un enlace para restablecer tu contraseña.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-1.5 mb-8">
          <img
            src="/logocd.png"
            alt="Controlador de Documentos"
            className="w-11 h-11 rounded-lg"
          />
          <span className="font-semibold text-foreground text-base">
            Controlador de Documentos
          </span>
        </Link>

        <div className="bg-surface border border-border rounded-xl p-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Recuperar contraseña
          </h1>
          <p className="text-sm text-muted mb-6">
            Introduce tu email y te enviaremos un enlace para restablecerla.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>

            {error && (
              <div className="p-3 bg-high-bg border border-red-200 rounded-lg">
                <p className="text-sm text-high-text">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted text-center">
            ¿Ya la recuerdas?{" "}
            <Link href="/login" className="text-primary hover:text-primary-hover">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}