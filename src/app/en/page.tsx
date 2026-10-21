import Link from "next/link";
import { AuthStatus } from "../components/auth-status";
import { JsonLd } from "@/components/JsonLd";
import { getDictionary } from "@/i18n/dictionaries";
import { LanguageSwitcher } from "@/components/language-switcher";

export const metadata = {
  title: "Trade Document Controller",
  description:
    "Upload your commercial invoice, packing list and transport document. Detect inconsistencies before customs clearance.",
  alternates: {
    canonical: "https://www.controladordocumentos.com/en",
    languages: {
      es: "https://www.controladordocumentos.com/",
      en: "https://www.controladordocumentos.com/en",
    },
  },
};

export default function HomePageEn() {
  const t = getDictionary("en");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/en" className="flex items-center gap-1.5">
            <img
              src="/logocd.png"
              alt="Trade Document Controller"
              className="w-11 h-11 rounded-lg"
            />
            <span className="font-semibold text-foreground text-base">
              Trade Document Controller
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
        <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
          For customs brokers and freight forwarders
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground max-w-3xl mx-auto leading-[1.15] tracking-tight">
          A documentation error isn't a fine. It's an audit on your record.
        </h1>
        <p className="mt-6 text-lg text-muted max-w-2xl mx-auto leading-relaxed">
          Every inconsistency between invoice, packing list and transport
          document leaves a trace. And repeated traces trigger customs alerts.
          Review before you submit. Protect your license.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/analizar"
            className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
          >
            Review a shipment →
          </Link>
          {process.env.NEXT_PUBLIC_SHOW_PRICING === "true" && (
            <Link
              href="/en/pricing"
              className="inline-block px-6 py-3 bg-white border border-border text-foreground font-medium rounded-lg hover:border-primary transition-colors"
            >
              See pricing
            </Link>
          )}
          <Link
            href="/por-que"
            className="inline-block px-6 py-3 bg-white border border-border text-foreground font-medium rounded-lg hover:border-primary transition-colors"
          >
            Why it's different
          </Link>
        </div>
        <p className="mt-6 text-sm text-muted">
          No data stored · Analysis in under a minute
        </p>
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
            title="Trade Document Controller — Demo"
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
            <FeatureItem title={t.feature1Title} description={t.feature1Desc} />
            <FeatureItem title={t.feature2Title} description={t.feature2Desc} />
            <FeatureItem title={t.feature3Title} description={t.feature3Desc} />
            <FeatureItem title={t.feature4Title} description={t.feature4Desc} />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-semibold text-foreground text-center mb-14">
          {t.howTitle}
        </h2>
        <div className="grid md:grid-cols-3 gap-12">
          <StepItem number="1" title={t.step1Title} description={t.step1Desc} />
          <StepItem number="2" title={t.step2Title} description={t.step2Desc} />
          <StepItem number="3" title={t.step3Title} description={t.step3Desc} />
        </div>
      </section>

      {/* Final CTA */}
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
              href="/en/security"
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
          name: "Trade Document Controller",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: "https://www.controladordocumentos.com/en",
          description:
            "Tool that detects inconsistencies between commercial invoice, packing list and transport document before customs clearance.",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "EUR",
            description: "Free trial with 3 analyses included",
          },
          provider: {
            "@type": "Organization",
            name: "Trade Document Controller",
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