import {Router} from 'express';
import {createPaymentIntent} from '../services/paymentService';
const router=Router();
router.post('/intent',async(req,res)=>{
  try {
    const result = await createPaymentIntent(req.body.plan, String(req.headers['x-user-id']));
    res.json(result);
  } catch (error) {
    res.status(500).json({error: (error as Error).message});
  }
});
export default router;
