export interface EnvironmentalData {
  temperature: number;
  rainfall: number;
  severity: 'NORMAL' | 'SEVERE' | 'EXTREME';
  socialStatus: 'STABLE' | 'RESTRICTED' | 'LOCKED';
  socialSeverity: number; // 0-100
}

export function generateEnvironmentalData(mode: 'normal' | 'weather_disruption' | 'social_disruption'): EnvironmentalData {
  if (mode === 'weather_disruption') {
    return { temperature: 24, rainfall: 85, severity: 'EXTREME', socialStatus: 'STABLE', socialSeverity: 10 };
  }
  if (mode === 'social_disruption') {
    return { temperature: 30, rainfall: 0, severity: 'NORMAL', socialStatus: 'LOCKED', socialSeverity: 95 };
  }
  return { temperature: 31, rainfall: 5, severity: 'NORMAL', socialStatus: 'STABLE', socialSeverity: 5 };
}

export function checkAutoTrigger(env: EnvironmentalData, isPolicyActive: boolean, currentPoolStatus: { used: number; total: number } = { used: 0, total: 1000000 }) {
  if (!isPolicyActive) return { triggered: false, reason: '', payoutAmount: 0 };

  // Liquidity Protection Circuit Breaker
  if (currentPoolStatus.used / currentPoolStatus.total > 0.8) {
    return { triggered: false, reason: 'Liquidity circuit breaker active — system under heavy load/attack', payoutAmount: 0 };
  }

  // Weather Trigger
  if (env.rainfall > 50 || env.severity === 'EXTREME') {
    return { triggered: true, reason: 'Extreme weather parametric trigger triggered', payoutAmount: 500 };
  }

  // Social/Political Trigger (Curfews, Lockdowns)
  if (env.socialSeverity > 80 || env.socialStatus === 'LOCKED') {
    return { triggered: true, reason: 'Social restriction parametric trigger triggered', payoutAmount: 400 };
  }

  return { triggered: false, reason: '', payoutAmount: 0 };
}
