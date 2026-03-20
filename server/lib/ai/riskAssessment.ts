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
  socialDisruption: number; // 0-100 score for curfews, rallies, etc.
}

export function calculateRiskScore(input: RiskInput): RiskOutput {
  // Enhanced weighting: weather (30%), social (30%), traffic (20%), activity (20%)
  const weatherImpact = (input.rainfall * 0.4) + (Math.max(0, input.temperature - 35) * 2);
  const socialImpact = input.socialDisruption * 0.6;
  const trafficImpact = input.trafficLevel * 8;
  const activityImpact = input.deliveryActivity * 0.5;

  const score = Math.min(100, weatherImpact + socialImpact + trafficImpact + activityImpact);

  let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (score > 70) level = 'HIGH';
  else if (score > 40) level = 'MEDIUM';

  // Persona-specific premium: Base + 1.2x Risk Score + Intensity Multiplier
  const intensityMultiplier = 1 + (input.deliveryActivity / 100);
  const weeklyPremium = Math.round((50 + score * 1.5) * intensityMultiplier);

  return {
    riskScore: Math.round(score),
    riskLevel: level,
    weeklyPremium,
    riskFactors: [
      { factor: 'Environmental Hazards', contribution: Math.round(weatherImpact) },
      { factor: 'Social & Political Risk', contribution: Math.round(socialImpact) },
      { factor: 'Congestion & Accessibility', contribution: Math.round(trafficImpact) },
      { factor: 'Operation Intensity', contribution: Math.round(activityImpact) },
    ],
  };
}
