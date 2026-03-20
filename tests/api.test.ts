import request from 'supertest';
import app from '../server/index';
import db from '../server/db';

describe('SurakshaRoute API Integration Tests', () => {
  beforeAll(() => {
    // Reset DB state for testing if needed
    db.prepare("UPDATE users SET balance = 2500 WHERE id = 'user_1'").run();
    db.prepare("DELETE FROM transactions WHERE userId = 'user_1'").run();
  });

  it('GET /api/wallet should return initial balance', async () => {
    const res = await request(app).get('/api/wallet');
    expect(res.status).toBe(200);
    expect(res.body.balance).toBe(2500);
    expect(res.body.transactions).toBeInstanceOf(Array);
  });

  it('GET /api/profile should return user profile', async () => {
    const res = await request(app).get('/api/profile/profile'); // Note: /api/profile maps to walletRouter, and walletRouter has /profile
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('user_1');
  });

  it('POST /api/risk/assessment should deduct premium', async () => {
    const riskInput = {
        location: 'Mumbai',
        temperature: 30,
        rainfall: 10,
        trafficLevel: 5,
        deliveryActivity: 5,
        socialDisruption: 10,
    };
    const res = await request(app)
      .post('/api/risk/assessment')
      .send(riskInput);
    
    expect(res.status).toBe(200);
    expect(res.body.riskScore).toBeDefined();
    expect(res.body.riskFactors).toContainEqual(expect.objectContaining({ factor: 'Social & Political Risk' }));
    
    // Check wallet update
    const walletRes = await request(app).get('/api/wallet');
    expect(walletRes.body.balance).toBeLessThan(2500);
  });

  it('POST /api/fraud/check should evaluate signals', async () => {
    const fraudInput = {
      gpsLocation: { lat: 19.076, lng: 72.878 },
      speed: 150,
      accelerometer: { x: 0.01, y: 0.01, z: 9.8 }, // Very static
      appActivityFrequency: 15,
      activityConsistency: 0.9,
      networkConsistency: 0.9,
      peerVerificationCount: 3,
      networkStrength: 8,
      timestamp: Date.now(),
      historicalPattern: { avgSpeed: 20, avgActivity: 4, usualLocations: [] },
    };
    const res = await request(app)
      .post('/api/fraud/check')
      .send(fraudInput);
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('FLAGGED'); // Speed 150 is still flagged
    expect(res.body.trustScore).toBeLessThan(60);
  });

  it('GET /api/weather should return environmental data', async () => {
    const res = await request(app).get('/api/weather?mode=weather_disruption');
    expect(res.status).toBe(200);
    expect(res.body.severity).toBe('EXTREME');
    expect(res.body.socialStatus).toBeDefined();
  });
});
