import mongoose, { Schema, Document } from 'mongoose';

export interface IBus extends Document {
  plateNumber: string;
  driverName: string;
  capacity: number;
  latitude: number;
  longitude: number;
  lastUpdated: Date;
}

const busSchema = new Schema<IBus>({
  plateNumber: { type: String, required: true, unique: true },
  driverName: { type: String, required: true },
  capacity: { type: Number, required: true },
  latitude: { type: Number, default: 0.0 },
  longitude: { type: Number, default: 0.0 },
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model<IBus>('Bus', busSchema);
