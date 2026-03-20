import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (req, res) => {
  const userId = 'user_1';
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  const transactions = db.prepare('SELECT * FROM transactions WHERE userId = ? ORDER BY timestamp DESC').all(userId);
  res.json({ balance: user.balance, transactions });
});

router.get('/profile', (req, res) => {
  const userId = 'user_1';
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  res.json(user);
});

export default router;
