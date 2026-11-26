import type {
  DocumentoCostesLogisticos,
  LineaCosteLogistico,
  CampoLogistico,
  DecimalTexto,
} from "@/types/auditoria-logistica";

// -----------------------------------------------------------------------------
// Tipos de conciliación
// -----------------------------------------------------------------------------

export type EstadoConciliacion =
  | "coincidencia_propuesta"
  | "diferencia_propuesta"
  | "pendiente_revision"
  | "cargo_no_presupuestado"
  | "no_facturado";

export type ConfianzaEmparejamiento = "alta" | "media" | "baja";

export interface FilaConciliacion {
  id: string;
  estado: EstadoConciliacion;
  linea_presupuesto: LineaCosteLogistico | null;
  linea_factura: LineaCosteLogistico | null;
  confianza: ConfianzaEmparejamiento | null;
  puntuacion_emparejamiento: number | null;
  importe_presupuesto: DecimalTexto | null;
  importe_factura: DecimalTexto | null;
  diferencia: DecimalTexto | null;
  diferencia_centimos: string | null;
  moneda: string | null;
  motivo: string;
}

export interface ResultadoConciliacion {
  filas: FilaConciliacion[];
  diferencias_cuantificadas: FilaConciliacion[];
  cargos_no_localizados: FilaConciliacion[];
  pendientes_revision: FilaConciliacion[];
  lineas_no_facturadas: FilaConciliacion[];
}

// -----------------------------------------------------------------------------
// Normalización monetaria
// -----------------------------------------------------------------------------

export type EstadoNormalizacion = "correcto" | "ambiguo" | "invalido";

export interface ResultadoNormalizacion {
  estado: EstadoNormalizacion;
  centimos: bigint | null;
  importe_normalizado: string | null;
  motivo: string;
}

export function normalizarImporteACentimos(
  valor: string | null | undefined
): ResultadoNormalizacion {
  const resultadoInvalido = (motivo: string): ResultadoNormalizacion => ({
    estado: "invalido",
    centimos: null,
    importe_normalizado: null,
    motivo,
  });

  const resultadoAmbiguo = (motivo: string): ResultadoNormalizacion => ({
    estado: "ambiguo",
    centimos: null,
    importe_normalizado: null,
    motivo,
  });

  if (valor == null || !valor.trim()) {
    return resultadoInvalido("No hay importe disponible.");
  }

  let texto = valor.trim();
  const negativoPorParentesis = texto.startsWith("(") && texto.endsWith(")");
  if (negativoPorParentesis) texto = texto.slice(1, -1);

  texto = texto.replace(/\s/g, "");
  texto = texto.replace(/[^\d.,+-]/g, "");

  if (!texto || !/\d/.test(texto)) {
    return resultadoInvalido("El importe no contiene dígitos válidos.");
  }

  let signo = 1n;
  if (texto.startsWith("-") || negativoPorParentesis) signo = -1n;
  texto = texto.replace(/^[+-]/, "");

  if (!texto || !/^\d[\d.,]*$/.test(texto)) {
    return resultadoInvalido("Formato numérico no válido.");
  }

  const tienePunto = texto.includes(".");
  const tieneComa = texto.includes(",");

  let parteEntera = "";
  let parteDecimal = "";

  if (tienePunto && tieneComa) {
    const ultimoPunto = texto.lastIndexOf(".");
    const ultimaComa = texto.lastIndexOf(",");
    const separadorDecimal = ultimoPunto > ultimaComa ? "." : ",";
    const separadorMiles = separadorDecimal === "." ? "," : ".";
    const partes = texto.split(separadorDecimal);

    if (partes.length !== 2) return resultadoAmbiguo("Separadores decimales múltiples.");

    parteEntera = partes[0].replaceAll(separadorMiles, "");
    parteDecimal = partes[1];

    if (!/^\d+$/.test(parteEntera) || !/^\d{1,2}$/.test(parteDecimal)) {
      return resultadoAmbiguo("No se puede determinar con seguridad el formato decimal.");
    }
  } else if (tienePunto || tieneComa) {
    const separador = tienePunto ? "." : ",";
    const partes = texto.split(separador);

    if (partes.length > 2) {
      if (partes[0].length >= 1 && partes.slice(1).every((p) => /^\d{3}$/.test(p))) {
        parteEntera = partes.join("");
        parteDecimal = "00";
      } else {
        return resultadoAmbiguo("Hay varios separadores y no se puede identificar el decimal.");
      }
    } else {
      const [antes, despues] = partes;
      if (!antes || !despues || !/^\d+$/.test(antes) || !/^\d+$/.test(despues)) {
        return resultadoInvalido("Formato de separador no válido.");
      }

      if (separador === "." && antes.length <= 3 && despues.length === 5) {
        parteEntera = antes + despues.slice(0, 3);
        parteDecimal = despues.slice(3);
      } else if (despues.length <= 2) {
        parteEntera = antes;
        parteDecimal = despues;
      } else if (despues.length === 3 && antes.length <= 3) {
        return resultadoAmbiguo("El separador puede representar miles o decimales.");
      } else {
        return resultadoAmbiguo("El número de decimales no permite una interpretación segura.");
      }
    }
  } else {
    parteEntera = texto;
    parteDecimal = "00";
  }

  if (!/^\d+$/.test(parteEntera) || !/^\d{1,2}$/.test(parteDecimal)) {
    return resultadoInvalido("No se pudo normalizar el importe.");
  }

  const euros = BigInt(parteEntera);
  const decimales = BigInt(parteDecimal.padEnd(2, "0"));
  const centimos = signo * (euros * 100n + decimales);

  return {
    estado: "correcto",
    centimos,
    importe_normalizado: formatearCentimos(centimos),
    motivo: "Importe normalizado correctamente.",
  };
}

function formatearCentimos(centimos: bigint): string {
  const signo = centimos < 0n ? "-" : "";
  const absoluto = centimos < 0n ? -centimos : centimos;
  const euros = absoluto / 100n;
  const decimales = (absoluto % 100n).toString().padStart(2, "0");
  return `${signo}${euros}.${decimales}`;
}

// -----------------------------------------------------------------------------
// Lectura segura de campos extraídos
// -----------------------------------------------------------------------------

function obtenerValor<T>(campo: CampoLogistico<T>): T | null {
  if (campo.estado !== "extraido") return null;
  return campo.valor;
}

function obtenerDescripcion(linea: LineaCosteLogistico): string | null {
  const descripcion = obtenerValor(linea.descripcion);
  if (!descripcion || !descripcion.trim()) return null;
  return descripcion.trim();
}

function obtenerImporte(linea: LineaCosteLogistico): string | null {
  return obtenerValor(linea.importe);
}

function obtenerMoneda(
  linea: LineaCosteLogistico,
  documento: DocumentoCostesLogisticos
): string | null {
  const monedaLinea = obtenerValor(linea.moneda);
  const monedaDocumento = obtenerValor(documento.moneda_documento);
  const moneda = monedaLinea || monedaDocumento;
  return moneda ? moneda.trim().toUpperCase() : null;
}

// -----------------------------------------------------------------------------
// Normalización de descripciones (¡ACTUALIZADO CON SINÓNIMOS!)
// -----------------------------------------------------------------------------

const SINONIMOS: Record<string, string> = {
  document: "doc",
  documents: "doc",
  documentation: "doc",
  docs: "doc",
  documental: "doc",
  gestion: "doc",
  fee: "fee",
  fees: "fee",
  flete: "freight",
  maritimo: "ocean",
  despacho: "customs",
  aduanero: "customs",
  clearance: "customs",
  brokerage: "customs",
};

const PALABRAS_IGNORADAS = new Set([
  "the", "of", "for", "and", "a", "an", "de", "del", "la", "el", "los", "las", "por", "para", "y",
]);

function normalizarDescripcion(descripcion: string): string[] {
  return descripcion
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((palabra) => !PALABRAS_IGNORADAS.has(palabra))
    .map((palabra) => SINONIMOS[palabra] ?? palabra);
}

// ¡NUEVA FÓRMULA DE SIMILITUD!
function calcularSimilitud(descripcionA: string, descripcionB: string): number {
  const tokensA = new Set(normalizarDescripcion(descripcionA));
  const tokensB = new Set(normalizarDescripcion(descripcionB));

  if (!tokensA.size || !tokensB.size) return 0;

  const interseccion = [...tokensA].filter((token) => tokensB.has(token)).length;
  if (interseccion === 0) return 0;

  const union = new Set([...tokensA, ...tokensB]).size;
  const jaccard = interseccion / union;
  
  const minSize = Math.min(tokensA.size, tokensB.size);
  const contencion = interseccion / minSize;

  // Devolvemos la puntuación más alta entre Jaccard y la Contención
  return Math.max(jaccard, contencion * 0.9);
}

// -----------------------------------------------------------------------------
// Emparejamiento de líneas
// -----------------------------------------------------------------------------

interface CandidatoEmparejamiento {
  indicePresupuesto: number;
  indiceFactura: number;
  puntuacion: number;
}

// Bajamos los umbrales para que sea más permisivo
const UMBRAL_EMPAREJAMIENTO = 0.5;
const UMBRAL_REVISION = 0.2;

function obtenerConfianza(puntuacion: number): ConfianzaEmparejamiento {
  if (puntuacion >= 0.8) return "alta";
  if (puntuacion >= UMBRAL_EMPAREJAMIENTO) return "media";
  return "baja";
}

function generarCandidatos(
  presupuesto: DocumentoCostesLogisticos,
  factura: DocumentoCostesLogisticos
): CandidatoEmparejamiento[] {
  const candidatos: CandidatoEmparejamiento[] = [];

  presupuesto.lineas.forEach((lineaPresupuesto, indicePresupuesto) => {
    const descripcionPresupuesto = obtenerDescripcion(lineaPresupuesto);
    if (!descripcionPresupuesto) return;

    factura.lineas.forEach((lineaFactura, indiceFactura) => {
      const descripcionFactura = obtenerDescripcion(lineaFactura);
      if (!descripcionFactura) return;

      const puntuacion = calcularSimilitud(descripcionPresupuesto, descripcionFactura);

      if (puntuacion >= UMBRAL_REVISION) {
        candidatos.push({ indicePresupuesto, indiceFactura, puntuacion });
      }
    });
  });

  return candidatos.sort((a, b) => b.puntuacion - a.puntuacion);
}

// -----------------------------------------------------------------------------
// Construcción de filas
// -----------------------------------------------------------------------------

function crearFila(
  id: string,
  estado: EstadoConciliacion,
  lineaPresupuesto: LineaCosteLogistico | null,
  lineaFactura: LineaCosteLogistico | null,
  motivo: string,
  puntuacion: number | null = null,
  importePresupuesto: string | null = null,
  importeFactura: string | null = null,
  diferencia: string | null = null,
  diferenciaCentimos: string | null = null,
  moneda: string | null = null
): FilaConciliacion {
  return {
    id,
    estado,
    linea_presupuesto: lineaPresupuesto,
    linea_factura: lineaFactura,
    confianza: puntuacion === null ? null : obtenerConfianza(puntuacion),
    puntuacion_emparejamiento: puntuacion === null ? null : Number(puntuacion.toFixed(3)),
    importe_presupuesto: importePresupuesto,
    importe_factura: importeFactura,
    diferencia,
    diferencia_centimos: diferenciaCentimos,
    moneda,
    motivo,
  };
}

function conciliarPareja(
  indicePresupuesto: number,
  indiceFactura: number,
  puntuacion: number,
  presupuesto: DocumentoCostesLogisticos,
  factura: DocumentoCostesLogisticos
): FilaConciliacion {
  const lineaPresupuesto = presupuesto.lineas[indicePresupuesto];
  const lineaFactura = factura.lineas[indiceFactura];

  const importePresupuestoOriginal = obtenerImporte(lineaPresupuesto);
  const importeFacturaOriginal = obtenerImporte(lineaFactura);

  const monedaPresupuesto = obtenerMoneda(lineaPresupuesto, presupuesto);
  const monedaFactura = obtenerMoneda(lineaFactura, factura);

  const id = `presupuesto-${indicePresupuesto + 1}-factura-${indiceFactura + 1}`;

  if (!monedaPresupuesto || !monedaFactura || monedaPresupuesto !== monedaFactura) {
    return crearFila(
      id, "pendiente_revision", lineaPresupuesto, lineaFactura,
      !monedaPresupuesto || !monedaFactura ? "No se puede comprobar la moneda de ambas líneas." : `Las monedas no coinciden (${monedaPresupuesto} / ${monedaFactura}).`,
      puntuacion, importePresupuestoOriginal, importeFacturaOriginal, null, null,
      monedaPresupuesto === monedaFactura ? monedaPresupuesto : null
    );
  }

  const normalizadoPresupuesto = normalizarImporteACentimos(importePresupuestoOriginal);
  const normalizadoFactura = normalizarImporteACentimos(importeFacturaOriginal);

  if (
    normalizadoPresupuesto.estado !== "correcto" ||
    normalizadoFactura.estado !== "correcto" ||
    normalizadoPresupuesto.centimos === null ||
    normalizadoFactura.centimos === null
  ) {
    return crearFila(
      id, "pendiente_revision", lineaPresupuesto, lineaFactura,
      "No se pueden comparar los importes con seguridad. " + `Presupuesto: ${normalizadoPresupuesto.motivo} ` + `Factura: ${normalizadoFactura.motivo}`,
      puntuacion, importePresupuestoOriginal, importeFacturaOriginal, null, null, monedaPresupuesto
    );
  }

  const diferenciaCentimos = normalizadoFactura.centimos - normalizadoPresupuesto.centimos;
  const diferencia = formatearCentimos(diferenciaCentimos);

  const importePresupuesto = normalizadoPresupuesto.importe_normalizado;
  const importeFactura = normalizadoFactura.importe_normalizado;

  if (diferenciaCentimos === 0n) {
    return crearFila(
      id, "coincidencia_propuesta", lineaPresupuesto, lineaFactura,
      "Los importes coinciden. El emparejamiento sigue pendiente de confirmación.",
      puntuacion, importePresupuesto, importeFactura, "0.00", "0", monedaPresupuesto
    );
  }

  return crearFila(
    id, "diferencia_propuesta", lineaPresupuesto, lineaFactura,
    diferenciaCentimos > 0n
      ? "La factura presenta un importe superior al presupuestado. Diferencia pendiente de confirmación."
      : "La factura presenta un importe inferior al presupuestado. Diferencia pendiente de confirmación.",
    puntuacion, importePresupuesto, importeFactura, diferencia, diferenciaCentimos.toString(), monedaPresupuesto
  );
}

// -----------------------------------------------------------------------------
// Comparador principal (¡CORREGIDO CON LOS IMPORTES DE CARGOS EXTRA!)
// -----------------------------------------------------------------------------

export function compararDocumentosLogisticos(
  presupuesto: DocumentoCostesLogisticos,
  factura: DocumentoCostesLogisticos
): ResultadoConciliacion {
  const filas: FilaConciliacion[] = [];
  const candidatos = generarCandidatos(presupuesto, factura);

  const presupuestosEmparejados = new Set<number>();
  const facturasEmparejadas = new Set<number>();

  // 1. Emparejar propuestas con suficiente similitud.
  for (const candidato of candidatos) {
    const { indicePresupuesto, indiceFactura, puntuacion } = candidato;

    if (
      puntuacion < UMBRAL_EMPAREJAMIENTO ||
      presupuestosEmparejados.has(indicePresupuesto) ||
      facturasEmparejadas.has(indiceFactura)
    ) continue;

    presupuestosEmparejados.add(indicePresupuesto);
    facturasEmparejadas.add(indiceFactura);

    filas.push(conciliarPareja(indicePresupuesto, indiceFactura, puntuacion, presupuesto, factura));
  }

  // 2. Líneas de factura que tienen un candidato dudoso.
  for (const candidato of candidatos) {
    const { indicePresupuesto, indiceFactura, puntuacion } = candidato;

    if (
      puntuacion >= UMBRAL_EMPAREJAMIENTO ||
      facturasEmparejadas.has(indiceFactura) ||
      presupuestosEmparejados.has(indicePresupuesto)
    ) continue;

    const lineaPresupuesto = presupuesto.lineas[indicePresupuesto];
    const lineaFactura = factura.lineas[indiceFactura];

    filas.push(
      crearFila(
        `revision-presupuesto-${indicePresupuesto + 1}-factura-${indiceFactura + 1}`,
        "pendiente_revision", lineaPresupuesto, lineaFactura,
        "Existe una posible coincidencia, pero la similitud no es suficiente para proponerla como emparejamiento automático.",
        puntuacion, obtenerImporte(lineaPresupuesto), obtenerImporte(lineaFactura)
      )
    );

    presupuestosEmparejados.add(indicePresupuesto);
    facturasEmparejadas.add(indiceFactura);
  }

  // 3. Cargos presentes en factura sin correspondencia en presupuesto.
  factura.lineas.forEach((lineaFactura, indiceFactura) => {
    if (facturasEmparejadas.has(indiceFactura)) return;

    filas.push(
      crearFila(
        `cargo-no-presupuestado-${indiceFactura + 1}`,
        "cargo_no_presupuestado", null, lineaFactura,
        "Cargo detectado en la factura sin una línea presupuestada identificada.",
        null, null, obtenerImporte(lineaFactura), null, null, obtenerMoneda(lineaFactura, factura)
      )
    );
  });

  // 4. Líneas presupuestadas que no aparecen en la factura.
  presupuesto.lineas.forEach((lineaPresupuesto, indicePresupuesto) => {
    if (presupuestosEmparejados.has(indicePresupuesto)) return;

    filas.push(
      crearFila(
        `no-facturado-${indicePresupuesto + 1}`,
        "no_facturado", lineaPresupuesto, null,
        "Concepto presupuestado sin una línea correspondiente identificada en la factura.",
        null, obtenerImporte(lineaPresupuesto), null, null, null, obtenerMoneda(lineaPresupuesto, presupuesto)
      )
    );
  });

  // 5. Clasificación de resultados.
  const diferenciasCuantificadas = filas.filter((f) => f.estado === "diferencia_propuesta");
  const cargosNoLocalizados = filas.filter((f) => f.estado === "cargo_no_presupuestado");
  const pendientesRevision = filas.filter((f) => f.estado === "pendiente_revision");
  const lineasNoFacturadas = filas.filter((f) => f.estado === "no_facturado");

  return {
    filas,
    diferencias_cuantificadas: diferenciasCuantificadas,
    cargos_no_localizados: cargosNoLocalizados,
    pendientes_revision: pendientesRevision,
    lineas_no_facturadas: lineasNoFacturadas,
  };
}