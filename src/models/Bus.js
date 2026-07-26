const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  plateNumber: { type: String, required: true, unique: true },
  driverName: { type: String, required: true },
  capacity: { type: Number, required: true }
});

module.exports = mongoose.model('Bus', busSchema);
