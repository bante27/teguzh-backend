const express = require('express');
const router = express.Router();
const controller = require('../controllers/passengerController');

router.post('/estimate-fare', controller.estimateFare);
router.post('/book', controller.bookTicket);
router.post('/telebirr-webhook', controller.telebirrWebhook);
router.get('/active', controller.getActiveTicket);

module.exports = router;
