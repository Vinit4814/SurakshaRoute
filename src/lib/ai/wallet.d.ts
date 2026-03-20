export interface Transaction {
    id: string;
    type: string;
    amount: number;
    description: string;
    status: 'COMPLETED' | 'PENDING' | 'BLOCKED';
    timestamp: number;
}
export declare function createTransaction(type: string, amount: number, description: string, status?: Transaction['status']): Transaction;
export declare function processPayout(trustScore: number, amount: number, fraudStatus: string): {
    status: string;
    message: string;
    amount?: undefined;
    estimatedTime?: undefined;
} | {
    status: string;
    amount: number;
    message: string;
    estimatedTime?: undefined;
} | {
    status: string;
    amount: number;
    estimatedTime: string;
    message: string;
};
