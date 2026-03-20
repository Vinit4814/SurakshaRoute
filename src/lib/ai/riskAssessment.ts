export interface RiskOutput {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  weeklyPremium: number;
  riskFactors: Array<{ factor: string; contribution: number }>;
}

export interface RiskInput {
  location: string;
  temperature: number;
  rainfall: number;
  trafficLevel: number;
  deliveryActivity: number;
}

export function calculateRiskScore(input: RiskInput): RiskOutput {
  const score = Math.min(100, (input.rainfall * 2) + (input.trafficLevel * 10) + (input.deliveryActivity * 2));
  let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (score > 70) level = 'HIGH';
  else if (score > 40) level = 'MEDIUM';

  return {
    riskScore: Math.round(score),
    riskLevel: level,
    weeklyPremium: Math.round(50 + score * 1.5),
    riskFactors: [
      { factor: 'Weather Severity', contribution: input.rainfall > 50 ? 40 : 10 },
      { factor: 'Traffic Congestion', contribution: input.trafficLevel * 5 },
      { factor: 'Route Density', contribution: input.deliveryActivity * 2 },
    ],
  };
}
