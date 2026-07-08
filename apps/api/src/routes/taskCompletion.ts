import { Router } from 'express';
import { completeTask } from '../services/taskCompletionService';

const router = Router();

router.post('/:taskId/complete', async (req, res) => {
  try {
    const userId = String(req.headers['x-user-id'] || '');
    const result = await completeTask(userId, req.params.taskId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
