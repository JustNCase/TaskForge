import { Router } from 'express';
import { createNotification, getNotifications } from '../services/notificationService';

const router = Router();

router.get('/', async (req, res) => {
  const userId = String(req.headers['x-user-id'] || '');
  res.json(await getNotifications(userId));
});

router.post('/', async (req, res) => {
  const userId = String(req.headers['x-user-id'] || '');
  const notification = await createNotification(
    userId,
    req.body.title || 'TaskForge Update',
    req.body.message || ''
  );
  res.json(notification);
});

export default router;
