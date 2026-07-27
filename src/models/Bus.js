const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  plateNumber: { type: String, required: true, unique: true },
  driverName: { type: String, required: true },
  capacity: { type: Number, required: true },
  latitude: { type: Number, default: 0.0 },
  longitude: { type: Number, default: 0.0 },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bus', busSchema);
