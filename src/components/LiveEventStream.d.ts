interface Event {
    id: string;
    type: 'risk' | 'fraud' | 'weather' | 'payout';
    message: string;
    timestamp: number;
    severity: 'low' | 'medium' | 'high';
}
export declare function LiveEventStream({ events }: {
    events: Event[];
}): import("react/jsx-runtime").JSX.Element;
export {};
