import { Router } from 'express';
import { generateAndSaveTask } from '../services/aiTaskPersistenceService';

const router = Router();

router.post('/generate', async (req, res) => {
  try {
    const userId = String(req.headers['x-user-id'] || '');
    const task = await generateAndSaveTask(
      userId,
      req.body.prompt || 'Create a productivity task'
    );
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
