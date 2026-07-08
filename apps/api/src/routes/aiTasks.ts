import { Router } from 'express';
import { generateTask } from '../services/aiTaskService';

const router = Router();

router.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    const task = generateTask(prompt || 'Create a new productivity task');
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
