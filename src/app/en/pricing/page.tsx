import Link from "next/link";
import type { Metadata } from "next";
import { PlanButton } from "../../precios/plan-button";
import { LanguageSwitcher } from "@/components/language-switcher";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Trade Document Controller plans. Start free, scale when you need it. No annual contracts, no surprises.",
  alternates: {
    canonical: "https://www.controladordocumentos.com/en/pricing",
    languages: {
      es: "https://www.controladordocumentos.com/precios",
      en: "https://www.controladordocumentos.com/en/pricing",
    },
  },
};

const PLANS = [
  {
    name: "Trial",
    price: "0",
    period: "free",
    description: "Try the tool with no commitment.",
    features: [
      "3 free analyses",
      "Invoice + packing list",
      "Basic inconsistency detection",
      "No card required",
    ],
    cta: "Try for free",
    featured: false,
    priceId: null,
  },
  {
    name: "Desk",
    price: "79",
    period: "/month + VAT",
    description: "For small customs brokers and importing SMBs.",
    features: [
      "100 analyses per month",
      "Invoice + packing + transport document",
      "Generic description detection",
      "Downloadable PDF report",
      "Email support",
    ],
    cta: "Get started",
    featured: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_DESPACHO ?? null,
  },
  {
    name: "Desk Pro",
    price: "149",
    period: "/month + VAT",
    description: "For high-volume customs operations.",
    features: [
      "Unlimited analyses",
      "Generic description detection",
      "Operation history",
      "Downloadable PDF report",
      "CSV/Excel export",
      "Priority support",
    ],
    cta: "Get started",
    featured: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? null,
  },
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ limit_reached?: string; monthly_limit?: string }>;
}) {
  const params = await searchParams;
  const hideFreePlan = params.limit_reached === "true";
  const monthlyLimit = params.monthly_limit === "true";

  return (
    <div className="min-h-screen flex flex-col">
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
          <LanguageSwitcher />
          <Link
            href="/en"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 w-full flex-1">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Start free. Scale when you need it. No annual contracts, no
            surprises.
          </p>
          {monthlyLimit && (
            <div className="mt-8 max-w-2xl mx-auto p-4 bg-primary-light border border-blue-200 rounded-lg">
              <p className="text-sm text-foreground">
                <strong>You've reached the 100-analysis limit this month.</strong>{" "}
                Upgrade to the Pro plan for unlimited analyses and keep working
                without interruptions.
              </p>
            </div>
          )}
        </div>

        <div
          className={`grid gap-6 mb-16 ${
            hideFreePlan ? "md:grid-cols-2 max-w-2xl mx-auto" : "md:grid-cols-3"
          }`}
        >
          {PLANS.filter(
            (plan) => !(hideFreePlan && plan.price === "0")
          ).map((plan, i) => (
            <div
              key={i}
              className={`relative p-8 rounded-xl border-2 transition-all ${
                plan.featured
                  ? "border-primary bg-surface shadow-lg scale-105"
                  : "border-border bg-surface"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
                  Recommended
                </div>
              )}
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {plan.name}
              </h3>
              <p className="text-sm text-muted mb-6">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">
                  {plan.price}€
                </span>
                <span className="text-muted ml-1">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((c, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-foreground">{c}</span>
                  </li>
                ))}
              </ul>
              {plan.priceId && (
                <p className="text-xs text-muted text-center mt-3">
                  Cancel anytime
                </p>
              )}
              <PlanButton
                priceId={plan.priceId}
                label={plan.cta}
                destacado={plan.featured}
              />
            </div>
          ))}
        </div>

        <p className="text-xs text-muted text-center max-w-2xl mx-auto mb-4">
          Prices exclude VAT. Customers in Spain will see 21% VAT added at
          checkout. EU companies with a valid VAT number and non-EU customers
          do not pay Spanish VAT.
        </p>

        <div className="max-w-3xl mx-auto p-8 bg-primary-light border border-blue-200 rounded-xl">
          <h2 className="text-2xl font-semibold text-foreground mb-4 text-center">
            What does a documentation error cost you?
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary mb-1">€600</p>
              <p className="text-xs text-muted">
                Fine for incorrect documentation
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary mb-1">€200</p>
              <p className="text-xs text-muted">
                Daily cost of a customs hold
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary mb-1">€6,000</p>
              <p className="text-xs text-muted">
                Maximum fine for inaccuracy
              </p>
            </div>
          </div>
          <p className="text-sm text-foreground text-center leading-relaxed">
            If you avoid <strong>a single error per year</strong>, the tool pays
            for itself. If you avoid <strong>two</strong>, the ROI is{" "}
            <strong>100%</strong>.
          </p>
        </div>
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted">
          <p>
            © 2026 Trade Document Controller · Last updated: October 2026
          </p>
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