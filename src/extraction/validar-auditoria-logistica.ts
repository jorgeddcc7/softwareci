import type {
  DocumentoCostesLogisticos,
  TipoDocumentoLogistico,
} from "@/types/auditoria-logistica";

type ValidadorValor = (valor: unknown) => boolean;

const DECIMAL_REGEX = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return (
    typeof valor === "object" &&
    valor !== null &&
    !Array.isArray(valor)
  );
}

function exigir(condicion: boolean, ruta: string): asserts condicion {
  if (!condicion) {
    throw new Error(`Extracción logística incompatible en ${ruta}.`);
  }
}

function objetoConClaves(
  valor: unknown,
  claves: string[],
  ruta: string
): Record<string, unknown> {
  exigir(esObjeto(valor), ruta);

  exigir(
    Object.keys(valor).length === claves.length &&
      claves.every((clave) =>
        Object.prototype.hasOwnProperty.call(valor, clave)
      ),
    ruta
  );

  return valor;
}

const esTexto: ValidadorValor = (valor) =>
  typeof valor === "string" && valor.trim().length > 0;

function limpiarDecimal(valor: string | number): string | null {
  if (typeof valor === "number") return valor.toString();
  if (typeof valor !== "string") return null;

  // Elimina todo lo que no sea número, punto, coma o guion
  let limpio = valor.replace(/[^\d.,-]/g, "");
  
  // Si tiene tanto punto como coma, asumimos que la coma es de miles (ej: 1,195.00)
  if (limpio.includes(".") && limpio.includes(",")) {
    limpio = limpio.replace(/,/g, "");
  } else if (limpio.includes(",")) {
    // Si solo tiene comas, asumimos que es el separador decimal (ej: 1195,00)
    limpio = limpio.replace(/,/g, ".");
  }
  
  return limpio;
}

const esDecimal: ValidadorValor = (valor) => {
  if (typeof valor === "number") return true;
  if (typeof valor !== "string") return false;
  const limpio = limpiarDecimal(valor);
  return limpio !== null && DECIMAL_REGEX.test(limpio);
};

const esMoneda: ValidadorValor = (valor) =>
  typeof valor === "string" && /^[A-Z]{3}$/.test(valor);

const esTratamiento: ValidadorValor = (valor) =>
  valor === "incluidos" ||
  valor === "excluidos" ||
  valor === "no_indicado";

const esTipoDocumento: ValidadorValor = (valor) =>
  valor === "presupuesto" ||
  valor === "factura_logistica" ||
  valor === "otro" ||
  valor === "indeterminado";

const esFecha: ValidadorValor = (valor) => {
  if (
    typeof valor !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(valor)
  ) {
    return false;
  }

  const fecha = new Date(`${valor}T00:00:00.000Z`);

  return (
    !Number.isNaN(fecha.getTime()) &&
    fecha.toISOString().slice(0, 10) === valor
  );
};

function validarCampo(
  valor: unknown,
  validarValor: ValidadorValor,
  ruta: string
): void {
  const campo = objetoConClaves(
    valor,
    [
      "valor",
      "texto_original",
      "pagina",
      "ubicacion",
      "confianza",
      "estado",
      "nota",
    ],
    ruta
  );
  // Normalizador automático para decimales
  if (campo.valor !== null && validarValor === esDecimal) {
    const limpio = limpiarDecimal(campo.valor as string | number);
    if (limpio) {
      campo.valor = limpio;
    }
  }
  exigir(campo.valor === null || validarValor(campo.valor), `${ruta}.valor`);
  exigir(typeof campo.texto_original === "string", `${ruta}.texto_original`);

  exigir(
    campo.pagina === null ||
      (typeof campo.pagina === "number" &&
        Number.isInteger(campo.pagina) &&
        campo.pagina >= 1),
    `${ruta}.pagina`
  );

  exigir(typeof campo.ubicacion === "string", `${ruta}.ubicacion`);
  exigir(
    campo.confianza === "alta" ||
      campo.confianza === "media" ||
      campo.confianza === "baja",
    `${ruta}.confianza`
  );

  exigir(
    campo.estado === "extraido" ||
      campo.estado === "no_localizado" ||
      campo.estado === "ilegible" ||
      campo.estado === "ambiguo" ||
      campo.estado === "no_aplicable",
    `${ruta}.estado`
  );

  exigir(typeof campo.nota === "string", `${ruta}.nota`);

  exigir(
    campo.estado === "extraido"
      ? campo.valor !== null
      : campo.valor === null,
    `${ruta}.estado_valor`
  );

  if (campo.estado === "extraido" && campo.valor !== "no_indicado") {
    exigir(
      (campo.texto_original as string).trim().length > 0,
      `${ruta}.evidencia`
    );
  }
}

function validarLista(
  valor: unknown,
  ruta: string,
  validarElemento: (elemento: unknown, ruta: string) => void
): void {
  exigir(Array.isArray(valor), ruta);

  valor.forEach((elemento, indice) => {
    validarElemento(elemento, `${ruta}[${indice}]`);
  });
}

function validarLinea(valor: unknown, ruta: string): void {
  const linea = objetoConClaves(
    valor,
    [
      "descripcion",
      "cantidad",
      "unidad",
      "precio_unitario",
      "importe",
      "moneda",
      "tratamiento_impuestos",
    ],
    ruta
  );

  validarCampo(linea.descripcion, esTexto, `${ruta}.descripcion`);
  validarCampo(linea.cantidad, esDecimal, `${ruta}.cantidad`);
  validarCampo(linea.unidad, esTexto, `${ruta}.unidad`);
  validarCampo(linea.precio_unitario, esDecimal, `${ruta}.precio_unitario`);
  validarCampo(linea.importe, esDecimal, `${ruta}.importe`);
  validarCampo(linea.moneda, esMoneda, `${ruta}.moneda`);
  validarCampo(linea.tratamiento_impuestos, esTratamiento, `${ruta}.tratamiento_impuestos`);
}

function validarImpuesto(valor: unknown, ruta: string): void {
  const impuesto = objetoConClaves(
    valor,
    ["descripcion", "porcentaje", "base", "importe", "moneda"],
    ruta
  );

  validarCampo(impuesto.descripcion, esTexto, `${ruta}.descripcion`);
  validarCampo(impuesto.porcentaje, esDecimal, `${ruta}.porcentaje`);
  validarCampo(impuesto.base, esDecimal, `${ruta}.base`);
  validarCampo(impuesto.importe, esDecimal, `${ruta}.importe`);
  validarCampo(impuesto.moneda, esMoneda, `${ruta}.moneda`);
}

function validarDocumento(
  valor: unknown
): asserts valor is DocumentoCostesLogisticos {
  const doc = objetoConClaves(
    valor,
    [
      "schema_version",
      "tipo_detectado",
      "proveedor",
      "cliente",
      "numero_documento",
      "referencias_operacion",
      "fecha_emision",
      "moneda_documento",
      "lineas",
      "condiciones",
      "totales",
      "advertencias",
    ],
    "documento"
  );

  exigir(doc.schema_version === "1.0", "schema_version");
  validarCampo(doc.tipo_detectado, esTipoDocumento, "tipo_detectado");
  validarCampo(doc.proveedor, esTexto, "proveedor");
  validarCampo(doc.cliente, esTexto, "cliente");
  validarCampo(doc.numero_documento, esTexto, "numero_documento");
  validarCampo(doc.fecha_emision, esFecha, "fecha_emision");
  validarCampo(doc.moneda_documento, esMoneda, "moneda_documento");

  validarLista(doc.referencias_operacion, "referencias_operacion", (campo, ruta) =>
    validarCampo(campo, esTexto, ruta)
  );

  validarLista(doc.lineas, "lineas", validarLinea);

  validarLista(doc.condiciones, "condiciones", (campo, ruta) =>
    validarCampo(campo, esTexto, ruta)
  );

  const totales = objetoConClaves(
    doc.totales,
    ["subtotal", "impuestos", "total", "tratamiento_impuestos"],
    "totales"
  );

  validarCampo(totales.subtotal, esDecimal, "totales.subtotal");
  validarCampo(totales.total, esDecimal, "totales.total");
  validarCampo(totales.tratamiento_impuestos, esTratamiento, "totales.tratamiento_impuestos");

  validarLista(totales.impuestos, "totales.impuestos", validarImpuesto);

  exigir(
    Array.isArray(doc.advertencias) &&
      doc.advertencias.every((advertencia) => typeof advertencia === "string"),
    "advertencias"
  );
}

export function parsearDocumentoLogistico(
  texto: string,
  tipoEsperado: TipoDocumentoLogistico
): DocumentoCostesLogisticos {
  const limpio = texto
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  let resultado: unknown;

  try {
    resultado = JSON.parse(limpio);
  } catch {
    throw new Error("La extracción logística no devolvió un JSON válido.");
  }

  validarDocumento(resultado);

  if (
    resultado.tipo_detectado.estado !== "extraido" ||
    resultado.tipo_detectado.valor !== tipoEsperado
  ) {
    throw new Error(`No se ha identificado el documento como ${tipoEsperado}.`);
  }

  if (resultado.lineas.length === 0) {
    throw new Error("No se han recuperado líneas de coste. Se requiere revisión del documento.");
  }

  return resultado;
}