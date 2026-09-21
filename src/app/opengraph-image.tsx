import { ImageResponse } from "next/og";

export const alt = "Controlador de Documentos de Comercio Exterior";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)",
          padding: "80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "#2563EB",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            CD
          </div>
          <span
            style={{
              fontSize: "28px",
              fontWeight: 600,
              color: "#0F172A",
            }}
          >
            Controlador de Documentos
          </span>
        </div>

        <div
          style={{
            fontSize: "64px",
            fontWeight: 700,
            color: "#0F172A",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            maxWidth: "900px",
          }}
        >
          Detecta incoherencias en tu documentación antes del despacho aduanero
        </div>

        <div
          style={{
            marginTop: "40px",
            fontSize: "28px",
            color: "#64748B",
          }}
        >
          Factura · Packing list · Documento de transporte
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}