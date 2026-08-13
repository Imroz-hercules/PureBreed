import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Info } from 'lucide-react';

// Centralized color mapping for consistent PLC data visualization
export const PLC_COLOR_MAPPING = {
  // Throughput metrics
  'Pellet1_TonHr': '#3b82f6',  // Blue
  'Pellet2_TonHr': '#f97316',  // Orange  
  'Pellet3_TonHr': '#ef4444',  // Red
  
  // Temperature metrics
  'Pellet1_Temp': '#06b6d4',   // Cyan
  'Pellet2_Temp': '#10b981',   // Green
  'Pellet3_Temp': '#f59e0b',   // Yellow
  
  // Amps metrics
  'HammerMill_Amp': '#8b5cf6', // Purple
  'RollerMill_Amp': '#ec4899', // Pink
};

// Custom Tooltip Component for colored values
const CustomTooltip = ({ active, payload, label, title }: any) => {
  if (active && payload && payload.length) {
    const formatValue = (value: any, name: string) => {
      // Check if this is time-based data (PLC trend)
      const isTimeData = typeof label === 'string' && label.includes(':');
      if (isTimeData) {
        // Format based on the metric type
        if (name.includes('TonHr')) {
          return `${value.toFixed(2)} Tons/Hr`;
        } else if (name.includes('Temp')) {
          return `${value.toFixed(1)} °C`;
        } else if (name.includes('Amp')) {
          return `${value.toFixed(2)} Amps`;
        }
        return value.toFixed(2);
      }
      
      // Check if this is error percentage data (Material Error Analysis)
      if (title === 'Material Error Analysis' || (typeof name === 'string' && (name.includes('EMULSFIER') || name.includes('FEED') || name.includes('ACIDS') || name.includes('Recycle')))) {
        return `Error: ${value.toFixed(2)}%`;
      }
      
      return value;
    };

    return (
      <div className="bg-slate-800/95 border border-brand/50 rounded-lg shadow-xl p-3 backdrop-blur-sm">
        <p className="text-brand font-bold mb-2">
          {typeof label === 'string' && label.includes(':') ? `Time: ${label}` : label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span> {formatValue(entry.value, entry.name)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface ChartData {
  labels: string[];
  values: (number | string)[];
}

interface DetailedChartData {
  labels: string[];
  datasets: { name: string; values: number[]; color: string; visible: boolean }[];
}

interface ChartComponentProps {
  type: 'bar' | 'line' | 'pie';
  data: ChartData | DetailedChartData;
  colors?: string[];
  title: string;
  zoom?: { start: number; end: number };
  isMultiLine?: boolean;
}

// High contrast colors using rgba functions optimized for both light and dark modes
const defaultColors = [
  '#22d3ee', // cyan neon
  '#34d399', // emerald neon
  '#fbbf24', // amber neon
  '#f87171', // red neon
  '#a78bfa', // violet neon
  '#60a5fa', // blue neon
  '#fb923c', // orange neon
  '#2dd4bf', // teal neon
  '#e879f9', // fuchsia neon
  '#4ade80', // green neon
];

// Chart descriptions in factory language
const chartDescriptions: Record<string, Record<string, string>> = {
  bar: {
    'Material Weight per Day (tons)': 'Daily material consumption tracking in tons. Each bar represents total material weight processed in 24 hours. Higher bars indicate peak production days. Use this to: • Monitor daily throughput • Identify production bottlenecks • Plan material inventory • Track production efficiency trends',
    'No. Batches by Weekday': 'Weekly production pattern analysis. Shows batch completion counts for each day of the week. Helps operators: • Identify peak production days • Plan maintenance schedules • Optimize workforce allocation • Understand weekly production cycles',
    'default': 'Production data visualization chart. Each bar represents a production category with its corresponding value. Use for comparing production metrics across different time periods or product types.'
  },
  line: {
    'PLC Live Data Trend': 'Real-time production monitoring dashboard. Tracks live sensor readings including: • Throughput (tons/hour) - Production speed • Temperature (°C) - Equipment health • Electrical current (amps) - Power consumption. Use to detect anomalies, monitor trends, and ensure optimal production conditions.',
    'default': 'Production trend monitoring chart. Shows continuous data over time for real-time process control. Essential for detecting production anomalies and maintaining quality standards.'
  },
  pie: {
    'Quantity by Tons': 'Product mix analysis by weight distribution. Each slice shows a product type and its proportion of total production. Critical for: • Production planning • Resource allocation • Quality control • Inventory management • Understanding customer demand patterns',
    'default': 'Production distribution analysis. Shows how production is divided across different categories, helping managers understand product mix and allocate resources effectively.'
  }
};

const ChartComponent: React.FC<ChartComponentProps> = ({
  type,
  data,
  colors = defaultColors,
  title,
  zoom,
  isMultiLine = false,
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Get chart description
  const getChartDescription = () => {
    const typeDescriptions = chartDescriptions[type];
    return typeDescriptions?.[title] || typeDescriptions?.['default'] || 'Chart showing data visualization.';
  };

  // Handle different data types
  const isDetailedData = (data: ChartData | DetailedChartData): data is DetailedChartData => {
    return 'datasets' in data;
  };

  const chartData = isDetailedData(data) 
    ? data.labels.map((label, index) => {
        const point: any = { name: label };
        data.datasets.forEach(dataset => {
          if (dataset.visible && dataset.values[index] !== undefined) {
            point[dataset.name] = dataset.values[index];
          }
        });
        return point;
      })
    : data.labels.map((label, index) => ({
        name: label,
        value:
          typeof data.values[index] === 'string'
            ? parseFloat(data.values[index] as string)
            : data.values[index],
      }));

  // Apply zoom if provided
  const applyZoom = (data: any[]) => {
    if (!zoom) return data;
    
    const startIndex = Math.floor((zoom.start / 100) * data.length);
    const endIndex = Math.floor((zoom.end / 100) * data.length);
    return data.slice(startIndex, endIndex);
  };

  const finalChartData = applyZoom(chartData);

  // Compact side legend — sits beside the pie, does not overlay it
  const renderCompactLegend = () => (
    <div className="w-[168px] shrink-0 max-h-[280px] overflow-y-auto border-l border-brand/20 pl-2.5 pr-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-brand mb-2 sticky top-0 bg-surface/95 backdrop-blur-sm pb-1">
        Legend · {finalChartData.length}
      </p>
      <ul className="space-y-1">
        {finalChartData.map((entry: any, index: number) => {
          const color = colors[index % colors.length] || defaultColors[index % defaultColors.length];
          return (
          <li
            key={`legend-${index}`}
            className={`flex items-center gap-2 rounded px-1.5 py-1 text-[11px] cursor-pointer transition-colors ${
              hoveredIndex === index ? 'bg-brand-subtle text-brand' : 'text-[color:var(--text-secondary)] hover:bg-surface-sunken'
            }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            title={String(entry.name)}
          >
            <span
              className="h-2.5 w-2.5 rounded-sm shrink-0"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 8px ${color}`,
              }}
            />
            <span className="truncate leading-tight">
              {String(entry.name).length > 22 ? String(entry.name).substring(0, 22) + '…' : entry.name}
            </span>
          </li>
          );
        })}
      </ul>
    </div>
  );

  const renderChart = () => {
    switch (type) {
      case 'bar': {
        const barColors = finalChartData.map((_, index) =>
          colors[index % colors.length] || defaultColors[index % defaultColors.length]
        );
        return (
          <BarChart data={finalChartData} margin={{ top: 20, right: 24, left: 8, bottom: 16 }}>
            <defs>
              <filter id="neonBarGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {barColors.map((color, index) => (
                <linearGradient key={`grad-${index}`} id={`neonBarGrad-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={1} />
                  <stop offset="55%" stopColor={color} stopOpacity={0.85} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.2} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: 'var(--chart-text-color, #94a3b8)', fontSize: 11, fontWeight: 500 }}
              axisLine={{ stroke: 'rgba(34,211,238,0.25)' }}
              tickLine={{ stroke: 'rgba(34,211,238,0.2)' }}
              interval={0}
              angle={finalChartData.length > 6 ? -28 : 0}
              textAnchor={finalChartData.length > 6 ? 'end' : 'middle'}
              height={finalChartData.length > 6 ? 50 : 30}
            />
            <YAxis
              tick={{ fill: 'var(--chart-text-color, #94a3b8)', fontSize: 11, fontWeight: 500 }}
              axisLine={{ stroke: 'rgba(34,211,238,0.25)' }}
              tickLine={{ stroke: 'rgba(34,211,238,0.2)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                borderColor: 'rgba(34, 211, 238, 0.45)',
                borderRadius: '8px',
                boxShadow: '0 0 20px rgba(34, 211, 238, 0.25)',
                color: '#f0f4f8',
                fontSize: 12,
              }}
              labelStyle={{ color: '#22d3ee', fontWeight: 700 }}
              cursor={{ fill: 'rgba(34, 211, 238, 0.08)' }}
              formatter={(value: any) => {
                const formattedValue = typeof value === 'number' ? value.toFixed(1) : value;
                return [formattedValue, 'Value'];
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} filter="url(#neonBarGlow)" maxBarSize={48}>
              {finalChartData.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#neonBarGrad-${index})`}
                  stroke={barColors[index]}
                  strokeWidth={1}
                  style={{ filter: `drop-shadow(0 0 8px ${barColors[index]}99)` }}
                />
              ))}
            </Bar>
          </BarChart>
        );
      }

      case 'line':
        return (
          <LineChart data={finalChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-600" />
            <XAxis 
              dataKey="name" 
              tick={{ 
                fill: 'var(--chart-text-color, #374151)', 
                fontSize: 11,
                fontWeight: '500',
                textAnchor: 'end'
              }}
              axisLine={{ stroke: 'var(--chart-axis-color, #d1d5db)' }}
              tickLine={{ stroke: 'var(--chart-axis-color, #d1d5db)' }}
              className="text-slate-700 dark:text-slate-300"
              style={{
                color: 'var(--chart-text-color, #374151)',
                fill: 'var(--chart-text-color, #374151)'
              }}
              label={{ 
                value: "Time (HH:MM:SS)", 
                position: "bottom", 
                offset: 0,
                style: { 
                  textAnchor: "middle",
                  fill: 'var(--chart-text-color, #374151)',
                  fontSize: '12px',
                  fontWeight: '500'
                } 
              }}
              minTickGap={50}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ 
                fill: 'var(--chart-text-color, #374151)', 
                fontSize: 12,
                fontWeight: '500'
              }}
              axisLine={{ stroke: 'var(--chart-axis-color, #d1d5db)' }}
              tickLine={{ stroke: 'var(--chart-axis-color, #d1d5db)' }}
              className="text-slate-700 dark:text-slate-300"
              style={{
                color: 'var(--chart-text-color, #374151)',
                fill: 'var(--chart-text-color, #374151)'
              }}
              label={{ 
                value: "Value (Tons/Hr, °C, Amps)", 
                position: "insideLeft", 
                angle: -90,
                offset: 0,
                style: { 
                  textAnchor: "middle",
                  fill: 'var(--chart-text-color, #374151)',
                  fontSize: '12px',
                  fontWeight: '500'
                } 
              }}
            />
            <Tooltip
              content={<CustomTooltip title={title} />}
              cursor={{ strokeDasharray: '3 3', stroke: 'rgba(6, 182, 212, 0.5)' }}
            />
            
            {/* Reference Line for better readability */}
            <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
            
            {isMultiLine && isDetailedData(data) ? (
              // Render multiple lines for detailed data with enhanced styling
              data.datasets.map((dataset, index) => 
                dataset.visible ? (
                  <Line
                    key={dataset.name}
                    type="monotone"
                    dataKey={dataset.name}
                    stroke={dataset.color}
                    strokeWidth={2}
                    dot={{ fill: dataset.color, strokeWidth: 1, r: 3 }}
                    activeDot={{ r: 5, stroke: dataset.color, strokeWidth: 2, fill: '#fff' }}
                    connectNulls={true}
                  />
                ) : null
              )
            ) : (
              // Render single line for simple data
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors[0] || defaultColors[0]}
                strokeWidth={3}
                dot={{ fill: colors[0] || defaultColors[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: colors[0] || defaultColors[0], strokeWidth: 2, fill: '#fff' }}
              />
            )}
          </LineChart>
        );

      case 'pie': {
        const pieColors = finalChartData.map((_, index) =>
          colors[index % colors.length] || defaultColors[index % defaultColors.length]
        );
        return (
          <div className="flex w-full h-full min-h-[260px] items-stretch gap-0">
            <div className="flex-1 min-w-0 h-full relative">
              <div className="pointer-events-none absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.14)_0%,transparent_70%)] blur-md" />
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <filter id="neonPieGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <Pie
                    data={finalChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={hoveredIndex !== null ? 102 : 94}
                    innerRadius={42}
                    paddingAngle={3}
                    label={false}
                    labelLine={false}
                    stroke="rgba(10,15,26,0.9)"
                    strokeWidth={2}
                    filter="url(#neonPieGlow)"
                  >
                    {finalChartData.map((_entry, index) => {
                      const isHovered = hoveredIndex === index;
                      const baseColor = pieColors[index];
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={baseColor}
                          stroke={baseColor}
                          strokeWidth={isHovered ? 2 : 1}
                          className="pie-segment neon-pie-slice"
                          style={{
                            cursor: 'pointer',
                            opacity: hoveredIndex === null || isHovered ? 1 : 0.35,
                            filter: `drop-shadow(0 0 ${isHovered ? 12 : 6}px ${baseColor})`,
                            transition: 'all 0.25s ease',
                          }}
                          onMouseEnter={() => setHoveredIndex(index)}
                          onMouseLeave={() => setHoveredIndex(null)}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(17, 24, 39, 0.96)',
                      borderColor: 'rgba(34, 211, 238, 0.45)',
                      borderRadius: '8px',
                      boxShadow: '0 0 18px rgba(34, 211, 238, 0.3)',
                      color: '#f0f4f8',
                      fontSize: 12,
                    }}
                    itemStyle={{ color: '#22d3ee' }}
                    formatter={(value: any, name: any) => {
                      const formattedValue = typeof value === 'number' ? value.toFixed(1) : value;
                      const isError = typeof title === 'string' && title.toLowerCase().includes('error');
                      return [isError ? `${formattedValue}%` : formattedValue, name];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {renderCompactLegend()}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div style={{ width: '100%', height: type === 'pie' ? 320 : 300 }}>
      {/* Custom styles for better visibility */}
      <style>{`
        :root {
          --chart-text-color: #374151;
          --chart-axis-color: #d1d5db;
        }
        .dark {
          --chart-text-color: #ffffff;
          --chart-axis-color: #6b7280;
        }
        .pie-segment {
          transition: all 0.25s ease !important;
        }
        .neon-pie-slice:hover {
          filter: brightness(1.25) saturate(1.2) !important;
        }
        .recharts-bar-rectangle {
          transition: filter 0.2s ease;
        }
        .recharts-bar-rectangle:hover {
          filter: brightness(1.15) drop-shadow(0 0 10px rgba(34, 211, 238, 0.8)) !important;
        }
      `}</style>
      {title && (
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
            {title}
          </h3>
          
          {/* Info Button */}
          <div className="relative">
            <button
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
              className="p-1.5 rounded-full bg-brand/90 hover:bg-brand border border-brand/60 shadow-[0_0_12px_rgba(34,211,238,0.55)] transition-all duration-200 hover:scale-110 group"
              aria-label="Chart information"
            >
              <Info className="h-4 w-4 text-white group-hover:text-white transition-colors" />
            </button>
            
            {/* Info Tooltip */}
            {showInfo && (
              <div className="absolute right-0 top-full mt-2 w-80 p-4 bg-slate-800/95 dark:bg-slate-800/95 border border-brand/50 dark:border-brand/50 rounded-lg shadow-xl z-50 backdrop-blur-sm chart-info-tooltip">
                <div className="text-sm text-slate-200 dark:text-slate-200 leading-relaxed">
                  <div className="font-semibold text-brand dark:text-brand mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Chart Information
                  </div>
                  <p className="text-slate-300 dark:text-slate-300">
                    {getChartDescription()}
                  </p>
                </div>
                
                {/* Tooltip Arrow */}
                <div className="absolute -top-2 right-4 w-4 h-4 bg-slate-800/95 dark:bg-slate-800/95 border-l border-t border-brand/50 dark:border-brand/50 transform rotate-45 tooltip-arrow"></div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Zoom Indicator */}
      {zoom && zoom.start > 0 && zoom.end < 100 && (
        <div className="mb-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-400">
          🔍 Zoomed: {zoom.start.toFixed(0)}% - {zoom.end.toFixed(0)}% of data
        </div>
      )}
      
      {type === 'pie' ? (renderChart() || <div>Chart not available</div>) : (
        <ResponsiveContainer width="100%" height={title ? "90%" : "100%"}>
          {renderChart() || <div>Chart not available</div>}
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ChartComponent;
