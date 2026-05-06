import React, { useState, useEffect, useRef } from "react";
import { WaterSystemLayout } from '../../components/hercules-sfms/WaterSystemLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChartComponent from "@/components/hercules-sfms/ChartComponent";
import { FaSyncAlt } from "react-icons/fa";
import { API_ENDPOINTS } from '@/lib/api';
import {
  Activity,
  Package,
  Shapes,
  TrendingUp,
  Calendar,
  Filter,
  ChevronDown,
  LucideIcon,
  Check,
  X
} from "lucide-react";
import axios from "axios";

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

interface APIDataItem {
  "Batch GUID"?: string;
  "Product Name"?: string;
  "Material Name"?: string;
  "Batch Name"?: string;
  "Batch Act Start"?: string;
  "Actual Value Float"?: number;
  [key: string]: any;
}

// Debounce function
const debounce = (func: (...args: any[]) => void, wait: number) => {
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

// Helper to format date for datetime-local input
function toDatetimeLocalString(date: Date): string {
  if (!date) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

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
    startDate: toDatetimeLocalString(startDate),
    endDate: toDatetimeLocalString(endDate)
  };
};

// Performance optimization: Changed from 1 month to 1 day for faster loading



// Loading Overlay Component
const LoadingOverlay: React.FC<{ isLoading: boolean; children: React.ReactNode }> = ({ isLoading, children }) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
          <div className="flex items-center space-x-2 text-cyan-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
            <span className="text-sm font-medium">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom MultiSelect Component
interface MultiSelectProps {
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  allSelectedText: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder,
  allSelectedText
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  const handleOptionClick = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(item => item !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === options.length) return allSelectedText;
    return `${selectedValues.length} Selected`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="w-full min-h-[2.25rem] px-3 py-2 rounded-md bg-slate-800 border border-slate-600 text-white cursor-pointer hover:border-slate-500 focus-within:border-cyan-500 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm truncate">{getDisplayText()}</span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-xl max-h-64 overflow-y-auto">
          {/* Select All Option */}
          <div
            className="px-3 py-2 hover:bg-slate-700 cursor-pointer border-b border-slate-600 text-cyan-400 font-medium"
            onClick={handleSelectAll}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {selectedValues.length === options.length ? "Deselect All" : "Select All"}
              </span>
              {selectedValues.length === options.length ? (
                <X className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </div>
          </div>

          {/* Individual Options */}
          {options.map((option) => (
            <div
              key={option}
              className={`px-3 py-2 hover:bg-slate-700 cursor-pointer text-sm flex items-center justify-between ${selectedValues.includes(option) ? 'bg-slate-700 text-cyan-300' : 'text-white'
                }`}
              onClick={() => handleOptionClick(option)}
            >
              <span className="truncate flex-1">{option}</span>
              {selectedValues.includes(option) && (
                <Check className="h-4 w-4 text-cyan-400 ml-2 flex-shrink-0" />
              )}
            </div>
          ))}

          {options.length === 0 && (
            <div className="px-3 py-2 text-slate-400 text-sm">
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
};


export function KPIDashboard() {
  // Use the same default dates as defined earlier (1 day ago for faster loading)
  const defaultDates = getDefaultDates();

  const [filters, setFilters] = useState<Filters>({
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate,
    product: [],
    batch: [],
    material: [],
  });

  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [barChartData, setBarChartData] = useState({ labels: [] as string[], values: [] as number[] });
  const [lineChartData, setLineChartData] = useState({ labels: [] as string[], values: [] as number[] });
  const [pieChartData, setPieChartData] = useState({ labels: [] as string[], values: [] as number[] });
  const [batchesByWeekdayData, setBatchesByWeekdayData] = useState({ labels: [] as string[], values: [] as number[] });
  const [efficiencyComplexityData, setEfficiencyComplexityData] = useState({ labels: [] as string[], values: [] as number[] });
  const [errorPercentageData, setErrorPercentageData] = useState({ labels: [] as string[], values: [] as number[] });

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(true);

  const [productNames, setProductNames] = useState<string[]>([]);
  const [batchNames, setBatchNames] = useState<string[]>([]);
  const [materialNames, setMaterialNames] = useState<string[]>([]);

  const getApiDateWithOffset = (displayDate: string): Date | null => {
    if (!displayDate) return null;
    const apiDate = new Date(displayDate);
    // Subtract 4 hours from the display date for API calls (same as old NFM)
    apiDate.setHours(apiDate.getHours() - 4);
    return apiDate;
  };

  // Helper function to check if value is finite number
  function isFiniteNumber(val: any): boolean {
    return typeof val === 'number' && isFinite(val) || (!isNaN(val) && val !== null && val !== '' && isFinite(Number(val)));
  }

  function calculateKPIsAndCharts(data: APIDataItem[]) {
    if (!Array.isArray(data)) return;

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

    // Convert batch sets to counts
    const batchTimelineCounts: Record<string, number> = {};
    Object.keys(batchTimeline).forEach(date => {
      batchTimelineCounts[date] = batchTimeline[date].size;
    });

    // After filling batchTimeline, ensure all dates in the selected range are present with 0 if missing
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.endDate);
      end.setHours(0, 0, 0, 0);
      for (let d = new Date(start.getTime()); d <= end; d.setDate(d.getDate() + 1)) {
        const formattedDate = d.toDateString();
        if (!(formattedDate in batchTimelineCounts)) {
          batchTimelineCounts[formattedDate] = 0;
        }
      }
    }

    // Sort batchTimeline by date and filter out any date before selected range
    const sortedBatchTimeline = Object.keys(batchTimelineCounts)
      .map(dateStr => new Date(dateStr))
      .filter(dateObj => dateObj >= new Date(filters.startDate))
      .sort((a, b) => a.getTime() - b.getTime())
      .map(dateObj => dateObj.toDateString());
    const filteredBatchTimeline: Record<string, number> = {};
    for (const dateStr of sortedBatchTimeline) {
      filteredBatchTimeline[dateStr] = batchTimelineCounts[dateStr];
    }

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

    // Count unique batches per weekday
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

    // Efficiency & Complexity: Unique material count per product
    const efficiencyComplexity = Object.entries(productMaterialMap).map(
      ([product, materialsSet]) => ({ product, uniqueMaterials: materialsSet.size })
    );

    // Calculate Error Percentage by Material (show individual entries, not aggregated)
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

    // Set chart data with proper sorting and filtering
    setBarChartData({ labels: Object.keys(filteredHistoricalTimeline), values: Object.values(filteredHistoricalTimeline) });
    setLineChartData({ labels: Object.keys(filteredBatchTimeline), values: Object.values(filteredBatchTimeline) });
    setPieChartData({ labels: Object.keys(productCounts), values: Object.values(productCounts) });
    setBatchesByWeekdayData({ labels: Object.keys(productionByDay), values: Object.values(productionByDay) });
    setEfficiencyComplexityData({
      labels: efficiencyComplexity.map(e => e.product),
      values: efficiencyComplexity.map(e => e.uniqueMaterials),
    });
    setErrorPercentageData({
      labels: errorPercentageChartData.map(e => e.name),
      values: errorPercentageChartData.map(e => parseFloat(e.value)),
    });
  }

  const fetchGraphData = async () => {
    try {
      // Skip data fetching if initial load isn't complete
      if (!initialLoadComplete) {
        return;
      }

      // Make sure we have dates to query with
      if (!filters.startDate || !filters.endDate) {
        return;
      }

      setDataLoading(true);
      setError(null);

      // Prepare API URL with query parameters
      let apiUrl = API_ENDPOINTS.KPI;
      const params = new URLSearchParams();

      // Apply 4-hour offset to start date for API call (same as old NFM)
      const apiStartDate = getApiDateWithOffset(filters.startDate);
      const apiEndDate = getApiDateWithOffset(filters.endDate);
      
      
      if (apiStartDate) params.append('startDate', apiStartDate.toISOString());
      if (apiEndDate) params.append('endDate', apiEndDate.toISOString());
      params.append('strictDateFilter', 'true');
      params.append('page', 'all');
      params.append('limit', 'none');

      // Handle multi-select filters
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
      

      // Parse if string
      if (typeof data === "string") {
        try {
          data = JSON.parse(data.replace(/NaN/g, "null"));
        } catch (parseError) {
          setError(new Error("Failed to parse server response"));
          return;
        }
      }

      // If data is an object with nested array
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

      // Final check
      if (!Array.isArray(data)) {
        setError(new Error("Data processing failed"));
        return;
      }

      // Set unique values for dropdowns
      setBatchNames(
        Array.from(new Set(data.map((item) => item["Batch Name"] || "Unknown")))
      );
      setProductNames(
        Array.from(new Set(data.map((item) => item["Product Name"] || "Unknown")))
      );
      setMaterialNames(
        Array.from(new Set(data.map((item) => item["Material Name"] || "Unknown")))
      );

      calculateKPIsAndCharts(data);
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Unknown error occurred'));
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    // Create debounced version of fetchGraphData
    const debouncedFetch = debounce(fetchGraphData, 500);

    // Call the debounced function
    debouncedFetch();

    // Cleanup
    return () => {
      // Note: Our simple debounce doesn't have cancel, but this is where it would go
    };
  }, [
    filters.startDate,
    filters.endDate,
    filters.batch,
    filters.product,
    filters.material,
    initialLoadComplete
  ]);

  const handleApplyFilters = () => {
    // Clear existing data first
    setKpiData([]);
    setBarChartData({ labels: [], values: [] });
    setLineChartData({ labels: [], values: [] });
    setPieChartData({ labels: [], values: [] });
    setBatchesByWeekdayData({ labels: [], values: [] });
    setEfficiencyComplexityData({ labels: [], values: [] });
    setErrorPercentageData({ labels: [], values: [] });
    
    // Set the initialLoadComplete flag to true when Apply is clicked
    setInitialLoadComplete(true);
    fetchGraphData();
  };

  if (loading && !initialLoadComplete) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-cyan-400 text-xl">Loading...</div>;
  if (error) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-red-400 text-xl">Error: {error.message}</div>;

  return (
    <WaterSystemLayout>
      <div className="space-y-6">
        {/* <h1 className="text-3xl font-bold text-cyan-300 tracking-wide">
          Dashboard
        </h1> */}

        <Tabs defaultValue="kpi" className="space-y-6">
          <TabsList className="inline-flex bg-transparent border-none p-0 gap-3 mx-auto justify-center w-full">
            <TabsTrigger 
              value="kpi" 
              className="custom-tab-button data-[state=active]:bg-[#007b98] data-[state=active]:text-white px-6 py-3 rounded-xl transition-all duration-200 bg-[#0088a9] text-white border border-[#0088a9] hover:bg-[#007b98] hover:text-white hover:scale-105"
              style={{ color: 'white' }}
            >
              KPI Dashboard
            </TabsTrigger>
            {/* PLC Live Data tab commented out - no longer needed
            <TabsTrigger 
              value="plc" 
              className="custom-tab-button data-[state=active]:bg-[#007b98] data-[state=active]:text-white px-6 py-3 rounded-xl transition-all duration-200 bg-[#0088a9] text-white border border-[#0088a9] hover:bg-[#007b98] hover:text-white hover:scale-105"
              style={{ color: 'white' }}
            >
              PLC Live Data
            </TabsTrigger>
            */}
          </TabsList>

          <TabsContent value="kpi" className="space-y-6">
            <Card className="bg-white/95 dark:bg-slate-900/95 border-slate-300 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-700 dark:text-cyan-300 flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Dashboard Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                  <div className="space-y-2">
                    <Label className="text-slate-600 dark:text-slate-300 text-sm">Start Date</Label>
                    <Input
                      type="datetime-local"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white h-9 rounded-md px-2 cursor-pointer hover:border-cyan-400 focus:ring-2 focus:ring-cyan-400 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-600 dark:text-slate-300 text-sm">End Date</Label>
                    <Input
                      type="datetime-local"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white h-9 rounded-md px-2 cursor-pointer hover:border-cyan-400 focus:ring-2 focus:ring-cyan-400 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-600 dark:text-slate-300 text-sm">Product</Label>
                    <MultiSelect
                      options={productNames}
                      selectedValues={filters.product}
                      onChange={(values) => setFilters({ ...filters, product: values })}
                      placeholder="All Products"
                      allSelectedText="All Products Selected"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600 dark:text-slate-300 text-sm">Batch</Label>
                    <MultiSelect
                      options={batchNames}
                      selectedValues={filters.batch}
                      onChange={(values) => setFilters({ ...filters, batch: values })}
                      placeholder="All Batches"
                      allSelectedText="All Batches Selected"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600 dark:text-slate-300 text-sm">Material</Label>
                    <MultiSelect
                      options={materialNames}
                      selectedValues={filters.material}
                      onChange={(values) => setFilters({ ...filters, material: values })}
                      placeholder="All Materials"
                      allSelectedText="All Materials Selected"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleApplyFilters}
                      className="custom-apply-button flex items-center gap-2 bg-[#0088a9] hover:bg-[#007b98] text-white font-medium py-2 px-4 rounded-[8px] shadow-md transition-all duration-200"
                      style={{ color: 'white' }}
                    >
                      <FaSyncAlt className="text-sm" />
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <LoadingOverlay isLoading={dataLoading}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {kpiData.map((kpi) => {
                  const IconComponent = kpi.icon;
                  return (
                    <Card key={kpi.title} className={`group relative bg-white/95 dark:bg-slate-900/95 border-slate-300 dark:border-slate-700 ${kpi.glow} hover:scale-[1.02] transition-all duration-300 overflow-hidden`}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                      <CardContent className="p-4 relative">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <p className="text-slate-600 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{kpi.title}</p>
                            <div className="flex items-baseline gap-1">
                              <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{kpi.value}</p>
                              {kpi.unit && <span className="text-slate-600 dark:text-slate-400 text-xs font-medium">{kpi.unit}</span>}
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
            </LoadingOverlay>

            <LoadingOverlay isLoading={dataLoading}>
              <div className="space-y-4">
                {/* First Row - 2 Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-slate-900/95 dark:bg-slate-900/95 light:bg-white/95 border-cyan-500/30 dark:border-cyan-500/30 light:border-slate-300 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
                    <CardContent className="pt-4 pb-4">
                      <ChartComponent type="bar" data={barChartData} title="Material Weight per Day (tons)" colors={['#00bfff']} />
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900/95 dark:bg-slate-900/95 light:bg-white/95 border-emerald-500/30 dark:border-emerald-500/30 light:border-slate-300 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                    <CardContent className="pt-4 pb-4">
                      <ChartComponent type="pie" data={pieChartData} title="Products by Count" colors={['#10b981', '#3b82f6', '#ec4899']} />
                    </CardContent>
                  </Card>
                </div>
                
                {/* No. Batches by Weekday + Material Error Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="bg-slate-900/95 dark:bg-slate-900/95 light:bg-white/95 border-emerald-500/30 dark:border-emerald-500/30 light:border-slate-300 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                    <CardContent className="pt-4 pb-4">
                      <ChartComponent type="bar" data={batchesByWeekdayData} title="No. Batches by Weekday" colors={['#3b82f6', '#f97316', '#ef4444', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6']} />
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900/95 dark:bg-slate-900/95 light:bg-white/95 border-red-500/30 dark:border-red-500/30 light:border-slate-300 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                    <CardContent className="pt-4 pb-4">
                      <div className="h-80">
                        <ChartComponent 
                          type="pie" 
                          data={errorPercentageData} 
                          title="Material Error Analysis" 
                          colors={errorPercentageData.values.map(() => '#ef4444')} // All products shown have >5% error, so use red
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </LoadingOverlay>
          </TabsContent>

          {/* PLC Live Data tab content commented out - no longer needed
          <TabsContent value="plc" className="space-y-4">
            ... (Pellet Data / Mill Amps Data content)
          </TabsContent>
          */}
        </Tabs>
      </div>
    </WaterSystemLayout>
  );
}