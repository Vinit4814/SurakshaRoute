import { Router } from 'express';
import db from '../db';
import { checkAutoTrigger } from '../lib/ai/parametricTrigger';
import { detectFraud } from '../lib/ai/fraudDetection';
import { createTransaction, processPayout } from '../lib/ai/wallet';

const router = Router();

router.post('/trigger', (req, res) => {
  const userId = 'user_1';
  const { env, fraudInput, demoMode } = req.body;
  
  const trigger = checkAutoTrigger(env, true);
  if (!trigger.triggered) {
    return res.json({ triggered: false });
  }

  const fraudResult = detectFraud(fraudInput);
  const payout = processPayout(fraudResult.trustScore, trigger.payoutAmount, fraudResult.status);

  let status = 'none';
  let payoutStatus = '';

  if (payout.status === 'INSTANT') {
    status = 'approved';
    payoutStatus = 'Instant payout';
    const tx = createTransaction('PAYOUT', payout.amount!, trigger.reason);
    db.prepare(`
      INSERT INTO transactions (id, userId, type, amount, description, status, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(tx.id, userId, tx.type, tx.amount, tx.description, tx.status, tx.timestamp);
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(payout.amount!, userId);
  } else if (payout.status === 'DELAYED') {
    status = 'review';
    payoutStatus = `Review: ${payout.estimatedTime}`;
    const tx = createTransaction('PAYOUT', trigger.payoutAmount, trigger.reason, 'PENDING');
    db.prepare(`
      INSERT INTO transactions (id, userId, type, amount, description, status, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(tx.id, userId, tx.type, tx.amount, tx.description, tx.status, tx.timestamp);
  } else {
    status = 'flagged';
    payoutStatus = 'Blocked';
    const tx = createTransaction('PAYOUT_BLOCKED', 0, 'Payout blocked — fraud suspected', 'BLOCKED');
    db.prepare(`
        INSERT INTO transactions (id, userId, type, amount, description, status, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(tx.id, userId, tx.type, tx.amount, tx.description, tx.status, tx.timestamp);
  }

  res.json({
    triggered: true,
    status,
    reason: trigger.reason,
    amount: trigger.payoutAmount,
    payoutStatus
  });
});

export default router;
