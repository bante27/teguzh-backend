const express = require('express');
const router = express.Router();
const controller = require('../controllers/passengerController');

router.post('/book', controller.bookTicket);
router.get('/payment-simulate-page', controller.simulatePaymentPage);
router.post('/verify-simulate', controller.verifySimulate);

module.exports = router;
