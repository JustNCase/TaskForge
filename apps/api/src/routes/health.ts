import {Router} from 'express';
import {getHealthStatus} from '../services/monitoringService';

const router=Router();

router.get('/',(_req,res)=>{
 res.json({services:getHealthStatus()});
});

export default router;
