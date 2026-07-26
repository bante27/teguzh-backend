const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketToken: { type: String, required: true, unique: true },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  startPoint: { type: String, required: true },
  dropOffPoint: { type: String, required: true },
  fareAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  passengerPhone: { type: String, required: true },
  isVerifiedByConductor: { type: Boolean, default: false },
  verifiedAt: { type: Date }
});

module.exports = mongoose.model('Ticket', ticketSchema);
