import type { DocumentoSeguroTransporte } from "@/types/seguro-transporte";
import type { FacturaComercial } from "@/types/documentos";
import { normalizarImporteACentimos } from "./comparador-logistico";

export type HallazgoSeguro = {
  id: string;
  estado: "correcto" | "error_critico" | "advertencia" | "pendiente";
  titulo: string;
  descripcion: string;
};

export function compararSeguroConFactura(
  seguro: DocumentoSeguroTransporte,
  factura: FacturaComercial
): HallazgoSeguro[] {
  const hallazgos: HallazgoSeguro[] = [];

  // 1. Comparar Moneda
  const monedaSeguro = seguro.moneda.valor;
  const monedaFactura = factura.moneda?.valor;
  if (monedaSeguro && monedaFactura) {
    if (monedaSeguro === monedaFactura) {
      hallazgos.push({
        id: "moneda",
        estado: "correcto",
        titulo: "Moneda coincidente",
        descripcion: `Ambos documentos están en ${monedaSeguro}.`,
      });
    } else {
      hallazgos.push({
        id: "moneda",
        estado: "error_critico",
        titulo: "Discrepancia de moneda",
        descripcion: `El seguro está en ${monedaSeguro} pero la factura en ${monedaFactura}.`,
      });
    }
  }

  // 2. Comparar Incoterm
  const incotermSeguro = seguro.incoterm.valor;
  const incotermFactura = (factura as any).incoterm?.valor || (factura as any).incoterm;
  if (incotermSeguro && incotermFactura) {
    if (incotermSeguro === incotermFactura) {
      hallazgos.push({
        id: "incoterm",
        estado: "correcto",
        titulo: "Incoterm coincidente",
        descripcion: `El Incoterm de la operación es ${incotermSeguro}.`,
      });
    } else {
      hallazgos.push({
        id: "incoterm",
        estado: "advertencia",
        titulo: "Incoterm diferente",
        descripcion: `El seguro indica ${incotermSeguro} pero la factura indica ${incotermFactura}.`,
      });
    }
  }

  // 3. Comparar Valor Asegurado vs Total Factura (Regla 110% para CIF/CIP)
  const valorAseguradoNorm = normalizarImporteACentimos(seguro.valor_asegurado.valor);
  const totalFacturaNorm = normalizarImporteACentimos((factura as any).total?.valor || (factura as any).total);

  if (valorAseguradoNorm.centimos !== null && totalFacturaNorm.centimos !== null) {
    const valorAsegurado = Number(valorAseguradoNorm.centimos) / 100;
    const totalFactura = Number(totalFacturaNorm.centimos) / 100;

    if (incotermFactura === "CIF" || incotermFactura === "CIP") {
      const minimoRequerido = totalFactura * 1.1;
      if (valorAsegurado < minimoRequerido) {
        hallazgos.push({
          id: "valor_asegurado",
          estado: "error_critico",
          titulo: "Valor asegurado insuficiente (Regla 110%)",
          descripcion: `El valor asegurado (${valorAsegurado}€) es inferior al mínimo recomendado del 110% sobre el total de la factura (${minimoRequerido.toFixed(2)}€) para Incoterm ${incotermFactura}.`,
        });
      } else {
        hallazgos.push({
          id: "valor_asegurado",
          estado: "correcto",
          titulo: "Valor asegurado suficiente",
          descripcion: `El valor asegurado (${valorAsegurado}€) cubre el mínimo del 110% requerido.`,
        });
      }
    } else {
      // Si no es CIF/CIP, lo marcamos como pendiente de revisión manual
      hallazgos.push({
        id: "valor_asegurado",
        estado: "pendiente",
        titulo: "Verificación de valor asegurado",
        descripcion: `El Incoterm es ${incotermFactura || "desconocido"}. Revisa manualmente si el valor asegurado (${valorAsegurado}€) cubre la operación.`,
      });
    }
  }

  // 4. Cláusulas (Si es marítimo y no hay cláusula A/B/C)
  if (seguro.tipo_transporte.valor === "maritimo") {
    if (seguro.clausula.valor === "no_identificada") {
      hallazgos.push({
        id: "clausula",
        estado: "advertencia",
        titulo: "Cláusula de cobertura no identificada",
        descripcion: "Es un transporte marítimo pero no se ha podido identificar la Cláusula A, B o C de las Institute Cargo Clauses.",
      });
    } else {
      hallazgos.push({
        id: "clausula",
        estado: "correcto",
        titulo: `Cobertura Cláusula ${seguro.clausula.valor}`,
        descripcion: "Se ha identificado la cláusula de cobertura en el certificado.",
      });
    }
  }

  return hallazgos;
}