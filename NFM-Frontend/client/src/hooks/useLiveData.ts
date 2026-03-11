import { useEffect, useState, useCallback } from 'react';

interface DB4Data {
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

interface LiveDataStatus {
  connected: boolean;
  streaming: boolean;
  error: string | null;
  lastUpdated: string | null;
}

import { API_ENDPOINTS } from '../lib/api';

export const useLiveData = (apiUrl: string = API_ENDPOINTS.DB4_LIVE, pollingInterval: number = 5000) => {
  const [data, setData] = useState<DB4Data | null>(null);
  const [status, setStatus] = useState<LiveDataStatus>({
    connected: false,
    streaming: false,
    error: null,
    lastUpdated: null
  });
  const [isPolling, setIsPolling] = useState(false);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const newData: DB4Data = await response.json();
      
      setData(newData);
      setStatus(prev => ({
        ...prev,
        connected: true,
        error: null,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        connected: false,
        error: error instanceof Error ? error.message : 'Failed to fetch data'
      }));
    }
  }, [apiUrl]);

  // Start polling
  const startStream = useCallback(() => {
    if (isPolling) {
      return;
    }
    
    setIsPolling(true);
    setStatus(prev => ({ ...prev, streaming: true }));
    
    // Fetch immediately
    fetchData();
    
    // Set up polling interval
    const interval = setInterval(() => {
      fetchData();
    }, pollingInterval);
    
    // Store interval ID for cleanup
    (window as any).__liveDataInterval = interval;
  }, [fetchData, pollingInterval, isPolling]);

  // Stop polling
  const stopStream = useCallback(() => {
    setIsPolling(false);
    setStatus(prev => ({ ...prev, streaming: false }));
    
    if ((window as any).__liveDataInterval) {
      clearInterval((window as any).__liveDataInterval);
      (window as any).__liveDataInterval = null;
    }
  }, []);

  // Get single reading
  const getSingleReading = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Auto-start streaming when component mounts
  useEffect(() => {
    // Start polling immediately
    startStream();
    
    // Cleanup on unmount
    return () => {
      stopStream();
    };
  }, []); // Empty dependency array to run only once

  return {
    data,
    status,
    startStream,
    stopStream,
    getSingleReading
  };
};
