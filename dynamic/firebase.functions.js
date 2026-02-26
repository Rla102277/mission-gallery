import { onRequest } from 'firebase-functions/v2/https';
import { app, initializeDatabase } from './server/index.js';

let initializationPromise;

const ensureInitialized = () => {
  if (!initializationPromise) {
    initializationPromise = initializeDatabase();
  }
  return initializationPromise;
};

export const api = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '512MiB',
  },
  async (req, res) => {
    try {
      await ensureInitialized();
      app(req, res);
    } catch (error) {
      console.error('Function initialization failed:', error);
      res.status(500).json({ error: 'Backend initialization failed' });
    }
  }
);
