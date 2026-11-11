export const demoResult = {
  status: "NO APTO",
  subtitle: "Critical discrepancies found",
  invoice_ref: "STC2025-0847",
  packing_ref: "PL-2025-0088",
  discrepancies: [
    {
      code: "HS-001",
      title: "HS Code mismatch: Invoice vs Packing List",
      description: "The invoice indicates HS Code 8471.30 (Portable computers), but the packing list indicates 8473.30 (Parts and accessories).",
      action: "Verify the correct HS classification. A mismatch will trigger a customs query and can change the applicable duty rate."
    },
    {
      code: "ORI-002",
      title: "Missing Country of Origin",
      description: "The Country of Origin field is blank in the commercial invoice. It is required to determine if a preferential tariff applies.",
      action: "Request the supplier to specify the country of origin in the invoice and packing list."
    },
    {
      code: "WGT-003",
      title: "Physical impossibility: Gross vs Net Weight",
      description: "In the packing list, package 'L4' shows a gross weight (308 kg) lower than its net weight (330 kg). This is physically impossible.",
      action: "Correct the document: Gross weight must always be higher than net weight to account for packaging."
    }
  ],
  summary: {
    rules_run: 21,
    discrepancies: 3,
    uncheckable: 1,
    correct: 17
  }
};