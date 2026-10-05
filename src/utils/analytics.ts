/**
 * Envía un evento a Google Analytics 4.
 * Solo se envía si GA está cargado (el usuario ha aceptado cookies).
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined") return;

  // @ts-expect-error gtag se inyecta dinámicamente
  if (typeof window.gtag !== "function") return;

  // @ts-expect-error gtag se inyecta dinámicamente
  window.gtag("event", eventName, params ?? {});
}