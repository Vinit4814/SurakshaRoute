export interface FraudInput {
    gpsLocation: {
        lat: number;
        lng: number;
    };
    speed: number;
    accelerometer: {
        x: number;
        y: number;
        z: number;
    };
    appActivityFrequency: number;
    networkStrength: number;
    timestamp: number;
    historicalPattern: {
        avgSpeed: number;
        avgActivity: number;
        usualLocations: Array<{
            lat: number;
            lng: number;
        }>;
    };
}
export interface FraudOutput {
    trustScore: number;
    status: 'SAFE' | 'SUSPICIOUS' | 'FLAGGED';
    signals: Array<{
        name: string;
        status: 'ok' | 'warn' | 'alert';
        message: string;
    }>;
}
export declare function detectFraud(input: FraudInput): FraudOutput;
export declare function detectFraudRing(claims: any[]): {
    detected: boolean;
    pattern: string;
};
