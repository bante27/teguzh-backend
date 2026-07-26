const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketToken: { type: String, required: true, unique: true, index: true },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  startPoint: { type: String, required: true },
  dropOffPoint: { type: String, required: true },
  fareAmount: { type: Number, required: true },
  passengerPhone: { type: String, required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  telebirrTransId: { type: String, default: null },
  isVerifiedByConductor: { type: Boolean, default: false },
  verifiedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now, expires: 7200 } // TTL index: expires in 2 hours if not paid
});

module.exports = mongoose.model('Ticket', ticketSchema);
