
import type {
  CampoLogistico,
  DecimalTexto,
} from "@/types/auditoria-logistica";

export type TipoClausulaSeguro =
  | "A"
  | "B"
  | "C"
  | "otra"
  | "no_identificada";

export type TipoTransporteSeguro =
  | "maritimo"
  | "aereo"
  | "terrestre"
  | "multimodal"
  | "otro"
  | "no_identificado";

export interface RutaSeguroTransporte {
  origen: CampoLogistico<string>;
  destino: CampoLogistico<string>;
}

export interface DocumentoSeguroTransporte {
  schema_version: "1.0";

  tipo_documento: CampoLogistico<
    "certificado_seguro" | "poliza" | "otro" | "indeterminado"
  >;

  aseguradora: CampoLogistico<string>;
  tomador: CampoLogistico<string>;
  asegurado: CampoLogistico<string>;

  numero_poliza: CampoLogistico<string>;
  numero_certificado: CampoLogistico<string>;

  fecha_emision: CampoLogistico<string>;
  fecha_inicio_cobertura: CampoLogistico<string>;
  fecha_fin_cobertura: CampoLogistico<string>;

  referencia_factura: CampoLogistico<string>;
  referencia_embarque: CampoLogistico<string>;
  referencias_operacion: CampoLogistico<string>[];

  descripcion_mercancia: CampoLogistico<string>;

  valor_asegurado: CampoLogistico<DecimalTexto>;
  moneda: CampoLogistico<string>;

  incoterm: CampoLogistico<string>;

  tipo_transporte: CampoLogistico<TipoTransporteSeguro>;

  ruta: RutaSeguroTransporte;

  clausula: CampoLogistico<TipoClausulaSeguro>;

  riesgos_cubiertos: CampoLogistico<string>[];
  riesgos_excluidos: CampoLogistico<string>[];

  franquicia: CampoLogistico<string>;
  condiciones_especiales: CampoLogistico<string>[];

  advertencias: string[];
}
