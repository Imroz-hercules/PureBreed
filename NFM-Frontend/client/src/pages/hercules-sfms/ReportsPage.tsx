// import React, { useState, useEffect, useMemo } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { WaterSystemLayout } from "@/components/hercules-sfms/WaterSystemLayout";
// import { FileText, Download, Printer, Calendar, Loader2 } from "lucide-react";
// import { apiService } from "@/lib/api";

// // Helper function to get default dates (last month with 7 AM time)
// const getDefaultDates = () => {
//   const today = new Date();
//   const lastMonth = new Date();

//   // Set to last month
//   lastMonth.setMonth(today.getMonth() - 1);

//   // Set start date to first day of last month at 7 AM
//   const startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1, 7, 0, 0);

//   // Set end date to last day of last month at 7 AM
//   const endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 7, 0, 0);

//   // Format for datetime-local input (YYYY-MM-DDTHH:MM)
//   const formatForInput = (date: Date) => {
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     const hours = String(date.getHours()).padStart(2, '0');
//     const minutes = String(date.getMinutes()).padStart(2, '0');
//     return `${year}-${month}-${day}T${hours}:${minutes}`;
//   };

//   return {
//     startDate: formatForInput(startDate),
//     endDate: formatForInput(endDate)
//   };
// };

// export function ReportsPage() {
//   const defaultDates = getDefaultDates();
//   const [startDate, setStartDate] = useState(defaultDates.startDate);
//   const [endDate, setEndDate] = useState(defaultDates.endDate);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(10);

//   // Data and loading states
//   const [rawData, setRawData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // Fetch data from CSV format API
//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const filters = {
//         startDate: startDate,
//         endDate: endDate,
//         page: 1,
//         limit: 10000 // Get all data for client-side pagination
//       };

//       const response = await apiService.getCSVFormatReport(filters);
//       setRawData(response.data || []);
//     } catch (err: any) {
//       console.error('Error fetching report data:', err);
//       setError(err.message || 'Failed to fetch data');
//       setRawData([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch data on component mount and when dates change
//   useEffect(() => {
//     fetchData();
//   }, []);

//   // Handler for VIEW button
//   const applyFilters = () => {
//     setCurrentPage(1); // Reset to first page when applying filters
//     fetchData();
//   };

//   // Get paginated data
//   const paginatedData = useMemo(() => {
//     const startIndex = (currentPage - 1) * rowsPerPage;
//     const endIndex = startIndex + rowsPerPage;
//     return rawData.slice(startIndex, endIndex);
//   }, [rawData, currentPage, rowsPerPage]);

//   // Calculate total pages
//   const totalPages = Math.ceil(rawData.length / rowsPerPage);

//   // Table headers based on the CSV format API response structure
//   const tableHeaders = [
//     "Batch GUID",
//     "Batch Name", 
//     "Product Name",
//     "Batch Act Start",
//     "Batch Act End",
//     "Quantity",
//     "Material Name",
//     "Material Code",
//     "SetPoint Float",
//     "Actual Value Float",
//     "Source Server",
//     "ROOTGUID",
//     "OrderId",
//     "EventID",
//     "Batch Transfer Time",
//     "FormulaCategoryName"
//   ];

//   const renderTableRow = (item: any, index: number) => {
//     return (
//       <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-800/40">
//         <td className="px-4 py-2 text-brand font-mono text-sm">{item["Batch GUID"] || '-'}</td>
//         <td className="px-4 py-2 text-white text-sm">{item["Batch Name"] || '-'}</td>
//         <td className="px-4 py-2 text-white text-sm">{item["Product Name"] || '-'}</td>
//         <td className="px-4 py-2 text-blue-400 text-sm">{item["Batch Act Start"] || '-'}</td>
//         <td className="px-4 py-2 text-blue-400 text-sm">{item["Batch Act End"] || '-'}</td>
//         <td className="px-4 py-2 text-brand text-sm">{item["Quantity"] || '-'}</td>
//         <td className="px-4 py-2 text-green-400 text-sm">{item["Material Name"] || '-'}</td>
//         <td className="px-4 py-2 text-purple-400 font-mono text-sm">{item["Material Code"] || '-'}</td>
//         <td className="px-4 py-2 text-orange-400 text-sm">{typeof item["SetPoint Float"] === 'number' ? item["SetPoint Float"].toFixed(2) : (item["SetPoint Float"] || '-')}</td>
//         <td className="px-4 py-2 text-blue-400 text-sm">{typeof item["Actual Value Float"] === 'number' ? item["Actual Value Float"].toFixed(2) : (item["Actual Value Float"] || '-')}</td>
//         <td className="px-4 py-2 text-slate-300 text-sm">{item["Source Server"] || '-'}</td>
//         <td className="px-4 py-2 text-brand font-mono text-sm">{item["ROOTGUID"] || '-'}</td>
//         <td className="px-4 py-2 text-white text-sm">{item["OrderId"] || '-'}</td>
//         <td className="px-4 py-2 text-white text-sm">{item["EventID"] || '-'}</td>
//         <td className="px-4 py-2 text-blue-400 text-sm">{item["Batch Transfer Time"] || '-'}</td>
//         <td className="px-4 py-2 text-slate-300 text-sm">{item["FormulaCategoryName"] || '-'}</td>
//       </tr>
//     );
//   };

//   return (
//     <WaterSystemLayout>
//       <div className="space-y-6">
//         {/* Header */}
//         <div className="flex items-center gap-3">
//           <FileText className="text-brand text-2xl" />
//           <h1 className="text-2xl font-bold text-brand tracking-wide">
//             Reports
//           </h1>
//         </div>

//         {/* Filter Section */}
//         <Card className="bg-surface/95 border-border">
//           <CardHeader>
//             <CardTitle className="text-brand flex items-center gap-2">
//               <Calendar className="h-5 w-5" />
//               Report Filters
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
//               <div className="space-y-2">
//                 <Label className="text-[color:var(--text-muted)] font-medium">Start Date:</Label>
//                 <Input
//                   type="datetime-local"
//                   value={startDate}
//                   onChange={(e) => setStartDate(e.target.value)}
//                   className="bg-surface border-border text-white dark:text-white text-foreground"
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label className="text-[color:var(--text-muted)] font-medium">End Date:</Label>
//                 <Input
//                   type="datetime-local"
//                   value={endDate}
//                   onChange={(e) => setEndDate(e.target.value)}
//                   className="bg-surface border-border text-white dark:text-white text-foreground"
//                 />
//               </div>
//               <div className="space-y-2 md:col-span-2">
//                 {/* Empty space to maintain grid alignment */}
//               </div>
//               <div className="space-y-2 md:col-span-2">
// <Button 
//   className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600" 
//   onClick={applyFilters}
//   disabled={loading}
// >
//   {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
//   VIEW
// </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Action Buttons */}
//         <div className="flex justify-end gap-4">
//           <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
//             <Printer className="h-4 w-4 mr-2" />
//             PRINT
//           </Button>
//           <Button className="bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600">
//             <Download className="h-4 w-4 mr-2" />
//             EXPORT TO CSV
//           </Button>
//         </div>



//         {/* Data Table */}
//         <Card className="bg-surface/95 border-border">
//           <CardContent className="p-0">
//             {loading ? (
//               <div className="flex items-center justify-center py-8">
//                 <Loader2 className="h-8 w-8 animate-spin text-brand" />
//                 <span className="ml-2 text-slate-300">Loading report data...</span>
//               </div>
//             ) : error ? (
//               <div className="flex items-center justify-center py-8">
//                 <span className="text-red-400">Error: {error}</span>
//               </div>
//             ) : (
//               <div className="overflow-x-auto">
//                 <table className="min-w-full text-sm text-white dark:text-white text-foreground border-collapse">
//                   <thead className="bg-slate-800 dark:bg-slate-800 bg-slate-200 text-brand dark:text-brand text-foreground uppercase text-xs tracking-wider">
//                     <tr>
//                       {tableHeaders.map((header) => (
//                         <th key={header} className="border border-border px-4 py-3">{header}</th>
//                       ))}
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {paginatedData.length === 0 ? (
//                       <tr>
//                         <td colSpan={tableHeaders.length} className="px-4 py-8 text-center text-[color:var(--text-muted)]">
//                           No data found for the selected date range.
//                         </td>
//                       </tr>
//                     ) : (
//                       paginatedData.map((item: any, i: number) => renderTableRow(item, i))
//                     )}
//                   </tbody>
//                 </table>
//                 <div className="flex justify-between items-center p-4">
//                   <div className="flex items-center gap-2">
//                     <span className="text-sm text-gray-400">Rows per page:</span>
//                     <select
//                       value={rowsPerPage}
//                       onChange={(e) => {
//                         setRowsPerPage(Number(e.target.value));
//                         setCurrentPage(1); // reset to first page
//                       }}
//                       className="bg-slate-800 border border-border rounded px-2 py-1 text-white"
//                     >
//                       {[5, 10, 20, 50].map(size => (
//                         <option key={size} value={size}>{size}</option>
//                       ))}
//                     </select>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Button
//                       onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//                       disabled={currentPage === 1}
//                       className="text-xs px-3 py-1"
//                     >
//                       Prev
//                     </Button>
//                     <span className="text-sm text-gray-400">
//                       Page {currentPage} of {totalPages || 1} ({rawData.length} total items)
//                     </span>
//                     <Button
//                       onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
//                       disabled={currentPage === totalPages}
//                       className="text-xs px-3 py-1"
//                     >
//                       Next
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </div>
//     </WaterSystemLayout>
//   );
// }






import React, { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WaterSystemLayout } from "@/components/hercules-sfms/WaterSystemLayout";
import { FileText, Download, Printer, Calendar, Loader2, Database, AlertTriangle, ChevronLeft, ChevronRight, ChevronDown, Check, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import axios from "axios";
import { API_ENDPOINTS, API_BASE_URL } from '@/lib/api';
import { formatApiDateTime, dateToApiIso, getSaudiNow } from '@/lib/saudiTime';
import { csvBrandingLines } from '@/lib/reportBranding';

// MultiSelect Component
interface MultiSelectProps {
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  allSelectedText: string;
  onDeselectAll?: () => void;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder,
  allSelectedText,
  onDeselectAll
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
      // Deselect all — but keep dropdown open
      onChange([]);
      setIsOpen(true);
      // Call the callback to refresh options from backend
      if (onDeselectAll) {
        onDeselectAll();
      }
    } else {
      // Select all
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
    if (selectedValues.length === 0) return `${placeholder} (${options.length} available)`;
    if (selectedValues.length === options.length) return allSelectedText;
    return `${selectedValues.length} Selected (${options.length} available)`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`w-full min-h-[2.25rem] px-3 py-2 rounded-md bg-surface border border-border text-foreground cursor-pointer hover:border-brand focus-within:border-brand transition-all duration-200 text-sm ${
          options.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={() => options.length > 0 && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm truncate">{getDisplayText()}</span>
          <ChevronDown className={`h-4 w-4 text-[color:var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-md shadow-xl max-h-64 overflow-y-auto">
          {/* Select All Option */}
          <div
            className="px-3 py-2 hover:bg-surface-sunken/50 cursor-pointer border-b border-border dark:border-border text-brand font-medium"
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
              className={`px-3 py-2 hover:bg-surface-sunken/50 cursor-pointer flex items-center justify-between ${
                selectedValues.includes(option) ? 'bg-surface-sunken' : ''
              }`}
              onClick={() => handleOptionClick(option)}
            >
              <span className="text-sm text-foreground truncate">{option}</span>
              {selectedValues.includes(option) && (
                <Check className="h-4 w-4 text-brand" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Default dates: last 30 days (includes current month mill data)
const getDefaultDates = () => {
  const saudiNow = getSaudiNow();
  const endDate = new Date(saudiNow);
  endDate.setHours(23, 0, 0, 0);
  const startDate = new Date(saudiNow);
  startDate.setDate(startDate.getDate() - 30);
  startDate.setHours(7, 0, 0, 0);

  const formatForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return { startDate: formatForInput(startDate), endDate: formatForInput(endDate) };
};

const formatToSaudiTime = formatApiDateTime;

export function ReportsPage() {
  const defaultDates = getDefaultDates();

  // Helper function to ensure negative values are displayed as zero
  const formatValue = (value: number | undefined): string => {
    const safeValue = Math.max(0, value || 0); // Ensure value is not negative
    return safeValue.toFixed(2);
  };
  const [startDate, setStartDate] = useState(defaultDates.startDate);
  const [endDate, setEndDate] = useState(defaultDates.endDate);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter options
  const [productOptions, setProductOptions] = useState<string[]>([]);
  const [batchOptions, setBatchOptions] = useState<string[]>([]);
  const [materialOptions, setMaterialOptions] = useState<string[]>([]);

  // Selected filters
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

  // Total records for pagination
  const [totalRecords, setTotalRecords] = useState(0);

  // PLC Data states
  const [plcData, setPlcData] = useState<any[]>([]);
  const [db3Data, setDb3Data] = useState<any[]>([]);
  const [plcLoading, setPlcLoading] = useState(false);
  const [db3Loading, setDb3Loading] = useState(false);
  const [plcError, setPlcError] = useState<string | null>(null);
  const [db3Error, setDb3Error] = useState<string | null>(null);
  

  // PLC Pagination states
  const [plcCurrentPage, setPlcCurrentPage] = useState(1);
  const [db3CurrentPage, setDb3CurrentPage] = useState(1);
  const [plcTotalPages, setPlcTotalPages] = useState(1);
  const [db3TotalPages, setDb3TotalPages] = useState(1);
  const [plcTotalRecords, setPlcTotalRecords] = useState(0);
  const [db3TotalRecords, setDb3TotalRecords] = useState(0);
  const plcItemsPerPage = 10;

  // Tab state
  const [currentTab, setCurrentTab] = useState("reports");

  // Align default range with available BatchMaterials dates
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.BATCH_DATE_BOUNDS, { timeout: 30000 });
        if (cancelled) return;
        const maxRaw = res.data?.max_act_end;
        const minRaw = res.data?.min_act_end;
        if (!maxRaw) return;
        const maxD = new Date(maxRaw.includes("T") ? maxRaw : maxRaw.replace(" ", "T"));
        const minD = minRaw ? new Date(minRaw.includes("T") ? minRaw : minRaw.replace(" ", "T")) : null;
        if (isNaN(maxD.getTime())) return;
        const end = new Date(maxD);
        end.setHours(23, 0, 0, 0);
        const start = new Date(maxD);
        start.setDate(start.getDate() - 30);
        start.setHours(7, 0, 0, 0);
        if (minD && !isNaN(minD.getTime()) && start < minD) {
          start.setTime(minD.getTime());
          start.setHours(7, 0, 0, 0);
        }
        const pad = (n: number) => String(n).padStart(2, "0");
        const fmt = (d: Date) =>
          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setStartDate(fmt(start));
        setEndDate(fmt(end));
      } catch {
        /* keep last-30-days default */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const params = new URLSearchParams();
      params.append("startDate", dateToApiIso(startDate));
      params.append("endDate", dateToApiIso(endDate));
      params.append("limit", "10000");

      const response = await axios.get(`${API_ENDPOINTS.KPI}?${params}`);
      const data = response.data.data || [];

      const products = Array.from(new Set(data.map((item: any) => item["Product Name"]).filter((name: any): name is string => typeof name === 'string' && name.length > 0))) as string[];
      const batches = Array.from(new Set(data.map((item: any) => item["Batch Name"]).filter((name: any): name is string => typeof name === 'string' && name.length > 0))) as string[];
      const materials = Array.from(new Set(data.map((item: any) => item["Material Name"]).filter((name: any): name is string => typeof name === 'string' && name.length > 0))) as string[];

      setProductOptions(products);
      setBatchOptions(batches);
      setMaterialOptions(materials);
    } catch (error) {
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("startDate", dateToApiIso(startDate));
      params.append("endDate", dateToApiIso(endDate));
      params.append("page", currentPage.toString());
      params.append("limit", rowsPerPage.toString());

      if (selectedProducts.length > 0) {
        selectedProducts.forEach(product => params.append("product", product));
      }
      if (selectedBatches.length > 0) {
        selectedBatches.forEach(batch => params.append("batch", batch));
      }
      if (selectedMaterials.length > 0) {
        selectedMaterials.forEach(material => params.append("material", material));
      }

      const response = await axios.get(`${API_ENDPOINTS.KPI}/csv-format-report?${params}`);
      setRawData(response.data.data || []);
      setTotalRecords(response.data.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
      setRawData([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  // Load filter options on component mount and when date range changes
  useEffect(() => {
    fetchFilterOptions();
  }, [startDate, endDate]);

  // Fetch PLC data when dates or pagination changes
  useEffect(() => {
    fetchPLCData();
    fetchDB3Data();
  }, [startDate, endDate, plcCurrentPage, db3CurrentPage]);

  // Reset PLC pagination when date filters change
  useEffect(() => {
    setPlcCurrentPage(1);
    setDb3CurrentPage(1);
  }, [startDate, endDate]);

  // Fetch data when filters change
  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedProducts, selectedBatches, selectedMaterials, currentPage, rowsPerPage]);

  // --- Fetch PLC Data from PostgreSQL ---
  const fetchPLCData = async () => {
    try {
      setPlcLoading(true);
      setPlcError(null);

      const params = new URLSearchParams();
      params.append('limit', plcItemsPerPage.toString());
      params.append('page', plcCurrentPage.toString());

      if (startDate) {
        params.append('start_date', startDate.split('T')[0]);
      }
      if (endDate) {
        params.append('end_date', endDate.split('T')[0]);
      }

      const url = `${API_BASE_URL}/api/simple-data?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setPlcData(result.data || []);
        setPlcTotalRecords(result.total_records || 0);
        setPlcTotalPages(Math.ceil((result.total_records || 0) / plcItemsPerPage));
      } else {
        throw new Error(result.error || 'Failed to fetch database data');
      }

    } catch (err: any) {
      setPlcError(err.message || 'Failed to fetch database data');
    } finally {
      setPlcLoading(false);
    }
  };

  // --- Fetch DB3 Data from PostgreSQL ---
  const fetchDB3Data = async () => {
    try {
      setDb3Loading(true);
      setDb3Error(null);

      const params = new URLSearchParams();
      params.append('limit', plcItemsPerPage.toString());
      params.append('page', db3CurrentPage.toString());

      if (startDate) {
        params.append('start_date', startDate.split('T')[0]);
      }
      if (endDate) {
        params.append('end_date', endDate.split('T')[0]);
      }

      const url = `${API_BASE_URL}/api/db3/simple-data?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setDb3Data(result.data || []);
        setDb3TotalRecords(result.total_records || 0);
        setDb3TotalPages(Math.ceil((result.total_records || 0) / plcItemsPerPage));
      } else {
        throw new Error(result.error || 'Failed to fetch DB3 data');
      }

    } catch (err: any) {
      setDb3Error(err.message || 'Failed to fetch DB3 data');
    } finally {
      setDb3Loading(false);
    }
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchData();
  };

  // CSV Export functionality - fetch all data
  const exportToCSV = async () => {
    try {
      // Show loading state
      const button = document.querySelector('[data-export-button]') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.innerHTML = '<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> EXPORTING...';
      }

      // Fetch all data for export (not just current page)
      const params = new URLSearchParams();
      params.append("startDate", dateToApiIso(startDate));
      params.append("endDate", dateToApiIso(endDate));
      params.append("page", "1");
      params.append("limit", "100000");

      if (selectedProducts.length > 0) {
        selectedProducts.forEach(product => params.append("product", product));
      }
      if (selectedBatches.length > 0) {
        selectedBatches.forEach(batch => params.append("batch", batch));
      }
      if (selectedMaterials.length > 0) {
        selectedMaterials.forEach(material => params.append("material", material));
      }

      const response = await axios.get(`${API_ENDPOINTS.KPI}/csv-format-report?${params}`);
      const allData = response.data.data || [];

      if (allData.length === 0) {
        return;
      }

        // Create CSV headers
        const headers = tableHeaders.join(',');
        
        // Create CSV rows
        const csvRows = allData.map((item: any) => 
          tableHeaders.map(header => {
            const value = item[header];
            // Handle values that might contain commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
          }).join(',')
        );
        
        // Combine headers and rows
        const generatedOn = new Date().toLocaleString("en-US");
        const dateRange = `${dateToApiIso(startDate)} to ${dateToApiIso(endDate)}`;
        const csvContent = [
          ...csvBrandingLines("Raw Data", generatedOn, dateRange),
          headers,
          ...csvRows,
        ].join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        // Generate filename with current date range and record count
        const startDateStr = new Date(startDate).toISOString().split('T')[0];
        const endDateStr = new Date(endDate).toISOString().split('T')[0];
        const filename = `reports_${startDateStr}_to_${endDateStr}_${allData.length}_records.csv`;
        
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
    } finally {
      // Reset button state
      const button = document.querySelector('[data-export-button]') as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.innerHTML = '<svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> EXPORT TO CSV';
      }
    }
  };

  // --- PLC Pagination Handlers ---
  const handlePLCPageChange = (page: number) => {
    setPlcCurrentPage(page);
  };

  const handleDB3PageChange = (page: number) => {
    setDb3CurrentPage(page);
  };

  // --- PLC Pagination Component ---
  const PLCPagination = ({
    currentPage,
    totalPages,
    onPageChange,
    totalRecords
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalRecords: number;
  }) => {
    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;

      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        }
      }

      return pages;
    };

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-400">
          Showing {((currentPage - 1) * plcItemsPerPage) + 1} to {Math.min(currentPage * plcItemsPerPage, totalRecords)} of {totalRecords} records
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1 font-medium bg-white border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-800 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-100 disabled:hover:text-gray-500 dark:border-cyan-500 dark:text-brand dark:hover:bg-cyan-900/20 dark:hover:border-brand dark:disabled:border-gray-600 dark:disabled:text-gray-500 dark:disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          {getPageNumbers().map((page, index) => (
            <div key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className={`min-w-[40px] font-medium ${currentPage === page
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-blue-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
                      : "bg-white border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-800 dark:border-cyan-500 dark:text-brand dark:hover:bg-cyan-900/20 dark:hover:border-brand"
                    }`}
                >
                  {page}
                </Button>
              )}
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 font-medium bg-white border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-800 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-100 disabled:hover:text-gray-500 dark:border-cyan-500 dark:text-brand dark:hover:bg-cyan-900/20 dark:hover:border-brand dark:disabled:border-gray-600 dark:disabled:text-gray-500 dark:disabled:hover:bg-transparent"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  const totalPages = Math.ceil(totalRecords / rowsPerPage);

  const tableHeaders = [
    "Batch Name", "Product Name", "Batch Act Start", "Batch Act End",
    "Quantity", "Material Name", "Material Code", "SetPoint Float", "Actual Value Float",
    "OrderId", "EventID", "Batch Transfer Time"
  ];

  const renderTableRow = (item: any, index: number) => (
    <tr
      key={index}
      className={`
      border-b border-border/50
      ${index % 2 === 0 ? "bg-surface-sunken" : "bg-surface"}
      hover:bg-surface-sunken/60
      text-sm text-foreground dark:text-foreground
      py-2
    `}
    >
      {tableHeaders.map((header, i) => {
        let cellValue = item[header] || "-";
        
        // Apply special formatting for date/time columns
        if (header === "Batch Act Start" || header === "Batch Act End") {
          cellValue = formatToSaudiTime(item[header], true);
        } else if (header === "Batch Transfer Time") {
          cellValue = formatToSaudiTime(item[header], true);
        } else if (typeof item[header] === "number") {
          cellValue = item[header].toFixed(2);
        }
        
        return (
          <td
            key={i}
            className={`px-3 py-2 break-words text-sm
            ${i > 8 ? "hidden xl:table-cell" : ""} 
            ${i > 5 && i <= 8 ? "hidden lg:table-cell" : ""}`}
          >
            {cellValue}
          </td>
        );
      })}
    </tr>
  );


  return (
    <WaterSystemLayout>
      <div className="max-w-full px-4 md:px-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <FileText className="text-brand dark:text-brand light:text-midnight-blue text-2xl" />
          <h1 className="text-2xl font-bold text-brand dark:text-brand light:text-midnight-blue tracking-wide cursor-pointer hover:text-cyan-200 dark:hover:text-cyan-200 light:hover:text-blue-800 transition-colors"
            onClick={() => setCurrentTab("reports")}>
            Reports
          </h1>
        </div>

        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <TabsList className="flex gap-3 justify-center p-2 bg-transparent">
            <TabsTrigger
              value="reports"
              className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-transparent transition-all duration-200 bg-brand !text-white data-[state=active]:bg-brand-hover data-[state=active]:!text-white data-[state=active]:shadow-lg data-[state=active]:border-brand-hover data-[state=active]:scale-105 hover:bg-brand-hover hover:!text-white"
            >
              <FileText className="w-5 h-5" />
              Reports
            </TabsTrigger>
            {/* Data tab commented out - no longer needed
            <TabsTrigger
              value="plc"
              className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-transparent transition-all duration-200 bg-brand !text-white data-[state=active]:bg-brand-hover data-[state=active]:!text-white data-[state=active]:shadow-lg data-[state=active]:border-brand-hover data-[state=active]:scale-105 hover:bg-brand-hover hover:!text-white"
            >
              <Database className="w-5 h-5" />
               Data
            </TabsTrigger>
            */}
          </TabsList>

          {/* Reports Tab Content */}
          <TabsContent value="reports" className="space-y-6">
            {/* Filters */}
            <Card className="bg-surface/95 border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand">
                  <Calendar className="h-5 w-5" /> Report Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
                  <div className="space-y-2">
                    <Label className="text-[color:var(--text-muted)] font-medium">Start Date:</Label>
                    <Input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="w-full bg-surface border border-border text-foreground h-9 rounded-md px-2 cursor-pointer hover:border-brand focus:ring-2 focus:ring-brand transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[color:var(--text-muted)] font-medium">End Date:</Label>
                    <Input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="w-full bg-surface border border-border text-foreground h-9 rounded-md px-2 cursor-pointer hover:border-brand focus:ring-2 focus:ring-brand transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[color:var(--text-muted)] font-medium">Select Product:</Label>
                    <MultiSelect
                      options={productOptions}
                      selectedValues={selectedProducts}
                      onChange={setSelectedProducts}
                      placeholder="Select Product"
                      allSelectedText="All Products"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[color:var(--text-muted)] font-medium">Select Batch:</Label>
                    <MultiSelect
                      options={batchOptions}
                      selectedValues={selectedBatches}
                      onChange={setSelectedBatches}
                      placeholder="Select Batch"
                      allSelectedText="All Batches"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[color:var(--text-muted)] font-medium">Select Material:</Label>
                    <MultiSelect
                      options={materialOptions}
                      selectedValues={selectedMaterials}
                      onChange={setSelectedMaterials}
                      placeholder="Select Material"
                      allSelectedText="All Materials"
                    />
                  </div>
                  <div className="space-y-2">
                    <Button
                      className="flex items-center gap-2 !bg-brand hover:!bg-brand-hover !text-white font-medium py-2 px-5 rounded-lg shadow-md transition-all duration-200 border border-transparent"
                      onClick={applyFilters}
                      disabled={loading}
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      VIEW
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-end gap-4">
              <Button 
                onClick={exportToCSV}
                disabled={loading}
                data-export-button
                className="!bg-brand hover:!bg-brand-hover !text-white font-medium py-2 px-4 rounded-[8px] shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 mr-2" /> EXPORT TO CSV
              </Button>
            </div>

            {/* Data Table */}
            <Card className="bg-surface/95 border border-border">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-brand" />
                    <span className="ml-2 text-[color:var(--text-muted)]">Loading report data...</span>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="text-red-500">Error: {error}</span>
                  </div>
                ) : (
                  <div className="max-w-full">
                    <table className="min-w-full table-fixed text-sm">
                      <thead className="bg-surface-sunken text-foreground dark:text-brand uppercase tracking-wider text-sm">
                        <tr>
                          {tableHeaders.map((header, i) => (
                            <th
                              key={header}
                              className={`border px-3 py-3 break-words text-sm font-semibold
                            ${i > 8 ? "hidden xl:table-cell" : ""} 
                            ${i > 5 && i <= 8 ? "hidden lg:table-cell" : ""}`}
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rawData.length === 0 ? (
                          <tr>
                            <td colSpan={tableHeaders.length} className="px-4 py-8 text-center text-[color:var(--text-faint)]">
                              No data found for the selected date range.
                            </td>
                          </tr>
                        ) : (
                          rawData.map(renderTableRow)
                        )}
                      </tbody>
                    </table>


                    {/* Pagination */}
                    <div className="flex flex-wrap justify-between items-center p-4 text-xs text-foreground dark:text-foreground">
                      <div className="flex items-center gap-2">
                        <span>Rows per page:</span>
                        <select
                          value={rowsPerPage}
                          onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="bg-surface border border-border rounded px-2 py-1 text-foreground"
                        >
                          {[5, 10, 20, 50].map(size => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                          disabled={currentPage === 1}
                          className="text-xs px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-foreground"
                        >
                          Prev
                        </Button>
                        <span>
                          Page {currentPage} of {totalPages || 1} ({totalRecords} total items)
                        </span>
                        <Button
                          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="text-xs px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-foreground"
                        >
                          Next
                        </Button>
                      </div>
                    </div>

                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data tab (PLC / Pellet / Mill Data) commented out - no longer needed
          <TabsContent value="plc" className="space-y-6">
            ... Data tab content ...
          </TabsContent>
          */}
        </Tabs>
      </div>
    </WaterSystemLayout>
  );
}
