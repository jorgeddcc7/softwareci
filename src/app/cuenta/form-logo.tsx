"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FormLogo({
  esPro,
  companyNameActual,
  logoUrlActual,
}: {
  esPro: boolean;
  companyNameActual: string | null;
  logoUrlActual: string | null;
}) {
  const [companyName, setCompanyName] = useState(companyNameActual ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setExito(false);

    try {
      const formData = new FormData();
      if (file) formData.append("logo", file);
      formData.append("company_name", companyName);

      const respuesta = await fetch("/api/cuenta/logo", {
        method: "POST",
        body: formData,
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(datos.error || "Error al guardar.");
        setLoading(false);
        return;
      }

      setExito(true);
      setFile(null);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error desconocido al guardar."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!esPro) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 mb-6">
        <p className="text-xs text-muted uppercase tracking-wide mb-3">
          Personalización de marca
        </p>
        <p className="text-sm text-muted">
          El logo personalizado en el informe PDF está disponible en el plan
          Despacho Pro.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 mb-6">
      <p className="text-xs text-muted uppercase tracking-wide mb-3">
        Personalización de marca
      </p>
      <p className="text-sm text-muted mb-5">
        Sube tu logo y el nombre de tu empresa. Aparecerán en la cabecera del
        informe PDF.
      </p>

      {logoUrlActual && (
        <div className="mb-5 flex items-center gap-4">
          <img
            src={logoUrlActual}
            alt="Logo actual"
            className="w-16 h-16 object-contain border border-border rounded-lg bg-white p-1"
          />
          <p className="text-xs text-muted">Logo actual</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Nombre de tu empresa
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Ej: Despacho López S.L."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Logo (PNG, JPG, SVG o WebP, máx. 2 MB)
          </label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-light file:text-primary hover:file:bg-blue-100"
          />
        </div>

        {error && (
          <div className="p-3 bg-high-bg border border-red-200 rounded-lg">
            <p className="text-sm text-high-text">{error}</p>
          </div>
        )}

        {exito && (
          <div className="p-3 bg-low-bg border border-green-200 rounded-lg">
            <p className="text-sm text-low-text">Guardado correctamente.</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (!file && !companyName)}
          className="px-6 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </div>
  );
}