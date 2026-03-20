import { type Transaction } from '@/lib/ai/wallet';
interface WalletPanelProps {
    balance: number;
    transactions: Transaction[];
}
export declare function WalletPanel({ balance, transactions }: WalletPanelProps): import("react/jsx-runtime").JSX.Element;
export {};
