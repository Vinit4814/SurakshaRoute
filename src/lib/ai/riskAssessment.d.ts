export interface RiskOutput {
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    weeklyPremium: number;
    riskFactors: Array<{
        factor: string;
        contribution: number;
    }>;
}
export interface RiskInput {
    location: string;
    temperature: number;
    rainfall: number;
    trafficLevel: number;
    deliveryActivity: number;
}
export declare function calculateRiskScore(input: RiskInput): RiskOutput;
