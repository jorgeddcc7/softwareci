// ============================================================
// Normalización de JSON extraído
// ============================================================
//
// Asegura que el JSON extraído (por Gemini o OpenRouter) tiene
// la estructura exacta que espera el motor de reglas, rellenando
// los campos que falten con valores por defecto.
//
// Motivo: distintos modelos pueden devolver estructuras ligeramente
// distintas. Esta capa de normalización evita errores en el motor.
// ============================================================

/**
 * Crea un CampoTexto vacío (con estado "no_localizado").
 */
function campoTextoVacio(): any {
  return {
    valor: null,
    confianza: "alta",
    fuente: "",
    nota: "",
    estado: "no_localizado",
  };
}

/**
 * Crea un CampoNumero vacío.
 */
function campoNumeroVacio(): any {
  return {
    valor: null,
    confianza: "alta",
    fuente: "",
    nota: "",
    estado: "no_localizado",
  };
}

/**
 * Crea un CampoImporte vacío.
 */
function campoImporteVacio(): any {
  return {
    importe: null,
    moneda: null,
    importe_original: "",
    confianza: "alta",
    fuente: "",
    nota: "",
    estado: "no_localizado",
  };
}

/**
 * Crea un CampoMagnitud vacío.
 */
function campoMagnitudVacio(): any {
  return {
    valor: null,
    unidad: null,
    valor_original: "",
    valor_normalizado: null,
    unidad_normalizada: null,
    confianza: "alta",
    fuente: "",
    nota: "",
    estado: "no_localizado",
  };
}

/**
 * Crea una Parte vacía.
 */
function parteVacia(): any {
  return {
    nombre_legal: campoTextoVacio(),
    direccion_completa: campoTextoVacio(),
    ciudad: campoTextoVacio(),
    pais: campoTextoVacio(),
  };
}

/**
 * Crea una Valoracion vacía.
 */
function valoracionVacia(): any {
  return {
    subtotal_mercancia: campoImporteVacio(),
    descuentos: campoImporteVacio(),
    gastos_embalaje: campoImporteVacio(),
    transporte: campoImporteVacio(),
    seguro: campoImporteVacio(),
    total_facturado: campoImporteVacio(),
  };
}

/**
 * Crea unos TotalesFisicos vacíos.
 */
function totalesFisicosVacios(): any {
  return {
    peso_neto: campoMagnitudVacio(),
    peso_bruto: campoMagnitudVacio(),
    numero_bultos: campoNumeroVacio(),
    tipo_bultos: campoTextoVacio(),
  };
}

/**
 * Crea un Incoterm vacío.
 */
function incotermVacio(): any {
  return {
    codigo: campoTextoVacio(),
    lugar_designado: campoTextoVacio(),
    version: campoTextoVacio(),
  };
}

/**
 * Asegura que un campo existe. Si es null/undefined, devuelve el valor por defecto.
 */
function asegurarCampo(campo: any, valorPorDefecto: any): any {
  if (campo === null || campo === undefined) return valorPorDefecto;
  return campo;
}

/**
 * Normaliza una línea de factura.
 */
function normalizarLinea(linea: any): any {
  return {
    numero_linea: asegurarCampo(linea?.numero_linea, campoNumeroVacio()),
    descripcion_comercial: asegurarCampo(
      linea?.descripcion_comercial,
      campoTextoVacio()
    ),
    codigo_hs: asegurarCampo(linea?.codigo_hs, campoTextoVacio()),
    pais_origen: asegurarCampo(linea?.pais_origen, campoTextoVacio()),
    cantidad: asegurarCampo(linea?.cantidad, campoMagnitudVacio()),
    unidad_comercial: asegurarCampo(linea?.unidad_comercial, campoTextoVacio()),
    precio_unitario: asegurarCampo(linea?.precio_unitario, campoImporteVacio()),
    valor_linea: asegurarCampo(linea?.valor_linea, campoImporteVacio()),
    peso_neto: asegurarCampo(linea?.peso_neto, campoMagnitudVacio()),
    peso_bruto: asegurarCampo(linea?.peso_bruto, campoMagnitudVacio()),
  };
}

/**
 * Normaliza una factura.
 */
export function normalizarFactura(factura: any): any {
  return {
    tipo_documento: "factura_comercial",
    es_proforma: asegurarCampo(factura?.es_proforma, campoTextoVacio()),
    pais_origen_global: asegurarCampo(
      factura?.pais_origen_global,
      campoTextoVacio()
    ),
    numero_factura: asegurarCampo(factura?.numero_factura, campoTextoVacio()),
    fecha_emision: asegurarCampo(factura?.fecha_emision, campoTextoVacio()),
    vendedor: asegurarCampo(factura?.vendedor, parteVacia()),
    comprador: asegurarCampo(factura?.comprador, parteVacia()),
    importador: asegurarCampo(factura?.importador, parteVacia()),
    consignatario: asegurarCampo(factura?.consignatario, parteVacia()),
    incoterm: asegurarCampo(factura?.incoterm, incotermVacio()),
    moneda: asegurarCampo(factura?.moneda, campoTextoVacio()),
    condiciones_pago: asegurarCampo(
      factura?.condiciones_pago,
      campoTextoVacio()
    ),
    valoracion: asegurarCampo(factura?.valoracion, valoracionVacia()),
    totales_fisicos: asegurarCampo(
      factura?.totales_fisicos,
      totalesFisicosVacios()
    ),
    descripcion_global: asegurarCampo(
      factura?.descripcion_global,
      campoTextoVacio()
    ),
    cantidad_global: asegurarCampo(
      factura?.cantidad_global,
      campoMagnitudVacio()
    ),
    lineas: Array.isArray(factura?.lineas)
      ? factura.lineas.map(normalizarLinea)
      : [],
  };
}

/**
 * Normaliza un bulto de packing list.
 */
function normalizarBulto(bulto: any): any {
  return {
    numero_bulto: asegurarCampo(bulto?.numero_bulto, campoTextoVacio()),
    identificador_bulto: asegurarCampo(
      bulto?.identificador_bulto,
      campoTextoVacio()
    ),
    tipo: asegurarCampo(bulto?.tipo, campoTextoVacio()),
    cantidad: asegurarCampo(bulto?.cantidad, campoNumeroVacio()),
    peso_neto: asegurarCampo(bulto?.peso_neto, campoMagnitudVacio()),
    peso_bruto: asegurarCampo(bulto?.peso_bruto, campoMagnitudVacio()),
    lineas_contenidas: Array.isArray(bulto?.lineas_contenidas)
      ? bulto.lineas_contenidas.map((lc: any) => ({
          descripcion: asegurarCampo(lc?.descripcion, campoTextoVacio()),
          cantidad: asegurarCampo(lc?.cantidad, campoMagnitudVacio()),
        }))
      : [],
  };
}

/**
 * Normaliza un packing list.
 */
export function normalizarPacking(packing: any): any {
  return {
    tipo_documento: "packing_list",
    numero_documento: asegurarCampo(
      packing?.numero_documento,
      campoTextoVacio()
    ),
    fecha_emision: asegurarCampo(packing?.fecha_emision, campoTextoVacio()),
    numero_factura_referencia: asegurarCampo(
      packing?.numero_factura_referencia,
      campoTextoVacio()
    ),
    expedidor: asegurarCampo(packing?.expedidor, parteVacia()),
    destinatario: asegurarCampo(packing?.destinatario, parteVacia()),
    consignatario: asegurarCampo(packing?.consignatario, parteVacia()),
    totales: {
      numero_bultos: asegurarCampo(
        packing?.totales?.numero_bultos,
        campoNumeroVacio()
      ),
      tipo_bultos: asegurarCampo(
        packing?.totales?.tipo_bultos,
        campoTextoVacio()
      ),
      peso_neto: asegurarCampo(
        packing?.totales?.peso_neto,
        campoMagnitudVacio()
      ),
      peso_bruto: asegurarCampo(
        packing?.totales?.peso_bruto,
        campoMagnitudVacio()
      ),
      tara: asegurarCampo(packing?.totales?.tara, campoMagnitudVacio()),
    },
    bultos: Array.isArray(packing?.bultos)
      ? packing.bultos.map(normalizarBulto)
      : [],
  };
}

/**
 * Normaliza un contenedor.
 */
function normalizarContenedor(cont: any): any {
  return {
    numero_contenedor: asegurarCampo(
      cont?.numero_contenedor,
      campoTextoVacio()
    ),
    tipo_tamano: asegurarCampo(cont?.tipo_tamano, campoTextoVacio()),
    numero_precinto: asegurarCampo(cont?.numero_precinto, campoTextoVacio()),
    numero_bultos: asegurarCampo(cont?.numero_bultos, campoNumeroVacio()),
    peso_bruto: asegurarCampo(cont?.peso_bruto, campoMagnitudVacio()),
    vgm: asegurarCampo(cont?.vgm, campoMagnitudVacio()),
  };
}

/**
 * Normaliza un documento de transporte.
 * Devuelve null si el transporte es null.
 */
export function normalizarTransporte(transporte: any): any {
  if (!transporte) return null;

  return {
    tipo_documento: transporte.tipo_documento || "bill_of_lading",
    numero_documento: asegurarCampo(
      transporte?.numero_documento,
      campoTextoVacio()
    ),
    tipo_bl: asegurarCampo(transporte?.tipo_bl, campoTextoVacio()),
    fecha_emision: asegurarCampo(transporte?.fecha_emision, campoTextoVacio()),
    fecha_carga: asegurarCampo(transporte?.fecha_carga, campoTextoVacio()),
    transportista: asegurarCampo(transporte?.transportista, parteVacia()),
    expedidor: asegurarCampo(transporte?.expedidor, parteVacia()),
    consignatario: asegurarCampo(transporte?.consignatario, parteVacia()),
    notify_party: asegurarCampo(transporte?.notify_party, parteVacia()),
    puerto_carga: asegurarCampo(transporte?.puerto_carga, campoTextoVacio()),
    puerto_descarga: asegurarCampo(
      transporte?.puerto_descarga,
      campoTextoVacio()
    ),
    ciudad_carga: asegurarCampo(transporte?.ciudad_carga, campoTextoVacio()),
    ciudad_descarga: asegurarCampo(
      transporte?.ciudad_descarga,
      campoTextoVacio()
    ),
    lugar_entrega: asegurarCampo(transporte?.lugar_entrega, campoTextoVacio()),
    nombre_buque: asegurarCampo(transporte?.nombre_buque, campoTextoVacio()),
    numero_viaje: asegurarCampo(transporte?.numero_viaje, campoTextoVacio()),
    aerolinea: asegurarCampo(transporte?.aerolinea, campoTextoVacio()),
    numero_vuelo: asegurarCampo(transporte?.numero_vuelo, campoTextoVacio()),
    fecha_vuelo: asegurarCampo(transporte?.fecha_vuelo, campoTextoVacio()),
    peso_cobrable: asegurarCampo(
      transporte?.peso_cobrable,
      campoMagnitudVacio()
    ),
    matricula_vehiculo: asegurarCampo(
      transporte?.matricula_vehiculo,
      campoTextoVacio()
    ),
    nombre_transportista_carretera: asegurarCampo(
      transporte?.nombre_transportista_carretera,
      campoTextoVacio()
    ),
    numero_factura_referencia: asegurarCampo(
      transporte?.numero_factura_referencia,
      campoTextoVacio()
    ),
    numero_pedido_referencia: asegurarCampo(
      transporte?.numero_pedido_referencia,
      campoTextoVacio()
    ),
    numero_reserva: asegurarCampo(transporte?.numero_reserva, campoTextoVacio()),
    carga: {
      descripcion: asegurarCampo(
        transporte?.carga?.descripcion,
        campoTextoVacio()
      ),
      numero_bultos: asegurarCampo(
        transporte?.carga?.numero_bultos,
        campoNumeroVacio()
      ),
      tipo_bultos: asegurarCampo(
        transporte?.carga?.tipo_bultos,
        campoTextoVacio()
      ),
      peso_bruto: asegurarCampo(
        transporte?.carga?.peso_bruto,
        campoMagnitudVacio()
      ),
      peso_neto: asegurarCampo(
        transporte?.carga?.peso_neto,
        campoMagnitudVacio()
      ),
      volumen: asegurarCampo(transporte?.carga?.volumen, campoMagnitudVacio()),
    },
    contenedores: Array.isArray(transporte?.contenedores)
      ? transporte.contenedores.map(normalizarContenedor)
      : [],
    flete_pagado_en: asegurarCampo(
      transporte?.flete_pagado_en,
      campoTextoVacio()
    ),
  };
}