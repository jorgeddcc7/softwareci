"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface PlanButtonProps {
  priceId: string | null;
  label: string;
  destacado: boolean;
}

export function PlanButton({ priceId, label, destacado }: PlanButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleClick = async () => {
    // Si es el plan gratis, redirigir directamente a /analizar
    if (!priceId) {
      router.push("/analizar");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Comprobar si el usuario está autenticado (si auth está activa)
      if (process.env.NEXT_PUBLIC_AUTH_ENABLED === "true") {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/login?redirectTo=/precios";
          return;
        }
      }

      // Llamar a la API de checkout
      const respuesta = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(datos.error || "Error al iniciar el pago.");
        setLoading(false);
        return;
      }

      // Redirigir al checkout de Stripe
      window.location.href = datos.url;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error desconocido al iniciar el pago."
      );
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 ${
          destacado
            ? "bg-primary text-white hover:bg-primary-hover"
            : "bg-white border border-border text-foreground hover:border-primary"
        }`}
      >
        {loading ? "Redirigiendo..." : label}
      </button>
      {error && (
        <p className="text-xs text-red-600 mt-2 text-center">{error}</p>
      )}
    </>
  );
}