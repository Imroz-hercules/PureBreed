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
} from "lucide-react";
import axios from "axios";
import { API_ENDPOINTS, buildApiUrl } from "@/lib/api";

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

/** Visible tabs: SSRS reports plus Detailed Report (other legacy tabs stay in code but hidden) */
const tabs = [...SSRS_TABS, "Detailed Report"] as const;
type TabName = (typeof LEGACY_TABS)[number] | (typeof SSRS_TABS)[number];

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
  start.setDate(start.getDate() - 14);
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
      return ["Batch", "Material Name", "Code", "Set Point", "Actual", "Err Kg", "Err %"];
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
    case "Raw Material Cumulative":
      return [
        "Order Category",
        "Batch End",
        "Date",
        "Recipe",
        "Formula",
        "Batch Qty",
        "Material Name",
        "Material Code",
        "SetPoint",
        "Actual",
        "Difference",
      ];
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

function buildDetailedGroups(data: LegacyRow[]): LegacyRow[][] {
  const groups: Record<string, LegacyRow[]> = {};
  data.forEach((item) => {
    const key = item.batchGuid || `${item.batchName}__${item.productName}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return Object.values(groups).map((group) => {
    const totalSetPoint = group.reduce((s, i) => s + (i.setPointFloat || 0), 0);
    const totalActual = group.reduce((s, i) => s + (i.actualValueFloat || 0), 0);
    const errKg = Math.abs(totalActual - totalSetPoint);
    const errPercent = totalSetPoint !== 0 ? (errKg / totalSetPoint) * 100 : 0;
    const materials = group.map((item) => {
      const rowErr = Math.abs((item.actualValueFloat || 0) - (item.setPointFloat || 0));
      const rowPct =
        item.setPointFloat !== 0 ? (rowErr / Math.abs(item.setPointFloat)) * 100 : 0;
      return { ...item, errKg: rowErr, errPercent: rowPct };
    });
    const totalRow: LegacyRow = {
      ...group[0],
      materialName: "Total",
      materialCode: "",
      setPointFloat: totalSetPoint,
      actualValueFloat: totalActual,
      errKg,
      errPercent,
      isTotal: true,
    };
    return [...materials, totalRow];
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

  const [ssrsFilter1Options, setSsrsFilter1Options] = useState<string[]>([]);
  const [ssrsFilter2Options, setSsrsFilter2Options] = useState<string[]>([]);
  const [ssrsFilter3Options, setSsrsFilter3Options] = useState<string[]>([]);
  const [ssrsFilter1, setSsrsFilter1] = useState<string[]>([]);
  const [ssrsFilter2, setSsrsFilter2] = useState<string[]>([]);
  const [ssrsFilter3, setSsrsFilter3] = useState<string[]>([]);
  const [batchLabelToGuid, setBatchLabelToGuid] = useState<Record<string, string>>({});

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
          const end = new Date(maxD);
          end.setHours(23, 0, 0, 0);
          const start = new Date(maxD);
          start.setDate(start.getDate() - 30);
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
      setPendingProduct(products);
      setPendingBatch(batches);
      setPendingMaterial(materials);
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || "Failed to load filters");
    } finally {
      setFiltersLoading(false);
    }
  }, [pendingStartDate, pendingEndDate]);

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
        setSsrsFilter1(list.length ? [list[0]] : []);
        setSsrsFilter2Options([]);
        setSsrsFilter3Options([]);
        setSsrsFilter2([]);
        setSsrsFilter3([]);
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
    }
  }, [activeTab, pendingStartDate, pendingEndDate]);

  useEffect(() => {
    if (!datesReady) return;
    setLegacyRows([]);
    setSsrsRows([]);
    setQuantityTotal(null);
    setError(null);
    setCurrentPage(1);
    const t = window.setTimeout(() => {
      if (isSsrsTab(activeTab)) loadSsrsFilters();
      else loadLegacyFilters();
    }, 300);
    return () => window.clearTimeout(t);
  }, [activeTab, pendingStartDate, pendingEndDate, datesReady, loadLegacyFilters, loadSsrsFilters]);

  // Batch report cascade
  useEffect(() => {
    if (activeTab !== "Batch Report" || ssrsFilter1.length === 0 || !datesReady) return;
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
        const list = (res.data.recipes || [])
          .map((r: { Batch_RecpName: string }) => r.Batch_RecpName)
          .filter(Boolean);
        setSsrsFilter2Options(list);
        setSsrsFilter2(list);
      })
      .catch(() => {
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
    )
      return;
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
          recipe: ssrsFilter2.join(","),
        }),
        { timeout: LARGE_REPORT_TIMEOUT_MS }
      )
      .then((res) => {
        const map: Record<string, string> = {};
        const labels: string[] = [];
        for (const b of res.data.batches || []) {
          const guid = String(b.Batch_OGUID);
          const label = `${b.Batch_Name || "Batch"} (${guid.slice(0, 8)}…)`;
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
  }, [activeTab, ssrsFilter1, ssrsFilter2, pendingStartDate, pendingEndDate, datesReady]);

  const fetchLegacyReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        startDate: pendingStartDate,
        endDate: pendingEndDate,
        page: 1,
        limit: 300000,
      };
      const url = buildApiUrl(API_ENDPOINTS.KPI, params);
      // axios get with array params
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
      void url;
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
      setLegacyRows(rows);
      setSsrsRows([]);
      showToast(`Loaded ${rows.length} rows`, "success");
    } catch (e: any) {
      const msg = e?.response?.data?.error || e.message || "Report failed";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSsrsReport = async () => {
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
        setSsrsRows(res.data.data || []);
      } else if (activeTab === "Raw Material Consumption") {
        if (!ssrsFilter1.length) throw new Error("Select at least one product");
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
        setSsrsRows(main.data.data || []);
        setQuantityTotal(qty.data.totalQuantity ?? null);
      } else if (activeTab === "Raw Material Cumulative") {
        if (!ssrsFilter3.length) throw new Error("Select at least one material");
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
        setSsrsRows(main.data.data || []);
        setQuantityTotal(qty.data.totalQuantity ?? null);
      } else if (activeTab === "Batch Report") {
        if (!ssrsFilter1.length || !ssrsFilter3.length) {
          throw new Error("Select client(s) and batch(es)");
        }
        const guids = ssrsFilter3.map((l) => batchLabelToGuid[l] || l);
        const res = await axios.get(
          buildApiUrl(API_ENDPOINTS.BATCH_REPORT, {
            ...range,
            clients: ssrsFilter1.join(","),
            batch: guids.join(","),
          }),
          { timeout: LARGE_REPORT_TIMEOUT_MS }
        );
        setSsrsRows(res.data.data || []);
      }
      setLegacyRows([]);
      showToast("Report loaded", "success");
    } catch (e: any) {
      const msg = e?.response?.data?.error || e.message || "Report failed";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setAppliedStartDate(pendingStartDate);
    setAppliedEndDate(pendingEndDate);
    setCurrentPage(1);
    if (isSsrsTab(activeTab)) fetchSsrsReport();
    else fetchLegacyReport();
  };

  const detailedGroups = useMemo(() => {
    if (activeTab !== "Detailed Report") return [] as LegacyRow[][];
    return buildDetailedGroups(legacyRows);
  }, [activeTab, legacyRows]);

  const displayRows = useMemo(() => {
    if (isSsrsTab(activeTab)) return ssrsRows;
    if (activeTab === "Detailed Report") {
      return detailedGroups.flat();
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
  }, [activeTab, legacyRows, ssrsRows, detailedGroups]);

  const headers = getTableHeaders(activeTab);

  const paginatedDetailedGroups = useMemo(() => {
    if (activeTab !== "Detailed Report") return [] as LegacyRow[][];
    if (rowsPerPage === -1) return detailedGroups;
    const start = (currentPage - 1) * rowsPerPage;
    return detailedGroups.slice(start, start + rowsPerPage);
  }, [activeTab, detailedGroups, currentPage, rowsPerPage]);

  const paginatedRows = useMemo(() => {
    if (activeTab === "Detailed Report") return paginatedDetailedGroups.flat();
    if (rowsPerPage === -1) return displayRows;
    const start = (currentPage - 1) * rowsPerPage;
    return displayRows.slice(start, start + rowsPerPage);
  }, [activeTab, displayRows, currentPage, rowsPerPage, paginatedDetailedGroups]);

  const totalPages =
    activeTab === "Detailed Report"
      ? rowsPerPage === -1
        ? 1
        : Math.max(1, Math.ceil(detailedGroups.length / Math.max(rowsPerPage, 1)))
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
        case "Raw Material Consumption":
        case "Raw Material Cumulative":
          return [
            String(item.OrderCat_Name ?? "—"),
            formatDisplayDate(item.Batch_ActEnd),
            String(item.Date ?? "—"),
            String(item.Batch_RecpName ?? "—"),
            String(item.Batch_FormulaName ?? "—"),
            fmtNum(item.Batch_Quantity),
            String(item.Material_Name ?? "—"),
            String(item.Material_Code ?? "—"),
            fmtNum(item.SetPoint),
            fmtNum(item.Actual),
            fmtNum(item.Diffrence),
          ];
        case "Batch Report":
          return [
            String(item.OrderCat_Name ?? "—"),
            String(item.Batch_Name ?? "—"),
            formatDisplayDate(item.BatchTime ?? item.Batch_ActEnd),
            String(item.Material_Name ?? "—"),
            String(item.Material_Code ?? "—"),
            fmtNum(item.SetPoint),
            fmtNum(item.Actual),
            fmtNum(item.Diffrence),
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
        fmtNum(item.errKg),
        fmtNum(item.errPercent),
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
        fmtNum(item.diffPercent),
      ];
    }
    if (activeTab === "Detailed Report") {
      const errKg =
        item.errKg ??
        Math.abs((item.actualValueFloat || 0) - (item.setPointFloat || 0));
      const errPercent =
        item.errPercent ??
        (item.setPointFloat
          ? (errKg / Math.abs(item.setPointFloat)) * 100
          : 0);
      return [
        item.isTotal ? "" : item.batchName,
        item.materialName,
        item.materialCode,
        fmtNum(item.setPointFloat),
        fmtNum(item.actualValueFloat),
        fmtNum(errKg),
        fmtNum(errPercent),
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

  const exportToCSV = () => {
    if (!displayRows.length) {
      showToast("No data to export", "error");
      return;
    }
    const lines = [
      headers.join(","),
      ...displayRows.map((row) =>
        renderCells(row)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTab.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!displayRows.length) {
      showToast("No data to print", "error");
      return;
    }
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>${activeTab}</title></head><body>
      <h1>${activeTab}</h1>
      <p>${appliedStartDate} → ${appliedEndDate}</p>
      <table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;font-size:11px;width:100%">
        <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${displayRows
          .map((r) => `<tr>${renderCells(r).map((c) => `<td>${c}</td>`).join("")}</tr>`)
          .join("")}</tbody>
      </table></body></html>`);
    w.document.close();
    w.print();
  };

  const ssrsFilterSlots =
    activeTab === "Raw Material Consumption"
      ? [{ key: "f1" as const, label: "Select Product", options: ssrsFilter1Options, selected: ssrsFilter1, onChange: setSsrsFilter1 }]
      : activeTab === "Raw Material Cumulative"
        ? [{ key: "f3" as const, label: "Select Material", options: ssrsFilter3Options, selected: ssrsFilter3, onChange: setSsrsFilter3 }]
        : activeTab === "Batch Report"
          ? [
              { key: "f1" as const, label: "Select Client", options: ssrsFilter1Options, selected: ssrsFilter1, onChange: setSsrsFilter1 },
              { key: "f2" as const, label: "Select Recipe", options: ssrsFilter2Options, selected: ssrsFilter2, onChange: setSsrsFilter2 },
              { key: "f3" as const, label: "Select Batch", options: ssrsFilter3Options, selected: ssrsFilter3, onChange: setSsrsFilter3 },
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
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Select Product:</Label>
                    <MultiSelect
                      options={productOptions}
                      selectedValues={pendingProduct}
                      onChange={setPendingProduct}
                      placeholder="Select Product"
                      allSelectedText="All Products"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Select Batch:</Label>
                    <MultiSelect
                      options={batchOptions}
                      selectedValues={pendingBatch}
                      onChange={setPendingBatch}
                      placeholder="Select Batch"
                      allSelectedText="All Batches"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Select Material:</Label>
                    <MultiSelect
                      options={materialOptions}
                      selectedValues={pendingMaterial}
                      onChange={setPendingMaterial}
                      placeholder="Select Material"
                      allSelectedText="All Materials"
                    />
                  </div>
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

        <div className="flex justify-end gap-3">
          <Button
            onClick={handlePrint}
            disabled={!displayRows.length}
            className="bg-[#0088a9] hover:bg-[#007b98] !text-white text-sm"
          >
            <Printer className="h-4 w-4 mr-2" />
            PRINT
          </Button>
          <Button
            onClick={exportToCSV}
            disabled={!displayRows.length}
            className="bg-[#0088a9] hover:bg-[#007b98] !text-white text-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            EXPORT TO CSV
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
                          No rows — set dates in the available range and click VIEW
                        </td>
                      </tr>
                    ) : activeTab === "Detailed Report" ? (
                      paginatedDetailedGroups.flatMap((group, groupIdx) => {
                        const materialRows = group.filter((r) => !r.isTotal);
                        const totalRow = group.find((r) => r.isTotal);
                        const rowSpan = Math.max(1, materialRows.length);
                        return [
                          ...materialRows.map((item, i) => (
                            <tr
                              key={`${groupIdx}-${i}`}
                              className={`border-b border-slate-200 dark:border-slate-700 ${
                                i % 2 === 0 ? "bg-slate-50 dark:bg-slate-900/80" : "bg-white dark:bg-slate-900"
                              }`}
                            >
                              {i === 0 && (
                                <td
                                  rowSpan={rowSpan}
                                  className="px-4 py-2 align-top bg-slate-100 dark:bg-slate-800 text-sm border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                                >
                                  <div className="space-y-1.5 min-w-[160px]">
                                    <div>
                                      <div className="text-cyan-700 dark:text-cyan-400 font-bold text-[10px] uppercase">Batch</div>
                                      <div className="font-medium">{item.batchName}</div>
                                    </div>
                                    <div>
                                      <div className="text-cyan-700 dark:text-cyan-400 font-bold text-[10px] uppercase">Product</div>
                                      <div>{item.productName}</div>
                                    </div>
                                    <div>
                                      <div className="text-cyan-700 dark:text-cyan-400 font-bold text-[10px] uppercase">Started</div>
                                      <div>{formatDisplayDate(item.batchStart)}</div>
                                    </div>
                                    <div>
                                      <div className="text-cyan-700 dark:text-cyan-400 font-bold text-[10px] uppercase">Ended</div>
                                      <div>{formatDisplayDate(item.batchEnd)}</div>
                                    </div>
                                    <div>
                                      <div className="text-cyan-700 dark:text-cyan-400 font-bold text-[10px] uppercase">Quantity</div>
                                      <div>{fmtNum(item.batchQuantity)}</div>
                                    </div>
                                  </div>
                                </td>
                              )}
                              <td className="px-4 py-2 text-slate-800 dark:text-slate-100">{item.materialName}</td>
                              <td className="px-4 py-2 font-mono text-xs text-slate-800 dark:text-slate-100">{item.materialCode}</td>
                              <td className="px-4 py-2 text-slate-800 dark:text-slate-100">{fmtNum(item.setPointFloat)}</td>
                              <td className="px-4 py-2 text-slate-800 dark:text-slate-100">{fmtNum(item.actualValueFloat)}</td>
                              <td className="px-4 py-2 text-slate-800 dark:text-slate-100">{fmtNum(item.errKg)}</td>
                              <td
                                className={`px-4 py-2 font-medium ${
                                  (item.errPercent ?? 0) < 5 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {fmtNum(item.errPercent)}
                              </td>
                            </tr>
                          )),
                          totalRow ? (
                            <tr
                              key={`${groupIdx}-total`}
                              className="bg-slate-200 dark:bg-slate-700 font-semibold border-b border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100"
                            >
                              <td className="px-4 py-2" />
                              <td className="px-4 py-2">Total</td>
                              <td className="px-4 py-2" />
                              <td className="px-4 py-2">{fmtNum(totalRow.setPointFloat)}</td>
                              <td className="px-4 py-2">{fmtNum(totalRow.actualValueFloat)}</td>
                              <td className="px-4 py-2">{fmtNum(totalRow.errKg)}</td>
                              <td
                                className={`px-4 py-2 ${
                                  (totalRow.errPercent ?? 0) < 5 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {fmtNum(totalRow.errPercent)}
                              </td>
                            </tr>
                          ) : null,
                        ];
                      })
                    ) : (
                      paginatedRows.map((item, i) => (
                        <tr
                          key={i}
                          className={`border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 ${
                            i % 2 === 0 ? "bg-slate-50 dark:bg-slate-900/80" : "bg-white dark:bg-slate-900"
                          } hover:bg-slate-100 dark:hover:bg-slate-800`}
                        >
                          {renderCells(item).map((cell, ci) => (
                            <td key={ci} className="px-4 py-2 whitespace-nowrap">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                  <div className="flex items-center gap-2 text-sm">
                    <span>
                      {activeTab === "Detailed Report" ? "Batches per page:" : "Rows per page:"}
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
                      {activeTab === "Detailed Report"
                        ? `Page ${currentPage} of ${totalPages} (${detailedGroups.length} batches)`
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
