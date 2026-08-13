import React, { useState, useEffect, useRef } from "react";
import { WaterSystemLayout } from '../../components/hercules-sfms/WaterSystemLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import ChartComponent from "@/components/hercules-sfms/ChartComponent";
import { FaSyncAlt } from "react-icons/fa";
import { API_ENDPOINTS } from '@/lib/api';
import { dateToApiIso, getSaudiNow } from '@/lib/saudiTime';
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
  const saudiNow = getSaudiNow();

  const startDate = new Date(saudiNow);
  startDate.setDate(saudiNow.getDate() - 7);
  startDate.setHours(7, 0, 0, 0);

  const endDate = new Date(saudiNow);
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
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex items-center justify-center rounded-lg z-10">
          <div className="flex items-center space-x-2 text-brand">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand"></div>
            <span className="text-[12px] font-medium">Updating…</span>
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
    return `${selectedValues.length} selected`;
  };

  const sortedOptions = [...options].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  return (
    <div className="relative z-20" ref={dropdownRef}>
      <button
        type="button"
        className="w-full min-h-[2.25rem] px-3 py-2 rounded-md bg-surface border border-border text-foreground text-left cursor-pointer hover:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] truncate">{getDisplayText()}</span>
          <ChevronDown className={`h-4 w-4 text-[color:var(--text-muted)] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-[80] w-full mt-1 bg-surface border border-border rounded-md shadow-[var(--shadow-lg)] max-h-56 overflow-y-auto">
          <div
            className="px-3 py-2 hover:bg-surface-sunken cursor-pointer border-b border-border text-brand text-[12px] font-semibold sticky top-0 bg-surface"
            onClick={handleSelectAll}
          >
            <div className="flex items-center justify-between">
              <span>
                {selectedValues.length === options.length ? 'Deselect all' : 'Select all'}
              </span>
              {selectedValues.length === options.length ? (
                <X className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </div>
          </div>

          {sortedOptions.map((option) => (
            <div
              key={option}
              className={`px-3 py-1.5 hover:bg-surface-sunken cursor-pointer text-[12px] flex items-center justify-between ${
                selectedValues.includes(option) ? 'bg-brand-subtle text-brand' : 'text-foreground'
              }`}
              onClick={() => handleOptionClick(option)}
            >
              <span className="truncate flex-1" title={option}>{option}</span>
              {selectedValues.includes(option) && (
                <Check className="h-3.5 w-3.5 text-brand ml-2 flex-shrink-0" />
              )}
            </div>
          ))}

          {options.length === 0 && (
            <div className="px-3 py-2 text-[color:var(--text-muted)] text-[12px]">
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


    // Top errors only — a 185-slice pie is unreadable; keep top 12 + Other
    const errorSorted = materialErrorEntries
      .filter(entry => entry.errorPercent > 5)
      .sort((a, b) => b.errorPercent - a.errorPercent);
    const topErrors = errorSorted.slice(0, 12);
    const otherErrors = errorSorted.slice(12);
    const errorPercentageChartData = [
      ...topErrors.map(entry => ({
        name: entry.material,
        value: entry.errorPercent.toFixed(2),
      })),
      ...(otherErrors.length
        ? [{
            name: `Other (${otherErrors.length})`,
            value: (
              otherErrors.reduce((s, e) => s + e.errorPercent, 0) / otherErrors.length
            ).toFixed(2),
          }]
        : []),
    ];

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
      if (filters.startDate) params.append('startDate', dateToApiIso(filters.startDate));
      if (filters.endDate) params.append('endDate', dateToApiIso(filters.endDate));
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

  if (loading && !initialLoadComplete) {
    return (
      <WaterSystemLayout>
        <div className="min-h-[50vh] flex items-center justify-center text-brand text-sm font-medium">
          Loading dashboard…
        </div>
      </WaterSystemLayout>
    );
  }
  if (error) {
    return (
      <WaterSystemLayout>
        <div className="min-h-[50vh] flex items-center justify-center text-danger text-sm font-medium">
          Error: {error.message}
        </div>
      </WaterSystemLayout>
    );
  }

  return (
    <WaterSystemLayout>
      <div className="space-y-5">
        {/* Filter toolbar */}
        <section className="bg-surface border border-border rounded-lg overflow-visible relative z-30">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-surface-sunken/60">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-brand" />
              <h2 className="section-header !mb-0 text-[color:var(--text-muted)] dark:text-brand">Production filters</h2>
            </div>
            <Button
              onClick={handleApplyFilters}
              className="h-8 px-3 text-[12px] font-semibold bg-brand hover:bg-brand-hover text-primary-foreground rounded-md"
            >
              <FaSyncAlt className="text-[11px] mr-1.5" />
              Apply
            </Button>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">Start</Label>
              <Input
                type="datetime-local"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                onClick={(e) => e.currentTarget.showPicker?.()}
                className="w-full bg-surface border-border text-foreground h-9 rounded-md px-2 text-[13px] cursor-pointer hover:border-brand focus-visible:ring-brand"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">End</Label>
              <Input
                type="datetime-local"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                onClick={(e) => e.currentTarget.showPicker?.()}
                className="w-full bg-surface border-border text-foreground h-9 rounded-md px-2 text-[13px] cursor-pointer hover:border-brand focus-visible:ring-brand"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">Product</Label>
              <MultiSelect
                options={productNames}
                selectedValues={filters.product}
                onChange={(values) => setFilters({ ...filters, product: values })}
                placeholder="All products"
                allSelectedText="All products"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">Batch</Label>
              <MultiSelect
                options={batchNames}
                selectedValues={filters.batch}
                onChange={(values) => setFilters({ ...filters, batch: values })}
                placeholder="All batches"
                allSelectedText="All batches"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">Material</Label>
              <MultiSelect
                options={materialNames}
                selectedValues={filters.material}
                onChange={(values) => setFilters({ ...filters, material: values })}
                placeholder="All materials"
                allSelectedText="All materials"
              />
            </div>
          </div>
        </section>

        {/* KPI strip */}
        <LoadingOverlay isLoading={dataLoading}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {kpiData.map((kpi) => {
              const IconComponent = kpi.icon;
              return (
                <Card
                  key={kpi.title}
                  className="bg-surface border border-brand/35 rounded-lg overflow-hidden
                    shadow-[0_0_22px_rgba(34,211,238,0.18)]
                    hover:shadow-[0_0_28px_rgba(34,211,238,0.28)]
                    hover:border-brand/50 transition-shadow duration-300"
                >
                  <CardContent className="p-0">
                    <div className="flex min-h-[88px]">
                      <div className="w-1.5 shrink-0 bg-brand shadow-[0_0_12px_rgba(34,211,238,0.7)]" />
                      <div className="flex-1 p-3.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand/80 mb-1 truncate">
                            {kpi.title}
                          </p>
                          <div className="flex items-baseline gap-1.5">
                            <p className="text-[22px] font-bold tabular-nums text-foreground leading-none truncate drop-shadow-[0_0_8px_rgba(34,211,238,0.25)]">
                              {kpi.value}
                            </p>
                            {kpi.unit && (
                              <span className="text-[11px] font-medium text-[color:var(--text-muted)] shrink-0">
                                {kpi.unit}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-9 w-9 rounded-md bg-brand/15 border border-brand/40 flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(34,211,238,0.35)]">
                          <IconComponent className="h-4 w-4 text-brand drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </LoadingOverlay>

        {/* Charts */}
        <LoadingOverlay isLoading={dataLoading}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-surface border border-brand/25 rounded-lg shadow-[0_0_28px_rgba(34,211,238,0.12)] overflow-hidden">
              <CardContent className="pt-3 pb-3 px-3">
                <ChartComponent type="bar" data={barChartData} title="Material weight per day (tons)" colors={['#22d3ee']} />
              </CardContent>
            </Card>
            <Card className="bg-surface border border-brand/25 rounded-lg shadow-[0_0_28px_rgba(34,211,238,0.12)] overflow-hidden">
              <CardContent className="pt-3 pb-3 px-3">
                <ChartComponent
                  type="pie"
                  data={pieChartData}
                  title="Products by count"
                  colors={['#22d3ee', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#60a5fa']}
                />
              </CardContent>
            </Card>
            <Card className="bg-surface border border-brand/25 rounded-lg shadow-[0_0_28px_rgba(34,211,238,0.12)] overflow-hidden">
              <CardContent className="pt-3 pb-3 px-3">
                <ChartComponent
                  type="bar"
                  data={batchesByWeekdayData}
                  title="Batches by weekday"
                  colors={['#22d3ee', '#fbbf24', '#f87171', '#34d399', '#a78bfa', '#60a5fa', '#fb923c']}
                />
              </CardContent>
            </Card>
            <Card className="bg-surface border border-danger/30 rounded-lg shadow-[0_0_28px_rgba(248,113,113,0.14)] overflow-hidden">
              <CardContent className="pt-3 pb-3 px-3">
                <div className="h-[320px]">
                  <ChartComponent
                    type="pie"
                    data={errorPercentageData}
                    title="Material error analysis"
                    colors={['#f87171', '#fb7185', '#f43f5e', '#ef4444', '#dc2626', '#e11d48', '#be123c']}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </LoadingOverlay>
      </div>
    </WaterSystemLayout>
  );
}