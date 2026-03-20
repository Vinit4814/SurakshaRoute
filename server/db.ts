import Database from 'better-sqlite3';
// Use require for better compatibility with some test environments if needed
// const Database = require('better-sqlite3');
import { join } from 'path';

const db = new Database(join(process.cwd(), 'suraksha.db'));

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    balance INTEGER DEFAULT 2500
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    userId TEXT,
    type TEXT,
    amount INTEGER,
    description TEXT,
    status TEXT,
    timestamp INTEGER,
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY,
    userId TEXT,
    status TEXT,
    reason TEXT,
    amount INTEGER,
    timestamp INTEGER,
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS fraud_logs (
    id TEXT PRIMARY KEY,
    userId TEXT,
    score INTEGER,
    status TEXT,
    signals TEXT,
    timestamp INTEGER,
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  INSERT OR IGNORE INTO users (id, name, balance) VALUES ('user_1', 'Delivery Partner', 2500);
`);

export default db;
