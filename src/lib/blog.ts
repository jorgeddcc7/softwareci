import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import type { Articulo } from "@/types/articulo";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

/**
 * Calcula el tiempo estimado de lectura (en minutos).
 * Se basa en 200 palabras por minuto, redondeado hacia arriba.
 */
function calcularTiempoLectura(contenido: string): number {
  const palabras = contenido.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(palabras / 200));
}

/**
 * Lee todos los archivos .md de content/blog, los ordena por fecha
 * descendente y devuelve un array de Articulo.
 *
 * El editionNumber se calcula como: total - índice actual.
 * Es decir, el más antiguo es Nº 1 y el más nuevo es Nº total.
 */
export function obtenerTodosLosArticulos(): Articulo[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const nombresArchivo = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"));

  const articulos = nombresArchivo.map((nombreArchivo) => {
    const slug = nombreArchivo.replace(/\.md$/, "");
    const rutaCompleta = path.join(BLOG_DIR, nombreArchivo);
    const contenido = fs.readFileSync(rutaCompleta, "utf-8");
    const { data, content } = matter(contenido);

    return {
      slug,
      title: String(data.title || "Sin título"),
      date: String(data.date || ""),
      category: String(data.category || "General"),
      excerpt: String(data.excerpt || ""),
      image: data.image ? String(data.image) : null,
      imageCaption: data.imageCaption ? String(data.imageCaption) : null,
      contentHtml: "",
      readingTime: calcularTiempoLectura(content),
      editionNumber: 0,
    };
  });

  articulos.sort((a, b) => (a.date < b.date ? 1 : -1));

  const total = articulos.length;
  return articulos.map((a, i) => ({
    ...a,
    editionNumber: total - i,
  }));
}

/**
 * Lee un artículo por su slug y devuelve su contenido completo en HTML.
 */
export async function obtenerArticuloPorSlug(
  slug: string
): Promise<Articulo | null> {
  const rutaCompleta = path.join(BLOG_DIR, `${slug}.md`);

  if (!fs.existsSync(rutaCompleta)) return null;

  const contenido = fs.readFileSync(rutaCompleta, "utf-8");
  const { data, content } = matter(contenido);

  const procesado = await remark().use(html).process(content);
  const contentHtml = procesado.toString();

  const todos = obtenerTodosLosArticulos();
  const este = todos.find((a) => a.slug === slug);

  return {
    slug,
    title: String(data.title || "Sin título"),
    date: String(data.date || ""),
    category: String(data.category || "General"),
    excerpt: String(data.excerpt || ""),
    image: data.image ? String(data.image) : null,
    imageCaption: data.imageCaption ? String(data.imageCaption) : null,
    contentHtml,
    readingTime: calcularTiempoLectura(content),
    editionNumber: este?.editionNumber ?? 0,
  };
}