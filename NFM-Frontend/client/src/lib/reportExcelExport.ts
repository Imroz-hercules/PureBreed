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

/** True when browser allows File System Access (Save As). */
export function canUseSavePicker(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  const isLocalhostFamily =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host.endsWith(".localhost");
  return (
    window.isSecureContext ||
    window.location.protocol === "https:" ||
    isLocalhostFamily
  );
}

/** Build a .bat that opens Edge/Chrome with Save As enabled for this server IP. */
export function buildLanOpenerBatContent(serverIp?: string): string {
  const host = (serverIp || (typeof window !== "undefined" ? window.location.hostname : "192.168.1.3")).trim();
  const ip = /^[\d.]+$/.test(host) ? host : "192.168.1.3";
  const origin = `http://${ip}:5180`;
  return [
    "@echo off",
    "title PureBreed LAN — Save As enabled",
    "setlocal",
    `set "ORIGIN=${origin}"`,
    'set "URL=%ORIGIN%/"',
    'set "DATA=%LOCALAPPDATA%\\PureBreedBrowser"',
    "echo.",
    "echo Opening PureBreed with Export Save As enabled...",
    "echo   %URL%",
    "echo.",
    "echo Close PureBreed in normal Edge/Chrome. Use ONLY this new window.",
    "echo.",
    'set "EDGE="',
    'if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" set "EDGE=%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe"',
    'if not defined EDGE if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" set "EDGE=%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"',
    'set "CHROME="',
    'if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" set "CHROME=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"',
    'if not defined CHROME if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" set "CHROME=%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"',
    "if defined EDGE (",
    '  "%EDGE%" --user-data-dir="%DATA%\\edge" --no-first-run --no-default-browser-check --unsafely-treat-insecure-origin-as-secure=%ORIGIN% "%URL%"',
    "  exit /b 0",
    ")",
    "if defined CHROME (",
    '  "%CHROME%" --user-data-dir="%DATA%\\chrome" --no-first-run --no-default-browser-check --unsafely-treat-insecure-origin-as-secure=%ORIGIN% "%URL%"',
    "  exit /b 0",
    ")",
    "echo ERROR: Install Google Chrome or Microsoft Edge, then run this file again.",
    "pause",
    "exit /b 1",
    "",
  ].join("\r\n");
}

export function downloadLanOpenerBat(serverIp?: string) {
  const content = buildLanOpenerBatContent(serverIp);
  const blob = new Blob([content], { type: "application/x-bat" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "open-purebreed-lan.bat";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Save As dialog when allowed; otherwise Downloads folder. */
async function saveExcelBlob(
  blob: Blob,
  fileName: string
): Promise<{ savedPath: string | null; cancelled: boolean; usedPicker: boolean }> {
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

  // Prefer picker whenever the API exists (Chrome flag / secure context)
  if (typeof w.showSaveFilePicker === "function" && canUseSavePicker()) {
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
      return { savedPath: handle.name || fileName, cancelled: false, usedPicker: true };
    } catch (e: unknown) {
      const err = e as { name?: string };
      if (err?.name === "AbortError" || err?.name === "NotAllowedError") {
        return { savedPath: null, cancelled: true, usedPicker: true };
      }
      throw e;
    }
  }

  // Last resort: try picker even if isSecureContext is false (flagged Chromium builds)
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
      return { savedPath: handle.name || fileName, cancelled: false, usedPicker: true };
    } catch {
      /* fall through to Downloads */
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
  return { savedPath: fileName, cancelled: false, usedPicker: false };
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
  let usedPicker = false;
  try {
    const local = await saveExcelBlob(blob, fileName);
    usedPicker = local.usedPicker;
    if (local.cancelled) {
      return { savedPath: null, fileName, saveError: null, cancelled: true, usedPicker: true };
    }
    savedPath = local.savedPath;
  } catch (e: any) {
    saveError = e?.message || "Could not save file";
    return { savedPath: null, fileName, saveError, cancelled: false, usedPicker: false };
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

  return { savedPath, fileName, saveError, cancelled, usedPicker };
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

