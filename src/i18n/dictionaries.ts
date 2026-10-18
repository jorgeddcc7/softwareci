export const dictionaries = {
  es: {
    // Header
    navAnalyze: "Analizar",
    navBlog: "El Despacho",

    // Hero
    heroTitle:
      "Detecta incoherencias en tu documentación antes del despacho aduanero",
    heroSubtitle:
      "Sube la factura comercial, el packing list y el documento de transporte. En segundos sabes si hay algo que pueda generar retenciones o retrasos.",
    heroCtaPrimary: "Analizar documentos →",
    heroCtaPricing: "Ver precios",
    heroCtaWhy: "¿Por qué usar esta herramienta?",
    heroTrust: "Sin guardar datos · Análisis en menos de un minuto",

    // Vídeo
    videoTitle: "Cómo funciona en 60 segundos",
    videoSubtitle:
      "Sube la factura y el packing list. La IA los compara y te avisa de las incoherencias antes del despacho aduanero.",

    // Features
    featuresTitle: "¿Qué detecta?",
    feature1Title: "Incoherencias",
    feature1Desc: "Cantidades, pesos o bultos que no cuadran entre documentos.",
    feature2Title: "Descripciones genéricas",
    feature2Desc:
      "Descripciones que pueden generar sospecha o retención en aduana.",
    feature3Title: "Campos ausentes",
    feature3Desc: "Datos obligatorios que faltan en algún documento.",
    feature4Title: "Incoterms",
    feature4Desc: "Incoterms mal indicados, incompletos o inconsistentes.",

    // Cómo funciona
    howTitle: "Cómo funciona",
    step1Title: "Sube los documentos",
    step1Desc:
      "Factura, packing list y, opcionalmente, documento de transporte (B/L, AWB, CMR) en PDF.",
    step2Title: "La IA los analiza",
    step2Desc: "Extrae los datos clave de cada documento y los estructura.",
    step3Title: "Recibes alertas",
    step3Desc:
      "Lista priorizada por gravedad, con la referencia al documento y campo exacto en conflicto.",

    // CTA final
    ctaTitle: "¿Probamos con una operación tuya?",
    ctaSubtitle:
      "Sube los documentos y comprueba en segundos si hay algo que revisar antes del despacho.",
    ctaButton: "Analizar documentos",

    // Footer
    footerCopyright:
      "© 2026 Controlador de Documentos · Última actualización: octubre 2026",
    footerWhy: "Por qué",
    footerFaq: "FAQ",
    footerContact: "Contacto",
    footerSecurity: "Seguridad",
    footerPrivacy: "Privacidad",
    footerLegal: "Aviso legal",
    footerTerms: "Términos",
  },
  en: {
    // Header
    navAnalyze: "Analyze",
    navBlog: "The Dispatch",

    // Hero
    heroTitle: "Detect inconsistencies in your documents before customs clearance",
    heroSubtitle:
      "Upload your commercial invoice, packing list and transport document. In seconds, you'll know if anything could cause delays or holds.",
    heroCtaPrimary: "Analyze documents →",
    heroCtaPricing: "See pricing",
    heroCtaWhy: "Why use this tool?",
    heroTrust: "No data stored · Analysis in under a minute",

    // Vídeo
    videoTitle: "How it works in 60 seconds",
    videoSubtitle:
      "Upload your invoice and packing list. The AI compares them and warns you about inconsistencies before customs clearance.",

    // Features
    featuresTitle: "What does it detect?",
    feature1Title: "Inconsistencies",
    feature1Desc:
      "Quantities, weights or packages that don't match between documents.",
    feature2Title: "Generic descriptions",
    feature2Desc:
      "Descriptions that can raise suspicion or trigger a customs hold.",
    feature3Title: "Missing fields",
    feature3Desc: "Required data that's missing from any document.",
    feature4Title: "Incoterms",
    feature4Desc: "Incoterms that are wrong, incomplete or inconsistent.",

    // How it works
    howTitle: "How it works",
    step1Title: "Upload the documents",
    step1Desc:
      "Invoice, packing list and, optionally, transport document (B/L, AWB, CMR) in PDF.",
    step2Title: "AI analyzes them",
    step2Desc: "Extracts the key data from each document and structures it.",
    step3Title: "You get alerts",
    step3Desc:
      "List prioritized by severity, with the exact document reference and field in conflict.",

    // Final CTA
    ctaTitle: "Shall we test it with one of your shipments?",
    ctaSubtitle:
      "Upload the documents and check in seconds if anything needs to be reviewed before clearance.",
    ctaButton: "Analyze documents",

    // Footer
    footerCopyright:
      "© 2026 Trade Document Controller · Last updated: October 2026",
    footerWhy: "Why",
    footerFaq: "FAQ",
    footerContact: "Contact",
    footerSecurity: "Security",
    footerPrivacy: "Privacy",
    footerLegal: "Legal notice",
    footerTerms: "Terms",
  },
};

export type Locale = keyof typeof dictionaries;
export type Dictionary = (typeof dictionaries)["es"];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}