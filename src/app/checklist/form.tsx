"use client";

import { useState } from "react";

export function ChecklistForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Algo falló. Inténtalo de nuevo.");
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError("Algo falló. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="p-6 bg-primary-light border border-blue-200 rounded-xl text-center">
        <p className="text-lg font-semibold text-foreground mb-2">
          ¡Listo! Revisa tu email
        </p>
        <p className="text-sm text-muted">
          Te hemos enviado el checklist a <strong>{email}</strong>. Si no lo ves
          en unos minutos, mira en la carpeta de spam.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Tu email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          disabled={loading}
          className="w-full px-4 py-3 border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Enviando..." : "Descargar checklist gratis →"}
      </button>

      <p className="text-xs text-muted text-center">
        Sin spam. Solo te enviamos el checklist y, si quieres, algún consejo
        sobre documentación aduanera.
      </p>
    </form>
  );
}