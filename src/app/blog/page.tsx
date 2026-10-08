import Link from "next/link";
import type { Metadata } from "next";
import { obtenerTodosLosArticulos } from "@/lib/blog";

export const metadata: Metadata = {
  title: "El Despacho — Blog",
  description:
    "Notas sobre documentación, Incoterms, aduanas y noticias relevantes para profesionales del comercio exterior.",
  alternates: {
    canonical: "https://www.controladordocumentos.com/blog",
  },
};

function formatearFecha(fecha: string): string {
  if (!fecha) return "";
  const d = new Date(fecha);
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatearFechaLarga(fecha: string): string {
  if (!fecha) return "";
  const d = new Date(fecha);
  return d
    .toLocaleDateString("es-ES", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    .replace(/^\w/, (c) => c.toUpperCase());
}

export default function BlogPage() {
  const articulos = obtenerTodosLosArticulos();

  const destacado = articulos[0];
  const secundarios = articulos.slice(1, 4);
  const resto = articulos.slice(4);

  const fechaHoy = formatearFechaLarga(new Date().toISOString().slice(0, 10));
  const numeroEdicion = articulos.length > 0 ? articulos[0].editionNumber : 0;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header de la web */}
      <header className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            <img
              src="/logocd.png"
              alt="Controlador de Documentos"
              className="w-11 h-11 rounded-lg"
            />
            <span className="font-semibold text-foreground text-base">
              Controlador de Documentos
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            ← Volver
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 w-full flex-1">
        {/* Masthead */}
        <div className="text-center mb-8">
          <h1
            className="text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-2"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            EL DESPACHO
          </h1>
          <p className="text-xs md:text-sm text-muted tracking-wide mb-5">
            Documentación, Incoterms, Aduanas y Noticias
          </p>

          <div className="border-t-2 border-foreground"></div>
          <div className="border-t border-foreground mt-1"></div>

          <div className="flex items-center justify-between mt-2 text-xs text-muted uppercase tracking-wide">
            <span>{fechaHoy}</span>
            <span>Nº {numeroEdicion}</span>
          </div>
        </div>

        {articulos.length === 0 && (
          <div className="text-center py-20 text-muted">
            Todavía no hay artículos publicados.
          </div>
        )}

        {/* Bloque principal: destacado + sidebar */}
        {destacado && (
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            {/* Artículo destacado (ocupa 2/3) */}
            <article className="md:col-span-2 md:border-r md:border-border md:pr-8">
              <Link href={`/blog/${destacado.slug}`} className="group block">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    {destacado.category}
                  </span>
                  <span className="text-xs text-muted">·</span>
                  <span className="text-xs text-muted">
                    {destacado.readingTime} min
                  </span>
                </div>

                {destacado.image && (
                  <div className="mb-4 -mx-2 md:mx-0">
                    <img
                      src={destacado.image}
                      alt={destacado.title}
                      className="w-full h-64 md:h-80 object-cover rounded"
                    />
                  </div>
                )}

                <h2
                  className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-3 group-hover:text-primary transition-colors"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  {destacado.title}
                </h2>
                <p className="text-base text-muted leading-relaxed mb-4">
                  {destacado.excerpt}
                </p>
                <span className="text-sm text-primary font-medium">
                  Leer el artículo →
                </span>
              </Link>
            </article>

            {/* Sidebar "Últimas noticias" (ocupa 1/3) */}
            {secundarios.length > 0 && (
              <aside className="md:col-span-1">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-4 pb-2 border-b-2 border-foreground">
                  Últimas noticias
                </h3>
                <div className="space-y-5">
                  {secundarios.map((articulo) => (
                    <article
                      key={articulo.slug}
                      className="pb-5 border-b border-border last:border-b-0 last:pb-0"
                    >
                      <Link
                        href={`/blog/${articulo.slug}`}
                        className="group block"
                      >
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-1">
                          {articulo.category}
                        </span>
                        <h4
                          className="text-base font-bold text-foreground leading-snug mb-1 group-hover:text-primary transition-colors"
                          style={{
                            fontFamily: 'Georgia, "Times New Roman", serif',
                          }}
                        >
                          {articulo.title}
                        </h4>
                        <span className="text-xs text-muted">
                          {formatearFecha(articulo.date)} · Nº{" "}
                          {articulo.editionNumber}
                        </span>
                      </Link>
                    </article>
                  ))}
                </div>
              </aside>
            )}
          </div>
        )}

        {/* Resto de artículos en grid de 3 columnas */}
        {resto.length > 0 && (
          <>
            <div className="border-t-2 border-foreground mb-6"></div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-6">
              Más artículos
            </h3>
            <div className="grid md:grid-cols-3 gap-x-8 gap-y-8">
              {resto.map((articulo) => (
                <article key={articulo.slug}>
                  <Link href={`/blog/${articulo.slug}`} className="group block">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-2">
                      {articulo.category}
                    </span>
                    <h3
                      className="text-lg font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors"
                      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                    >
                      {articulo.title}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed mb-2">
                      {articulo.excerpt}
                    </p>
                    <span className="text-xs text-muted">
                      {formatearFecha(articulo.date)} · Nº{" "}
                      {articulo.editionNumber}
                    </span>
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}