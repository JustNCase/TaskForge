import { Router } from 'express';
import { getProgress } from '../services/economyService';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const userId = String(req.headers['x-user-id'] || '');
    const progress = await getProgress(userId);
    res.json(progress);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
