import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "4rem 2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        Controlador de Documentos de Comercio Exterior
      </h1>
      <p style={{ fontSize: "1.1rem", color: "#555", marginBottom: "2rem" }}>
        Sube tu factura comercial y tu packing list. El sistema detectará
        incoherencias antes de que las vea el agente de aduanas.
      </p>
      <Link
        href="/analizar"
        style={{
          display: "inline-block",
          padding: "0.75rem 2rem",
          background: "#0066cc",
          color: "white",
          borderRadius: 8,
          fontSize: "1rem",
        }}
      >
        Analizar documentos
      </Link>
    </main>
  );
}