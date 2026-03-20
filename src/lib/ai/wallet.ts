export interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: 'COMPLETED' | 'PENDING' | 'BLOCKED';
  timestamp: number;
}

export function createTransaction(type: string, amount: number, description: string, status: Transaction['status'] = 'COMPLETED'): Transaction {
  return {
    id: `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    type,
    amount,
    description,
    status,
    timestamp: Date.now(),
  };
}

export function processPayout(trustScore: number, amount: number, fraudStatus: string) {
  if (fraudStatus === 'FLAGGED' || trustScore < 40) {
    return { status: 'BLOCKED', message: 'Fraud threshold exceeded' };
  }
  if (trustScore > 85) {
    return { status: 'INSTANT', amount, message: 'Instant AI payout approved' };
  }
  return { status: 'DELAYED', amount, estimatedTime: '2-4 hours', message: 'Manual verification required' };
}
