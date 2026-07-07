import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All task operations require an authenticated Supabase user.
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const user = (req as any).user;

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id);

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

router.post('/', async (req, res) => {
  const user = (req as any).user;

  const { title, difficulty = 1, reward = 10 } = req.body;

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title,
      difficulty,
      reward,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

router.patch('/:id/complete', async (req, res) => {
  const user = (req as any).user;

  const { data, error } = await supabase
    .from('tasks')
    .update({ completed: true })
    .eq('id', req.params.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

export default router;
