// ============================================================
// Motor de reglas de validación (v1)
// ============================================================
//
// Este archivo compara los datos extraídos de factura y packing list
// y genera:
//   - validaciones: reglas aplicadas (ok, discrepancia, no_comprobable)
//   - advertencias: avisos sobre calidad de los datos (confianza baja)
//
// Es código PURO: no depende de IA, no llama a ninguna API.
// ============================================================

import {
  CampoTexto,
  CampoNumero,
  CampoImporte,
  CampoMagnitud,
  FacturaComercial,
  PackingList,
  DocumentoTransporte,
  Validacion,
  Severidad,
  ResultadoValidacion,
} from "../types/documentos.js";

// ------------------------------------------------------------
// Configuración de tolerancias (fijas en v1)
// ------------------------------------------------------------

const TOLERANCIA_PESO_PORCENTAJE = 0.005; // 0.5%
const TOLERANCIA_IMPORTE_ABSOLUTA = 0.01;

// ------------------------------------------------------------
// Utilidades
// ------------------------------------------------------------

function tieneTexto(campo: CampoTexto | null | undefined): boolean {
  return !!campo && campo.valor !== null && campo.valor.trim() !== "";
}

function tieneNumero(campo: CampoNumero | null | undefined): boolean {
  return !!campo && campo.valor !== null;
}

function tieneImporte(campo: CampoImporte | null | undefined): boolean {
  return !!campo && campo.importe !== null;
}

function tieneMagnitud(campo: CampoMagnitud | null | undefined): boolean {
  return !!campo && campo.valor !== null;
}

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,;:()\-/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textosEquivalentes(a: string, b: string): boolean {
  return normalizarTexto(a) === normalizarTexto(b);
}

function numerosDentroDeToleranciaPorcentual(
  a: number,
  b: number,
  tolerancia: number
): boolean {
  if (a === 0 && b === 0) return true;
  const base = Math.max(Math.abs(a), Math.abs(b));
  const diferencia = Math.abs(a - b);
  return diferencia / base <= tolerancia;
}

function numerosDentroDeToleranciaAbsoluta(
  a: number,
  b: number,
  tolerancia: number
): boolean {
  return Math.abs(a - b) <= tolerancia;
}

/**
 * Formatea un número con separador de miles y hasta 2 decimales.
 */
function formatearNumero(n: number): string {
  return n.toLocaleString("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function crearValidacion(
  regla: string,
  descripcion: string,
  resultado: ResultadoValidacion,
  severidad: Severidad,
  documentos: string[],
  campos: string[],
  valores: Record<string, unknown>,
  nota: string
): Validacion {
  return {
    regla,
    descripcion,
    resultado,
    severidad,
    documentos,
    campos,
    valores,
    nota,
  };
}

// ------------------------------------------------------------
// Tipo de salida del motor
// ------------------------------------------------------------

export interface ResultadoMotor {
  validaciones: Validacion[];
  advertencias: string[];
  descripciones_a_evaluar: Array<{
    indice_linea: number;
    descripcion: string;
    pais_origen: string | null;
    valor_linea: number | null;
    moneda: string | null;
  }>;
}

// ------------------------------------------------------------
// Reglas de validación
// ------------------------------------------------------------

/**
 * INV-PL-001: El número de factura referenciado en el packing list
 * coincide con el número de factura.
 *
 * Fallback: si el packing list no tiene numero_factura_referencia pero
 * su numero_documento coincide con la factura, se considera OK.
 */
function reglaINV_PL_001(
  factura: FacturaComercial,
  packing: PackingList
): Validacion {
  const numeroFactura = factura.numero_factura.valor;
  const referenciaPacking = packing.numero_factura_referencia.valor;
  const numeroDocumentoPacking = packing.numero_documento.valor;

  // Caso 1: falta el número de factura en la factura
  if (!numeroFactura) {
    return crearValidacion(
      "INV-PL-001",
      "Número de factura: factura vs packing list",
      "no_comprobable",
      "alta",
      ["factura_comercial", "packing_list"],
      ["numero_factura"],
      { factura: null },
      "La factura no tiene número de factura. Es un dato imprescindible para la trazabilidad."
    );
  }

  // Caso 2: el packing list tiene referencia explícita
  if (referenciaPacking) {
    const coincide = textosEquivalentes(numeroFactura, referenciaPacking);
    return crearValidacion(
      "INV-PL-001",
      "El número de factura referenciado en el packing list coincide con la factura",
      coincide ? "ok" : "discrepancia",
      "alta",
      ["factura_comercial", "packing_list"],
      ["numero_factura", "numero_factura_referencia"],
      { factura: numeroFactura, packing_list: referenciaPacking },
      coincide
        ? ""
        : `La factura indica "${numeroFactura}" pero el packing list referencia "${referenciaPacking}".`
    );
  }

  // Caso 3: no hay referencia explícita, pero el número del documento coincide
  if (numeroDocumentoPacking && textosEquivalentes(numeroFactura, numeroDocumentoPacking)) {
    return crearValidacion(
      "INV-PL-001",
      "Número de factura: factura vs packing list",
      "ok",
      "alta",
      ["factura_comercial", "packing_list"],
      ["numero_factura", "numero_documento"],
      { factura: numeroFactura, packing_list: numeroDocumentoPacking },
      `El packing list no tiene campo explícito de referencia a factura, pero su número de documento (${numeroDocumentoPacking}) coincide con el número de factura.`
    );
  }

  // Caso 4: no hay forma de comprobar
  return crearValidacion(
    "INV-PL-001",
    "Número de factura: factura vs packing list",
    "no_comprobable",
    "alta",
    ["factura_comercial", "packing_list"],
    ["numero_factura", "numero_factura_referencia"],
    { factura: numeroFactura, packing_list: null },
    "El packing list no referencia ninguna factura. No se puede comprobar la correspondencia entre documentos. Verificar manualmente."
  );
}

/**
 * INV-PL-010: Cada línea de la factura aparece representada en el packing list.
 * Comprobamos que el número de líneas es coherente y que las descripciones
 * coinciden (por orden).
 */
function reglaINV_PL_010(
  factura: FacturaComercial,
  packing: PackingList
): Validacion {
  // En v1 el packing list extrae bultos, no líneas de mercancía independientes.
  // Si no hay bultos, no podemos comprobar línea a línea.
  if (packing.bultos.length === 0) {
    return crearValidacion(
      "INV-PL-010",
      "Líneas de la factura representadas en el packing list",
      "no_comprobable",
      "media",
      ["factura_comercial", "packing_list"],
      ["lineas", "bultos"],
      { lineas_factura: factura.lineas.length, bultos_packing: 0 },
      "El packing list no desglosa bultos por línea. No se puede comprobar la correspondencia línea a línea."
    );
  }

  if (factura.lineas.length === 0) {
    return crearValidacion(
      "INV-PL-010",
      "Líneas de la factura representadas en el packing list",
      "no_comprobable",
      "media",
      ["factura_comercial", "packing_list"],
      ["lineas", "bultos"],
      { lineas_factura: 0, bultos_packing: packing.bultos.length },
      "La factura no desglosa líneas. No se puede comprobar la correspondencia."
    );
  }

  return crearValidacion(
    "INV-PL-010",
    "Líneas de la factura representadas en el packing list",
    "ok",
    "media",
    ["factura_comercial", "packing_list"],
    ["lineas", "bultos"],
    { lineas_factura: factura.lineas.length, bultos_packing: packing.bultos.length },
    ""
  );
}

/**
 * INV-PL-011: La suma de cantidades del packing list coincide con la factura.
 * Comprobamos comparando la suma de cantidades de líneas de factura
 * contra la suma de cantidades de bultos del packing.
 */
function reglaINV_PL_011(
  factura: FacturaComercial,
  packing: PackingList
): Validacion {
  // Suma de cantidades de la factura
  let sumaFactura = 0;
  let tieneCantidadesFactura = false;
  for (const linea of factura.lineas) {
    if (linea.cantidad.valor !== null) {
      sumaFactura += linea.cantidad.valor;
      tieneCantidadesFactura = true;
    }
  }

  // Suma de cantidades del packing (a nivel de bultos)
  let sumaPacking = 0;
  let tieneCantidadesPacking = false;
  for (const bulto of packing.bultos) {
    for (const linea of bulto.lineas_contenidas) {
      if (linea.cantidad.valor !== null) {
        sumaPacking += linea.cantidad.valor;
        tieneCantidadesPacking = true;
      }
    }
  }

  if (!tieneCantidadesFactura || !tieneCantidadesPacking) {
    return crearValidacion(
      "INV-PL-011",
      "Suma de cantidades: factura vs packing list",
      "no_comprobable",
      "alta",
      ["factura_comercial", "packing_list"],
      ["lineas.cantidad", "bultos.lineas_contenidas.cantidad"],
      { suma_factura: tieneCantidadesFactura ? sumaFactura : null, suma_packing: tieneCantidadesPacking ? sumaPacking : null },
      "No se puede comprobar la suma de cantidades porque falta información en alguno de los documentos."
    );
  }

  if (sumaFactura === sumaPacking) {
    return crearValidacion(
      "INV-PL-011",
      "La suma de cantidades del packing list coincide con la factura",
      "ok",
      "alta",
      ["factura_comercial", "packing_list"],
      ["lineas.cantidad", "bultos.lineas_contenidas.cantidad"],
      { suma_factura: sumaFactura, suma_packing: sumaPacking },
      ""
    );
  }

  return crearValidacion(
    "INV-PL-011",
    "Suma de cantidades: factura vs packing list",
    "discrepancia",
    "alta",
    ["factura_comercial", "packing_list"],
    ["lineas.cantidad", "bultos.lineas_contenidas.cantidad"],
    { suma_factura: sumaFactura, suma_packing: sumaPacking },
    `La factura suma ${formatearNumero(sumaFactura)} unidades, el packing list suma ${formatearNumero(sumaPacking)}.`
  );
}

/**
 * INV-PL-013: El código HS es consistente entre documentos cuando aparece en ambos.
 */
function reglaINV_PL_013(
  factura: FacturaComercial,
  packing: PackingList
): Validacion {
  // En v1 el packing list no extrae código HS a nivel de línea,
  // así que esta regla se queda como no_comprobable de momento.
  // Se activará cuando extraigamos HS del packing list.
  return crearValidacion(
    "INV-PL-013",
    "Código HS: factura vs packing list",
    "no_comprobable",
    "alta",
    ["factura_comercial", "packing_list"],
    ["lineas.codigo_hs"],
    {},
    "El packing list no desglosa código HS por línea en v1. No se puede comprobar."
  );
}

/**
 * INV-PL-030: El número de bultos coincide entre factura y packing list.
 */
function reglaINV_PL_030(
  factura: FacturaComercial,
  packing: PackingList
): Validacion {
  const bultosFactura = factura.totales_fisicos.numero_bultos.valor;
  const bultosPacking = packing.totales.numero_bultos.valor;

  if (bultosFactura === null || bultosPacking === null) {
    return crearValidacion(
      "INV-PL-030",
      "Número de bultos: factura vs packing list",
      "no_comprobable",
      "alta",
      ["factura_comercial", "packing_list"],
      ["totales_fisicos.numero_bultos", "totales.numero_bultos"],
      { factura: bultosFactura, packing_list: bultosPacking },
      "Falta el número de bultos en alguno de los documentos. Es un dato crítico para el despacho."
    );
  }

  if (bultosFactura === bultosPacking) {
    return crearValidacion(
      "INV-PL-030",
      "El número de bultos coincide entre factura y packing list",
      "ok",
      "alta",
      ["factura_comercial", "packing_list"],
      ["totales_fisicos.numero_bultos", "totales.numero_bultos"],
      { factura: bultosFactura, packing_list: bultosPacking },
      ""
    );
  }

  const diferencia = Math.abs(bultosFactura - bultosPacking);
  return crearValidacion(
    "INV-PL-030",
    "Número de bultos: factura vs packing list",
    "discrepancia",
    "alta",
    ["factura_comercial", "packing_list"],
    ["totales_fisicos.numero_bultos", "totales.numero_bultos"],
    { factura: bultosFactura, packing_list: bultosPacking },
    `La factura indica ${bultosFactura} bultos, el packing list indica ${bultosPacking}. Diferencia de ${diferencia} bulto(s).`
  );
}

/**
 * INV-PL-040: El peso neto coincide entre factura y packing list.
 */
function reglaINV_PL_040(
  factura: FacturaComercial,
  packing: PackingList
): Validacion {
  const netoFactura = factura.totales_fisicos.peso_neto.valor;
  const netoPacking = packing.totales.peso_neto.valor;

  if (netoFactura === null || netoPacking === null) {
    return crearValidacion(
      "INV-PL-040",
      "Peso neto: factura vs packing list",
      "no_comprobable",
      "alta",
      ["factura_comercial", "packing_list"],
      ["totales_fisicos.peso_neto", "totales.peso_neto"],
      { factura: netoFactura, packing_list: netoPacking },
      "Falta el peso neto en alguno de los documentos. Es un dato crítico para el despacho."
    );
  }

  if (numerosDentroDeToleranciaPorcentual(netoFactura, netoPacking, TOLERANCIA_PESO_PORCENTAJE)) {
    return crearValidacion(
      "INV-PL-040",
      "El peso neto coincide entre factura y packing list",
      "ok",
      "alta",
      ["factura_comercial", "packing_list"],
      ["totales_fisicos.peso_neto", "totales.peso_neto"],
      { factura: netoFactura, packing_list: netoPacking },
      ""
    );
  }

  const diferencia = Math.abs(netoFactura - netoPacking);
  const porcentaje = ((diferencia / Math.max(netoFactura, netoPacking)) * 100).toFixed(2);
  return crearValidacion(
    "INV-PL-040",
    "Peso neto: factura vs packing list",
    "discrepancia",
    "alta",
    ["factura_comercial", "packing_list"],
    ["totales_fisicos.peso_neto", "totales.peso_neto"],
    { factura: netoFactura, packing_list: netoPacking },
    `La factura indica ${formatearNumero(netoFactura)} kg netos, el packing list indica ${formatearNumero(netoPacking)} kg. Diferencia de ${formatearNumero(diferencia)} kg (${porcentaje}%).`
  );
}

/**
 * INV-PL-041: El peso bruto coincide entre factura y packing list.
 */
function reglaINV_PL_041(
  factura: FacturaComercial,
  packing: PackingList
): Validacion {
  const brutoFactura = factura.totales_fisicos.peso_bruto.valor;
  const brutoPacking = packing.totales.peso_bruto.valor;

  if (brutoFactura === null || brutoPacking === null) {
    return crearValidacion(
      "INV-PL-041",
      "Peso bruto: factura vs packing list",
      "no_comprobable",
      "alta",
      ["factura_comercial", "packing_list"],
      ["totales_fisicos.peso_bruto", "totales.peso_bruto"],
      { factura: brutoFactura, packing_list: brutoPacking },
      "Falta el peso bruto en alguno de los documentos. Es un dato crítico para el despacho."
    );
  }

  if (numerosDentroDeToleranciaPorcentual(brutoFactura, brutoPacking, TOLERANCIA_PESO_PORCENTAJE)) {
    return crearValidacion(
      "INV-PL-041",
      "El peso bruto coincide entre factura y packing list",
      "ok",
      "alta",
      ["factura_comercial", "packing_list"],
      ["totales_fisicos.peso_bruto", "totales.peso_bruto"],
      { factura: brutoFactura, packing_list: brutoPacking },
      ""
    );
  }

  const diferencia = Math.abs(brutoFactura - brutoPacking);
  const porcentaje = ((diferencia / Math.max(brutoFactura, brutoPacking)) * 100).toFixed(2);
  return crearValidacion(
    "INV-PL-041",
    "Peso bruto: factura vs packing list",
    "discrepancia",
    "alta",
    ["factura_comercial", "packing_list"],
    ["totales_fisicos.peso_bruto", "totales.peso_bruto"],
    { factura: brutoFactura, packing_list: brutoPacking },
    `La factura indica ${formatearNumero(brutoFactura)} kg brutos, el packing list indica ${formatearNumero(brutoPacking)} kg. Diferencia de ${formatearNumero(diferencia)} kg (${porcentaje}%).`
  );
}

/**
 * INV-PL-042: En cada documento, el peso bruto es mayor o igual que el neto.
 * Se comprueba en totales y en bultos individuales.
 */
function reglaINV_PL_042(
  factura: FacturaComercial,
  packing: PackingList
): Validacion[] {
  const validaciones: Validacion[] = [];

  // Factura: totales
  const netoF = factura.totales_fisicos.peso_neto.valor;
  const brutoF = factura.totales_fisicos.peso_bruto.valor;
  if (netoF !== null && brutoF !== null && brutoF < netoF) {
    validaciones.push(
      crearValidacion(
        "INV-PL-042",
        "Peso bruto ≥ peso neto",
        "discrepancia",
        "alta",
        ["factura_comercial"],
        ["totales_fisicos.peso_neto", "totales_fisicos.peso_bruto"],
        { peso_neto: netoF, peso_bruto: brutoF },
        `En la factura, el peso bruto (${formatearNumero(brutoF)} kg) es menor que el peso neto (${formatearNumero(netoF)} kg). Físicamente imposible.`
      )
    );
  }

  // Packing: totales
  const netoP = packing.totales.peso_neto.valor;
  const brutoP = packing.totales.peso_bruto.valor;
  if (netoP !== null && brutoP !== null && brutoP < netoP) {
    validaciones.push(
      crearValidacion(
        "INV-PL-042",
        "Relación peso bruto / peso neto",
        "discrepancia",
        "alta",
        ["packing_list"],
        ["totales.peso_neto", "totales.peso_bruto"],
        { peso_neto: netoP, peso_bruto: brutoP },
        `En el packing list, el peso bruto total (${formatearNumero(brutoP)} kg) es menor que el peso neto total (${formatearNumero(netoP)} kg). Físicamente imposible.`
      )
    );
  }

  // Packing: bultos individuales
  for (let i = 0; i < packing.bultos.length; i++) {
    const bulto = packing.bultos[i];
    const neto = bulto.peso_neto.valor;
    const bruto = bulto.peso_bruto.valor;
    if (neto !== null && bruto !== null && bruto < neto) {
      const id = bulto.numero_bulto.valor ?? bulto.identificador_bulto.valor ?? `#${i + 1}`;
      validaciones.push(
        crearValidacion(
          "INV-PL-042",
          "Relación peso bruto / peso neto",
          "discrepancia",
          "alta",
          ["packing_list"],
          [`bultos[${i}].peso_neto`, `bultos[${i}].peso_bruto`],
          { bulto: id, peso_neto: neto, peso_bruto: bruto },
          `En el packing list, el bulto "${id}" tiene peso bruto (${formatearNumero(bruto)} kg) menor que el peso neto (${formatearNumero(neto)} kg). Físicamente imposible.`
        )
      );
    }
  }

  return validaciones;
}

/**
 * INV-050: En la factura, la suma de los valores de línea coincide con el subtotal.
 */
function reglaINV_050(factura: FacturaComercial): Validacion {
  const subtotal = factura.valoracion.subtotal_mercancia.importe;

  let sumaLíneas = 0;
  let tieneLineas = false;
  for (const linea of factura.lineas) {
    if (linea.valor_linea.importe !== null) {
      sumaLíneas += linea.valor_linea.importe;
      tieneLineas = true;
    }
  }

  if (subtotal === null || !tieneLineas) {
    return crearValidacion(
      "INV-050",
      "Cuadre de líneas vs subtotal (factura)",
      "no_comprobable",
      "alta",
      ["factura_comercial"],
      ["valoracion.subtotal_mercancia", "lineas.valor_linea"],
      { subtotal, suma_lineas: tieneLineas ? sumaLíneas : null },
      "No se puede comprobar porque falta el subtotal o los valores de línea."
    );
  }

  if (numerosDentroDeToleranciaAbsoluta(sumaLíneas, subtotal, TOLERANCIA_IMPORTE_ABSOLUTA)) {
    return crearValidacion(
      "INV-050",
      "La suma de los valores de línea coincide con el subtotal de la factura",
      "ok",
      "alta",
      ["factura_comercial"],
      ["valoracion.subtotal_mercancia", "lineas.valor_linea"],
      { subtotal, suma_lineas: sumaLíneas },
      ""
    );
  }

  const diferencia = Math.abs(sumaLíneas - subtotal);
  return crearValidacion(
    "INV-050",
    "Cuadre de líneas vs subtotal (factura)",
    "discrepancia",
    "alta",
    ["factura_comercial"],
    ["valoracion.subtotal_mercancia", "lineas.valor_linea"],
    { subtotal, suma_lineas: sumaLíneas },
    `El subtotal declarado es ${formatearNumero(subtotal)}, pero la suma de las líneas es ${formatearNumero(sumaLíneas)}. Diferencia de ${formatearNumero(diferencia)}.`
  );
}

/**
 * INV-051: En la factura, subtotal - descuentos + cargos = total facturado.
 */
function reglaINV_051(factura: FacturaComercial): Validacion {
  const subtotal = factura.valoracion.subtotal_mercancia.importe;
  const descuentos = factura.valoracion.descuentos.importe ?? 0;
  const embalaje = factura.valoracion.gastos_embalaje.importe ?? 0;
  const transporte = factura.valoracion.transporte.importe ?? 0;
  const seguro = factura.valoracion.seguro.importe ?? 0;
  const total = factura.valoracion.total_facturado.importe;

  if (subtotal === null || total === null) {
    return crearValidacion(
      "INV-051",
      "Cuadre total de la factura",
      "no_comprobable",
      "alta",
      ["factura_comercial"],
      ["valoracion"],
      { subtotal, total },
      "No se puede comprobar porque falta el subtotal o el total facturado."
    );
  }

  const calculado = subtotal - descuentos + embalaje + transporte + seguro;

  if (numerosDentroDeToleranciaAbsoluta(calculado, total, TOLERANCIA_IMPORTE_ABSOLUTA)) {
    return crearValidacion(
      "INV-051",
      "El cuadre de la factura (subtotal - descuentos + cargos) coincide con el total",
      "ok",
      "alta",
      ["factura_comercial"],
      ["valoracion"],
      { calculado, declarado: total },
      ""
    );
  }

  const diferencia = Math.abs(calculado - total);
  return crearValidacion(
    "INV-051",
    "Cuadre total de la factura",
    "discrepancia",
    "alta",
    ["factura_comercial"],
    ["valoracion"],
    { calculado, declarado: total },
    `Según los componentes (subtotal ${formatearNumero(subtotal)} - descuentos ${formatearNumero(descuentos)} + embalaje ${formatearNumero(embalaje)} + transporte ${formatearNumero(transporte)} + seguro ${formatearNumero(seguro)}) el total sería ${formatearNumero(calculado)}, pero la factura declara ${formatearNumero(total)}. Diferencia de ${formatearNumero(diferencia)}.`
  );
}

/**
 * INV-PL-052: La moneda es coherente entre factura y packing list.
 * (En v1 el packing list no declara moneda explícita, así que solo
 * informamos de la moneda de la factura.)
 */
function reglaINV_PL_052(
  factura: FacturaComercial,
  _packing: PackingList
): Validacion {
  const monedaFactura = factura.moneda.valor;

  if (!monedaFactura) {
    return crearValidacion(
      "INV-PL-052",
      "Moneda en la factura",
      "no_comprobable",
      "alta",
      ["factura_comercial"],
      ["moneda"],
      { factura: null },
      "La factura no indica moneda. Es un dato imprescindible para la valoración aduanera."
    );
  }

  return crearValidacion(
    "INV-PL-052",
    "La moneda está indicada en la factura",
    "ok",
    "alta",
    ["factura_comercial"],
    ["moneda"],
    { factura: monedaFactura },
    ""
  );
}

/**
 * INV-PL-061: El Incoterm está indicado en la factura.
 */
function reglaINV_PL_061(
  factura: FacturaComercial,
  _packing: PackingList
): Validacion {
  const incoterm = factura.incoterm.codigo.valor;
  const lugar = factura.incoterm.lugar_designado.valor;

  if (!incoterm) {
    return crearValidacion(
      "INV-PL-061",
      "Incoterm en la factura (con lugar designado)",
      "discrepancia",
      "media",
      ["factura_comercial"],
      ["incoterm.codigo"],
      { incoterm: null },
      "La factura no indica Incoterm. Esto puede generar confusión sobre responsabilidad de costes y riesgos."
    );
  }

  const nota = lugar ? "" : `El Incoterm "${incoterm}" no tiene lugar designado. Un Incoterm sin lugar está incompleto.`;

  return crearValidacion(
    "INV-PL-061",
    "El Incoterm está indicado en la factura con su lugar designado",
    lugar ? "ok" : "discrepancia",
    lugar ? "media" : "baja",
    ["factura_comercial"],
    ["incoterm.codigo", "incoterm.lugar_designado"],
    { codigo: incoterm, lugar },
    nota
  );
}

/**
 * GEN-070: Campos obligatorios presentes en cada documento.
 * Genera una validación por cada campo obligatorio ausente.
 */
function reglaGEN_070(
  factura: FacturaComercial,
  packing: PackingList
): Validacion[] {
  const validaciones: Validacion[] = [];

  const obligatoriosFactura: Array<[string, CampoTexto | CampoNumero | CampoImporte | CampoMagnitud]> = [
    ["numero_factura", factura.numero_factura],
    ["fecha_emision", factura.fecha_emision],
    ["vendedor.nombre_legal", factura.vendedor.nombre_legal],
    ["comprador.nombre_legal", factura.comprador.nombre_legal],
    ["incoterm.codigo", factura.incoterm.codigo],
    ["moneda", factura.moneda],
    ["valoracion.total_facturado", factura.valoracion.total_facturado],
  ];

  for (const [nombreCampo, campo] of obligatoriosFactura) {
    const tieneValor =
      "valor" in campo ? campo.valor !== null : "importe" in campo ? campo.importe !== null : false;

    if (!tieneValor) {
      validaciones.push(
        crearValidacion(
          "GEN-070",
          `Campo obligatorio ausente factura: ${nombreCampo}`,
          "discrepancia",
          "alta",
          ["factura_comercial"],
          [nombreCampo],
          { campo: nombreCampo, estado: campo.estado },
          `El campo "${nombreCampo}" es obligatorio en una factura comercial y no se ha encontrado. Estado: ${campo.estado}.`
        )
      );
    }
  }

  const obligatoriosPacking: Array<[string, CampoTexto | CampoNumero | CampoMagnitud]> = [
    ["numero_documento", packing.numero_documento],
    ["totales.numero_bultos", packing.totales.numero_bultos],
    ["totales.peso_neto", packing.totales.peso_neto],
    ["totales.peso_bruto", packing.totales.peso_bruto],
  ];

  for (const [nombreCampo, campo] of obligatoriosPacking) {
    const tieneValor = "valor" in campo ? campo.valor !== null : false;

    if (!tieneValor) {
      validaciones.push(
        crearValidacion(
          "GEN-070",
          `Campo obligatorio ausente en packing list: ${nombreCampo}`,
          "discrepancia",
          "alta",
          ["packing_list"],
          [nombreCampo],
          { campo: nombreCampo, estado: campo.estado },
          `El campo "${nombreCampo}" es obligatorio en un packing list y no se ha encontrado. Estado: ${campo.estado}.`
        )
      );
    }
  }

  return validaciones;
}

/**
 * GEN-071: Detecta campos con confianza baja y los añade a advertencias.
 * No genera validaciones, solo advertencias.
 */
function reglaGEN_071(
  factura: FacturaComercial,
  packing: PackingList
): string[] {
  const advertencias: string[] = [];

  function revisar(
    docNombre: string,
    ruta: string,
    campo: { valor?: unknown; importe?: unknown; confianza: string }
  ) {
    const tieneValor =
      (campo.valor !== undefined && campo.valor !== null) ||
      (campo.importe !== undefined && campo.importe !== null);

    if (tieneValor && campo.confianza === "baja") {
      advertencias.push(
        `${docNombre}: el campo "${ruta}" tiene confianza baja. Verificar manualmente.`
      );
    }
  }

  revisar("Factura", "numero_factura", factura.numero_factura);
  revisar("Factura", "fecha_emision", factura.fecha_emision);
  revisar("Factura", "moneda", factura.moneda);
  revisar("Factura", "incoterm.codigo", factura.incoterm.codigo);
  revisar("Factura", "valoracion.total_facturado", factura.valoracion.total_facturado);
  revisar("Factura", "totales_fisicos.peso_neto", factura.totales_fisicos.peso_neto);
  revisar("Factura", "totales_fisicos.peso_bruto", factura.totales_fisicos.peso_bruto);
  revisar("Factura", "totales_fisicos.numero_bultos", factura.totales_fisicos.numero_bultos);

  revisar("Packing list", "numero_documento", packing.numero_documento);
  revisar("Packing list", "numero_factura_referencia", packing.numero_factura_referencia);
  revisar("Packing list", "totales.peso_neto", packing.totales.peso_neto);
  revisar("Packing list", "totales.peso_bruto", packing.totales.peso_bruto);
  revisar("Packing list", "totales.numero_bultos", packing.totales.numero_bultos);

  return advertencias;
}

/**
 * Normaliza el tipo de bulto a una categoría estándar.
 * Devuelve la categoría normalizada o null si no se reconoce.
 */
function normalizarTipoBulto(tipo: string): string | null {
  const t = normalizarTexto(tipo);

  if (/\b(carton|cartons|ctn|ctns|caja|cajas|box|boxes)\b/.test(t)) return "caja";
  if (/\b(pallet|pallets|plt|plts|palet|palets)\b/.test(t)) return "pallet";
  if (/\b(drum|drums|tambor|tambores|bidon|bidones)\b/.test(t)) return "tambor";
  if (/\b(bag|bags|saco|sacos|sack|sacks)\b/.test(t)) return "saco";
  if (/\b(roll|rolls|rollo|rollos)\b/.test(t)) return "rollo";
  if (/\b(case|cases|maleta|maletas)\b/.test(t)) return "maleta";

  return null;
}

/**
 * INV-PL-002: El vendedor de la factura coincide con el expedidor del packing.
 */
function reglaINV_PL_002(
  factura: FacturaComercial,
  packing: PackingList
): Validacion {
  const vendedor = factura.vendedor.nombre_legal.valor;
  const expedidor = packing.expedidor.nombre_legal.valor;

  if (!vendedor || !expedidor) {
    return crearValidacion(
      "INV-PL-002",
      "Vendedor / Expedidor: factura vs packing list",
      "no_comprobable",
      "media",
      ["factura_comercial", "packing_list"],
      ["vendedor.nombre_legal", "expedidor.nombre_legal"],
      { factura: vendedor, packing_list: expedidor },
      "Falta el nombre del vendedor o del expedidor en alguno de los documentos."
    );
  }

  if (textosEquivalentes(vendedor, expedidor)) {
    return crearValidacion(
      "INV-PL-002",
      "El vendedor de la factura coincide con el expedidor del packing list",
      "ok",
      "media",
      ["factura_comercial", "packing_list"],
      ["vendedor.nombre_legal", "expedidor.nombre_legal"],
      { factura: vendedor, packing_list: expedidor },
      ""
    );
  }

  return crearValidacion(
    "INV-PL-002",
    "Vendedor / Expedidor: factura vs packing list",
    "discrepancia",
    "media",
    ["factura_comercial", "packing_list"],
    ["vendedor.nombre_legal", "expedidor.nombre_legal"],
    { factura: vendedor, packing_list: expedidor },
    `La factura identifica al vendedor como "${vendedor}", pero el packing list identifica al expedidor como "${expedidor}".`
  );
}

/**
 * INV-PL-003: El comprador de la factura coincide con el destinatario del packing.
 */
function reglaINV_PL_003(
  factura: FacturaComercial,
  packing: PackingList
): Validacion {
  const comprador = factura.comprador.nombre_legal.valor;
  const destinatario = packing.destinatario.nombre_legal.valor;

  if (!comprador || !destinatario) {
    return crearValidacion(
      "INV-PL-003",
      "Comprador / Destinatario: factura vs packing list",
      "no_comprobable",
      "media",
      ["factura_comercial", "packing_list"],
      ["comprador.nombre_legal", "destinatario.nombre_legal"],
      { factura: comprador, packing_list: destinatario },
      "Falta el nombre del comprador o del destinatario en alguno de los documentos."
    );
  }

  if (textosEquivalentes(comprador, destinatario)) {
    return crearValidacion(
      "INV-PL-003",
      "El comprador de la factura coincide con el destinatario del packing list",
      "ok",
      "media",
      ["factura_comercial", "packing_list"],
      ["comprador.nombre_legal", "destinatario.nombre_legal"],
      { factura: comprador, packing_list: destinatario },
      ""
    );
  }

  return crearValidacion(
    "INV-PL-003",
    "Comprador / Destinatario: factura vs packing list",
    "discrepancia",
    "media",
    ["factura_comercial", "packing_list"],
    ["comprador.nombre_legal", "destinatario.nombre_legal"],
    { factura: comprador, packing_list: destinatario },
    `La factura identifica al comprador como "${comprador}", pero el packing list identifica al destinatario como "${destinatario}".`
  );
}

/**
 * INV-PL-004: El consignatario coincide entre factura y packing list,
 * si aparece en ambos documentos.
 */
function reglaINV_PL_004(
  factura: FacturaComercial,
  packing: PackingList
): Validacion {
  const consignatarioFactura = factura.consignatario.nombre_legal.valor;
  const consignatarioPacking = packing.consignatario.nombre_legal.valor;

  if (!consignatarioFactura || !consignatarioPacking) {
    return crearValidacion(
      "INV-PL-004",
      "Consignatario: factura vs packing list",
      "no_comprobable",
      "baja",
      ["factura_comercial", "packing_list"],
      ["consignatario.nombre_legal"],
      { factura: consignatarioFactura, packing_list: consignatarioPacking },
      "El consignatario no aparece en uno o ambos documentos. No se puede comprobar."
    );
  }

  if (textosEquivalentes(consignatarioFactura, consignatarioPacking)) {
    return crearValidacion(
      "INV-PL-004",
      "El consignatario coincide entre factura y packing list",
      "ok",
      "baja",
      ["factura_comercial", "packing_list"],
      ["consignatario.nombre_legal"],
      { factura: consignatarioFactura, packing_list: consignatarioPacking },
      ""
    );
  }

  return crearValidacion(
    "INV-PL-004",
    "Consignatario: factura vs packing list",
    "discrepancia",
    "media",
    ["factura_comercial", "packing_list"],
    ["consignatario.nombre_legal"],
    { factura: consignatarioFactura, packing_list: consignatarioPacking },
    `La factura identifica al consignatario como "${consignatarioFactura}", pero el packing list lo identifica como "${consignatarioPacking}".`
  );
}

/**
 * INV-PL-005: Las fechas de emisión son coherentes (máximo 7 días de diferencia).
 */
function reglaINV_PL_005(
  factura: FacturaComercial,
  packing: PackingList
): Validacion {
  const fechaFactura = factura.fecha_emision.valor;
  const fechaPacking = packing.fecha_emision.valor;

  if (!fechaFactura || !fechaPacking) {
    return crearValidacion(
      "INV-PL-005",
      "Fechas de emisión: factura vs packing list",
      "no_comprobable",
      "baja",
      ["factura_comercial", "packing_list"],
      ["fecha_emision"],
      { factura: fechaFactura, packing_list: fechaPacking },
      "Falta la fecha de emisión en alguno de los documentos."
    );
  }

  const d1 = new Date(fechaFactura);
  const d2 = new Date(fechaPacking);

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    return crearValidacion(
      "INV-PL-005",
      "Fechas de emisión: factura vs packing list",
      "no_comprobable",
      "baja",
      ["factura_comercial", "packing_list"],
      ["fecha_emision"],
      { factura: fechaFactura, packing_list: fechaPacking },
      "Alguna de las fechas no tiene un formato interpretable."
    );
  }

  const diffDias = Math.abs((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDias <= 7) {
    return crearValidacion(
      "INV-PL-005",
      "Fechas de emisión: factura vs packing list",
      "ok",
      "baja",
      ["factura_comercial", "packing_list"],
      ["fecha_emision"],
      { factura: fechaFactura, packing_list: fechaPacking, diferencia_dias: diffDias },
      ""
    );
  }

  return crearValidacion(
    "INV-PL-005",
    "Fechas de emisión: factura vs packing list",
    "discrepancia",
    "baja",
    ["factura_comercial", "packing_list"],
    ["fecha_emision"],
    { factura: fechaFactura, packing_list: fechaPacking, diferencia_dias: diffDias },
    `La factura es del ${fechaFactura} y el packing list del ${fechaPacking}. Diferencia de ${Math.round(diffDias)} días.`
  );
}

/**
 * INV-PL-031: El tipo de bultos es coherente entre factura y packing list.
 */
function reglaINV_PL_031(
  factura: FacturaComercial,
  packing: PackingList
): Validacion {
  const tipoFactura = factura.totales_fisicos.tipo_bultos.valor;
  const tipoPacking = packing.totales.tipo_bultos.valor;

  if (!tipoFactura || !tipoPacking) {
    return crearValidacion(
      "INV-PL-031",
      "Tipo de bultos: factura vs packing list",
      "no_comprobable",
      "media",
      ["factura_comercial", "packing_list"],
      ["totales_fisicos.tipo_bultos", "totales.tipo_bultos"],
      { factura: tipoFactura, packing_list: tipoPacking },
      "Falta el tipo de bultos en alguno de los documentos."
    );
  }

  const normalizadoFactura = normalizarTipoBulto(tipoFactura);
  const normalizadoPacking = normalizarTipoBulto(tipoPacking);

  if (normalizadoFactura && normalizadoPacking && normalizadoFactura === normalizadoPacking) {
    return crearValidacion(
      "INV-PL-031",
      "El tipo de bultos es coherente entre factura y packing list",
      "ok",
      "media",
      ["factura_comercial", "packing_list"],
      ["totales_fisicos.tipo_bultos", "totales.tipo_bultos"],
      { factura: tipoFactura, packing_list: tipoPacking },
      ""
    );
  }

  // Si no se reconocen, comparación literal
  if (textosEquivalentes(tipoFactura, tipoPacking)) {
    return crearValidacion(
      "INV-PL-031",
      "El tipo de bultos es coherente entre factura y packing list",
      "ok",
      "media",
      ["factura_comercial", "packing_list"],
      ["totales_fisicos.tipo_bultos", "totales.tipo_bultos"],
      { factura: tipoFactura, packing_list: tipoPacking },
      ""
    );
  }

  return crearValidacion(
    "INV-PL-031",
    "El tipo de bultos es coherente entre factura y packing list",
    "discrepancia",
    "media",
    ["factura_comercial", "packing_list"],
    ["totales_fisicos.tipo_bultos", "totales.tipo_bultos"],
    { factura: tipoFactura, packing_list: tipoPacking },
    `La factura indica "${tipoFactura}" y el packing list "${tipoPacking}". Los tipos de bulto no coinciden.`
  );
}

/**
 * Lista de palabras/frases que indican descripción genérica.
 * Si la descripción contiene alguna de estas, se marca como sospechosa.
 * No es una lista exhaustiva; se ampliará con feedback real.
 */
const PALABRAS_GENERICAS = [
  "repuesto",
  "repuestos",
  "mercancia",
  "mercancías",
  "mercaderia",
  "mercaderías",
  "articulo",
  "artículo",
  "articulos",
  "artículos",
  "producto",
  "productos",
  "bienes",
  "goods",
  "parts",
  "spare parts",
  "samples",
  "muestra",
  "muestras",
  "general cargo",
  "general merchandise",
  "electronics",
  "electronicos",
  "electrónicos",
  "miscellaneous",
  "varios",
  "otros",
  "assorted",
  "various",
];

/**
 * Normaliza una descripción para buscar palabras genéricas.
 */
function contienePalabraGenerica(descripcion: string): string | null {
  const normalizada = normalizarTexto(descripcion);

  for (const palabra of PALABRAS_GENERICAS) {
    const palabraNormalizada = normalizarTexto(palabra);
    // Buscar como palabra completa (con límites)
    const regex = new RegExp(`\\b${palabraNormalizada}\\b`);
    if (regex.test(normalizada)) {
      return palabra;
    }
  }

  return null;
}

/**
 * INV-020: La descripción de la mercancía no es demasiado genérica.
 *
 * Este paso es determinista (lista negra). Para las descripciones que
 * superan la lista negra pero podrían ser genéricas, se devuelven en
 * "descripciones_a_evaluar" para que se evalúen con IA después.
 */
function reglaINV_020(factura: FacturaComercial): {
  validaciones: Validacion[];
  descripciones_a_evaluar: Array<{
    indice_linea: number;
    descripcion: string;
    pais_origen: string | null;
    valor_linea: number | null;
    moneda: string | null;
  }>;
} {
  const validaciones: Validacion[] = [];
  const descripciones_a_evaluar: Array<{
    indice_linea: number;
    descripcion: string;
    pais_origen: string | null;
    valor_linea: number | null;
    moneda: string | null;
  }> = [];

  for (let i = 0; i < factura.lineas.length; i++) {
    const linea = factura.lineas[i];
    const descripcion = linea.descripcion_comercial.valor;

    if (!descripcion || descripcion.trim() === "") {
      continue;
    }

    const palabraGenerica = contienePalabraGenerica(descripcion);

    if (palabraGenerica) {
      // Alerta inmediata por lista negra
      validaciones.push(
        crearValidacion(
          "INV-020",
          "Especificidad de la descripción (lista negra)",
          "discrepancia",
          "media",
          ["factura_comercial"],
          [`lineas[${i}].descripcion_comercial`],
          { descripcion, palabra_generica: palabraGenerica },
          `La descripción "${descripcion}" contiene la palabra genérica "${palabraGenerica}". Las descripciones genéricas pueden generar sospecha o retención en aduana. Se recomienda detallar más: composición, uso, modelo, referencia.`
        )
      );
    } else {
      // No contiene palabras de la lista negra → pasa a evaluación con IA
      descripciones_a_evaluar.push({
        indice_linea: i,
        descripcion,
        pais_origen: linea.pais_origen.valor,
        valor_linea: linea.valor_linea.importe,
        moneda: linea.valor_linea.moneda,
      });
    }
  }

  return { validaciones, descripciones_a_evaluar };
}

/**
 * INV-021: La descripción de la mercancía no es demasiado genérica
 * (evaluación con IA para las que no detecta la lista negra).
 *
 * Esta función recibe los resultados de la evaluación con IA y genera
 * las validaciones correspondientes.
 */
export function generarValidacionesINV_021(
  resultados: Array<{
    indice_linea: number;
    descripcion: string;
    es_especifica: boolean;
    motivo: string;
    sugerencia: string;
    confianza: "alta" | "media" | "baja";
  }>
): Validacion[] {
  const validaciones: Validacion[] = [];

  for (const r of resultados) {
    if (r.es_especifica) continue;

    validaciones.push(
      crearValidacion(
        "INV-021",
        "Especificidad de la descripción (evaluación IA)",
        "discrepancia",
        "media",
        ["factura_comercial"],
        [`lineas[${r.indice_linea}].descripcion_comercial`],
        {
          descripcion: r.descripcion,
          motivo: r.motivo,
          confianza_ia: r.confianza,
        },
        `La descripción "${r.descripcion}" parece genérica. Motivo: ${r.motivo}${r.sugerencia ? ` Sugerencia: ${r.sugerencia}` : ""}`
      )
    );
  }

  return validaciones;
}

// ------------------------------------------------------------
// Reglas que involucran el documento de transporte (documento de transporte)
// ------------------------------------------------------------
//
// Solo se ejecutan si el usuario ha subido un documento de transporte.
// Comparan factura ↔ documento de transporte y packing ↔ documento de transporte.
// ------------------------------------------------------------

/**
 * INV-BL-001: El número de factura referenciado en el documento de transporte coincide con la factura.
 */
function reglaINV_BL_001(
  factura: FacturaComercial,
  transporte: DocumentoTransporte
): Validacion {
  const numeroFactura = factura.numero_factura.valor;
  const referenciaBL = transporte.numero_factura_referencia.valor;

  if (!numeroFactura || !referenciaBL) {
    return crearValidacion(
      "INV-BL-001",
      "Número de factura: factura vs documento de transporte",
      "no_comprobable",
      "alta",
      ["factura_comercial", "documento_transporte"],
      ["numero_factura", "numero_factura_referencia"],
      { factura: numeroFactura, bl: referenciaBL },
      "No se puede comprobar porque falta el número de factura en alguno de los documentos."
    );
  }

  const coincide = textosEquivalentes(numeroFactura, referenciaBL);

  return crearValidacion(
    "INV-BL-001",
    "Número de factura: factura vs documento de transporte",
    coincide ? "ok" : "discrepancia",
    "alta",
    ["factura_comercial", "documento_transporte"],
    ["numero_factura", "numero_factura_referencia"],
    { factura: numeroFactura, bl: referenciaBL },
    coincide
      ? ""
      : `La factura indica "${numeroFactura}" pero el documento de transporte referencia "${referenciaBL}".`
  );
}

/**
 * INV-BL-002: El expedidor del documento de transporte coincide con el vendedor de la factura.
 */
function reglaINV_BL_002(
  factura: FacturaComercial,
  transporte: DocumentoTransporte
): Validacion {
  const vendedor = factura.vendedor.nombre_legal.valor;
  const expedidor = transporte.expedidor.nombre_legal.valor;

  if (!vendedor || !expedidor) {
    return crearValidacion(
      "INV-BL-002",
      "Vendedor / Expedidor: factura vs documento de transporte",
      "no_comprobable",
      "media",
      ["factura_comercial", "documento_transporte"],
      ["vendedor.nombre_legal", "expedidor.nombre_legal"],
      { factura: vendedor, bl: expedidor },
      "Falta el nombre del vendedor o del expedidor en alguno de los documentos."
    );
  }

  const coincide = textosEquivalentes(vendedor, expedidor);

  return crearValidacion(
    "INV-BL-002",
    "Vendedor / Expedidor: factura vs documento de transporte",
    coincide ? "ok" : "discrepancia",
    "media",
    ["factura_comercial", "documento_transporte"],
    ["vendedor.nombre_legal", "expedidor.nombre_legal"],
    { factura: vendedor, bl: expedidor },
    coincide
      ? ""
      : `La factura identifica al vendedor como "${vendedor}", el documento de transporte identifica al expedidor como "${expedidor}".`
  );
}

/**
 * INV-BL-003: El consignatario del documento de transporte coincide con el consignatario de la factura.
 */
function reglaINV_BL_003(
  factura: FacturaComercial,
  transporte: DocumentoTransporte
): Validacion {
  const consignatarioFactura = factura.consignatario.nombre_legal.valor;
  const consignatarioBL = transporte.consignatario.nombre_legal.valor;

  if (!consignatarioFactura || !consignatarioBL) {
    return crearValidacion(
      "INV-BL-003",
      "Consignatario: factura vs documento de transporte",
      "no_comprobable",
      "media",
      ["factura_comercial", "documento_transporte"],
      ["consignatario.nombre_legal"],
      { factura: consignatarioFactura, bl: consignatarioBL },
      "Falta el consignatario en alguno de los documentos."
    );
  }

  const coincide = textosEquivalentes(consignatarioFactura, consignatarioBL);

  return crearValidacion(
    "INV-BL-003",
    "Consignatario: factura vs documento de transporte",
    coincide ? "ok" : "discrepancia",
    "media",
    ["factura_comercial", "documento_transporte"],
    ["consignatario.nombre_legal"],
    { factura: consignatarioFactura, bl: consignatarioBL },
    coincide
      ? ""
      : `La factura identifica al consignatario como "${consignatarioFactura}", el documento de transporte como "${consignatarioBL}".`
  );
}

/**
 * INV-BL-010: El número de bultos coincide entre factura y documento de transporte.
 */
function reglaINV_BL_010(
  factura: FacturaComercial,
  transporte: DocumentoTransporte
): Validacion {
  const bultosFactura = factura.totales_fisicos.numero_bultos.valor;
  const bultosBL = transporte.carga.numero_bultos.valor;

  if (bultosFactura === null || bultosBL === null) {
    return crearValidacion(
      "INV-BL-010",
      "Número de bultos: factura vs documento de transporte",
      "no_comprobable",
      "alta",
      ["factura_comercial", "documento_transporte"],
      ["totales_fisicos.numero_bultos", "carga.numero_bultos"],
      { factura: bultosFactura, bl: bultosBL },
      "Falta el número de bultos en alguno de los documentos."
    );
  }

  if (bultosFactura === bultosBL) {
    return crearValidacion(
      "INV-BL-010",
      "El número de bultos coincide entre factura y documento de transporte",
      "ok",
      "alta",
      ["factura_comercial", "documento_transporte"],
      ["totales_fisicos.numero_bultos", "carga.numero_bultos"],
      { factura: bultosFactura, bl: bultosBL },
      ""
    );
  }

  const diferencia = Math.abs(bultosFactura - bultosBL);
  return crearValidacion(
    "INV-BL-010",
    "Número de bultos: factura vs documento de transporte",
    "discrepancia",
    "alta",
    ["factura_comercial", "documento_transporte"],
    ["totales_fisicos.numero_bultos", "carga.numero_bultos"],
    { factura: bultosFactura, bl: bultosBL },
    `La factura indica ${bultosFactura} bultos, el documento de transporte indica ${bultosBL}. Diferencia de ${diferencia} bulto(s).`
  );
}

/**
 * INV-BL-011: El peso bruto coincide entre factura y documento de transporte.
 */
function reglaINV_BL_011(
  factura: FacturaComercial,
  transporte: DocumentoTransporte
): Validacion {
  const brutoFactura = factura.totales_fisicos.peso_bruto.valor;
  const brutoBL = transporte.carga.peso_bruto.valor;

  if (brutoFactura === null || brutoBL === null) {
    return crearValidacion(
      "INV-BL-011",
      "Peso bruto: factura vs documento de transporte",
      "no_comprobable",
      "alta",
      ["factura_comercial", "documento_transporte"],
      ["totales_fisicos.peso_bruto", "carga.peso_bruto"],
      { factura: brutoFactura, bl: brutoBL },
      "Falta el peso bruto en alguno de los documentos."
    );
  }

  if (numerosDentroDeToleranciaPorcentual(brutoFactura, brutoBL, TOLERANCIA_PESO_PORCENTAJE)) {
    return crearValidacion(
      "INV-BL-011",
      "El peso bruto coincide entre factura y documento de transporte",
      "ok",
      "alta",
      ["factura_comercial", "documento_transporte"],
      ["totales_fisicos.peso_bruto", "carga.peso_bruto"],
      { factura: brutoFactura, bl: brutoBL },
      ""
    );
  }

  const diferencia = Math.abs(brutoFactura - brutoBL);
  const porcentaje = ((diferencia / Math.max(brutoFactura, brutoBL)) * 100).toFixed(2);
  return crearValidacion(
    "INV-BL-011",
    "Peso bruto: factura vs documento de transporte",
    "discrepancia",
    "alta",
    ["factura_comercial", "documento_transporte"],
    ["totales_fisicos.peso_bruto", "carga.peso_bruto"],
    { factura: brutoFactura, bl: brutoBL },
    `La factura indica ${formatearNumero(brutoFactura)} kg brutos, el documento de transporte indica ${formatearNumero(brutoBL)} kg. Diferencia de ${formatearNumero(diferencia)} kg (${porcentaje}%).`
  );
}

/**
 * INV-BL-012: El Incoterm del documento de transporte coincide con el de la factura.
 */
function reglaINV_BL_012(
  factura: FacturaComercial,
  _transporte: DocumentoTransporte
): Validacion {
  // En v1 el documento de transporte extrae el Incoterm dentro de "flete_pagado_en" o en remarks,
  // pero no tenemos un campo explícito. Esta regla se queda como no_comprobable
  // hasta que ampliemos el schema del documento de transporte con Incoterm explícito.
  const incotermFactura = factura.incoterm.codigo.valor;

  return crearValidacion(
    "INV-BL-012",
    "Incoterm: factura vs documento de transporte",
    "no_comprobable",
    "media",
    ["factura_comercial", "documento_transporte"],
    ["incoterm.codigo"],
    { factura: incotermFactura },
    "El documento de transporte en v1 no extrae Incoterm en campo explícito. Se puede comparar cuando ampliemos el schema."
  );
}

/**
 * PL-BL-001: El número de bultos coincide entre packing list y documento de transporte.
 */
function reglaPL_BL_001(
  packing: PackingList,
  transporte: DocumentoTransporte
): Validacion {
  const bultosPacking = packing.totales.numero_bultos.valor;
  const bultosBL = transporte.carga.numero_bultos.valor;

  if (bultosPacking === null || bultosBL === null) {
    return crearValidacion(
      "PL-BL-001",
      "Número de bultos: packing vs documento de transporte",
      "no_comprobable",
      "alta",
      ["packing_list", "documento_transporte"],
      ["totales.numero_bultos", "carga.numero_bultos"],
      { packing: bultosPacking, bl: bultosBL },
      "Falta el número de bultos en alguno de los documentos."
    );
  }

  if (bultosPacking === bultosBL) {
    return crearValidacion(
      "PL-BL-001",
      "El número de bultos coincide entre packing list y documento de transporte",
      "ok",
      "alta",
      ["packing_list", "documento_transporte"],
      ["totales.numero_bultos", "carga.numero_bultos"],
      { packing: bultosPacking, bl: bultosBL },
      ""
    );
  }

  const diferencia = Math.abs(bultosPacking - bultosBL);
  return crearValidacion(
    "PL-BL-001",
    "Número de bultos: packing vs documento de transporte",
    "discrepancia",
    "alta",
    ["packing_list", "documento_transporte"],
    ["totales.numero_bultos", "carga.numero_bultos"],
    { packing: bultosPacking, bl: bultosBL },
    `El packing list indica ${bultosPacking} bultos, el documento de transporte indica ${bultosBL}. Diferencia de ${diferencia} bulto(s).`
  );
}

/**
 * PL-BL-002: El peso bruto coincide entre packing list y documento de transporte.
 */
function reglaPL_BL_002(
  packing: PackingList,
  transporte: DocumentoTransporte
): Validacion {
  const brutoPacking = packing.totales.peso_bruto.valor;
  const brutoBL = transporte.carga.peso_bruto.valor;

  if (brutoPacking === null || brutoBL === null) {
    return crearValidacion(
      "PL-BL-002",
      "Peso bruto: packing vs documento de transporte",
      "no_comprobable",
      "alta",
      ["packing_list", "documento_transporte"],
      ["totales.peso_bruto", "carga.peso_bruto"],
      { packing: brutoPacking, bl: brutoBL },
      "Falta el peso bruto en alguno de los documentos."
    );
  }

  if (numerosDentroDeToleranciaPorcentual(brutoPacking, brutoBL, TOLERANCIA_PESO_PORCENTAJE)) {
    return crearValidacion(
      "PL-BL-002",
      "El peso bruto coincide entre packing list y documento de transporte",
      "ok",
      "alta",
      ["packing_list", "documento_transporte"],
      ["totales.peso_bruto", "carga.peso_bruto"],
      { packing: brutoPacking, bl: brutoBL },
      ""
    );
  }

  const diferencia = Math.abs(brutoPacking - brutoBL);
  const porcentaje = ((diferencia / Math.max(brutoPacking, brutoBL)) * 100).toFixed(2);
  return crearValidacion(
    "PL-BL-002",
    "Peso bruto: packing vs documento de transporte",
    "discrepancia",
    "alta",
    ["packing_list", "documento_transporte"],
    ["totales.peso_bruto", "carga.peso_bruto"],
    { packing: brutoPacking, bl: brutoBL },
    `El packing list indica ${formatearNumero(brutoPacking)} kg brutos, el documento de transporte indica ${formatearNumero(brutoBL)} kg. Diferencia de ${formatearNumero(diferencia)} kg (${porcentaje}%).`
  );
}

/**
 * PL-BL-003: El tipo de bultos coincide entre packing list y documento de transporte.
 */
function reglaPL_BL_003(
  packing: PackingList,
  transporte: DocumentoTransporte
): Validacion {
  const tipoPacking = packing.totales.tipo_bultos.valor;
  const tipoBL = transporte.carga.tipo_bultos.valor;

  if (!tipoPacking || !tipoBL) {
    return crearValidacion(
      "PL-BL-003",
      "Tipo de bultos: packing vs documento de transporte",
      "no_comprobable",
      "media",
      ["packing_list", "documento_transporte"],
      ["totales.tipo_bultos", "carga.tipo_bultos"],
      { packing: tipoPacking, bl: tipoBL },
      "Falta el tipo de bultos en alguno de los documentos."
    );
  }

  const normalizadoPacking = normalizarTipoBulto(tipoPacking);
  const normalizadoBL = normalizarTipoBulto(tipoBL);

  const coincide =
    (normalizadoPacking && normalizadoBL && normalizadoPacking === normalizadoBL) ||
    textosEquivalentes(tipoPacking, tipoBL);

  return crearValidacion(
    "PL-BL-003",
    "El tipo de bultos coincide entre packing list y documento de transporte",
    coincide ? "ok" : "discrepancia",
    "media",
    ["packing_list", "documento_transporte"],
    ["totales.tipo_bultos", "carga.tipo_bultos"],
    { packing: tipoPacking, bl: tipoBL },
    coincide
      ? ""
      : `El packing list indica "${tipoPacking}", el documento de transporte indica "${tipoBL}".`
  );
}

// ------------------------------------------------------------
// Acciones sugeridas por regla
// ------------------------------------------------------------
//
// Cada regla de discrepancia tiene una acción recomendada que se
// muestra al usuario en la web. Es texto fijo por regla en v1.
// En v2 podría generarse con IA según el contexto.
// ------------------------------------------------------------

export const ACCIONES_SUGERIDAS: Record<string, string> = {
  // Referencia y partes
  "INV-PL-001":
    "Verificar que la factura y el packing list corresponden a la misma operación.",
  "INV-PL-002":
    "Confirmar si el vendedor de la factura y el expedidor del packing son la misma entidad. Si son distintos (matriz/filial), documentarlo.",
  "INV-PL-003":
    "Comprobar que el comprador de la factura y el destinatario del packing coinciden. Si son distintos, documentar la relación.",
  "INV-PL-004":
    "Confirmar el consignatario correcto. Debe coincidir entre factura y packing list.",
  "INV-PL-005":
    "Revisar las fechas de emisión. Si hay diferencia significativa, confirmar la secuencia real de los documentos.",

  // Líneas y cantidades
  "INV-PL-010":
    "Comprobar que todas las líneas de la factura aparecen representadas en el packing list.",
  "INV-PL-011":
    "Revisar la cantidad total facturada y la del packing list. Identificar qué línea genera la diferencia.",
  "INV-PL-013":
    "Verificar el código HS en ambos documentos. Si hay discrepancia, confirmar con el proveedor.",

  // Bultos
  "INV-PL-030":
    "Verificar con el proveedor y el transportista cuál es el número correcto de bultos antes de enviar la documentación al agente de aduanas.",
  "INV-PL-031":
    "Unificar el tipo de bultos declarado en factura y packing list (cajas, pallets, etc.).",

  // Pesos
  "INV-PL-040":
    "Verificar con el proveedor el peso neto correcto. Corregir el documento que esté mal.",
  "INV-PL-041":
    "Verificar con el proveedor y el transportista el peso bruto correcto. Suele coincidir con el declarado en el documento de transporte.",
  "INV-PL-042":
    "Corregir el documento: el peso bruto nunca puede ser menor que el peso neto.",

  // Valoración
  "INV-050":
    "Revisar la factura: la suma de líneas no cuadra con el subtotal. Verificar precios y cantidades.",
  "INV-051":
    "Revisar la factura: la suma de componentes no cuadra con el total. Verificar cargos, descuentos e impuestos.",

  // Moneda e Incoterm
  "INV-PL-052":
    "Añadir la moneda a la factura antes del despacho.",
  "INV-PL-061":
    "Añadir el Incoterm en la factura con su lugar designado (ej: FOB Shanghai).",

  // Descripciones
  "INV-020":
    "Ampliar la descripción con composición, uso, modelo o referencia. Las descripciones genéricas pueden generar retenciones en aduana.",
  "INV-021":
    "Mejorar la descripción siguiendo la sugerencia del análisis. Detallar qué es, para qué sirve y características técnicas.",
  "INV-070":
    "Solicitar al proveedor una factura con el valor de la mercancía (FOB) desglosado del flete y el seguro. El Incoterm declarado lo requiere para la valoración aduanera.",

  // Factura vs documento de transporte
  "INV-BL-001":
    "Verificar que el documento de transporte referencia la factura correcta. Si no, contactar al transitario.",
  "INV-BL-002":
    "Comprobar que el expedidor del documento de transporte coincide con el vendedor de la factura.",
  "INV-BL-003":
    "Comprobar que el consignatario del documento de transporte coincide con el de la factura.",
  "INV-BL-010":
    "Verificar con el transportista el número de bultos declarado en el documento de transporte.",
  "INV-BL-011":
    "Verificar con el transportista el peso bruto declarado en el documento de transporte.",
  "INV-BL-012":
    "Verificar el Incoterm declarado en el documento de transporte y comprobar que coincide con el de la factura.",

  // Packing vs documento de transporte
  "PL-BL-001":
    "El packing list y el documento de transporte deben coincidir en el número de bultos. Verificar con el proveedor y el transportista.",
  "PL-BL-002":
    "El packing list y el documento de transporte deben coincidir en el peso bruto. Verificar con el proveedor y el transportista.",
  "PL-BL-003":
    "Unificar el tipo de bultos declarado entre packing list y documento de transporte.",
  "TRANS-001":
    "Verificar con el transitario o transportista que el destino del envío es el correcto. Un destino equivocado puede generar retenciones, reenvíos y costes adicionales.",

  // Campos obligatorios
  "GEN-070":
    "Añadir el campo obligatorio al documento antes del despacho.",
};

/** TRANS-001: El puerto/aeropuerto de descarga coincide con el país del consignatario. Detecta errores donde el destino logístico no coincide con el país o ciudad del consignatario de la operación. */
function reglaTRANS_001(
  factura: FacturaComercial,
  packing: PackingList,
  transporte: DocumentoTransporte
): Validacion {
  const ciudadConsignatario =
    factura.consignatario.ciudad.valor ||
    packing.consignatario.ciudad.valor ||
    factura.comprador.ciudad.valor ||
    packing.destinatario.ciudad.valor;

  const ciudadDescarga = transporte.ciudad_descarga.valor;

  if (!ciudadConsignatario || !ciudadDescarga) {
    return crearValidacion(
      "TRANS-001",
      "La ciudad de destino del documento de transporte no coincide con la ciudad del consignatario",
      "no_comprobable",
      "alta",
      ["documento_transporte"],
      ["ciudad_descarga", "consignatario.ciudad"],
      {
        ciudad_consignatario: ciudadConsignatario,
        ciudad_descarga: ciudadDescarga,
      },
      "No se puede comprobar porque falta la ciudad del consignatario o la ciudad de descarga."
    );
  }

  const coincide = textosEquivalentes(ciudadConsignatario, ciudadDescarga);

  return crearValidacion(
    "TRANS-001",
    "La ciudad de destino del documento de transporte coincide con la ciudad del consignatario",
    coincide ? "ok" : "discrepancia",
    "alta",
    ["factura_comercial", "documento_transporte"],
    ["ciudad_descarga", "consignatario.ciudad"],
    {
      ciudad_consignatario: ciudadConsignatario,
      ciudad_descarga: ciudadDescarga,
    },
    coincide
      ? ""
      : `El consignatario está en "${ciudadConsignatario}", pero el destino del envío es "${ciudadDescarga}". Verificar que el envío va a la ciudad correcta.`
  );
}

/**
 * INV-070: Si el Incoterm incluye flete y/o seguro (CIF, CIP, CFR, CPT),
 * la factura debe desglosar el valor de la mercancía y los cargos.
 *
 * La aduana necesita ver el desglose FOB + flete + seguro para
 * verificar la valoración aduanera.
 */
function reglaINV_070(factura: FacturaComercial): Validacion {
  const incotermRaw = factura.incoterm.codigo.valor;
  const incoterm = incotermRaw ? incotermRaw.toUpperCase().trim() : null;

  if (!incoterm) {
    return crearValidacion(
      "INV-070",
      "Desglose de valoración según Incoterm",
      "no_comprobable",
      "media",
      ["factura_comercial"],
      ["incoterm.codigo"],
      { incoterm: null },
      "No se puede comprobar porque la factura no tiene Incoterm."
    );
  }

  // Incoterms que incluyen flete obligatoriamente
  const incotermsConFlete = ["CIF", "CIP", "CFR", "CPT"];
  // Incoterms que incluyen seguro obligatoriamente
  const incotermsConSeguro = ["CIF", "CIP"];

  // Si el Incoterm no incluye flete, no hay nada que comprobar
  if (!incotermsConFlete.includes(incoterm)) {
    return crearValidacion(
      "INV-070",
      "Desglose de valoración según Incoterm",
      "ok",
      "media",
      ["factura_comercial"],
      ["incoterm.codigo"],
      { incoterm },
      ""
    );
  }

  const transporte = factura.valoracion.transporte.importe;
  const seguro = factura.valoracion.seguro.importe;
  const requiereSeguro = incotermsConSeguro.includes(incoterm);

  const faltaTransporte = transporte === null;
  const faltaSeguro = requiereSeguro && seguro === null;

  if (!faltaTransporte && !faltaSeguro) {
    return crearValidacion(
      "INV-070",
      "Desglose de valoración según Incoterm",
      "ok",
      "alta",
      ["factura_comercial"],
      ["incoterm.codigo", "valoracion.transporte", "valoracion.seguro"],
      { incoterm, transporte, seguro },
      ""
    );
  }

  const faltantes: string[] = [];
  if (faltaTransporte) faltantes.push("el valor del flete");
  if (faltaSeguro) faltantes.push("el valor del seguro");

  return crearValidacion(
    "INV-070",
    "Desglose de valoración según Incoterm",
    "discrepancia",
    "alta",
    ["factura_comercial"],
    ["incoterm.codigo", "valoracion.transporte", "valoracion.seguro"],
    { incoterm, transporte, seguro },
    `El Incoterm ${incoterm} incluye flete${requiereSeguro ? " y seguro" : ""} en el precio, pero la factura no desglosa ${faltantes.join(" ni ")}. La aduana necesita ver el desglose de valoración para verificar el valor declarado.`
  );
}

// Orquestador

export function ejecutarReglas(
  factura: FacturaComercial,
  packing: PackingList,
  transporte?: DocumentoTransporte | null
): ResultadoMotor {
  const validaciones: Validacion[] = [];
  const descripciones_a_evaluar: ResultadoMotor["descripciones_a_evaluar"] = [];

  // Reglas factura ↔ packing
  validaciones.push(reglaINV_PL_001(factura, packing));

  const inv020 = reglaINV_020(factura);
  validaciones.push(...inv020.validaciones);
  descripciones_a_evaluar.push(...inv020.descripciones_a_evaluar);

  validaciones.push(reglaINV_PL_002(factura, packing));
  validaciones.push(reglaINV_PL_003(factura, packing));
  validaciones.push(reglaINV_PL_004(factura, packing));
  validaciones.push(reglaINV_PL_005(factura, packing));
  validaciones.push(reglaINV_PL_010(factura, packing));
  validaciones.push(reglaINV_PL_011(factura, packing));
  validaciones.push(reglaINV_PL_013(factura, packing));
  validaciones.push(reglaINV_PL_030(factura, packing));
  validaciones.push(reglaINV_PL_031(factura, packing));
  validaciones.push(reglaINV_PL_040(factura, packing));
  validaciones.push(reglaINV_PL_041(factura, packing));
  validaciones.push(...reglaINV_PL_042(factura, packing));
  validaciones.push(reglaINV_050(factura));
  validaciones.push(reglaINV_051(factura));
  validaciones.push(reglaINV_070(factura));
  validaciones.push(reglaINV_PL_052(factura, packing));
  validaciones.push(reglaINV_PL_061(factura, packing));
  validaciones.push(...reglaGEN_070(factura, packing));

  // Reglas con documento de transporte (solo si existe)
  if (transporte) {
    validaciones.push(reglaINV_BL_001(factura, transporte));
    validaciones.push(reglaINV_BL_002(factura, transporte));
    validaciones.push(reglaINV_BL_003(factura, transporte));
    validaciones.push(reglaINV_BL_010(factura, transporte));
    validaciones.push(reglaINV_BL_011(factura, transporte));
    validaciones.push(reglaINV_BL_012(factura, transporte));
    validaciones.push(reglaPL_BL_001(packing, transporte));
    validaciones.push(reglaPL_BL_002(packing, transporte));
    validaciones.push(reglaPL_BL_003(packing, transporte));
    validaciones.push(reglaTRANS_001(factura, packing, transporte));
  }

  const advertencias = reglaGEN_071(factura, packing);

  // Enriquecer con acciones sugeridas
  for (const v of validaciones) {
    if (v.resultado === "discrepancia") {
      v.accion_sugerida = ACCIONES_SUGERIDAS[v.regla] ?? "";
    }
  }

  return { validaciones, advertencias, descripciones_a_evaluar };
}