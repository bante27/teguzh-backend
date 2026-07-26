const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  startPoint: { type: String, required: true },
  dropOffPoint: { type: String, required: true },
  baseTariff: { type: Number, required: true },
  distanceKm: { type: Number, default: 10.0 }
});

module.exports = mongoose.model('Route', routeSchema);
