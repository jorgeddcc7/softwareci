import Link from "next/link";
import Image from "next/image"; // ← NUEVO
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { obtenerArticuloPorSlug, obtenerTodosLosArticulos } from "@/lib/blog";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ← NUEVO: bloque generateStaticParams justo antes de generateMetadata
export async function generateStaticParams() {
  const articulos = obtenerTodosLosArticulos();
  return articulos.map((a) => ({ slug: a.slug }));
}

export const dynamicParams = false; // ← NUEVO

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const articulo = await obtenerArticuloPorSlug(slug);

  if (!articulo) {
    return { title: "Artículo no encontrado" };
  }

  return {
    title: `${articulo.title} — El Despacho`,
    description: articulo.excerpt,
    alternates: {
      canonical: `https://www.controladordocumentos.com/blog/${articulo.slug}`,
    },
    // ← NUEVO: bloque openGraph + twitter completo
    openGraph: {
      title: articulo.title,
      description: articulo.excerpt,
      type: "article",
      publishedTime: articulo.date,
      url: `https://www.controladordocumentos.com/blog/${articulo.slug}`,
      images: articulo.image ? [articulo.image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: articulo.title,
      description: articulo.excerpt,
    },
  };
}

function formatearFechaLarga(fecha: string): string {
  if (!fecha) return "";
  const d = new Date(fecha);
  return d
    .toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    .replace(/^\w/, (c) => c.toUpperCase());
}

export default async function ArticuloPage({ params }: PageProps) {
  const { slug } = await params;
  const articulo = await obtenerArticuloPorSlug(slug);

  if (!articulo) {
    notFound();
  }

  const todos = obtenerTodosLosArticulos();
  const otros = todos.filter((a) => a.slug !== slug).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header de la web */}
      <header className="border-b border-border bg-surface">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            {/* ← CAMBIADO: <img> por <Image> */}
            <Image
              src="/logocd.png"
              alt="Controlador de Documentos"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <span className="font-semibold text-foreground text-base">
              Controlador de Documentos
            </span>
          </Link>
          <Link
            href="/blog"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            ← El Despacho
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 w-full flex-1">
        {/* Kicker de sección + edición */}
        <div className="flex items-center justify-between mb-6 text-xs uppercase tracking-widest">
          <span className="font-bold text-primary">{articulo.category}</span>
          <span className="text-muted">
            El Despacho · Nº {articulo.editionNumber}
          </span>
        </div>

        <div className="border-t-2 border-foreground mb-1"></div>
        <div className="border-t border-foreground mb-6"></div>

        {/* Título */}
        <h1
          className="text-3xl md:text-5xl font-bold text-foreground leading-tight mb-4"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {articulo.title}
        </h1>

        {/* Fecha y tiempo de lectura */}
        <div className="flex items-center gap-3 text-xs text-muted uppercase tracking-wide mb-8">
          <span>{formatearFechaLarga(articulo.date)}</span>
          <span>·</span>
          <span>{articulo.readingTime} min de lectura</span>
        </div>

        {/* Imagen destacada (si existe) */}
        {articulo.image && (
          <figure className="mb-8 -mx-2 md:mx-0">
            {/* ← CAMBIADO: <img> por <Image>; necesitas width/height o fill */}
            <Image
              src={articulo.image}
              alt={articulo.title}
              width={1200}
              height={630}
              className="w-full h-auto rounded"
            />
            {articulo.imageCaption && (
              <figcaption className="text-xs text-muted italic mt-2 text-center">
                {articulo.imageCaption}
              </figcaption>
            )}
          </figure>
        )}

        {/* Standfirst (entradilla) */}
        <p
          className="text-lg md:text-xl text-foreground leading-relaxed mb-8 font-medium"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {articulo.excerpt}
        </p>

        {/* Separador */}
        <div className="border-t border-border mb-8"></div>

        {/* Cuerpo del artículo con drop cap y columnas en desktop */}
        <article
          className="prose-blog prose-columnas text-foreground"
          dangerouslySetInnerHTML={{ __html: articulo.contentHtml }}
        />

        {/* CTA */}
        <div className="mt-14 p-6 bg-primary-light border border-blue-200 rounded-xl">
          <h3
            className="text-lg font-bold text-foreground mb-2"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            ¿Quieres comprobarlo con una operación tuya?
          </h3>
          <p className="text-sm text-muted mb-4 leading-relaxed">
            Sube la factura y el packing list y comprueba en 30 segundos si hay
            incoherencias antes de enviarlos a aduanas. Tienes 3 análisis
            gratuitos.
          </p>
          <Link
            href="/analizar"
            className="inline-block px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            Probar gratis →
          </Link>
        </div>

        {/* Otros artículos */}
        {otros.length > 0 && (
          <div className="mt-16 pt-8 border-t-2 border-foreground">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-widest mb-6">
              Otros artículos
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {otros.map((otro) => (
                <Link
                  key={otro.slug}
                  href={`/blog/${otro.slug}`}
                  className="group block"
                >
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-2">
                    {otro.category}
                  </span>
                  <h3
                    className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    {otro.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}