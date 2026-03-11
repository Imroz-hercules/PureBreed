import React, { useState, useEffect, useRef } from "react";
import { WaterSystemLayout } from '../../components/hercules-sfms/WaterSystemLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import ChartComponent from "@/components/hercules-sfms/ChartComponent";
import { FaSyncAlt } from "react-icons/fa";
import { API_ENDPOINTS } from '@/lib/api';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Filter,
  ChevronDown,
  Check,
  X,
  LucideIcon,
  TrendingUp,
  Activity,
  Package,
  Shapes,
  Calendar
} from "lucide-react";
import axios from "axios";
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

// MultiSelect component (reused from KPI Dashboard)
interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  label: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, selected, onChange, placeholder, label }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectAll = () => {
    onChange([...options]);
  };

  return (
    <div className="relative">
      <Label className="text-sm font-medium text-slate-300 mb-2 block">{label}</Label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent flex items-center justify-between"
        >
          <span className="truncate">
            {selected.length === 0 ? placeholder : `${selected.length} selected`}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
            <div className="p-2 border-b border-slate-600 flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="px-2 py-1 text-xs bg-cyan-600 text-white rounded hover:bg-cyan-700"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="px-2 py-1 text-xs bg-slate-600 text-white rounded hover:bg-slate-700"
              >
                Clear All
              </button>
            </div>
            {options.map((option) => (
              <label
                key={option}
                className="flex items-center px-3 py-2 hover:bg-slate-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggleOption(option)}
                  className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500 focus:ring-2"
                />
                <span className="ml-2 text-sm text-white truncate">{option}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface KPIData {
  title: string;
  value: number | string;
  unit: string;
  icon: LucideIcon;
  color: string;
  glow: string;
}

interface Filters {
  startDate: string;
  endDate: string;
  product: string[];
  batch: string[];
  material: string[];
}

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

// Helper function to get default dates (1 day ago for faster loading)
const getDefaultDates = () => {
  const today = new Date();
  
  // Set start date to 7 days ago at 7 AM (last week)
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 7);
  startDate.setHours(7, 0, 0, 0);

  // Set end date to today at 7 AM
  const endDate = new Date(today);
  endDate.setHours(7, 0, 0, 0);
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
};

// Helper function to apply 4-hour offset for API calls
const getApiDateWithOffset = (dateString: string) => {
  const date = new Date(dateString);
  date.setHours(date.getHours() - 4);
  return date;
};

// Debounce function
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};


// Loading overlay component
const LoadingOverlay: React.FC<{ isLoading: boolean; children: React.ReactNode }> = ({ isLoading, children }) => {
  if (isLoading) {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-cyan-400 text-lg font-medium">Loading charts...</p>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

export function KPICarousel() {

  // Use the same default dates as defined earlier (1 day ago for faster loading)
  const defaultDates = getDefaultDates();

  const [filters, setFilters] = useState<Filters>({
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate,
    product: [],
    batch: [],
    material: [],
  });

  // KPI data state
  const [kpiData, setKpiData] = useState<KPIData[]>([]);

  // Chart data states
  const [barChartData, setBarChartData] = useState({ labels: [] as string[], values: [] as number[] });
  const [pieChartData, setPieChartData] = useState({ labels: [] as string[], values: [] as number[] });
  const [batchesByWeekdayData, setBatchesByWeekdayData] = useState({ labels: [] as string[], values: [] as number[] });
  const [errorPercentageData, setErrorPercentageData] = useState({ labels: [] as string[], values: [] as number[] });

  // Carousel states
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Filter states
  const [batchNames, setBatchNames] = useState<string[]>([]);
  const [productNames, setProductNames] = useState<string[]>([]);
  const [materialNames, setMaterialNames] = useState<string[]>([]);

  // Loading and error states
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Chart configurations for carousel
  const chartConfigs = [
    {
      id: 'material-weight',
      title: 'Material Weight per Day (tons)',
      type: 'bar' as const,
      data: barChartData,
      colors: ['#00bfff'],
      borderColor: 'border-cyan-500/30',
      shadowColor: 'shadow-[0_0_20px_rgba(0,255,255,0.1)]'
    },
    {
      id: 'products-count',
      title: 'Products by Count',
      type: 'pie' as const,
      data: pieChartData,
      colors: ['#10b981', '#3b82f6', '#ec4899'],
      borderColor: 'border-emerald-500/30',
      shadowColor: 'shadow-[0_0_20px_rgba(16,185,129,0.1)]'
    },
    {
      id: 'batches-weekday',
      title: 'No. Batches by Weekday',
      type: 'bar' as const,
      data: batchesByWeekdayData,
      colors: ['#3b82f6', '#f97316', '#ef4444', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'],
      borderColor: 'border-emerald-500/30',
      shadowColor: 'shadow-[0_0_20px_rgba(16,185,129,0.1)]'
    },
    {
      id: 'material-error',
      title: 'Material Error Analysis',
      type: 'pie' as const,
      data: errorPercentageData,
      colors: errorPercentageData.values.map(() => '#ef4444'),
      borderColor: 'border-red-500/30',
      shadowColor: 'shadow-[0_0_20px_rgba(239,68,68,0.1)]'
    }
  ];

  // Carousel navigation functions
  const scrollPrev = () => {
    if (emblaApi) emblaApi.scrollPrev();
  };

  const scrollNext = () => {
    if (emblaApi) emblaApi.scrollNext();
  };

  const scrollTo = (index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  };

  const toggleAutoplay = () => {
    if (emblaApi) {
      if (isPlaying) {
        emblaApi.plugins().autoplay?.stop();
      } else {
        emblaApi.plugins().autoplay?.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Update selected index when carousel changes
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    onSelect(); // Set initial index

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  // Helper function to check if value is finite number
  function isFiniteNumber(val: any): boolean {
    return typeof val === 'number' && isFinite(val) || (!isNaN(val) && val !== null && val !== '' && isFinite(Number(val)));
  }

  // Data processing function (exact same logic as KPI Dashboard)
  const calculateKPIsAndCharts = (data: any[]) => {
    if (!Array.isArray(data)) {
      return;
    }

    // EXACT SAME LOGIC AS KPI DASHBOARD

    // Calculate KPI metrics - EXACT SAME LOGIC AS KPI DASHBOARD
    const totalMaterialsDosed = data.length; // Each row = one material dosed
    const totalBatches = new Set(data.map(item => item["Batch GUID"])).size;
    const uniqueProductsSet = new Set<string>();
    const productCounts: Record<string, number> = {};
    const materialCounts: Record<string, number> = {};
    const batchTimeline: Record<string, Set<string>> = {};

    // Throughput and Complexity calculation
    const productMaterialMap: Record<string, Set<string>> = {};
    data.forEach(item => {
      const product = item["Product Name"];
      const material = item["Material Name"];
      if (product && material) {
        if (!productMaterialMap[product]) {
          productMaterialMap[product] = new Set();
        }
        productMaterialMap[product].add(material);
      }
    });

    data.forEach((item) => {
      if (item["Product Name"]) {
        uniqueProductsSet.add(item["Product Name"]);
        productCounts[item["Product Name"]] = (productCounts[item["Product Name"]] || 0) + 1;
      }

      // Count materials for material names dropdown
      if (item["Material Name"]) {
        materialCounts[item["Material Name"]] = (materialCounts[item["Material Name"]] || 0) + 1;
      }

      // FIXED: Count unique batches per day, not materials
      if (item["Batch Act Start"] !== "N/A" && item["Batch Act Start"]) {
        const batchDate = new Date(item["Batch Act Start"]);
        // Only include batchDate if it is within the selected date range
        if (
          !isNaN(batchDate.getTime()) &&
          filters.startDate &&
          filters.endDate &&
          batchDate >= new Date(filters.startDate) &&
          batchDate <= new Date(filters.endDate)
        ) {
          const formattedDate = batchDate.toDateString();
          const batchGUID = item["Batch GUID"] || "unknown";

          // Initialize batch set for this date if it doesn't exist
          if (!batchTimeline[formattedDate]) {
            batchTimeline[formattedDate] = new Set();
          }
          // Add this batch GUID to the set for this date
          batchTimeline[formattedDate].add(batchGUID);
        }
      }
    });

    // Update unique material names for dropdowns
    const uniqueMaterialNames = Array.from(
      new Set(data.map((item) => item["Material Name"]).filter((name): name is string => !!name))
    );
    setMaterialNames(uniqueMaterialNames);

    const uniqueProducts = uniqueProductsSet.size || 1;
    const batchesPerProduct = (totalBatches / uniqueProducts).toFixed(2);

    // Find the most recent (latest) valid Batch Act Start date
    let latestBatchDate = "N/A";
    const validBatchDates = data
      .map(item => item["Batch Act Start"])
      .filter((dateStr): dateStr is string => {
        return typeof dateStr === 'string' && dateStr !== "N/A" && !isNaN(new Date(dateStr).getTime());
      });
    if (validBatchDates.length > 0) {
      const maxDate = new Date(Math.max(...validBatchDates.map(dateStr => new Date(dateStr).getTime())));
      latestBatchDate = maxDate.toDateString();
    }

    const calculatedKpis = [
      { title: "Total Batches", value: totalBatches, unit: "batches", icon: Activity, color: "from-cyan-500 to-blue-500", glow: "shadow-[0_0_20px_rgba(0,255,255,0.3)]" },
      { title: "Total Materials", value: totalMaterialsDosed, unit: "dosed", icon: Package, color: "from-yellow-500 to-orange-500", glow: "shadow-[0_0_20px_rgba(255,193,7,0.3)]" },
      { title: "Unique Products", value: uniqueProducts, unit: "types", icon: Shapes, color: "from-purple-500 to-pink-500", glow: "shadow-[0_0_20px_rgba(168,85,247,0.3)]" },
      { title: "Avg Batches/Product", value: batchesPerProduct, unit: "", icon: TrendingUp, color: "from-emerald-500 to-green-500", glow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]" },
      { title: "Latest Batch Date", value: latestBatchDate, unit: "", icon: Calendar, color: "from-slate-500 to-gray-500", glow: "shadow-[0_0_20px_rgba(148,163,184,0.3)]" },
    ];
    setKpiData(calculatedKpis);

    // For Historical Material dosed per day
    const historicalTimeline: Record<string, number> = {};
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.endDate);
      end.setHours(0, 0, 0, 0);
      for (let d = new Date(start.getTime()); d <= end; d.setDate(d.getDate() + 1)) {
        const formattedDate = d.toDateString();
        historicalTimeline[formattedDate] = 0;
      }
    }

    // Calculate materials dosed weight per day using Actual Value Float
    data.forEach((item) => {
      if (item["Batch Act Start"] !== "N/A") {
        const batchDate = new Date(item["Batch Act Start"] || '');
        // Only include batchDate if it is within the selected date range
        if (
          !isNaN(batchDate.getTime()) &&
          filters.startDate &&
          filters.endDate &&
          batchDate >= new Date(filters.startDate) &&
          batchDate <= new Date(filters.endDate)
        ) {
          const formattedDate = batchDate.toDateString();
          // Step 1: Sum of Actual Value Float for each material
          const actualValueFloat = Number(item["Actual Value Float"] || 0);
          // Step 2: Convert to tons (kg to tons)
          const materialWeightTons = actualValueFloat / 1000;
          // Step 3: Add to daily total for all materials
          historicalTimeline[formattedDate] = (historicalTimeline[formattedDate] || 0) + materialWeightTons;
        }
      }
    });

    const sortedHistoricalTimeline = Object.keys(historicalTimeline)
      .map(dateStr => new Date(dateStr))
      .filter(dateObj => dateObj >= new Date(filters.startDate))
      .sort((a, b) => a.getTime() - b.getTime())
      .map(dateObj => dateObj.toDateString());
    const filteredHistoricalTimeline: Record<string, number> = {};
    for (const dateStr of sortedHistoricalTimeline) {
      filteredHistoricalTimeline[dateStr] = historicalTimeline[dateStr];
    }

    // Products by Count (Pie Chart) - using already calculated productCounts from KPI section

    // Count unique batches per weekday - exact same logic
    const productionByDaySets: Record<string, Set<string>> = {
      Monday: new Set(),
      Tuesday: new Set(),
      Wednesday: new Set(),
      Thursday: new Set(),
      Friday: new Set(),
      Saturday: new Set(),
      Sunday: new Set(),
    };
    data.forEach((item) => {
      const batchDate = new Date(item["Batch Act Start"] || '');
      const dayOfWeek = batchDate.toLocaleDateString("en-US", { weekday: "long" });
      const batchGUID = item["Batch GUID"] || "unknown";
      if (productionByDaySets.hasOwnProperty(dayOfWeek)) {
        productionByDaySets[dayOfWeek].add(batchGUID);
      }
    });
    // Convert sets to counts for charting
    const productionByDay: Record<string, number> = {};
    Object.keys(productionByDaySets).forEach(day => {
      productionByDay[day] = productionByDaySets[day].size;
    });

    // Calculate Error Percentage by Material (exact same logic as KPI Dashboard)
    const materialErrorEntries: Array<{ material: string; errorPercent: number; setPoint: number; actual: number }> = [];
    
    data.forEach((item) => {
      const material = item["Material Name"];
      const setPoint = Number(item["SetPoint Float"] || 0);
      const actual = Number(item["Actual Value Float"] || 0);
      
      if (material && setPoint > 0) {
        // Calculate individual error percentage for this specific entry
        const individualErrorKg = Math.abs(actual - setPoint);
        const individualErrorPercent = setPoint > 0 ? (individualErrorKg / setPoint) * 100 : 0;
        
        // Add this entry to the list
        materialErrorEntries.push({
          material,
          errorPercent: individualErrorPercent,
          setPoint,
          actual
        });
      }
    });

    // Create error percentage data for pie chart - show individual material entries with >5% error
    const errorPercentageChartData = materialErrorEntries
      .filter(entry => entry.errorPercent > 5) // Only show entries with >5% error
      .map(entry => ({ 
        name: entry.material, // Use 'name' for ChartComponent compatibility
        value: entry.errorPercent.toFixed(2) // Round to 2 decimal places and use 'value' key
      }));

    // Set chart data with exact same logic as KPI Dashboard
    setBarChartData({ labels: Object.keys(filteredHistoricalTimeline), values: Object.values(filteredHistoricalTimeline) });
    setPieChartData({ labels: Object.keys(productCounts), values: Object.values(productCounts) });
    setBatchesByWeekdayData({ labels: Object.keys(productionByDay), values: Object.values(productionByDay) });
    setErrorPercentageData({
      labels: errorPercentageChartData.map(e => e.name),
      values: errorPercentageChartData.map(e => parseFloat(e.value)),
    });

  };

  // Data fetching function (reused from KPI Dashboard)
  const fetchGraphData = async () => {
    try {
      if (!initialLoadComplete) {
        return;
      }

      if (!filters.startDate || !filters.endDate) {
        return;
      }
      setDataLoading(true);
      setError(null);

      let apiUrl = API_ENDPOINTS.KPI;
      const params = new URLSearchParams();

      const apiStartDate = getApiDateWithOffset(filters.startDate);
      const apiEndDate = getApiDateWithOffset(filters.endDate);
      
      if (apiStartDate) params.append('startDate', apiStartDate.toISOString());
      if (apiEndDate) params.append('endDate', apiEndDate.toISOString());
      params.append('strictDateFilter', 'true');
      params.append('page', 'all');
      params.append('limit', 'none');

      if (filters.batch.length > 0) {
        filters.batch.forEach(batch => params.append('batch', batch));
      }

      if (filters.product.length > 0) {
        filters.product.forEach(product => params.append('product', product));
      }

      if (filters.material.length > 0) {
        filters.material.forEach(material => params.append('material', material));
      }

      apiUrl += '?' + params.toString();

      const response = await axios.get(apiUrl);
      let data = response.data;
      
      if (typeof data === "string") {
        try {
          data = JSON.parse(data.replace(/NaN/g, "null"));
        } catch (parseError) {
          setError(new Error("Failed to parse server response"));
          return;
        }
      }

      if (!Array.isArray(data)) {
        if (Array.isArray(data.result)) {
          data = data.result;
        } else if (Array.isArray(data.data)) {
          data = data.data;
        } else {
          setError(new Error("Invalid data format received from server"));
          return;
        }
      }

      if (!Array.isArray(data)) {
        setError(new Error("Data processing failed"));
        return;
      }

      // Update filter dropdowns with exact same logic as KPI Dashboard
      setBatchNames(Array.from(new Set(data.map((item) => item["Batch Name"] || "Unknown"))));
      setProductNames(Array.from(new Set(data.map((item) => item["Product Name"] || "Unknown"))));
      
      // Update unique material names for dropdowns - exact same logic as KPI Dashboard
      const uniqueMaterialNames = Array.from(
        new Set(data.map((item) => item["Material Name"]).filter((name): name is string => !!name))
      );
      setMaterialNames(uniqueMaterialNames);

      // If no data, create some sample data for testing
      if (data.length === 0) {
        const sampleData = [
          { "Batch GUID": "batch-001", "Batch Name": "FM LOT -2721FM LAYER PEAK MASH 7", "Product Name": "Product A", "Material Name": "Material 1", "Batch Act Start": "2025-10-12 08:00:00", "Actual Value Float": 15500, "SetPoint Float": 15000 },
          { "Batch GUID": "batch-002", "Batch Name": "FM LOT -2721FM LAYER PEAK MASH 6", "Product Name": "Product B", "Material Name": "Material 2", "Batch Act Start": "2025-10-13 09:00:00", "Actual Value Float": 18200, "SetPoint Float": 18000 },
          { "Batch GUID": "batch-003", "Batch Name": "FM LOT -2721FM LAYER PEAK MASH 5", "Product Name": "Product A", "Material Name": "Material 1", "Batch Act Start": "2025-10-14 10:00:00", "Actual Value Float": 12800, "SetPoint Float": 13000 },
          { "Batch GUID": "batch-004", "Batch Name": "FM LOT -2721FM LAYER PEAK MASH 4", "Product Name": "Product C", "Material Name": "Material 3", "Batch Act Start": "2025-10-15 11:00:00", "Actual Value Float": 20100, "SetPoint Float": 20000 },
          { "Batch GUID": "batch-005", "Batch Name": "FM LOT -2721FM LAYER PEAK MASH 3", "Product Name": "Product B", "Material Name": "Material 2", "Batch Act Start": "2025-10-16 12:00:00", "Actual Value Float": 16700, "SetPoint Float": 16500 },
        ];
        calculateKPIsAndCharts(sampleData);
      } else {
        calculateKPIsAndCharts(data);
      }
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Unknown error occurred'));
    } finally {
      setDataLoading(false);
    }
  };

  // Initialize data loading
  useEffect(() => {
    setInitialLoadComplete(true);
    // Trigger initial data fetch
    fetchGraphData();
  }, []);


  // Fetch data when filters change
  useEffect(() => {
    const debouncedFetch = debounce(fetchGraphData, 500);
    debouncedFetch();
  }, [
    filters.startDate,
    filters.endDate,
    filters.batch,
    filters.product,
    filters.material,
    initialLoadComplete
  ]);

  const handleApplyFilters = () => {
    setDataLoading(true);
    fetchGraphData();
  };

  return (
    <WaterSystemLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-600 dark:text-cyan-400 mb-2">KPI Carousel</h1>
          <p className="text-gray-600 dark:text-slate-400">Interactive chart carousel with production analytics</p>
        </div>

        {/* Filters Section */}
        <Card className="bg-white dark:bg-slate-900/95 border-blue-200 dark:border-cyan-500/30 shadow-lg dark:shadow-[0_0_20px_rgba(0,255,255,0.1)] mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Filter className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard Filters</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="endDate" className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white w-full"
                />
              </div>

              <div>
                <MultiSelect
                  label="Products"
                  options={productNames}
                  selected={filters.product}
                  onChange={(selected) => setFilters(prev => ({ ...prev, product: selected }))}
                  placeholder="Select products..."
                />
              </div>

              <div>
                <MultiSelect
                  label="Batches"
                  options={batchNames}
                  selected={filters.batch}
                  onChange={(selected) => setFilters(prev => ({ ...prev, batch: selected }))}
                  placeholder="Select batches..."
                />
              </div>

              <div>
                <MultiSelect
                  label="Materials"
                  options={materialNames}
                  selected={filters.material}
                  onChange={(selected) => setFilters(prev => ({ ...prev, material: selected }))}
                  placeholder="Select materials..."
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleApplyFilters}
                  disabled={dataLoading}
                  className="custom-apply-button flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-[#0088a9] dark:hover:bg-[#007b98] text-white font-medium py-2 px-4 rounded-[8px] shadow-md transition-all duration-200 w-full"
                  style={{ color: 'white' }}
                >
                  {dataLoading ? (
                    <>
                      <FaSyncAlt className="text-sm animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <FaSyncAlt className="text-sm" />
                      Apply Filters
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30 shadow-lg dark:shadow-[0_0_20px_rgba(239,68,68,0.1)] mb-8">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <span>⚠️</span>
                <span className="font-medium">Error:</span>
                <span>{error.message}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {kpiData.map((kpi) => {
            const IconComponent = kpi.icon;
            return (
              <Card key={kpi.title} className={`group relative bg-white dark:bg-slate-900/95 border-gray-200 dark:border-slate-700 ${kpi.glow} hover:scale-[1.02] transition-all duration-300 overflow-hidden shadow-lg hover:shadow-xl`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                <CardContent className="p-4 relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-gray-600 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{kpi.title}</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{kpi.value}</p>
                        {kpi.unit && <span className="text-gray-600 dark:text-slate-400 text-xs font-medium">{kpi.unit}</span>}
                      </div>
                    </div>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${kpi.color} shadow-lg group-hover:shadow-xl transition-shadow`}>
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Carousel Section */}
        <LoadingOverlay isLoading={dataLoading}>
          <Card className="bg-white dark:bg-slate-900/95 border-blue-200 dark:border-cyan-500/30 shadow-lg dark:shadow-[0_0_20px_rgba(0,255,255,0.1)]">
            <CardContent className="p-6">
              {/* Carousel Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-blue-600 dark:text-cyan-400">Chart Carousel</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                    <span>{selectedIndex + 1} / {chartConfigs.length}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={scrollPrev}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 dark:border-cyan-500/30 text-blue-600 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-cyan-500/10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={toggleAutoplay}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 dark:border-cyan-500/30 text-blue-600 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-cyan-500/10"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    onClick={scrollNext}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 dark:border-cyan-500/30 text-blue-600 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-cyan-500/10"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Carousel Container */}
              <div className="embla overflow-hidden" ref={emblaRef}>
                <div className="embla__container flex">
                  {chartConfigs.map((config, index) => (
                    <div key={config.id} className="embla__slide flex-[0_0_100%] min-w-0">
                      <Card className={`bg-white dark:bg-slate-900/95 border-gray-200 dark:border-slate-700 shadow-lg dark:shadow-[0_0_20px_rgba(0,255,255,0.1)] h-[600px]`}>
                        <CardContent className="p-6 h-full flex flex-col">
                          {/* Chart Title */}
                          <div className="mb-4">
                            <h3 className="text-xl font-semibold text-blue-600 dark:text-cyan-400">
                              {config.title}
                            </h3>
                          </div>

                          {/* Chart Container */}
                          <div className="flex-1">
                            <ChartComponent
                              type={config.type}
                              data={config.data}
                              title=""
                              colors={config.colors}
                              isMultiLine={config.isMultiLine}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination Dots */}
              <div className="flex justify-center gap-2 mt-6">
                {chartConfigs.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollTo(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === selectedIndex
                        ? 'bg-blue-600 dark:bg-cyan-400 scale-125'
                        : 'bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </LoadingOverlay>
      </div>
    </WaterSystemLayout>
  );
}
