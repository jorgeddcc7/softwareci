"use client";

import { useState } from "react";

export function BotonPortal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const respuesta = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(datos.error || "Error al abrir el portal.");
        setLoading(false);
        return;
      }

      window.location.href = datos.url;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error desconocido al abrir el portal."
      );
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
      >
        {loading ? "Abriendo portal..." : "Gestionar suscripción"}
      </button>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </>
  );
}