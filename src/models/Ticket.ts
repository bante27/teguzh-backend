import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  ticketToken: string;
  busId: mongoose.Types.ObjectId;
  startPoint: string;
  dropOffPoint: string;
  fareAmount: number;
  passengerPhone: string;
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  telebirrTransId?: string | null;
  isVerifiedByConductor: boolean;
  verifiedAt?: Date | null;
  createdAt: Date;
}

const ticketSchema = new Schema<ITicket>({
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

export default mongoose.model<ITicket>('Ticket', ticketSchema);
