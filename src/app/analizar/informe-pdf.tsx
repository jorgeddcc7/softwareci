"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// Estilos del PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },
  // Cabecera
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 24,
    height: 24,
    backgroundColor: "#2563EB",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: 600,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "#0F172A",
  },
  headerRight: {
    fontSize: 8,
    color: "#64748B",
  },
  // Veredicto
  veredicto: {
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  veredictoTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 4,
  },
  veredictoSub: {
    fontSize: 9,
    color: "#64748B",
  },
  // Sección
  seccion: {
    marginBottom: 14,
  },
  seccionTitulo: {
    fontSize: 10,
    fontWeight: 600,
    color: "#0F172A",
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  // Alerta
  alerta: {
    marginBottom: 8,
    paddingLeft: 10,
    borderLeftWidth: 2,
  },
  alertaTitulo: {
    fontSize: 9,
    fontWeight: 600,
    color: "#0F172A",
  },
  alertaCodigo: {
    fontSize: 7,
    color: "#94A3B8",
    marginRight: 4,
  },
  alertaNota: {
    fontSize: 8,
    color: "#475569",
    marginTop: 2,
    lineHeight: 1.4,
  },
  alertaAccion: {
    fontSize: 7,
    color: "#2563EB",
    marginTop: 2,
    lineHeight: 1.4,
  },
  // Pie
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#94A3B8",
  },
});

// Colores por severidad
const COLORES: Record<string, { bg: string; border: string; texto: string }> = {
  alta: { bg: "#FEF2F2", border: "#991B1B", texto: "#991B1B" },
  media: { bg: "#FFFBEB", border: "#92400E", texto: "#92400E" },
  baja: { bg: "#F0FDF4", border: "#065F46", texto: "#065F46" },
  no_comprobable: { bg: "#F8FAFC", border: "#475569", texto: "#475569" },
};

interface Validacion {
  regla: string;
  descripcion: string;
  resultado: "ok" | "discrepancia" | "no_comprobable";
  severidad: "alta" | "media" | "baja";
  nota: string;
  accion_sugerida?: string;
}

interface DatosInforme {
  numeroFactura: string;
  numeroPacking: string;
  numeroTransporte: string | null;
  tipoTransporte: string | null;
  ruta: string | null;
  veredicto: "apto" | "revisar" | "no_apto";
  validaciones: Validacion[];
  preparadoPor?: string;
}

export function InformeDocumento({ datos }: { datos: DatosInforme }) {
  const altas = datos.validaciones.filter(
    (v) => v.resultado === "discrepancia" && v.severidad === "alta"
  );
  const medias = datos.validaciones.filter(
    (v) => v.resultado === "discrepancia" && v.severidad === "media"
  );
  const bajas = datos.validaciones.filter(
    (v) => v.resultado === "discrepancia" && v.severidad === "baja"
  );
  const noComprobables = datos.validaciones.filter(
    (v) => v.resultado === "no_comprobable"
  );

  const colorVeredicto =
    datos.veredicto === "no_apto"
      ? COLORES.alta
      : datos.veredicto === "revisar"
        ? COLORES.media
        : COLORES.baja;

  const textoVeredicto =
    datos.veredicto === "no_apto"
      ? "NO APTO - Hay discrepancias graves"
      : datos.veredicto === "revisar"
        ? "REVISAR - Hay puntos a comprobar"
        : "APTO - Sin discrepancias detectadas";

  const fecha = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabecera */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>CD</Text>
            </View>
            <Text style={styles.headerTitle}>
              Informe de revisión documental
            </Text>
          </View>
          <Text style={styles.headerRight}>{fecha}</Text>
        </View>

        {/* Veredicto */}
        <View
          style={[
            styles.veredicto,
            {
              backgroundColor: colorVeredicto.bg,
              borderLeftColor: colorVeredicto.border,
            },
          ]}
        >
          <Text style={[styles.veredictoTitle, { color: colorVeredicto.texto }]}>
            {textoVeredicto}
          </Text>
          <Text style={styles.veredictoSub}>
            Factura: {datos.numeroFactura} | Packing: {datos.numeroPacking}
            {datos.numeroTransporte && ` | ${datos.tipoTransporte}: ${datos.numeroTransporte}`}
          </Text>
          {datos.ruta && (
            <Text style={[styles.veredictoSub, { marginTop: 2 }]}>
              Ruta: {datos.ruta}
            </Text>
          )}
          {datos.preparadoPor && (
            <Text style={[styles.veredictoSub, { marginTop: 4 }]}>
              Preparado por: {datos.preparadoPor}
            </Text>
          )}
        </View>

        {/* Discrepancias graves */}
        {altas.length > 0 && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>
              Discrepancias graves ({altas.length})
            </Text>
            {altas.map((v, i) => (
              <View
                key={i}
                style={[styles.alerta, { borderLeftColor: COLORES.alta.border }]}
              >
                <Text style={styles.alertaTitulo}>
                  <Text style={styles.alertaCodigo}>[{v.regla}] </Text>
                  {v.descripcion}
                </Text>
                {v.nota && <Text style={styles.alertaNota}>{v.nota}</Text>}
                {v.accion_sugerida && (
                  <Text style={styles.alertaAccion}>
                    Acción: {v.accion_sugerida}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Discrepancias medias */}
        {medias.length > 0 && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>
              Discrepancias medias ({medias.length})
            </Text>
            {medias.map((v, i) => (
              <View
                key={i}
                style={[styles.alerta, { borderLeftColor: COLORES.media.border }]}
              >
                <Text style={styles.alertaTitulo}>
                  <Text style={styles.alertaCodigo}>[{v.regla}] </Text>
                  {v.descripcion}
                </Text>
                {v.nota && <Text style={styles.alertaNota}>{v.nota}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* No comprobables */}
        {noComprobables.length > 0 && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>
              No comprobables ({noComprobables.length})
            </Text>
            {noComprobables.map((v, i) => (
              <View
                key={i}
                style={[
                  styles.alerta,
                  { borderLeftColor: COLORES.no_comprobable.border },
                ]}
              >
                <Text style={styles.alertaTitulo}>
                  <Text style={styles.alertaCodigo}>[{v.regla}] </Text>
                  {v.descripcion}
                </Text>
                {v.nota && <Text style={styles.alertaNota}>{v.nota}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Pie */}
        <View style={styles.footer} fixed>
          <Text>Informe generado por Controlador de Documentos</Text>
          <Text>controladordocumentos.com</Text>
        </View>
      </Page>
    </Document>
  );
}