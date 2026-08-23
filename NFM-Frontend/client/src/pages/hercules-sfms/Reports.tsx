import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WaterSystemLayout } from "../../components/hercules-sfms/WaterSystemLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  ChevronDown,
  Check,
  Plus,
  Minus,
} from "lucide-react";
import axios from "axios";
import { API_ENDPOINTS, buildApiUrl } from "@/lib/api";
import {
  buildReportHeaderHtml,
  getReportLogoDataUrls,
  REPORT_HEADER_CSS,
} from "@/lib/reportBranding";
import {
  buildBatchHierarchyExcelRows,
  buildConsumptionHierarchyExcelRows,
  downloadReportExcel,
  type ExcelDataRow,
} from "@/lib/reportExcelExport";
import { normalizeMaterialCode, sortByMaterialCode } from "@/lib/materialSort";

/** Legacy BatchMaterials_Shadow reports + MaterialInfo-view (SSRS-style) reports */
const LEGACY_TABS = [
  "Product Batch Summary",
  "Weekly",
  "Monthly",
  "Daily Report",
  "Detailed Report",
  "Material Consumption Report",
  "Total Material Consumption",
] as const;

const SSRS_TABS = [
  "Feed Production",
  "Raw Material Consumption",
  "Raw Material Cumulative",
  "Batch Report",
] as const;

/** Visible tabs: SSRS reports only (Detailed Report and other legacy tabs stay in code but hidden) */
const tabs = [...SSRS_TABS] as const;
type TabName = (typeof LEGACY_TABS)[number] | (typeof SSRS_TABS)[number];

const CLIENT_OPTIONS = [
  "Clean",
  "Farm1",
  "Farm10",
  "Farm11",
  "Farm2",
  "Farm3",
  "Farm4",
  "Farm5",
  "Farm6",
  "Farm7",
  "Farm8",
  "Farm9",
  "Flush",
  "flush3",
];

const MASTER_RECIPES = [
  "Clean V1.0",
  "Flush V1.0",
  "Mesh V2.0",
  "Mesh_with_RecMat5 V2.0",
  "Pellet V2.0",
];

const isSsrsTab = (tab: string) => (SSRS_TABS as readonly string[]).includes(tab);

const LARGE_REPORT_TIMEOUT_MS = 120_000;

const formatDateForInput = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
};

const getFallbackDates = () => {
  const end = new Date();
  end.setHours(23, 0, 0, 0);
  const start = new Date(end);
  start.setHours(7, 0, 0, 0);
  return { startDate: formatDateForInput(start), endDate: formatDateForInput(end) };
};

const parseDateTimeLocal = (value: string) => {
  const [datePart, timePart = "07:00"] = value.split("T");
  const hour = Number((timePart || "07:00").split(":")[0] || 7);
  return { date: datePart, hour: Number.isFinite(hour) ? hour : 7 };
};

const formatDisplayDate = (value: unknown) => {
  if (value == null || value === "") return "—";
  const s = String(value).trim();
  // Backend already returns "YYYY-MM-DD HH:MM:SS" — format without Date() TZ shifts
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    const [, y, mo, d, h, mi, sec = "00"] = m;
    const hour = Number(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${mo}/${d}/${y}, ${String(h12).padStart(2, "0")}:${mi}:${sec} ${ampm}`;
  }
  const d = new Date(s.includes("T") || s.includes(" ") ? s : `${s}T00:00:00`);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const fmtNum = (v: unknown, digits = 2) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(digits) : "—";
};

/** Difference tolerance: |diff| ≤ 5 green, |diff| > 5 red. Negatives keep a leading "-". */
const DIFF_THRESHOLD = 5;

const fmtDiff = (v: unknown, digits = 2) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  // toFixed keeps the "-" for negative values (e.g. -2.21)
  return n.toFixed(digits);
};

const diffToneClass = (v: unknown) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return Math.abs(n) > DIFF_THRESHOLD
    ? "text-red-600 dark:text-red-400 font-semibold"
    : "text-green-600 dark:text-green-400 font-semibold";
};

const DiffValue: React.FC<{ value: unknown; className?: string }> = ({ value, className = "" }) => (
  <span className={`${diffToneClass(value)} ${className}`.trim()}>{fmtDiff(value)}</span>
);

const isDifferenceHeader = (header: string) =>
  /difference|err\s*(kg|%)?/i.test(String(header || ""));

const diffTdHtml = (value: unknown, fmt: (v: unknown, digits?: number) => string = fmtDiff) => {
  const n = Number(value);
  const cls =
    Number.isFinite(n) && Math.abs(n) > DIFF_THRESHOLD ? "diff-over" : "diff-ok";
  return `<td class="num ${cls}">${fmt(value)}</td>`;
};

interface MultiSelectProps {
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  allSelectedText: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder,
  allSelectedText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allSelected = options.length > 0 && selectedValues.length === options.length;
  const label =
    selectedValues.length === 0
      ? `${placeholder} (${options.length} available)`
      : allSelected
        ? allSelectedText
        : selectedValues.length === 1
          ? `${selectedValues[0].length > 40 ? selectedValues[0].slice(0, 37) + "…" : selectedValues[0]} (${options.length} available)`
          : `${selectedValues.length} Selected (${options.length} available)`;

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`w-full min-h-[1.75rem] px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white cursor-pointer hover:border-cyan-400 text-xs h-7 ${
          options.length === 0 ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={() => options.length > 0 && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs truncate">{label}</span>
          <ChevronDown className={`h-3 w-3 text-slate-400 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-xl max-h-48 overflow-y-auto">
          <div
            className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b text-cyan-600 dark:text-cyan-400 font-medium text-xs"
            onClick={() => onChange(allSelected ? [] : [...options])}
          >
            <div className="flex items-center justify-between">
              <span>{allSelected ? "Deselect All" : "Select All"}</span>
              {allSelected ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            </div>
          </div>
          {options.map((option) => {
            const checked = selectedValues.includes(option);
            return (
              <div
                key={option}
                className={`px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-xs flex items-center justify-between ${
                  checked ? "bg-slate-100 dark:bg-slate-700 text-cyan-600" : "text-slate-900 dark:text-white"
                }`}
                onClick={() =>
                  onChange(
                    checked ? selectedValues.filter((v) => v !== option) : [...selectedValues, option]
                  )
                }
              >
                <span className="truncate flex-1">{option}</span>
                {checked && <Check className="h-3 w-3 text-cyan-500 ml-1" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

type LegacyRow = {
  batchName: string;
  productName: string;
  batchStart: string;
  batchEnd: string;
  batchQuantity: number;
  materialName: string;
  materialCode: string;
  setPointFloat: number;
  actualValueFloat: number;
  orderId: string | number;
  batchGuid: string;
  formulaCategoryName: string;
  isTotal?: boolean;
  errKg?: number;
  errPercent?: number;
};

/** HerculesBatchDB shadow often has Act Start / Act End swapped (~90% of rows). */
function normalizeStartEnd(start: string, end: string): { start: string; end: string } {
  if (!start || !end) return { start: start || "", end: end || "" };
  const s = Date.parse(start.replace(" ", "T"));
  const e = Date.parse(end.replace(" ", "T"));
  if (!Number.isNaN(s) && !Number.isNaN(e) && s > e) {
    return { start: end, end: start };
  }
  return { start, end };
}

function mapLegacyRow(item: Record<string, any>): LegacyRow {
  const rawStart = item["Batch Act Start"] || item.batchStart || "";
  const rawEnd = item["Batch Act End"] || item.batchEnd || "";
  const { start, end } = normalizeStartEnd(String(rawStart), String(rawEnd));
  return {
    batchName: item["Batch Name"] || item.batchName || "Unknown",
    productName: item["Product Name"] || item.productName || "Unknown",
    batchStart: start,
    batchEnd: end,
    batchQuantity: Number(item.Quantity ?? item.batchQuantity ?? 0),
    materialName: item["Material Name"] || item.materialName || "",
    materialCode: item["Material Code"] || item.materialCode || "",
    setPointFloat: Number(item["SetPoint Float"] ?? item.setPointFloat ?? 0),
    actualValueFloat: Number(item["Actual Value Float"] ?? item.actualValueFloat ?? 0),
    orderId: item.OrderId ?? item.orderId ?? "",
    batchGuid: String(item["Batch GUID"] ?? item.batchGuid ?? ""),
    formulaCategoryName: item["FormulaCategoryName"] || item.formulaCategoryName || "",
  };
}

function getTableHeaders(tab: TabName): string[] {
  switch (tab) {
    case "Product Batch Summary":
      return [
        "Batch Name",
        "Product Name",
        "Batch Start",
        "Batch End",
        "Batch Quantity",
        "Material Name",
        "Material Code",
        "SetPoint",
        "Actual",
        "Order ID",
      ];
    case "Detailed Report":
      return ["Client", "Batch Name", "Material Name", "Material Code", "Set Point", "Actual", "Difference"];
    case "Weekly":
    case "Monthly":
    case "Daily Report":
      return ["Product Name", "No Of Batches", "Sum SP", "Sum Act", "Err Kg", "Err %"];
    case "Material Consumption Report":
    case "Total Material Consumption":
      return ["Material Name", "Code", "Planned (kg)", "Actual (kg)", "Difference %"];
    case "Feed Production":
      return ["Order Category", "Batch End", "Recipe", "Formula", "Batch Qty"];
    case "Raw Material Consumption":
      return ["Date", "Recipes", "Client Name", "Material", "Set Point", "Actual", "Difference"];
    case "Raw Material Cumulative":
      return ["Material Name", "Code", "SetPoint", "Actual (kg)", "Difference (kg)"];
    case "Batch Report":
      return [
        "Client",
        "Batch Name",
        "Batch Time",
        "Material Name",
        "Material Code",
        "SetPoint",
        "Actual",
        "Difference",
      ];
    default:
      return [];
  }
}

function normalizeClientKey(text: string): string {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[#\s_\-./]+/g, "");
}

/** Leading farm from batch names like "Farm#11 23Ton23/01" or "Farm 11 …" → "farm11". */
function extractLeadingFarmKey(text: string): string | null {
  const m = String(text || "")
    .trim()
    .match(/^farm\s*#?\s*(\d+)/i);
  return m ? `farm${m[1]}` : null;
}

function clientTokenMatch(text: string, client: string): boolean {
  const n = client.trim();
  const t = String(text || "").trim();
  if (!n || !t) return false;
  if (t.toLowerCase() === n.toLowerCase()) return true;

  const clientKey = normalizeClientKey(n);
  const farmFromText = extractLeadingFarmKey(t);
  if (farmFromText && farmFromText === clientKey) return true;
  if (normalizeClientKey(t) === clientKey && clientKey.length > 0) return true;

  const escaped = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Farm1 must not match Farm11. Flush may match flush7 / Flush-1.
  const endsWithDigit = /\d$/.test(n);
  const boundary = endsWithDigit ? `(?=$|[\\s\\-_./])` : `(?=$|[\\s\\-_./]|\\d)`;
  return new RegExp(`^${escaped}${boundary}`, "i").test(t);
}

function matchesClientName(
  row: Pick<LegacyRow, "formulaCategoryName" | "productName" | "batchName">,
  client: string
): boolean {
  return (
    clientTokenMatch(row.formulaCategoryName, client) ||
    clientTokenMatch(row.productName, client) ||
    clientTokenMatch(row.batchName, client)
  );
}

function batchNameMatchesClients(batchName: string, clients: string[]): boolean {
  if (!clients.length) return false;
  return clients.some((c) => clientTokenMatch(batchName, c));
}

function resolveClientName(row: LegacyRow): string {
  const hits = CLIENT_OPTIONS.filter((c) => matchesClientName(row, c)).sort(
    (a, b) => b.length - a.length
  );
  if (hits[0]) return hits[0];
  return (row.formulaCategoryName || row.productName || "Unknown").trim() || "Unknown";
}

/** Batch Report: prefer Farm#N in batch name over Mesh/Flush FormulaCategoryName. */
function resolveSsrsClientName(item: Record<string, unknown>): string {
  const batchName = String(item.Batch_Name ?? "").trim();
  const orderCat = String(item.OrderCat_Name ?? "").trim();

  const fromBatch = CLIENT_OPTIONS.filter((c) => clientTokenMatch(batchName, c)).sort(
    (a, b) => b.length - a.length
  );
  if (fromBatch[0]) return fromBatch[0];

  const farmKey = extractLeadingFarmKey(batchName);
  if (farmKey) {
    const opt = CLIENT_OPTIONS.find((c) => normalizeClientKey(c) === farmKey);
    if (opt) return opt;
    const digits = farmKey.replace(/^farm/i, "");
    return `Farm${digits}`;
  }

  const fromCat = CLIENT_OPTIONS.filter((c) => clientTokenMatch(orderCat, c)).sort(
    (a, b) => b.length - a.length
  );
  if (fromCat[0]) return fromCat[0];

  const catFarm = extractLeadingFarmKey(orderCat);
  if (catFarm) {
    const opt = CLIENT_OPTIONS.find((c) => normalizeClientKey(c) === catFarm);
    if (opt) return opt;
  }

  return orderCat || "Unknown";
}

function masterRecipeToken(recipe: string): string {
  return recipe.replace(/\s*V\d+(?:\.\d+)*$/i, "").trim();
}

function matchesMasterRecipe(text: string, master: string): boolean {
  const token = masterRecipeToken(master);
  const t = String(text || "").trim();
  if (!token || !t) return false;
  const tl = t.toLowerCase();
  const nl = token.toLowerCase();
  const base = masterRecipeToken(t).toLowerCase();
  if (base === nl || tl === nl) return true;
  if (base.startsWith(`${nl} `) || tl.startsWith(`${nl} `)) return true;
  if (base.endsWith(` ${nl}`) || tl.endsWith(` ${nl}`)) return true;
  if (token.includes("_") && (tl.startsWith(nl) || base.startsWith(nl))) return true;
  if (!token.includes("_") && tl.startsWith(nl) && /^\d/.test(t.slice(token.length))) return true;
  return false;
}

function apiRecipesForMasters(apiNames: string[], masters: string[]): string[] {
  if (!masters.length) return [];
  return [...new Set(apiNames.filter((name) => masters.some((m) => matchesMasterRecipe(name, m))))];
}

type DetailedMaterial = {
  materialName: string;
  materialCode: string;
  setPoint: number;
  actual: number;
  difference: number;
};

type DetailedBatch = {
  key: string;
  batchName: string;
  batchTime: string;
  batchGuid?: string;
  materials: DetailedMaterial[];
  totalSetPoint: number;
  totalActual: number;
  totalDifference: number;
};

type DetailedClient = {
  client: string;
  batches: DetailedBatch[];
};

function buildDetailedTree(data: LegacyRow[]): DetailedClient[] {
  const clientMap = new Map<string, Map<string, LegacyRow[]>>();
  for (const item of data) {
    const client = resolveClientName(item);
    const batchKey = item.batchGuid || `${item.batchName}__${item.batchStart}`;
    if (!clientMap.has(client)) clientMap.set(client, new Map());
    const batches = clientMap.get(client)!;
    if (!batches.has(batchKey)) batches.set(batchKey, []);
    batches.get(batchKey)!.push(item);
  }
  const extra = [...clientMap.keys()].filter((k) => !CLIENT_OPTIONS.includes(k));
  return [...CLIENT_OPTIONS, ...extra]
    .filter((c) => clientMap.has(c))
    .map((client) => {
      const batches = [...clientMap.get(client)!.entries()].map(([key, rows]) => {
        const first = rows[0];
        const materials = sortByMaterialCode(
          rows.map((r) => ({
            materialName: r.materialName,
            materialCode: r.materialCode,
            setPoint: r.setPointFloat || 0,
            actual: r.actualValueFloat || 0,
            difference: (r.actualValueFloat || 0) - (r.setPointFloat || 0),
          })),
          (m) => m.materialCode,
          (m) => m.materialName
        );
        const totalSetPoint = materials.reduce((s, m) => s + m.setPoint, 0);
        const totalActual = materials.reduce((s, m) => s + m.actual, 0);
        return {
          key,
          batchName: first.batchName,
          batchTime: formatDisplayDate(first.batchStart || first.batchEnd),
          materials,
          totalSetPoint,
          totalActual,
          totalDifference: totalActual - totalSetPoint,
        };
      });
      return { client, batches };
    });
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildBatchHierarchyHtml(tree: DetailedClient[]): string {
  const body = tree
    .map((clientNode) => {
      const clientRow = `<tr class="client-row"><td colspan="8">${escapeHtml(clientNode.client)} (${clientNode.batches.length} batch${clientNode.batches.length === 1 ? "" : "es"})</td></tr>`;
      const batchRows = clientNode.batches
        .map((batch) => {
          const batchRow = `<tr class="batch-row"><td></td><td>${escapeHtml(batch.batchName)}</td><td>${escapeHtml(batch.batchTime)}</td><td colspan="5"></td></tr>`;
          const materialRows = batch.materials
            .map(
              (m) =>
                `<tr><td></td><td></td><td></td><td>${escapeHtml(m.materialName)}</td><td>${escapeHtml(m.materialCode)}</td><td>${fmtNum(m.setPoint)}</td><td>${fmtNum(m.actual)}</td>${diffTdHtml(m.difference)}</tr>`
            )
            .join("");
          const totalRow = `<tr class="total-row"><td></td><td></td><td></td><td>Total</td><td></td><td>${fmtNum(batch.totalSetPoint)}</td><td>${fmtNum(batch.totalActual)}</td>${diffTdHtml(batch.totalDifference)}</tr>`;
          return `${batchRow}${materialRows}${totalRow}`;
        })
        .join("");
      return `${clientRow}${batchRows}`;
    })
    .join("");
  return `<table>
    <thead><tr><th>Client</th><th>Batch Name</th><th>Batch Time</th><th>Material Name</th><th>Material Code</th><th>SetPoint</th><th>Actual</th><th>Difference</th></tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}

function flattenDetailedTree(tree: DetailedClient[]) {
  const rows: Array<Record<string, unknown>> = [];
  for (const c of tree) {
    for (const b of c.batches) {
      for (const m of b.materials) {
        rows.push({
          client: c.client,
          batchName: `${b.batchName} ${b.batchTime}`.trim(),
          materialName: m.materialName,
          materialCode: m.materialCode,
          setPoint: m.setPoint,
          actual: m.actual,
          difference: m.difference,
        });
      }
      rows.push({
        client: c.client,
        batchName: `${b.batchName} ${b.batchTime}`.trim(),
        materialName: "Total",
        materialCode: "",
        setPoint: b.totalSetPoint,
        actual: b.totalActual,
        difference: b.totalDifference,
        isTotal: true,
      });
    }
  }
  return rows;
}

function collapseValidMaterials(
  rows: Array<{
    materialName: string;
    materialCode: string;
    setPoint: number;
    actual: number;
    difference: number;
  }>
) {
  // Actual 0 = invalid duplicate / unused line; keep only Actual > 0, one row per code
  const byKey = new Map<
    string,
    { materialName: string; materialCode: string; setPoint: number; actual: number; difference: number }
  >();
  for (const row of rows) {
    const actual = Number(row.actual) || 0;
    if (actual <= 0) continue;
    const code = normalizeMaterialCode(row.materialCode);
    const key = code || String(row.materialName || "").trim().toLowerCase();
    if (!key) continue;
    const prev = byKey.get(key);
    if (!prev || actual > prev.actual) {
      const setPoint = Number(row.setPoint) || 0;
      byKey.set(key, {
        materialName: row.materialName,
        materialCode: row.materialCode,
        setPoint,
        actual,
        difference: actual - setPoint,
      });
    }
  }
  return sortByMaterialCode(
    [...byKey.values()],
    (m) => m.materialCode,
    (m) => m.materialName
  );
}

function buildBatchReportTree(rows: Record<string, unknown>[]): DetailedClient[] {
  const clientMap = new Map<string, Map<string, Record<string, unknown>[]>>();
  for (const item of rows) {
    // Farm#11… batches belong under Farm11 even if FormulaCategoryName is Mesh/Flush
    const client = resolveSsrsClientName(item);
    // Prefer [Batch GUID] so Farm#11 /01-/06 count as separate batches (calendar-aligned)
    const batchKey = String(
      item.Batch_OGUID ||
        item.Batch_GUID ||
        `${item.Batch_Name ?? ""}__${item.BatchTime ?? item.Batch_ActStart ?? item.Batch_ActEnd ?? ""}`
    );
    if (!clientMap.has(client)) clientMap.set(client, new Map());
    const batches = clientMap.get(client)!;
    if (!batches.has(batchKey)) batches.set(batchKey, []);
    batches.get(batchKey)!.push(item);
  }
  const known = CLIENT_OPTIONS.filter((c) => clientMap.has(c));
  const extra = [...clientMap.keys()].filter((k) => !CLIENT_OPTIONS.includes(k)).sort((a, b) => a.localeCompare(b));
  return [...known, ...extra].map((client) => {
    const batchMap = clientMap.get(client)!;
    const batches = [...batchMap.entries()].map(([key, items]) => {
      const first = items[0];
      const materials = collapseValidMaterials(
        items.map((r) => {
          const setPoint = Number(r.SetPoint ?? 0);
          const actual = Number(r.Actual ?? 0);
          return {
            materialName: String(r.Material_Name ?? ""),
            materialCode: String(r.Material_Code ?? ""),
            setPoint,
            actual,
            difference: Number(r.Diffrence ?? actual - setPoint),
          };
        })
      );
      const totalSetPoint = materials.reduce((s, m) => s + m.setPoint, 0);
      const totalActual = materials.reduce((s, m) => s + m.actual, 0);
      return {
        key,
        batchName: String(first.Batch_Name ?? ""),
        batchTime: formatDisplayDate(first.BatchTime ?? first.Batch_ActStart ?? first.Batch_ActEnd),
        batchGuid: String(first.Batch_OGUID ?? key),
        materials,
        totalSetPoint,
        totalActual,
        totalDifference: totalActual - totalSetPoint,
      };
    });
    return { client, batches };
  });
}

function aggregateByProduct(data: LegacyRow[]) {
  const groups: Record<string, any> = {};
  data.forEach((item) => {
    const key = item.productName || "Unknown";
    if (!groups[key]) {
      groups[key] = {
        productName: key,
        noOfBatches: 0,
        sumSP: 0,
        sumAct: 0,
        counted: new Set<string>(),
      };
    }
    const bk = `${item.batchGuid}-${item.productName}`;
    if (!groups[key].counted.has(bk)) {
      groups[key].counted.add(bk);
      groups[key].noOfBatches++;
    }
    groups[key].sumSP += item.setPointFloat || 0;
    groups[key].sumAct += item.actualValueFloat || 0;
  });
  return Object.values(groups).map((g) => {
    const errKg = Math.abs(g.sumAct - g.sumSP);
    const errPercent = g.sumSP !== 0 ? (errKg / g.sumSP) * 100 : 0;
    return {
      productName: g.productName,
      noOfBatches: g.noOfBatches,
      sumSP: g.sumSP,
      sumAct: g.sumAct,
      errKg,
      errPercent,
    };
  });
}

function aggregateByMaterial(data: LegacyRow[]) {
  const groups: Record<string, any> = {};
  data.forEach((item) => {
    const key = item.materialName || "Unknown";
    if (!groups[key]) {
      groups[key] = {
        materialName: key,
        materialCode: item.materialCode,
        plannedKG: 0,
        actualKG: 0,
      };
    }
    groups[key].plannedKG += item.setPointFloat || 0;
    groups[key].actualKG += item.actualValueFloat || 0;
  });
  return Object.values(groups).map((g) => {
    const diff =
      g.plannedKG !== 0 ? (Math.abs(g.actualKG - g.plannedKG) / g.plannedKG) * 100 : 0;
    return { ...g, diffPercent: diff };
  });
}

function formatReportDate(value: unknown): string {
  const s = String(value ?? "").trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${Number(iso[2])}/${Number(iso[3])}/${iso[1]}`;
  const dt = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T]/);
  if (dt) return `${Number(dt[2])}/${Number(dt[3])}/${dt[1]}`;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getMonth() + 1}/${value.getDate()}/${value.getFullYear()}`;
  }
  return s || "—";
}

type CumulativeMaterialRow = {
  materialLabel: string;
  setPoint: number;
  actual: number;
  difference: number;
};

type CumulativeOrderCat = {
  orderCat: string;
  materials: CumulativeMaterialRow[];
  totalSetPoint: number;
  totalActual: number;
  totalDifference: number;
};

type CumulativeRecipe = {
  recipe: string;
  orderCats: CumulativeOrderCat[];
};

type CumulativeDateGroup = {
  date: string;
  recipes: CumulativeRecipe[];
};

function buildCumulativeTree(rows: Record<string, unknown>[]): CumulativeDateGroup[] {
  type MatAcc = { code: string; name: string; setPoint: number; actual: number };
  const dates = new Map<string, Map<string, Map<string, Map<string, MatAcc>>>>();
  for (const item of rows) {
    const actual = Number(item.Actual) || 0;
    if (actual <= 0) continue; // Actual 0 = invalid / unused line
    const date = formatReportDate(item.Date ?? item.Batch_ActEnd);
    const recipe = String(item.Batch_FormulaName ?? item.Batch_RecpName ?? "—").trim() || "—";
    // Same client rule as Batch Report (Farm#11… → Farm11, not Mesh/Flush)
    const orderCat = resolveSsrsClientName(item);
    const name = String(item.Material_Name ?? "Unknown").trim() || "Unknown";
    const code = String(item.Material_Code ?? "").trim();
    if (!dates.has(date)) dates.set(date, new Map());
    const recipes = dates.get(date)!;
    if (!recipes.has(recipe)) recipes.set(recipe, new Map());
    const cats = recipes.get(recipe)!;
    if (!cats.has(orderCat)) cats.set(orderCat, new Map());
    const mats = cats.get(orderCat)!;
    if (!mats.has(name)) mats.set(name, { code, name, setPoint: 0, actual: 0 });
    const acc = mats.get(name)!;
    acc.setPoint += Number(item.SetPoint) || 0;
    acc.actual += actual;
    if (code && !acc.code) acc.code = code;
  }
  return [...dates.entries()].map(([date, recipes]) => ({
    date,
    recipes: [...recipes.entries()].map(([recipe, cats]) => ({
      recipe,
      orderCats: [...cats.entries()].map(([orderCat, mats]) => {
        const materials = sortByMaterialCode(
          [...mats.values()].map((m) => ({
            materialLabel: [m.code, m.name].filter(Boolean).join(" "),
            materialCode: m.code,
            materialName: m.name,
            setPoint: m.setPoint,
            actual: m.actual,
            difference: m.actual - m.setPoint,
          })),
          (m) => m.materialCode,
          (m) => m.materialName
        ).map(({ materialLabel, setPoint, actual, difference }) => ({
          materialLabel,
          setPoint,
          actual,
          difference,
        }));
        const totalSetPoint = materials.reduce((s, m) => s + m.setPoint, 0);
        const totalActual = materials.reduce((s, m) => s + m.actual, 0);
        return {
          orderCat,
          materials,
          totalSetPoint,
          totalActual,
          totalDifference: totalActual - totalSetPoint,
        };
      }),
    })),
  }));
}

function cumulativeRecipeSpan(recipe: CumulativeRecipe): number {
  return recipe.orderCats.reduce((s, c) => s + c.materials.length + 1, 0);
}

function cumulativeDateSpan(group: CumulativeDateGroup): number {
  return group.recipes.reduce((s, r) => s + cumulativeRecipeSpan(r), 0);
}

function buildConsumptionHierarchyHtml(
  tree: CumulativeDateGroup[],
  fmt: (v: unknown, digits?: number) => string,
  grandTotal?: { planned: number; actual: number; difference: number } | null
): string {
  const bodyParts: string[] = [];
  for (const dateNode of tree) {
    const dSpan = cumulativeDateSpan(dateNode);
    let datePrinted = false;
    for (const recipe of dateNode.recipes) {
      const rSpan = cumulativeRecipeSpan(recipe);
      let recipePrinted = false;
      for (const cat of recipe.orderCats) {
        cat.materials.forEach((m, mi) => {
          const cells: string[] = [];
          if (!datePrinted) {
            cells.push(`<td rowspan="${dSpan}" class="group-cell">${escapeHtml(dateNode.date)}</td>`);
          }
          if (!recipePrinted) {
            cells.push(`<td rowspan="${rSpan}" class="group-cell">${escapeHtml(recipe.recipe)}</td>`);
          }
          if (mi === 0) {
            cells.push(
              `<td rowspan="${cat.materials.length}" class="group-cell">${escapeHtml(cat.orderCat)}</td>`
            );
          }
          cells.push(
            `<td>${escapeHtml(m.materialLabel)}</td>`,
            `<td class="num">${fmt(m.setPoint)}</td>`,
            `<td class="num">${fmt(m.actual)}</td>`,
            diffTdHtml(m.difference, fmt)
          );
          bodyParts.push(`<tr>${cells.join("")}</tr>`);
          datePrinted = true;
          recipePrinted = true;
        });
        bodyParts.push(
          `<tr class="total-row"><td>Total</td><td></td><td class="num">${fmt(cat.totalSetPoint)}</td><td class="num">${fmt(cat.totalActual)}</td>${diffTdHtml(cat.totalDifference, fmt)}</tr>`
        );
      }
    }
  }
  if (grandTotal) {
    bodyParts.push(
      `<tr class="total-row"><td>Total</td><td></td><td></td><td></td><td class="num">${fmt(grandTotal.planned)}</td><td class="num">${fmt(grandTotal.actual)}</td>${diffTdHtml(grandTotal.difference, fmt)}</tr>`
    );
  }
  return `<table>
    <thead><tr><th>Date</th><th>Recipes</th><th>Client Name</th><th>Material</th><th>Set Point</th><th>Actual</th><th>Difference</th></tr></thead>
    <tbody>${bodyParts.join("")}</tbody>
  </table>`;
}

function flattenCumulativeTree(tree: CumulativeDateGroup[]): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (const d of tree) {
    for (const r of d.recipes) {
      for (const c of r.orderCats) {
        for (const m of c.materials) {
          rows.push({
            Date: d.date,
            Batch_FormulaName: r.recipe,
            OrderCat_Name: c.orderCat,
            Material_Name: m.materialLabel,
            SetPoint: m.setPoint,
            Actual: m.actual,
            Diffrence: m.difference,
          });
        }
        rows.push({
          Date: d.date,
          Batch_FormulaName: r.recipe,
          OrderCat_Name: "Total",
          Material_Name: "",
          SetPoint: c.totalSetPoint,
          Actual: c.totalActual,
          Diffrence: c.totalDifference,
          isTotal: true,
        });
      }
    }
  }
  return rows;
}

function aggregateCumulativeMaterials(rows: Record<string, unknown>[]) {
  const groups: Record<string, { Material_Name: string; Material_Code: string; SetPoint: number; Actual: number }> = {};
  for (const item of rows) {
    const actual = Number(item.Actual) || 0;
    if (actual <= 0) continue; // Actual 0 = invalid
    const key = String(item.Material_Name || "Unknown");
    if (!groups[key]) {
      groups[key] = {
        Material_Name: key,
        Material_Code: String(item.Material_Code ?? ""),
        SetPoint: 0,
        Actual: 0,
      };
    }
    groups[key].SetPoint += Number(item.SetPoint) || 0;
    groups[key].Actual += actual;
    if (!groups[key].Material_Code && item.Material_Code) {
      groups[key].Material_Code = String(item.Material_Code);
    }
  }
  return sortByMaterialCode(
    Object.values(groups),
    (m) => m.Material_Code,
    (m) => m.Material_Name
  );
}

export function Reports() {
  const fallback = useMemo(() => getFallbackDates(), []);
  const [pendingStartDate, setPendingStartDate] = useState(fallback.startDate);
  const [pendingEndDate, setPendingEndDate] = useState(fallback.endDate);
  const [appliedStartDate, setAppliedStartDate] = useState(fallback.startDate);
  const [appliedEndDate, setAppliedEndDate] = useState(fallback.endDate);
  const [datesReady, setDatesReady] = useState(false);
  const [dataBoundsHint, setDataBoundsHint] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabName>("Feed Production");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [loading, setLoading] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const [legacyRows, setLegacyRows] = useState<LegacyRow[]>([]);
  const [ssrsRows, setSsrsRows] = useState<Record<string, unknown>[]>([]);
  const [quantityTotal, setQuantityTotal] = useState<number | null>(null);

  const [productOptions, setProductOptions] = useState<string[]>([]);
  const [batchOptions, setBatchOptions] = useState<string[]>([]);
  const [materialOptions, setMaterialOptions] = useState<string[]>([]);
  const [pendingProduct, setPendingProduct] = useState<string[]>([]);
  const [pendingBatch, setPendingBatch] = useState<string[]>([]);
  const [pendingMaterial, setPendingMaterial] = useState<string[]>([]);
  const [pendingClient, setPendingClient] = useState<string[]>([]);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());

  const [ssrsFilter1Options, setSsrsFilter1Options] = useState<string[]>([]);
  const [ssrsFilter2Options, setSsrsFilter2Options] = useState<string[]>([]);
  const [ssrsFilter3Options, setSsrsFilter3Options] = useState<string[]>([]);
  const [ssrsFilter1, setSsrsFilter1] = useState<string[]>([]);
  const [ssrsFilter2, setSsrsFilter2] = useState<string[]>([]);
  const [ssrsFilter3, setSsrsFilter3] = useState<string[]>([]);
  const [batchLabelToGuid, setBatchLabelToGuid] = useState<Record<string, string>>({});
  const [apiRecipeNames, setApiRecipeNames] = useState<string[]>([]);
  const [filtersEpoch, setFiltersEpoch] = useState(0);
  const fetchSeqRef = useRef(0);
  const [assignTargetClient, setAssignTargetClient] = useState("");
  const [assignBatchGuids, setAssignBatchGuids] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [assignPopupOpen, setAssignPopupOpen] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000);
  };

  // Align dates with HerculesBatchDB available range
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.BATCH_DATE_BOUNDS, { timeout: 30_000 });
        if (cancelled) return;
        const maxRaw = res.data?.max_act_end;
        const minRaw = res.data?.min_act_end;
        if (maxRaw) {
          const maxD = new Date(maxRaw);
          const minD = minRaw ? new Date(minRaw) : null;
          // Default to last 1 day of available data (07:00 → 23:00)
          const end = new Date(maxD);
          end.setHours(23, 0, 0, 0);
          const start = new Date(maxD);
          start.setHours(7, 0, 0, 0);
          if (minD && start < minD) {
            start.setTime(minD.getTime());
            start.setHours(7, 0, 0, 0);
          }
          const s = formatDateForInput(start);
          const e = formatDateForInput(end);
          setPendingStartDate(s);
          setPendingEndDate(e);
          setAppliedStartDate(s);
          setAppliedEndDate(e);
          setDataBoundsHint(
            `Data available: ${minD ? minD.toLocaleDateString() : "?"} → ${maxD.toLocaleDateString()}`
          );
        }
      } catch {
        /* keep fallback */
      } finally {
        if (!cancelled) setDatesReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadLegacyFilters = useCallback(async () => {
    setFiltersLoading(true);
    try {
      const url = buildApiUrl(API_ENDPOINTS.FILTER_OPTIONS, {
        startDate: pendingStartDate,
        endDate: pendingEndDate,
      });
      const res = await axios.get(url, { timeout: LARGE_REPORT_TIMEOUT_MS });
      const products: string[] = res.data.products || [];
      const batches: string[] = res.data.batches || [];
      const materials: string[] = res.data.materials || [];
      setProductOptions(products);
      setBatchOptions(batches);
      setMaterialOptions(materials);
      if (activeTab === "Detailed Report") {
        setPendingClient((prev) => (prev.length ? prev : [...CLIENT_OPTIONS]));
        setPendingProduct([]);
        setPendingBatch([]);
        setPendingMaterial([]);
      } else {
        setPendingProduct(products);
        setPendingBatch(batches);
        setPendingMaterial(materials);
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || "Failed to load filters");
    } finally {
      setFiltersLoading(false);
      setFiltersEpoch((n) => n + 1);
    }
  }, [pendingStartDate, pendingEndDate, activeTab]);

  const loadSsrsFilters = useCallback(async () => {
    const start = parseDateTimeLocal(pendingStartDate);
    const end = parseDateTimeLocal(pendingEndDate);
    const range = {
      beginDate: start.date,
      endDate: end.date,
      beginHour: start.hour,
      endHour: end.hour,
    };
    setFiltersLoading(true);
    try {
      if (activeTab === "Raw Material Consumption") {
        const res = await axios.get(
          buildApiUrl(API_ENDPOINTS.BATCH_RAW_MATERIAL_PRODUCTS, range),
          { timeout: LARGE_REPORT_TIMEOUT_MS }
        );
        const list: string[] = (res.data.products || []).filter(Boolean);
        setSsrsFilter1Options(list);
        setSsrsFilter1(list);
        setSsrsFilter2Options([]);
        setSsrsFilter3Options([]);
        setSsrsFilter2([]);
        setSsrsFilter3([]);
      } else if (activeTab === "Raw Material Cumulative") {
        const res = await axios.get(API_ENDPOINTS.BATCH_RAW_CUMULATIVE_MATERIALS, {
          timeout: LARGE_REPORT_TIMEOUT_MS,
        });
        const list: string[] = (res.data.materials || []).filter(Boolean);
        setSsrsFilter3Options(list);
        setSsrsFilter3(list);
        setSsrsFilter1Options([]);
        setSsrsFilter2Options([]);
        setSsrsFilter1([]);
        setSsrsFilter2([]);
      } else if (activeTab === "Batch Report") {
        const res = await axios.get(buildApiUrl(API_ENDPOINTS.BATCH_REPORT_CLIENTS, range), {
          timeout: LARGE_REPORT_TIMEOUT_MS,
        });
        const list: string[] = (res.data.clients || []).filter(Boolean);
        setSsrsFilter1Options(list);
        setSsrsFilter1(list);
        setSsrsFilter2Options([]);
        setSsrsFilter3Options([]);
        setSsrsFilter2([]);
        setSsrsFilter3([]);
        setApiRecipeNames([]);
        setBatchLabelToGuid({});
      } else {
        setSsrsFilter1Options([]);
        setSsrsFilter2Options([]);
        setSsrsFilter3Options([]);
        setSsrsFilter1([]);
        setSsrsFilter2([]);
        setSsrsFilter3([]);
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || "Failed to load filters");
    } finally {
      setFiltersLoading(false);
      setFiltersEpoch((n) => n + 1);
    }
  }, [activeTab, pendingStartDate, pendingEndDate]);

  useEffect(() => {
    if (!datesReady) return;
    setLegacyRows([]);
    setSsrsRows([]);
    setQuantityTotal(null);
    setError(null);
    setCurrentPage(1);
    setFiltersLoading(true);
    const t = window.setTimeout(() => {
      if (isSsrsTab(activeTab)) loadSsrsFilters();
      else loadLegacyFilters();
    }, 300);
    return () => window.clearTimeout(t);
  }, [activeTab, pendingStartDate, pendingEndDate, datesReady, loadLegacyFilters, loadSsrsFilters]);

  // Batch report cascade: all products in range (same scope as calendar batch count)
  useEffect(() => {
    if (activeTab !== "Batch Report" || ssrsFilter1.length === 0 || !datesReady) {
      if (activeTab === "Batch Report") {
        setApiRecipeNames([]);
        setSsrsFilter2Options([]);
      }
      return;
    }
    const start = parseDateTimeLocal(pendingStartDate);
    const end = parseDateTimeLocal(pendingEndDate);
    axios
      .get(
        buildApiUrl(API_ENDPOINTS.BATCH_REPORT_RECIPES, {
          beginDate: start.date,
          endDate: end.date,
          beginHour: start.hour,
          endHour: end.hour,
          clients: ssrsFilter1.join(","),
        }),
        { timeout: LARGE_REPORT_TIMEOUT_MS }
      )
      .then((res) => {
        const list = [
          ...new Set(
            (res.data.recipes || [])
              .map((r: { Batch_RecpName: string }) => r.Batch_RecpName)
              .filter(Boolean)
          ),
        ] as string[];
        setApiRecipeNames(list);
        setSsrsFilter2Options(list);
        setSsrsFilter2((prev) => {
          const kept = prev.filter((m) => list.includes(m));
          return kept.length ? kept : list;
        });
      })
      .catch(() => {
        setApiRecipeNames([]);
        setSsrsFilter2Options([]);
        setSsrsFilter2([]);
      });
  }, [activeTab, ssrsFilter1, pendingStartDate, pendingEndDate, datesReady]);

  useEffect(() => {
    if (
      activeTab !== "Batch Report" ||
      ssrsFilter1.length === 0 ||
      ssrsFilter2.length === 0 ||
      !datesReady
    ) {
      if (activeTab === "Batch Report") {
        setSsrsFilter3Options([]);
        setSsrsFilter3([]);
        setBatchLabelToGuid({});
      }
      return;
    }
    const recipeParams = ssrsFilter2.length ? ssrsFilter2 : apiRecipeNames;
    if (!recipeParams.length) {
      setSsrsFilter3Options([]);
      setSsrsFilter3([]);
      setBatchLabelToGuid({});
      return;
    }
    const start = parseDateTimeLocal(pendingStartDate);
    const end = parseDateTimeLocal(pendingEndDate);
    axios
      .get(
        buildApiUrl(API_ENDPOINTS.BATCH_REPORT_BATCHES, {
          beginDate: start.date,
          endDate: end.date,
          beginHour: start.hour,
          endHour: end.hour,
          clients: ssrsFilter1.join(","),
          recipe: recipeParams.join(","),
        }),
        { timeout: LARGE_REPORT_TIMEOUT_MS }
      )
      .then((res) => {
        const map: Record<string, string> = {};
        const labels: string[] = [];
        for (const b of res.data.batches || []) {
          const guid = String(b.Batch_OGUID);
          const label = `${b.Batch_Name || "Batch"} (${guid.slice(0, 8)}…)`;
          if (map[label]) continue;
          map[label] = guid;
          labels.push(label);
        }
        setBatchLabelToGuid(map);
        setSsrsFilter3Options(labels);
        setSsrsFilter3(labels);
      })
      .catch(() => {
        setSsrsFilter3Options([]);
        setSsrsFilter3([]);
        setBatchLabelToGuid({});
      });
  }, [activeTab, ssrsFilter1, ssrsFilter2, apiRecipeNames, pendingStartDate, pendingEndDate, datesReady]);

  const fetchLegacyReport = async (silent = false) => {
    if (activeTab === "Detailed Report" && pendingClient.length === 0) {
      setLegacyRows([]);
      setSsrsRows([]);
      if (!silent) showToast("Select at least one client", "error");
      return;
    }
    const seq = ++fetchSeqRef.current;
    setLoading(true);
    setError(null);
    try {
      const url = buildApiUrl(API_ENDPOINTS.KPI, {
        startDate: pendingStartDate,
        endDate: pendingEndDate,
        page: 1,
        limit: 300000,
      });
      void url;
      const res = await axios.get(API_ENDPOINTS.KPI, {
        params: {
          startDate: pendingStartDate,
          endDate: pendingEndDate,
          page: 1,
          limit: 300000,
          ...(pendingProduct.length ? { product: pendingProduct } : {}),
          ...(pendingBatch.length ? { batch: pendingBatch } : {}),
          ...(pendingMaterial.length ? { material: pendingMaterial } : {}),
        },
        paramsSerializer: {
          indexes: null, // product=a&product=b
        },
        timeout: LARGE_REPORT_TIMEOUT_MS,
      });
      if (seq !== fetchSeqRef.current) return;
      const raw = res.data.data || res.data || [];
      let rows = (Array.isArray(raw) ? raw : []).map(mapLegacyRow);
      if (pendingProduct.length) {
        rows = rows.filter((r) => pendingProduct.includes(r.productName));
      }
      if (pendingBatch.length) {
        rows = rows.filter((r) => pendingBatch.includes(r.batchName));
      }
      if (pendingMaterial.length) {
        rows = rows.filter((r) => pendingMaterial.includes(r.materialName));
      }
      if (pendingClient.length) {
        rows = rows.filter((r) => pendingClient.some((c) => matchesClientName(r, c)));
      }
      setLegacyRows(rows);
      setSsrsRows([]);
      if (!silent) showToast(`Loaded ${rows.length} rows`, "success");
    } catch (e: any) {
      if (seq !== fetchSeqRef.current) return;
      const msg = e?.response?.data?.error || e.message || "Report failed";
      setError(msg);
      if (!silent) showToast(msg, "error");
    } finally {
      if (seq === fetchSeqRef.current) setLoading(false);
    }
  };

  const fetchSsrsReport = async (silent = false) => {
    if (activeTab === "Raw Material Consumption" && !ssrsFilter1.length) {
      if (!silent) showToast("Select at least one product", "error");
      return;
    }
    if (activeTab === "Raw Material Cumulative" && !ssrsFilter3.length) {
      if (!silent) showToast("Select at least one material", "error");
      return;
    }
    if (
      activeTab === "Batch Report" &&
      (!ssrsFilter1.length || !ssrsFilter2.length || !ssrsFilter3.length)
    ) {
      if (!silent) showToast("Select client(s), recipe(s), and batch(es)", "error");
      return;
    }
    const seq = ++fetchSeqRef.current;
    setLoading(true);
    setError(null);
    setQuantityTotal(null);
    try {
      const start = parseDateTimeLocal(pendingStartDate);
      const end = parseDateTimeLocal(pendingEndDate);
      const range = {
        beginDate: start.date,
        endDate: end.date,
        beginHour: start.hour,
        endHour: end.hour,
      };

      if (activeTab === "Feed Production") {
        const res = await axios.get(buildApiUrl(API_ENDPOINTS.BATCH_FEED_PRODUCTION, range), {
          timeout: LARGE_REPORT_TIMEOUT_MS,
        });
        if (seq !== fetchSeqRef.current) return;
        setSsrsRows(res.data.data || []);
      } else if (activeTab === "Raw Material Consumption") {
        const [main, qty] = await Promise.all([
          axios.get(
            buildApiUrl(API_ENDPOINTS.BATCH_RAW_MATERIAL, {
              ...range,
              product: ssrsFilter1.join(","),
            }),
            { timeout: LARGE_REPORT_TIMEOUT_MS }
          ),
          axios.get(buildApiUrl(API_ENDPOINTS.BATCH_RAW_MATERIAL_QUANTITY, range), {
            timeout: LARGE_REPORT_TIMEOUT_MS,
          }),
        ]);
        if (seq !== fetchSeqRef.current) return;
        setSsrsRows(main.data.data || []);
        setQuantityTotal(qty.data.totalQuantity ?? null);
      } else if (activeTab === "Raw Material Cumulative") {
        const [main, qty] = await Promise.all([
          axios.get(
            buildApiUrl(API_ENDPOINTS.BATCH_RAW_CUMULATIVE, {
              ...range,
              material: ssrsFilter3.join(","),
            }),
            { timeout: LARGE_REPORT_TIMEOUT_MS }
          ),
          axios.get(buildApiUrl(API_ENDPOINTS.BATCH_RAW_CUMULATIVE_QUANTITY, range), {
            timeout: LARGE_REPORT_TIMEOUT_MS,
          }),
        ]);
        if (seq !== fetchSeqRef.current) return;
        setSsrsRows(main.data.data || []);
        setQuantityTotal(qty.data.totalQuantity ?? null);
      } else if (activeTab === "Batch Report") {
        const guids = ssrsFilter3.map((l) => batchLabelToGuid[l] || l);
        const res = await axios.get(
          buildApiUrl(API_ENDPOINTS.BATCH_REPORT, {
            ...range,
            clients: ssrsFilter1.join(","),
            batch: guids.join(","),
          }),
          { timeout: LARGE_REPORT_TIMEOUT_MS }
        );
        if (seq !== fetchSeqRef.current) return;
        setSsrsRows(res.data.data || []);
      }
      setLegacyRows([]);
      if (!silent) showToast("Report loaded", "success");
    } catch (e: any) {
      if (seq !== fetchSeqRef.current) return;
      const msg = e?.response?.data?.error || e.message || "Report failed";
      setError(msg);
      if (!silent) showToast(msg, "error");
    } finally {
      if (seq === fetchSeqRef.current) setLoading(false);
    }
  };

  const applyFilters = (silent?: boolean) => {
    const quiet = silent === true;
    setAppliedStartDate(pendingStartDate);
    setAppliedEndDate(pendingEndDate);
    setCurrentPage(1);
    if (isSsrsTab(activeTab)) fetchSsrsReport(quiet);
    else fetchLegacyReport(quiet);
  };

  const applyFiltersRef = useRef(applyFilters);
  applyFiltersRef.current = applyFilters;

  const reportReadyToLoad =
    datesReady &&
    !filtersLoading &&
    filtersEpoch > 0 &&
    (activeTab === "Feed Production" ||
      (activeTab === "Raw Material Consumption" && ssrsFilter1.length > 0) ||
      (activeTab === "Raw Material Cumulative" && ssrsFilter3.length > 0) ||
      (activeTab === "Batch Report" &&
        ssrsFilter1.length > 0 &&
        ssrsFilter2.length > 0 &&
        ssrsFilter3.length > 0) ||
      (activeTab === "Detailed Report" && pendingClient.length > 0 && pendingProduct.length > 0) ||
      (!isSsrsTab(activeTab) &&
        activeTab !== "Detailed Report" &&
        (pendingProduct.length > 0 || productOptions.length === 0)));

  useEffect(() => {
    if (!reportReadyToLoad) return;
    const t = window.setTimeout(() => applyFiltersRef.current(true), 250);
    return () => window.clearTimeout(t);
  }, [reportReadyToLoad, activeTab, filtersEpoch]);

  const toggleClient = (client: string) => {
    setExpandedClients((prev) => {
      const next = new Set(prev);
      if (next.has(client)) next.delete(client);
      else next.add(client);
      return next;
    });
  };

  const toggleBatch = (key: string) => {
    setExpandedBatches((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const assignClientOptions = useMemo(() => {
    const set = new Set<string>([...CLIENT_OPTIONS, ...ssrsFilter1Options]);
    return [...set].filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [ssrsFilter1Options]);

  const detailedTree = useMemo(() => {
    if (activeTab !== "Detailed Report" || pendingClient.length === 0) return [] as DetailedClient[];
    return buildDetailedTree(legacyRows);
  }, [activeTab, legacyRows, pendingClient.length]);

  const batchReportTree = useMemo(() => {
    if (activeTab !== "Batch Report") return [] as DetailedClient[];
    return buildBatchReportTree(ssrsRows);
  }, [activeTab, ssrsRows]);

  const assignBatchOptions = useMemo(() => {
    if (activeTab !== "Batch Report") return [] as { guid: string; label: string; currentClient: string; batchName: string }[];
    const list: { guid: string; label: string; currentClient: string; batchName: string }[] = [];
    for (const clientNode of batchReportTree) {
      for (const batch of clientNode.batches) {
        const guid = batch.batchGuid || batch.key;
        if (!guid) continue;
        list.push({
          guid,
          batchName: batch.batchName,
          currentClient: clientNode.client,
          label: `${batch.batchName} — ${clientNode.client}`,
        });
      }
    }
    return list;
  }, [activeTab, batchReportTree]);

  useEffect(() => {
    setAssignBatchGuids((prev) => {
      if (!prev.length) return prev;
      const valid = new Set(assignBatchOptions.map((b) => b.guid));
      const next = prev.filter((g) => valid.has(g));
      return next.length === prev.length ? prev : next;
    });
  }, [assignBatchOptions]);

  const toggleAssignBatch = (guid: string) => {
    setAssignBatchGuids((prev) =>
      prev.includes(guid) ? prev.filter((g) => g !== guid) : [...prev, guid]
    );
  };

  const confirmAssignBatch = async () => {
    if (!assignTargetClient) {
      showToast("Select a client", "error");
      return;
    }
    if (!assignBatchGuids.length) {
      showToast("Select at least one batch", "error");
      return;
    }
    const selected = assignBatchOptions.filter((b) => assignBatchGuids.includes(b.guid));
    if (!selected.length) {
      showToast("Selected batch not found", "error");
      return;
    }
    const movable = selected.filter((b) => b.currentClient !== assignTargetClient);
    if (!movable.length) {
      showToast("All selected batches are already under this client", "error");
      return;
    }
    setAssigning(true);
    try {
      const res = await axios.post(
        API_ENDPOINTS.BATCH_REPORT_ASSIGN_CLIENT,
        {
          batchGuids: movable.map((b) => b.guid),
          newClient: assignTargetClient,
        },
        { timeout: LARGE_REPORT_TIMEOUT_MS }
      );
      const movedCount = Number(res.data?.movedCount ?? (Number(res.data?.updated ?? 0) > 0 ? 1 : 0));
      const skippedCount = Number(res.data?.skippedCount ?? 0);
      const newClient = String(res.data?.newClient ?? assignTargetClient);
      const ok = movedCount > 0 || Number(res.data?.updated ?? 0) > 0;
      showToast(
        ok
          ? skippedCount > 0
            ? `Moved ${movedCount} batch(es) to ${newClient} (${skippedCount} skipped)`
            : `Moved ${movedCount || movable.length} batch(es) to ${newClient}`
          : res.data?.message || "No batches updated",
        ok ? "success" : "error"
      );
      if (ok) {
        setAssignBatchGuids([]);
        setAssignTargetClient("");
        setAssignPopupOpen(false);
        setSsrsFilter1((prev) => (prev.includes(newClient) ? prev : [...prev, newClient]));
        setSsrsFilter1Options((prev) => (prev.includes(newClient) ? prev : [...prev, newClient]));
        setExpandedClients((prev) => {
          const next = new Set(prev);
          next.add(newClient);
          return next;
        });
        setFiltersEpoch((n) => n + 1);
      }
    } catch (e: any) {
      showToast(e?.response?.data?.error || e.message || "Failed to assign batch", "error");
    } finally {
      setAssigning(false);
    }
  };

  const expandTree =
    activeTab === "Detailed Report" ? detailedTree : activeTab === "Batch Report" ? batchReportTree : [];
  const isExpandableReport = activeTab === "Detailed Report" || activeTab === "Batch Report";
  const isGroupedConsumption = activeTab === "Raw Material Consumption";
  const showBatchTime = activeTab === "Batch Report";

  const consumptionTree = useMemo(() => {
    if (activeTab !== "Raw Material Consumption") return [] as CumulativeDateGroup[];
    return buildCumulativeTree(ssrsRows);
  }, [activeTab, ssrsRows]);

  useEffect(() => {
    if (activeTab !== "Batch Report") setAssignPopupOpen(false);
  }, [activeTab]);

  const visibleProductOptions = useMemo(() => {
    if (activeTab !== "Detailed Report") return productOptions;
    if (!pendingClient.length) return [];
    return productOptions.filter((p) => pendingClient.some((c) => clientTokenMatch(p, c)));
  }, [activeTab, productOptions, pendingClient]);

  const visibleBatchOptions = useMemo(() => {
    if (activeTab !== "Detailed Report") return batchOptions;
    if (!pendingClient.length) return [];
    return batchOptions.filter((b) => batchNameMatchesClients(b, pendingClient));
  }, [activeTab, batchOptions, pendingClient]);

  const visibleMaterialOptions = useMemo(() => {
    if (activeTab !== "Detailed Report") return materialOptions;
    if (!pendingClient.length) return [];
    return materialOptions;
  }, [activeTab, materialOptions, pendingClient.length]);

  useEffect(() => {
    if (activeTab !== "Detailed Report") return;
    if (!pendingClient.length) {
      setPendingProduct([]);
      setPendingBatch([]);
      setPendingMaterial([]);
      setLegacyRows([]);
      return;
    }
    setPendingProduct(visibleProductOptions);
    setPendingBatch(visibleBatchOptions);
    setPendingMaterial(visibleMaterialOptions);
  }, [activeTab, pendingClient, visibleProductOptions, visibleBatchOptions, visibleMaterialOptions]);

  useEffect(() => {
    setExpandedClients(new Set());
    setExpandedBatches(new Set());
  }, [legacyRows, ssrsRows]);

  const displayRows = useMemo(() => {
    if (activeTab === "Raw Material Consumption") return flattenCumulativeTree(consumptionTree);
    if (activeTab === "Raw Material Cumulative") return aggregateCumulativeMaterials(ssrsRows);
    if (isSsrsTab(activeTab)) return ssrsRows;
    if (activeTab === "Detailed Report") {
      return flattenDetailedTree(detailedTree);
    }
    if (
      activeTab === "Weekly" ||
      activeTab === "Monthly" ||
      activeTab === "Daily Report"
    ) {
      return aggregateByProduct(legacyRows);
    }
    if (
      activeTab === "Material Consumption Report" ||
      activeTab === "Total Material Consumption"
    ) {
      return aggregateByMaterial(legacyRows);
    }
    return legacyRows;
  }, [activeTab, legacyRows, ssrsRows, detailedTree, consumptionTree]);

  const consumptionTotals = useMemo(() => {
    if (activeTab !== "Raw Material Consumption") return null;
    let planned = 0;
    let actual = 0;
    for (const dateNode of consumptionTree) {
      for (const recipe of dateNode.recipes) {
        for (const cat of recipe.orderCats) {
          planned += cat.totalSetPoint;
          actual += cat.totalActual;
        }
      }
    }
    return { planned, actual, difference: actual - planned };
  }, [activeTab, consumptionTree]);

  const cumulativeTotals = useMemo(() => {
    if (activeTab !== "Raw Material Cumulative") return null;
    let planned = 0;
    let actual = 0;
    for (const row of ssrsRows) {
      const rowActual = Number(row.Actual) || 0;
      if (rowActual <= 0) continue;
      planned += Number(row.SetPoint) || 0;
      actual += rowActual;
    }
    return { planned, actual, difference: actual - planned };
  }, [activeTab, ssrsRows]);

  const headers = getTableHeaders(activeTab);

  const paginatedExpandClients = useMemo(() => {
    if (!isExpandableReport) return [] as DetailedClient[];
    if (rowsPerPage === -1) return expandTree;
    const start = (currentPage - 1) * rowsPerPage;
    return expandTree.slice(start, start + rowsPerPage);
  }, [isExpandableReport, expandTree, currentPage, rowsPerPage]);

  const paginatedConsumptionDates = useMemo(() => {
    if (!isGroupedConsumption) return [] as CumulativeDateGroup[];
    if (rowsPerPage === -1) return consumptionTree;
    const start = (currentPage - 1) * rowsPerPage;
    return consumptionTree.slice(start, start + rowsPerPage);
  }, [isGroupedConsumption, consumptionTree, currentPage, rowsPerPage]);

  const paginatedRows = useMemo(() => {
    if (isExpandableReport) return flattenDetailedTree(paginatedExpandClients);
    if (isGroupedConsumption) return flattenCumulativeTree(paginatedConsumptionDates);
    if (rowsPerPage === -1) return displayRows;
    const start = (currentPage - 1) * rowsPerPage;
    return displayRows.slice(start, start + rowsPerPage);
  }, [isExpandableReport, isGroupedConsumption, displayRows, currentPage, rowsPerPage, paginatedExpandClients, paginatedConsumptionDates]);

  const totalPages =
    isExpandableReport
      ? rowsPerPage === -1
        ? 1
        : Math.max(1, Math.ceil(expandTree.length / Math.max(rowsPerPage, 1)))
      : isGroupedConsumption
        ? rowsPerPage === -1
          ? 1
          : Math.max(1, Math.ceil(consumptionTree.length / Math.max(rowsPerPage, 1)))
      : rowsPerPage === -1
        ? 1
        : Math.max(1, Math.ceil(displayRows.length / Math.max(rowsPerPage, 1)));

  const renderCells = (item: any): (string | number)[] => {
    if (isSsrsTab(activeTab)) {
      switch (activeTab) {
        case "Feed Production":
          return [
            String(item.OrderCat_Name ?? "—"),
            formatDisplayDate(item.Batch_ActEnd),
            String(item.Batch_RecpName ?? "—"),
            String(item.Batch_FormulaName ?? "—"),
            fmtNum(item.Batch_QTY),
          ];
        case "Raw Material Consumption": {
          const planned = Number(item.SetPoint) || 0;
          const actual = Number(item.Actual) || 0;
          const diff = Number(item.Diffrence ?? actual - planned);
          return [
            String(item.Date ?? "—"),
            String(item.Batch_FormulaName ?? "—"),
            String(item.OrderCat_Name ?? "—"),
            String(item.Material_Name ?? ""),
            fmtNum(planned),
            fmtNum(actual),
            fmtDiff(diff),
          ];
        }
        case "Raw Material Cumulative": {
          const planned = Number(item.SetPoint) || 0;
          const actual = Number(item.Actual) || 0;
          return [
            String(item.Material_Name ?? "—"),
            String(item.Material_Code ?? "—"),
            fmtNum(planned),
            fmtNum(actual),
            fmtDiff(actual - planned),
          ];
        }
        case "Batch Report":
          return [
            String(item.OrderCat_Name ?? "—"),
            String(item.Batch_Name ?? "—"),
            formatDisplayDate(item.BatchTime ?? item.Batch_ActEnd),
            String(item.Material_Name ?? "—"),
            String(item.Material_Code ?? "—"),
            fmtNum(item.SetPoint),
            fmtNum(item.Actual),
            fmtDiff(item.Diffrence),
          ];
      }
    }
    if (
      activeTab === "Weekly" ||
      activeTab === "Monthly" ||
      activeTab === "Daily Report"
    ) {
      return [
        item.productName,
        item.noOfBatches,
        fmtNum(item.sumSP),
        fmtNum(item.sumAct),
        fmtDiff(item.errKg),
        fmtDiff(item.errPercent),
      ];
    }
    if (
      activeTab === "Material Consumption Report" ||
      activeTab === "Total Material Consumption"
    ) {
      return [
        item.materialName,
        item.materialCode,
        fmtNum(item.plannedKG),
        fmtNum(item.actualKG),
        fmtDiff(item.diffPercent),
      ];
    }
    if (activeTab === "Detailed Report") {
      return [
        String(item.client ?? item.formulaCategoryName ?? ""),
        item.isTotal ? "" : String(item.batchName ?? ""),
        item.materialName,
        item.materialCode ?? "",
        fmtNum(item.setPoint ?? item.setPointFloat),
        fmtNum(item.actual ?? item.actualValueFloat),
        fmtDiff(
          item.difference ??
            (item.actualValueFloat || 0) - (item.setPointFloat || 0)
        ),
      ];
    }
    // Product Batch Summary
    return [
      item.batchName,
      item.productName,
      formatDisplayDate(item.batchStart),
      formatDisplayDate(item.batchEnd),
      fmtNum(item.batchQuantity),
      item.materialName,
      item.materialCode,
      fmtNum(item.setPointFloat),
      fmtNum(item.actualValueFloat),
      String(item.orderId ?? ""),
    ];
  };

  const reportMeta = () => {
    const generatedOn = new Date().toLocaleString("en-US");
    const dateRange = `${appliedStartDate} to ${appliedEndDate}`;
    return { generatedOn, dateRange };
  };

  const reportTableHtml = () => {
    if (activeTab === "Batch Report") {
      return buildBatchHierarchyHtml(batchReportTree);
    }
    if (activeTab === "Raw Material Consumption") {
      return buildConsumptionHierarchyHtml(consumptionTree, fmtNum, consumptionTotals);
    }
    const totalRow = cumulativeTotals
      ? `<tr class="total-row"><td>Total</td><td></td><td>${fmtNum(cumulativeTotals.planned)}</td><td>${fmtNum(cumulativeTotals.actual)}</td>${diffTdHtml(cumulativeTotals.difference)}</tr>`
      : "";
    return `<table>
      <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${displayRows
        .map(
          (r) =>
            `<tr>${renderCells(r)
              .map((c, i) =>
                isDifferenceHeader(headers[i] || "") ? diffTdHtml(c) : `<td>${c}</td>`
              )
              .join("")}</tr>`
        )
        .join("")}${totalRow}</tbody>
    </table>`;
  };

  const exportToExcel = async () => {
    const { generatedOn, dateRange } = reportMeta();
    const finish = async (result: Awaited<ReturnType<typeof downloadReportExcel>>) => {
      if (result?.savedPath) {
        showToast(`Saved to ${result.savedPath}`, "success");
      } else {
        showToast(result?.saveError || "Failed to save to F:\\Purebreed_reports", "error");
      }
    };
    try {
      if (activeTab === "Batch Report") {
        if (!batchReportTree.length) {
          showToast("No data to export", "error");
          return;
        }
        const { headers: batchHeaders, rows } = buildBatchHierarchyExcelRows(batchReportTree, fmtNum);
        await finish(
          await downloadReportExcel({
            title: activeTab,
            generatedOn,
            dateRange,
            headers: batchHeaders,
            rows,
          })
        );
        return;
      }
      if (activeTab === "Raw Material Consumption") {
        if (!consumptionTree.length) {
          showToast("No data to export", "error");
          return;
        }
        const { headers: consHeaders, rows, merges } = buildConsumptionHierarchyExcelRows(
          consumptionTree,
          fmtNum,
          consumptionTotals
        );
        await finish(
          await downloadReportExcel({
            title: activeTab,
            generatedOn,
            dateRange,
            headers: consHeaders,
            rows,
            merges,
          })
        );
        return;
      }
      if (!displayRows.length) {
        showToast("No data to export", "error");
        return;
      }
      const rows: ExcelDataRow[] = displayRows.map((row) => ({
        values: renderCells(row),
        kind: "normal",
      }));
      if (cumulativeTotals) {
        rows.push({
          kind: "total",
          values: [
            "Total",
            "",
            fmtNum(cumulativeTotals.planned),
            fmtNum(cumulativeTotals.actual),
            fmtNum(cumulativeTotals.difference),
          ],
        });
      }
      await finish(
        await downloadReportExcel({
          title: activeTab,
          generatedOn,
          dateRange,
          headers,
          rows,
        })
      );
    } catch (e: any) {
      showToast(e?.message || "Failed to export Excel", "error");
    }
  };

  const handlePrint = async () => {
    const hasPrintData =
      activeTab === "Batch Report"
        ? batchReportTree.length > 0
        : activeTab === "Raw Material Consumption"
          ? consumptionTree.length > 0
          : displayRows.length > 0;
    if (!hasPrintData) {
      showToast("No data to print", "error");
      return;
    }
    const w = window.open("", "_blank");
    if (!w) return;
    const { generatedOn, dateRange } = reportMeta();
    const logos = await getReportLogoDataUrls();
    const headerHtml = buildReportHeaderHtml({
      title: activeTab,
      generatedOn,
      dateRange,
      logos,
    });
    w.document.write(`
      <html>
        <head>
          <title>${activeTab}</title>
          <style>${REPORT_HEADER_CSS}</style>
        </head>
        <body>
          ${headerHtml}
          ${reportTableHtml()}
        </body>
      </html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  };

  const ssrsFilterSlots =
    activeTab === "Raw Material Consumption"
      ? [{ key: "f1" as const, label: "Select Product", options: ssrsFilter1Options, selected: ssrsFilter1, onChange: setSsrsFilter1 }]
      : activeTab === "Raw Material Cumulative"
        ? [{ key: "f3" as const, label: "Select Material", options: ssrsFilter3Options, selected: ssrsFilter3, onChange: setSsrsFilter3 }]
        : activeTab === "Batch Report"
          ? [
              { key: "f1" as const, label: "Select Client", options: ssrsFilter1Options, selected: ssrsFilter1, onChange: setSsrsFilter1 },
              ...(ssrsFilter1.length
                ? [
                    {
                      key: "f2" as const,
                      label: "Select Recipe",
                      options: ssrsFilter2Options,
                      selected: ssrsFilter2,
                      onChange: setSsrsFilter2,
                    },
                  ]
                : []),
              ...(ssrsFilter1.length && ssrsFilter2.length
                ? [
                    {
                      key: "f3" as const,
                      label: "Select Batch",
                      options: ssrsFilter3Options,
                      selected: ssrsFilter3,
                      onChange: setSsrsFilter3,
                    },
                  ]
                : []),
            ]
          : [];

  return (
    <WaterSystemLayout>
      {toast.show && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
              toast.type === "success"
                ? "bg-green-50 dark:bg-green-950/80 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                : "bg-red-50 dark:bg-red-950/80 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToast((t) => ({ ...t, show: false }))}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {assignPopupOpen && activeTab === "Batch Report" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !assigning && setAssignPopupOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-xl p-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-800 dark:text-cyan-300">
                  Assign batch to client
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Select the new client and one or more batches to move, then click ASSIGN.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !assigning && setAssignPopupOpen(false)}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Assign client</Label>
                <select
                  value={assignTargetClient}
                  onChange={(e) => setAssignTargetClient(e.target.value)}
                  disabled={assigning}
                  className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 text-sm text-slate-900 dark:text-white"
                >
                  <option value="">Select client…</option>
                  {assignClientOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs font-medium">Assign batch</Label>
                  {assignBatchOptions.length > 0 && (
                    <button
                      type="button"
                      disabled={assigning}
                      onClick={() =>
                        setAssignBatchGuids((prev) =>
                          prev.length === assignBatchOptions.length
                            ? []
                            : assignBatchOptions.map((b) => b.guid)
                        )
                      }
                      className="text-[11px] text-[#0088a9] hover:underline"
                    >
                      {assignBatchGuids.length === assignBatchOptions.length ? "Clear all" : "Select all"}
                    </button>
                  )}
                </div>
                <div
                  className={`max-h-44 overflow-y-auto rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 ${
                    assigning || assignBatchOptions.length === 0 ? "opacity-60 pointer-events-none" : ""
                  }`}
                >
                  {assignBatchOptions.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2">No batches available</p>
                  ) : (
                    assignBatchOptions.map((b) => {
                      const checked = assignBatchGuids.includes(b.guid);
                      return (
                        <label
                          key={b.guid}
                          className="flex items-start gap-2 py-1.5 text-sm text-slate-900 dark:text-white cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={checked}
                            disabled={assigning}
                            onChange={() => toggleAssignBatch(b.guid)}
                          />
                          <span className="leading-snug">{b.label}</span>
                        </label>
                      );
                    })
                  )}
                </div>
                {assignBatchGuids.length > 0 && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {assignBatchGuids.length} selected
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                onClick={() => setAssignPopupOpen(false)}
                disabled={assigning}
                className="h-9 px-3 text-sm bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmAssignBatch}
                disabled={assigning || !assignTargetClient || !assignBatchGuids.length}
                className="h-9 px-4 text-sm !bg-[#0088a9] hover:!bg-[#007b98] !text-white"
              >
                {assigning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning…
                  </>
                ) : (
                  "ASSIGN"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="text-cyan-400 text-2xl" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-cyan-300 tracking-wide">
            Historical Reports
          </h1>
        </div>

        <Card className="bg-white/95 dark:bg-slate-900/95 border-slate-300 dark:border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-700 dark:text-cyan-300 flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div
              className={`grid grid-cols-1 gap-2 items-end ${
                isSsrsTab(activeTab) && ssrsFilterSlots.length === 0
                  ? "md:grid-cols-3"
                  : activeTab === "Detailed Report"
                    ? "md:grid-cols-4 xl:grid-cols-7"
                    : "md:grid-cols-6"
              }`}
            >
              <div className="space-y-1">
                <Label className="text-xs font-medium">Start Date:</Label>
                <Input
                  type="datetime-local"
                  value={pendingStartDate}
                  onChange={(e) => setPendingStartDate(e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="h-7 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">End Date:</Label>
                <Input
                  type="datetime-local"
                  value={pendingEndDate}
                  onChange={(e) => setPendingEndDate(e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="h-7 text-sm"
                />
              </div>

              {!isSsrsTab(activeTab) && (
                <>
                  {activeTab === "Detailed Report" && (
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Select Client:</Label>
                      <MultiSelect
                        options={CLIENT_OPTIONS}
                        selectedValues={pendingClient}
                        onChange={setPendingClient}
                        placeholder="Select Client"
                        allSelectedText="All Clients"
                      />
                    </div>
                  )}
                  {(activeTab !== "Detailed Report" || pendingClient.length > 0) && (
                    <>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Select Product:</Label>
                    <MultiSelect
                      options={activeTab === "Detailed Report" ? visibleProductOptions : productOptions}
                      selectedValues={pendingProduct}
                      onChange={setPendingProduct}
                      placeholder="Select Product"
                      allSelectedText="All Products"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Select Batch:</Label>
                    <MultiSelect
                      options={visibleBatchOptions}
                      selectedValues={pendingBatch.filter((b) => visibleBatchOptions.includes(b))}
                      onChange={setPendingBatch}
                      placeholder="Select Batch"
                      allSelectedText="All Batches"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Select Material:</Label>
                    <MultiSelect
                      options={activeTab === "Detailed Report" ? visibleMaterialOptions : materialOptions}
                      selectedValues={pendingMaterial}
                      onChange={setPendingMaterial}
                      placeholder="Select Material"
                      allSelectedText="All Materials"
                    />
                  </div>
                    </>
                  )}
                </>
              )}

              {isSsrsTab(activeTab) &&
                ssrsFilterSlots.map((slot) => (
                  <div key={slot.key} className="space-y-1">
                    <Label className="text-xs font-medium">
                      {slot.label}:
                      {filtersLoading && (
                        <Loader2 className="inline h-3 w-3 ml-1 animate-spin" />
                      )}
                    </Label>
                    <MultiSelect
                      options={slot.options}
                      selectedValues={slot.selected}
                      onChange={slot.onChange}
                      placeholder={slot.label.replace("Select ", "")}
                      allSelectedText={`All ${slot.label.replace("Select ", "")}s`}
                    />
                  </div>
                ))}

              <Button
                onClick={applyFilters}
                disabled={loading || filtersLoading || !datesReady}
                className="!bg-[#0088a9] hover:!bg-[#007b98] !text-white h-7 text-sm"
              >
                {(loading || filtersLoading) && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                VIEW
              </Button>
            </div>
            {dataBoundsHint && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{dataBoundsHint}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/95 dark:bg-slate-900/95 border-slate-300 dark:border-slate-700">
          <CardContent className="pt-3 pb-3">
            <div className="flex gap-2 justify-start overflow-x-auto pb-1">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 text-xs rounded-xl font-medium border-2 whitespace-nowrap flex-shrink-0 min-w-[140px] transition-colors
                    ${
                      activeTab === tab
                        ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-cyan-500 shadow-lg"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:border-cyan-400 dark:hover:border-cyan-400"
                    }`}
                  style={{
                    color: activeTab === tab ? "white" : undefined,
                    WebkitTextFillColor: activeTab === tab ? "white" : undefined,
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-end items-center gap-3">
          {activeTab === "Batch Report" && (
            <Button
              type="button"
              onClick={() => setAssignPopupOpen(true)}
              disabled={assigning || !assignBatchOptions.length}
              className="bg-[#0088a9] hover:bg-[#007b98] !text-white text-sm h-9"
            >
              ASSIGN
            </Button>
          )}
          <Button
            onClick={handlePrint}
            disabled={
              activeTab === "Batch Report"
                ? !batchReportTree.length
                : activeTab === "Raw Material Consumption"
                  ? !consumptionTree.length
                  : !displayRows.length
            }
            className="bg-[#0088a9] hover:bg-[#007b98] !text-white text-sm h-9"
          >
            <Printer className="h-4 w-4 mr-2" />
            PRINT
          </Button>
          <Button
            onClick={exportToExcel}
            disabled={
              activeTab === "Batch Report"
                ? !batchReportTree.length
                : activeTab === "Raw Material Consumption"
                  ? !consumptionTree.length
                  : !displayRows.length
            }
            className="bg-[#0088a9] hover:bg-[#007b98] !text-white text-sm h-9"
          >
            <Download className="h-4 w-4 mr-2" />
            EXPORT TO EXCEL
          </Button>
        </div>

        {quantityTotal != null && (
          <p className="text-center text-sm text-slate-600 dark:text-slate-300">
            Total consumption quantity: {quantityTotal.toLocaleString()}
          </p>
        )}

        <Card className="bg-white/95 dark:bg-slate-900/95 border-slate-300 dark:border-slate-700">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-slate-500 dark:text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
                Loading…
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-10 gap-2 text-red-500">
                <AlertCircle className="h-6 w-6" />
                {error}
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase text-xs tracking-wider">
                    <tr>
                      {headers.map((h) => (
                        <th key={h} className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={Math.max(headers.length, 1)} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                          {loading || filtersLoading
                            ? "Loading report…"
                            : "No rows for this date range"}
                        </td>
                      </tr>
                    ) : isExpandableReport ? (
                      paginatedExpandClients.flatMap((clientNode) => {
                        const clientOpen = expandedClients.has(clientNode.client);
                        const extraCols = showBatchTime ? 7 : 6;
                        const rows: React.ReactNode[] = [
                          <tr
                            key={`client-${clientNode.client}`}
                            className="bg-cyan-700 dark:bg-cyan-800 text-white border-b border-cyan-600"
                          >
                            <td className="px-3 py-2 font-semibold whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => toggleClient(clientNode.client)}
                                className="inline-flex items-center justify-center w-5 h-5 mr-2 rounded-sm border border-white/70 bg-white/15"
                                aria-label={clientOpen ? "Collapse client" : "Expand client"}
                              >
                                {clientOpen ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                              </button>
                              {clientNode.client}
                            </td>
                            <td colSpan={extraCols} className="px-3 py-2 text-xs text-white/80">
                              {clientNode.batches.length} batch{clientNode.batches.length === 1 ? "" : "es"}
                            </td>
                          </tr>,
                        ];
                        if (!clientOpen) return rows;
                        clientNode.batches.forEach((batch) => {
                          const batchOpen = expandedBatches.has(batch.key);
                          rows.push(
                            <tr
                              key={`batch-${batch.key}`}
                              className="bg-cyan-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-600"
                            >
                              <td className="px-3 py-2" />
                              <td className="px-3 py-2 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => toggleBatch(batch.key)}
                                  className="inline-flex items-center justify-center w-5 h-5 mr-2 rounded-sm border border-slate-400 bg-white dark:bg-slate-800"
                                  aria-label={batchOpen ? "Collapse batch" : "Expand batch"}
                                >
                                  {batchOpen ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                </button>
                                <span className="font-medium">{batch.batchName}</span>
                                {!showBatchTime && (
                                  <span className="ml-2 text-xs text-slate-500 dark:text-slate-300">{batch.batchTime}</span>
                                )}
                              </td>
                              {showBatchTime && (
                                <td className="px-3 py-2 whitespace-nowrap text-sm">{batch.batchTime}</td>
                              )}
                              <td colSpan={5} className="px-3 py-2" />
                            </tr>
                          );
                          if (!batchOpen) return;
                          batch.materials.forEach((m, mi) => {
                            rows.push(
                              <tr
                                key={`${batch.key}-m-${mi}`}
                                className={`border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 ${
                                  mi % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-900/80"
                                }`}
                              >
                                <td className="px-3 py-2" />
                                <td className="px-3 py-2" />
                                {showBatchTime && <td className="px-3 py-2" />}
                                <td className="px-3 py-2">{m.materialName}</td>
                                <td className="px-3 py-2 font-mono text-xs">{m.materialCode}</td>
                                <td className="px-3 py-2">{fmtNum(m.setPoint)}</td>
                                <td className="px-3 py-2">{fmtNum(m.actual)}</td>
                                <td className="px-3 py-2">
                                  <DiffValue value={m.difference} />
                                </td>
                              </tr>
                            );
                          });
                          rows.push(
                            <tr
                              key={`${batch.key}-total`}
                              className="bg-slate-200 dark:bg-slate-600 font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-300 dark:border-slate-500"
                            >
                              <td className="px-3 py-2" />
                              <td className="px-3 py-2" />
                              {showBatchTime && <td className="px-3 py-2" />}
                              <td className="px-3 py-2">Total</td>
                              <td className="px-3 py-2" />
                              <td className="px-3 py-2">{fmtNum(batch.totalSetPoint)}</td>
                              <td className="px-3 py-2">{fmtNum(batch.totalActual)}</td>
                              <td className="px-3 py-2">
                                <DiffValue value={batch.totalDifference} />
                              </td>
                            </tr>
                          );
                        });
                        return rows;
                      })
                    ) : isGroupedConsumption ? (
                      <>
                        {paginatedConsumptionDates.flatMap((dateNode) => {
                          const dSpan = cumulativeDateSpan(dateNode);
                          let datePrinted = false;
                          const out: React.ReactNode[] = [];
                          for (const recipe of dateNode.recipes) {
                            const rSpan = cumulativeRecipeSpan(recipe);
                            let recipePrinted = false;
                            for (const cat of recipe.orderCats) {
                              cat.materials.forEach((m, mi) => {
                                out.push(
                                  <tr
                                    key={`${dateNode.date}|${recipe.recipe}|${cat.orderCat}|${mi}`}
                                    className="text-slate-800 dark:text-slate-100 bg-emerald-50/70 dark:bg-emerald-950/20"
                                  >
                                    {!datePrinted ? (
                                      <td
                                        rowSpan={dSpan}
                                        className="border border-slate-300 dark:border-slate-600 px-3 py-2 align-top whitespace-nowrap font-medium"
                                      >
                                        {dateNode.date}
                                      </td>
                                    ) : null}
                                    {!recipePrinted ? (
                                      <td
                                        rowSpan={rSpan}
                                        className="border border-slate-300 dark:border-slate-600 px-3 py-2 align-top"
                                      >
                                        {recipe.recipe}
                                      </td>
                                    ) : null}
                                    {mi === 0 ? (
                                      <td
                                        rowSpan={cat.materials.length}
                                        className="border border-slate-300 dark:border-slate-600 px-3 py-2 align-top whitespace-nowrap"
                                      >
                                        {cat.orderCat}
                                      </td>
                                    ) : null}
                                    <td className="border border-slate-300 dark:border-slate-600 px-3 py-2 whitespace-nowrap">
                                      {m.materialLabel}
                                    </td>
                                    <td className="border border-slate-300 dark:border-slate-600 px-3 py-2 whitespace-nowrap text-right">
                                      {fmtNum(m.setPoint)}
                                    </td>
                                    <td className="border border-slate-300 dark:border-slate-600 px-3 py-2 whitespace-nowrap text-right">
                                      {fmtNum(m.actual)}
                                    </td>
                                    <td className="border border-slate-300 dark:border-slate-600 px-3 py-2 whitespace-nowrap text-right">
                                      <DiffValue value={m.difference} />
                                    </td>
                                  </tr>
                                );
                                datePrinted = true;
                                recipePrinted = true;
                              });
                              out.push(
                                <tr
                                  key={`${dateNode.date}|${recipe.recipe}|${cat.orderCat}|total`}
                                  className="bg-slate-200 dark:bg-slate-600 font-semibold text-slate-800 dark:text-slate-100"
                                >
                                  <td className="border border-slate-300 dark:border-slate-600 px-3 py-2">Total</td>
                                  <td className="border border-slate-300 dark:border-slate-600 px-3 py-2" />
                                  <td className="border border-slate-300 dark:border-slate-600 px-3 py-2 whitespace-nowrap text-right">
                                    {fmtNum(cat.totalSetPoint)}
                                  </td>
                                  <td className="border border-slate-300 dark:border-slate-600 px-3 py-2 whitespace-nowrap text-right">
                                    {fmtNum(cat.totalActual)}
                                  </td>
                                  <td className="border border-slate-300 dark:border-slate-600 px-3 py-2 whitespace-nowrap text-right">
                                    <DiffValue value={cat.totalDifference} />
                                  </td>
                                </tr>
                              );
                            }
                          }
                          return out;
                        })}
                        {consumptionTotals && paginatedConsumptionDates.length > 0 && (
                          <tr className="bg-slate-300 dark:bg-slate-500 font-bold text-slate-900 dark:text-white">
                            <td className="border border-slate-400 dark:border-slate-600 px-3 py-2">Total</td>
                            <td className="border border-slate-400 dark:border-slate-600 px-3 py-2" />
                            <td className="border border-slate-400 dark:border-slate-600 px-3 py-2" />
                            <td className="border border-slate-400 dark:border-slate-600 px-3 py-2" />
                            <td className="border border-slate-400 dark:border-slate-600 px-3 py-2 whitespace-nowrap text-right">
                              {fmtNum(consumptionTotals.planned)}
                            </td>
                            <td className="border border-slate-400 dark:border-slate-600 px-3 py-2 whitespace-nowrap text-right">
                              {fmtNum(consumptionTotals.actual)}
                            </td>
                            <td className="border border-slate-400 dark:border-slate-600 px-3 py-2 whitespace-nowrap text-right">
                              <DiffValue value={consumptionTotals.difference} />
                            </td>
                          </tr>
                        )}
                      </>
                    ) : (
                      paginatedRows.map((item, i) => (
                        <tr
                          key={i}
                          className={`border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 ${
                            i % 2 === 0 ? "bg-slate-50 dark:bg-slate-900/80" : "bg-white dark:bg-slate-900"
                          } hover:bg-slate-100 dark:hover:bg-slate-800`}
                        >
                          {renderCells(item).map((cell, ci) => {
                            const isDiff = isDifferenceHeader(headers[ci] || "");
                            return (
                              <td
                                key={ci}
                                className={`px-4 py-2 whitespace-nowrap ${isDiff ? diffToneClass(cell) : ""}`}
                              >
                                {isDiff ? fmtDiff(cell) : cell}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                    {activeTab === "Raw Material Cumulative" &&
                      paginatedRows.length > 0 &&
                      cumulativeTotals && (
                        <tr className="bg-slate-200 dark:bg-slate-600 font-semibold text-slate-800 dark:text-slate-100 border-t-2 border-slate-400 dark:border-slate-500">
                          <td className="px-4 py-2">Total</td>
                          <td className="px-4 py-2" />
                          <td className="px-4 py-2 whitespace-nowrap">{fmtNum(cumulativeTotals.planned)}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{fmtNum(cumulativeTotals.actual)}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <DiffValue value={cumulativeTotals.difference} />
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                  <div className="flex items-center gap-2 text-sm">
                    <span>
                      {isExpandableReport
                        ? "Clients per page:"
                        : isGroupedConsumption
                          ? "Dates per page:"
                          : "Rows per page:"}
                    </span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    >
                      {[10, 25, 50, 100, 200, 500, 1000, -1].map((n) => (
                        <option key={n} value={n}>
                          {n === -1 ? "Show All" : n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-100"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {isExpandableReport
                        ? `Page ${currentPage} of ${totalPages} (${expandTree.length} clients)`
                        : isGroupedConsumption
                          ? `Page ${currentPage} of ${totalPages} (${consumptionTree.length} dates)`
                          : `Page ${currentPage} of ${totalPages} (${displayRows.length} total items)`}
                    </span>
                    <Button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-100"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </WaterSystemLayout>
  );
}
