import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, Zap, CloudRain, AlertTriangle, Bike, TrendingUp } from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';
import { RiskGauge } from '@/components/RiskGauge';
import { FraudPanel } from '@/components/FraudPanel';
import { WalletPanel } from '@/components/WalletPanel';
import { ClaimStatus } from '@/components/ClaimStatus';
import { LiveEventStream } from '@/components/LiveEventStream';
import { useRealtime } from '@/hooks/useRealtime';
import * as api from '@/lib/api';
import type { RiskOutput } from '@/lib/ai/riskAssessment';
import type { FraudOutput, FraudInput } from '@/lib/ai/fraudDetection';
import type { WeatherData } from '@/lib/ai/parametricTrigger';
import type { Transaction } from '@/lib/ai/wallet';

type DemoMode = 'normal' | 'fraudster' | 'group_fraud';

const DEMO_PROFILES: Record<DemoMode, { label: string; description: string }> = {
  normal: { label: 'Normal User', description: 'Genuine delivery worker' },
  fraudster: { label: 'GPS Spoofer', description: 'Simulates GPS spoofing attack' },
  group_fraud: { label: 'Fraud Ring', description: 'Coordinated group attack' },
};

function getFraudInput(mode: DemoMode): FraudInput {
  if (mode === 'fraudster') {
    return {
      gpsLocation: { lat: 19.076, lng: 72.878 },
      speed: 150,
      accelerometer: { x: 0.1, y: 0.1, z: 9.8 },
      appActivityFrequency: 15,
      networkStrength: 8,
      timestamp: Date.now(),
      historicalPattern: { avgSpeed: 20, avgActivity: 4, usualLocations: [{ lat: 19.1, lng: 73.0 }] },
    };
  }
  if (mode === 'group_fraud') {
    return {
      gpsLocation: { lat: 19.076, lng: 72.878 },
      speed: 130,
      accelerometer: { x: 0.2, y: 0.1, z: 9.8 },
      appActivityFrequency: 12,
      networkStrength: 15,
      timestamp: Date.now(),
      historicalPattern: { avgSpeed: 22, avgActivity: 5, usualLocations: [{ lat: 19.2, lng: 73.1 }] },
    };
  }
  return {
    gpsLocation: { lat: 19.0821, lng: 72.8812 },
    speed: 22,
    accelerometer: { x: 2.1, y: 1.5, z: 10.2 },
    appActivityFrequency: 4,
    networkStrength: 72,
    timestamp: Date.now(),
    historicalPattern: { avgSpeed: 20, avgActivity: 4, usualLocations: [{ lat: 19.08, lng: 72.88 }] },
  };
}

export default function Dashboard() {
  const [demoMode, setDemoMode] = useState<DemoMode>('normal');
  const [risk, setRisk] = useState<RiskOutput | null>(null);
  const [fraud, setFraud] = useState<FraudOutput | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [claimState, setClaimState] = useState<{ status: 'approved' | 'review' | 'flagged' | 'none'; reason: string; amount: number; payoutStatus?: string }>({
    status: 'none', reason: '', amount: 0,
  });
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ringAlert, setRingAlert] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  // Real-time updates via WebSocket
  useRealtime(
    useCallback((data: any) => {
      setRisk(data.risk);
      setFraud(data.fraud);
      setWeather(data.weather);
      
      // Auto-refresh wallet if metrics indicate significant change (optional Optimization)
      // refreshWallet(); 
    }, []),
    useCallback((alert: any) => {
      setEvents(prev => [{
        id: alert.id,
        type: 'fraud',
        message: `ALERT: ${alert.status} detected - ${alert.signals[0]?.message}`,
        timestamp: alert.timestamp,
        severity: alert.status === 'FLAGGED' ? 'high' : 'medium'
      }, ...prev].slice(0, 50));
    }, [])
  );

  // Initial data fetch
  const refreshWallet = useCallback(async () => {
    try {
      const data = await api.fetchWallet();
      setWalletBalance(data.balance);
      setTransactions(data.transactions);
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
    }
  }, []);

  useEffect(() => {
    refreshWallet();
    const interval = setInterval(refreshWallet, 5000); // Poll wallet balance regularly
    return () => clearInterval(interval);
  }, [refreshWallet]);

  const runRiskAssessment = useCallback(async () => {
    setIsProcessing(true);
    try {
      const w = weather || await api.fetchWeather('normal');
      const result = await api.runRiskAssessment({
        location: 'Mumbai',
        temperature: w.temperature,
        rainfall: w.rainfall,
        trafficLevel: 5 + Math.random() * 5,
        deliveryActivity: 8 + Math.random() * 8,
      });
      setRisk(result);
      setEvents(prev => [{
        id: Math.random().toString(),
        type: 'risk',
        message: `Manual assessment: ${result.riskLevel} risk level detected`,
        timestamp: Date.now(),
        severity: result.riskLevel === 'HIGH' ? 'medium' : 'low'
      }, ...prev].slice(0, 50));
      await refreshWallet();
    } catch (err) {
      console.error('Risk assessment failed:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [weather, refreshWallet]);

  const runFraudCheck = useCallback(async () => {
    setIsProcessing(true);
    try {
      const input = getFraudInput(demoMode);
      const result = await api.runFraudCheck(input);
      setFraud(result);

      if (demoMode === 'group_fraud') {
        setRingAlert(`🚨 Fraud Ring Detected: Coordinated location cluster detected`);
      } else {
        setRingAlert(null);
      }
    } catch (err) {
      console.error('Fraud check failed:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [demoMode]);

  const simulateWeatherDisruption = useCallback(async () => {
    setIsProcessing(true);
    try {
      const w = await api.fetchWeather('disruption');
      setWeather(w);
      setEvents(prev => [{
          id: Math.random().toString(),
          type: 'weather',
          message: `Extreme weather detected: ${w.rainfall}mm rainfall in Mumbai`,
          timestamp: Date.now(),
          severity: 'high'
        }, ...prev].slice(0, 50));

      const fraudInput = getFraudInput(demoMode);
      const claimResult = await api.triggerClaim(w, fraudInput, demoMode);
      
      if (claimResult.triggered) {
        setClaimState({
          status: claimResult.status,
          reason: claimResult.reason,
          amount: claimResult.amount,
          payoutStatus: claimResult.payoutStatus
        });
        
        setEvents(prev => [{
          id: Math.random().toString(),
          type: 'payout',
          message: `Claim trigger: ${claimResult.status.toUpperCase()} state for ₹${claimResult.amount}`,
          timestamp: Date.now(),
          severity: claimResult.status === 'approved' ? 'low' : 'high'
        }, ...prev].slice(0, 50));
      }
      
      await refreshWallet();
    } catch (err) {
      console.error('Simulate weather failed:', err);
    } finally {
      setTimeout(() => setIsProcessing(false), 500);
    }
  }, [demoMode, refreshWallet]);

  const triggerClaim = useCallback(async () => {
    setIsProcessing(true);
    try {
      const currentWeather = weather || await api.fetchWeather('disruption');
      const fraudInput = getFraudInput(demoMode);
      const claimResult = await api.triggerClaim(currentWeather, fraudInput, demoMode);
      
      if (claimResult.triggered) {
        setClaimState({
          status: claimResult.status,
          reason: claimResult.reason,
          amount: claimResult.amount,
          payoutStatus: claimResult.payoutStatus
        });
      }
      await refreshWallet();
    } catch (err) {
      console.error('Manual claim trigger failed:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [weather, demoMode, refreshWallet]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">SurakshaRoute</h1>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-muted-foreground tracking-widest uppercase">AI-Powered Parametric Insurance</p>
                <div className="flex items-center gap-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse"></span>
                   <span className="text-[10px] text-safe font-bold">REAL-TIME</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
            {(Object.keys(DEMO_PROFILES) as DemoMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => { setDemoMode(mode); setRingAlert(null); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  demoMode === mode
                    ? mode === 'normal' ? 'bg-safe text-safe-foreground' : mode === 'fraudster' ? 'bg-danger text-danger-foreground' : 'bg-warning text-warning-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {DEMO_PROFILES[mode].label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <AnimatePresence>
          {ringAlert && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger font-medium"
            >
              {ringAlert}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Risk Score"
            value={risk ? risk.riskScore : '—'}
            subtitle={risk ? risk.riskLevel : 'Waiting for data...'}
            icon={<TrendingUp className="w-4 h-4" />}
            variant={risk ? (risk.riskScore < 50 ? 'safe' : risk.riskScore < 75 ? 'warning' : 'danger') : 'default'}
            glow={!!risk}
          />
          <MetricCard
            title="Weekly Premium"
            value={risk ? `₹${risk.weeklyPremium}` : '—'}
            subtitle="Dynamic pricing"
            icon={<Bike className="w-4 h-4" />}
            variant="default"
          />
          <MetricCard
            title="Trust Score"
            value={fraud ? fraud.trustScore : '—'}
            subtitle={fraud ? fraud.status : 'Monitoring signals...'}
            icon={<Shield className="w-4 h-4" />}
            variant={fraud ? (fraud.status === 'SAFE' ? 'safe' : fraud.status === 'SUSPICIOUS' ? 'warning' : 'danger') : 'default'}
            glow={!!fraud}
          />
          <MetricCard
            title="Weather"
            value={weather ? `${weather.rainfall.toFixed(0)}mm` : '—'}
            subtitle={weather ? `${weather.temperature.toFixed(0)}°C • ${weather.severity}` : 'Live telemetry'}
            icon={<CloudRain className="w-4 h-4" />}
            variant={weather?.severity === 'EXTREME' ? 'danger' : weather?.severity === 'SEVERE' ? 'warning' : 'default'}
          />
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="space-y-4 md:col-span-1">
            <div className="glass-card p-6 flex flex-col items-center">
              <h3 className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-4 self-start">Risk Assessment</h3>
              <div className="relative">
                <RiskGauge score={risk?.riskScore ?? 0} level={risk?.riskLevel ?? 'N/A'} />
              </div>
              {risk && (
                <div className="w-full mt-4 space-y-1">
                  {risk.riskFactors.map(f => (
                    <div key={f.factor} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{f.factor}</span>
                      <span className="font-mono text-accent">{f.contribution.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={runRiskAssessment}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Activity className="w-4 h-4" /> Run Risk Assessment
              </button>
              <button
                onClick={runFraudCheck}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4" /> Run Fraud Check
              </button>
              <button
                onClick={simulateWeatherDisruption}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-gradient-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CloudRain className="w-4 h-4" /> Simulate Weather Disruption
              </button>
            </div>
          </div>

          <div className="space-y-4 md:col-span-1">
            {fraud ? (
              <FraudPanel fraud={fraud} />
            ) : (
              <div className="glass-card p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
                <Shield className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Waiting for live sensor data...</p>
              </div>
            )}
            <LiveEventStream events={events} />
          </div>
          
          <div className="space-y-4 md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <ClaimStatus {...claimState} />
               <button
                  onClick={triggerClaim}
                  disabled={isProcessing}
                  className="h-full py-3 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" /> Trigger Manual Claim
                </button>
            </div>
            <WalletPanel balance={walletBalance} transactions={transactions} />
          </div>
        </div>

        <div className="text-center py-8 border-t border-border/30">
          <p className="text-xs text-muted-foreground italic">
            "We do not verify location — we verify reality."
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-1">SurakshaRoute • AI-Powered Parametric Insurance for Delivery Workers</p>
        </div>
      </main>
    </div>
  );
}
