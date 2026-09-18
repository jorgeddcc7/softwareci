import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Controlador de Documentos de Comercio Exterior",
  description: "Detecta incoherencias entre factura y packing list antes del despacho aduanero",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}