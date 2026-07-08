import { Router } from 'express';
import { runTaskForgeAgent } from '../services/aiAgentService';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const userId = String(req.headers['x-user-id'] || '');
    const result = await runTaskForgeAgent({
      userId,
      message: req.body.message || '',
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
