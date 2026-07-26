const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminController');
const roleCheck = require('../middleware/roleCheck');

router.get('/dashboard', roleCheck('admin'), controller.dashboard);
router.post('/telebirr-callback', controller.telebirrCallback);

module.exports = router;
