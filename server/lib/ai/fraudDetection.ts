export interface FraudInput {
  gpsLocation: { lat: number; lng: number };
  speed: number;
  accelerometer: { x: number; y: number; z: number };
  appActivityFrequency: number;
  activityConsistency: number; // 0-1 score
  networkConsistency: number; // 0-1 score, analyzing SSID/CellID stability
  peerVerificationCount: number; // Number of nearby verified partners
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

  // 1. Sensor Fusion: Speed Anomaly vs Inertial Data
  if (input.speed > 120) {
    score -= 60;
    signals.push({ name: 'Speed Anomaly', status: 'alert', message: 'Hyper-speed detected' });
  }

  const isBodyStatic = Math.abs(input.accelerometer.z - 9.8) < 0.05 && 
                       Math.abs(input.accelerometer.x) < 0.05 && 
                       Math.abs(input.accelerometer.y) < 0.05;
  
  if (isBodyStatic && input.speed > 5) {
    score -= 50;
    signals.push({ name: 'Sensor Fusion Failure', status: 'alert', message: 'Static inertial signature during GPS movement' });
  }

  // 2. Network Consistency
  if (input.networkConsistency < 0.3) {
    score -= 20;
    signals.push({ name: 'Network Anomaly', status: 'warn', message: 'Suspicious network cluster switching' });
  }

  // 3. Peer-to-Peer Verification (The "Vouch" System)
  if (input.peerVerificationCount === 0) {
    score -= 10;
    signals.push({ name: 'Isolation Warning', status: 'warn', message: 'No nearby verified partners detected' });
  } else if (input.peerVerificationCount > 2) {
    score += 5; // Bonus for being in a verified cluster
  }

  // 4. Behavioral Consistency
  if (input.activityConsistency < 0.3) {
    score -= 30;
    signals.push({ name: 'Behavioral Anomaly', status: 'alert', message: 'Activity cadence mismatch with history' });
  }

  let status: FraudOutput['status'] = 'SAFE';
  if (score < 40) status = 'FLAGGED';
  else if (score < 75) status = 'SUSPICIOUS';

  return { trustScore: Math.max(0, score), status, signals };
}

/**
 * Detects coordinated syndicate activity (Fraud Rings)
 */
export function detectSyndicateActivity(recentClaims: any[]): { detected: boolean; action: 'NONE' | 'THROTTLE' | 'LOCK' } {
  const WINDOW_MS = 60000; // 1 minute
  const CLUSTER_THRESHOLD = 50; 
  
  const now = Date.now();
  const activeInWindow = recentClaims.filter(c => (now - c.timestamp) < WINDOW_MS);
  
  if (activeInWindow.length > CLUSTER_THRESHOLD) {
    // Check for coordinate clustering
    return { detected: true, action: 'LOCK' };
  }
  
  if (activeInWindow.length > CLUSTER_THRESHOLD / 2) {
    return { detected: true, action: 'THROTTLE' };
  }

  return { detected: false, action: 'NONE' };
}
