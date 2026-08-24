/**
 * Pure Breed SAP material display order (mill Sap Code sheet reference).
 * Unknown codes sort after these, by code then name.
 * Used as fallback when a recipe has no dedicated order list.
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
  "1378167", // Mineral Premix-New
  "1378168", // L-Threonine
  "1378169", // Potassium Bi KHCO3 (BatchMaterials code)
  "1734495", // Potassium Bi KHCO3 (SAP sheet alternate)
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
  "1246828", // L-VALINE FEED GRADE 98%
  "1280395", // L-ARGININE
  "1331012", // TRYPTOPHAN
  "1516959", // L-Isoleucine
  "1152136", // PANBONIS 20
  "1000243", // CORN GLUTEN-2750003 / Gluten
  "1546114", // Arbocel
  "1163266", // Dinamic
  "1162416", // EXTRACTAZYME
  "1770796", // PANBONIS 20 PREMIX
];

/** Alternate codes seen in BatchMaterials that map to the same SAP sheet row */
const MATERIAL_CODE_ALIASES: Record<string, string> = {
  "31": "1546114", // Arbocel
  "1778796": "1770796", // PANBONIS 20 PREMIX alternate
  "1734495": "1378169", // Potassium Bi KHCO3 — sheet vs live code
  "1378167": "1378166", // Mineral Premix-New → Mineral Premix slot
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
  { test: /^corn\s*gluten|^gluten\b/i, code: "1000243" },
  { test: /^corn\b/i, code: "1377611" },
  { test: /^oil\b/i, code: "1377612" },
  { test: /^lime\s*flour/i, code: "1377613" },
  { test: /^methonine|^methionine/i, code: "1378164" },
  { test: /^mineral\s*premix/i, code: "1378166" },
  { test: /^l[- ]?threonine/i, code: "1378168" },
  { test: /^potassium|^khco3/i, code: "1378169" },
  { test: /^pxav3c|^pxaz3c/i, code: "1378311" },
  { test: /^lime\s*solid/i, code: "1408205" },
  { test: /^vitamin\s*(maxi|premix)/i, code: "1414104" },
  { test: /^ecodiar/i, code: "1416263" },
  { test: /^choline/i, code: "1417861" },
  { test: /^termin[_\s-]*liq/i, code: "1417862" },
  { test: /^mcp\b/i, code: "1417864" },
  { test: /^termin.*powder|^termin[_\s-]*0?8/i, code: "1085247" },
  { test: /^mixstrong/i, code: "1417863" },
  { test: /^opticell/i, code: "1625260" },
  { test: /^lysine/i, code: "1085239" },
  { test: /^soy\s*conc/i, code: "SOY_CONCENTRATE" },
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

/**
 * Per-recipe material order from printed mill sheets.
 * Keys are normalized match ids (see resolveRecipeSortKey).
 * Values = SAP codes (or SOY_CONCENTRATE) in sheet top→bottom order.
 */
export const RECIPE_MATERIAL_ORDERS: Record<string, string[]> = {
  // 1401699 — Starter 2
  "starter 2": [
    "1000243", // CORN GLUTEN
    "1016627", // NaHCO3
    "1016685", // Integral
    "1163266", // Dinamic
    "1246828", // L-Valine
    "1259945", // Bran
    "1377607", // SOYA BEAN MEAL
    "1377609", // Salt
    "1377611", // Corn
    "1377612", // Oil
    "1377613", // Lime Flour
    "1378164", // Methionine
    "1378166", // Mineral Premix
    "1378168", // L-Threonine
    "1378311", // Pxav3c
    "1414104", // Vitamin Maxi Chicks
    "1417861", // Choline Chloride
    "1417862", // Termin_Liq
    "1417864", // MCP
    "1585517", // ANIMAL BRAN BAG
    "SOY_CONCENTRATE",
    "1516959", // L-ISOLEUCINE
    "1770796", // PANBONIS 20 PREMIX
  ],

  // 1401703 — Breeder 1
  "breeder 1": [
    "1016627", // NaHCO3
    "1016685", // Integral
    "1085239", // Lysine
    "1085247", // Termin- 8 Powder
    "1152136", // PANBONIS 20
    "1163266", // Dinamic
    "1259945", // Bran
    "1377607", // SOYA
    "1377609", // Salt
    "1377611", // Corn
    "1377612", // Oil
    "1377613", // Lime Flour
    "1378164", // Methionine
    "1378166", // Mineral Premix
    "1378168", // L-Threonine
    "1378169", // Potassium Bi KHCO3
    "1378311", // Pxav3c
    "1408205", // Lime Solid
    "1414104", // Vitamin Maxi Chicks
    "1416263", // ECODIAR
    "1417861", // Choline
    "1417862", // Termin_Liq
    "1417864", // MCP
    "1585517", // ANIMAL BRAN
    "1770796", // Panbonis 20 Premix
  ],

  // 1401697 — Pre Starter
  "pre starter": [
    "1000243", // CORN GLUTEN
    "1016627",
    "1016685",
    "1085239", // Lysine
    "1163266", // Dinamic
    "1259945",
    "1377607",
    "1377609",
    "1377611",
    "1377612",
    "1377613",
    "1378164",
    "1378166",
    "1378168",
    "1414104",
    "1417861",
    "1417862",
    "1417864",
    "1585517",
    "1770796",
  ],

  // 1401702 — Pre-Breeder
  "pre breeder": [
    "1000243", // Gluten / CORN GLUTEN
    "1016627", // NaHCO3/Sodium
    "1016685", // Integral
    "1085247", // Termin- 8 Powder (25 Kg)
    "1163266", // Dinamic
    "1259945", // Bran
    "1377607", // SOYA BEAN MEAL- PB
    "1377609", // Salt
    "1377611", // Corn
    "1377612", // Oil
    "1377613", // Lime Flour
    "1378164", // Methonine
    "1378166", // Mineral Premix
    "1378168", // L-Threonine
    "1378311", // Pxav3c (sheet: Pxa23c)
    "1408205", // Lime Solid
    "1414104", // Vitamin Maxi Chicks
    "1416263", // Ecodiar
    "1417861", // Choline Chloride
    "1417862", // Termin_Liq
    "1417864", // MCP
    "1625260", // OPTICELL
    "1585517", // ANIMAL BRAN BAG - 40 KG
    "1770796", // Panbonis 20 Premix
  ],

  // 1782590 — Breeder-3
  "breeder 3": [
    "1016627",
    "1016685",
    "1085239", // Lysine
    "1085247", // Termin- 8 Powder
    "1163266",
    "1259945",
    "1377607",
    "1377609",
    "1377611",
    "1377612",
    "1377613",
    "1378164",
    "1378166",
    "1378168",
    "1378169", // Potassium Bi KHCO3
    "1378311",
    "1408205",
    "1414104",
    "1416263",
    "1417861",
    "1417862",
    "1417864",
    "1770796",
    "1585517",
    "1000243", // Corn Gluten (late)
    "1331012", // Tryptophan
  ],

  // 1401698 — Starter 1
  "starter 1": [
    "1016627", // NaHCO3/Sodium
    "1016685", // Integral
    "1085239", // Lysine
    "1163266", // Dinamic
    "1259945", // Bran
    "1377607", // SOYA BEAN MEAL- PB
    "1377609", // Salt
    "1377611", // Corn
    "1377612", // Oil
    "1377613", // Lime Flour
    "1378164", // Methonine
    "1378166", // Mineral Premix
    "1378168", // L-Threonine
    "1378311", // Pxav3c
    "1414104", // Vitamin Maxi Chicks
    "1417861", // Choline Chloride
    "1417862", // Termin_Liq
    "1417864", // MCP
    "1585517", // ANIMAL BRAN BAG - 40 KG
    "SOY_CONCENTRATE",
  ],

  // 1401704 — Breeder-2
  "breeder 2": [
    "1016627", // NaHCO3/Sodium
    "1016685", // Integral
    "1085239", // Lysine
    "1085247", // Termin- 8 Powder (25 Kg)
    "1163266", // Dinamic
    "1259945", // Bran
    "1377607", // SOYA BEAN MEAL- PB
    "1377609", // Salt
    "1377611", // Corn
    "1377612", // Oil
    "1377613", // Lime Flour
    "1378164", // Methonine
    "1378166", // Mineral Premix
    "1378168", // L-Threonine
    "1378169", // Potassium Bi KHCO3
    "1378311", // Pxav3c (sheet: Pxa23c)
    "1408205", // Lime Solid
    "1414104", // Vitamin Maxi Chicks
    "1416263", // Ecodiar
    "1417861", // Choline Chloride
    "1417862", // Termin_Liq
    "1417864", // MCP
    "1585517", // ANIMAL BRAN BAG - 40 KG
    "1770796", // Panbonis 20 Premix
  ],

  // Grower Mesh — same family as Breeder without Potassium; Gluten/Arbocel late
  "grower mesh": [
    "1016627",
    "1016685",
    "1085247", // Termin powder
    "1163266",
    "1259945",
    "1377607",
    "1377609",
    "1377611",
    "1377612",
    "1377613",
    "1378164",
    "1378166",
    "1378168",
    "1378311",
    "1414104", // Vitamin Premix after L-Threonine
    "1416263",
    "1417861",
    "1417862",
    "1417864",
    "1585517",
    "1000243",
    "1546114", // Arbocel
    "1770796",
  ],
};

/** Loose matchers → RECIPE_MATERIAL_ORDERS key (first match wins). */
const RECIPE_MATCHERS: Array<{ key: string; test: RegExp }> = [
  { key: "starter 2", test: /\bstarter\s*[-_]?\s*2\b|1401699/i },
  { key: "starter 1", test: /\bstarter\s*[-_]?\s*1\b|1401698/i },
  { key: "pre starter", test: /\bpre[-\s_]*starter\b|1401697/i },
  { key: "pre breeder", test: /\bpre[-\s_]*breeder\b|1401702/i },
  { key: "breeder 2", test: /\bbreeder\s*[-_]?\s*2\b|1401704/i },
  { key: "breeder 1", test: /\bbreeder\s*[-_]?\s*1\b|1401703/i },
  { key: "breeder 3", test: /\bbreeder\s*[-_]?\s*3\b|1782590/i },
  { key: "grower mesh", test: /\bgrower(\s*mesh)?\b|1401701/i },
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

const RECIPE_RANK_CACHE = new Map<string, Map<string, number>>();

function recipeRankMap(recipeKey: string): Map<string, number> {
  let cached = RECIPE_RANK_CACHE.get(recipeKey);
  if (cached) return cached;
  const order = RECIPE_MATERIAL_ORDERS[recipeKey] || [];
  cached = new Map(order.map((code, i) => [normalizeMaterialCode(code), i]));
  RECIPE_RANK_CACHE.set(recipeKey, cached);
  return cached;
}

function canonicalMaterialCode(code: unknown, name?: unknown): string {
  const key = normalizeMaterialCode(code);
  if (key) {
    const aliased = MATERIAL_CODE_ALIASES[key] || key;
    if (RANK.has(normalizeMaterialCode(aliased)) || aliased === "SOY_CONCENTRATE") return aliased;
    if (MATERIAL_CODE_ALIASES[key]) return aliased;
  }
  const fromName = materialCodeFromName(name);
  if (fromName) return fromName;
  return key;
}

/** Resolve printed-sheet recipe key, or null → use global SAP order. */
export function resolveRecipeSortKey(recipeName: unknown): string | null {
  const raw = String(recipeName ?? "").trim();
  if (!raw || raw === "—") return null;
  for (const { key, test } of RECIPE_MATCHERS) {
    if (test.test(raw)) return key;
  }
  return null;
}

/** Lower rank = earlier in report. Unknown codes go after known list. */
export function materialSortRank(code: unknown, name?: unknown): number {
  const key = normalizeMaterialCode(canonicalMaterialCode(code, name));
  if (!key) return MATERIAL_SAP_SORT_ORDER.length + 10_000;
  const hit = RANK.get(key);
  if (hit != null) return hit;
  return MATERIAL_SAP_SORT_ORDER.length + 1_000;
}

/** Rank for a specific recipe; falls back to global SAP order. */
export function materialSortRankForRecipe(
  recipeName: unknown,
  code: unknown,
  name?: unknown
): number {
  const recipeKey = resolveRecipeSortKey(recipeName);
  if (!recipeKey) return materialSortRank(code, name);

  const canon = normalizeMaterialCode(canonicalMaterialCode(code, name));
  const map = recipeRankMap(recipeKey);
  if (canon && map.has(canon)) return map.get(canon)!;

  // Not on this recipe sheet → after sheet materials, still prefer global relative order
  return map.size + 100 + materialSortRank(code, name);
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

export function compareMaterialsForRecipe(
  recipeName: unknown,
  a: { code?: unknown; name?: unknown },
  b: { code?: unknown; name?: unknown }
): number {
  const ra = materialSortRankForRecipe(recipeName, a.code, a.name);
  const rb = materialSortRankForRecipe(recipeName, b.code, b.name);
  if (ra !== rb) return ra - rb;
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

/** Raw Material Consumption: sort by that recipe’s printed sheet order. */
export function sortByMaterialCodeForRecipe<T>(
  recipeName: unknown,
  items: T[],
  getCode: (item: T) => unknown,
  getName?: (item: T) => unknown
): T[] {
  return [...items].sort((x, y) =>
    compareMaterialsForRecipe(
      recipeName,
      { code: getCode(x), name: getName?.(x) },
      { code: getCode(y), name: getName?.(y) }
    )
  );
}
