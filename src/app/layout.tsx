import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { getLocale } from "@/i18n/get-locale";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://softwareci.vercel.app";

const META = {
  es: {
    lang: "es",
    title: "Controlador de Documentos de Comercio Exterior",
    template: "%s · Controlador de Documentos",
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
    ogLocale: "es_ES",
  },
  en: {
    lang: "en",
    title: "Trade Document Controller",
    template: "%s · Trade Document Controller",
    description:
      "Upload your commercial invoice, packing list and transport document. Detect inconsistencies before customs clearance.",
    keywords: [
      "international trade",
      "import",
      "export",
      "customs",
      "packing list",
      "commercial invoice",
      "bill of lading",
      "customs documentation",
    ],
    ogLocale: "en_US",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const meta = META[locale];

  return {
    metadataBase: new URL(APP_URL),
    title: {
      default: meta.title,
      template: meta.template,
    },
    description: meta.description,
    keywords: meta.keywords,
    authors: [{ name: "Controlador de Documentos" }],
    openGraph: {
      type: "website",
      locale: meta.ogLocale,
      url: APP_URL,
      siteName: "Controlador de Documentos",
      title: meta.title,
      description: meta.description,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={META[locale].lang} className={inter.className}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}