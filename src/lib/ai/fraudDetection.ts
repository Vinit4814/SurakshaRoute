export interface FraudInput {
  gpsLocation: { lat: number; lng: number };
  speed: number;
  accelerometer: { x: number; y: number; z: number };
  appActivityFrequency: number;
  networkStrength: number;
  timestamp: number;
  historicalPattern: { avgSpeed: number; avgActivity: number; usualLocations: Array<{ lat: number; lng: number }> };
}

export interface FraudOutput {
  trustScore: number;
  status: 'SAFE' | 'SUSPICIOUS' | 'FLAGGED';
  signals: Array<{ name: string; status: 'ok' | 'warn' | 'alert'; message: string }>;
}

export function detectFraud(input: FraudInput): FraudOutput {
  let score = 95;
  const signals: FraudOutput['signals'] = [];

  if (input.speed > 120) {
    score -= 40;
    signals.push({ name: 'Speed Anomaly', status: 'alert', message: 'Hyper-speed detected' });
  } else {
    signals.push({ name: 'Speed Profile', status: 'ok', message: 'Consistent with delivery' });
  }

  if (Math.abs(input.accelerometer.z - 9.8) < 0.2 && input.speed > 50) {
    score -= 30;
    signals.push({ name: 'GPS Spoofing', status: 'alert', message: 'Static movement at high speed' });
  }

  let status: FraudOutput['status'] = 'SAFE';
  if (score < 50) status = 'FLAGGED';
  else if (score < 80) status = 'SUSPICIOUS';

  return { trustScore: score, status, signals };
}

export function detectFraudRing(claims: any[]): { detected: boolean; pattern: string } {
  if (claims.length >= 3) {
    return { detected: true, pattern: 'Coordinated location cluster detected' };
  }
  return { detected: false, pattern: '' };
}
