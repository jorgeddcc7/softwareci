"use client";

import { ConsentProvider, CookieBanner } from "consentium";
import "consentium/styles.css";
import { consentConfig } from "./consent-config";
import { GoogleAnalytics } from "./google-analytics";

const copy = {
  banner: {
    headline: "Tu privacidad nos importa",
    body: "Usamos cookies para que la web funcione y para entender cómo se usa. Puedes aceptar todas, rechazarlas o configurarlas.",
    acceptAll: "Aceptar todas",
    rejectAll: "Rechazar todas",
    customize: "Configurar",
    savePreferences: "Guardar preferencias",
    policyLink: "Política de privacidad",
  },
  settingsLink: {
    label: "Configuración de cookies",
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConsentProvider config={consentConfig} copy={copy}>
      {children}
      <CookieBanner />
      <GoogleAnalytics />
    </ConsentProvider>
  );
}