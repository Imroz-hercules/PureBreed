import ExcelJS from "exceljs";
import { getReportLogoDataUrls } from "@/lib/reportBranding";

export type ExcelRowKind = "normal" | "client" | "batch" | "total";

export type ExcelDataRow = {
  values: (string | number)[];
  kind?: ExcelRowKind;
};

function dataUrlToBase64(dataUrl: string): { base64: string; extension: "png" | "jpeg" } | null {
  const m = /^data:image\/(png|jpeg|jpg);base64,(.+)$/i.exec(dataUrl);
  if (!m) return null;
  const ext = m[1].toLowerCase() === "png" ? "png" : "jpeg";
  return { base64: m[2], extension: ext };
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
    });
    if (kind === "client") {
      // Span look: first cell already has text; keep other cells styled same
    }
    excelRow.height = kind === "client" || kind === "batch" ? 18 : 16;
    rowIdx += 1;
    dataIndex += 1;
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
  const blob = new Blob([buffer as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = opts.fileName || `${opts.title.replace(/\s+/g, "_")}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
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
