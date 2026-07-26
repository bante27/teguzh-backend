const express = require('express');
const router = express.Router();
const controller = require('../controllers/passengerController');

router.get('/book-page', controller.passengerBookPage);
router.post('/estimate-fare', controller.estimateFare);
router.post('/book', controller.bookTicket);
router.get('/success', controller.successPage);
router.get('/payment-simulate-page', controller.simulatePaymentPage);
router.post('/verify-simulate', controller.verifySimulate);
router.post('/telebirr-webhook', controller.telebirrWebhook);
router.get('/active', controller.getActiveTicket);

module.exports = router;
