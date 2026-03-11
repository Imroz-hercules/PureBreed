import React, { useState, useEffect } from 'react';
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
  Legend,
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
      <div className="bg-slate-800/95 border border-cyan-500/50 rounded-lg shadow-xl p-3 backdrop-blur-sm">
        <p className="text-cyan-400 font-bold mb-2">
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
  // Primary vibrant colors - high contrast and distinct
  'rgba(239, 68, 68, 1)',     // Red 500
  'rgba(16, 185, 129, 1)',    // Emerald 500
  'rgba(59, 130, 246, 1)',    // Blue 500
  'rgba(139, 92, 246, 1)',    // Violet 500
  'rgba(249, 115, 22, 1)',    // Orange 500
  'rgba(6, 182, 212, 1)',     // Cyan 500
  'rgba(236, 72, 153, 1)',    // Pink 500
  'rgba(132, 204, 22, 1)',    // Lime 500
  'rgba(168, 85, 247, 1)',    // Purple 500
  'rgba(234, 179, 8, 1)',     // Yellow 500
  
  // Secondary distinct colors
  'rgba(220, 38, 127, 1)',    // Rose 600
  'rgba(34, 197, 94, 1)',     // Green 500
  'rgba(14, 165, 233, 1)',    // Sky 500
  'rgba(99, 102, 241, 1)',    // Indigo 500
  'rgba(245, 101, 101, 1)',   // Red 400
  'rgba(52, 211, 153, 1)',    // Emerald 400
  'rgba(96, 165, 250, 1)',    // Blue 400
  'rgba(167, 139, 250, 1)',   // Violet 400
  'rgba(251, 146, 60, 1)',    // Orange 400
  'rgba(34, 211, 238, 1)',    // Cyan 400
  
  // Tertiary colors for more products
  'rgba(251, 113, 133, 1)',   // Rose 400
  'rgba(74, 222, 128, 1)',    // Green 400
  'rgba(56, 189, 248, 1)',    // Sky 400
  'rgba(129, 140, 248, 1)',   // Indigo 400
  'rgba(248, 113, 113, 1)',   // Red 400
  'rgba(110, 231, 183, 1)',   // Emerald 300
  'rgba(147, 197, 253, 1)',   // Blue 300
  'rgba(196, 181, 253, 1)',   // Violet 300
  'rgba(252, 165, 165, 1)',   // Red 300
  'rgba(134, 239, 172, 1)',   // Green 300
  
  // Additional unique colors
  'rgba(191, 219, 254, 1)',   // Blue 200
  'rgba(221, 214, 254, 1)',   // Violet 200
  'rgba(254, 202, 202, 1)',   // Red 200
  'rgba(187, 247, 208, 1)',   // Green 200
  'rgba(165, 243, 252, 1)',   // Cyan 200
  'rgba(253, 230, 138, 1)',   // Yellow 200
  'rgba(252, 165, 165, 1)',   // Rose 200
  'rgba(196, 181, 253, 1)',   // Indigo 200
  'rgba(254, 215, 170, 1)',   // Orange 200
  'rgba(190, 242, 100, 1)',   // Lime 200
  
  // Extended palette for many products
  'rgba(185, 28, 28, 1)',     // Red 700
  'rgba(4, 120, 87, 1)',      // Emerald 700
  'rgba(29, 78, 216, 1)',     // Blue 700
  'rgba(109, 40, 217, 1)',    // Violet 700
  'rgba(194, 65, 12, 1)',     // Orange 700
  'rgba(14, 116, 144, 1)',    // Cyan 700
  'rgba(157, 23, 77, 1)',     // Rose 700
  'rgba(77, 124, 15, 1)',     // Lime 700
  'rgba(124, 45, 18, 1)',     // Red 800
  'rgba(6, 95, 70, 1)',       // Emerald 800
  
  // Darker variants for contrast
  'rgba(30, 64, 175, 1)',     // Blue 800
  'rgba(91, 33, 182, 1)',     // Violet 800
  'rgba(154, 52, 18, 1)',     // Orange 800
  'rgba(21, 94, 117, 1)',     // Cyan 800
  'rgba(131, 24, 67, 1)',     // Rose 800
  'rgba(54, 83, 20, 1)',      // Lime 800
  'rgba(107, 33, 168, 1)',    // Purple 800
  'rgba(161, 98, 7, 1)',      // Yellow 700
  'rgba(153, 27, 27, 1)',     // Red 900
  'rgba(6, 78, 59, 1)',       // Emerald 900
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
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') || 
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };

    checkDarkMode();
    
    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);
    
    // Listen for class changes on document element
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      mediaQuery.removeEventListener('change', checkDarkMode);
      observer.disconnect();
    };
  }, []);

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

  // Custom scrollable legend for side placement
  const renderScrollableLegend = (props: any) => {
    const { payload } = props;
    return (
      <div
        style={{
          maxHeight: 300,
          overflowY: 'auto',
          padding: '20px',
          fontSize: '0.9rem',
          backgroundColor: 'var(--chart-legend-bg)',
          borderRadius: '16px',
          border: 'var(--chart-legend-border)',
          minWidth: '350px',
          maxWidth: '400px',
          boxShadow: 'var(--chart-legend-shadow)',
          backdropFilter: 'blur(10px)',
          position: 'relative'
        }}
        className="chart-legend modern-legend"
      >
        {/* Futuristic header */}
        <div className="mb-4 pb-3 border-b border-slate-200/30 dark:border-slate-600/30">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Product Breakdown
          </h4>
          <div className="w-12 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mt-2"></div>
        </div>
        
        {payload.map((entry: any, index: number) => (
          <div
            key={`item-${index}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 12,
              whiteSpace: 'nowrap',
              padding: '8px 12px',
              borderRadius: '10px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              transform: hoveredIndex === index ? 'scale(1.02)' : 'scale(1)',
              backgroundColor: hoveredIndex === index ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
              border: hoveredIndex === index ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent'
            }}
            className="legend-item modern-legend-item cursor-pointer"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Hover effect background */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-600/50 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg"
              style={{ zIndex: 0 }}
            />
            
            {/* Color indicator with enhanced glow effect for dark mode */}
            <div
              style={{
                width: 18,
                height: 18,
                backgroundColor: defaultColors[index % defaultColors.length],
                marginRight: 16,
                borderRadius: '6px',
                boxShadow: `0 0 16px ${defaultColors[index % defaultColors.length]}CC, 0 0 8px ${defaultColors[index % defaultColors.length]}80`,
                border: '2px solid rgba(255, 255, 255, 0.3)',
                position: 'relative',
                zIndex: 1,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hoveredIndex === index ? 'scale(1.2)' : 'scale(1)',
                filter: hoveredIndex === index 
                  ? 'brightness(1.3) saturate(1.2) drop-shadow(0 6px 12px rgba(0,0,0,0.4))' 
                  : 'brightness(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }}
              className="color-indicator"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
            
            {/* Product name with modern typography */}
            <span 
              title={entry.value} 
              style={{ 
                fontSize: '13px', 
                fontWeight: '600', 
                lineHeight: '1.4',
                position: 'relative',
                zIndex: 1,
                flex: 1,
                minWidth: 0
              }}
              className="product-name"
            >
              {entry.value.length > 35
                ? entry.value.substring(0, 35) + '…'
                : entry.value}
            </span>
            
            {/* Hover indicator */}
            <div className="ml-2 opacity-0 hover:opacity-100 transition-opacity duration-300" style={{ zIndex: 1 }}>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        ))}
        
        {/* Futuristic footer */}
        <div className="mt-4 pt-3 border-t border-slate-200/30 dark:border-slate-600/30">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Products: {payload.length}</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span>Live Data</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={finalChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-600" />
            <XAxis 
              dataKey="name" 
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
                value: "Date", 
                position: "bottom", 
                offset: 0,
                style: { 
                  textAnchor: 'middle',
                  fill: 'var(--chart-text-color, #374151)',
                  fontSize: 14,
                  fontWeight: '600'
                }
              }}
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
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: 'rgba(6, 182, 212, 0.5)',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                color: '#ffffff'
              }}
              labelStyle={{ color: '#06b6d4', fontWeight: 'bold' }}
              cursor={{ fill: 'rgba(6, 182, 212, 0.1)' }}
              formatter={(value: any) => {
                const formattedValue = typeof value === 'number' ? value.toFixed(1) : value;
                return [`${formattedValue} tons`, 'Value'];
              }}
            />
            <Bar 
              dataKey="value" 
              fill={colors[0] || defaultColors[0]}
              radius={[4, 4, 0, 0]}
            >
              {finalChartData.map((_entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index % colors.length] || defaultColors[index % defaultColors.length]} 
                />
              ))}
            </Bar>
          </BarChart>
        );

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

      case 'pie':
        return (
          <PieChart width={600} height={400}>
            <Pie
              data={finalChartData}
              dataKey="value"
              nameKey="name"
              cx="45%" // Adjusted to prevent left cutting
              cy="50%"
              outerRadius={hoveredIndex !== null ? 120 : 110}
              innerRadius={0}
              paddingAngle={4}
              label={({ name, value, index, midAngle, innerRadius, outerRadius, cx, cy }) => {
                // Only show label for hovered section
                if (hoveredIndex === index) {
                  // Get the color of the hovered section
                  const sectionColor = defaultColors[index % defaultColors.length];
                  
                  return (
                    <g>
                      {/* Background circle with section color */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r="45"
                        fill={sectionColor}
                        stroke="rgba(255, 255, 255, 0.4)"
                        strokeWidth="2"
                        style={{
                          pointerEvents: 'none',
                          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))'
                        }}
                      />
                      {/* Label text */}
                      <text
                        x={cx}
                        y={cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          fontSize: '14px',
                          fontWeight: 'bold',
                          fill: '#ffffff',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                          pointerEvents: 'none'
                        }}
                      >
                        <tspan x={cx} dy="-8" style={{ fontSize: '13px' }}>
                          {name.length > 25 ? name.substring(0, 25) + '...' : name}
                        </tspan>
                        <tspan x={cx} dy="16" style={{ fontSize: '12px', opacity: 0.9 }}>
                          {(title === 'Material Error Analysis' || (typeof name === 'string' && (name.includes('EMULSFIER') || name.includes('FEED') || name.includes('ACIDS') || name.includes('Recycle')))) ? `Error: ${value}%` : `Count: ${value} materials`}
                        </tspan>
                      </text>
                    </g>
                  );
                }
                return null;
              }}
              labelLine={false}
            >
              {finalChartData.map((_entry, index) => {
                const isHovered = hoveredIndex === index;
                const baseColor = defaultColors[index % defaultColors.length];
                const hoverColor = baseColor; // Already full opacity
                
                return (
                <Cell
                  key={`cell-${index}`}
                    fill={isHovered ? hoverColor : baseColor}
                    stroke="none"
                    strokeWidth={0}
                    className="pie-segment cursor-pointer"
                  style={{
                      filter: isHovered 
                        ? (isDarkMode 
                          ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.6)) brightness(1.3) saturate(1.2)' 
                          : 'drop-shadow(0 8px 16px rgba(0,0,0,0.4)) brightness(1.2) saturate(1.1)')
                        : (isDarkMode 
                          ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.4)) brightness(1.1)' 
                          : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'),
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                      transformOrigin: 'center',
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </Pie>
            
            {/* Custom hover label that appears outside the pie chart */}
            {hoveredIndex !== null && finalChartData[hoveredIndex] && (
              <g>
                {/* Get the color of the hovered section */}
                {(() => {
                  const sectionColor = defaultColors[hoveredIndex % defaultColors.length];
                  return (
                    <>
                      {/* Background rectangle with section color */}
                      <rect
                        x="50"
                        y="20"
                        width="200"
                        height="60"
                        rx="8"
                        fill={sectionColor}
                        stroke="rgba(255, 255, 255, 0.4)"
                        strokeWidth="2"
                        style={{
                          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))'
                        }}
                      />
                      {/* Label text */}
                      <text
                        x="150"
                        y="40"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          fontSize: '14px',
                          fontWeight: 'bold',
                          fill: '#ffffff',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                        }}
                      >
                        {finalChartData[hoveredIndex].name.length > 30 
                          ? finalChartData[hoveredIndex].name.substring(0, 30) + '...' 
                          : finalChartData[hoveredIndex].name}
                      </text>
                      <text
                        x="150"
                        y="60"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          fontSize: '12px',
                          fill: '#ffffff',
                          opacity: 0.9
                        }}
                      >
                        {(title === 'Material Error Analysis' || (typeof finalChartData[hoveredIndex]?.name === 'string' && (finalChartData[hoveredIndex].name.includes('EMULSFIER') || finalChartData[hoveredIndex].name.includes('FEED') || finalChartData[hoveredIndex].name.includes('ACIDS') || finalChartData[hoveredIndex].name.includes('Recycle')))) ? `Error: ${finalChartData[hoveredIndex].value}%` : `Count: ${finalChartData[hoveredIndex].value} materials`}
                      </text>
                    </>
                  );
                })()}
              </g>
            )}
            
            <Tooltip
              content={() => null}
              cursor={{ fill: 'rgba(6, 182, 212, 0.1)' }}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              content={renderScrollableLegend}
              wrapperStyle={{ color: 'var(--chart-text-color)', width: '420px' }}
              className="chart-legend-wrapper"
            />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ width: '100%', height: 300 }}>
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
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .pie-segment:hover {
          filter: brightness(1.2) saturate(1.1) drop-shadow(0 8px 16px rgba(0,0,0,0.6)) !important;
        }
        .color-indicator {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .legend-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .legend-item:hover {
          background-color: rgba(6, 182, 212, 0.1) !important;
          border: 1px solid rgba(6, 182, 212, 0.3) !important;
        }
        /* Dark mode adjustments - Enhanced visibility */
        .dark .pie-segment {
          stroke: rgba(255, 255, 255, 0.4) !important;
          filter: brightness(1.1) drop-shadow(0 4px 8px rgba(0,0,0,0.4)) !important;
        }
        .dark .pie-segment:hover {
          stroke: rgba(255, 255, 255, 0.8) !important;
          filter: brightness(1.3) saturate(1.2) drop-shadow(0 8px 16px rgba(0,0,0,0.6)) !important;
        }
        /* Light mode adjustments */
        .light .pie-segment {
          stroke: rgba(0, 0, 0, 0.3) !important;
        }
        .light .pie-segment:hover {
          stroke: rgba(0, 0, 0, 0.6) !important;
        }
        /* Fallback for systems without dark/light class */
        @media (prefers-color-scheme: dark) {
          .pie-segment {
            stroke: rgba(255, 255, 255, 0.4) !important;
            filter: brightness(1.1) drop-shadow(0 4px 8px rgba(0,0,0,0.4)) !important;
          }
          .pie-segment:hover {
            stroke: rgba(255, 255, 255, 0.8) !important;
            filter: brightness(1.3) saturate(1.2) drop-shadow(0 8px 16px rgba(0,0,0,0.6)) !important;
          }
        }
        @media (prefers-color-scheme: light) {
          .pie-segment {
            stroke: rgba(0, 0, 0, 0.3) !important;
          }
          .pie-segment:hover {
            stroke: rgba(0, 0, 0, 0.6) !important;
          }
        }
      `}</style>
      {title && (
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
          
          {/* Info Button */}
          <div className="relative">
            <button
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
              className="p-1.5 rounded-full bg-cyan-500 hover:bg-cyan-600 border border-cyan-400 transition-all duration-200 hover:scale-110 group"
              aria-label="Chart information"
            >
              <Info className="h-4 w-4 text-white group-hover:text-white transition-colors" />
            </button>
            
            {/* Info Tooltip */}
            {showInfo && (
              <div className="absolute right-0 top-full mt-2 w-80 p-4 bg-slate-800/95 dark:bg-slate-800/95 border border-cyan-500/50 dark:border-cyan-500/50 rounded-lg shadow-xl z-50 backdrop-blur-sm chart-info-tooltip">
                <div className="text-sm text-slate-200 dark:text-slate-200 leading-relaxed">
                  <div className="font-semibold text-cyan-400 dark:text-cyan-400 mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Chart Information
                  </div>
                  <p className="text-slate-300 dark:text-slate-300">
                    {getChartDescription()}
                  </p>
                </div>
                
                {/* Tooltip Arrow */}
                <div className="absolute -top-2 right-4 w-4 h-4 bg-slate-800/95 dark:bg-slate-800/95 border-l border-t border-cyan-500/50 dark:border-cyan-500/50 transform rotate-45 tooltip-arrow"></div>
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
      
      <ResponsiveContainer width="100%" height={title ? "90%" : "100%"}>
        {renderChart() || <div>Chart not available</div>}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartComponent;
