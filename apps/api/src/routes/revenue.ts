import { Router } from 'express';
import { getRevenuePlans, getRevenueMetrics } from '../services/revenueService';

const router = Router();

router.get('/plans', async (_req, res) => {
  res.json(getRevenuePlans());
});

router.get('/metrics', async (_req, res) => {
  try {
    const metrics = await getRevenueMetrics();
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
