import React from 'react';
import { Wallet, History, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { type Transaction } from '@/lib/ai/wallet';

interface WalletPanelProps {
  balance: number;
  transactions: Transaction[];
}

export function WalletPanel({ balance, transactions }: WalletPanelProps) {
  return (
    <div className="glass-card flex flex-col h-full border-white/5 overflow-hidden">
      <div className="p-6 bg-gradient-to-br from-white/5 to-transparent border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Smart Wallet</span>
        </div>
        <div className="text-3xl font-bold tracking-tight">₹{balance.toLocaleString()}</div>
        <div className="text-[10px] text-muted-foreground mt-1">Available for instant payout</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <div className="flex items-center gap-2 mb-2">
          <History className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Transaction History</span>
        </div>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8 opacity-20 text-[10px] uppercase font-bold">No transactions</div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3">
              <div className={tx.amount > 0 ? "text-emerald-400" : "text-rose-400"}>
                {tx.amount > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold truncate leading-none mb-1">{tx.description}</div>
                <div className="text-[9px] text-muted-foreground opacity-60 uppercase">{new Date(tx.timestamp).toLocaleTimeString()}</div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-bold ${tx.amount > 0 ? "text-emerald-400" : "text-foreground"}`}>
                  {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount)}
                </div>
                <div className={`text-[8px] font-bold px-1 rounded inline-block ${
                  tx.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' :
                  tx.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                }`}>
                  {tx.status}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
