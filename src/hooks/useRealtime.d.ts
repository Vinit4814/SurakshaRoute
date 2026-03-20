import { Socket } from 'socket.io-client';
export declare function useRealtime(onMetricsUpdate: (data: any) => void, onFraudAlert: (data: any) => void): {
    isConnected: boolean;
    socket: Socket<import("@socket.io/component-emitter").DefaultEventsMap, import("@socket.io/component-emitter").DefaultEventsMap> | null;
};
