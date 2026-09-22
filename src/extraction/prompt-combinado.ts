// ============================================================
// Prompts combinados: extracción en 2 llamadas
// ============================================================
//
// Dividimos el análisis en 2 llamadas especializadas:
//   1. Factura + evaluación de descripciones.
//   2. Packing + documento de transporte.
//
// Motivo: un prompt único demasiado largo (70+ campos) hace que
// el modelo pierda precisión. Dos prompts cortos y específicos
// mantienen la calidad.
// ============================================================

// ------------------------------------------------------------
// Reglas comunes a ambos prompts
// ------------------------------------------------------------

const REGLAS_BASE = `
REGLAS ESTRICTAS:

1. Lee TODAS las páginas de cada PDF antes de generar la respuesta.
2. Devuelve ÚNICAMENTE el JSON, sin texto antes ni después, sin markdown.
3. Extrae únicamente información visible. NUNCA inventes.
4. Cada campo se devuelve con esta forma:
   { "valor": <dato o null>, "confianza": "alta"|"media"|"baja", "fuente": "<página y zona>", "nota": "<texto o vacío>", "estado": "extraido"|"no_localizado"|"ilegible"|"ambiguo"|"no_aplicable" }
5. Si un campo NO aparece: valor = null, confianza = "alta", estado = "no_localizado".
6. Si un campo NO aplica: valor = null, confianza = "alta", estado = "no_aplicable".
7. NUNCA infieras: país de origen, código HS, importador ni consignatario.
8. Conserva el valor original de las magnitudes. NO conviertas unidades sin guardar el valor normalizado.
9. Fechas en formato YYYY-MM-DD solo si son inequívocas.
`;

const FORMAS_CAMPOS = `
FORMAS DE CADA TIPO:

<Parte> = {
  "nombre_legal": <CampoTexto>,
  "direccion_completa": <CampoTexto>,
  "ciudad": <CampoTexto>,
  "pais": <CampoTexto>
}

<CampoTexto> = { "valor": <string o null>, "confianza": "alta"|"media"|"baja", "fuente": <string>, "nota": <string>, "estado": "extraido"|"no_localizado"|"ilegible"|"ambiguo"|"no_aplicable" }

<CampoNumero> = { "valor": <number o null>, "confianza": "alta"|"media"|"baja", "fuente": <string>, "nota": <string>, "estado": "extraido"|"no_localizado"|"ilegible"|"ambiguo"|"no_aplicable" }

<CampoImporte> = { "importe": <number o null>, "moneda": <string o null>, "importe_original": <string>, "confianza": "alta"|"media"|"baja", "fuente": <string>, "nota": <string>, "estado": "extraido"|"no_localizado"|"ilegible"|"ambiguo"|"no_aplicable" }

<CampoMagnitud> = { "valor": <number o null>, "unidad": <string o null>, "valor_original": <string>, "valor_normalizado": <number o null>, "unidad_normalizada": <string o null>, "confianza": "alta"|"media"|"baja", "fuente": <string>, "nota": <string>, "estado": "extraido"|"no_localizado"|"ilegible"|"ambiguo"|"no_aplicable" }
`;

// ------------------------------------------------------------
// Prompt 1 — Factura + descripciones
// ------------------------------------------------------------

export function promptFacturaCompleta(): string {
  return `Eres un asistente experto en comercio internacional y documentación aduanera.

Vas a recibir UN PDF que es una FACTURA COMERCIAL.

${REGLAS_BASE}

INSTRUCCIONES ESPECÍFICAS:

- "es_proforma": SOLO "true" si la palabra "PROFORMA" aparece EXPLÍCITAMENTE en el título. Por defecto "false".
- "importador" y "consignatario": pueden no aparecer. Si no aparecen, no_localizado.
- "codigo_hs": debe aparecer impreso en la factura. Si no, no_localizado.
- "pais_origen": el país de fabricación/origen del producto, NO el país del vendedor. Suele aparecer en la línea, en un campo "Origin". Si no aparece, no_localizado.
- Cada elemento del array "lineas" es una línea de MERCANCÍA. NO incluyas transporte, seguro o descuentos como líneas.
- Si la factura no desglosa por líneas, deja "lineas": [] y rellena "descripcion_global" y "cantidad_global".
- "ciudad": extrae SOLO el nombre de la ciudad (sin país, provincia ni CP).

CRITERIOS PARA "descripciones_evaluadas":

Una descripción es SUFICIENTEMENTE ESPECÍFICA si incluye al menos 2 de: naturaleza del producto, composición/material, uso/función, modelo/referencia, características técnicas medibles, marca reconocible.

Una descripción es GENÉRICA si solo indica categoría amplia ("repuestos", "mercancía", "productos"), usa términos vagos ("varios", "diversos") o no permite identificar qué es el producto.

Para cada línea de la factura, evalúa su "descripcion_comercial" y devuelve un elemento en el array.

ESTRUCTURA DEL JSON DE SALIDA:

{
  "factura": {
    "tipo_documento": "factura_comercial",
    "es_proforma": <CampoTexto>,
    "numero_factura": <CampoTexto>,
    "fecha_emision": <CampoTexto>,
    "vendedor": <Parte>,
    "comprador": <Parte>,
    "importador": <Parte>,
    "consignatario": <Parte>,
    "incoterm": { "codigo": <CampoTexto>, "lugar_designado": <CampoTexto>, "version": <CampoTexto> },
    "moneda": <CampoTexto>,
    "condiciones_pago": <CampoTexto>,
    "valoracion": {
      "subtotal_mercancia": <CampoImporte>,
      "descuentos": <CampoImporte>,
      "gastos_embalaje": <CampoImporte>,
      "transporte": <CampoImporte>,
      "seguro": <CampoImporte>,
      "total_facturado": <CampoImporte>
    },
    "totales_fisicos": {
      "peso_neto": <CampoMagnitud>,
      "peso_bruto": <CampoMagnitud>,
      "numero_bultos": <CampoNumero>,
      "tipo_bultos": <CampoTexto>
    },
    "descripcion_global": <CampoTexto>,
    "cantidad_global": <CampoMagnitud>,
    "lineas": [
      {
        "numero_linea": <CampoNumero>,
        "descripcion_comercial": <CampoTexto>,
        "codigo_hs": <CampoTexto>,
        "pais_origen": <CampoTexto>,
        "cantidad": <CampoMagnitud>,
        "unidad_comercial": <CampoTexto>,
        "precio_unitario": <CampoImporte>,
        "valor_linea": <CampoImporte>,
        "peso_neto": <CampoMagnitud>,
        "peso_bruto": <CampoMagnitud>
      }
    ]
  },
  "descripciones_evaluadas": [
    {
      "indice_linea": <number>,
      "descripcion": <string>,
      "es_especifica": <boolean>,
      "motivo": <string>,
      "sugerencia": <string>,
      "confianza": "alta" | "media" | "baja"
    }
  ]
}

${FORMAS_CAMPOS}

DEVUELVE SOLO EL JSON. NADA MÁS.`;
}

// ------------------------------------------------------------
// Prompt 2 — Packing + transporte
// ------------------------------------------------------------

export function promptPackingYTransporte(tieneTransporte: boolean): string {
  const intro = tieneTransporte
    ? "Vas a recibir DOS PDFs: uno es un PACKING LIST y el otro un DOCUMENTO DE TRANSPORTE (B/L marítimo, AWB aéreo o CMR carretera)."
    : "Vas a recibir UN PDF que es un PACKING LIST. No hay documento de transporte.";

  return `Eres un asistente experto en comercio internacional y documentación de transporte.

${intro}

${REGLAS_BASE}

INSTRUCCIONES ESPECÍFICAS PARA EL PACKING LIST:

- "numero_factura_referencia": busca "Invoice No", "Factura", "Reference". Si solo hay un número de cabecera, úsalo y anótalo en "nota".
- "ciudad": SOLO el nombre de la ciudad (sin país ni CP).
- Cada elemento del array "bultos" es un bulto o agrupación de bultos del packing list.
- "lineas_contenidas": qué contiene cada bulto. Incluye descripción y cantidad. Si el packing no lo desglosa, deja el array vacío.
- Si el packing solo da totales (sin bultos individuales), deja "bultos": [].

INSTRUCCIONES ESPECÍFICAS PARA EL DOCUMENTO DE TRANSPORTE:

- Detecta el tipo: "bill_of_lading" (B/L), "air_waybill" (AWB) o "cmr" (CMR).
- Los campos que NO apliquen al tipo detectado se marcan como "no_aplicable".
- "puerto_carga" y "puerto_descarga":
  · En B/L: "Port of Loading" / "Port of Discharge".
  · En AWB: "Airport of Departure" / "Airport of Destination".
  · En CMR: "Lugar de Carga" / "Lugar de Descarga".
- "ciudad_carga" y "ciudad_descarga": SOLO el nombre de la ciudad (ej: "Barcelona", "Madrid").
- "numero_factura_referencia": puede aparecer explícito o dentro de la descripción ("as per commercial invoice XXXX"). Extráelo igual y anótalo.
- Si NO hay documento de transporte, devuelve "transporte": null.

ESTRUCTURA DEL JSON DE SALIDA:

{
  "packing": {
    "tipo_documento": "packing_list",
    "numero_documento": <CampoTexto>,
    "fecha_emision": <CampoTexto>,
    "numero_factura_referencia": <CampoTexto>,
    "expedidor": <Parte>,
    "destinatario": <Parte>,
    "consignatario": <Parte>,
    "totales": {
      "numero_bultos": <CampoNumero>,
      "tipo_bultos": <CampoTexto>,
      "peso_neto": <CampoMagnitud>,
      "peso_bruto": <CampoMagnitud>,
      "tara": <CampoMagnitud>
    },
    "bultos": [
      {
        "numero_bulto": <CampoTexto>,
        "identificador_bulto": <CampoTexto>,
        "tipo": <CampoTexto>,
        "cantidad": <CampoNumero>,
        "peso_neto": <CampoMagnitud>,
        "peso_bruto": <CampoMagnitud>,
        "lineas_contenidas": [
          { "descripcion": <CampoTexto>, "cantidad": <CampoMagnitud> }
        ]
      }
    ]
  },
  "transporte": <ObjetoTransporteONull>
}

<ObjetoTransporteONull> (si no hay transporte, devuelve null):

{
  "tipo_documento": "bill_of_lading" | "air_waybill" | "cmr",
  "numero_documento": <CampoTexto>,
  "tipo_bl": <CampoTexto>,
  "fecha_emision": <CampoTexto>,
  "fecha_carga": <CampoTexto>,
  "transportista": <Parte>,
  "expedidor": <Parte>,
  "consignatario": <Parte>,
  "notify_party": <Parte>,
  "puerto_carga": <CampoTexto>,
  "puerto_descarga": <CampoTexto>,
  "ciudad_carga": <CampoTexto>,
  "ciudad_descarga": <CampoTexto>,
  "lugar_entrega": <CampoTexto>,
  "nombre_buque": <CampoTexto>,
  "numero_viaje": <CampoTexto>,
  "aerolinea": <CampoTexto>,
  "numero_vuelo": <CampoTexto>,
  "fecha_vuelo": <CampoTexto>,
  "peso_cobrable": <CampoMagnitud>,
  "matricula_vehiculo": <CampoTexto>,
  "nombre_transportista_carretera": <CampoTexto>,
  "numero_factura_referencia": <CampoTexto>,
  "numero_pedido_referencia": <CampoTexto>,
  "numero_reserva": <CampoTexto>,
  "carga": {
    "descripcion": <CampoTexto>,
    "numero_bultos": <CampoNumero>,
    "tipo_bultos": <CampoTexto>,
    "peso_bruto": <CampoMagnitud>,
    "peso_neto": <CampoMagnitud>,
    "volumen": <CampoMagnitud>
  },
  "contenedores": [
    {
      "numero_contenedor": <CampoTexto>,
      "tipo_tamano": <CampoTexto>,
      "numero_precinto": <CampoTexto>,
      "numero_bultos": <CampoNumero>,
      "peso_bruto": <CampoMagnitud>,
      "vgm": <CampoMagnitud>
    }
  ],
  "flete_pagado_en": <CampoTexto>
}

${FORMAS_CAMPOS}

DEVUELVE SOLO EL JSON. NADA MÁS.`;
}