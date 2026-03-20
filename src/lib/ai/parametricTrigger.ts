export interface WeatherData {
  temperature: number;
  rainfall: number;
  severity: 'NORMAL' | 'SEVERE' | 'EXTREME';
}

export function generateWeatherData(mode: 'normal' | 'disruption'): WeatherData {
  if (mode === 'disruption') {
    return { temperature: 24, rainfall: 85, severity: 'EXTREME' };
  }
  return { temperature: 31, rainfall: 5, severity: 'NORMAL' };
}

export function checkAutoTrigger(weather: WeatherData, isPolicyActive: boolean) {
  if (isPolicyActive && weather.rainfall > 50) {
    return { triggered: true, reason: 'Flash flood parametric trigger', payoutAmount: 500 };
  }
  return { triggered: false, reason: '', payoutAmount: 0 };
}
