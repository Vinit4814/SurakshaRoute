interface ClaimStatusProps {
    status: 'approved' | 'review' | 'flagged' | 'none';
    reason: string;
    amount: number;
    payoutStatus?: string;
}
export declare function ClaimStatus({ status, reason, amount, payoutStatus }: ClaimStatusProps): import("react/jsx-runtime").JSX.Element | null;
export {};
