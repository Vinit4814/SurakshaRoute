import { Router } from 'express';
import db from '../db';
import { calculateRiskScore } from '../lib/ai/riskAssessment';
import { createTransaction } from '../lib/ai/wallet';

const router = Router();

router.post('/assessment', (req, res) => {
  const userId = 'user_1';
  const input = req.body;
  const result = calculateRiskScore(input);

  const tx = createTransaction('PREMIUM_PAID', -result.weeklyPremium, `Weekly premium (Risk: ${result.riskLevel})`);
  
  const insertTx = db.prepare(`
    INSERT INTO transactions (id, userId, type, amount, description, status, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertTx.run(tx.id, userId, tx.type, tx.amount, tx.description, tx.status, tx.timestamp);

  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(result.weeklyPremium, userId);

  res.json(result);
});

export default router;
