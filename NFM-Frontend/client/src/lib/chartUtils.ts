import { ChartDataPoint } from "@shared/schema";
import { chartPalette } from './themeTokens'

export { chartPalette }

export const chartColors = {
  brand: 'var(--brand)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  info: 'var(--info)',
  cyberBlue: 'var(--brand)',
  electricBlue: 'var(--info)',
  neonGreen: 'var(--success)',
  neonAmber: 'var(--warning)',
  neonOrange: 'var(--warning)',
  cyberPurple: 'var(--chart-5)',
};

export const createGradient = (ctx: CanvasRenderingContext2D, color: string, alpha: number = 0.1) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, color.replace('50%)', `${alpha * 100}%)`));
  gradient.addColorStop(1, 'transparent');
  return gradient;
};

export const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      display: false,
      grid: {
        display: false,
      },
    },
    y: {
      display: false,
      grid: {
        display: false,
      },
    },
  },
  elements: {
    point: {
      radius: 3,
      hoverRadius: 6,
    },
    line: {
      tension: 0.4,
    },
  },
};

export const formatDataForChart = (data: ChartDataPoint[], labelFormat?: (timestamp: string) => string) => {
  return {
    labels: data.map(d => labelFormat ? labelFormat(d.timestamp) : new Date(d.timestamp).toLocaleTimeString()),
    datasets: [{
      data: data.map(d => d.value),
    }],
  };
};

export const calculateCircularProgress = (value: number, max: number = 100): { circumference: number; offset: number } => {
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value, max) / max;
  const offset = circumference - (progress * circumference);
  
  return { circumference, offset };
};
