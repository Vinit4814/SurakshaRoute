export interface WeatherData {
    temperature: number;
    rainfall: number;
    severity: 'NORMAL' | 'SEVERE' | 'EXTREME';
}
export declare function generateWeatherData(mode: 'normal' | 'disruption'): WeatherData;
export declare function checkAutoTrigger(weather: WeatherData, isPolicyActive: boolean): {
    triggered: boolean;
    reason: string;
    payoutAmount: number;
};
