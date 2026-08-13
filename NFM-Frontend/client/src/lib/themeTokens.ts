export function cssVar(name: string, fallback = ''): string {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

export function chartPalette() {
  return {
    brand: cssVar('--brand', '#0098cc'),
    success: cssVar('--success', '#059669'),
    warning: cssVar('--warning', '#d97706'),
    danger: cssVar('--danger', '#dc2626'),
    info: cssVar('--info', '#0098cc'),
    muted: cssVar('--text-muted', '#5a6f88'),
    text: cssVar('--chart-text-color', '#3d4f66'),
    surface: cssVar('--surface', '#ffffff'),
    border: cssVar('--border', '#dce3ed'),
    series: [
      cssVar('--chart-1', '#0098cc'),
      cssVar('--chart-2', '#059669'),
      cssVar('--chart-3', '#d97706'),
      cssVar('--chart-4', '#dc2626'),
      cssVar('--chart-5', '#7c3aed'),
    ],
  }
}
