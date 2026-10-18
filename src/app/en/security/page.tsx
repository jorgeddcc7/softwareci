import Link from "next/link";
import type { Metadata } from "next";
import { LanguageSwitcher } from "@/components/language-switcher";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How we handle your documents and data at Trade Document Controller. Privacy, encryption, GDPR compliance and providers.",
  alternates: {
    canonical: "https://www.controladordocumentos.com/en/security",
    languages: {
      es: "https://www.controladordocumentos.com/seguridad",
      en: "https://www.controladordocumentos.com/en/security",
    },
  },
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
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
          <LanguageSwitcher />
          <Link
            href="/en"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 w-full flex-1">
        <h1 className="text-3xl font-bold text-foreground mb-4">Security</h1>
        <p className="text-muted mb-10">
          We know you upload sensitive commercial documentation. Here's how we
          handle it, in plain language and without unnecessary jargon.
        </p>

        <div className="space-y-6 text-sm text-muted leading-relaxed">
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-base font-semibold text-foreground mb-3">
              Your documents are not stored
            </h2>
            <p>
              The PDFs you upload (invoice, packing list and transport document)
              are processed on the fly and deleted immediately after analysis.
              They are not stored on any server, not saved in any database and
              not shared with third parties.
            </p>
            <p className="mt-3">
              Once you see the result on screen, the files no longer exist.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-base font-semibold text-foreground mb-3">
              We do not use your documents to train models
            </h2>
            <p>
              We work with Google's paid API (Gemini), which guarantees that
              submitted data is not used for model training.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-base font-semibold text-foreground mb-3">
              No advertising, no data selling
            </h2>
            <p>
              We do not display ads, we do not sell data to third parties and we
              do not share information with advertisers. The only purpose of the
              tool is to help you review documentation.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-base font-semibold text-foreground mb-3">
              Delete your account whenever you want
            </h2>
            <p>
              From your account page you can delete your account and all
              associated data in one click. No emails, no justifications, no
              questions.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-base font-semibold text-foreground mb-3">
              GDPR compliance
            </h2>
            <p>
              We comply with the EU General Data Protection Regulation (GDPR).
              We only process the data needed to provide the service, and you
              can exercise your rights of access, rectification, deletion and
              portability at any time.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-base font-semibold text-foreground mb-3">
              Cookies and analytics
            </h2>
            <p>
              We use Google Analytics 4 with prior user consent. Analytics
              cookies are only activated if you explicitly accept them. IP
              addresses are anonymized before being stored.
            </p>
          </section>

          <section className="mt-12 pt-8 border-t border-border">
            <h2 className="text-base font-semibold text-foreground mb-4">
              Technical details
            </h2>
            <p className="mb-4">
              For those who want to know more about the infrastructure:
            </p>

            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  <strong className="text-foreground">
                    Document processing:
                  </strong>{" "}
                  Gemini API (Google). PDFs are sent encrypted via HTTPS and
                  deleted after analysis.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  <strong className="text-foreground">
                    Authentication and database:
                  </strong>{" "}
                  Supabase (managed Postgres), with encryption at rest and
                  HTTPS/TLS connections.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  <strong className="text-foreground">Payments:</strong> Stripe.
                  Card data never passes through our servers.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  <strong className="text-foreground">
                    Automated emails:
                  </strong>{" "}
                  Resend, with servers in the EU.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  <strong className="text-foreground">Hosting:</strong> Vercel,
                  with a global CDN and automatically renewed SSL certificates.
                </span>
              </li>
            </ul>
          </section>

          <section className="mt-8 p-6 bg-slate-50 rounded-lg">
            <p className="text-sm text-foreground">
              Any questions about security? Write to us at{" "}
              <a
                href="mailto:hola@controladordocumentos.com"
                className="text-primary hover:text-primary-hover"
              >
                hola@controladordocumentos.com
              </a>{" "}
              and we'll reply personally.
            </p>
          </section>

          <p className="text-xs text-slate-400 mt-10">
            Last updated: October 2026.
          </p>
        </div>
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted">
          <p>© 2026 Trade Document Controller. All rights reserved.</p>
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <Link href="/por-que" className="hover:text-foreground transition-colors">
              Why
            </Link>
            <Link href="/faq" className="hover:text-foreground transition-colors">
              FAQ
            </Link>
            <a
              href="mailto:hola@controladordocumentos.com"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </a>
            <Link
              href="/en/security"
              className="hover:text-foreground transition-colors"
            >
              Security
            </Link>
            <Link href="/privacidad" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/aviso-legal" className="hover:text-foreground transition-colors">
              Legal notice
            </Link>
            <Link href="/terminos" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}