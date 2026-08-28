import { Router } from 'express';
import * as controller from '../controllers/passengerController';

const router = Router();

router.get('/book-page', controller.passengerBookPage);
router.post('/estimate-fare', controller.estimateFare);
router.post('/book', controller.bookTicket);
router.get('/success', controller.successPage);
router.get('/payment-simulate-page', controller.simulatePaymentPage);
router.post('/verify-simulate', controller.verifySimulate);
router.post('/telebirr-webhook', controller.telebirrWebhook);
router.get('/active', controller.getActiveTicket);

export default router;
