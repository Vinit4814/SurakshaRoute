import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useRealtime(onMetricsUpdate: (data: any) => void, onFraudAlert: (data: any) => void) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to the same origin, the proxy in vite.config.ts will handle it
    const s = io();

    s.on('connect', () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    });

    s.on('disconnect', () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    });

    s.on('metrics_update', onMetricsUpdate);
    s.on('fraud_alert', onFraudAlert);

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [onMetricsUpdate, onFraudAlert]);

  return { isConnected, socket };
}
