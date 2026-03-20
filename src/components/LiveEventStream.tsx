import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Shield, AlertTriangle, CloudRain } from 'lucide-react';

interface Event {
  id: string;
  type: 'risk' | 'fraud' | 'weather' | 'payout';
  message: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high';
}

export function LiveEventStream({ events }: { events: Event[] }) {
  return (
    <div className="glass-card flex flex-col h-[300px]">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent animate-pulse" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Live AI Event Stream</h3>
        </div>
        <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-mono animate-pulse">LIVE</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-3 rounded-lg border flex gap-3 ${
                event.severity === 'high' ? 'bg-danger/5 border-danger/20' :
                event.severity === 'medium' ? 'bg-warning/5 border-warning/20' :
                'bg-safe/5 border-safe/20'
              }`}
            >
              <div className="mt-0.5">
                {event.type === 'fraud' && <Shield className={`w-4 h-4 ${event.severity === 'high' ? 'text-danger' : 'text-warning'}`} />}
                {event.type === 'risk' && <AlertTriangle className="w-4 h-4 text-warning" />}
                {event.type === 'weather' && <CloudRain className="w-4 h-4 text-accent" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-tight">{event.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {events.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 opacity-50">
            <Activity className="w-8 h-8 mb-2" />
            <p className="text-xs italic">Waiting for telemetry data...</p>
          </div>
        )}
      </div>
    </div>
  );
}
