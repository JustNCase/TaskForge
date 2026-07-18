import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { supabase } from '../lib/supabase';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: economy } = await supabase
      .from('economy')
      .select('*')
      .eq('user_id', userId)
      .single();

    res.json({
      id: userId,
      displayName: profile?.display_name || '',
      level: economy?.level || 1,
      xp: economy?.xp || 0,
      coins: economy?.coins || 0,
      createdAt: profile?.created_at || null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
