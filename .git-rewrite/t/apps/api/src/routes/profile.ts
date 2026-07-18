import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const userId = String(req.headers['x-user-id'] || '');

  res.json({
    id: userId,
    level: 1,
    xp: 0,
  });
});

export default router;
