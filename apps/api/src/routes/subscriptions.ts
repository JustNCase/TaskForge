import {Router} from 'express';
import {createSubscription,getSubscription} from '../services/subscriptionService';
const router=Router();
router.get('/',async(req,res)=>{
  try {
    const result = await getSubscription(String(req.headers['x-user-id']));
    res.json({ subscription: result });
  } catch (error) {
    res.status(500).json({error: (error as Error).message});
  }
});
router.post('/',async(req,res)=>{
  try {
    const result = await createSubscription(
      String(req.headers['x-user-id']),
      req.body.plan,
      req.body.paymentMethodId
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({error: (error as Error).message});
  }
});
export default router;
