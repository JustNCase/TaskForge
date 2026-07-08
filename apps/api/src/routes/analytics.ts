import { Router } from 'express';
import { getUserActivity, trackActivity } from '../services/analyticsService';

const router = Router();

router.get('/', async (req, res) => {
  const userId = String(req.headers['x-user-id'] || '');
  res.json(await getUserActivity(userId));
});

router.post('/track', async (req, res) => {
  const userId = String(req.headers['x-user-id'] || '');
  const event = String(req.body.event || 'unknown');
  res.json(await trackActivity(userId, event));
});

export default router;
