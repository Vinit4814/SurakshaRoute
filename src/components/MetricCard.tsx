import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  variant?: 'default' | 'safe' | 'warning' | 'danger';
  glow?: boolean;
}

export function MetricCard({ title, value, subtitle, icon, variant = 'default', glow }: MetricCardProps) {
  const variants = {
    default: 'border-border/50 text-foreground',
    safe: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
    warning: 'border-amber-500/30 text-amber-400 bg-amber-500/5',
    danger: 'border-rose-500/30 text-rose-400 bg-rose-500/5',
  };

  return (
    <div className={cn(
      "glass-card p-4 flex flex-col gap-2 transition-all duration-300",
      variants[variant],
      glow && "ring-1 ring-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider opacity-70">{title}</span>
        <div className="opacity-50">{icon}</div>
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-[10px] opacity-60 uppercase tracking-widest leading-none">{subtitle}</div>
    </div>
  );
}
