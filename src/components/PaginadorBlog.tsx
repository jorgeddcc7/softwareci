import Link from "next/link";

interface Props {
  currentPage: number;
  totalPages: number;
}

export function PaginadorBlog({ currentPage, totalPages }: Props) {
  if (totalPages <= 1) return null;

  const buildHref = (page: number) =>
    page === 1 ? "/blog" : `/blog/page/${page}`;

  return (
    <nav className="mt-12 pt-6 border-t border-border flex items-center justify-between text-sm">
      {currentPage > 1 ? (
        <Link
          href={buildHref(currentPage - 1)}
          className="text-primary hover:underline"
        >
          ← Anteriores
        </Link>
      ) : (
        <span className="text-muted opacity-40">← Anteriores</span>
      )}

      <span className="text-xs text-muted uppercase tracking-wider">
        Página {currentPage} de {totalPages}
      </span>

      {currentPage < totalPages ? (
        <Link
          href={buildHref(currentPage + 1)}
          className="text-primary hover:underline"
        >
          Siguientes →
        </Link>
      ) : (
        <span className="text-muted opacity-40">Siguientes →</span>
      )}
    </nav>
  );
}