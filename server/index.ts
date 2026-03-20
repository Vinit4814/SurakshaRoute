import express from 'express';
import cors from 'cors';
import walletRouter from './routes/wallet';
import riskRouter from './routes/risk';
import fraudRouter from './routes/fraud';
import weatherRouter from './routes/weather';
import claimsRouter from './routes/claims';

import { createServer } from 'http';
import { initSocket } from './socket';
import { simulationService } from './services/SimulationService';

const app = express();
const server = createServer(app);
const port = 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/wallet', walletRouter);
app.use('/api/profile', walletRouter); // Profile is also in wallet router
app.use('/api/risk', riskRouter);
app.use('/api/fraud', fraudRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/claims', claimsRouter);

// Export for testing
export default app;

if (!process.env.TEST_ENV) {
  // Initialize WebSockets
  initSocket(server);

  // Start AI Simulation
  simulationService.start();

  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}
