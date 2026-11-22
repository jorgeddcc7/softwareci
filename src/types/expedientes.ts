export type EstadoExpediente =
  | "pendiente"
  | "en_revision"
  | "resuelto";

export const ETIQUETAS_ESTADO: Record<EstadoExpediente, string> = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  resuelto: "Resuelto",
};

export function esEstadoExpediente(
  valor: unknown
): valor is EstadoExpediente {
  return (
    valor === "pendiente" ||
    valor === "en_revision" ||
    valor === "resuelto"
  );
}