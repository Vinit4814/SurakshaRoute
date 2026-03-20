import { getIO } from '../socket';
import { calculateRiskScore } from '../lib/ai/riskAssessment';
import { detectFraud } from '../lib/ai/fraudDetection';
import { generateEnvironmentalData } from '../lib/ai/parametricTrigger';
import db from '../db';

export class SimulationService {
  private interval: NodeJS.Timeout | null = null;
  private userId = 'user_1';

  start() {
    if (this.interval) return;

    this.interval = setInterval(() => {
      this.runStep();
    }, 5000); // Every 5 seconds
    
    console.log('Simulation Service started');
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async runStep() {
    const io = getIO();

    // 1. Simulate Environmental Conditions
    const env = generateEnvironmentalData(Math.random() > 0.9 ? 'weather_disruption' : Math.random() > 0.9 ? 'social_disruption' : 'normal');

    // 2. Simulate Risk Assessment
    const riskInput = {
      location: 'Mumbai',
      temperature: env.temperature + (Math.random() * 4 - 2),
      rainfall: env.rainfall,
      trafficLevel: 3 + Math.random() * 7,
      deliveryActivity: 5 + Math.random() * 10,
      socialDisruption: env.socialSeverity,
    };
    const risk = calculateRiskScore(riskInput);

    // 3. Simulate Fraud Check (mostly safe, occasional suspicious)
    const fraudInput = {
      gpsLocation: { lat: 19.076 + Math.random() * 0.01, lng: 72.878 + Math.random() * 0.01 },
      speed: 20 + Math.random() * 30,
      accelerometer: { x: 1 + Math.random(), y: 1 + Math.random(), z: 9.8 + Math.random() },
      appActivityFrequency: 2 + Math.random() * 3,
      activityConsistency: 0.7 + Math.random() * 0.3,
      networkConsistency: 0.8 + Math.random() * 0.2, // Stable network
      peerVerificationCount: Math.floor(Math.random() * 5), // Nearby partners
      networkStrength: 60 + Math.random() * 30,
      timestamp: Date.now(),
      historicalPattern: { avgSpeed: 25, avgActivity: 4, usualLocations: [] },
    };
    
    // Occasionally simulate a spoofing attempt
    if (Math.random() > 0.95) {
        fraudInput.speed = 150;
        fraudInput.accelerometer.z = 9.8;
        fraudInput.accelerometer.x = 0;
        fraudInput.accelerometer.y = 0;
        fraudInput.activityConsistency = 0.2;
    }

    const fraud = detectFraud(fraudInput);

    // 4. Log Fraud if not safe
    if (fraud.status !== 'SAFE') {
      const id = `FRD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      db.prepare(`
        INSERT INTO fraud_logs (id, userId, score, status, signals, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, this.userId, fraud.trustScore, fraud.status, JSON.stringify(fraud.signals), Date.now());
      
      io.emit('fraud_alert', { ...fraud, id, timestamp: Date.now() });
    }

    // 5. Emit updates
    io.emit('metrics_update', {
      risk,
      fraud,
      env,
      timestamp: Date.now()
    });

    console.log('Simulation step emitted');
  }
}

export const simulationService = new SimulationService();
