import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getMarketplaceItems, getUserPurchases, buyItem } from '../services/marketplaceService';

const router = Router();
router.use(authMiddleware);

router.get('/', async (_req, res) => {
  try {
    const items = await getMarketplaceItems();
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/my', async (req, res) => {
  try {
    const purchases = await getUserPurchases((req as any).user.id);
    res.json(purchases);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/buy/:id', async (req, res) => {
  try {
    const result = await buyItem((req as any).user.id, req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
