import { Router } from 'express';
import { register, login, getSession } from '../lib/auth';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const data = await register(req.body.email, req.body.password);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const data = await login(req.body.email, req.body.password);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/session', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Missing token' });
    }

    const user = await getSession(token);
    res.json({ user });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

export default router;
