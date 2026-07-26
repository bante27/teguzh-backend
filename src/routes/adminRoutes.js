const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminController');
const roleCheck = require('../middleware/roleCheck');

router.get('/dashboard', roleCheck('admin'), controller.dashboard);
router.post('/bus', roleCheck('admin'), controller.createBus);
router.post('/route', roleCheck('admin'), controller.createRoute);
router.post('/conductor', roleCheck('admin'), controller.createConductor);
router.post('/telebirr-callback', controller.telebirrCallback);

module.exports = router;
