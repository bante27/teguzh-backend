const mongoose = require('mongoose');

const conductorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
  role: { type: String, default: 'conductor' }
});

module.exports = mongoose.model('Conductor', conductorSchema);
