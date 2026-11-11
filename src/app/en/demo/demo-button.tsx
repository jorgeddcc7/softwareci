"use client";

import Link from "next/link";
import { trackEvent } from "@/utils/analytics";

export function DemoButtonEn() {
  return (
    <Link
      href="/en/pricing"
      onClick={() => {
        trackEvent("demo_signup_clicked", {
          language: "en",
          demo_id: "shipment_demo_01",
        });
      }}
      className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
    >
      Try it for free →
    </Link>
  );
}