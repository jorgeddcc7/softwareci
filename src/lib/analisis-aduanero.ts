import { subirPdf, analizarPdf, eliminarPdfRemoto, evaluarEspecificidad } from "@/extraction/gemini";import { promptFactura, promptPackingList } from "@/extraction/prompt";
import { promptTransporte } from "@/extraction/prompt-transporte";
import { promptEspecificidad } from "@/extraction/prompt-especificidad";
import {
  FacturaComercial,
  PackingList,
  DocumentoTransporte,
  Validacion,
} from "@/types/documentos";
import {
  ejecutarReglas,
  generarValidacionesINV_021,
  ACCIONES_SUGERIDAS,
} from "@/rules/motor";

export type ResultadoAnalisisAduanero = {
  factura: FacturaComercial;
  packing: PackingList;
  transporte: DocumentoTransporte | null;
  resultado_global: "apto" | "revisar" | "no_apto";
  validaciones: Validacion[];
  advertencias: string[];
};

function limpiarJson(texto: string): string {
  let limpio = texto.trim();
  if (limpio.startsWith("```")) {
    limpio = limpio.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  return limpio;
}

export async function analizarDocumentosAduaneros(rutas: {
  factura: string;
  packing: string;
  transporte?: string;
}): Promise<ResultadoAnalisisAduanero> {
  // Adaptador de Gemini con limpieza remota
  const analizarPDFAdapter = async (rutaPDF: string, prompt: string) => {
    let nombreArchivoRemoto: string | null = null;
    try {
      const uriPDF = await subirPdf(rutaPDF, (nombre) => {
        nombreArchivoRemoto = nombre;
      });
      return await analizarPdf(uriPDF, prompt, rutaPDF);
    } finally {
      if (nombreArchivoRemoto) {
        try {
          await eliminarPdfRemoto(nombreArchivoRemoto);
        } catch (error) {
          console.error("[Gemini] Error eliminando PDF remoto:", error);
        }
      }
    }
  };

  // 1. Extraer documentos en paralelo
  const extraerFacturaPromise = (async () => {
    const resp = await analizarPDFAdapter(rutas.factura, promptFactura());
    return JSON.parse(limpiarJson(resp)) as FacturaComercial;
  })();

  const extraerPackingPromise = (async () => {
    const resp = await analizarPDFAdapter(rutas.packing, promptPackingList());
    return JSON.parse(limpiarJson(resp)) as PackingList;
  })();

  const extraerTransportePromise = rutas.transporte
    ? (async () => {
        const resp = await analizarPDFAdapter(
          rutas.transporte!,
          promptTransporte("auto")
        );
        return JSON.parse(limpiarJson(resp)) as DocumentoTransporte;
      })()
    : Promise.resolve(null);

  const [factura, packing, transporte] = await Promise.all([
    extraerFacturaPromise,
    extraerPackingPromise,
    extraerTransportePromise,
  ]);

  // 2. Ejecutar motor de reglas
  const { validaciones, advertencias, descripciones_a_evaluar } = ejecutarReglas(
    factura,
    packing,
    transporte
  );

  // 3. Evaluar especificidad (INV-021)
  const validacionesINV021: Validacion[] = [];

  if (descripciones_a_evaluar.length > 0) {
    const promesas = descripciones_a_evaluar.map(async (item) => {
      try {
        const prompt = promptEspecificidad(item.descripcion, {
          pais_origen: item.pais_origen,
          valor_linea: item.valor_linea,
          moneda: item.moneda,
        });
        const resultado = await evaluarEspecificidad(prompt);
        return {
          indice_linea: item.indice_linea,
          descripcion: item.descripcion,
          ...resultado,
        };
      } catch {
        return null;
      }
    });

    const resultados = (await Promise.all(promesas)).filter(
      (r): r is NonNullable<typeof r> => r !== null
    );

    const inv021 = generarValidacionesINV_021(resultados);
    for (const v of inv021) {
      v.accion_sugerida = ACCIONES_SUGERIDAS[v.regla] ?? "";
    }
    validacionesINV021.push(...inv021);
  }

  validaciones.push(...validacionesINV021);

  // 4. Calcular resultado global
  const altas = validaciones.filter(
    (v) => v.resultado === "discrepancia" && v.severidad === "alta"
  );
  const medias = validaciones.filter(
    (v) => v.resultado === "discrepancia" && v.severidad === "media"
  );
  const noComprobables = validaciones.filter(
    (v) => v.resultado === "no_comprobable"
  );

  let resultadoGlobal: "apto" | "revisar" | "no_apto";
  if (altas.length > 0) resultadoGlobal = "no_apto";
  else if (medias.length > 0 || noComprobables.length > 0)
    resultadoGlobal = "revisar";
  else resultadoGlobal = "apto";

  return {
    factura,
    packing,
    transporte,
    resultado_global: resultadoGlobal,
    validaciones,
    advertencias,
  };
}