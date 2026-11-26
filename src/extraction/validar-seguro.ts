
import type {
  CampoLogistico,
} from "@/types/auditoria-logistica";

import type {
  DocumentoSeguroTransporte,
  TipoClausulaSeguro,
  TipoTransporteSeguro,
} from "@/types/seguro-transporte";

// -----------------------------------------------------------------------------
// Resultado de validación
// -----------------------------------------------------------------------------

export interface ResultadoValidacionSeguro {
  valido: boolean;
  documento: DocumentoSeguroTransporte | null;
  errores: string[];
}

// -----------------------------------------------------------------------------
// Validadores básicos
// -----------------------------------------------------------------------------

const CONFIANZAS = ["alta", "media", "baja"] as const;

const ESTADOS = [
  "extraido",
  "no_localizado",
  "ilegible",
  "ambiguo",
  "no_aplicable",
] as const;

function esObjeto(
  valor: unknown
): valor is Record<string, unknown> {
  return (
    typeof valor === "object" &&
    valor !== null &&
    !Array.isArray(valor)
  );
}

function esTexto(valor: unknown): valor is string {
  return typeof valor === "string";
}

function esTextoNoVacio(valor: unknown): boolean {
  return typeof valor === "string" && valor.trim().length > 0;
}

function esDecimalTexto(valor: unknown): valor is string {
  if (typeof valor !== "string") return false;

  const texto = valor.trim();

  // Aceptamos únicamente una representación decimal sencilla.
  // La normalización monetaria se realizará en el comparador.
  return /^-?\d+(?:[.,]\d+)?$/.test(texto);
}

function esClausula(
  valor: unknown
): valor is TipoClausulaSeguro {
  return [
    "A",
    "B",
    "C",
    "otra",
    "no_identificada",
  ].includes(valor as string);
}

function esTipoTransporte(
  valor: unknown
): valor is TipoTransporteSeguro {
  return [
    "maritimo",
    "aereo",
    "terrestre",
    "multimodal",
    "otro",
    "no_identificado",
  ].includes(valor as string);
}

// -----------------------------------------------------------------------------
// Validación de CampoLogistico
// -----------------------------------------------------------------------------

function validarCampo<T>(
  valor: unknown,
  validarValor: (valor: unknown) => valor is T
): CampoLogistico<T> | null {
  if (!esObjeto(valor)) return null;

  const campo = valor;

  if (
    !("valor" in campo) ||
    !("texto_original" in campo) ||
    !("pagina" in campo) ||
    !("ubicacion" in campo) ||
    !("confianza" in campo) ||
    !("estado" in campo) ||
    !("nota" in campo)
  ) {
    return null;
  }

  if (
    campo.valor !== null &&
    !validarValor(campo.valor)
  ) {
    return null;
  }

  if (
    !esTexto(campo.texto_original) ||
    !esTexto(campo.ubicacion) ||
    !esTexto(campo.nota)
  ) {
    return null;
  }

  if (
    campo.pagina !== null &&
    (
      typeof campo.pagina !== "number" ||
      !Number.isInteger(campo.pagina) ||
      campo.pagina < 1
    )
  ) {
    return null;
  }

  if (
    !CONFIANZAS.includes(
      campo.confianza as (typeof CONFIANZAS)[number]
    )
  ) {
    return null;
  }

  if (
    !ESTADOS.includes(
      campo.estado as (typeof ESTADOS)[number]
    )
  ) {
    return null;
  }

  if (
    campo.estado === "extraido" &&
    campo.valor === null
  ) {
    return null;
  }

  return campo as unknown as CampoLogistico<T>;
}

function validarCampoTexto(
  valor: unknown
): CampoLogistico<string> | null {
  return validarCampo(valor, esTexto);
}

function validarCampoDecimal(
  valor: unknown
): CampoLogistico<string> | null {
  return validarCampo(valor, esDecimalTexto);
}

function validarCampoClausula(
  valor: unknown
): CampoLogistico<TipoClausulaSeguro> | null {
  return validarCampo(valor, esClausula);
}

function validarCampoTipoTransporte(
  valor: unknown
): CampoLogistico<TipoTransporteSeguro> | null {
  return validarCampo(valor, esTipoTransporte);
}

function validarListaCamposTexto(
  valor: unknown
): CampoLogistico<string>[] | null {
  if (!Array.isArray(valor)) return null;

  const resultado: CampoLogistico<string>[] = [];

  for (const elemento of valor) {
    const campo = validarCampoTexto(elemento);

    if (!campo) return null;

    resultado.push(campo);
  }

  return resultado;
}

// -----------------------------------------------------------------------------
// Parser y validador principal
// -----------------------------------------------------------------------------

export function validarDocumentoSeguro(
  texto: string
): ResultadoValidacionSeguro {
  const errores: string[] = [];

  let json: unknown;

  try {
    // Permite respuestas que accidentalmente vienen envueltas
    // en un bloque Markdown JSON.
    const textoLimpio = texto
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");

    json = JSON.parse(textoLimpio);
  } catch {
    return {
      valido: false,
      documento: null,
      errores: ["La respuesta no contiene un JSON válido."],
    };
  }

  if (!esObjeto(json)) {
    return {
      valido: false,
      documento: null,
      errores: ["La raíz del JSON debe ser un objeto."],
    };
  }

  const root = json;

  if (root.schema_version !== "1.0") {
    errores.push("schema_version debe ser '1.0'.");
  }

  function campoTexto(
    nombre: string
  ): CampoLogistico<string> | null {
    const campo = validarCampoTexto(root[nombre]);

    if (!campo) {
      errores.push(`Campo inválido o ausente: ${nombre}.`);
    }

    return campo;
  }

  function campoDecimal(
    nombre: string
  ): CampoLogistico<string> | null {
    const campo = validarCampoDecimal(root[nombre]);

    if (!campo) {
      errores.push(`Campo decimal inválido o ausente: ${nombre}.`);
    }

    return campo;
  }

  function campoEnum<T>(
    nombre: string,
    validar: (valor: unknown) => valor is T
  ): CampoLogistico<T> | null {
    const campo = validarCampo(root[nombre], validar);

    if (!campo) {
      errores.push(`Campo enumerado inválido o ausente: ${nombre}.`);
    }

    return campo;
  }

  function listaTexto(
    nombre: string
  ): CampoLogistico<string>[] | null {
    const lista = validarListaCamposTexto(root[nombre]);

    if (!lista) {
      errores.push(`Lista inválida o ausente: ${nombre}.`);
    }

    return lista;
  }

  // Campos principales.
  const tipoDocumento = campoEnum(
    "tipo_documento",
    (
      valor
    ): valor is
      | "certificado_seguro"
      | "poliza"
      | "otro"
      | "indeterminado" =>
      [
        "certificado_seguro",
        "poliza",
        "otro",
        "indeterminado",
      ].includes(valor as string)
  );

  const aseguradora = campoTexto("aseguradora");
  const tomador = campoTexto("tomador");
  const asegurado = campoTexto("asegurado");

  const numeroPoliza = campoTexto("numero_poliza");
  const numeroCertificado = campoTexto("numero_certificado");

  const fechaEmision = campoTexto("fecha_emision");
  const fechaInicio = campoTexto("fecha_inicio_cobertura");
  const fechaFin = campoTexto("fecha_fin_cobertura");

  const referenciaFactura = campoTexto("referencia_factura");
  const referenciaEmbarque = campoTexto("referencia_embarque");

  const referenciasOperacion = listaTexto("referencias_operacion");

  const descripcionMercancia = campoTexto("descripcion_mercancia");

  const valorAsegurado = campoDecimal("valor_asegurado");
  const moneda = campoTexto("moneda");

  const incoterm = campoTexto("incoterm");

  const tipoTransporte = campoEnum(
    "tipo_transporte",
    esTipoTransporte
  );

  const clausula = campoEnum(
    "clausula",
    esClausula
  );

  const riesgosCubiertos = listaTexto("riesgos_cubiertos");
  const riesgosExcluidos = listaTexto("riesgos_excluidos");

  const franquicia = campoTexto("franquicia");
  const condicionesEspeciales = listaTexto("condiciones_especiales");

  // Ruta.
  let origen: CampoLogistico<string> | null = null;
  let destino: CampoLogistico<string> | null = null;

  if (!esObjeto(root.ruta)) {
    errores.push("El campo ruta debe ser un objeto.");
  } else {
    origen = validarCampoTexto(root.ruta.origen);
    destino = validarCampoTexto(root.ruta.destino);

    if (!origen) {
      errores.push("Campo inválido o ausente: ruta.origen.");
    }

    if (!destino) {
      errores.push("Campo inválido o ausente: ruta.destino.");
    }
  }

  // Advertencias.
  let advertencias: string[] = [];

  if (!Array.isArray(root.advertencias)) {
    errores.push("advertencias debe ser una lista.");
  } else if (!root.advertencias.every(esTexto)) {
    errores.push("advertencias solo puede contener texto.");
  } else {
    advertencias = root.advertencias;
  }

  // Si hay errores estructurales, no devolvemos un documento parcial.
  if (
    errores.length > 0 ||
    !tipoDocumento ||
    !aseguradora ||
    !tomador ||
    !asegurado ||
    !numeroPoliza ||
    !numeroCertificado ||
    !fechaEmision ||
    !fechaInicio ||
    !fechaFin ||
    !referenciaFactura ||
    !referenciaEmbarque ||
    !referenciasOperacion ||
    !descripcionMercancia ||
    !valorAsegurado ||
    !moneda ||
    !incoterm ||
    !tipoTransporte ||
    !clausula ||
    !riesgosCubiertos ||
    !riesgosExcluidos ||
    !franquicia ||
    !condicionesEspeciales ||
    !origen ||
    !destino
  ) {
    return {
      valido: false,
      documento: null,
      errores,
    };
  }

  const documento: DocumentoSeguroTransporte = {
    schema_version: "1.0",

    tipo_documento: tipoDocumento,

    aseguradora,
    tomador,
    asegurado,

    numero_poliza: numeroPoliza,
    numero_certificado: numeroCertificado,

    fecha_emision: fechaEmision,
    fecha_inicio_cobertura: fechaInicio,
    fecha_fin_cobertura: fechaFin,

    referencia_factura: referenciaFactura,
    referencia_embarque: referenciaEmbarque,
    referencias_operacion: referenciasOperacion,

    descripcion_mercancia: descripcionMercancia,

    valor_asegurado: valorAsegurado,
    moneda,

    incoterm,

    tipo_transporte: tipoTransporte,

    ruta: {
      origen,
      destino,
    },

    clausula,

    riesgos_cubiertos: riesgosCubiertos,
    riesgos_excluidos: riesgosExcluidos,

    franquicia,
    condiciones_especiales: condicionesEspeciales,

    advertencias,
  };

  return {
    valido: true,
    documento,
    errores: [],
  };
}
