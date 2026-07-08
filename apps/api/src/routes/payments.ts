import {Router} from 'express';
import {createPaymentIntent} from '../services/paymentService';
const router=Router();
router.post('/intent',(req,res)=>res.json(createPaymentIntent(req.body.plan)));
export default router;
