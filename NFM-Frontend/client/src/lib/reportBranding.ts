import herculesLogo from "@/assets/hercules-logo-final.png";
import asmLogo from "@/assets/Asm_Logo.png";
import pureBreedLogo from "@/assets/PureBreed.png";

export const REPORT_LOGOS = {
  hercules: herculesLogo,
  asm: asmLogo,
  pureBreed: pureBreedLogo,
};

const toAbsolute = (src: string) => {
  if (!src) return "";
  if (src.startsWith("http") || src.startsWith("data:") || src.startsWith("blob:")) return src;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${src.startsWith("/") ? "" : "/"}${src}`;
};

export async function logoToDataUrl(src: string): Promise<string> {
  const url = toAbsolute(src);
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || url));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

export async function getReportLogoDataUrls() {
  const [hercules, asm, pureBreed] = await Promise.all([
    logoToDataUrl(REPORT_LOGOS.hercules),
    logoToDataUrl(REPORT_LOGOS.asm),
    logoToDataUrl(REPORT_LOGOS.pureBreed),
  ]);
  return { hercules, asm, pureBreed };
}

export function buildReportHeaderHtml(opts: {
  title: string;
  generatedOn: string;
  dateRange: string;
  extraFilters?: string;
  logos: { hercules: string; asm: string; pureBreed: string };
}) {
  const extra = opts.extraFilters
    ? `<div style="margin-top:4px">${opts.extraFilters}</div>`
    : "";
  return `
    <div class="report-header">
      <div class="report-header-row">
        <div class="report-header-left">
          <img src="${opts.logos.hercules}" alt="Hercules" class="logo-hercules" />
        </div>
        <div class="report-header-right">
          <img src="${opts.logos.pureBreed}" alt="Pure Breed Poultry Co." class="logo-purebreed" />
          <img src="${opts.logos.asm}" alt="ASM-Process Automation" class="logo-asm" />
        </div>
      </div>
      <div class="report-header-line"></div>
      <h1 class="report-title">${opts.title}</h1>
      <p class="report-generated">Generated on: ${opts.generatedOn}</p>
      <div class="report-filters">
        <div class="report-filters-title">Report Filters</div>
        <div>Date Range: ${opts.dateRange}</div>
        ${extra}
      </div>
    </div>
  `;
}

export const REPORT_HEADER_CSS = `
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; margin: 24px; }
  .report-header { margin-bottom: 16px; }
  .report-header-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
  .report-header-left, .report-header-right { display: flex; align-items: center; gap: 12px; }
  .logo-hercules { height: 52px; width: auto; }
  .logo-asm { height: 62px; width: auto; background: #fff; border-radius: 6px; padding: 4px; }
  .logo-purebreed { height: 96px; width: auto; object-fit: contain; background: #fff; border-radius: 6px; padding: 4px; }
  .report-header-line { height: 3px; background: #0e7490; margin: 10px 0 14px; }
  .report-title { text-align: center; color: #0e7490; font-size: 22px; margin: 0 0 4px; }
  .report-generated { text-align: center; color: #64748b; font-size: 12px; margin: 0 0 14px; }
  .report-filters { background: #f1f5f9; border-radius: 8px; padding: 10px 14px; font-size: 13px; }
  .report-filters-title { font-weight: 700; color: #1e3a5f; margin-bottom: 4px; }
  table { border-collapse: collapse; width: 100%; font-size: 11px; }
  th { background: #e2e8f0; color: #1e293b; text-align: left; padding: 6px 8px; border: 1px solid #94a3b8; }
  td { padding: 5px 8px; border: 1px solid #cbd5e1; }
  tr:nth-child(even) td { background: #f8fafc; }
  .total-row td { font-weight: 700; background: #e2e8f0 !important; }
  .client-row td { background: #0e7490 !important; color: #fff; font-weight: 700; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .batch-row td { background: #ecfeff !important; font-weight: 600; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  @media print {
    body { margin: 12px; }
    .report-header { break-after: avoid; }
    .client-row td, .batch-row td, .total-row td { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }
`;

export function csvBrandingLines(title: string, generatedOn: string, dateRange: string) {
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
  return [
    [q("Hercules"), q(""), q("ASM-Process Automation"), q("Pure Breed Poultry Co.")].join(","),
    [q(`Report: ${title}`)].join(","),
    [q(`Generated on: ${generatedOn}`)].join(","),
    [q(`Date Range: ${dateRange}`)].join(","),
    "",
  ];
}
