"use client";

import { useEffect } from "react";
import { useConsent } from "consentium";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function GoogleAnalytics() {
  const { store } = useConsent();

  useEffect(() => {
    if (!GA_ID) return;

    const SCRIPT_ID = "ga-gtag";

    const load = () => {
      if (document.getElementById(SCRIPT_ID)) return;

      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.appendChild(s);

      // @ts-expect-error gtag globals
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        // @ts-expect-error gtag globals
        window.dataLayer.push(arguments);
      }
      // @ts-expect-error gtag globals
      gtag("js", new Date());
      // @ts-expect-error gtag globals
      gtag("config", GA_ID, { anonymize_ip: true });
    };

    // Cargar si ya hay consentimiento
    if (store.hasConsent("analytics")) {
      load();
    }

    // Suscribirse a cambios: si el usuario acepta después, carga GA4
    const unsubscribe = store.subscribe(() => {
      if (store.hasConsent("analytics")) {
        load();
      } else {
        // @ts-expect-error inyectado por gtag
        window[`ga-disable-${GA_ID}`] = true;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [store]);

  return null;
}