import { useState, useEffect } from "react";
import { WaterSystemLayout } from "@/components/hercules-sfms/WaterSystemLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

// --- PLC Data Types ---
interface PLCData {
  timestamp: string;
  pellet1_ton_hr: number;
  pellet2_ton_hr: number;
  pellet3_ton_hr: number;
  pellet1_kw_ton: number;
  pellet2_kw_ton: number;
  pellet3_kw_ton: number;
  pellet1_temp: number;
  pellet2_temp: number;
  pellet3_temp: number;
}

// --- DB3 Data Types ---
interface DB3Data {
  timestamp: string;
  hammermill_amp: number;
  rollermill_amp: number;
}



export default function PLCReportsPage() {
  // Get current theme
  const { theme } = useTheme();

  // Helper function to ensure negative values are displayed as zero
  const formatValue = (value: number | undefined): string => {
    const safeValue = Math.max(0, value || 0); // Ensure value is not negative
    return safeValue.toFixed(2);
  };

  // Set default dates: start date = 1 week ago, end date = today (for proper date range)
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);
  
  const todayStr = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  const [startDate, setStartDate] = useState(oneWeekAgoStr); // Start from 1 week ago
  const [endDate, setEndDate] = useState(todayStr); // End at today

  const [plcData, setPlcData] = useState<PLCData[]>([]);
  const [db3Data, setDb3Data] = useState<DB3Data[]>([]);
  const [loading, setLoading] = useState(false);
  const [db3Loading, setDb3Loading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [db3Error, setDb3Error] = useState<string | null>(null);
  
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [db3CurrentPage, setDb3CurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [db3TotalPages, setDb3TotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [db3TotalRecords, setDb3TotalRecords] = useState(0);
  const itemsPerPage = 10; // Number of records per page

  // --- API Base URL ---
  const API_BASE = API_BASE_URL; // Backend running on port 5002

  // --- Fetch PLC Data from PostgreSQL ---
  const fetchPLCData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('limit', itemsPerPage.toString());
      params.append('page', currentPage.toString());
      
      if (startDate) {
        params.append('start_date', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
      }
      
      const url = `${API_BASE}/api/simple-data?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setPlcData(result.data || []);
        setTotalRecords(result.total_records || 0);
        setTotalPages(Math.ceil((result.total_records || 0) / itemsPerPage));
             } else {
         throw new Error(result.error || 'Failed to fetch database data');
       }
      
         } catch (err: any) {
      setError(err.message || 'Failed to fetch database data');
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch DB3 Data from PostgreSQL ---
  const fetchDB3Data = async () => {
    try {
      setDb3Loading(true);
      setDb3Error(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('limit', itemsPerPage.toString());
      params.append('page', db3CurrentPage.toString());
      
      if (startDate) {
        params.append('start_date', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
      }
      
      const url = `${API_BASE}/api/db3/simple-data?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setDb3Data(result.data || []);
        setDb3TotalRecords(result.total_records || 0);
        setDb3TotalPages(Math.ceil((result.total_records || 0) / itemsPerPage));
      } else {
        throw new Error(result.error || 'Failed to fetch DB3 data');
      }
      
    } catch (err: any) {
      setDb3Error(err.message || 'Failed to fetch DB3 data');
    } finally {
      setDb3Loading(false);
    }
  };




  // --- Initial Data Load and Date Filter Changes ---
  useEffect(() => {
    // Fetch data when component mounts
    fetchPLCData();
    fetchDB3Data();
  }, [startDate, endDate, currentPage, db3CurrentPage]);

  // --- Pagination Handlers ---
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDB3PageChange = (page: number) => {
    setDb3CurrentPage(page);
  };

  // Reset pagination when date filters change
  useEffect(() => {
    setCurrentPage(1);
    setDb3CurrentPage(1);
  }, [startDate, endDate]);

  // --- Pagination Component ---
  const Pagination = ({ 
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
      <div className={`flex items-center justify-between px-4 py-3 ${
        theme === 'light' 
          ? 'bg-white border-t border-gray-200 shadow-sm' 
          : 'bg-gray-800 border-t border-gray-700'
      }`}>
        <div className={`text-sm font-medium ${
          theme === 'light' ? 'text-gray-700' : 'text-gray-400'
        }`}>
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords} records
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex items-center gap-1 font-medium ${
              theme === 'light'
                ? 'bg-white border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-800 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-100 disabled:hover:text-gray-500'
                : 'border-brand text-brand hover:bg-cyan-900/20 hover:border-brand disabled:border-gray-600 disabled:text-gray-500 disabled:hover:bg-transparent'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          {getPageNumbers().map((page, index) => (
            <div key={index}>
              {page === '...' ? (
                <span className={`px-3 py-2 font-medium ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                }`}>...</span>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className={`min-w-[40px] font-medium ${
                    currentPage === page 
                      ? theme === 'light'
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-blue-600"
                        : "bg-brand hover:bg-brand-hover shadow-sm"
                      : theme === 'light'
                        ? "bg-white border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-800"
                        : "border-brand text-brand hover:bg-cyan-900/20 hover:border-brand"
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
            className={`flex items-center gap-1 font-medium ${
              theme === 'light'
                ? 'bg-white border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-800 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-100 disabled:hover:text-gray-500'
                : 'border-brand text-brand hover:bg-cyan-900/20 hover:border-brand disabled:border-gray-600 disabled:text-gray-500 disabled:hover:bg-transparent'
            }`}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <WaterSystemLayout>
      <div className={`flex-1 p-2 space-y-6 ${
        theme === 'light' ? 'bg-gray-50 text-gray-900' : 'bg-gray-900 text-white'
      }`}>
          <div className="flex items-center justify-between">
            <h1 className={`text-4xl font-bold ${
              theme === 'light' ? 'text-blue-600' : 'text-brand'
            }`}>PLC Reports </h1>
            
          </div>


        {/* --- Error Alerts --- */}
        {error && (
          <Alert className={
            theme === 'light' 
              ? 'border-red-300 bg-red-50' 
              : 'border-red-500 bg-red-900/20'
          }>
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className={
              theme === 'light' ? 'text-red-700' : 'text-red-300'
            }>
              {error}
            </AlertDescription>
          </Alert>
        )}


        {/* --- Loading State --- */}
         {loading && (
           <div className="flex items-center justify-center py-8">
             <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
               theme === 'light' ? 'border-blue-600' : 'border-brand'
             }`}></div>
             <span className={`ml-2 ${
               theme === 'light' ? 'text-blue-600' : 'text-brand'
             }`}>Loading database data...</span>
           </div>
         )}

        {/* --- Tabs --- */}
        <Tabs defaultValue="db4" className="space-y-4">
          <TabsList className={`flex gap-2 justify-start p-1 ${
            theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'
          }`}>
            <TabsTrigger value="db4" className={`flex items-center gap-2 ${
              theme === 'light'
                ? 'data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm'
                : 'data-[state=active]:bg-gray-700 data-[state=active]:text-brand data-[state=active]:shadow-sm'
            }`}>
              <Database className="w-4 h-4" />
              DB4 - Pellet Data
            </TabsTrigger>
            <TabsTrigger value="db3" className={`flex items-center gap-2 ${
              theme === 'light'
                ? 'data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm'
                : 'data-[state=active]:bg-gray-700 data-[state=active]:text-brand data-[state=active]:shadow-sm'
            }`}>
              <Database className="w-4 h-4" />
              DB3 - Mill Data
            </TabsTrigger>
          </TabsList>

          {/* --- DB4 Table (Pellet Data) --- */}
          <TabsContent value="db4">
            <Card className={
              theme === 'light' 
                ? 'bg-white border border-gray-200 shadow-sm' 
                : 'bg-gray-900 border border-brand shadow-lg'
            }>
              <CardHeader className={
                theme === 'light' 
                  ? 'bg-gray-50 border-b border-gray-200' 
                  : 'bg-gray-800 border-b border-gray-700'
              }>
                <CardTitle className={`flex items-center gap-2 ${
                  theme === 'light' ? 'text-blue-600' : 'text-brand'
                }`}>
                  <Database className="w-5 h-5" />
                  DB4 - Pellet 
                  {totalPages > 1 && (
                    <span className={`text-sm ml-2 ${
                      theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      (Page {currentPage} of {totalPages})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <Table className={`w-full ${
                  theme === 'light' ? '' : 'border border-cyan-700'
                }`}>
                  <TableHeader>
                    <TableRow className={
                      theme === 'light' 
                        ? 'bg-blue-50 text-blue-900 text-sm font-bold border-b-2 border-blue-200' 
                        : 'bg-slate-800 text-brand text-sm tracking-wider'
                    }>
                      <TableHead className={`px-2 py-3 text-center font-semibold border-b border-blue-200 ${
                        theme === 'light' ? 'text-blue-900' : 'text-brand dark:border-b dark:border-gray-700'
                      }`}>Timestamp</TableHead>
                      <TableHead className={`px-2 py-3 text-center font-semibold border-b border-blue-200 ${
                        theme === 'light' ? 'text-blue-900' : 'text-brand dark:border-b dark:border-gray-700'
                      }`}>Pellet1_TonHr</TableHead>
                      <TableHead className={`px-2 py-3 text-center font-semibold border-b border-blue-200 ${
                        theme === 'light' ? 'text-blue-900' : 'text-brand dark:border-b dark:border-gray-700'
                      }`}>Pellet2_TonHr</TableHead>
                      <TableHead className={`px-2 py-3 text-center font-semibold border-b border-blue-200 ${
                        theme === 'light' ? 'text-blue-900' : 'text-brand dark:border-b dark:border-gray-700'
                      }`}>Pellet3_TonHr</TableHead>
                      <TableHead className={`px-2 py-3 text-center font-semibold border-b border-blue-200 ${
                        theme === 'light' ? 'text-blue-900' : 'text-brand dark:border-b dark:border-gray-700'
                      }`}>Pellet1_KwTon</TableHead>
                      <TableHead className={`px-2 py-3 text-center font-semibold border-b border-blue-200 ${
                        theme === 'light' ? 'text-blue-900' : 'text-brand dark:border-b dark:border-gray-700'
                      }`}>Pellet2_KwTon</TableHead>
                      <TableHead className={`px-2 py-3 text-center font-semibold border-b border-blue-200 ${
                        theme === 'light' ? 'text-blue-900' : 'text-brand dark:border-b dark:border-gray-700'
                      }`}>Pellet3_KwTon</TableHead>
                      <TableHead className={`px-2 py-3 text-center font-semibold border-b border-blue-200 ${
                        theme === 'light' ? 'text-blue-900' : 'text-brand dark:border-b dark:border-gray-700'
                      }`}>Pellet1_Temp</TableHead>
                      <TableHead className={`px-2 py-3 text-center font-semibold border-b border-blue-200 ${
                        theme === 'light' ? 'text-blue-900' : 'text-brand dark:border-b dark:border-gray-700'
                      }`}>Pellet2_Temp</TableHead>
                      <TableHead className={`px-2 py-3 text-center font-semibold border-b border-blue-200 ${
                        theme === 'light' ? 'text-blue-900' : 'text-brand dark:border-b dark:border-gray-700'
                      }`}>Pellet3_Temp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plcData.length > 0 ? (
                      plcData.map((row, i) => (
                        <TableRow
                          key={i}
                          className={
                            theme === 'light'
                              ? 'hover:bg-gray-50 border-b border-gray-100 transition-colors'
                              : 'hover:bg-gray-800 border-b border-gray-700 transition'
                          }
                        >
                          <TableCell className={`px-2 py-3 text-center ${
                            theme === 'light' ? 'text-gray-900' : 'text-white'
                          }`}>
                            {format(new Date(row.timestamp), "yyyy-MM-dd HH:mm:ss")}
                          </TableCell>
                          <TableCell className={`px-2 py-3 text-center ${
                            theme === 'light' ? 'text-gray-900' : 'text-white'
                          }`}>{formatValue(row.pellet1_ton_hr)}</TableCell>
                          <TableCell className={`px-2 py-3 text-center ${
                            theme === 'light' ? 'text-gray-900' : 'text-white'
                          }`}>{formatValue(row.pellet2_ton_hr)}</TableCell>
                          <TableCell className={`px-2 py-3 text-center ${
                            theme === 'light' ? 'text-gray-900' : 'text-white'
                          }`}>{formatValue(row.pellet3_ton_hr)}</TableCell>
                          <TableCell className={`px-2 py-3 text-center ${
                            theme === 'light' ? 'text-gray-900' : 'text-white'
                          }`}>{formatValue(row.pellet1_kw_ton)}</TableCell>
                          <TableCell className={`px-2 py-3 text-center ${
                            theme === 'light' ? 'text-gray-900' : 'text-white'
                          }`}>{formatValue(row.pellet2_kw_ton)}</TableCell>
                          <TableCell className={`px-2 py-3 text-center ${
                            theme === 'light' ? 'text-gray-900' : 'text-white'
                          }`}>{formatValue(row.pellet3_kw_ton)}</TableCell>
                          <TableCell className={`px-2 py-3 text-center ${
                            theme === 'light' ? 'text-gray-900' : 'text-white'
                          }`}>{formatValue(row.pellet1_temp)}</TableCell>
                          <TableCell className={`px-2 py-3 text-center ${
                            theme === 'light' ? 'text-gray-900' : 'text-white'
                          }`}>{formatValue(row.pellet2_temp)}</TableCell>
                          <TableCell className={`px-2 py-3 text-center ${
                            theme === 'light' ? 'text-gray-900' : 'text-white'
                          }`}>{formatValue(row.pellet3_temp)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} className={`text-center py-8 ${
                          theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          {loading ? 'Loading data...' : 'No PLC data available'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalRecords={totalRecords}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- DB3 Table (Mill Data) --- */}
          <TabsContent value="db3">
            <Card className={
              theme === 'light' 
                ? 'bg-white border border-gray-200 shadow-sm' 
                : 'bg-gray-900 border border-brand shadow-lg'
            }>
              <CardHeader className={
                theme === 'light' 
                  ? 'bg-gray-50 border-b border-gray-200' 
                  : 'bg-gray-800 border-b border-gray-700'
              }>
                <CardTitle className={`flex items-center gap-2 ${
                  theme === 'light' ? 'text-blue-600' : 'text-brand'
                }`}>
                  <Database className="w-5 h-5" />
                  DB3 - Mill Amps
                  {db3TotalPages > 1 && (
                    <span className={`text-sm ml-2 ${
                      theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      (Page {db3CurrentPage} of {db3TotalPages})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <Table className={`w-full ${
                  theme === 'light' ? '' : 'border border-cyan-700'
                }`}>
                  <TableHeader>
                    <TableRow className={
                      theme === 'light' 
                        ? 'bg-blue-50 text-blue-900 text-sm font-bold border-b-2 border-blue-200' 
                        : 'bg-slate-800 text-brand text-sm tracking-wider'
                    }>
                      <TableHead className={`px-2 py-3 text-center font-semibold border-b border-blue-200 ${
                        theme === 'light' ? 'text-blue-900' : 'text-brand dark:border-b dark:border-gray-700'
                      }`}>Timestamp</TableHead>
                      <TableHead className={`px-2 py-3 text-center font-semibold border-b border-blue-200 ${
                        theme === 'light' ? 'text-blue-900' : 'text-brand dark:border-b dark:border-gray-700'
                      }`}>HammerMill_Amp</TableHead>
                      <TableHead className={`px-2 py-3 text-center font-semibold border-b border-blue-200 ${
                        theme === 'light' ? 'text-blue-900' : 'text-brand dark:border-b dark:border-gray-700'
                      }`}>RollerMill_Amp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {db3Data.length > 0 ? (
                      db3Data.map((row, i) => (
                        <TableRow
                          key={i}
                          className={
                            theme === 'light'
                              ? 'hover:bg-gray-50 border-b border-gray-100 transition-colors'
                              : 'hover:bg-gray-800 border-b border-gray-700 transition'
                          }
                        >
                          <TableCell className={`px-2 py-3 text-center ${
                            theme === 'light' ? 'text-gray-900' : 'text-white'
                          }`}>
                            {format(new Date(row.timestamp), "yyyy-MM-dd HH:mm:ss")}
                          </TableCell>
                          <TableCell className={`px-2 py-3 text-center ${
                            theme === 'light' ? 'text-gray-900' : 'text-white'
                          }`}>{row.hammermill_amp?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell className={`px-2 py-3 text-center ${
                            theme === 'light' ? 'text-gray-900' : 'text-white'
                          }`}>{row.rollermill_amp?.toFixed(2) || '0.00'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className={`text-center py-8 ${
                          theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          {db3Loading ? 'Loading DB3 data...' : 'No DB3 data available'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {db3TotalPages > 1 && (
                  <Pagination
                    currentPage={db3CurrentPage}
                    totalPages={db3TotalPages}
                    onPageChange={handleDB3PageChange}
                    totalRecords={db3TotalRecords}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </WaterSystemLayout>
  );
}
