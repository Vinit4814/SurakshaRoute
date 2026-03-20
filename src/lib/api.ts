const API_BASE = '/api';

export async function fetchWallet() {
  const res = await fetch(`${API_BASE}/wallet`);
  return res.json();
}

export async function runRiskAssessment(input: any) {
  const res = await fetch(`${API_BASE}/risk/assessment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function runFraudCheck(input: any) {
  const res = await fetch(`${API_BASE}/fraud/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function fetchWeather(mode: string = 'normal') {
  const res = await fetch(`${API_BASE}/weather?mode=${mode}`);
  return res.json();
}

export async function triggerClaim(env: any, fraudInput: any, demoMode: string) {
  const res = await fetch(`${API_BASE}/claims/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ env, fraudInput, demoMode }),
  });
  return res.json();
}
