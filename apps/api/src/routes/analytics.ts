import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getUserActivity, trackActivity } from '../services/analyticsService';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const result = await getUserActivity((req as any).user.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/track', async (req, res) => {
  try {
    const { event, metadata } = req.body;
    const result = await trackActivity(
      (req as any).user.id,
      event || 'unknown',
      metadata || {}
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
