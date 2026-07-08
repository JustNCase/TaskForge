import {Router} from 'express';
import {getMarketplaceItems} from '../services/marketplaceService';
const router=Router();
router.get('/',(_req,res)=>res.json(getMarketplaceItems()));
export default router;
