import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { addReward, getProgress } from '../services/economyService';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    res.json(await getProgress((req as any).user.id));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reward', async (req, res) => {
  try {
    const { xp = 0, coins = 0 } = req.body;
    res.json(await addReward((req as any).user.id, xp, coins));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
