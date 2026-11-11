export const demoResult = {
  status: "NO APTO",
  subtitle: "Hay discrepancias graves",
  invoice_ref: "STC2025-0847",
  packing_ref: "PL-2025-0088",
  discrepancies: [
    {
      code: "HS-001",
      title: "Código HS inconsistente: Factura vs Packing List",
      description: "La factura indica el código HS 8471.30 (Computadoras portátiles), pero el packing list indica 8473.30 (Partes y accesorios).",
      action: "Verificar la clasificación correcta. La discrepancia generará una consulta en aduana y puede alterar el tipo de arancel aplicable."
    },
    {
      code: "ORI-002",
      title: "Falta País de Origen",
      description: "El campo País de Origen está en blanco en la factura comercial. Es obligatorio para determinar si aplica un arancel preferencial.",
      action: "Solicitar al proveedor que especifique el país de origen en la factura y en el packing list."
    },
    {
      code: "WGT-003",
      title: "Error lógico: Peso bruto menor que el neto",
      description: "En el packing list, el bulto 'L4' tiene un peso bruto (308 kg) menor que el peso neto (330 kg). Físicamente imposible.",
      action: "Corregir el documento: el peso bruto debe ser siempre mayor que el neto para contemplar el embalaje."
    }
  ],
  summary: {
    rules_run: 21,
    discrepancies: 3,
    uncheckable: 1,
    correct: 17
  }
};