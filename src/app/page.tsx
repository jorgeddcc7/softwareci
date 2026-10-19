import Link from "next/link";
import { AuthStatus } from "./components/auth-status";
import { JsonLd } from "@/components/JsonLd";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/dictionaries";
import { LanguageSwitcher } from "@/components/language-switcher";

import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://www.controladordocumentos.com/",
    languages: {
      es: "https://www.controladordocumentos.com/",
      en: "https://www.controladordocumentos.com/en",
    },
  },
};

export default async function HomePage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
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
          <div className="flex items-center gap-6">
            <Link
              href="/analizar"
              className="nav-link text-sm text-muted hover:text-foreground transition-colors"
            >
              {t.navAnalyze}
            </Link>
            <Link
              href="/blog"
              className="nav-link text-sm text-muted hover:text-foreground transition-colors"
            >
              {t.navBlog}
            </Link>
            <LanguageSwitcher />
            <AuthStatus />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground max-w-3xl mx-auto leading-[1.15] tracking-tight">
          {t.heroTitle}
        </h1>
        <p className="mt-6 text-lg text-muted max-w-2xl mx-auto leading-relaxed">
          {t.heroSubtitle}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/analizar"
            className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
          >
            {t.heroCtaPrimary}
          </Link>
          {process.env.NEXT_PUBLIC_SHOW_PRICING === "true" && (
            <Link
              href="/precios"
              className="inline-block px-6 py-3 bg-white border border-border text-foreground font-medium rounded-lg hover:border-primary transition-colors"
            >
              {t.heroCtaPricing}
            </Link>
          )}
          <Link
            href="/por-que"
            className="inline-block px-6 py-3 bg-white border border-border text-foreground font-medium rounded-lg hover:border-primary transition-colors"
          >
            {t.heroCtaWhy}
          </Link>
        </div>
        <p className="mt-6 text-sm text-muted">{t.heroTrust}</p>
      </section>

      {/* Vídeo demo */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {t.videoTitle}
          </h2>
          <p className="text-muted max-w-2xl mx-auto">{t.videoSubtitle}</p>
        </div>
        <div className="aspect-video w-full max-w-3xl mx-auto rounded-xl overflow-hidden border border-border shadow-sm">
          <iframe
            src="https://www.youtube.com/embed/qSn3ZBzwsuQ"
            title="Controlador de Documentos — Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        <div className="text-center mt-8">
          <Link
            href="/analizar"
            className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            {t.heroCtaPrimary}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-surface border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-semibold text-foreground text-center mb-14">
            {t.featuresTitle}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
            <FeatureItem
              title={t.feature1Title}
              description={t.feature1Desc}
            />
            <FeatureItem
              title={t.feature2Title}
              description={t.feature2Desc}
            />
            <FeatureItem
              title={t.feature3Title}
              description={t.feature3Desc}
            />
            <FeatureItem
              title={t.feature4Title}
              description={t.feature4Desc}
            />
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-semibold text-foreground text-center mb-14">
          {t.howTitle}
        </h2>
        <div className="grid md:grid-cols-3 gap-12">
          <StepItem
            number="1"
            title={t.step1Title}
            description={t.step1Desc}
          />
          <StepItem
            number="2"
            title={t.step2Title}
            description={t.step2Desc}
          />
          <StepItem
            number="3"
            title={t.step3Title}
            description={t.step3Desc}
          />
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-surface border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-3">
            {t.ctaTitle}
          </h2>
          <p className="text-muted mb-8">{t.ctaSubtitle}</p>
          <Link
            href="/analizar"
            className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            {t.ctaButton}
          </Link>
        </div>
      </section>

      <footer className="border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted">
          <p>{t.footerCopyright}</p>
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <Link
              href="/por-que"
              className="hover:text-foreground transition-colors"
            >
              {t.footerWhy}
            </Link>
            <Link
              href="/faq"
              className="hover:text-foreground transition-colors"
            >
              {t.footerFaq}
            </Link>
            <a
              href="mailto:hola@controladordocumentos.com"
              className="hover:text-foreground transition-colors"
            >
              {t.footerContact}
            </a>
            <Link
              href="/seguridad"
              className="hover:text-foreground transition-colors"
            >
              {t.footerSecurity}
            </Link>
            <Link
              href="/privacidad"
              className="hover:text-foreground transition-colors"
            >
              {t.footerPrivacy}
            </Link>
            <Link
              href="/aviso-legal"
              className="hover:text-foreground transition-colors"
            >
              {t.footerLegal}
            </Link>
            <Link
              href="/terminos"
              className="hover:text-foreground transition-colors"
            >
              {t.footerTerms}
            </Link>
          </div>
        </div>
      </footer>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Controlador de Documentos",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: "https://www.controladordocumentos.com",
          description:
            "Herramienta que detecta incoherencias entre factura, packing list y documento de transporte antes del despacho aduanero.",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "EUR",
            description: "Prueba gratuita con 3 análisis incluidos",
          },
          provider: {
            "@type": "Organization",
            name: "Controlador de Documentos",
            url: "https://www.controladordocumentos.com",
          },
        }}
      />
    </div>
  );
}

function FeatureItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center mb-4">
        <svg
          className="w-5 h-5 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h3 className="font-semibold text-foreground mb-2 text-[15px]">
        {title}
      </h3>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
    </div>
  );
}

function StepItem({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-5 text-lg font-semibold">
        {number}
      </div>
      <h3 className="font-semibold text-foreground mb-2 text-[15px]">
        {title}
      </h3>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
    </div>
  );
}