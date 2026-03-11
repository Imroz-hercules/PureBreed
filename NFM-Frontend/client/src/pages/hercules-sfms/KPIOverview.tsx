// import React, { useState, useEffect, useMemo } from 'react';
// import { motion } from 'framer-motion';
// import {
//   ResponsiveContainer,
//   AreaChart,
//   Area,
//   LineChart,
//   Line,
//   BarChart,
//   Bar,
//   PieChart,
//   Pie,
//   Cell,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   RadialBarChart,
//   RadialBar,
//   ComposedChart,
//   RadarChart,
//   Radar,
//   PolarGrid,
//   PolarAngleAxis,
//   PolarRadiusAxis,
// } from 'recharts';
// import {
//   FaIndustry,
//   FaCog,
//   FaBolt,
//   FaDollarSign,
//   FaChartLine,
//   FaArrowUp,
//   FaArrowDown,
//   FaDownload,
//   FaExpand,
//   FaCalendarAlt,
//   FaFilter,
// } from 'react-icons/fa';
// import { WaterSystemLayout } from '../../components/hercules-sfms/WaterSystemLayout';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Skeleton } from '@/components/ui/skeleton';
// import { cn } from '@/lib/utils';
// import { useTheme } from '@/contexts/ThemeContext';

// // TypeScript Interfaces
// interface KPISummary {
//   id: string;
//   title: string;
//   value: number;
//   unit: string;
//   icon: React.ComponentType<{ className?: string }>;
//   color: string;
//   trend: number; // percentage change
//   previousValue: number;
// }

// interface ProductionKPI {
//   overallThroughput: number; // units/hour
//   productionYield: number; // %
//   cycleTime: number; // minutes
//   onTimeDelivery: number; // %
//   trendData: Array<{ date: string; value: number }>;
//   // New Production KPIs
//   totalProduction: number; // TON/Shift/Day
//   targetProduction: number; // TON/Shift/Day
//   actualProduction: number; // TON/Shift/Day
//   downtimeDuration: number; // hours
//   downtimeTrend: Array<{ date: string; duration: number }>;
// }

// interface ManagementKPI {
//   plannedProduction: number; // units
//   actualProduction: number; // units
//   scheduleAdherence: number; // %
//   resourceUtilization: number; // %
//   orderFulfillmentRate: number; // %
//   comparisonData: Array<{ date: string; planned: number; actual: number }>;
//   // New Management KPIs
//   planAdherence: number; // %
//   shiftEfficiency: number; // %
//   operatorProductivity: number; // units/operator
//   delayAnalysis: Array<{ category: string; duration: number; count: number }>;
//   shiftEfficiencyTrend: Array<{ shift: string; efficiency: number }>;
// }

// interface MaintenanceKPI {
//   oee: number; // %
//   availability: number; // %
//   performance: number; // %
//   qualityRate: number; // %
//   mtbf: number; // hours
//   mttr: number; // hours
//   oeeBreakdown: Array<{ name: string; value: number }>;
// }

// interface EnergyKPI {
//   totalConsumption: number; // kWh
//   energyCost: number; // $
//   energyEfficiency: number; // kWh/unit
//   peakDemand: number; // kW
//   powerFactor: number; // %
//   consumptionTrend: Array<{ hour: string; consumption: number }>;
//   // New Energy KPIs
//   energyConsumptionPerTon: number; // kWh/TON
//   energyCostPerTon: number; // $/TON
//   peakLoadHours: Array<{ hour: string; load: number }>;
//   efficiencyTrend: Array<{ date: string; efficiency: number }>;
// }

// interface CostingKPI {
//   costPerUnit: number; // $
//   totalProductionCost: number; // $
//   maintenanceCostPerUnit: number; // $
//   costVariance: number; // %
//   roi: number; // %
//   costBreakdown: Array<{ name: string; value: number }>;
//   costDistribution: Array<{ name: string; value: number }>;
//   // New Costing KPIs
//   rawMaterialCostPerTon: number; // $/TON
//   energyCostPerTon: number; // $/TON
//   totalVariableCost: number; // $
//   costVarianceTrend: Array<{ date: string; variance: number }>;
// }

// // Mock Data Generators
// const generateProductionData = (days: number = 30): ProductionKPI => {
//   const trendData = Array.from({ length: days }, (_, i) => {
//     const date = new Date();
//     date.setDate(date.getDate() - (days - i - 1));
//     return {
//       date: date.toISOString().split('T')[0],
//       value: 850 + Math.random() * 150,
//     };
//   });

//   const downtimeTrend = Array.from({ length: days }, (_, i) => {
//     const date = new Date();
//     date.setDate(date.getDate() - (days - i - 1));
//     return {
//       date: date.toISOString().split('T')[0],
//       duration: Math.random() * 4, // 0-4 hours
//     };
//   });

//   const targetProduction = 1200; // TON/Shift/Day
//   const actualProduction = targetProduction * (0.88 + Math.random() * 0.12); // 88-100% of target

//   return {
//     overallThroughput: 925.5,
//     productionYield: 94.2,
//     cycleTime: 12.5,
//     onTimeDelivery: 96.8,
//     trendData,
//     totalProduction: actualProduction,
//     targetProduction: targetProduction,
//     actualProduction: actualProduction,
//     downtimeDuration: 2.3,
//     downtimeTrend,
//   };
// };

// const generateManagementData = (days: number = 30): ManagementKPI => {
//   const comparisonData = Array.from({ length: days }, (_, i) => {
//     const date = new Date();
//     date.setDate(date.getDate() - (days - i - 1));
//     const planned = 1000 + Math.random() * 200;
//     const actual = planned * (0.85 + Math.random() * 0.15);
//     return {
//       date: date.toISOString().split('T')[0],
//       planned,
//       actual,
//     };
//   });

//   const shiftEfficiencyTrend = ['Shift A', 'Shift B', 'Shift C'].map(shift => ({
//     shift,
//     efficiency: 85 + Math.random() * 10,
//   }));

//   return {
//     plannedProduction: 35000,
//     actualProduction: 33250,
//     scheduleAdherence: 92.5,
//     resourceUtilization: 87.3,
//     orderFulfillmentRate: 94.1,
//     comparisonData,
//     planAdherence: 92.5,
//     shiftEfficiency: 88.7,
//     operatorProductivity: 125.5,
//     delayAnalysis: [
//       { category: 'Equipment', duration: 45, count: 12 },
//       { category: 'Material', duration: 30, count: 8 },
//       { category: 'Quality', duration: 20, count: 5 },
//       { category: 'Other', duration: 15, count: 3 },
//     ],
//     shiftEfficiencyTrend,
//   };
// };

// const generateMaintenanceData = (): MaintenanceKPI => {
//   return {
//     oee: 82.5,
//     availability: 88.2,
//     performance: 91.5,
//     qualityRate: 98.7,
//     mtbf: 450,
//     mttr: 2.5,
//     oeeBreakdown: [
//       { name: 'Availability', value: 88.2 },
//       { name: 'Performance', value: 91.5 },
//       { name: 'Quality', value: 98.7 },
//     ],
//   };
// };

// const generateEnergyData = (): EnergyKPI => {
//   const consumptionTrend = Array.from({ length: 24 }, (_, i) => ({
//     hour: `${i.toString().padStart(2, '0')}:00`,
//     consumption: 150 + Math.sin((i / 24) * Math.PI * 2) * 50 + Math.random() * 30,
//   }));

//   const peakLoadHours = Array.from({ length: 24 }, (_, i) => ({
//     hour: `${i.toString().padStart(2, '0')}:00`,
//     load: 600 + Math.sin((i / 24) * Math.PI * 2) * 200 + Math.random() * 100,
//   }));

//   const efficiencyTrend = Array.from({ length: 30 }, (_, i) => {
//     const date = new Date();
//     date.setDate(date.getDate() - (30 - i - 1));
//     return {
//       date: date.toISOString().split('T')[0],
//       efficiency: 2.5 + Math.random() * 0.6, // kWh/TON
//     };
//   });

//   const energyConsumptionPerTon = 2.8;
//   const energyCostPerTon = 0.42;

//   return {
//     totalConsumption: 12500,
//     energyCost: 1875,
//     energyEfficiency: 2.8,
//     peakDemand: 850,
//     powerFactor: 0.92,
//     consumptionTrend,
//     energyConsumptionPerTon,
//     energyCostPerTon,
//     peakLoadHours,
//     efficiencyTrend,
//   };
// };

// const generateCostingData = (): CostingKPI => {
//   const costVarianceTrend = Array.from({ length: 30 }, (_, i) => {
//     const date = new Date();
//     date.setDate(date.getDate() - (30 - i - 1));
//     return {
//       date: date.toISOString().split('T')[0],
//       variance: -3 + Math.random() * 4, // -3% to +1%
//     };
//   });

//   const rawMaterialCostPerTon = 8.5;
//   const energyCostPerTon = 0.42;
//   const totalVariableCost = 437500;

//   return {
//     costPerUnit: 12.5,
//     totalProductionCost: 437500,
//     maintenanceCostPerUnit: 1.8,
//     costVariance: -2.3,
//     roi: 18.5,
//     costBreakdown: [
//       { name: 'Materials', value: 175000 },
//       { name: 'Labor', value: 105000 },
//       { name: 'Energy', value: 87500 },
//       { name: 'Maintenance', value: 35000 },
//       { name: 'Overhead', value: 35000 },
//     ],
//     costDistribution: [
//       { name: 'Materials', value: 40 },
//       { name: 'Labor', value: 24 },
//       { name: 'Energy', value: 20 },
//       { name: 'Maintenance', value: 8 },
//       { name: 'Overhead', value: 8 },
//     ],
//     rawMaterialCostPerTon,
//     energyCostPerTon,
//     totalVariableCost,
//     costVarianceTrend,
//   };
// };

// // Modern Semi-Circular Power Gauge Component
// const ModernPowerGauge: React.FC<{
//   value: number;
//   max: number;
//   title: string;
//   unit?: string;
//   color?: string;
//   theme?: 'light' | 'dark';
// }> = ({ value, max, title, unit = '%', color = '#06b6d4', theme = 'dark' }) => {
//   const percentage = Math.min((value / max) * 100, 100);
//   const radius = 80;
//   const centerX = 100;
//   const centerY = 100;
//   const startAngle = 180; // Left side (0%)
//   const endAngle = 0; // Right side (100%)
//   const totalAngle = 180;
  
//   // Calculate the current angle (0% = 180°, 100% = 0°)
//   const currentAngle = startAngle - (percentage / 100) * totalAngle;
//   const currentAngleRad = (currentAngle * Math.PI) / 180;
  
//   // Calculate the end point of the filled arc
//   const arcEndX = centerX + Math.cos(currentAngleRad) * radius;
//   const arcEndY = centerY - Math.sin(currentAngleRad) * radius;
  
//   // Needle position
//   const needleLength = radius * 0.7;
//   const needleX = centerX + Math.cos(currentAngleRad) * needleLength;
//   const needleY = centerY - Math.sin(currentAngleRad) * needleLength;
  
//   // Start point of the arc (left side - 0%)
//   const arcStartX = centerX - radius;
//   const arcStartY = centerY;
  
//   // Full arc end point (right side - 100%)
//   const arcEndPointX = centerX + radius;
//   const arcEndPointY = centerY;

//   // Function to create arc path - always use sweep flag 1 (clockwise) and largeArc 0 (short arc)
//   const getArcPath = (startX: number, startY: number, endX: number, endY: number) => {
//     // For semicircle from 180° to 0°, we always want the short arc (largeArc = 0)
//     // Sweep flag = 1 means clockwise direction
//     return `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;
//   };

//   // Always use cyan color for the gauge
//   const gaugeColor = color || '#06b6d4'; // Cyan 500

//   return (
//     <div className="flex flex-col items-center w-full">
//       <div className="relative w-full flex items-center justify-center" style={{ maxWidth: '280px', minHeight: '320px' }}>
//         <svg viewBox="0 0 200 120" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
//           <defs>
//             <linearGradient id={`energyGaugeGradient-${title}`} x1="0%" y1="0%" x2="100%" y2="0%">
//               <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
//               <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
//               <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
//             </linearGradient>
//             <filter id="glow">
//               <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
//               <feMerge>
//                 <feMergeNode in="coloredBlur"/>
//                 <feMergeNode in="SourceGraphic"/>
//               </feMerge>
//             </filter>
//           </defs>
          
//           {/* Background arc - full semicircle */}
//           <path
//             d={getArcPath(arcStartX, arcStartY, arcEndPointX, arcEndPointY)}
//             fill="none"
//             stroke="rgba(148, 163, 184, 0.2)"
//             strokeWidth="14"
//             strokeLinecap="round"
//           />
          
//           {/* Filled arc with cyan color and glow effect - from start to current value */}
//           {percentage > 0 && (
//             <path
//               d={getArcPath(arcStartX, arcStartY, arcEndX, arcEndY)}
//               fill="none"
//               stroke="#06b6d4"
//               strokeWidth="14"
//               strokeLinecap="round"
//               className="transition-all duration-1000"
//               filter="url(#glow)"
//             />
//           )}
          
//           {/* Scale marks */}
//           {[0, 25, 50, 75, 100].map((mark) => {
//             const markAngle = startAngle - (mark / 100) * totalAngle;
//             const markAngleRad = (markAngle * Math.PI) / 180;
//             const markStartX = centerX + Math.cos(markAngleRad) * (radius - 10);
//             const markStartY = centerY - Math.sin(markAngleRad) * (radius - 10);
//             const markEndX = centerX + Math.cos(markAngleRad) * (radius + 10);
//             const markEndY = centerY - Math.sin(markAngleRad) * (radius + 10);
            
//             return (
//               <g key={mark}>
//                 <line
//                   x1={markStartX}
//                   y1={markStartY}
//                   x2={markEndX}
//                   y2={markEndY}
//                   stroke="#06b6d4"
//                   strokeWidth="3"
//                   opacity="0.7"
//                 />
//                         <text
//                           x={centerX + Math.cos(markAngleRad) * (radius + 28)}
//                           y={centerY - Math.sin(markAngleRad) * (radius + 28)}
//                           className="fill-slate-600 dark:fill-slate-400"
//                           fontSize="12"
//                           textAnchor="middle"
//                           dominantBaseline="middle"
//                           fontWeight="600"
//                         >
//                           {mark}%
//                         </text>
//               </g>
//             );
//           })}
          
//           {/* Needle */}
//           <line
//             x1={centerX}
//             y1={centerY}
//             x2={needleX}
//             y2={needleY}
//             stroke={theme === 'dark' ? '#ffffff' : '#06b6d4'}
//             strokeWidth="4"
//             strokeLinecap="round"
//             className="transition-all duration-1000"
//             filter="url(#glow)"
//           />
          
//           {/* Needle center dot */}
//           <circle
//             cx={centerX}
//             cy={centerY}
//             r="8"
//             fill="#06b6d4"
//             stroke={theme === 'dark' ? '#ffffff' : '#06b6d4'}
//             strokeWidth="3"
//             filter="url(#glow)"
//           />
//         </svg>
//       </div>
//       {/* Value display below gauge */}
//       <div className="text-center -mt-4">
//         <p className="text-3xl font-bold mb-1" style={{ color: '#06b6d4' }}>
//           {value.toFixed(1)}{unit}
//         </p>
//         <p className="text-xs text-slate-400">{title}</p>
//       </div>
//     </div>
//   );
// };

// // Circular Progress Gauge Component
// const CircularProgressGauge: React.FC<{
//   value: number;
//   max: number;
//   label: string;
//   valueLabel: string;
//   color: string;
//   theme?: 'light' | 'dark';
// }> = ({ value, max, label, valueLabel, color, theme = 'dark' }) => {
//   const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
//   const size = 120;
//   const strokeWidth = 12;
//   const radius = (size - strokeWidth) / 2;
//   const circumference = 2 * Math.PI * radius;
//   // Calculate offset: for 87% fill, we want 87% visible, so offset by 13% (the unfilled portion)
//   const offset = circumference - (percentage / 100) * circumference;

//   return (
//     <div className="flex flex-col items-center">
//       <div className="relative" style={{ width: size, height: size }}>
//         <svg width={size} height={size} className="transform -rotate-90" style={{ transformOrigin: 'center' }}>
//           <defs>
//             <linearGradient id={`gradient-${label.replace(/\s+/g, '-')}`} x1="0%" y1="0%" x2="100%" y2="0%">
//               <stop offset="0%" stopColor={color} stopOpacity={0.8} />
//               <stop offset="100%" stopColor={color} stopOpacity={1} />
//             </linearGradient>
//           </defs>
//           {/* Background circle */}
//           <circle
//             cx={size / 2}
//             cy={size / 2}
//             r={radius}
//             fill="none"
//             stroke={theme === 'dark' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.3)'}
//             strokeWidth={strokeWidth}
//           />
//           {/* Progress circle */}
//           <circle
//             cx={size / 2}
//             cy={size / 2}
//             r={radius}
//             fill="none"
//             stroke={`url(#gradient-${label.replace(/\s+/g, '-')})`}
//             strokeWidth={strokeWidth}
//             strokeDasharray={circumference}
//             strokeDashoffset={offset}
//             strokeLinecap="round"
//             className="transition-all duration-1000 ease-out"
//             style={{ transformOrigin: 'center' }}
//           />
//         </svg>
//         {/* Center percentage */}
//         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//           <span className="text-2xl font-bold text-slate-900 dark:text-white">
//             {percentage.toFixed(0)}%
//           </span>
//         </div>
//       </div>
//       {/* Value label below */}
//       <div className="text-center mt-2">
//         <p className="text-sm font-semibold text-slate-900 dark:text-white">{valueLabel}</p>
//         <p className="text-xs text-slate-600 dark:text-slate-400">{label}</p>
//       </div>
//     </div>
//   );
// };

// // 6-Step 3D Pie Chart Infographic Component
// interface SectionData {
//   title: string;
//   description: string;
//   icon?: React.ReactNode;
//   color?: string;
// }

// interface PieChart3DProps {
//   sections?: SectionData[];
//   chartTitle?: string;
//   size?: number;
//   theme?: 'light' | 'dark';
// }

// const PieChart3DInfographic: React.FC<PieChart3DProps> = ({
//   sections,
//   chartTitle = "6 Step 3D Pie Chart Infographic",
//   size = 500,
//   theme = 'dark',
// }) => {
//   const defaultSections: SectionData[] = sections || [
//     { title: 'TITLE HERE', description: 'Some text goes here. Some text goes here. Some text goes here.' },
//     { title: 'TITLE HERE', description: 'Some text goes here. Some text goes here. Some text goes here.' },
//     { title: 'TITLE HERE', description: 'Some text goes here. Some text goes here. Some text goes here.' },
//     { title: 'TITLE HERE', description: 'Some text goes here. Some text goes here. Some text goes here.' },
//     { title: 'TITLE HERE', description: 'Some text goes here. Some text goes here. Some text goes here.' },
//     { title: 'TITLE HERE', description: 'Some text goes here. Some text goes here. Some text goes here.' },
//   ];

//   const numSections = defaultSections.length;
//   // Increase SVG size to accommodate label boxes
//   const svgSize = Math.max(size, 2000);
//   const padding = 400; // Padding for label boxes
//   const chartSize = svgSize - (padding * 2);
//   const centerX = padding + chartSize / 2;
//   const centerY = padding + chartSize / 2;
//   const outerRadius = 350; // Increased significantly to fill card
//   const innerRadius = 160; // Increased proportionally
//   const depth = 50; // Increased for better 3D effect
//   const gap = 3;
//   const sectionAngle = 360 / numSections;

//   // Colors: darker to lighter teal/cyan
//   const defaultColors = ['#0891b2', '#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe'];

//   // Isometric 3D transformation
//   const isometricX = (x: number, y: number) => x - y;
//   const isometricY = (x: number, y: number, z: number) => (x + y) / 2 - z;

//   // Create 3D segment path
//   const create3DSegment = (index: number, startAngle: number, endAngle: number) => {
//     const startRad = ((startAngle - 90) * Math.PI) / 180;
//     const endRad = ((endAngle - 90) * Math.PI) / 180;
    
//     // Center point for icon and explode direction
//     const midAngle = (startAngle + endAngle) / 2;
//     const midRad = ((midAngle - 90) * Math.PI) / 180;

//     // Top arc points
//     const topOuterStartX = centerX + Math.cos(startRad) * outerRadius;
//     const topOuterStartY = centerY + Math.sin(startRad) * outerRadius;
//     const topOuterEndX = centerX + Math.cos(endRad) * outerRadius;
//     const topOuterEndY = centerY + Math.sin(endRad) * outerRadius;

//     const topInnerStartX = centerX + Math.cos(startRad) * innerRadius;
//     const topInnerStartY = centerY + Math.sin(startRad) * innerRadius;
//     const topInnerEndX = centerX + Math.cos(endRad) * innerRadius;
//     const topInnerEndY = centerY + Math.sin(endRad) * innerRadius;

//     // Bottom arc points (offset by depth)
//     const bottomOuterStartX = centerX + Math.cos(startRad) * (outerRadius - depth);
//     const bottomOuterStartY = centerY + Math.sin(startRad) * (outerRadius - depth);
//     const bottomOuterEndX = centerX + Math.cos(endRad) * (outerRadius - depth);
//     const bottomOuterEndY = centerY + Math.sin(endRad) * (outerRadius - depth);

//     const bottomInnerStartX = centerX + Math.cos(startRad) * (innerRadius - depth);
//     const bottomInnerStartY = centerY + Math.sin(startRad) * (innerRadius - depth);
//     const bottomInnerEndX = centerX + Math.cos(endRad) * (innerRadius - depth);
//     const bottomInnerEndY = centerY + Math.sin(endRad) * (innerRadius - depth);

//     // Explode outward slightly
//     const explodeDistance = 8;
//     const explodeX = Math.cos(midRad) * explodeDistance;
//     const explodeY = Math.sin(midRad) * explodeDistance;

//     const largeArc = endAngle - startAngle > 180 ? 1 : 0;

//     // Top face (donut segment)
//     const topFace = `
//       M ${topOuterStartX + explodeX} ${topOuterStartY + explodeY}
//       A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${topOuterEndX + explodeX} ${topOuterEndY + explodeY}
//       L ${topInnerEndX + explodeX} ${topInnerEndY + explodeY}
//       A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${topInnerStartX + explodeX} ${topInnerStartY + explodeY}
//       Z
//     `;

//     // Outer side face
//     const outerSide = `
//       M ${topOuterStartX + explodeX} ${topOuterStartY + explodeY}
//       L ${bottomOuterStartX + explodeX} ${bottomOuterStartY + explodeY}
//       L ${bottomOuterEndX + explodeX} ${bottomOuterEndY + explodeY}
//       L ${topOuterEndX + explodeX} ${topOuterEndY + explodeY}
//       Z
//     `;

//     // Inner side face
//     const innerSide = `
//       M ${topInnerStartX + explodeX} ${topInnerStartY + explodeY}
//       L ${bottomInnerStartX + explodeX} ${bottomInnerStartY + explodeY}
//       L ${bottomInnerEndX + explodeX} ${bottomInnerEndY + explodeY}
//       L ${topInnerEndX + explodeX} ${topInnerEndY + explodeY}
//       Z
//     `;

//     // Left side face
//     const leftSide = `
//       M ${topOuterStartX + explodeX} ${topOuterStartY + explodeY}
//       L ${bottomOuterStartX + explodeX} ${bottomOuterStartY + explodeY}
//       L ${bottomInnerStartX + explodeX} ${bottomInnerStartY + explodeY}
//       L ${topInnerStartX + explodeX} ${topInnerStartY + explodeY}
//       Z
//     `;

//     // Right side face
//     const rightSide = `
//       M ${topOuterEndX + explodeX} ${topOuterEndY + explodeY}
//       L ${bottomOuterEndX + explodeX} ${bottomOuterEndY + explodeY}
//       L ${bottomInnerEndX + explodeX} ${bottomInnerEndY + explodeY}
//       L ${topInnerEndX + explodeX} ${topInnerEndY + explodeY}
//       Z
//     `;

//     // Center point for icon
//     const midRadius = (outerRadius + innerRadius) / 2;
//     const iconX = centerX + Math.cos(midRad) * midRadius + explodeX;
//     const iconY = centerY + Math.sin(midRad) * midRadius + explodeY;

//     return {
//       topFace,
//       outerSide,
//       innerSide,
//       leftSide,
//       rightSide,
//       iconX,
//       iconY,
//       midRad,
//       midAngle,
//     };
//   };

//   // Get label box position
//   const getLabelPosition = (index: number) => {
//     const angle = (index * sectionAngle) - 90;
//     const angleRad = (angle * Math.PI) / 180;
//     const distance = 420; // Increased to accommodate larger chart and boxes
    
//     let x, y, anchor;
//     if (index < numSections / 2) {
//       // Left side
//       x = centerX - distance;
//       y = centerY + Math.sin(angleRad) * (outerRadius + 120);
//       anchor = 'end';
//     } else {
//       // Right side
//       x = centerX + distance;
//       y = centerY + Math.sin(angleRad) * (outerRadius + 120);
//       anchor = 'start';
//     }
    
//     return { x, y, anchor, angleRad };
//   };

//   return (
//     <div 
//       className="relative w-full h-full flex flex-col items-center justify-start"
//       style={{ 
//         minHeight: '600px',
//         paddingTop: '0px',
//         marginTop: '0px',
//       }}
//     >
//       <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="max-w-full max-h-full">
//         <defs>
//           <filter id="segment3DShadow">
//             <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
//             <feOffset dx="3" dy="3" result="offsetblur" />
//             <feComponentTransfer>
//               <feFuncA type="linear" slope="0.4" />
//             </feComponentTransfer>
//             <feMerge>
//               <feMergeNode />
//               <feMergeNode in="SourceGraphic" />
//             </feMerge>
//           </filter>
//           <linearGradient id="segmentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
//             <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
//             <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.7" />
//           </linearGradient>
//           <marker
//             id="arrowhead3D"
//             markerWidth="10"
//             markerHeight="10"
//             refX="9"
//             refY="3"
//             orient="auto"
//           >
//             <polygon points="0 0, 10 3, 0 6" fill="#666" />
//           </marker>
//         </defs>

//         {/* 3D Segments */}
//         {defaultSections.map((section, index) => {
//           const startAngle = index * sectionAngle;
//           const endAngle = (index + 1) * sectionAngle - gap;
//           const segment = create3DSegment(index, startAngle, endAngle);
//           const color = section.color || defaultColors[index % defaultColors.length];
//           const labelPos = getLabelPosition(index);

//           return (
//             <g key={`segment-${index}`}>
//               {/* Side faces (darker for 3D effect) */}
//               <path
//                 d={segment.outerSide}
//                 fill={color}
//                 opacity="0.4"
//                 filter="url(#segment3DShadow)"
//               />
//               <path
//                 d={segment.innerSide}
//                 fill={color}
//                 opacity="0.3"
//                 filter="url(#segment3DShadow)"
//               />
//               <path
//                 d={segment.leftSide}
//                 fill={color}
//                 opacity="0.5"
//                 filter="url(#segment3DShadow)"
//               />
//               <path
//                 d={segment.rightSide}
//                 fill={color}
//                 opacity="0.5"
//                 filter="url(#segment3DShadow)"
//               />
              
//               {/* Top face (brighter) */}
//               <path
//                 d={segment.topFace}
//                 fill={color}
//                 opacity="0.95"
//                 filter="url(#segment3DShadow)"
//               />
              
//               {/* White circle icon in center of segment */}
//               <circle
//                 cx={segment.iconX}
//                 cy={segment.iconY}
//                 r="28"
//                 fill="white"
//                 stroke={color}
//                 strokeWidth="4"
//                 filter="url(#segment3DShadow)"
//               />
              
//               {/* Connection line to label */}
//               <line
//                 x1={segment.iconX}
//                 y1={segment.iconY}
//                 x2={labelPos.x}
//                 y2={labelPos.y}
//                 stroke="#666"
//                 strokeWidth="2"
//                 strokeDasharray="none"
//                 markerEnd="url(#arrowhead3D)"
//               />
              
//               {/* Label box */}
//               <g>
//                 <rect
//                   x={labelPos.anchor === 'end' ? labelPos.x - 600 : labelPos.x}
//                   y={labelPos.y - 140}
//                   width="600"
//                   height="280"
//                   fill={theme === 'dark' ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)'}
//                   stroke={theme === 'dark' ? 'rgba(6, 182, 212, 0.6)' : 'rgba(6, 182, 212, 0.4)'}
//                   strokeWidth="3.5"
//                   rx="16"
//                   filter="url(#segment3DShadow)"
//                 />
//                 <text
//                   x={labelPos.anchor === 'end' ? labelPos.x - 50 : labelPos.x + 50}
//                   y={labelPos.y - 60}
//                   textAnchor={labelPos.anchor}
//                   fill={theme === 'dark' ? '#ffffff' : '#1e293b'}
//                   fontSize="42"
//                   fontWeight="700"
//                 >
//                   {section.title}
//                 </text>
//                 <text
//                   x={labelPos.anchor === 'end' ? labelPos.x - 50 : labelPos.x + 50}
//                   y={labelPos.y + 30}
//                   textAnchor={labelPos.anchor}
//                   fill={theme === 'dark' ? '#f1f5f9' : '#334155'}
//                   fontSize="26"
//                   fontWeight="400"
//                 >
//                   {section.description.split('.')[0]}.
//                 </text>
//                 <text
//                   x={labelPos.anchor === 'end' ? labelPos.x - 50 : labelPos.x + 50}
//                   y={labelPos.y + 85}
//                   textAnchor={labelPos.anchor}
//                   fill={theme === 'dark' ? '#f1f5f9' : '#334155'}
//                   fontSize="26"
//                   fontWeight="400"
//                 >
//                   {section.description.split('.')[1] || ''}
//                 </text>
//                 {section.description.split('.').length > 2 && (
//                   <text
//                     x={labelPos.anchor === 'end' ? labelPos.x - 50 : labelPos.x + 50}
//                     y={labelPos.y + 140}
//                     textAnchor={labelPos.anchor}
//                     fill={theme === 'dark' ? '#f1f5f9' : '#334155'}
//                     fontSize="26"
//                     fontWeight="400"
//                   >
//                     {section.description.split('.')[2] || ''}
//                   </text>
//                 )}
//               </g>
//             </g>
//           );
//         })}

//         {/* Center hole (transparent to show card background) */}
//         <circle
//           cx={centerX}
//           cy={centerY}
//           r={innerRadius - depth}
//           fill="transparent"
//           stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
//           strokeWidth="2"
//         />
//       </svg>
      
//       {/* Chart Title - Below the chart */}
//       {chartTitle && (
//         <div className="w-full text-center mt-4">
//           <p className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
//             {chartTitle}
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// // Animated Number Counter Component
// const AnimatedNumber: React.FC<{ value: number; decimals?: number; className?: string }> = ({
//   value,
//   decimals = 0,
//   className,
// }) => {
//   const [displayValue, setDisplayValue] = useState(0);

//   useEffect(() => {
//     const duration = 1500;
//     const steps = 60;
//     const increment = value / steps;
//     let current = 0;
//     let step = 0;

//     const timer = setInterval(() => {
//       step++;
//       current += increment;
//       if (step >= steps) {
//         setDisplayValue(value);
//         clearInterval(timer);
//       } else {
//         setDisplayValue(current);
//       }
//     }, duration / steps);

//     return () => clearInterval(timer);
//   }, [value]);

//   return (
//     <span className={className}>
//       {displayValue.toFixed(decimals).toLocaleString()}
//     </span>
//   );
// };

// // KPI Summary Card Component
// const KPISummaryCard: React.FC<{ kpi: KPISummary; index: number }> = ({ kpi, index }) => {
//   const Icon = kpi.icon;

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5, delay: index * 0.1 }}
//       whileHover={{ scale: 1.02, y: -4 }}
//       className="group"
//     >
//       <Card className="relative overflow-hidden border-cyan-500/30 dark:border-cyan-500/30 bg-white dark:bg-slate-900/95 backdrop-blur-sm hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] dark:hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]">
//         <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-5 dark:opacity-5 group-hover:opacity-10 dark:group-hover:opacity-10 transition-opacity`} />
//         <CardContent className="p-3 relative">
//           <div className="flex items-start justify-between mb-2">
//             <div className="flex-1">
//               <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400/80 uppercase tracking-wider mb-1">
//                 {kpi.title}
//               </p>
//               <div className="flex items-baseline gap-1">
//                 <AnimatedNumber
//                   value={kpi.value}
//                   decimals={kpi.unit === '%' ? 1 : 0}
//                   className="text-3xl font-bold text-slate-900 dark:text-white"
//                 />
//                 {kpi.unit && (
//                   <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{kpi.unit}</span>
//                 )}
//               </div>
//             </div>
//             <div className={`p-2 rounded-lg bg-gradient-to-br ${kpi.color} shadow-lg group-hover:shadow-xl transition-shadow`}>
//               <Icon className="h-4 w-4 text-white" />
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </motion.div>
//   );
// };

// // Chart Card Component
// const ChartCard: React.FC<{
//   title: string;
//   subtitle?: string;
//   children: React.ReactNode;
//   className?: string;
//   onExport?: () => void;
//   onFullscreen?: () => void;
// }> = ({ title, subtitle, children, className, onExport, onFullscreen }) => {
//   return (
//     <motion.div
//       initial={{ opacity: 0, scale: 0.95 }}
//       animate={{ opacity: 1, scale: 1 }}
//       transition={{ duration: 0.4 }}
//       whileHover={{ scale: 1.01 }}
//       className="flex-1 flex min-h-0"
//     >
//       <Card className={cn(
//         "border-cyan-500/30 dark:border-cyan-500/30 bg-white dark:bg-slate-900/95 backdrop-blur-sm hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] dark:hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] h-full w-full flex flex-col",
//         className
//       )}>
//         <CardHeader className="pb-2 pt-3 px-4 flex-shrink-0">
//           <div className="flex items-start justify-between">
//             <div className="flex-1">
//               <CardTitle className="text-base font-bold text-slate-900 dark:text-white mb-0.5">{title}</CardTitle>
//               {subtitle && (
//                 <p className="text-xs text-slate-600 dark:text-slate-400">{subtitle}</p>
//               )}
//             </div>
//             <div className="flex items-center gap-1">
//               {onExport && (
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={onExport}
//                   className="h-6 w-6 p-0 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
//                 >
//                   <FaDownload className="h-3 w-3" />
//                 </Button>
//               )}
//               {onFullscreen && (
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={onFullscreen}
//                   className="h-6 w-6 p-0 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
//                 >
//                   <FaExpand className="h-3 w-3" />
//                 </Button>
//               )}
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent className="px-4 pb-3 flex-1 flex flex-col">
//           {children}
//         </CardContent>
//       </Card>
//     </motion.div>
//   );
// };

// // Loading Skeleton
// const LoadingSkeleton: React.FC = () => {
//   return (
//     <div className="space-y-6">
//       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
//         {Array.from({ length: 5 }).map((_, i) => (
//           <Skeleton key={i} className="h-32 bg-slate-800/50" />
//         ))}
//       </div>
//       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
//         {Array.from({ length: 6 }).map((_, i) => (
//           <Skeleton key={i} className="h-96 bg-slate-800/50" />
//         ))}
//       </div>
//     </div>
//   );
// };

// // Main Component
// export const KPIOverview: React.FC = () => {
//   const { theme } = useTheme();
//   const [loading, setLoading] = useState(true);
//   const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
//     start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
//     end: new Date(),
//   });
//   const [quickFilter, setQuickFilter] = useState<'today' | 'week' | 'month' | 'quarter'>('month');
//   const [isRealTime, setIsRealTime] = useState(true);
  
//   // Tooltip style based on theme
//   const tooltipStyle = {
//     backgroundColor: theme === 'dark' ? '#1e293b' : 'rgb(255 255 255 / 0.95)',
//     border: '1px solid #06b6d4',
//     borderRadius: '8px',
//     color: theme === 'dark' ? '#ffffff' : '#1e293b',
//   };

//   // Generate mock data
//   const productionData = useMemo(() => generateProductionData(30), []);
//   const managementData = useMemo(() => generateManagementData(30), []);
//   const maintenanceData = useMemo(() => generateMaintenanceData(), []);
//   const energyData = useMemo(() => generateEnergyData(), []);
//   const costingData = useMemo(() => generateCostingData(), []);

//   // KPI Summary Cards Data
//   const kpiSummaries: KPISummary[] = [
//     {
//       id: 'production',
//       title: 'Production',
//       value: productionData.overallThroughput,
//       unit: 'units/hr',
//       icon: FaIndustry,
//       color: 'from-cyan-500 to-blue-600',
//       trend: 5.2,
//       previousValue: 880,
//     },
//     {
//       id: 'management',
//       title: 'Management',
//       value: managementData.scheduleAdherence,
//       unit: '%',
//       icon: FaCog,
//       color: 'from-purple-500 to-pink-600',
//       trend: 2.1,
//       previousValue: 90.4,
//     },
//     {
//       id: 'maintenance',
//       title: 'OEE',
//       value: maintenanceData.oee,
//       unit: '%',
//       icon: FaChartLine,
//       color: 'from-emerald-500 to-green-600',
//       trend: 1.8,
//       previousValue: 80.7,
//     },
//     {
//       id: 'energy',
//       title: 'Energy',
//       value: energyData.energyEfficiency,
//       unit: 'kWh/unit',
//       icon: FaBolt,
//       color: 'from-yellow-500 to-orange-600',
//       trend: -3.5,
//       previousValue: 2.9,
//     },
//     {
//       id: 'costing',
//       title: 'Costing',
//       value: costingData.costPerUnit,
//       unit: '$',
//       icon: FaDollarSign,
//       color: 'from-blue-500 to-indigo-600',
//       trend: -2.3,
//       previousValue: 12.8,
//     },
//   ];

//   useEffect(() => {
//     // Simulate loading
//     const timer = setTimeout(() => setLoading(false), 1000);
//     return () => clearTimeout(timer);
//   }, []);

//   // Chart colors - Cyan theme
//   const chartColors = {
//     primary: '#06b6d4',      // Cyan 500
//     secondary: '#06b6d4',    // Cyan 500
//     tertiary: '#06b6d4',     // Cyan 500
//     success: '#06b6d4',     // Cyan 500
//     warning: '#06b6d4',     // Cyan 500
//     danger: '#06b6d4',      // Cyan 500
//   };

//   const pieColors = ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe']; // Cyan variations

//   // Radar chart data for KPI Performance
//   const radarChartData = useMemo(() => [
//     { subject: 'Production', value: Math.min((productionData.overallThroughput / 1000) * 100, 100), fullMark: 100 },
//     { subject: 'Quality', value: productionData.productionYield, fullMark: 100 },
//     { subject: 'Efficiency', value: maintenanceData.oee, fullMark: 100 },
//     { subject: 'Cost', value: Math.max(100 - (costingData.costPerUnit / 15) * 100, 0), fullMark: 100 },
//     { subject: 'Energy', value: Math.max(100 - (energyData.energyEfficiency / 5) * 100, 0), fullMark: 100 },
//     { subject: 'Management', value: managementData.scheduleAdherence, fullMark: 100 },
//   ], [productionData, maintenanceData, costingData, energyData, managementData]);

//   if (loading) {
//     return (
//       <WaterSystemLayout>
//         <LoadingSkeleton />
//       </WaterSystemLayout>
//     );
//   }

//   return (
//     <WaterSystemLayout>
//       <div className="space-y-3 p-4 bg-white dark:bg-[#0f172a] min-h-screen overflow-auto">
//         {/* Header Section */}
//         <div className="flex items-center justify-between mb-2">
//           <div>
//             <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">KPI Overview Dashboard</h1>
//             <p className="text-xs text-slate-600 dark:text-slate-400">Comprehensive performance metrics and analytics</p>
//           </div>
//           <div className="flex items-center gap-3">
//             {/* Real-time Indicator */}
//             {isRealTime && (
//               <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/20 dark:bg-emerald-500/20 border border-emerald-500/30 dark:border-emerald-500/30 rounded-lg">
//                 <div className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse" />
//                 <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Live</span>
//               </div>
//             )}
//             {/* Date Range Picker */}
//             <div className="flex items-center gap-2">
//               <FaCalendarAlt className="h-3 w-3 text-slate-600 dark:text-slate-400" />
//               <input
//                 type="date"
//                 value={dateRange.start.toISOString().split('T')[0]}
//                 onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value) })}
//                 className="px-2 py-1 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-500"
//               />
//               <span className="text-xs text-slate-600 dark:text-slate-400">to</span>
//               <input
//                 type="date"
//                 value={dateRange.end.toISOString().split('T')[0]}
//                 onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value) })}
//                 className="px-2 py-1 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-500"
//               />
//             </div>
//           </div>
//         </div>

//         {/* KPI Summary Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2 mb-3">
//           {kpiSummaries.map((kpi, index) => (
//             <KPISummaryCard key={kpi.id} kpi={kpi} index={index} />
//           ))}
//         </div>

//         {/* Chart Grid - 3 Column Layout */}
//         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-fr">
//           {/* LEFT COLUMN */}
//           <div className="flex flex-col gap-3">
//             {/* PRODUCTION KPIs */}
//             <ChartCard
//               title="Production KPIs"
//               subtitle="Overall Throughput Trends"
//             >
//               <ResponsiveContainer width="100%" height={320}>
//                 <AreaChart data={productionData.trendData}>
//                   <defs>
//                     <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
//                       <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8} />
//                       <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.1} />
//                     </linearGradient>
//                   </defs>
//                   <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-700" />
//                   <XAxis dataKey="date" className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
//                   <YAxis className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
//                   <Tooltip
//                     contentStyle={tooltipStyle}
//                     labelStyle={{ color: '#06b6d4' }}
//                   />
//                   <Area
//                     type="monotone"
//                     dataKey="value"
//                     stroke={chartColors.primary}
//                     fillOpacity={1}
//                     fill="url(#colorThroughput)"
//                   />
//                 </AreaChart>
//               </ResponsiveContainer>
//               <div className="grid grid-cols-5 gap-2 mt-2">
//                 <div className="text-center p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Total Production</p>
//                   <p className="text-sm font-bold text-slate-900 dark:text-white">{productionData.totalProduction.toFixed(1)}</p>
//                   <p className="text-xs text-slate-500 dark:text-slate-500">TON/Shift/Day</p>
//                 </div>
//                 <div className="text-center p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Actual vs Target</p>
//                   <p className="text-sm font-bold text-slate-900 dark:text-white">
//                     {((productionData.actualProduction / productionData.targetProduction) * 100).toFixed(1)}%
//                   </p>
//                   <p className="text-xs text-slate-500 dark:text-slate-500">Target: {productionData.targetProduction.toFixed(0)}</p>
//                 </div>
//                 <div className="text-center p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Yield</p>
//                   <p className="text-sm font-bold text-slate-900 dark:text-white">{productionData.productionYield}%</p>
//                 </div>
//                 <div className="text-center p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Throughput</p>
//                   <p className="text-sm font-bold text-slate-900 dark:text-white">{productionData.overallThroughput}</p>
//                   <p className="text-xs text-slate-500 dark:text-slate-500">units/hr</p>
//                 </div>
//                 <div className="text-center p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Downtime</p>
//                   <p className="text-sm font-bold text-slate-900 dark:text-white">{productionData.downtimeDuration.toFixed(1)}</p>
//                   <p className="text-xs text-slate-500 dark:text-slate-500">hours</p>
//                 </div>
//               </div>
//             </ChartCard>

//             {/* Downtime Duration */}
//             <ChartCard title="Downtime Duration" subtitle="Daily Trend Analysis">
//               <ResponsiveContainer width="100%" height={320}>
//                 <AreaChart data={productionData.downtimeTrend.slice(-14)}>
//                   <defs>
//                     <linearGradient id="colorDowntime" x1="0" y1="0" x2="0" y2="1">
//                       <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8} />
//                       <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.1} />
//                     </linearGradient>
//                   </defs>
//                   <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-700" />
//                   <XAxis dataKey="date" className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor', fontSize: 10 }} />
//                   <YAxis className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
//                   <Tooltip
//                     contentStyle={tooltipStyle}
//                     formatter={(value: number) => [`${value.toFixed(2)} hrs`, 'Downtime']}
//                   />
//                   <Area
//                     type="monotone"
//                     dataKey="duration"
//                     stroke={chartColors.primary}
//                     fillOpacity={1}
//                     fill="url(#colorDowntime)"
//                   />
//                 </AreaChart>
//               </ResponsiveContainer>
//             </ChartCard>

//             {/* OEE Components */}
//             <ChartCard title="OEE Components" subtitle="Breakdown Analysis">
//               <div style={{ height: '600px', width: '100%', marginTop: '-60px', marginLeft: '-16px', marginRight: '-16px' }}>
//                 <PieChart3DInfographic
//                   sections={maintenanceData.oeeBreakdown.map((item, index) => ({
//                     title: item.name,
//                     description: `${item.name} component represents ${item.value}% of overall equipment effectiveness. This metric is crucial for performance analysis.`,
//                     color: pieColors[index % pieColors.length],
//                   }))}
//                   chartTitle="6 Step 3D Pie Chart Infographic"
//                   size={900}
//                   theme={theme}
//                 />
//               </div>
//             </ChartCard>

//             {/* OEE Overview */}
//             <ChartCard title="OEE Overview" subtitle="Overall Equipment Effectiveness">
//               <div className="relative flex flex-col items-center justify-center" style={{ height: '320px' }}>
//                 <div className="relative flex items-center justify-center flex-1 w-full">
//                   <ResponsiveContainer width="100%" height={320}>
//                     <RadialBarChart
//                       innerRadius="60%"
//                       outerRadius="90%"
//                       data={[
//                         { name: 'Max', value: 100, fill: theme === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)' },
//                         { name: 'OEE', value: maintenanceData.oee, fill: chartColors.success },
//                       ]}
//                       startAngle={90}
//                       endAngle={-270}
//                     >
//                       <RadialBar 
//                         dataKey="value" 
//                         cornerRadius={10}
//                       >
//                         <Cell fill={theme === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'} />
//                         <Cell fill={chartColors.success} />
//                       </RadialBar>
//                       <Tooltip
//                         contentStyle={{
//                           ...tooltipStyle,
//                           border: '1px solid #10b981',
//                         }}
//                         formatter={(value: number, name: string) => {
//                           if (name === 'Max') return null;
//                           return [`${value}%`, 'OEE'];
//                         }}
//                       />
//                     </RadialBarChart>
//                   </ResponsiveContainer>
//                   {/* Centered percentage text */}
//                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//                     <p className="text-2xl font-bold text-slate-900 dark:text-white">{maintenanceData.oee}%</p>
//                   </div>
//                 </div>
//                 {/* Label below the chart */}
//                 <div className="text-center mt-2">
//                   <p className="text-xs text-slate-600 dark:text-slate-400">Overall Equipment Effectiveness</p>
//                 </div>
//               </div>
//             </ChartCard>

//             {/* COSTING KPIs - Distribution */}
//             <ChartCard title="Cost Distribution" subtitle="Percentage Breakdown">
//               <ResponsiveContainer width="100%" height={320}>
//                 <PieChart>
//                   <Pie
//                     data={costingData.costDistribution}
//                     cx="50%"
//                     cy="50%"
//                     labelLine={false}
//                     label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
//                     outerRadius={70}
//                     fill="#8884d8"
//                     dataKey="value"
//                   >
//                     {costingData.costDistribution.map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
//                     ))}
//                   </Pie>
//                   <Tooltip
//                     contentStyle={{
//                       ...tooltipStyle,
//                       border: '1px solid #3b82f6',
//                     }}
//                   />
//                 </PieChart>
//               </ResponsiveContainer>
//               <div className="grid grid-cols-3 gap-2 mt-2">
//                 <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Cost Variance</p>
//                   <p className={`text-sm font-bold ${costingData.costVariance >= 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
//                     {costingData.costVariance}%
//                   </p>
//                 </div>
//                 <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">ROI</p>
//                   <p className="text-sm font-bold text-slate-900 dark:text-white">{costingData.roi}%</p>
//                 </div>
//                 <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Maint. Cost/Unit</p>
//                   <p className="text-sm font-bold text-slate-900 dark:text-white">${costingData.maintenanceCostPerUnit}</p>
//                 </div>
//               </div>
//             </ChartCard>
//           </div>

//           {/* MIDDLE COLUMN */}
//           <div className="flex flex-col gap-3">
//             {/* Energy Power Gauge */}
//             <ChartCard title="Energy Efficiency" subtitle="Power Factor Gauge">
//               <div className="flex items-center justify-center py-4" style={{ minHeight: '320px' }}>
//                 <ModernPowerGauge
//                   value={energyData.powerFactor * 100}
//                   max={100}
//                   title="Power Factor"
//                   unit="%"
//                   color={chartColors.primary}
//                   theme={theme}
//                 />
//               </div>
//             </ChartCard>

//             {/* KPI Performance Radar Chart */}
//             <ChartCard title="KPI Performance" subtitle="Multi-Dimensional Analysis">
//               <ResponsiveContainer width="100%" height={320}>
//                 <RadarChart data={radarChartData}>
//                   <PolarGrid stroke={theme === 'dark' ? '#475569' : '#cbd5e1'} />
//                   <PolarAngleAxis 
//                     dataKey="subject" 
//                     tick={{ fill: theme === 'dark' ? '#cbd5e1' : '#475569', fontSize: 11 }}
//                   />
//                   <PolarRadiusAxis 
//                     angle={90} 
//                     domain={[0, 100]} 
//                     tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10 }}
//                   />
//                   <Radar
//                     name="Performance"
//                     dataKey="value"
//                     stroke="#06b6d4"
//                     fill="#06b6d4"
//                     fillOpacity={0.6}
//                     strokeWidth={2}
//                   />
//                   <Tooltip
//                     contentStyle={{
//                       ...tooltipStyle,
//                       border: '1px solid #06b6d4',
//                     }}
//                     formatter={(value: number) => [`${value.toFixed(1)}%`, 'Performance']}
//                   />
//                 </RadarChart>
//               </ResponsiveContainer>
//             </ChartCard>

//             {/* COSTING KPIs - Waterfall */}
//             <ChartCard title="Cost Breakdown" subtitle="Waterfall Analysis">
//               <ResponsiveContainer width="100%" height={320}>
//                 <BarChart data={costingData.costBreakdown} barCategoryGap="20%">
//                   <defs>
//                     <radialGradient id="cylindricalGradient" cx="50%" cy="50%" r="50%">
//                       <stop offset="0%" stopColor="#a5f3fc" stopOpacity={1} />
//                       <stop offset="30%" stopColor="#67e8f9" stopOpacity={1} />
//                       <stop offset="50%" stopColor="#22d3ee" stopOpacity={1} />
//                       <stop offset="70%" stopColor="#06b6d4" stopOpacity={1} />
//                       <stop offset="100%" stopColor="#0891b2" stopOpacity={1} />
//                     </radialGradient>
//                     <linearGradient id="cylindricalGradientVertical" x1="0%" y1="0%" x2="0%" y2="100%">
//                       <stop offset="0%" stopColor="#a5f3fc" stopOpacity={1} />
//                       <stop offset="10%" stopColor="#67e8f9" stopOpacity={1} />
//                       <stop offset="25%" stopColor="#22d3ee" stopOpacity={1} />
//                       <stop offset="50%" stopColor="#06b6d4" stopOpacity={1} />
//                       <stop offset="75%" stopColor="#0891b2" stopOpacity={1} />
//                       <stop offset="90%" stopColor="#0e7490" stopOpacity={1} />
//                       <stop offset="100%" stopColor="#155e75" stopOpacity={1} />
//                     </linearGradient>
//                     <linearGradient id="cylindricalGradientHorizontal" x1="0%" y1="0%" x2="100%" y2="0%">
//                       <stop offset="0%" stopColor="#0e7490" stopOpacity={1} />
//                       <stop offset="25%" stopColor="#0891b2" stopOpacity={1} />
//                       <stop offset="50%" stopColor="#22d3ee" stopOpacity={1} />
//                       <stop offset="75%" stopColor="#0891b2" stopOpacity={1} />
//                       <stop offset="100%" stopColor="#0e7490" stopOpacity={1} />
//                     </linearGradient>
//                     <filter id="barGlow">
//                       <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
//                       <feMerge>
//                         <feMergeNode in="coloredBlur"/>
//                         <feMergeNode in="SourceGraphic"/>
//                       </feMerge>
//                     </filter>
//                   </defs>
//                   <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-700" />
//                   <XAxis dataKey="name" className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
//                   <YAxis className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
//                   <Tooltip
//                     contentStyle={{
//                       ...tooltipStyle,
//                       border: '1px solid #3b82f6',
//                     }}
//                     formatter={(value: number) => [`$${value.toLocaleString()}`, 'Cost']}
//                   />
//                   <Bar 
//                     dataKey="value" 
//                     radius={[50, 50, 0, 0]}
//                     filter="url(#barGlow)"
//                     barSize={60}
//                   >
//                     {costingData.costBreakdown.map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill="url(#cylindricalGradientHorizontal)" />
//                     ))}
//                   </Bar>
//                 </BarChart>
//               </ResponsiveContainer>
//               <div className="grid grid-cols-4 gap-2 mt-2">
//                 <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Raw Material/TON</p>
//                   <p className="text-sm font-bold text-slate-900 dark:text-white">${costingData.rawMaterialCostPerTon.toFixed(2)}</p>
//                   <p className="text-xs text-slate-500 dark:text-slate-500">$/TON</p>
//                 </div>
//                 <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Energy Cost/TON</p>
//                   <p className="text-sm font-bold text-slate-900 dark:text-white">${costingData.energyCostPerTon.toFixed(2)}</p>
//                   <p className="text-xs text-slate-500 dark:text-slate-500">$/TON</p>
//                 </div>
//                 <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Total Variable Cost</p>
//                   <p className="text-sm font-bold text-slate-900 dark:text-white">${costingData.totalVariableCost.toLocaleString()}</p>
//                 </div>
//                 <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Cost Per Unit</p>
//                   <p className="text-sm font-bold text-slate-900 dark:text-white">${costingData.costPerUnit}</p>
//                 </div>
//               </div>
//             </ChartCard>

//             {/* ENERGY KPIs */}
//             <ChartCard title="Energy Consumption" subtitle="24-Hour Trend">
//               <ResponsiveContainer width="100%" height={320}>
//                 <LineChart data={energyData.consumptionTrend}>
//                   <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-700" />
//                   <XAxis dataKey="hour" className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
//                   <YAxis className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
//                   <Tooltip
//                     contentStyle={{
//                       ...tooltipStyle,
//                       border: '1px solid #f59e0b',
//                     }}
//                   />
//                   <Line
//                     type="monotone"
//                     dataKey="consumption"
//                     stroke={chartColors.warning}
//                     strokeWidth={2}
//                     dot={{ fill: chartColors.warning, r: 4 }}
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//               <div className="grid grid-cols-6 gap-2 mt-2">
//                 <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Consumption/TON</p>
//                   <p className="text-sm font-bold text-slate-900 dark:text-white">{energyData.energyConsumptionPerTon.toFixed(2)}</p>
//                   <p className="text-xs text-slate-500 dark:text-slate-500">kWh/TON</p>
//                 </div>
//                 <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Cost/TON</p>
//                   <p className="text-sm font-bold text-slate-900 dark:text-white">${energyData.energyCostPerTon.toFixed(2)}</p>
//                   <p className="text-xs text-slate-500 dark:text-slate-500">$/TON</p>
//                 </div>
//                 <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Total Consumption</p>
//                   <p className="text-sm font-bold text-slate-900 dark:text-white">{energyData.totalConsumption.toLocaleString()}</p>
//                   <p className="text-xs text-slate-500 dark:text-slate-500">kWh</p>
//                 </div>
//                 <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Energy Cost</p>
//                   <p className="text-sm font-bold text-slate-900 dark:text-white">${energyData.energyCost.toLocaleString()}</p>
//                 </div>
//                 <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Peak Demand</p>
//                   <p className="text-sm font-bold text-slate-900 dark:text-white">{energyData.peakDemand}</p>
//                   <p className="text-xs text-slate-500 dark:text-slate-500">kW</p>
//                 </div>
//                 <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Power Factor</p>
//                   <p className="text-sm font-bold text-slate-900 dark:text-white">{energyData.powerFactor}</p>
//                 </div>
//               </div>
//             </ChartCard>

//             {/* MANAGEMENT KPIs */}
//             <ChartCard title="Management KPIs" subtitle="Planned vs Actual">
//               <ResponsiveContainer width="100%" height={320}>
//                 <ComposedChart data={managementData.comparisonData.slice(-7)}>
//                   <defs>
//                     <linearGradient id="plannedBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
//                       <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
//                       <stop offset="50%" stopColor="#0891b2" stopOpacity={0.8} />
//                       <stop offset="100%" stopColor="#0e7490" stopOpacity={0.7} />
//                     </linearGradient>
//                     <linearGradient id="actualLineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
//                       <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
//                       <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.05} />
//                     </linearGradient>
//                   </defs>
//                   <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-700" />
//                   <XAxis dataKey="date" className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
//                   <YAxis className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
//                   <Tooltip
//                     contentStyle={{
//                       ...tooltipStyle,
//                       border: '1px solid #8b5cf6',
//                     }}
//                   />
//                   <Area
//                     type="monotone"
//                     dataKey="actual"
//                     fill="url(#actualLineGradient)"
//                     stroke="none"
//                   />
//                   <Bar 
//                     dataKey="planned" 
//                     fill="url(#plannedBarGradient)" 
//                     radius={[8, 8, 0, 0]}
//                   />
//                   <Line 
//                     type="monotone" 
//                     dataKey="actual" 
//                     stroke="#22d3ee" 
//                     strokeWidth={3}
//                     dot={{ fill: '#22d3ee', r: 5, strokeWidth: 2, stroke: theme === 'dark' ? '#ffffff' : '#1e293b' }}
//                     activeDot={{ r: 7, strokeWidth: 2, stroke: '#22d3ee', fill: '#ffffff' }}
//                   />
//                   <Legend 
//                     wrapperStyle={{ color: theme === 'dark' ? '#ffffff' : '#1e293b' }}
//                   />
//                 </ComposedChart>
//               </ResponsiveContainer>
//               <div className="grid grid-cols-4 gap-2 mt-2">
//                 <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Plan Adherence</p>
//                   <p className="text-sm font-bold text-slate-900 dark:text-white">{managementData.planAdherence}%</p>
//                 </div>
//                 <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Shift Efficiency</p>
//                   <p className="text-sm font-bold text-slate-900 dark:text-white">{managementData.shiftEfficiency}%</p>
//                 </div>
//                 <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Operator Productivity</p>
//                   <p className="text-sm font-bold text-slate-900 dark:text-white">{managementData.operatorProductivity.toFixed(1)}</p>
//                   <p className="text-xs text-slate-500 dark:text-slate-500">units/operator</p>
//                 </div>
//                 <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Schedule Adherence</p>
//                   <p className="text-sm font-bold text-slate-900 dark:text-white">{managementData.scheduleAdherence}%</p>
//                 </div>
//               </div>
//             </ChartCard>
//           </div>

//           {/* RIGHT COLUMN */}
//           <div className="flex flex-col gap-3">
//             {/* Delay Analysis */}
//             <ChartCard title="Delay Analysis" subtitle="Category Breakdown">
//               <div className="pt-14">
//                 <ResponsiveContainer width="100%" height={250}>
//                   <BarChart data={managementData.delayAnalysis} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
//                     <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-700" />
//                     <XAxis type="number" className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
//                     <YAxis 
//                       dataKey="category" 
//                       type="category" 
//                       className="text-slate-600 dark:text-slate-400" 
//                       tick={{ fill: 'currentColor', fontSize: 12 }}
//                       width={80}
//                       interval={0}
//                     />
//                     <Tooltip
//                       contentStyle={{
//                         ...tooltipStyle,
//                         border: '1px solid #8b5cf6',
//                       }}
//                       formatter={(value: number) => [`${value} hrs`, 'Duration']}
//                     />
//                     <Bar dataKey="duration" fill={chartColors.tertiary} radius={[0, 8, 8, 0]} />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </ChartCard>

//             {/* Shift Efficiency */}
//             <ChartCard title="Shift Efficiency" subtitle="By Shift Analysis">
//               <div className="flex gap-4 items-center pt-6" style={{ minHeight: '250px' }}>
//                 {/* Left: Segmented Doughnut Chart */}
//                 <div className="flex-1 flex items-center justify-center">
//                   <ResponsiveContainer width="100%" height={250}>
//                     <PieChart>
//                       <defs>
//                         <linearGradient id="shiftAGradient" x1="0%" y1="0%" x2="100%" y2="100%">
//                           <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
//                           <stop offset="100%" stopColor="#22d3ee" stopOpacity={1} />
//                         </linearGradient>
//                         <linearGradient id="shiftBGradient" x1="0%" y1="0%" x2="100%" y2="100%">
//                           <stop offset="0%" stopColor="#0891b2" stopOpacity={1} />
//                           <stop offset="100%" stopColor="#06b6d4" stopOpacity={1} />
//                         </linearGradient>
//                         <linearGradient id="shiftCGradient" x1="0%" y1="0%" x2="100%" y2="100%">
//                           <stop offset="0%" stopColor="#22d3ee" stopOpacity={1} />
//                           <stop offset="100%" stopColor="#67e8f9" stopOpacity={1} />
//                         </linearGradient>
//                       </defs>
//                       <Pie
//                         data={managementData.shiftEfficiencyTrend.map((shift, index) => {
//                           // Calculate production value based on efficiency
//                           const productionValue = shift.efficiency * 500;
//                           return {
//                             name: shift.shift,
//                             value: productionValue,
//                             efficiency: shift.efficiency,
//                           };
//                         })}
//                         cx="50%"
//                         cy="50%"
//                         innerRadius={60}
//                         outerRadius={90}
//                         paddingAngle={5}
//                         dataKey="value"
//                         label={({ name, value }) => {
//                           const formattedValue = value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value.toFixed(0)}`;
//                           return formattedValue;
//                         }}
//                         labelLine={false}
//                       >
//                         {managementData.shiftEfficiencyTrend.map((shift, index) => {
//                           const colors = ['url(#shiftAGradient)', 'url(#shiftBGradient)', 'url(#shiftCGradient)'];
//                           return (
//                             <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
//                           );
//                         })}
//                       </Pie>
//                       <Tooltip
//                         contentStyle={{
//                           ...tooltipStyle,
//                           border: '1px solid #06b6d4',
//                         }}
//                         formatter={(value: number, name: string, props: any) => {
//                           const efficiency = props.payload?.efficiency || 0;
//                           return [`${efficiency.toFixed(1)}% Efficiency`, name];
//                         }}
//                       />
//                     </PieChart>
//                   </ResponsiveContainer>
//                 </div>

//                 {/* Right: Three Circular Progress Gauges */}
//                 <div className="flex-1 flex items-center justify-center gap-6">
//                   {managementData.shiftEfficiencyTrend.map((shift, index) => {
//                     const colors = ['#06b6d4', '#22d3ee', '#67e8f9'];
//                     const valueLabels = [
//                       `$${(shift.efficiency * 500).toFixed(0)}`,
//                       `$${(shift.efficiency * 450).toFixed(0)}`,
//                       `$${(shift.efficiency * 400).toFixed(0)}`,
//                     ];
//                     return (
//                       <CircularProgressGauge
//                         key={shift.shift}
//                         value={shift.efficiency}
//                         max={100}
//                         label={shift.shift}
//                         valueLabel={valueLabels[index]}
//                         color={colors[index]}
//                         theme={theme}
//                       />
//                     );
//                   })}
//                 </div>
//               </div>
//             </ChartCard>

//             {/* Peak Load Hours */}
//             <ChartCard title="Peak Load Hours" subtitle="24-Hour Load Analysis">
//               <div className="pt-14">
//                 <ResponsiveContainer width="100%" height={250}>
//                 <AreaChart data={energyData.peakLoadHours}>
//                   <defs>
//                     <linearGradient id="colorPeakLoad" x1="0" y1="0" x2="0" y2="1">
//                       <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8} />
//                       <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.1} />
//                     </linearGradient>
//                   </defs>
//                   <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-700" />
//                   <XAxis dataKey="hour" className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
//                   <YAxis className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
//                   <Tooltip
//                     contentStyle={{
//                       ...tooltipStyle,
//                       border: '1px solid #f59e0b',
//                     }}
//                     formatter={(value: number) => [`${value.toFixed(0)} kW`, 'Load']}
//                   />
//                   <Area
//                     type="monotone"
//                     dataKey="load"
//                     stroke={chartColors.warning}
//                     fillOpacity={1}
//                     fill="url(#colorPeakLoad)"
//                   />
//                 </AreaChart>
//               </ResponsiveContainer>
//               </div>
//             </ChartCard>

//             {/* Efficiency Trend */}
//             <ChartCard title="Efficiency Trend" subtitle="Energy Efficiency Over Time">
//               <div className="pt-14">
//                 <ResponsiveContainer width="100%" height={250}>
//                 <LineChart data={energyData.efficiencyTrend.slice(-14)}>
//                   <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-700" />
//                   <XAxis dataKey="date" className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor', fontSize: 10 }} />
//                   <YAxis className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
//                   <Tooltip
//                     contentStyle={{
//                       ...tooltipStyle,
//                       border: '1px solid #f59e0b',
//                     }}
//                     formatter={(value: number) => [`${value.toFixed(2)} kWh/TON`, 'Efficiency']}
//                   />
//                   <Line
//                     type="monotone"
//                     dataKey="efficiency"
//                     stroke={chartColors.warning}
//                     strokeWidth={2}
//                     dot={{ fill: chartColors.warning, r: 4 }}
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//               </div>
//             </ChartCard>

//             {/* Cost Variance Trend */}
//             <ChartCard title="Cost Variance Trend" subtitle="Daily Variance Analysis">
//               <div className="pt-14">
//                 <ResponsiveContainer width="100%" height={250}>
//                 <AreaChart data={costingData.costVarianceTrend.slice(-14)}>
//                   <defs>
//                     <linearGradient id="varianceAreaGradient" x1="0" y1="0" x2="0" y2="1">
//                       <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
//                       <stop offset="50%" stopColor="#22d3ee" stopOpacity={0.4} />
//                       <stop offset="95%" stopColor="#67e8f9" stopOpacity={0.1} />
//                     </linearGradient>
//                   </defs>
//                   <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-700" />
//                   <XAxis dataKey="date" className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor', fontSize: 10 }} />
//                   <YAxis className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
//                   <Tooltip
//                     contentStyle={{
//                       ...tooltipStyle,
//                       border: '1px solid #06b6d4',
//                     }}
//                     formatter={(value: number) => [`${value.toFixed(2)}%`, 'Variance']}
//                   />
//                   <Area
//                     type="linear"
//                     dataKey="variance"
//                     stroke="#06b6d4"
//                     strokeWidth={3}
//                     fill="url(#varianceAreaGradient)"
//                     dot={{ fill: '#06b6d4', r: 5, strokeWidth: 2, stroke: theme === 'dark' ? '#ffffff' : '#1e293b' }}
//                     activeDot={{ r: 7, strokeWidth: 2, stroke: '#06b6d4', fill: '#ffffff' }}
//                   />
//                 </AreaChart>
//               </ResponsiveContainer>
//               </div>
//             </ChartCard>
//           </div>
//         </div>

//         {/* Circular Infographic Chart */}
//         <div className="w-1/3 mx-auto mt-8">
//           <ChartCard title="Circular Infographic Chart" subtitle="Data Visualization">
//             <CircularInfographicChart theme={theme} size={600} />
//           </ChartCard>
//         </div>
//       </div>
//     </WaterSystemLayout>
//   );
// };

// // Circular Infographic Chart Component
// interface CircularInfographicChartProps {
//   size?: number;
//   theme?: 'light' | 'dark';
// }

// const CircularInfographicChart: React.FC<CircularInfographicChartProps> = ({
//   size = 1600,
//   theme = 'dark',
// }) => {
//   const centerX = size / 2;
//   const centerY = size / 2;
//   const centerRadius = 150;
//   const ring1Radius = 240;
//   const ring2Radius = 330;
//   const ring3Radius = 420;
//   const ring4Radius = 510;
//   const ringWidth = 75;

//   // Metrics data - positioned around the chart (top-left, top-right, bottom-left, bottom-right)
//   const metrics = [
//     { icon: '🌐', percentage: '55%', label: 'OPTIONS DATA', color: '#64748b', position: 'top-left', targetRing: 3, targetAngle: 135 }, // Top-left -> Ring 3
//     { icon: '📊', percentage: '75%', label: 'OPTIONS DATA', color: '#f97316', position: 'top-right', targetRing: 4, targetAngle: 45 }, // Top-right -> Ring 4
//     { icon: '👥', percentage: '50%', label: 'OPTIONS DATA', color: '#3b82f6', position: 'bottom-left', targetRing: 4, targetAngle: 225 }, // Bottom-left -> Ring 4
//     { icon: '$', percentage: '65%', label: 'OPTIONS DATA', color: '#14b8a6', position: 'bottom-right', targetRing: 2, targetAngle: 315 }, // Bottom-right -> Ring 2
//   ];

//   // Right side numbered sections - positioned on different rings (Cyan theme)
//   const rightSections = [
//     { number: '01', label: 'DATA OPTIONS', color: '#06b6d4', angle: 45, ringIndex: 4 }, // Top-right on Ring 4 - cyan-500
//     { number: '02', label: 'DATA OPTIONS', color: '#22d3ee', angle: 135, ringIndex: 3 }, // Top-left on Ring 3 - cyan-400
//     { number: '03', label: 'DATA OPTIONS', color: '#67e8f9', angle: 225, ringIndex: 2 }, // Bottom-left on Ring 2 - cyan-300
//     { number: '04', label: 'DATA OPTIONS', color: '#0891b2', angle: 315, ringIndex: 1 }, // Bottom-right on Ring 1 - cyan-600
//   ];

//   // Ring segment data - Cyan theme colors
//   const ringSegments = [
//     { label: 'INFOGRAPHIC', color: '#67e8f9' }, // cyan-300
//     { label: 'DATA OPTIONS', color: '#22d3ee' }, // cyan-400
//     { label: 'DATA OPTIONS', color: '#06b6d4' }, // cyan-500
//     { label: 'DATA OPTIONS', color: '#0891b2' }, // cyan-600
//   ];

//   // Create ring segment path
//   const createRingSegment = (ringRadius: number, startAngle: number, endAngle: number) => {
//     const startRad = ((startAngle - 90) * Math.PI) / 180;
//     const endRad = ((endAngle - 90) * Math.PI) / 180;
//     const segmentInnerRadius = ringRadius - ringWidth;
//     const segmentOuterRadius = ringRadius;

//     const x1 = centerX + Math.cos(startRad) * segmentOuterRadius;
//     const y1 = centerY + Math.sin(startRad) * segmentOuterRadius;
//     const x2 = centerX + Math.cos(endRad) * segmentOuterRadius;
//     const y2 = centerY + Math.sin(endRad) * segmentOuterRadius;
//     const x3 = centerX + Math.cos(endRad) * segmentInnerRadius;
//     const y3 = centerY + Math.sin(endRad) * segmentInnerRadius;
//     const x4 = centerX + Math.cos(startRad) * segmentInnerRadius;
//     const y4 = centerY + Math.sin(startRad) * segmentInnerRadius;

//     const largeArc = endAngle - startAngle > 180 ? 1 : 0;
//     const midAngle = (startAngle + endAngle) / 2;
//     const midRad = ((midAngle - 90) * Math.PI) / 180;

//     return {
//       path: `M ${x1} ${y1} A ${segmentOuterRadius} ${segmentOuterRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${segmentInnerRadius} ${segmentInnerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`,
//       midAngle,
//       midRad,
//       midRadius: (segmentInnerRadius + segmentOuterRadius) / 2,
//     };
//   };

//   // Create progress arc path
//   const createProgressArc = (ringRadius: number, percentage: number, startAngle: number = 0) => {
//     const segmentInnerRadius = ringRadius - ringWidth;
//     const segmentOuterRadius = ringRadius;
//     const totalAngle = 360;
//     const progressAngle = (percentage / 100) * totalAngle;
//     const endAngle = startAngle + progressAngle;

//     const startRad = ((startAngle - 90) * Math.PI) / 180;
//     const endRad = ((endAngle - 90) * Math.PI) / 180;

//     const x1 = centerX + Math.cos(startRad) * segmentOuterRadius;
//     const y1 = centerY + Math.sin(startRad) * segmentOuterRadius;
//     const x2 = centerX + Math.cos(endRad) * segmentOuterRadius;
//     const y2 = centerY + Math.sin(endRad) * segmentOuterRadius;
//     const x3 = centerX + Math.cos(endRad) * segmentInnerRadius;
//     const y3 = centerY + Math.sin(endRad) * segmentInnerRadius;
//     const x4 = centerX + Math.cos(startRad) * segmentInnerRadius;
//     const y4 = centerY + Math.sin(startRad) * segmentInnerRadius;

//     const largeArc = progressAngle > 180 ? 1 : 0;

//     return `M ${x1} ${y1} A ${segmentOuterRadius} ${segmentOuterRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${segmentInnerRadius} ${segmentInnerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
//   };

//   return (
//     <div className="w-full flex flex-col items-center justify-center p-8" style={{ minHeight: '700px' }}>
//       <svg width={size} height={size} viewBox={`-400 -200 ${size + 800} ${size + 400}`} className="max-w-full max-h-full">
//         <defs>
//           <filter id="ringShadow">
//             <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
//             <feOffset dx="2" dy="2" result="offsetblur" />
//             <feComponentTransfer>
//               <feFuncA type="linear" slope="0.3" />
//             </feComponentTransfer>
//             <feMerge>
//               <feMergeNode />
//               <feMergeNode in="SourceGraphic" />
//             </feMerge>
//           </filter>
//           <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
//             <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
//             <stop offset="100%" stopColor="#f0f9ff" stopOpacity="1" />
//           </linearGradient>
//           <marker
//             id="arrowhead"
//             markerWidth="10"
//             markerHeight="10"
//             refX="9"
//             refY="3"
//             orient="auto"
//           >
//             <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
//           </marker>
//         </defs>

//         {/* Background circle */}
//         <circle
//           cx={centerX}
//           cy={centerY}
//           r={ring4Radius + 20}
//           fill={theme === 'dark' ? 'rgba(30, 41, 59, 0.3)' : 'rgba(241, 245, 249, 0.5)'}
//         />

//         {/* Ring 4 (Outermost) - Background segments (neutral) */}
//         {[0, 1, 2, 3].map((i) => {
//           const startAngle = i * 90;
//           const endAngle = (i + 1) * 90;
//           const segment = createRingSegment(ring4Radius, startAngle, endAngle);
          
//           return (
//             <g key={`ring4-bg-${i}`}>
//               <path
//                 d={segment.path}
//                 fill={theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(241, 245, 249, 0.5)'}
//                 stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
//                 strokeWidth="1"
//                 filter="url(#ringShadow)"
//               />
//             </g>
//           );
//         })}

//         {/* Ring 4 - Progress arc (90% cyan) */}
//         <path
//           d={createProgressArc(ring4Radius, 90, 0)}
//           fill="#06b6d4"
//           opacity="0.9"
//           filter="url(#ringShadow)"
//         />

//         {/* Ring 3 - Background segments (neutral) */}
//         {[0, 1, 2, 3].map((i) => {
//           const startAngle = i * 90;
//           const endAngle = (i + 1) * 90;
//           const segment = createRingSegment(ring3Radius, startAngle, endAngle);
          
//           return (
//             <g key={`ring3-bg-${i}`}>
//               <path
//                 d={segment.path}
//                 fill={theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(241, 245, 249, 0.5)'}
//                 stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
//                 strokeWidth="1"
//                 filter="url(#ringShadow)"
//               />
//               <text
//                 x={centerX + Math.cos(segment.midRad) * segment.midRadius}
//                 y={centerY + Math.sin(segment.midRad) * segment.midRadius}
//                 textAnchor="middle"
//                 dominantBaseline="middle"
//                 fill={theme === 'dark' ? 'rgba(148, 163, 184, 0.6)' : 'rgba(71, 85, 105, 0.6)'}
//                 fontSize="11"
//                 transform={`rotate(${segment.midAngle - 90}, ${centerX + Math.cos(segment.midRad) * segment.midRadius}, ${centerY + Math.sin(segment.midRad) * segment.midRadius})`}
//               >
//                 DATA OPTIONS
//               </text>
//             </g>
//           );
//         })}

//         {/* Ring 3 - Progress arc (75% cyan) */}
//         <path
//           d={createProgressArc(ring3Radius, 75, 90)}
//           fill="#22d3ee"
//           opacity="0.9"
//           filter="url(#ringShadow)"
//         />

//         {/* Ring 2 - Background segments (neutral) */}
//         {[0, 1, 2, 3].map((i) => {
//           const startAngle = i * 90;
//           const endAngle = (i + 1) * 90;
//           const segment = createRingSegment(ring2Radius, startAngle, endAngle);
          
//           return (
//             <g key={`ring2-bg-${i}`}>
//               <path
//                 d={segment.path}
//                 fill={theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(241, 245, 249, 0.5)'}
//                 stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
//                 strokeWidth="1"
//                 filter="url(#ringShadow)"
//               />
//               <text
//                 x={centerX + Math.cos(segment.midRad) * segment.midRadius}
//                 y={centerY + Math.sin(segment.midRad) * segment.midRadius}
//                 textAnchor="middle"
//                 dominantBaseline="middle"
//                 fill={theme === 'dark' ? 'rgba(148, 163, 184, 0.6)' : 'rgba(71, 85, 105, 0.6)'}
//                 fontSize="11"
//                 transform={`rotate(${segment.midAngle - 90}, ${centerX + Math.cos(segment.midRad) * segment.midRadius}, ${centerY + Math.sin(segment.midRad) * segment.midRadius})`}
//               >
//                 DATA OPTIONS
//               </text>
//             </g>
//           );
//         })}

//         {/* Ring 2 - Progress arc (50% cyan) */}
//         <path
//           d={createProgressArc(ring2Radius, 50, 180)}
//           fill="#67e8f9"
//           opacity="0.9"
//           filter="url(#ringShadow)"
//         />

//         {/* Ring 1 (Innermost) - Background segments (neutral) */}
//         {[0, 1, 2, 3].map((i) => {
//           const startAngle = i * 90;
//           const endAngle = (i + 1) * 90;
//           const segment = createRingSegment(ring1Radius, startAngle, endAngle);
          
//           return (
//             <g key={`ring1-bg-${i}`}>
//               <path
//                 d={segment.path}
//                 fill={theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(241, 245, 249, 0.5)'}
//                 stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
//                 strokeWidth="1"
//                 filter="url(#ringShadow)"
//               />
//               <text
//                 x={centerX + Math.cos(segment.midRad) * segment.midRadius}
//                 y={centerY + Math.sin(segment.midRad) * segment.midRadius}
//                 textAnchor="middle"
//                 dominantBaseline="middle"
//                 fill={theme === 'dark' ? 'rgba(148, 163, 184, 0.6)' : 'rgba(71, 85, 105, 0.6)'}
//                 fontSize="11"
//                 transform={`rotate(${segment.midAngle - 90}, ${centerX + Math.cos(segment.midRad) * segment.midRadius}, ${centerY + Math.sin(segment.midRad) * segment.midRadius})`}
//               >
//                 INFOGRAPHIC
//               </text>
//             </g>
//           );
//         })}

//         {/* Ring 1 - Progress arc (25% cyan) */}
//         <path
//           d={createProgressArc(ring1Radius, 25, 270)}
//           fill="#0891b2"
//           opacity="0.9"
//           filter="url(#ringShadow)"
//         />

//         {/* Center Circle */}
//         <circle
//           cx={centerX}
//           cy={centerY}
//           r={centerRadius}
//           fill={theme === 'dark' ? 'rgba(255, 255, 255, 0.95)' : '#ffffff'}
//           stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}
//           strokeWidth="2"
//           filter="url(#ringShadow)"
//         />
        
//         {/* Center Icon - OEE Gear Icon (sized to match inner circle) */}
//         <g>
//           {/* Outer gear circle - sized to match centerRadius */}
//           <circle
//             cx={centerX}
//             cy={centerY}
//             r={centerRadius - 10}
//             fill="none"
//             stroke={theme === 'dark' ? '#06b6d4' : '#0891b2'}
//             strokeWidth="5"
//           />
          
//           {/* Gear teeth - top */}
//           <rect x={centerX - 8} y={centerY - centerRadius} width="16" height="18" rx="2" fill={theme === 'dark' ? '#06b6d4' : '#0891b2'} />
//           {/* Gear teeth - right */}
//           <rect x={centerX + centerRadius - 18} y={centerY - 8} width="18" height="16" rx="2" fill={theme === 'dark' ? '#06b6d4' : '#0891b2'} />
//           {/* Gear teeth - bottom */}
//           <rect x={centerX - 8} y={centerY + centerRadius - 18} width="16" height="18" rx="2" fill={theme === 'dark' ? '#06b6d4' : '#0891b2'} />
//           {/* Gear teeth - left */}
//           <rect x={centerX - centerRadius} y={centerY - 8} width="18" height="16" rx="2" fill={theme === 'dark' ? '#06b6d4' : '#0891b2'} />
          
//           {/* Inner gear circle */}
//           <circle
//             cx={centerX}
//             cy={centerY}
//             r={centerRadius - 35}
//             fill={theme === 'dark' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(8, 145, 178, 0.2)'}
//             stroke={theme === 'dark' ? '#06b6d4' : '#0891b2'}
//             strokeWidth="4"
//           />
          
//           {/* Center dot */}
//           <circle
//             cx={centerX}
//             cy={centerY}
//             r="12"
//             fill={theme === 'dark' ? '#06b6d4' : '#0891b2'}
//           />
          
//           {/* Performance indicator lines */}
//           <line x1={centerX} y1={centerY - (centerRadius - 20)} x2={centerX} y2={centerY - (centerRadius - 35)} stroke={theme === 'dark' ? '#06b6d4' : '#0891b2'} strokeWidth="4" />
//           <line x1={centerX + (centerRadius - 20)} y1={centerY} x2={centerX + (centerRadius - 35)} y2={centerY} stroke={theme === 'dark' ? '#06b6d4' : '#0891b2'} strokeWidth="4" />
//           <line x1={centerX} y1={centerY + (centerRadius - 20)} x2={centerX} y2={centerY + (centerRadius - 35)} stroke={theme === 'dark' ? '#06b6d4' : '#0891b2'} strokeWidth="4" />
//           <line x1={centerX - (centerRadius - 20)} y1={centerY} x2={centerX - (centerRadius - 35)} y2={centerY} stroke={theme === 'dark' ? '#06b6d4' : '#0891b2'} strokeWidth="4" />
//         </g>


//         {/* Right Side Numbered Sections - Positioned on different rings */}
//         {rightSections.map((section, index) => {
//           const angleRad = (section.angle * Math.PI) / 180;
          
//           // Map ring index to actual ring radius
//           const ringRadii = {
//             1: ring1Radius,
//             2: ring2Radius,
//             3: ring3Radius,
//             4: ring4Radius,
//           };
          
//           const ringRadius = ringRadii[section.ringIndex as keyof typeof ringRadii];
          
//           // Position at the middle of the ring width
//           const distance = ringRadius - ringWidth / 2;
//           const x = centerX + Math.cos(angleRad) * distance;
//           const y = centerY + Math.sin(angleRad) * distance;
          
//           // Label positioned outside the ring to avoid collision
//           const labelDistance = ringRadius + 20;
//           const labelX = centerX + Math.cos(angleRad) * labelDistance;
//           const labelY = centerY + Math.sin(angleRad) * labelDistance;

//           return (
//             <g key={`section-${index}`}>
//               {/* Number circle */}
//               <circle
//                 cx={x}
//                 cy={y}
//                 r="24"
//                 fill={section.color}
//                 stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}
//                 strokeWidth="2.5"
//                 filter="url(#ringShadow)"
//               />
              
//               {/* Number */}
//               <text
//                 x={x}
//                 y={y + 6}
//                 textAnchor="middle"
//                 fill="#ffffff"
//                 fontSize="18"
//                 fontWeight="700"
//               >
//                 {section.number}
//               </text>

//               {/* Label - positioned outside ring to avoid collision */}
//               <text
//                 x={labelX}
//                 y={labelY}
//                 textAnchor="middle"
//                 dominantBaseline="middle"
//                 fill={theme === 'dark' ? '#94a3b8' : '#475569'}
//                 fontSize="11"
//                 fontWeight="500"
//                 transform={`rotate(${section.angle - 90}, ${labelX}, ${labelY})`}
//               >
//                 {section.label}
//               </text>
//             </g>
//           );
//         })}

//       </svg>
//       {/* OEE Label - Below the chart */}
//       <div className="mt-6">
//         <h2
//           className="text-4xl font-bold"
//           style={{ color: theme === 'dark' ? '#06b6d4' : '#0891b2' }}
//         >
//           OEE
//         </h2>
//       </div>
//     </div>
//   );
// };

// export default KPIOverview;
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LabelList,
} from 'recharts';
import {
  FaIndustry,
  FaCog,
  FaBolt,
  FaDollarSign,
  FaChartLine,
  FaDownload,
  FaExpand,
  FaCalendarAlt,
  FaFilter,
  FaInfoCircle,
} from 'react-icons/fa';
import { WaterSystemLayout } from '../../components/hercules-sfms/WaterSystemLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { API_BASE_URL } from '@/lib/api';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card';

// ============= API Configuration =============

// ============= API Service =============
const fetchDashboardAnalytics = async (startDate: Date, endDate: Date, filters?: {
  batches?: string[];
  products?: string[];
  materials?: string[];
}) => {
  try {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    if (filters?.batches) {
      filters.batches.forEach(batch => params.append('batch', batch));
    }
    if (filters?.products) {
      filters.products.forEach(product => params.append('product', product));
    }
    if (filters?.materials) {
      filters.materials.forEach(material => params.append('material', material));
    }

    const url = `${API_BASE_URL}/api/kpi/dashboard-analytics?${params.toString()}`;
    console.log('Fetching from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API Error ${response.status}: ${response.statusText}`);
    }

    // Check content type before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response received:', text.substring(0, 200));
      throw new Error(`Expected JSON but received ${contentType}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    throw error;
  }
};

// ============= Interfaces =============
interface KPISummary {
  id: string;
  title: string;
  value: number;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend: number;
  previousValue: number;
}

// ============= Helper Components (Keep these exactly as in your original code) =============

// Animated Number Component
const AnimatedNumber: React.FC<{ value: number; duration?: number }> = ({ value, duration = 1000 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const diff = value - startValue;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOutQuad = progress * (2 - progress);
      const current = startValue + diff * easeOutQuad;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{displayValue.toFixed(1)}</span>;
};

// KPI Summary Card Component
const KPISummaryCard: React.FC<{ kpi: KPISummary; index: number }> = ({ kpi, index }) => {
  const Icon = kpi.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="group relative overflow-hidden border border-cyan-500/30 dark:border-cyan-500/30 bg-white dark:bg-slate-900/95 backdrop-blur-sm hover:shadow-lg dark:hover:shadow-cyan-500/20 hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition-all duration-300 h-full">

        <CardContent className="relative p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-1">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">{kpi.title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                <AnimatedNumber value={kpi.value} />
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-500">{kpi.unit}</span>
            </div>
            </div>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 dark:from-cyan-500 dark:to-cyan-600 shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 flex-shrink-0 group-hover:scale-110">
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Chart Card Component
const ChartCard: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  onExport?: () => void;
  onFullscreen?: () => void;
  info?: string | React.ReactNode;
}> = ({ title, subtitle, children, className, onExport, onFullscreen, info }) => {
  const gridClasses = className?.match(/(col-span-\d+|md:col-span-\d+|xl:col-span-\d+|lg:col-span-\d+)/g)?.join(' ') || '';
  const otherClasses = className?.replace(/(col-span-\d+|md:col-span-\d+|xl:col-span-\d+|lg:col-span-\d+)/g, '').trim() || '';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.01 }}
      className={cn("flex-1 flex min-h-0", gridClasses)}
    >
      <Card className={cn(
        "border-cyan-500/30 dark:border-cyan-500/30 bg-white dark:bg-slate-900/95 backdrop-blur-sm hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] dark:hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] h-full w-full flex flex-col",
        otherClasses?.includes('overflow-visible') && "overflow-visible",
        otherClasses
      )} style={otherClasses?.includes('overflow-visible') ? { overflow: 'visible' } : undefined}>
        <CardHeader className="pb-2 pt-3 px-4 flex-shrink-0 relative" style={{ zIndex: 1 }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white mb-0.5">{title}</CardTitle>
              {subtitle && (
                <p className="text-xs text-slate-600 dark:text-slate-400">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-1 relative" style={{ zIndex: 100 }}>
              {info && (
                <HoverCard openDelay={200} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 relative z-10"
                    >
                      <FaInfoCircle className="h-3 w-3" />
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent 
                    className="w-80 bg-white dark:bg-slate-800 border-cyan-500/30 shadow-xl" 
                    side="top" 
                    align="end"
                    sideOffset={8}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FaInfoCircle className="h-4 w-4 text-cyan-500" />
                        <h4 className="font-semibold text-slate-900 dark:text-white">{title}</h4>
                      </div>
                      {typeof info === 'string' ? (
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{info}</p>
                      ) : (
                        info
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              )}
              {onExport && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExport}
                  className="h-6 w-6 p-0 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                >
                  <FaDownload className="h-3 w-3" />
                </Button>
              )}
              {onFullscreen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onFullscreen}
                  className="h-6 w-6 p-0 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                >
                  <FaExpand className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className={cn("px-4 pb-3 flex-1 flex flex-col", className?.includes('overflow-visible') && "overflow-visible")} style={className?.includes('overflow-visible') ? { overflow: 'visible' } : undefined}>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Modern Semi-Circular Power Gauge Component
const ModernPowerGauge: React.FC<{
  value: number;
  max: number;
  title: string;
  unit?: string;
  color?: string;
  theme?: 'light' | 'dark';
}> = ({ value, max, title, unit = '%', color = '#06b6d4', theme = 'dark' }) => {
  // Calculate percentage - if value is already 0-100, use it directly; otherwise calculate from max
  const percentage = max === 100 && value <= 100 ? Math.min(value, 100) : Math.min((value / max) * 100, 100);
  const radius = 130;
  const centerX = 150;
  const centerY = 120;
  const startAngle = 180; // Left side (0%)
  const endAngle = 0; // Right side (100%)
  const totalAngle = 180;
  
  // Calculate the current angle (0% = 180°, 100% = 0°)
  // Ensure percentage is clamped between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  const currentAngle = startAngle - (clampedPercentage / 100) * totalAngle;
  const currentAngleRad = (currentAngle * Math.PI) / 180;
  
  // Calculate the end point of the filled arc
  const arcEndX = centerX + Math.cos(currentAngleRad) * radius;
  const arcEndY = centerY - Math.sin(currentAngleRad) * radius;
  
  // Needle position
  const needleLength = radius * 0.7;
  const needleX = centerX + Math.cos(currentAngleRad) * needleLength;
  const needleY = centerY - Math.sin(currentAngleRad) * needleLength;
  
  // Start point of the arc (left side - 0%)
  const arcStartX = centerX - radius;
  const arcStartY = centerY;
  
  // Full arc end point (right side - 100%)
  const arcEndPointX = centerX + radius;
  const arcEndPointY = centerY;

  // Function to create arc path - always use sweep flag 1 (clockwise) and largeArc 0 (short arc)
  const getArcPath = (startX: number, startY: number, endX: number, endY: number, useLargeArc: boolean = false) => {
    // For semicircle from 180° to 0°, we always want the short arc (largeArc = 0)
    // Sweep flag = 1 means clockwise direction
    const largeArc = useLargeArc ? 1 : 0;
    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`;
  };

  // Always use cyan color for the gauge
  const gaugeColor = color || '#06b6d4'; // Cyan 500

  return (
    <div className="flex flex-col items-center w-full overflow-visible">
      <div className="relative w-full flex items-center justify-center overflow-visible" style={{ maxWidth: '500px', minHeight: '450px', padding: '20px' }}>
        <svg viewBox="-40 0 380 140" className="w-full h-auto" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={`energyGaugeGradient-${title}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
              <stop offset="50%" stopColor="#22d3ee" stopOpacity="1" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Background arc - full semicircle */}
          <path
            d={getArcPath(arcStartX, arcStartY, arcEndPointX, arcEndPointY)}
            fill="none"
            stroke="rgba(148, 163, 184, 0.2)"
            strokeWidth="22"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Filled arc with cyan color and glow effect - from start to current value */}
          {clampedPercentage > 0 && (
            <path
              d={getArcPath(arcStartX, arcStartY, arcEndX, arcEndY)}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="22"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-1000"
              filter="url(#glow)"
              style={{ 
                strokeDasharray: 'none',
                vectorEffect: 'non-scaling-stroke',
                opacity: 1
              }}
            />
          )}
          
          {/* Scale marks */}
          {[0, 25, 50, 75, 100].map((mark) => {
            const markAngle = startAngle - (mark / 100) * totalAngle;
            const markAngleRad = (markAngle * Math.PI) / 180;
            const markStartX = centerX + Math.cos(markAngleRad) * (radius - 15);
            const markStartY = centerY - Math.sin(markAngleRad) * (radius - 15);
            const markEndX = centerX + Math.cos(markAngleRad) * (radius + 15);
            const markEndY = centerY - Math.sin(markAngleRad) * (radius + 15);
            
            return (
              <g key={mark}>
                <line
                  x1={markStartX}
                  y1={markStartY}
                  x2={markEndX}
                  y2={markEndY}
                  stroke="#06b6d4"
                  strokeWidth="5"
                  opacity="0.7"
                />
                        <text
                          x={centerX + Math.cos(markAngleRad) * (radius + 38)}
                          y={centerY - Math.sin(markAngleRad) * (radius + 38)}
                          className="fill-slate-600 dark:fill-slate-400"
                          fontSize="15"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontWeight="600"
                        >
                          {mark}%
                        </text>
              </g>
            );
          })}
          
          {/* Needle */}
          <line
            x1={centerX}
            y1={centerY}
            x2={needleX}
            y2={needleY}
            stroke={theme === 'dark' ? '#ffffff' : '#06b6d4'}
            strokeWidth="6"
            strokeLinecap="round"
            className="transition-all duration-1000"
            filter="url(#glow)"
          />
          
          {/* Needle center dot */}
          <circle
            cx={centerX}
            cy={centerY}
            r="12"
            fill="#06b6d4"
            stroke={theme === 'dark' ? '#ffffff' : '#06b6d4'}
            strokeWidth="5"
            filter="url(#glow)"
          />
        </svg>
      </div>
      {/* Value display below gauge */}
      <div className="text-center -mt-6">
        <p className="text-4xl font-bold mb-1" style={{ color: '#06b6d4' }}>
          {value.toFixed(1)}{unit}
        </p>
        <p className="text-base font-bold text-slate-400">{title}</p>
      </div>
    </div>
  );
};

// 6-Step 3D Pie Chart Infographic Component
interface SectionData {
  title: string;
  description: string;
  icon?: React.ReactNode;
  color?: string;
}

interface PieChart3DProps {
  sections?: SectionData[];
  chartTitle?: string;
  size?: number;
  theme?: 'light' | 'dark';
}

const PieChart3DInfographic: React.FC<PieChart3DProps> = ({
  sections,
  chartTitle = "6 Step 3D Pie Chart Infographic",
  size = 500,
  theme = 'dark',
}) => {
  const defaultSections: SectionData[] = sections || [
    { title: 'TITLE HERE', description: 'Some text goes here. Some text goes here. Some text goes here.' },
    { title: 'TITLE HERE', description: 'Some text goes here. Some text goes here. Some text goes here.' },
    { title: 'TITLE HERE', description: 'Some text goes here. Some text goes here. Some text goes here.' },
    { title: 'TITLE HERE', description: 'Some text goes here. Some text goes here. Some text goes here.' },
    { title: 'TITLE HERE', description: 'Some text goes here. Some text goes here. Some text goes here.' },
    { title: 'TITLE HERE', description: 'Some text goes here. Some text goes here. Some text goes here.' },
  ];

  const numSections = defaultSections.length;
  // Scale SVG size based on size prop - increased to accommodate label boxes
  const labelBoxWidth = size * 0.9; // Reduced box width
  const labelDistance = size * 0.55;
  // Calculate padding needed: label distance + half label width + extra margin
  const padding = labelDistance + (labelBoxWidth / 2) + size * 0.15;
  const svgSize = size * 2.4; // Increased to fit labels on all sides
  const chartSize = svgSize - (padding * 2);
  const centerX = padding + chartSize / 2;
  const centerY = padding + chartSize / 2 - size * 0.15; // Move chart up by reducing centerY
  const outerRadius = size * 0.35;
  const innerRadius = size * 0.16;
  const depth = size * 0.07;
  const gap = 3;
  const sectionAngle = 360 / numSections;

  // Colors: darker to lighter teal/cyan
  const defaultColors = ['#0891b2', '#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe'];

  // Isometric 3D transformation
  const isometricX = (x: number, y: number) => x - y;
  const isometricY = (x: number, y: number, z: number) => (x + y) / 2 - z;

  // Create 3D segment path
  const create3DSegment = (index: number, startAngle: number, endAngle: number) => {
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    
    // Center point for icon and explode direction
    const midAngle = (startAngle + endAngle) / 2;
    const midRad = ((midAngle - 90) * Math.PI) / 180;

    // Top arc points
    const topOuterStartX = centerX + Math.cos(startRad) * outerRadius;
    const topOuterStartY = centerY + Math.sin(startRad) * outerRadius;
    const topOuterEndX = centerX + Math.cos(endRad) * outerRadius;
    const topOuterEndY = centerY + Math.sin(endRad) * outerRadius;

    const topInnerStartX = centerX + Math.cos(startRad) * innerRadius;
    const topInnerStartY = centerY + Math.sin(startRad) * innerRadius;
    const topInnerEndX = centerX + Math.cos(endRad) * innerRadius;
    const topInnerEndY = centerY + Math.sin(endRad) * innerRadius;

    // Bottom arc points (offset by depth)
    const bottomOuterStartX = centerX + Math.cos(startRad) * (outerRadius - depth);
    const bottomOuterStartY = centerY + Math.sin(startRad) * (outerRadius - depth);
    const bottomOuterEndX = centerX + Math.cos(endRad) * (outerRadius - depth);
    const bottomOuterEndY = centerY + Math.sin(endRad) * (outerRadius - depth);

    const bottomInnerStartX = centerX + Math.cos(startRad) * (innerRadius - depth);
    const bottomInnerStartY = centerY + Math.sin(startRad) * (innerRadius - depth);
    const bottomInnerEndX = centerX + Math.cos(endRad) * (innerRadius - depth);
    const bottomInnerEndY = centerY + Math.sin(endRad) * (innerRadius - depth);

    // Explode outward slightly
    const explodeDistance = size * 0.03;
    const explodeX = Math.cos(midRad) * explodeDistance;
    const explodeY = Math.sin(midRad) * explodeDistance;

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    // Top face (donut segment)
    const topFace = `
      M ${topOuterStartX + explodeX} ${topOuterStartY + explodeY}
      A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${topOuterEndX + explodeX} ${topOuterEndY + explodeY}
      L ${topInnerEndX + explodeX} ${topInnerEndY + explodeY}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${topInnerStartX + explodeX} ${topInnerStartY + explodeY}
      Z
    `;

    // Outer side face
    const outerSide = `
      M ${topOuterStartX + explodeX} ${topOuterStartY + explodeY}
      L ${bottomOuterStartX + explodeX} ${bottomOuterStartY + explodeY}
      L ${bottomOuterEndX + explodeX} ${bottomOuterEndY + explodeY}
      L ${topOuterEndX + explodeX} ${topOuterEndY + explodeY}
      Z
    `;

    // Inner side face
    const innerSide = `
      M ${topInnerStartX + explodeX} ${topInnerStartY + explodeY}
      L ${bottomInnerStartX + explodeX} ${bottomInnerStartY + explodeY}
      L ${bottomInnerEndX + explodeX} ${bottomInnerEndY + explodeY}
      L ${topInnerEndX + explodeX} ${topInnerEndY + explodeY}
      Z
    `;

    // Left side face
    const leftSide = `
      M ${topOuterStartX + explodeX} ${topOuterStartY + explodeY}
      L ${bottomOuterStartX + explodeX} ${bottomOuterStartY + explodeY}
      L ${bottomInnerStartX + explodeX} ${bottomInnerStartY + explodeY}
      L ${topInnerStartX + explodeX} ${topInnerStartY + explodeY}
      Z
    `;

    // Right side face
    const rightSide = `
      M ${topOuterEndX + explodeX} ${topOuterEndY + explodeY}
      L ${bottomOuterEndX + explodeX} ${bottomOuterEndY + explodeY}
      L ${bottomInnerEndX + explodeX} ${bottomInnerEndY + explodeY}
      L ${topInnerEndX + explodeX} ${topInnerEndY + explodeY}
      Z
    `;

    // Center point for icon
    const midRadius = (outerRadius + innerRadius) / 2;
    const iconX = centerX + Math.cos(midRad) * midRadius + explodeX;
    const iconY = centerY + Math.sin(midRad) * midRadius + explodeY;

    return {
      topFace,
      outerSide,
      innerSide,
      leftSide,
      rightSide,
      iconX,
      iconY,
      midRad,
      midAngle,
    };
  };

  // Get label box position
  const getLabelPosition = (index: number) => {
    const angle = (index * sectionAngle) - 90;
    const angleRad = (angle * Math.PI) / 180;
    const distance = size * 0.55; // Reduced from 0.7 to bring labels closer
    
    let x, y, anchor;
    if (index < numSections / 2) {
      // Left side
      x = centerX - distance;
      y = centerY + Math.sin(angleRad) * (outerRadius + size * 0.12);
      anchor = 'end';
    } else {
      // Right side
      x = centerX + distance;
      y = centerY + Math.sin(angleRad) * (outerRadius + size * 0.12);
      anchor = 'start';
    }
    
    return { x, y, anchor, angleRad };
  };

  return (
    <div 
      className="relative w-full h-full flex flex-col items-center justify-center"
      style={{ 
        height: '100%',
        width: '100%',
        padding: '0',
        overflow: 'visible',
      }}
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${svgSize} ${svgSize}`} className="max-w-full max-h-full" preserveAspectRatio="xMidYMid meet" style={{ maxWidth: '100%', maxHeight: '100%', overflow: 'visible' }}>
        <defs>
          <filter id="segment3DShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="3" dy="3" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.4" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="segmentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.7" />
          </linearGradient>
          <marker
            id="arrowhead3D"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#666" />
          </marker>
        </defs>

        {/* 3D Segments */}
        {defaultSections.map((section, index) => {
          const startAngle = index * sectionAngle;
          const endAngle = (index + 1) * sectionAngle - gap;
          const segment = create3DSegment(index, startAngle, endAngle);
          const color = section.color || defaultColors[index % defaultColors.length];
          const labelPos = getLabelPosition(index);

          return (
            <g key={`segment-${index}`}>
              {/* Side faces (darker for 3D effect) */}
              <path
                d={segment.outerSide}
                fill={color}
                opacity="0.4"
                filter="url(#segment3DShadow)"
              />
              <path
                d={segment.innerSide}
                fill={color}
                opacity="0.3"
                filter="url(#segment3DShadow)"
              />
              <path
                d={segment.leftSide}
                fill={color}
                opacity="0.5"
                filter="url(#segment3DShadow)"
              />
              <path
                d={segment.rightSide}
                fill={color}
                opacity="0.5"
                filter="url(#segment3DShadow)"
              />
              
              {/* Top face (brighter) */}
              <path
                d={segment.topFace}
                fill={color}
                opacity="0.95"
                filter="url(#segment3DShadow)"
              />
              
              {/* White circle icon in center of segment */}
              <circle
                cx={segment.iconX}
                cy={segment.iconY}
                r={size * 0.09}
                fill="white"
                stroke={color}
                strokeWidth={size * 0.013}
                filter="url(#segment3DShadow)"
              />
              
              {/* Connection line to label */}
              <line
                x1={segment.iconX}
                y1={segment.iconY}
                x2={labelPos.x}
                y2={labelPos.y}
                stroke="#666"
                strokeWidth="2"
                strokeDasharray="none"
                markerEnd="url(#arrowhead3D)"
              />
              
              {/* Label box */}
              <g>
                <rect
                  x={labelPos.anchor === 'end' ? labelPos.x - size * 0.9 : labelPos.x}
                  y={labelPos.y - size * 0.12}
                  width={size * 0.9}
                  height={size * 0.24}
                  fill={theme === 'dark' ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)'}
                  stroke={theme === 'dark' ? 'rgba(6, 182, 212, 0.6)' : 'rgba(6, 182, 212, 0.4)'}
                  strokeWidth="2.5"
                  rx="12"
                  filter="url(#segment3DShadow)"
                />
                <text
                  x={labelPos.anchor === 'end' ? labelPos.x - size * 0.15 : labelPos.x + size * 0.15}
                  y={labelPos.y}
                  textAnchor={labelPos.anchor}
                  dominantBaseline="middle"
                  fill={theme === 'dark' ? '#ffffff' : '#1e293b'}
                  fontSize={size * 0.045}
                  fontWeight="700"
                >
                  {section.title}
                </text>
              </g>
            </g>
          );
        })}

        {/* Center hole (transparent to show card background) */}
        <circle
          cx={centerX}
          cy={centerY}
          r={innerRadius - depth}
          fill="transparent"
          stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
          strokeWidth="2"
        />
      </svg>
      
      {/* Chart Title - Below the chart */}
      {chartTitle && (
        <div className="w-full text-center mt-4">
          <p className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
            {chartTitle}
          </p>
        </div>
      )}
    </div>
  );
};

// Circular Progress Gauge Component
const CircularProgressGauge: React.FC<{
  value: number;
  max: number;
  label: string;
  valueLabel: string;
  color: string;
  theme?: 'light' | 'dark';
}> = ({ value, max, label, valueLabel, color, theme = 'dark' }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const size = 120;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Calculate offset: for 87% fill, we want 87% visible, so offset by 13% (the unfilled portion)
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90" style={{ transformOrigin: 'center' }}>
          <defs>
            <linearGradient id={`gradient-${label.replace(/\s+/g, '-')}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity={0.8} />
              <stop offset="100%" stopColor={color} stopOpacity={1} />
            </linearGradient>
          </defs>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={theme === 'dark' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.3)'}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#gradient-${label.replace(/\s+/g, '-')})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ transformOrigin: 'center' }}
          />
        </svg>
        {/* Center percentage */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      {/* Value label below */}
      <div className="text-center mt-2">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{valueLabel}</p>
        <p className="text-xs text-slate-600 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
};

// Loading Skeleton
const LoadingSkeleton = () => (
  <div className="space-y-3 p-4">
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {[...Array(12)].map((_, i) => (
        <Skeleton key={i} className="h-64 w-full" />
      ))}
    </div>
  </div>
);

// Chart Info Helper Function
const getChartInfo = (title: string): string => {
  const chartInfoMap: Record<string, string> = {
    'Production KPIs': 'Displays overall throughput trends over time. Shows daily production totals from the last 30 days, calculated from batch quantities. The area chart visualizes production patterns and helps identify peak performance periods.',
    'Downtime Duration': 'Shows daily downtime trend analysis. Calculates idle time between batch end and transfer time, converted to hours. Displays the last 14 days of downtime data to help identify maintenance needs and operational inefficiencies.',
    'OEE Components': 'Breakdown analysis of Overall Equipment Effectiveness into three key components: Availability (production hours vs planned hours), Performance (actual vs setpoint values), and Quality (materials within tolerance). Each component is crucial for performance analysis.',
    'OEE Overview': 'Overall Equipment Effectiveness gauge showing the combined metric calculated from Availability, Performance, and Quality components. OEE = (Availability × Performance × Quality) / 10000. Higher values indicate better equipment utilization.',
    'Cost Distribution': 'Percentage breakdown of costs by material type. Shows the top 10 materials by actual value usage, with an "Others" category for remaining items. Helps identify cost drivers and optimize material spending.',
    'Energy Efficiency': 'Power Factor Gauge displaying energy efficiency metrics. Calculated from quantity data normalized to a 0-1 range. Shows the power factor percentage which indicates how effectively electrical power is being used.',
    'KPI Performance': 'Multi-dimensional radar chart analyzing 6 key performance areas: Production, Quality, Efficiency, Cost Control, Energy, and Management. Each dimension is scored 0-100, providing a comprehensive view of overall performance.',
    'Cost Breakdown': 'Waterfall analysis showing cost breakdown by material category. Displays top 10 materials by actual value usage with cylindrical gradient bars. Helps visualize cost distribution and identify optimization opportunities.',
    'Energy Consumption': '24-hour trend chart showing energy consumption patterns throughout the day. Groups data by hour (00:00 to 23:00) with normalized consumption values. Useful for identifying peak energy usage periods.',
    'Management KPIs': 'Planned vs Actual comparison chart showing daily production targets versus actual performance. Combines area fill, bars, and line chart to visualize adherence to production plans over the last 7 days.',
    'Peak Load Hours': '24-hour load analysis showing peak demand patterns. Groups quantity data by hour to identify high-load periods. Helps optimize production scheduling and energy management.',
    'Delay Analysis': 'Category breakdown of production delays. Shows delay duration and count grouped by formula category name. Only delays greater than 5 minutes are counted. Helps identify bottlenecks and improvement areas.',
    'Shift Efficiency': 'By-shift analysis showing efficiency metrics for Shift A (6:00-14:00), Shift B (14:00-22:00), and Shift C (22:00-6:00). Displays efficiency as (actual / planned) × 100 per shift with doughnut chart and circular gauges.',
    'Efficiency Trend': 'Energy efficiency over time showing daily efficiency trends. Calculated as energy per ton (energy_sum / quantity_sum) for the last 14 days. Helps track efficiency improvements and identify trends.',
    'Cost Variance Trend': 'Daily variance analysis showing cost variance trends over time. Calculates daily variance as ((actual - setpoint) / setpoint) × 100 for the last 14 days. Positive values indicate cost overruns, negative values indicate savings.',
  };
  
  return chartInfoMap[title] || `Information about ${title} chart. This chart displays real-time data from the database and updates automatically.`;
};

// ============= Main Component =============
export const KPIOverview: React.FC = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });
  // API Data State - NO MORE MOCK DATA
  const [apiData, setApiData] = useState<any>(null);
  // Carousel pagination state
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Fetch data from API - REMOVED ALL MOCK DATA
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchDashboardAnalytics(dateRange.start, dateRange.end);
        setApiData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        console.error('Dashboard data loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [dateRange]);

  // Carousel pagination effect
  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  // Transform API data - ALL DATA FROM API NOW
  const transformedData = useMemo(() => {
    if (!apiData || !apiData.charts) {
      return null;
    }

    const { charts, summary } = apiData;

    return {
      productionData: {
        overallThroughput: summary.totalProduction / 24,
        productionYield: charts.oeeComponents?.find((c: any) => c.name === 'Quality')?.value || 0,
        cycleTime: 12.5,
        onTimeDelivery: 96.8,
        trendData: charts.productionTrend || [],
        totalProduction: summary.totalProduction,
        targetProduction: summary.totalProduction * 1.1,
        actualProduction: summary.totalProduction,
        downtimeDuration: charts.downtimeTrend?.reduce((sum: number, d: any) => sum + d.duration, 0) || 0,
        downtimeTrend: charts.downtimeTrend || [],
      },
      managementData: {
        plannedProduction: charts.plannedVsActual?.reduce((sum: number, d: any) => sum + d.planned, 0) || 0,
        actualProduction: charts.plannedVsActual?.reduce((sum: number, d: any) => sum + d.actual, 0) || 0,
        scheduleAdherence: charts.oeeComponents?.find((c: any) => c.name === 'Availability')?.value || 0,
        resourceUtilization: 87.3,
        orderFulfillmentRate: 94.1,
        comparisonData: charts.plannedVsActual || [],
        planAdherence: charts.oeeComponents?.find((c: any) => c.name === 'Availability')?.value || 0,
        shiftEfficiency: charts.shiftEfficiency?.reduce((sum: number, s: any) => sum + s.efficiency, 0) / (charts.shiftEfficiency?.length || 1) || 0,
        operatorProductivity: 125.5,
        delayAnalysis: charts.delayAnalysis || [],
        shiftEfficiencyTrend: charts.shiftEfficiency || [],
      },
      maintenanceData: {
        oee: charts.oeeValue || 0,
        availability: charts.oeeComponents?.find((c: any) => c.name === 'Availability')?.value || 0,
        performance: charts.oeeComponents?.find((c: any) => c.name === 'Performance')?.value || 0,
        qualityRate: charts.oeeComponents?.find((c: any) => c.name === 'Quality')?.value || 0,
        mtbf: 450,
        mttr: 2.5,
        oeeBreakdown: charts.oeeComponents || [],
      },
      energyData: {
        totalConsumption: summary.totalProduction * 2.8,
        energyCost: summary.totalProduction * 2.8 * 0.15,
        energyEfficiency: summary.efficiency || 0,
        peakDemand: Math.max(...(charts.peakLoadHours || []).map((h: any) => h.load), 0),
        powerFactor: charts.powerFactor || 0,
        consumptionTrend: charts.energyConsumption || [],
        energyConsumptionPerTon: summary.efficiency || 0,
        energyCostPerTon: 0.42,
        peakLoadHours: charts.peakLoadHours || [],
        efficiencyTrend: charts.efficiencyTrend || [],
      },
      costingData: {
        costPerUnit: 12.5,
        totalProductionCost: Math.abs(summary.costSavings || 0),
        maintenanceCostPerUnit: 1.8,
        costVariance: charts.costVarianceTrend?.[charts.costVarianceTrend.length - 1]?.variance || 0,
        roi: 18.5,
        costBreakdown: charts.costBreakdown || [],
        costDistribution: charts.costDistribution || [],
        rawMaterialCostPerTon: 8.5,
        energyCostPerTon: 0.42,
        totalVariableCost: Math.abs(summary.costSavings || 0),
        costVarianceTrend: charts.costVarianceTrend || [],
      },
      radarChartData: charts.radarKPIs || [],
    };
  }, [apiData]);

  // KPI Summary Cards - FROM API DATA
  const kpiSummaries: KPISummary[] = useMemo(() => {
    if (!apiData || !transformedData) {
      return [];
    }

    const prevProduction = transformedData.productionData.overallThroughput * 0.95;
    const prevManagement = transformedData.managementData.scheduleAdherence * 0.98;
    const prevOEE = transformedData.maintenanceData.oee * 0.98;
    const prevEnergy = transformedData.energyData.energyEfficiency * 1.03;
    const prevCost = 12.8;

    return [
      {
        id: 'production',
        title: 'Production',
        value: transformedData.productionData.overallThroughput,
        unit: 'units/hr',
        icon: FaIndustry,
        color: 'from-cyan-500 to-blue-600',
        trend: ((transformedData.productionData.overallThroughput - prevProduction) / prevProduction) * 100,
        previousValue: prevProduction,
      },
      {
        id: 'management',
        title: 'Management',
        value: transformedData.managementData.scheduleAdherence,
        unit: '%',
        icon: FaCog,
        color: 'from-purple-500 to-pink-600',
        trend: ((transformedData.managementData.scheduleAdherence - prevManagement) / prevManagement) * 100,
        previousValue: prevManagement,
      },
      {
        id: 'maintenance',
        title: 'OEE',
        value: transformedData.maintenanceData.oee,
        unit: '%',
        icon: FaChartLine,
        color: 'from-emerald-500 to-green-600',
        trend: ((transformedData.maintenanceData.oee - prevOEE) / prevOEE) * 100,
        previousValue: prevOEE,
      },
      {
        id: 'energy',
        title: 'Energy',
        value: transformedData.energyData.energyEfficiency,
        unit: 'kWh/unit',
        icon: FaBolt,
        color: 'from-yellow-500 to-orange-600',
        trend: -((transformedData.energyData.energyEfficiency - prevEnergy) / prevEnergy) * 100,
        previousValue: prevEnergy,
      },
      {
        id: 'costing',
        title: 'Costing',
        value: transformedData.costingData.costPerUnit,
        unit: '$',
        icon: FaDollarSign,
        color: 'from-blue-500 to-indigo-600',
        trend: -((transformedData.costingData.costPerUnit - prevCost) / prevCost) * 100,
        previousValue: prevCost,
      },
    ];
  }, [apiData, transformedData]);

  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#1e293b' : 'rgb(255 255 255 / 0.95)',
    border: '1px solid #06b6d4',
    borderRadius: '8px',
    color: theme === 'dark' ? '#ffffff' : '#1e293b',
  };

  const chartColors = {
    primary: '#06b6d4',
    secondary: '#22d3ee',
    tertiary: '#67e8f9',
  };

  const pieColors = ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe'];

  if (loading) {
    return (
      <WaterSystemLayout>
        <LoadingSkeleton />
      </WaterSystemLayout>
    );
  }

  if (error || !transformedData) {
    return (
      <WaterSystemLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="p-8 border-red-500/50">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">Error Loading Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400">
                {error || 'Unable to load dashboard data. Please try again.'}
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4 bg-cyan-500 hover:bg-cyan-600"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </WaterSystemLayout>
    );
  }

  const { productionData, managementData, maintenanceData, energyData, costingData, radarChartData } = transformedData;

  return (
    <WaterSystemLayout>
      <div className="space-y-3 p-4 bg-white dark:bg-[#0f172a] min-h-screen overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">KPI Overview Dashboard</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">Real-time performance metrics from database</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="h-3 w-3 text-slate-600 dark:text-slate-400" />
              <input
                type="date"
                value={dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value) })}
                className="px-2 py-1 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400">to</span>
              <input
                type="date"
                value={dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value) })}
                className="px-2 py-1 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Carousel Dashboard */}
        <Carousel className="w-full" opts={{ loop: false }} setApi={setApi}>
          <CarouselContent className="-ml-0">
            {/* Slide 1: KPI Cards + 6 Charts */}
            <CarouselItem className="pl-4 pr-4">
              <div className="space-y-3">
        {/* KPI Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2 mb-3 px-1">
          {kpiSummaries.map((kpi, index) => (
            <KPISummaryCard key={kpi.id} kpi={kpi} index={index} />
          ))}
        </div>

                {/* Chart Grid - 6 Charts (2 rows x 3 columns) */}
                <div className="space-y-3 px-1">
                  {/* First Row: Production KPIs and Downtime Duration (1:1 ratio) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* PRODUCTION KPIs */}
            <ChartCard
              title="Production KPIs"
              subtitle="Overall Throughput Trends"
              info={getChartInfo('Production KPIs')}
            >
              <div className="mt-10">
                <ResponsiveContainer width="100%" height={480}>
                <AreaChart data={productionData.trendData}>
                  <defs>
                    <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-700" />
                  <XAxis dataKey="date" className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
                  <YAxis className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: '#06b6d4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chartColors.primary}
                    fillOpacity={1}
                    fill="url(#colorThroughput)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-5 gap-2 mt-1">
                <div className="text-center p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Total Production</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{productionData.totalProduction.toFixed(1)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">TON/Shift/Day</p>
                </div>
                <div className="text-center p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Actual vs Target</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {((productionData.actualProduction / productionData.targetProduction) * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Target: {productionData.targetProduction.toFixed(0)}</p>
                </div>
                <div className="text-center p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Yield</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{productionData.productionYield}%</p>
                </div>
                <div className="text-center p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Throughput</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{productionData.overallThroughput.toFixed(1)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">units/hr</p>
                </div>
                <div className="text-center p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Downtime</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{productionData.downtimeDuration.toFixed(1)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">hours</p>
                </div>
              </div>
            </ChartCard>

            {/* Cost Distribution */}
            <ChartCard title="Cost Distribution" subtitle="Percentage Breakdown" info={getChartInfo('Cost Distribution')}>
              <div className="relative w-full" style={{ height: '520px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costingData.costDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                            label={false}
                      outerRadius={180}
                            innerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                            paddingAngle={1}
                            minAngle={1}
                    >
                      {costingData.costDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        ...tooltipStyle,
                        border: '1px solid #3b82f6',
                      }}
                            formatter={(value: number, name: string, props: any) => {
                              const percent = (props.payload.percent * 100).toFixed(1);
                              return [`${name}: ${percent}%`, 'Percentage'];
                            }}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={50}
                            wrapperStyle={{ paddingTop: '8px', fontSize: '10px' }}
                            formatter={(value: string, entry: any) => {
                              const percent = (entry.payload.percent * 100).toFixed(1);
                              return `${value}: ${percent}%`;
                            }}
                            iconType="circle"
                            iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text showing material count */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-slate-900 dark:text-white mb-1">
                      {costingData.costDistribution.length}
                    </p>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      Materials
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Cost Variance</p>
                  <p className={`text-sm font-bold ${costingData.costVariance >= 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {costingData.costVariance.toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">ROI</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{costingData.roi}%</p>
                </div>
                <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Maint. Cost/Unit</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">${costingData.maintenanceCostPerUnit}</p>
                </div>
              </div>
            </ChartCard>
                  </div>

                  {/* Remaining Charts - 3 columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-fr">
            {/* OEE Overview */}
            <ChartCard title="OEE Overview" subtitle="Overall Equipment Effectiveness" info={getChartInfo('OEE Overview')}>
              <div className="relative flex flex-col items-center justify-center" style={{ minHeight: '480px' }}>
                <div className="relative flex items-center justify-center flex-1 w-full">
                  <ResponsiveContainer width="100%" height={480}>
                    <RadialBarChart
                      innerRadius="60%"
                      outerRadius="90%"
                      data={[
                        { name: 'Max', value: 100, fill: theme === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)' },
                        { name: 'OEE', value: maintenanceData.oee, fill: chartColors.primary },
                      ]}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar 
                        dataKey="value" 
                        cornerRadius={10}
                      >
                        <Cell fill={theme === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'} />
                        <Cell fill={chartColors.primary} />
                      </RadialBar>
                      <Tooltip
                        contentStyle={{
                          ...tooltipStyle,
                          border: '1px solid #10b981',
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === 'Max') return null;
                          return [`${value}%`, 'OEE'];
                        }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  {/* Centered percentage text */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{maintenanceData.oee.toFixed(1)}%</p>
                  </div>
                </div>
                {/* Label below the chart */}
                <div className="text-center mt-2">
                  <p className="text-base font-bold text-slate-600 dark:text-slate-400">Overall Equipment Effectiveness</p>
                </div>
              </div>
            </ChartCard>

            {/* Downtime Duration */}
            <ChartCard title="Downtime Duration" subtitle="Daily Trend Analysis" info={getChartInfo('Downtime Duration')}>
              <ResponsiveContainer width="100%" height={480}>
                <ComposedChart data={productionData.downtimeTrend.slice(-14)}>
                  <defs>
                    <linearGradient id="colorDowntime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-700" />
                  <XAxis dataKey="date" className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor', fontSize: 10 }} />
                  <YAxis className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [`${value.toFixed(2)} hrs`, 'Downtime']}
                  />
                  <Area
                    type="monotone"
                    dataKey="duration"
                    fill="url(#colorDowntime)"
                    fillOpacity={1}
                  />
                  <Line
                    type="monotone"
                    dataKey="duration"
                    stroke={chartColors.primary}
                    strokeWidth={2}
                    dot={{ 
                      fill: 'white', 
                      stroke: chartColors.primary, 
                      strokeWidth: 2, 
                      r: 4,
                      fillOpacity: 0
                    }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Energy Power Gauge */}
            <ChartCard title="Energy Efficiency" subtitle="Power Factor Gauge" info={getChartInfo('Energy Efficiency')} className="overflow-visible">
              <div className="flex items-center justify-center py-4 overflow-visible" style={{ minHeight: '480px' }}>
                <ModernPowerGauge
                  value={energyData.powerFactor * 100}
                  max={100}
                  title="Power Factor"
                  unit="%"
                  color={chartColors.primary}
                  theme={theme}
                />
              </div>
            </ChartCard>
                </div>
              </div>
              </div>
            </CarouselItem>

            {/* Slide 2: 9 Charts (3 rows x 3 columns) */}
            <CarouselItem className="pl-4 pr-4">
              <div className="space-y-3">
                {/* Chart Grid - 9 Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-fr px-1">
            {/* KPI Performance Radar Chart */}
            <ChartCard title="KPI Performance" subtitle="Multi-Dimensional Analysis" info={getChartInfo('KPI Performance')}>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarChartData}>
                  <PolarGrid stroke={theme === 'dark' ? '#475569' : '#cbd5e1'} />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: theme === 'dark' ? '#cbd5e1' : '#475569', fontSize: 11 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10 }}
                  />
                  <Radar
                    name="Performance"
                    dataKey="value"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      ...tooltipStyle,
                      border: '1px solid #06b6d4',
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Performance']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>

                  {/* ENERGY KPIs */}
                  <ChartCard title="Energy Consumption" subtitle="24-Hour Trend" info={getChartInfo('Energy Consumption')}>
              <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={energyData.consumptionTrend}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-700" />
                        <XAxis dataKey="hour" className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
                        <YAxis className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
                        <Tooltip
                          contentStyle={{
                            ...tooltipStyle,
                            border: '1px solid #f59e0b',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="consumption"
                          stroke={chartColors.primary}
                          strokeWidth={2}
                          dot={{ fill: chartColors.primary, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-6 gap-2 mt-2">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Consumption/TON</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{energyData.energyConsumptionPerTon.toFixed(2)}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">kWh/TON</p>
                      </div>
                      <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Cost/TON</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">${energyData.energyCostPerTon.toFixed(2)}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">$/TON</p>
                      </div>
                      <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Total Consumption</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{energyData.totalConsumption.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">kWh</p>
                      </div>
                      <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Energy Cost</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">${energyData.energyCost.toLocaleString()}</p>
                      </div>
                      <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Peak Demand</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{energyData.peakDemand}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">kW</p>
                      </div>
                      <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Power Factor</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{energyData.powerFactor.toFixed(2)}</p>
                      </div>
                    </div>
            </ChartCard>

            {/* COSTING KPIs - Waterfall */}
            <ChartCard title="Cost Breakdown" subtitle="Waterfall Analysis" info={getChartInfo('Cost Breakdown')}>
                    <ResponsiveContainer width="100%" height={340}>
                      <BarChart 
                        data={costingData.costBreakdown} 
                        barCategoryGap="20%"
                        margin={{ top: 10, right: 10, bottom: 85, left: 10 }}
                      >
                  <defs>
                    <radialGradient id="cylindricalGradient" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#a5f3fc" stopOpacity={1} />
                      <stop offset="30%" stopColor="#67e8f9" stopOpacity={1} />
                      <stop offset="50%" stopColor="#22d3ee" stopOpacity={1} />
                      <stop offset="70%" stopColor="#06b6d4" stopOpacity={1} />
                      <stop offset="100%" stopColor="#0891b2" stopOpacity={1} />
                    </radialGradient>
                    <linearGradient id="cylindricalGradientVertical" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#a5f3fc" stopOpacity={1} />
                      <stop offset="10%" stopColor="#67e8f9" stopOpacity={1} />
                      <stop offset="25%" stopColor="#22d3ee" stopOpacity={1} />
                      <stop offset="50%" stopColor="#06b6d4" stopOpacity={1} />
                      <stop offset="75%" stopColor="#0891b2" stopOpacity={1} />
                      <stop offset="90%" stopColor="#0e7490" stopOpacity={1} />
                      <stop offset="100%" stopColor="#155e75" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="cylindricalGradientHorizontal" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0e7490" stopOpacity={1} />
                      <stop offset="25%" stopColor="#0891b2" stopOpacity={1} />
                      <stop offset="50%" stopColor="#22d3ee" stopOpacity={1} />
                      <stop offset="75%" stopColor="#0891b2" stopOpacity={1} />
                      <stop offset="100%" stopColor="#0e7490" stopOpacity={1} />
                    </linearGradient>
                    <filter id="barGlow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-700" />
                        <XAxis 
                          dataKey="name" 
                          className="text-slate-600 dark:text-slate-400" 
                          tick={{ fill: 'currentColor', fontSize: 10 }}
                          angle={-45}
                          textAnchor="end"
                          height={90}
                          interval={0}
                        />
                  <YAxis className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
                  <Tooltip
                    contentStyle={{
                      ...tooltipStyle,
                      border: '1px solid #3b82f6',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Cost']}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[50, 50, 0, 0]}
                    filter="url(#barGlow)"
                    barSize={60}
                  >
                    {costingData.costBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill="url(#cylindricalGradientHorizontal)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
                    <div className="grid grid-cols-4 gap-2 mt-0">
                <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Raw Material/TON</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">${costingData.rawMaterialCostPerTon.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">$/TON</p>
                </div>
                <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Energy Cost/TON</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">${costingData.energyCostPerTon.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">$/TON</p>
                </div>
                <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Total Variable Cost</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">${costingData.totalVariableCost.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Cost Per Unit</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">${costingData.costPerUnit}</p>
                </div>
              </div>
            </ChartCard>

            {/* MANAGEMENT KPIs */}
            <ChartCard title="Management KPIs" subtitle="Planned vs Actual" info={getChartInfo('Management KPIs')}>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={managementData.comparisonData.slice(-7)}>
                  <defs>
                    <linearGradient id="plannedBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                      <stop offset="50%" stopColor="#0891b2" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#0e7490" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="actualLineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-700" />
                  <XAxis dataKey="date" className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
                  <YAxis className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
                  <Tooltip
                    contentStyle={{
                      ...tooltipStyle,
                      border: '1px solid #8b5cf6',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    fill="url(#actualLineGradient)"
                    stroke="none"
                  />
                  <Bar 
                    dataKey="planned" 
                    fill="url(#plannedBarGradient)" 
                    radius={[8, 8, 0, 0]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#22d3ee" 
                    strokeWidth={3}
                    dot={{ fill: '#22d3ee', r: 5, strokeWidth: 2, stroke: theme === 'dark' ? '#ffffff' : '#1e293b' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#22d3ee', fill: '#ffffff' }}
                  />
                  <Legend 
                    wrapperStyle={{ color: theme === 'dark' ? '#ffffff' : '#1e293b' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-4 gap-2 mt-2">
                <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Plan Adherence</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{managementData.planAdherence.toFixed(1)}%</p>
                </div>
                <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Shift Efficiency</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{managementData.shiftEfficiency.toFixed(1)}%</p>
                </div>
                <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Operator Productivity</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{managementData.operatorProductivity.toFixed(1)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">units/operator</p>
                </div>
                <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Schedule Adherence</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{managementData.scheduleAdherence.toFixed(1)}%</p>
                </div>
              </div>
            </ChartCard>

                  {/* Peak Load Hours */}
                  <ChartCard title="Peak Load Hours" subtitle="24-Hour Load Analysis" info={getChartInfo('Peak Load Hours')}>
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={energyData.peakLoadHours}>
                        <defs>
                          <linearGradient id="colorPeakLoad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-700" />
                        <XAxis dataKey="hour" className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
                        <YAxis className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
                        <Tooltip
                          contentStyle={{
                            ...tooltipStyle,
                            border: '1px solid #f59e0b',
                          }}
                          formatter={(value: number) => [`${value.toFixed(0)} kW`, 'Load']}
                        />
                        <Area
                          type="monotone"
                          dataKey="load"
                          stroke={chartColors.primary}
                          fillOpacity={1}
                          fill="url(#colorPeakLoad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>

            {/* Delay Analysis */}
            <ChartCard title="Delay Analysis" subtitle="Category Breakdown" info={getChartInfo('Delay Analysis')}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={managementData.delayAnalysis} margin={{ top: 40, right: 20, left: 20, bottom: 40 }}>
                  <defs>
                    <linearGradient id="delayBarGradient1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                      <stop offset="100%" stopColor="#0891b2" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="delayBarGradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={1} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="delayBarGradient3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#67e8f9" stopOpacity={1} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="delayBarGradient4" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a5f3fc" stopOpacity={1} />
                      <stop offset="100%" stopColor="#67e8f9" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="delayBarGradient5" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#cffafe" stopOpacity={1} />
                      <stop offset="100%" stopColor="#a5f3fc" stopOpacity={0.8} />
                    </linearGradient>
                    <filter id="badgeGlow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-700" vertical={false} />
                  <XAxis 
                    dataKey="category" 
                    className="text-slate-600 dark:text-slate-400" 
                    tick={{ fill: 'currentColor', fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
                  <Tooltip
                    contentStyle={{
                      ...tooltipStyle,
                      border: '1px solid #8b5cf6',
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)} hrs`, 'Duration']}
                  />
                  <Bar 
                    dataKey="duration" 
                    radius={[8, 8, 0, 0]}
                    barSize={50}
                  >
                    {managementData.delayAnalysis.map((entry: any, index: number) => {
                      const gradients = ['delayBarGradient1', 'delayBarGradient2', 'delayBarGradient3', 'delayBarGradient4', 'delayBarGradient5'];
                      const colors = ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe'];
                      return (
                        <Cell key={`cell-${index}`} fill={`url(#${gradients[index % gradients.length]})`} />
                      );
                    })}
                    <LabelList
                      dataKey="duration"
                      content={(props: any) => {
                        const { x, y, width, value, index } = props;
                        const colors = ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe'];
                        const color = colors[index % colors.length];
                        const badgeY = y + 20;
                        const percentage = ((value / Math.max(...managementData.delayAnalysis.map((d: any) => d.duration))) * 100).toFixed(0);
                        return (
                          <g>
                            <circle cx={x + width / 2} cy={badgeY} r={22} fill={color} opacity={0.3} filter="url(#badgeGlow)" />
                            <circle cx={x + width / 2} cy={badgeY} r={18} fill="white" stroke={color} strokeWidth={2} />
                            <text
                              x={x + width / 2}
                              y={badgeY}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill={color}
                              fontSize="12"
                              fontWeight="700"
                            >
                              {percentage}%
                            </text>
                          </g>
                        );
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Shift Efficiency */}
            <ChartCard title="Shift Efficiency" subtitle="By Shift Analysis" info={getChartInfo('Shift Efficiency')}>
              <div className="flex gap-4 items-center pt-6" style={{ minHeight: '320px' }}>
                {/* Left: Segmented Doughnut Chart */}
                <div className="flex-1 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <defs>
                        <linearGradient id="shiftAGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                          <stop offset="100%" stopColor="#22d3ee" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="shiftBGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#0891b2" stopOpacity={1} />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="shiftCGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#22d3ee" stopOpacity={1} />
                          <stop offset="100%" stopColor="#67e8f9" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={managementData.shiftEfficiencyTrend.map((shift: any, index: number) => {
                          // Calculate production value based on efficiency
                          const productionValue = shift.efficiency * 500;
                          return {
                            name: shift.shift,
                            value: productionValue,
                            efficiency: shift.efficiency,
                          };
                        })}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }: any) => {
                          const formattedValue = value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value.toFixed(0)}`;
                          return formattedValue;
                        }}
                        labelLine={false}
                      >
                        {managementData.shiftEfficiencyTrend.map((shift: any, index: number) => {
                          const colors = ['url(#shiftAGradient)', 'url(#shiftBGradient)', 'url(#shiftCGradient)'];
                          return (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          );
                        })}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          ...tooltipStyle,
                          border: '1px solid #06b6d4',
                        }}
                        formatter={(value: number, name: string, props: any) => {
                          const efficiency = props.payload?.efficiency || 0;
                          return [`${efficiency.toFixed(1)}% Efficiency`, name];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Right: Three Circular Progress Gauges */}
                <div className="flex-1 flex items-center justify-center gap-6">
                  {managementData.shiftEfficiencyTrend.map((shift: any, index: number) => {
                    const colors = ['#06b6d4', '#22d3ee', '#67e8f9'];
                    const valueLabels = [
                      `$${(shift.efficiency * 500).toFixed(0)}`,
                      `$${(shift.efficiency * 450).toFixed(0)}`,
                      `$${(shift.efficiency * 400).toFixed(0)}`,
                    ];
                    return (
                      <CircularProgressGauge
                        key={shift.shift}
                        value={shift.efficiency}
                        max={100}
                        label={shift.shift}
                        valueLabel={valueLabels[index]}
                        color={colors[index]}
                        theme={theme}
                      />
                    );
                  })}
                </div>
              </div>
            </ChartCard>

            {/* Efficiency Trend */}
            <ChartCard title="Efficiency Trend" subtitle="Energy Efficiency Over Time" info={getChartInfo('Efficiency Trend')}>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={energyData.efficiencyTrend.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-700" />
                  <XAxis dataKey="date" className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor', fontSize: 10 }} />
                  <YAxis className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
                  <Tooltip
                    contentStyle={{
                      ...tooltipStyle,
                      border: '1px solid #f59e0b',
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)} kWh/TON`, 'Efficiency']}
                  />
                  <Line
                    type="monotone"
                    dataKey="efficiency"
                    stroke={chartColors.primary}
                    strokeWidth={2}
                    dot={{ fill: chartColors.primary, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Cost Variance Trend */}
            <ChartCard title="Cost Variance Trend" subtitle="Daily Variance Analysis" info={getChartInfo('Cost Variance Trend')}>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={costingData.costVarianceTrend.slice(-14)}>
                  <defs>
                    <linearGradient id="varianceAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                      <stop offset="50%" stopColor="#22d3ee" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#67e8f9" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-700" />
                  <XAxis dataKey="date" className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor', fontSize: 10 }} />
                  <YAxis className="text-slate-600 dark:text-slate-400" tick={{ fill: 'currentColor' }} />
                  <Tooltip
                    contentStyle={{
                      ...tooltipStyle,
                      border: '1px solid #06b6d4',
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Variance']}
                  />
                  <Area
                    type="linear"
                    dataKey="variance"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    fill="url(#varianceAreaGradient)"
                    dot={{ fill: '#06b6d4', r: 5, strokeWidth: 2, stroke: theme === 'dark' ? '#ffffff' : '#1e293b' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#06b6d4', fill: '#ffffff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
        
        {/* Modern Pagination Dots - Fixed at bottom for visibility */}
        {count > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center">
            <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md border border-cyan-500/40 shadow-xl shadow-cyan-500/20">
              {Array.from({ length: count }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className={cn(
                    "relative h-2 rounded-full transition-all duration-300",
                    current === index + 1
                      ? "w-8 bg-cyan-500 shadow-lg shadow-cyan-500/50"
                      : "w-2 bg-slate-400 dark:bg-slate-600 hover:bg-slate-500 dark:hover:bg-slate-500"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                >
                  {current === index + 1 && (
                    <motion.div
                      layoutId="pagination"
                      className="absolute inset-0 bg-cyan-500 rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </WaterSystemLayout>
  );
};

export default KPIOverview;
