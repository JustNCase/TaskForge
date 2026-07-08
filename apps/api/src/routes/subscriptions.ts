import {Router} from 'express';
import {createSubscription,getSubscription} from '../services/subscriptionService';
const router=Router();
router.get('/',async(req,res)=>res.json(await getSubscription(String(req.headers['x-user-id']))));
router.post('/',async(req,res)=>res.json(await createSubscription(String(req.headers['x-user-id']),req.body.plan)));
export default router;
