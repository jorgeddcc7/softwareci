"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { trackEvent } from "@/utils/analytics";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    trackEvent("signup_completed");

    if (data.user && !data.session) {
      setSuccess(true);
      setLoading(false);
      return;
    }

    window.location.href = "/analizar";
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-background">
        <div className="w-full max-w-md bg-surface border border-border rounded-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Revisa tu email
          </h1>
          <p className="text-sm text-muted mb-6">
            Te hemos enviado un enlace de confirmación a <strong>{email}</strong>.
            Ábrelo para activar tu cuenta.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            Ir a iniciar sesión
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
            Crear cuenta
          </h1>

          <p className="text-sm text-muted mb-6">
            Crea tu cuenta para empezar a analizar documentos.
          </p>

          <form onSubmit={handleSignup} className="space-y-4">
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
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Contraseña
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
                  aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {verPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                      <line x1="2" x2="22" y1="2" y2="2"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-muted mt-1">Mínimo 6 caracteres.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Repite la contraseña
              </label>
              <input
                type={verPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
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
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted text-center">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-primary hover:text-primary-hover">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}