import { WaterSystemLayout } from '../../components/hercules-sfms/WaterSystemLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useLiveData } from '../../hooks/useLiveData';
import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/lib/api';

const DatabasesPage = () => {
  const { data, status, startStream, stopStream, getSingleReading } = useLiveData();
  
  // DB3 state
  const [db3Data, setDb3Data] = useState<any>(null);
  const [db3Status, setDb3Status] = useState({
    connected: false,
    lastUpdated: null as string | null,
    error: null as string | null
  });

  // Helper function to ensure negative values are displayed as zero
  const formatValue = (value: number): string => {
    const safeValue = Math.max(0, value); // Ensure value is not negative
    return safeValue.toFixed(2);
  };

  // Transform live data to match the expected format
  const liveDB4Data = data ? [
    { label: "Pellet1_TonHr", value: formatValue(data.pellet1_ton_hr) },
    { label: "Pellet2_TonHr", value: formatValue(data.pellet2_ton_hr) },
    { label: "Pellet3_TonHr", value: formatValue(data.pellet3_ton_hr) },
    { label: "Pellet1_KwTon", value: formatValue(data.pellet1_kw_ton) },
    { label: "Pellet2_KwTon", value: formatValue(data.pellet2_kw_ton) },
    { label: "Pellet3_KwTon", value: formatValue(data.pellet3_kw_ton) },
    { label: "Pellet1_Temp", value: formatValue(data.pellet1_temp) },
    { label: "Pellet2_Temp", value: formatValue(data.pellet2_temp) },
    { label: "Pellet3_Temp", value: formatValue(data.pellet3_temp) },
  ] : [];

  // Transform DB3 data to match the expected format
  const liveDB3Data = db3Data ? [
    { label: "HammerMill_Amp", value: formatValue(db3Data.hammermill_amp || 0) },
    { label: "RollerMill_Amp", value: formatValue(db3Data.rollermill_amp || 0) },
  ] : [];

  // Fetch DB3 data
  const fetchDB3Data = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.DB3_LIVE);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setDb3Data(result);
      setDb3Status({
        connected: true,
        lastUpdated: new Date().toISOString(),
        error: null
      });
    } catch (err: any) {
      setDb3Status({
        connected: false,
        lastUpdated: null,
        error: err.message
      });
    }
  };

  // Fetch DB3 data on component mount and when streaming starts
  useEffect(() => {
    fetchDB3Data(); // Initial fetch
    
    if (status.streaming) {
      const interval = setInterval(fetchDB3Data, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [status.streaming]);

  return (
    <>
     <WaterSystemLayout>
    <div className="flex-1 p-2 space-y-2 bg-transparent light:bg-white text-white light:text-gray-900">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-cyan-400 light:text-blue-600">Live PLC Report</h1>
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            status.connected 
              ? 'bg-green-500/20 light:bg-green-100 text-green-400 light:text-green-700 border border-green-500/30 light:border-green-300' 
              : 'bg-red-500/20 light:bg-red-100 text-red-400 light:text-red-700 border border-red-500/30 light:border-red-300'
          }`}>
            {status.connected ? '🟢 Connected' : '🔴 API Disconnected'}
          </div>
          
        </div>
      </div>
      
      {/* Error Display */}
      {status.error && (
        <div className="bg-red-500/20 light:bg-red-100 border border-red-500/30 light:border-red-300 rounded-lg p-4 text-red-400 light:text-red-700">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className="font-medium">Connection Error:</span>
            <span>{status.error}</span>
          </div>
        </div>
      )}
      
      <Tabs defaultValue="db4" className="space-y-4">
        <TabsList>
          <TabsTrigger value="db4">Pallet Data</TabsTrigger>
          <TabsTrigger value="db3">DB3</TabsTrigger>
        </TabsList>
<TabsContent value="db4">
        <Card className="bg-white dark:bg-gradient-to-r dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-cyan-500 shadow-lg dark:shadow-[0_0_12px_rgba(34,211,238,0.6)]">
    <CardHeader>
      <CardTitle className="text-blue-600 dark:text-cyan-400"> Pellet Data</CardTitle>
      {status.lastUpdated && (
        <p className="text-sm text-blue-500 dark:text-cyan-300 mt-2">
          Last Updated: {new Date(status.lastUpdated).toLocaleString()}
        </p>
      )}
    </CardHeader>
    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {liveDB4Data.length > 0 ? (
        liveDB4Data.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-cyan-500/30 
                       shadow-md dark:shadow-[0_0_8px_rgba(34,211,238,0.4)] hover:shadow-lg dark:hover:shadow-[0_0_15px_rgba(34,211,238,0.7)]
                       transition-shadow duration-300"
          >
            {/* Left side: label */}
            <p className="text-sm font-medium text-blue-600 dark:text-cyan-300">{item.label}</p>

            {/* Right side: value */}
            <p className="text-lg font-semibold text-green-600 dark:text-green-400 animate-pulse">
              {item.value}
              <span className="ml-2 text-xs text-blue-500 dark:text-cyan-400">● LIVE</span>
            </p>
          </div>
        ))
      ) : (
        <div className="col-span-full flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-cyan-400 mx-auto mb-4"></div>
            <p className="text-blue-600 dark:text-cyan-300">Loading live data...</p>
            {status.error && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-2">{status.error}</p>
            )}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>

<TabsContent value="db3">
  <Card className="bg-white dark:bg-gradient-to-r dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-cyan-500 shadow-lg dark:shadow-[0_0_12px_rgba(34,211,238,0.6)]">
    <CardHeader>
      <CardTitle className="text-blue-600 dark:text-cyan-400">Mill Amps Data</CardTitle>
      {db3Status.lastUpdated && (
        <p className="text-sm text-blue-500 dark:text-cyan-300 mt-2">
          Last Updated: {new Date(db3Status.lastUpdated).toLocaleString()}
        </p>
      )}
    </CardHeader>
    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {liveDB3Data.length > 0 ? (
        liveDB3Data.map((item: any, index: number) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-cyan-500/30 
                       shadow-md dark:shadow-[0_0_8px_rgba(34,211,238,0.4)] hover:shadow-lg dark:hover:shadow-[0_0_15px_rgba(34,211,238,0.7)]
                       transition-shadow duration-300"
          >
            {/* Left side: label */}
            <p className="text-sm font-medium text-blue-600 dark:text-cyan-300">{item.label}</p>

            {/* Right side: value */}
            <p className="text-lg font-semibold text-green-600 dark:text-green-400 animate-pulse">
              {item.value}
              <span className="ml-2 text-xs text-blue-500 dark:text-cyan-400">● LIVE</span>
            </p>
          </div>
        ))
      ) : (
        <div className="col-span-full flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-cyan-400 mx-auto mb-4"></div>
            <p className="text-blue-600 dark:text-cyan-300">Loading Mill Amps Data data...</p>
            {db3Status.error && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-2">{db3Status.error}</p>
            )}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>

      </Tabs>
    </div>
    </WaterSystemLayout>
    </>
  );
};

export default DatabasesPage;
