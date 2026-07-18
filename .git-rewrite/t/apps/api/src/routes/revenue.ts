import { Router } from 'express';
import { getRevenuePlans } from '../services/revenueService';

const router = Router();

router.get('/plans', async (_req, res) => {
  res.json(getRevenuePlans());
});

export default router;
