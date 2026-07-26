const express = require('express');
const router = express.Router();
const controller = require('../controllers/conductorController');
const roleCheck = require('../middleware/roleCheck');

router.post('/verify', roleCheck('conductor'), controller.verifyTicket);

module.exports = router;
