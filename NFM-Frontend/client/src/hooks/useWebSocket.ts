import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

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

interface WebSocketStatus {
  connected: boolean;
  streaming: boolean;
  error: string | null;
}

import { API_BASE_URL } from '../lib/api';

export const useWebSocket = (serverUrl: string = API_BASE_URL) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [data, setData] = useState<DB4Data | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>({
    connected: false,
    streaming: false,
    error: null
  });

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socket?.connected) return;

    const newSocket = io(serverUrl);

    newSocket.on('connect', () => {
      setStatus(prev => ({ ...prev, connected: true, error: null }));
    });

    newSocket.on('disconnect', () => {
      setStatus(prev => ({ ...prev, connected: false }));
    });

    newSocket.on('db4_live_data', (newData: DB4Data) => {
      setData(newData);
    });

    newSocket.on('db4_error', (errorData: { error: string; timestamp: string }) => {
      setStatus(prev => ({ ...prev, error: errorData.error }));
    });

    newSocket.on('stream_status', (statusData: any) => {
      if (statusData.status === 'started') {
        setStatus(prev => ({ ...prev, streaming: true }));
      } else if (statusData.status === 'stopped') {
        setStatus(prev => ({ ...prev, streaming: false }));
      }
    });

    newSocket.on('connect_error', (error) => {
      setStatus(prev => ({ ...prev, error: error.message, connected: false }));
    });

    setSocket(newSocket);
  }, [serverUrl, socket?.connected]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setStatus({ connected: false, streaming: false, error: null });
    }
  }, [socket]);

  // Start live streaming
  const startStream = useCallback(() => {
    if (socket?.connected) {
      socket.emit('start_live_stream');
    }
  }, [socket]);

  // Stop live streaming
  const stopStream = useCallback(() => {
    if (socket?.connected) {
      socket.emit('stop_live_stream');
    }
  }, [socket]);

  // Get single reading
  const getSingleReading = useCallback(() => {
    if (socket?.connected) {
      socket.emit('get_single_reading');
    }
  }, [socket]);

  // Get stream status
  const getStreamStatus = useCallback(() => {
    if (socket?.connected) {
      socket.emit('get_stream_status');
    }
  }, [socket]);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    data,
    status,
    connect,
    disconnect,
    startStream,
    stopStream,
    getSingleReading,
    getStreamStatus
  };
};
