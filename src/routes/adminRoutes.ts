import { Router } from 'express';
import * as controller from '../controllers/adminController';
import roleCheck from '../middleware/roleCheck';

const router = Router();

router.get('/dashboard', roleCheck('admin'), controller.dashboard);
router.post('/bus', roleCheck('admin'), controller.createBus);
router.post('/route', roleCheck('admin'), controller.createRoute);
router.post('/conductor', roleCheck('admin'), controller.createConductor);
router.post('/telebirr-callback', controller.telebirrCallback);

export default router;
