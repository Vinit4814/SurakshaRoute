import React from 'react';
import { Shield, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { type FraudOutput } from '@/lib/ai/fraudDetection';

export function FraudPanel({ fraud }: { fraud: FraudOutput }) {
  const statusColors = {
    SAFE: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    SUSPICIOUS: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
    FLAGGED: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
  };

  return (
    <div className={`glass-card p-6 border transition-all ${statusColors[fraud.status]}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-current/10 flex items-center justify-center">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Fraud Analysis</h3>
          <p className="text-xs opacity-70">Trust Score: {fraud.trustScore}%</p>
        </div>
      </div>

      <div className="space-y-4">
        {fraud.signals.map((signal, idx) => (
          <div key={idx} className="flex items-start gap-3 border-b border-current/10 pb-3 last:border-0">
            {signal.status === 'ok' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> :
             signal.status === 'warn' ? <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> :
             <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
            <div>
              <div className="text-xs font-bold uppercase tracking-tight">{signal.name}</div>
              <div className="text-[11px] opacity-70 leading-tight">{signal.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
