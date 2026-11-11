"use client";

import Link from "next/link";
import { trackEvent } from "@/utils/analytics";

export function DemoButtonEs() {
  return (
    <Link
      href="/precios"
      onClick={() => {
        trackEvent("demo_signup_clicked", {
          language: "es",
          demo_id: "shipment_demo_01",
        });
      }}
      className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
    >
      Probar gratis →
    </Link>
  );
}