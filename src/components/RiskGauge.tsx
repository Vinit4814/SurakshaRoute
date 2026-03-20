import React from 'react';
import { motion } from 'framer-motion';

interface RiskGaugeProps {
  score: number;
  level: string;
}

export function RiskGauge({ score, level }: RiskGaugeProps) {
  const rotation = (score / 100) * 180 - 90;

  return (
    <div className="relative flex flex-col items-center">
      <div className="w-48 h-24 overflow-hidden relative">
        <div className="w-48 h-48 border-[12px] border-border/20 rounded-full absolute top-0" />
        <div 
          className="w-48 h-48 border-[12px] border-emerald-500 rounded-full absolute top-0 transition-all duration-500"
          style={{ 
            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
            borderColor: score > 70 ? '#ef4444' : score > 40 ? '#f59e0b' : '#10b981',
            transform: `rotate(${rotation}deg)` 
          }}
        />
        <div className="absolute inset-0 flex items-end justify-center pb-2">
           <div className="text-center">
             <div className="text-3xl font-bold">{score}</div>
             <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{level}</div>
           </div>
        </div>
      </div>
      <motion.div 
        className="w-1 h-16 bg-white absolute bottom-2 origin-bottom transition-all duration-500"
        style={{ rotate: rotation }}
      />
    </div>
  );
}
