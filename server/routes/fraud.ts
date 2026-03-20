import { Router } from 'express';
import { detectFraud } from '../lib/ai/fraudDetection';

const router = Router();

router.post('/check', (req, res) => {
  const input = req.body;
  const result = detectFraud(input);
  res.json(result);
});

export default router;
