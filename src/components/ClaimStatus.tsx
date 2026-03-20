import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Clock, ShieldAlert } from 'lucide-react';

interface ClaimStatusProps {
  status: 'approved' | 'review' | 'flagged' | 'none';
  reason: string;
  amount: number;
  payoutStatus?: string;
}

export function ClaimStatus({ status, reason, amount, payoutStatus }: ClaimStatusProps) {
  if (status === 'none') return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-6 border transition-all ${
        status === 'approved' ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' :
        status === 'review' ? 'border-amber-500/30 bg-amber-500/5 text-amber-400' :
        'border-rose-500/30 bg-rose-500/5 text-rose-400'
      }`}
    >
      <div className="flex items-center gap-4 mb-4">
        {status === 'approved' ? <CheckCircle2 className="w-8 h-8" /> :
         status === 'review' ? <Clock className="w-8 h-8" /> :
         <ShieldAlert className="w-8 h-8" />}
        <div>
          <h3 className="text-lg font-bold tracking-tight">
            {status === 'approved' ? 'Claim Approved' : 
             status === 'review' ? 'Pending Review' : 'Claim Flagged'}
          </h3>
          <p className="text-[10px] opacity-70 uppercase tracking-widest">{payoutStatus || 'Processing'}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="p-3 rounded-lg bg-current/5 border border-current/10">
          <div className="text-[10px] uppercase opacity-50 mb-1">AI Decision Reason</div>
          <div className="text-xs font-medium leading-tight">{reason}</div>
        </div>
        
        {amount > 0 && (
          <div className="flex justify-between items-center px-1">
            <span className="text-xs opacity-70">Payout Amount</span>
            <span className="text-lg font-mono font-bold">₹{amount}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
