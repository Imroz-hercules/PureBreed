/**
 * Pure Breed SAP material display order (mill Sap Code sheet reference).
 * Unknown codes sort after these, by code then name.
 */
export const MATERIAL_SAP_SORT_ORDER: string[] = [
  "1016627", // NaHCO3/Sodium
  "1016685", // Integral
  "1259945", // Bran
  "1585517", // ANIMAL BRAN BAG - 40 KG
  "1377607", // SOYA BEAN MEAL- PB
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
  "1414104", // Vitamin Maxi Chicks / Vitamin Premix MC
  "1416263", // ECODIAR
  "1417861", // Choline Chloride
  "1417862", // Termin_Liq
  "1417864", // MCP
  "1085247", // Termin- 8 Powder (20 Kg)
  "1417863", // Mixstrong
  "1625260", // OPTICELL® C5
  "1085239", // Lysine
  "1378169", // SOY CONCENRATE / SOY CONCENTRATE
  "1246828", // L-VALINE FEED GRADE 98%
  "1280395", // L-ARGININE
  "1331012", // TRYPTOPHAN
  "1516959", // L-Isoleucine
  "1152136", // PANBONIS 20
  "1000243", // CORN GLUTEN-2750003
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

/**
 * When Material Code is missing/wrong, map common report names → SAP code
 * so sort still follows the sheet order.
 */
const MATERIAL_NAME_TO_CODE: Array<{ test: RegExp; code: string }> = [
  { test: /^nahco3|sodium/i, code: "1016627" },
  { test: /^integral/i, code: "1016685" },
  { test: /^animal\s*bran/i, code: "1585517" },
  { test: /^bran\b/i, code: "1259945" },
  { test: /^soya\s*bean|^soya\b/i, code: "1377607" },
  { test: /^salt\b/i, code: "1377609" },
  { test: /^corn\s*gluten/i, code: "1000243" },
  { test: /^corn\b/i, code: "1377611" },
  { test: /^oil\b/i, code: "1377612" },
  { test: /^lime\s*flour/i, code: "1377613" },
  { test: /^methonine|^methionine/i, code: "1378164" },
  { test: /^mineral\s*premix/i, code: "1378166" },
  { test: /^l[- ]?threonine/i, code: "1378168" },
  { test: /^potassium|^khco3/i, code: "1734495" },
  { test: /^pxav3c/i, code: "1378311" },
  { test: /^lime\s*solid/i, code: "1408205" },
  { test: /^vitamin\s*(maxi|premix)/i, code: "1414104" },
  { test: /^ecodiar/i, code: "1416263" },
  { test: /^choline/i, code: "1417861" },
  { test: /^termin[_\s-]*liq/i, code: "1417862" },
  { test: /^mcp\b/i, code: "1417864" },
  { test: /^termin.*powder|^termin[_\s-]*8/i, code: "1085247" },
  { test: /^mixstrong/i, code: "1417863" },
  { test: /^opticell/i, code: "1625260" },
  { test: /^lysine/i, code: "1085239" },
  { test: /^soy\s*conc/i, code: "1378169" },
  { test: /^l[- ]?valine/i, code: "1246828" },
  { test: /^l[- ]?arginine/i, code: "1280395" },
  { test: /^tryptophan/i, code: "1331012" },
  { test: /^l[- ]?isoleucine/i, code: "1516959" },
  { test: /^panbonis\s*20\s*premix/i, code: "1770796" },
  { test: /^panbonis/i, code: "1152136" },
  { test: /^arbocel/i, code: "1546114" },
  { test: /^dinamic/i, code: "1163266" },
  { test: /^extractazyme/i, code: "1162416" },
];

export function normalizeMaterialCode(code: unknown): string {
  return String(code ?? "")
    .trim()
    .replace(/\.0+$/, "")
    .toUpperCase();
}

function materialCodeFromName(name: unknown): string {
  const n = String(name ?? "").trim();
  if (!n) return "";
  for (const { test, code } of MATERIAL_NAME_TO_CODE) {
    if (test.test(n)) return code;
  }
  return "";
}

const RANK = new Map<string, number>(
  MATERIAL_SAP_SORT_ORDER.map((code, i) => [normalizeMaterialCode(code), i])
);

function canonicalMaterialCode(code: unknown, name?: unknown): string {
  const key = normalizeMaterialCode(code);
  if (key) {
    const aliased = MATERIAL_CODE_ALIASES[key] || key;
    if (RANK.has(normalizeMaterialCode(aliased))) return aliased;
    if (MATERIAL_CODE_ALIASES[key]) return aliased;
  }
  const fromName = materialCodeFromName(name);
  if (fromName) return fromName;
  return key;
}

/** Lower rank = earlier in report. Unknown codes go after known list. */
export function materialSortRank(code: unknown, name?: unknown): number {
  const key = normalizeMaterialCode(canonicalMaterialCode(code, name));
  if (!key) return MATERIAL_SAP_SORT_ORDER.length + 10_000;
  const hit = RANK.get(key);
  if (hit != null) return hit;
  return MATERIAL_SAP_SORT_ORDER.length + 1_000;
}

export function compareMaterialCodes(a: unknown, b: unknown, nameA?: unknown, nameB?: unknown): number {
  const ra = materialSortRank(a, nameA);
  const rb = materialSortRank(b, nameB);
  if (ra !== rb) return ra - rb;
  return normalizeMaterialCode(a).localeCompare(normalizeMaterialCode(b), undefined, {
    numeric: true,
  });
}

export function compareMaterialsByCodeThenName(
  a: { code?: unknown; name?: unknown },
  b: { code?: unknown; name?: unknown }
): number {
  const byCode = compareMaterialCodes(a.code, b.code, a.name, b.name);
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
