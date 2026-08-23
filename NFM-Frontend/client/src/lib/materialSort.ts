/**
 * Pure Breed SAP material display order (from mill Sap Code sheet).
 * Unknown codes sort after these, by code then name.
 */
export const MATERIAL_SAP_SORT_ORDER: string[] = [
  "1016627", // NaHCO3/Sodium
  "1016685", // Integral
  "1259945", // Bran
  "1585517", // ANIMAL BRAN BAG - 40 KG
  "1377607", // SOYA BEAN MEAL - PB
  "1377609", // Salt
  "1377611", // Corn
  "1377612", // Oil
  "1377613", // Lime Flour
  "1378164", // Methonine
  "1378166", // Mineral Premix
  "1378168", // L-Threonine
  "1734495", // Potassium Bi KHCO3
  "1378311", // Pxav3c
  "1408205", // Lime Solid
  "1414104", // Vitamin Maxi Chicks
  "1416263", // ECODIAR
  "1417861", // Choline Chloride
  "1417862", // Termin_Liq
  "1417864", // MCP
  "1085247", // Termin - 8 Powder (20 Kg)
  "1417863", // Mixstrong
  "1625260", // OPTICELL® C5
  "1085239", // Lysine
  "1378169", // SOY CONCENTRATE
  "1246828", // L-VALINE FEED GRADE 98%
  "1280395", // L-ARGININE
  "1331012", // TRYPTOPHAN
  "1516959", // L-Isoleucine
  "1152136", // PANBONIS 20
  "1000243", // CORN GLUTEN / Gluten
  "1546114", // Arbocel
  "1163266", // Dinamic
  "1162416", // EXTRACTAZYME
  "1770796", // PANBONIS 20 PREMIX
];

/** Alternate codes seen in BatchMaterials that map to the same SAP sheet row */
const MATERIAL_CODE_ALIASES: Record<string, string> = {
  "31": "1546114", // Arbocel
  "1778796": "1770796", // PANBONIS 20 PREMIX alternate
};

export function normalizeMaterialCode(code: unknown): string {
  return String(code ?? "")
    .trim()
    .replace(/\.0+$/, "")
    .toUpperCase();
}

function canonicalMaterialCode(code: unknown): string {
  const key = normalizeMaterialCode(code);
  if (!key) return "";
  return MATERIAL_CODE_ALIASES[key] || key;
}

const RANK = new Map<string, number>(
  MATERIAL_SAP_SORT_ORDER.map((code, i) => [normalizeMaterialCode(code), i])
);

/** Lower rank = earlier in report. Unknown codes go after known list. */
export function materialSortRank(code: unknown): number {
  const key = canonicalMaterialCode(code);
  if (!key) return MATERIAL_SAP_SORT_ORDER.length + 10_000;
  const hit = RANK.get(key);
  if (hit != null) return hit;
  return MATERIAL_SAP_SORT_ORDER.length + 1_000;
}

export function compareMaterialCodes(a: unknown, b: unknown): number {
  const ra = materialSortRank(a);
  const rb = materialSortRank(b);
  if (ra !== rb) return ra - rb;
  return normalizeMaterialCode(a).localeCompare(normalizeMaterialCode(b), undefined, {
    numeric: true,
  });
}

export function compareMaterialsByCodeThenName(
  a: { code?: unknown; name?: unknown },
  b: { code?: unknown; name?: unknown }
): number {
  const byCode = compareMaterialCodes(a.code, b.code);
  if (byCode !== 0) return byCode;
  return String(a.name ?? "").localeCompare(String(b.name ?? ""), undefined, {
    sensitivity: "base",
  });
}

export function sortByMaterialCode<T>(
  items: T[],
  getCode: (item: T) => unknown,
  getName?: (item: T) => unknown
): T[] {
  return [...items].sort((x, y) =>
    compareMaterialsByCodeThenName(
      { code: getCode(x), name: getName?.(x) },
      { code: getCode(y), name: getName?.(y) }
    )
  );
}
