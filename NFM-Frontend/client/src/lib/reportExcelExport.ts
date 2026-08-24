import ExcelJS from "exceljs";
import { getReportLogoDataUrls } from "@/lib/reportBranding";

export type ExcelRowKind = "normal" | "client" | "batch" | "total";

export type ExcelDataRow = {
  values: (string | number)[];
  kind?: ExcelRowKind;
};

/** 0-based row/col offsets relative to the first data row */
export type ExcelMerge = { r1: number; c1: number; r2: number; c2: number };

function dataUrlToBase64(dataUrl: string): { base64: string; extension: "png" | "jpeg" } | null {
  const m = /^data:image\/(png|jpeg|jpg);base64,(.+)$/i.exec(dataUrl);
  if (!m) return null;
  const ext = m[1].toLowerCase() === "png" ? "png" : "jpeg";
  return { base64: m[2], extension: ext };
}

/** Save As dialog (Chrome/Edge) or anchor download fallback (Firefox, etc.). */
async function saveExcelBlob(
  blob: Blob,
  fileName: string
): Promise<{ savedPath: string | null; cancelled: boolean }> {
  const w = window as Window & {
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{ description?: string; accept: Record<string, string[]> }>;
    }) => Promise<{
      name: string;
      createWritable: () => Promise<{
        write: (data: Blob) => Promise<void>;
        close: () => Promise<void>;
      }>;
    }>;
  };

  if (typeof w.showSaveFilePicker === "function") {
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: "Excel workbook",
            accept: {
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return { savedPath: handle.name || fileName, cancelled: false };
    } catch (e: unknown) {
      const err = e as { name?: string };
      if (err?.name === "AbortError" || err?.name === "NotAllowedError") {
        return { savedPath: null, cancelled: true };
      }
      throw e;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return { savedPath: fileName, cancelled: false };
}

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FF94A3B8" } },
  left: { style: "thin", color: { argb: "FF94A3B8" } },
  bottom: { style: "thin", color: { argb: "FF94A3B8" } },
  right: { style: "thin", color: { argb: "FF94A3B8" } },
};

function styleDataCell(cell: ExcelJS.Cell, kind: ExcelRowKind | "header", even: boolean) {
  cell.border = thinBorder;
  cell.alignment = { vertical: "middle", wrapText: true };
  if (kind === "header") {
    cell.font = { bold: true, color: { argb: "FF1E293B" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    return;
  }
  if (kind === "client") {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0E7490" } };
    return;
  }
  if (kind === "batch") {
    cell.font = { bold: true, color: { argb: "FF1E293B" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECFEFF" } };
    return;
  }
  if (kind === "total") {
    cell.font = { bold: true, color: { argb: "FF1E293B" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    return;
  }
  cell.font = { size: 10, color: { argb: "FF1E293B" } };
  if (even) {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
  }
}

export async function downloadReportExcel(opts: {
  title: string;
  generatedOn: string;
  dateRange: string;
  headers: string[];
  rows: ExcelDataRow[];
  merges?: ExcelMerge[];
  fileName?: string;
}) {
  const colCount = Math.max(opts.headers.length, 1);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PureBreed Reporting";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(opts.title.slice(0, 31) || "Report", {
    views: [{ showGridLines: false }],
  });

  // Logo / header band (rows 1-3)
  sheet.mergeCells(1, 1, 3, Math.max(1, Math.floor(colCount / 2)));
  sheet.mergeCells(1, Math.max(2, Math.floor(colCount / 2) + 1), 3, colCount);
  sheet.getRow(1).height = 28;
  sheet.getRow(2).height = 28;
  sheet.getRow(3).height = 28;

  try {
    const logos = await getReportLogoDataUrls();
    const hercules = dataUrlToBase64(logos.hercules);
    const pureBreed = dataUrlToBase64(logos.pureBreed);
    const asm = dataUrlToBase64(logos.asm);

    if (hercules) {
      const id = workbook.addImage({
        base64: hercules.base64,
        extension: hercules.extension,
      });
      sheet.addImage(id, {
        tl: { col: 0, row: 0.15 },
        ext: { width: 120, height: 52 },
      });
    }
    if (pureBreed) {
      const id = workbook.addImage({
        base64: pureBreed.base64,
        extension: pureBreed.extension,
      });
      const startCol = Math.max(colCount - 2.6, 1);
      sheet.addImage(id, {
        tl: { col: startCol, row: 0.1 },
        ext: { width: 90, height: 70 },
      });
    }
    if (asm) {
      const id = workbook.addImage({
        base64: asm.base64,
        extension: asm.extension,
      });
      sheet.addImage(id, {
        tl: { col: Math.max(colCount - 1.15, 2), row: 0.2 },
        ext: { width: 110, height: 55 },
      });
    }
  } catch {
    // Logos optional — continue without them
  }

  // Teal separator
  let rowIdx = 4;
  sheet.mergeCells(rowIdx, 1, rowIdx, colCount);
  const lineCell = sheet.getCell(rowIdx, 1);
  lineCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0E7490" } };
  sheet.getRow(rowIdx).height = 6;
  rowIdx += 1;

  // Title
  sheet.mergeCells(rowIdx, 1, rowIdx, colCount);
  const titleCell = sheet.getCell(rowIdx, 1);
  titleCell.value = opts.title;
  titleCell.font = { bold: true, size: 18, color: { argb: "FF0E7490" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(rowIdx).height = 26;
  rowIdx += 1;

  // Generated on
  sheet.mergeCells(rowIdx, 1, rowIdx, colCount);
  const genCell = sheet.getCell(rowIdx, 1);
  genCell.value = `Generated on: ${opts.generatedOn}`;
  genCell.font = { size: 10, color: { argb: "FF64748B" } };
  genCell.alignment = { horizontal: "center" };
  rowIdx += 1;

  // Filters box
  sheet.mergeCells(rowIdx, 1, rowIdx, colCount);
  const filterTitle = sheet.getCell(rowIdx, 1);
  filterTitle.value = "Report Filters";
  filterTitle.font = { bold: true, size: 11, color: { argb: "FF1E3A5F" } };
  filterTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  rowIdx += 1;
  sheet.mergeCells(rowIdx, 1, rowIdx, colCount);
  const filterRange = sheet.getCell(rowIdx, 1);
  filterRange.value = `Date Range: ${opts.dateRange}`;
  filterRange.font = { size: 10, color: { argb: "FF1E293B" } };
  filterRange.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  rowIdx += 2;

  // Column headers
  const headerRow = sheet.getRow(rowIdx);
  opts.headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    styleDataCell(cell, "header", false);
  });
  headerRow.height = 20;
  rowIdx += 1;
  const dataStartRow = rowIdx;

  // Data rows
  let dataIndex = 0;
  for (const row of opts.rows) {
    const excelRow = sheet.getRow(rowIdx);
    const kind = row.kind || "normal";
    const values = [...row.values];
    while (values.length < colCount) values.push("");
    values.slice(0, colCount).forEach((v, i) => {
      const cell = excelRow.getCell(i + 1);
      cell.value = v;
      styleDataCell(cell, kind, dataIndex % 2 === 1);
      if (i >= colCount - 3 && kind !== "client" && kind !== "batch") {
        cell.alignment = { vertical: "middle", horizontal: "right", wrapText: true };
      }
      const header = String(opts.headers[i] || "");
      if (
        /difference|err\s*(kg|%)?/i.test(header) &&
        kind !== "client" &&
        kind !== "batch"
      ) {
        const n = Number(v);
        if (Number.isFinite(n)) {
          cell.font = {
            ...(typeof cell.font === "object" && cell.font ? cell.font : {}),
            color: { argb: Math.abs(n) > 5 ? "FFDC2626" : "FF16A34A" },
            bold: true,
          };
        }
      }
    });
    excelRow.height = kind === "client" || kind === "batch" ? 18 : 16;
    rowIdx += 1;
    dataIndex += 1;
  }

  for (const m of opts.merges || []) {
    const sr = dataStartRow + m.r1;
    const er = dataStartRow + m.r2;
    const sc = m.c1 + 1;
    const ec = m.c2 + 1;
    if (er > sr || ec > sc) {
      try {
        sheet.mergeCells(sr, sc, er, ec);
        const cell = sheet.getCell(sr, sc);
        cell.alignment = { vertical: "top", horizontal: "left", wrapText: true };
      } catch {
        /* skip invalid merge */
      }
    }
  }

  // Column widths
  for (let i = 1; i <= colCount; i++) {
    let maxLen = String(opts.headers[i - 1] || "").length;
    for (const row of opts.rows) {
      const v = row.values[i - 1];
      maxLen = Math.max(maxLen, String(v ?? "").length);
    }
    sheet.getColumn(i).width = Math.min(Math.max(maxLen + 2, 12), 42);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = opts.fileName || `${opts.title.replace(/\s+/g, "_")}.xlsx`;
  const blob = new Blob([buffer as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // 1) Save As dialog (Chrome/Edge) or browser download fallback
  let savedPath: string | null = null;
  let saveError: string | null = null;
  let cancelled = false;
  try {
    const local = await saveExcelBlob(blob, fileName);
    if (local.cancelled) {
      cancelled = true;
      return { savedPath: null, fileName, saveError: null, cancelled: true };
    }
    savedPath = local.savedPath;
  } catch (e: any) {
    saveError = e?.message || "Could not save file";
    return { savedPath: null, fileName, saveError, cancelled: false };
  }

  // 2) Also copy to F:\Purebreed_reports\… when the API is available (best-effort)
  try {
    const { API_ENDPOINTS } = await import("@/lib/api");
    const form = new FormData();
    form.append("file", blob, fileName);
    form.append("reportType", opts.title);
    form.append("fileName", fileName);
    const res = await fetch(API_ENDPOINTS.REPORT_EXPORT_SAVE, {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.path) {
      // Prefer showing the server archive path when both succeed
      savedPath = String(data.path);
    }
  } catch {
    /* F: archive is optional when Save As already succeeded */
  }

  return { savedPath, fileName, saveError, cancelled };
}

export function buildBatchHierarchyExcelRows(
  tree: Array<{
    client: string;
    batches: Array<{
      batchName: string;
      batchTime: string;
      materials: Array<{
        materialName: string;
        materialCode: string;
        setPoint: number;
        actual: number;
        difference: number;
      }>;
      totalSetPoint: number;
      totalActual: number;
      totalDifference: number;
    }>;
  }>,
  fmtNum: (v: unknown, digits?: number) => string
): { headers: string[]; rows: ExcelDataRow[] } {
  const headers = [
    "Client",
    "Batch Name",
    "Batch Time",
    "Material Name",
    "Material Code",
    "SetPoint",
    "Actual",
    "Difference",
  ];
  const rows: ExcelDataRow[] = [];
  for (const clientNode of tree) {
    rows.push({
      kind: "client",
      values: [
        `${clientNode.client} (${clientNode.batches.length} batch${clientNode.batches.length === 1 ? "" : "es"})`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
    });
    for (const batch of clientNode.batches) {
      rows.push({
        kind: "batch",
        values: ["", batch.batchName, batch.batchTime, "", "", "", "", ""],
      });
      for (const m of batch.materials) {
        rows.push({
          kind: "normal",
          values: [
            "",
            "",
            "",
            m.materialName,
            m.materialCode,
            fmtNum(m.setPoint),
            fmtNum(m.actual),
            fmtNum(m.difference),
          ],
        });
      }
      rows.push({
        kind: "total",
        values: [
          "",
          "",
          "",
          "Total",
          "",
          fmtNum(batch.totalSetPoint),
          fmtNum(batch.totalActual),
          fmtNum(batch.totalDifference),
        ],
      });
    }
  }
  return { headers, rows };
}

export function buildConsumptionHierarchyExcelRows(
  tree: Array<{
    date: string;
    recipes: Array<{
      recipe: string;
      orderCats: Array<{
        orderCat: string;
        materials: Array<{
          materialLabel: string;
          setPoint: number;
          actual: number;
          difference: number;
        }>;
        totalSetPoint: number;
        totalActual: number;
        totalDifference: number;
      }>;
    }>;
  }>,
  fmtNum: (v: unknown, digits?: number) => string,
  grandTotal?: { planned: number; actual: number; difference: number } | null
): { headers: string[]; rows: ExcelDataRow[]; merges: ExcelMerge[] } {
  const headers = ["Date", "Recipes", "Client Name", "Material", "Set Point", "Actual", "Difference"];
  const rows: ExcelDataRow[] = [];
  const merges: ExcelMerge[] = [];

  for (const dateNode of tree) {
    const dateStart = rows.length;
    for (const recipe of dateNode.recipes) {
      const recipeStart = rows.length;
      for (const cat of recipe.orderCats) {
        const catStart = rows.length;
        for (let mi = 0; mi < cat.materials.length; mi++) {
          const m = cat.materials[mi];
          rows.push({
            kind: "normal",
            values: [
              rows.length === dateStart ? dateNode.date : "",
              rows.length === recipeStart ? recipe.recipe : "",
              mi === 0 ? cat.orderCat : "",
              m.materialLabel,
              fmtNum(m.setPoint),
              fmtNum(m.actual),
              fmtNum(m.difference),
            ],
          });
        }
        const catEnd = rows.length - 1;
        if (catEnd > catStart) {
          merges.push({ r1: catStart, c1: 2, r2: catEnd, c2: 2 });
        }
        rows.push({
          kind: "total",
          values: [
            "",
            "",
            "Total",
            "",
            fmtNum(cat.totalSetPoint),
            fmtNum(cat.totalActual),
            fmtNum(cat.totalDifference),
          ],
        });
      }
      const recipeEnd = rows.length - 1;
      if (recipeEnd > recipeStart) {
        merges.push({ r1: recipeStart, c1: 1, r2: recipeEnd, c2: 1 });
      }
    }
    const dateEnd = rows.length - 1;
    if (dateEnd > dateStart) {
      merges.push({ r1: dateStart, c1: 0, r2: dateEnd, c2: 0 });
    }
  }

  if (grandTotal) {
    rows.push({
      kind: "total",
      values: [
        "Total",
        "",
        "",
        "",
        fmtNum(grandTotal.planned),
        fmtNum(grandTotal.actual),
        fmtNum(grandTotal.difference),
      ],
    });
  }

  return { headers, rows, merges };
}

