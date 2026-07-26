const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  startPoint: { type: String, required: true },
  dropOffPoint: { type: String, required: true },
  baseTariff: { type: Number, required: true }
});

module.exports = mongoose.model('Route', routeSchema);
