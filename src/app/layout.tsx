import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://softwareci.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Controlador de Documentos de Comercio Exterior",
    template: "%s · Controlador de Documentos",
  },
  description:
    "Sube tu factura comercial, packing list y documento de transporte. Detecta incoherencias antes del despacho aduanero.",
  keywords: [
    "comercio exterior",
    "importación",
    "exportación",
    "aduanas",
    "packing list",
    "factura comercial",
    "bill of lading",
    "documentación aduanera",
  ],
  authors: [{ name: "Controlador de Documentos" }],
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: APP_URL,
    siteName: "Controlador de Documentos",
    title: "Controlador de Documentos de Comercio Exterior",
    description:
      "Detecta incoherencias entre factura, packing list y documento de transporte antes del despacho aduanero.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Controlador de Documentos de Comercio Exterior",
    description:
      "Detecta incoherencias entre factura, packing list y documento de transporte antes del despacho aduanero.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}