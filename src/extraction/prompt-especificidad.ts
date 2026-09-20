// ============================================================
// Prompt para evaluar la especificidad de una descripción
// ============================================================
//
// Este prompt se usa para el Nivel 2 de validación: detectar
// descripciones demasiado genéricas que podrían generar
// sospecha o retención en aduana.
//
// Se llama SOLO para descripciones que no han sido detectadas
// por la lista negra determinista.
// ============================================================

/**
 * Devuelve el prompt para evaluar si una descripción comercial
 * es suficientemente específica para fines aduaneros.
 *
 * @param descripcion - La descripción a evaluar
 * @param contexto - Información adicional (país origen, valor, etc.)
 */
export function promptEspecificidad(
  descripcion: string,
  contexto?: {
    pais_origen?: string | null;
    valor_linea?: number | null;
    moneda?: string | null;
  }
): string {
  const partesContexto: string[] = [];
  if (contexto?.pais_origen) {
    partesContexto.push(`País de origen: ${contexto.pais_origen}`);
  }
  if (contexto?.valor_linea !== null && contexto?.valor_linea !== undefined) {
    partesContexto.push(
      `Valor de la línea: ${contexto.valor_linea} ${contexto.moneda ?? ""}`
    );
  }
  const contextoTexto =
    partesContexto.length > 0
      ? `\nCONTEXTO DE LA OPERACIÓN:\n${partesContexto.join("\n")}\n`
      : "";

  return `Eres un experto en comercio internacional y documentación aduanera.

Tu tarea es evaluar si una descripción de mercancía en una factura comercial es suficientemente específica para fines aduaneros.
${contextoTexto}
DESCRIPCIÓN A EVALUAR:
"${descripcion}"

CRITERIOS DE EVALUACIÓN:

Una descripción es SUFICIENTEMENTE ESPECÍFICA si incluye al menos 2 de estos elementos:
- Naturaleza del producto (qué es: "válvula", "cable", "panel LED").
- Composición o material ("acero inoxidable", "cobre", "plástico ABS").
- Uso o función ("para uso industrial", "para iluminación exterior").
- Modelo, referencia o número de parte ("modelo XYZ-123", "ref. A456").
- Características técnicas medibles ("600x600mm", "40W", "12V").
- Marca comercial reconocible.

Una descripción es GENÉRICA (insuficiente) si:
- Solo indica una categoría amplia ("repuestos", "mercancía", "productos").
- Usa términos vagos ("varios", "diversos", "surtidos", "varios artículos").
- No permite identificar qué es el producto ni para qué sirve.
- Solo menciona la función sin decir qué es ("para uso industrial" sin más).
- Es una frase comercial vacía ("de alta calidad", "última generación").

EJEMPLOS:

✅ ESPECÍFICA: "LED Panel Light 600x600mm, 40W, 4000K, marco de aluminio"
✅ ESPECÍFICA: "Válvula de bola de acero inoxidable 316, DN50, PN16"
✅ ESPECÍFICA: "Cable eléctrico de cobre, 3x2.5mm², aislamiento PVC, 750V"
❌ GENÉRICA: "Repuestos"
❌ GENÉRICA: "Mercancía general"
❌ GENÉRICA: "Componentes para maquinaria"
❌ GENÉRICA: "Productos electrónicos varios"

TAREA:

Responde ÚNICAMENTE con un JSON con esta estructura exacta:

{
  "es_especifica": true | false,
  "motivo": "Explicación breve de por qué es específica o genérica",
  "elementos_presentes": ["lista", "de", "elementos", "detectados"],
  "sugerencia": "Cómo mejorar la descripción (solo si es genérica, si no, deja vacío)",
  "confianza": "alta" | "media" | "baja"
}

Devuelve SOLO el JSON. Nada más.`;
}