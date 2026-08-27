import mongoose, { Schema, Document } from 'mongoose';

export interface IConductor extends Document {
  name: string;
  phone: string;
  password: string;
  busId: mongoose.Types.ObjectId;
  role: string;
}

const conductorSchema = new Schema<IConductor>({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
  role: { type: String, default: 'conductor' }
});

export default mongoose.model<IConductor>('Conductor', conductorSchema);
