// ============================================================
// Tipos base del sistema (schema v1.5)
// ============================================================
//
// Este archivo define la forma exacta de los datos que el sistema
// extrae, compara y guarda. Es el cimiento de todo el proyecto.
//
// Principios de diseño:
// 1. Cada campo lleva metadatos (confianza, fuente, nota, estado).
// 2. Los importes llevan moneda propia (puede haber varias en un doc).
// 3. Las magnitudes llevan valor original + normalizado (sin perder info).
// 4. Se distingue entre "no existe" y "no se pudo leer".
// ============================================================

// ------------------------------------------------------------
// Metadatos comunes a TODOS los campos
// ------------------------------------------------------------

/**
 * Nivel de confianza del modelo sobre el valor extraído.
 * - alta: el modelo está seguro del valor.
 * - media: probablemente correcto pero hay ambigüedad menor.
 * - baja: hay dudas, verificar manualmente.
 */
export type Confianza = "alta" | "media" | "baja";

/**
 * Estado del campo: POR QUÉ tiene o no tiene valor.
 * - extraido: el campo tiene valor legible.
 * - no_localizado: el campo no aparece en el documento.
 * - ilegible: aparece pero no se puede leer (borroso, tapado, etc.).
 * - ambiguo: aparece pero hay contradicción o duda sobre cuál es el valor.
 * - no_aplicable: el campo no aplica a este tipo de documento.
 */
export type EstadoCampo =
  | "extraido"
  | "no_localizado"
  | "ilegible"
  | "ambiguo"
  | "no_aplicable";

/**
 * Metadatos que acompañan a cualquier campo extraído.
 */
export interface MetadatosCampo {
  confianza: Confianza;
  fuente: string;      // Ej: "página 1, cabecera superior derecha"
  nota: string;        // Texto libre si el modelo dudó. Vacío si no hay nada que decir.
  estado: EstadoCampo; // Por qué tiene o no tiene valor
}

// ------------------------------------------------------------
// Tipos de campo según su naturaleza
// ------------------------------------------------------------

/**
 * Campo de texto simple (nombres, fechas, países, códigos...).
 */
export interface CampoTexto extends MetadatosCampo {
  valor: string | null;
}

/**
 * Campo numérico simple (sin unidad, sin moneda).
 * Ej: número de bultos, número de línea.
 */
export interface CampoNumero extends MetadatosCampo {
  valor: number | null;
}

/**
 * Campo monetario. Un importe siempre tiene moneda propia.
 * Ej: subtotal, transporte, precio unitario.
 */
export interface CampoImporte extends MetadatosCampo {
  importe: number | null;
  moneda: string | null;         // ISO 4217: USD, EUR, CNY
  importe_original: string;      // Texto tal cual aparece: "45.000,00 USD"
}

/**
 * Campo de magnitud física (peso, volumen, dimensión, cantidad con unidad).
 * Conserva el valor original y, si se convirtió, el valor normalizado.
 */
export interface CampoMagnitud extends MetadatosCampo {
  valor: number | null;
  unidad: string | null;                  // Unidad tal cual aparece: kg, lb, cm
  valor_original: string;                 // Texto tal cual: "2,755 lb"
  valor_normalizado: number | null;       // Si se convirtió: 1249.68
  unidad_normalizada: string | null;      // A qué unidad se convirtió: kg
}

// ------------------------------------------------------------
// Tipos compuestos
// ------------------------------------------------------------

/**
 * Parte implicada en la operación (vendedor, comprador, etc.).
 */
export interface Parte {
  nombre_legal: CampoTexto;
  direccion_completa: CampoTexto;
  ciudad: CampoTexto;
  pais: CampoTexto;
}

/**
 * Incoterm con su lugar designado y versión.
 * El lugar y la versión pueden ser null si no aparecen.
 */
export interface Incoterm {
  codigo: CampoTexto;
  lugar_designado: CampoTexto;
  version: CampoTexto;
}

// ------------------------------------------------------------
// Factura comercial
// ------------------------------------------------------------

/**
 * Una línea de mercancía dentro de la factura.
 */
export interface LineaFactura {
  numero_linea: CampoNumero;
  descripcion_comercial: CampoTexto;
  codigo_hs: CampoTexto;
  pais_origen: CampoTexto;
  cantidad: CampoMagnitud;
  unidad_comercial: CampoTexto;
  precio_unitario: CampoImporte;
  valor_linea: CampoImporte;
  peso_neto: CampoMagnitud;
  peso_bruto: CampoMagnitud;
}

/**
 * Desglose de la valoración de la factura.
 */
export interface Valoracion {
  subtotal_mercancia: CampoImporte;
  descuentos: CampoImporte;
  gastos_embalaje: CampoImporte;
  transporte: CampoImporte;
  seguro: CampoImporte;
  total_facturado: CampoImporte;
}

/**
 * Totales físicos declarados en la factura.
 */
export interface TotalesFisicos {
  peso_neto: CampoMagnitud;
  peso_bruto: CampoMagnitud;
  numero_bultos: CampoNumero;
  tipo_bultos: CampoTexto;
}

/**
 * Estructura completa de una factura comercial extraída.
 */
export interface FacturaComercial {
  tipo_documento: "factura_comercial";
  numero_factura: CampoTexto;
  fecha_emision: CampoTexto;
  vendedor: Parte;
  comprador: Parte;
  importador: Parte;
  consignatario: Parte;
  incoterm: Incoterm;
  moneda: CampoTexto;                          // Moneda principal del documento
  condiciones_pago: CampoTexto;
  valoracion: Valoracion;
  totales_fisicos: TotalesFisicos;

  // Si la factura no desglosa en líneas, se rellena esto:
  descripcion_global: CampoTexto;
  cantidad_global: CampoMagnitud;

  lineas: LineaFactura[];
}

// ------------------------------------------------------------
// Packing list
// ------------------------------------------------------------

/**
 * Contenido de un bulto dentro del packing list.
 */
export interface LineaContenidaEnBulto {
  descripcion: CampoTexto;
  cantidad: CampoMagnitud;
}

/**
 * Un bulto individual (caja, pallet, tambor, etc.).
 */
export interface Bulto {
  numero_bulto: CampoTexto;
  identificador_bulto: CampoTexto;
  tipo: CampoTexto;
  cantidad: CampoNumero;
  peso_neto: CampoMagnitud;
  peso_bruto: CampoMagnitud;
  lineas_contenidas: LineaContenidaEnBulto[];
}

/**
 * Totales del packing list.
 */
export interface TotalesPackingList {
  numero_bultos: CampoNumero;
  tipo_bultos: CampoTexto;
  peso_neto: CampoMagnitud;
  peso_bruto: CampoMagnitud;
  tara: CampoMagnitud;
}

/**
 * Estructura completa de un packing list extraído.
 */
export interface PackingList {
  tipo_documento: "packing_list";
  numero_documento: CampoTexto;
  fecha_emision: CampoTexto;
  numero_factura_referencia: CampoTexto;
  expedidor: Parte;
  destinatario: Parte;
  consignatario: Parte;
  totales: TotalesPackingList;
  bultos: Bulto[];
}

// ------------------------------------------------------------
// Documento de transporte: Bill of Lading (B/L) marítimo
// ------------------------------------------------------------
//
// En v1 solo soportamos B/L marítimo. En v2 ampliaremos a AWB,
// CMR y otros tipos de documento de transporte.
// ------------------------------------------------------------

/**
 * Contenedor individual dentro de un B/L.
 */
export interface Contenedor {
  numero_contenedor: CampoTexto;
  tipo_tamano: CampoTexto;
  numero_precinto: CampoTexto;
  numero_bultos: CampoNumero;
  peso_bruto: CampoMagnitud;
  vgm: CampoMagnitud;
}

/**
 * Carga declarada en el B/L.
 */
export interface CargaBL {
  descripcion: CampoTexto;
  numero_bultos: CampoNumero;
  tipo_bultos: CampoTexto;
  peso_bruto: CampoMagnitud;
  peso_neto: CampoMagnitud;
  volumen: CampoMagnitud;
}

/**
 * Tipos de documento de transporte soportados.
 * - bill_of_lading: B/L marítimo.
 * - air_waybill: AWB aéreo.
 * En v2 se añadirán: cmr (carretera), rail (ferroviario).
 */
export type TipoTransporte = "bill_of_lading" | "air_waybill";
export interface DocumentoTransporte {
  tipo_documento: TipoTransporte;

  // Identificación
  numero_documento: CampoTexto;
  tipo_bl: CampoTexto;              // "original" / "telex release" / etc. (solo B/L)
  fecha_emision: CampoTexto;
  fecha_carga: CampoTexto;

  // Partes
  transportista: Parte;             // Carrier / naviera o aerolínea
  expedidor: Parte;                 // Shipper / exporter
  consignatario: Parte;             // Consignee
  notify_party: Parte;              // Notify party (si aparece)

  // Lugares logísticos
  puerto_carga: CampoTexto;         // Puerto o aeropuerto de salida
  puerto_descarga: CampoTexto;      // Puerto o aeropuerto de llegada
  lugar_entrega: CampoTexto;        // Place of delivery (si aparece)
  ciudad_carga: CampoTexto;
  ciudad_descarga: CampoTexto;

  // Medio de transporte - marítimo (solo B/L)
  nombre_buque: CampoTexto;
  numero_viaje: CampoTexto;

  // Medio de transporte - aéreo (solo AWB)
  aerolinea: CampoTexto;
  numero_vuelo: CampoTexto;
  fecha_vuelo: CampoTexto;
  peso_cobrable: CampoMagnitud;

  // Referencias
  numero_factura_referencia: CampoTexto;
  numero_pedido_referencia: CampoTexto;
  numero_reserva: CampoTexto;

  // Carga
  carga: CargaBL;
  contenedores: Contenedor[];       // Solo aplica a B/L. En AWB va vacío.

  // Flete
  flete_pagado_en: CampoTexto;
}
// ------------------------------------------------------------
// Tipo unión
// ------------------------------------------------------------

/**
 * Cualquier documento que el sistema puede extraer en v1.
 */
export type Documento =
  | FacturaComercial
  | PackingList
  | DocumentoTransporte;

// ------------------------------------------------------------
// Validaciones (capa separada de la extracción)
// ------------------------------------------------------------

/**
 * Severidad de una alerta o validación.
 */
export type Severidad = "alta" | "media" | "baja";

/**
 * Resultado de aplicar una regla de validación.
 */
export type ResultadoValidacion = "ok" | "discrepancia" | "no_comprobable";

/**
 * Una validación es el resultado de aplicar una regla entre documentos.
 */
export interface Validacion {
  regla: string;
  descripcion: string;
  resultado: ResultadoValidacion;
  severidad: Severidad;
  documentos: string[];
  campos: string[];
  valores: Record<string, unknown>;
  nota: string;
  accion_sugerida?: string;
}

/**
 * Un campo obligatorio que no apareció en el documento.
 */
export interface CampoFaltante {
  documento: string;
  campo: string;
  severidad: Severidad;
  condicion: string;
}

/**
 * Salida completa del sistema para una operación.
 */
export interface ResultadoOperacion {
  datos_extraidos: Documento[];
  validaciones: Validacion[];
  campos_faltantes: CampoFaltante[];
  advertencias: string[];
  resultado_global: "apto" | "revisar" | "no_apto";
}