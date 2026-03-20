import { Router } from 'express';
import { generateEnvironmentalData } from '../lib/ai/parametricTrigger';

const router = Router();

router.get('/', (req, res) => {
  const mode = (req.query.mode as any) || 'normal';
  const environment = generateEnvironmentalData(mode);
  res.json(environment);
});

export default router;
