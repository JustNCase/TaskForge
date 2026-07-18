import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { createNotification, getNotifications, markAsRead } from '../services/notificationService';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const notifications = await getNotifications((req as any).user.id);
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const notification = await createNotification(
      (req as any).user.id,
      req.body.title || 'TaskForge Update',
      req.body.message || ''
    );
    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    await markAsRead((req as any).user.id, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
