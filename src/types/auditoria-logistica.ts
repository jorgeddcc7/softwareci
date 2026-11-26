import type {
  Confianza,
  EstadoCampo,
} from "@/types/documentos";

export type TipoDocumentoLogistico =
  | "presupuesto"
  | "factura_logistica";

export type TipoDocumentoDetectado =
  | TipoDocumentoLogistico
  | "otro"
  | "indeterminado";

export type TratamientoImpuestos =
  | "incluidos"
  | "excluidos"
  | "no_indicado";

export interface CampoLogistico<T> {
  valor: T | null;
  texto_original: string;
  pagina: number | null;
  ubicacion: string;
  confianza: Confianza;
  estado: EstadoCampo;
  nota: string;
}

export type DecimalTexto = string;

export interface LineaCosteLogistico {
  descripcion: CampoLogistico<string>;
  cantidad: CampoLogistico<DecimalTexto>;
  unidad: CampoLogistico<string>;
  precio_unitario: CampoLogistico<DecimalTexto>;
  importe: CampoLogistico<DecimalTexto>;
  moneda: CampoLogistico<string>;
  tratamiento_impuestos: CampoLogistico<TratamientoImpuestos>;
}

export interface ImpuestoLogistico {
  descripcion: CampoLogistico<string>;
  porcentaje: CampoLogistico<DecimalTexto>;
  base: CampoLogistico<DecimalTexto>;
  importe: CampoLogistico<DecimalTexto>;
  moneda: CampoLogistico<string>;
}

export interface DocumentoCostesLogisticos {
  schema_version: "1.0";
  tipo_detectado: CampoLogistico<TipoDocumentoDetectado>;
  proveedor: CampoLogistico<string>;
  cliente: CampoLogistico<string>;
  numero_documento: CampoLogistico<string>;
  referencias_operacion: CampoLogistico<string>[];
  fecha_emision: CampoLogistico<string>;
  moneda_documento: CampoLogistico<string>;
  lineas: LineaCosteLogistico[];
  condiciones: CampoLogistico<string>[];
  totales: {
    subtotal: CampoLogistico<DecimalTexto>;
    impuestos: ImpuestoLogistico[];
    total: CampoLogistico<DecimalTexto>;
    tratamiento_impuestos: CampoLogistico<TratamientoImpuestos>;
  };
  advertencias: string[];
}