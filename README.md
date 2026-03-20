# 🛡️ SurakshaRoute

### AI-Powered Parametric Insurance for Delivery Workers

**SurakshaRoute** is an intelligent, real-time parametric insurance platform designed to protect delivery workers from the financial impact of extreme weather, social disruptions, and other unforeseen environmental risks.

---

## 🔥 The Problem

Every day, delivery workers face a brutal choice: **risk their safety** (in heat, rain, or curfews) or **lose their income**. Traditional insurance is slow, manual, and often inaccessible for short-term disruptions.

## 🚀 Our Solution: Parametric Protection

SurakshaRoute replaces manual claims with **AI-driven automation**. Protection is:
- **Instant**: Payouts trigger the moment a disruption is detected.
- **Automatic**: No forms, no waiting, no manual appraisal.
- **Impossible to Fake**: Multi-signal behavioral analysis detects fraud in real-time.

---

## 🧠 Key Features

### 1. AI-Powered Risk Assessment
- **Dynamic Weekly Pricing**: Premiums are calculated based on the worker's environment and intensity.
- **Predictive Modeling**: Analyzes weather patterns, traffic congestion, and "social disruption" indicators (curfews, rallies).

### 2. Intelligent Fraud Detection
- **Behavioral Analysis**: Beyond GPS—monitors movement consistency, app interaction frequency, and device signals to ensure the claim is genuine.
- **Anomaly Detection**: Identifies GPS spoofing and coordinated "fraud rings" using peer-to-peer data validation.

### 3. Parametric Automation (The Trigger Engine)
- **Real-time Monitoring**: Connects to weather and social feeds to detect disruptions *as they happen*.
- **Instant Wallet Payout**: Funds are transferred immediately to the worker's wallet when a trigger condition (like `EXTREME_RAINFALL`) is met.

---

## 🛡️ Adversarial Defense & Anti-Spoofing Strategy

In response to sophisticated GPS-spoofing syndicate attacks, SurakshaRoute employs a multi-layered defense architecture:

### 1. The Differentiation (Beyond GPS)
We don't trust GPS alone. Our AI differentiates between a genuinely stranded worker and a bad actor by:
- **Sensor Fusion**: Correlating 6-axis accelerometer/gyroscopic data with GPS velocity. A spoofer at home has a static "stationary" inertial signature even if their GPS "moves" at 40km/h. 
- **Behavioral Biometrics**: Analyzing the cadence of app interactions and motion patterns. Synergisticated spoofers lack the "micro-stops" and "vibrations" characteristic of real-world delivery movement.

### 2. Multi-Signal Data Validation
- **Peer-to-Peer Verification**: Using proximity-based handshakes (Wi-Fi/BLE) where delivery partners in the same "red zone" vouch for each other's presence.
- **Network Consistency**: Analyzing Cell-ID clusters and Wi-Fi SSID stability. Spoofers typically exhibit home-based network patterns despite claimed locations.
- **Coordinated Cluster Detection**: Our backend analyzes claims for "unnatural synchronicity"—if 500 workers trigger claims from the exact same coordinate cluster at the same second, the liquidity pool is automatically locked.

### 3. The UX Balance (Justice for the Honest)
To avoid penalizing genuine workers experiencing bad weather or network drops:
- **Trust Scores**: High-reputation workers continue to receive instant payouts.
- **Liquidity Hold**: Flagged or low-reputation accounts transition to a "Manual Review" state with a 2-hour liquidity hold, preventing instant pool drain while allowing for honest error resolution.
- **Reputation Recovery**: Honest workers can recover their trust score through consistent, verified activity.

---

## ⚡ System Stability & Regression Prevention

To prevent "system crashes" during rapid iteration (e.g., breaking API changes or refactoring), SurakshaRoute employs **AI-Assisted Architectural Integrity**:

### 1. The AI Solution: Contract-First Refactoring
- **Automated Bridge Generation**: When an internal function (like `calculateRisk`) is refactored, our AI-driven CI/CD pipeline identifies all downstream dependencies and generates "compatibility bridges" or deprecation warnings in real-time.
- **Visual Call-Graph Analysis**: Using AI to map the entire project's dependency graph, ensuring that no renaming or signature change goes unnoticed by the Compiler or the Runtime.

### 2. Implementation: The Stability Guard
- **Strongly Typed Contracts**: Every AI engine (Risk, Fraud, Triggers) is protected by strict TypeScript interfaces. Any violation is caught at compile-time, not runtime.
- **Regression Suite**: Our `tests/api.test.ts` acts as a "Stability Anchor". No change is merged unless it passes the full suite of integration tests, simulating real-world usage of all parametric triggers.
- **Fail-Safe Defaults**: In the event of an AI service timeout or error, the system defaults to a "Manual Review" state rather than crashing, ensuring delivery operations never halt.

---

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS (for premium UI/UX).
- **Backend**: Express.js, TypeScript.
- **Database**: SQLite (local dev) / PostgreSQL.
- **AI/ML Logic**: Custom behavioral analysis and risk modeling engines.
- **Integrations**: Mock Weather & Traffic APIs (OpenWeatherMap/TomTom inspired).

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn

### 2. Installation
```bash
git clone <repo-url>
cd suraksha-route
npm install
```

### 3. Running the App
**Start Backend:**
```bash
npm run server
```
**Start Frontend:**
```bash
npm run dev
```

---

## 🎬 Live Demo Instructions

1. **Dashboard**: Observe the "Risk Gauge" adjusting based on live weather and traffic signals.
2. **Simulate Disruption**: Toggle "Extreme Weather" in the simulation center. Watch the parametric engine trigger a claim and process an instant payout.
3. **Simulate Fraud**: Toggle "GPS Spoofing". Observe the behavioral AI flag the anomaly and block the transaction.

---

## 🌍 Impact

SurakshaRoute ensures that no delivery worker has to choose between their survival and their safety. Whether it's a flash flood or a sudden city-wide restriction, **SurakshaRoute has their back.**
# SurakshaRoute
