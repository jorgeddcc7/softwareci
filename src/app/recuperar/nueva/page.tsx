"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function NuevaPasswordPage() {
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sesionLista, setSesionLista] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Supabase detecta el token de recuperación del enlace y crea
    // una sesión temporal. Esperamos a que esté lista.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSesionLista(true);
      }
    });

    // También comprobamos si ya hay sesión activa (en caso de recarga)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSesionLista(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

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
            Contraseña actualizada
          </h1>
          <p className="text-sm text-muted mb-6">
            Tu nueva contraseña ya está activa. Puedes iniciar sesión con ella.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            Iniciar sesión
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
            Nueva contraseña
          </h1>
          <p className="text-sm text-muted mb-6">
            Introduce tu nueva contraseña.
          </p>

          {!sesionLista ? (
            <div className="p-4 bg-slate-50 border border-border rounded-lg text-sm text-muted text-center">
              Verificando enlace...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={verPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 pr-10 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassword(!verPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {verPassword ? "🙈" : "👁"}
                  </button>
                </div>
                <p className="text-xs text-muted mt-1">Mínimo 6 caracteres.</p>
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
                {loading ? "Guardando..." : "Guardar contraseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}