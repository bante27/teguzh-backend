import { Router } from 'express';
import * as controller from '../controllers/conductorController';
import roleCheck from '../middleware/roleCheck';

const router = Router();

router.post('/verify', roleCheck('conductor'), controller.verifyTicket);
router.post('/location', roleCheck('conductor'), controller.updateBusLocation);
router.get('/location/:busId', controller.getBusLocation);

export default router;
