// ============================================================
// Prompt para extracción de documentos de transporte
// ============================================================
//
// Soporta:
// - B/L marítimo (bill_of_lading).
// - AWB aéreo (air_waybill).
//
// El usuario puede especificar el tipo esperado o dejar que el
// modelo lo detecte automáticamente.
// ============================================================

const REGLAS_COMUNES_TRANSPORTE = `
REGLAS ESTRICTAS DE EXTRACCIÓN:

1. Lee TODAS las páginas del PDF antes de generar la respuesta.

2. Devuelve ÚNICAMENTE un JSON válido. Sin texto, sin markdown.

3. Extrae únicamente información visible en el documento. NUNCA inventes.

4. Si un campo no aparece: valor = null, confianza = "alta", estado = "no_localizado", nota = "No localizado en el documento".

5. Si un campo es ilegible: valor = null, confianza = "baja", estado = "ilegible", nota = descripción.

6. Si hay contradicción: valor = null, confianza = "baja", estado = "ambiguo", nota = describe.

7. Si un campo NO APLICA al tipo de documento (ej: nombre_buque en un AWB), usa valor = null, confianza = "alta", estado = "no_aplicable".

8. Las fechas en formato YYYY-MM-DD solo si son inequívocas. Si no, null con nota.

9. Los pesos conservan valor y unidad originales. Si conviertes a kg, guarda el valor normalizado por separado.

10. NO inventes códigos UN/LOCODE ni IATA. Solo extrae lo que aparezca impreso.

11. El "numero_factura_referencia" puede aparecer como campo explícito ("Invoice No", "Ref") o dentro de la descripción de la mercancía (ej: "as per commercial invoice STC2025-0847"). En ese caso, extráelo igualmente y anótalo en "nota".
`;

const ESTRUCTURA_JSON = `
ESTRUCTURA DEL JSON DE SALIDA:

{
  "tipo_documento": "bill_of_lading" | "air_waybill",
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
  "lugar_entrega": <CampoTexto>,
  "nombre_buque": <CampoTexto>,
  "numero_viaje": <CampoTexto>,
  "aerolinea": <CampoTexto>,
  "numero_vuelo": <CampoTexto>,
  "fecha_vuelo": <CampoTexto>,
  "peso_cobrable": <CampoMagnitud>,
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

FORMAS DE CADA TIPO DE CAMPO:

<Parte> = {
  "nombre_legal": <CampoTexto>,
  "direccion_completa": <CampoTexto>,
  "pais": <CampoTexto>
}

<CampoTexto> = {
  "valor": <string o null>,
  "confianza": "alta" | "media" | "baja",
  "fuente": <string>,
  "nota": <string>,
  "estado": "extraido" | "no_localizado" | "ilegible" | "ambiguo" | "no_aplicable"
}

<CampoNumero> = {
  "valor": <number o null>,
  "confianza": "alta" | "media" | "baja",
  "fuente": <string>,
  "nota": <string>,
  "estado": "extraido" | "no_localizado" | "ilegible" | "ambiguo" | "no_aplicable"
}

<CampoMagnitud> = {
  "valor": <number o null>,
  "unidad": <string o null>,
  "valor_original": <string, texto tal cual>,
  "valor_normalizado": <number o null>,
  "unidad_normalizada": <string o null>,
  "confianza": "alta" | "media" | "baja",
  "fuente": <string>,
  "nota": <string>,
  "estado": "extraido" | "no_localizado" | "ilegible" | "ambiguo" | "no_aplicable"
}
`;

/**
 * Prompt para extraer los campos de un documento de transporte.
 *
 * @param tipoEsperado - Si es "auto", el modelo decide el tipo. Si es un tipo concreto, lo usa.
 */
export function promptTransporte(
  tipoEsperado: "auto" | "bill_of_lading" | "air_waybill" = "auto"
): string {
  let instruccionTipo = "";

  if (tipoEsperado === "bill_of_lading") {
    instruccionTipo = `El documento que vas a analizar es un BILL OF LADING (B/L) marítimo.
Devuelve "tipo_documento": "bill_of_lading".
Los campos "aerolinea", "numero_vuelo", "fecha_vuelo" y "peso_cobrable" no aplican a un B/L: márcalos como "no_aplicable".
Los campos "nombre_buque" y "numero_viaje" sí aplican.`;
  } else if (tipoEsperado === "air_waybill") {
    instruccionTipo = `El documento que vas a analizar es un AIR WAYBILL (AWB) aéreo.
Devuelve "tipo_documento": "air_waybill".
Los campos "nombre_buque", "numero_viaje" y "contenedores" no aplican a un AWB: márcalos como "no_aplicable".
Los campos "aerolinea", "numero_vuelo", "fecha_vuelo" y "peso_cobrable" sí aplican.`;
  } else {
    instruccionTipo = `Debes DETECTAR el tipo de documento de transporte:
- Si es un BILL OF LADING marítimo, devuelve "tipo_documento": "bill_of_lading".
- Si es un AIR WAYBILL aéreo, devuelve "tipo_documento": "air_waybill".
Los campos que no apliquen al tipo detectado se marcan como "no_aplicable".`;
  }

  return `Eres un asistente experto en comercio internacional y documentación de transporte.

${instruccionTipo}

${REGLAS_COMUNES_TRANSPORTE}

INSTRUCCIONES ESPECÍFICAS:

- "tipo_bl" solo aplica a B/L. Puede ser "original", "telex release", "seawaybill", "copia".
- "flete_pagado_en" puede ser "origen" (prepaid) o "destino" (collect).
- Los contenedores solo aplican a B/L. En AWB deja "contenedores": [].
- "notify_party" puede ser la misma empresa que el consignatario, o distinta.
- "lugar_entrega" puede aparecer como "Place of Delivery" o "Final Destination".
- Para "puerto_carga" y "puerto_descarga":
  · En B/L: busca "Port of Loading" y "Port of Discharge".
  · En AWB: busca "Airport of Departure" y "Airport of Destination".
  Extrae el nombre completo tal cual aparece (ej: "PVG - Shanghai Pudong", "Shanghai, China").

${ESTRUCTURA_JSON}

Devuelve SOLO el JSON. Nada más.`;
}