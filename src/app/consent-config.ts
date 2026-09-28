import type { ConsentConfig } from "consentium";
import { presetCategories } from "consentium";

export const consentConfig: ConsentConfig = {
  productName: "Controlador de Documentos",
  storageKey: "controlador-documentos-consent",
  policyVersion: 1,

  routes: {
    cookies: "/privacidad",
    privacy: "/privacidad",
  },

  categories: [
    {
      ...presetCategories.analytics,
      label: "Analíticas",
      description:
        "Nos ayudan a entender cómo se usa la web para mejorarla. Usamos Google Analytics 4.",
    },
  ],
};