import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { obtenerArticulosPaginados, obtenerTodosLosArticulos } from "@/lib/blog";
import { PaginadorBlog } from "@/components/PaginadorBlog";

const PER_PAGE = 6;

interface PageProps {
  params: Promise<{ page: string }>;
}

export async function generateStaticParams() {
  const todos = obtenerTodosLosArticulos();
  const totalPages = Math.max(1, Math.ceil(todos.length / PER_PAGE));
  const params: { page: string }[] = [];
  for (let i = 2; i <= totalPages; i++) {
    params.push({ page: String(i) });
  }
  return params;
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { page } = await params;
  return {
    title: `El Despacho — Blog · Página ${page}`,
    description:
      "Notas sobre documentación, Incoterms, aduanas y noticias relevantes para profesionales del comercio exterior.",
    alternates: {
      canonical: `https://www.controladordocumentos.com/blog/page/${page}`,
    },
  };
}

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

export default async function BlogPageN({ params }: PageProps) {
  const { page: pageStr } = await params;
  const pageNum = parseInt(pageStr, 10);

  if (!Number.isFinite(pageNum) || pageNum < 2) {
    notFound();
  }

  const { articulos, totalPages, currentPage } = obtenerArticulosPaginados(
    pageNum,
    PER_PAGE
  );

  if (articulos.length === 0 || currentPage !== pageNum) {
    notFound();
  }

  const fechaHoy = formatearFechaLarga(new Date().toISOString().slice(0, 10));
  const numeroEdicion =
    obtenerTodosLosArticulos()[0]?.editionNumber ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-white">
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
            href="/blog"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            ← El Despacho
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 w-full flex-1">
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
            <span>
              Nº {numeroEdicion} · Página {currentPage}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-x-8 gap-y-10">
          {articulos.map((articulo) => (
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
                  {formatearFecha(articulo.date)} · Nº {articulo.editionNumber}
                </span>
              </Link>
            </article>
          ))}
        </div>

        <PaginadorBlog currentPage={currentPage} totalPages={totalPages} />
      </main>
    </div>
  );
}