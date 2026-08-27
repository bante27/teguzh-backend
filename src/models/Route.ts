import mongoose, { Schema, Document } from 'mongoose';

export interface IRoute extends Document {
  startPoint: string;
  dropOffPoint: string;
  baseTariff: number;
  distanceKm: number;
}

const routeSchema = new Schema<IRoute>({
  startPoint: { type: String, required: true },
  dropOffPoint: { type: String, required: true },
  baseTariff: { type: Number, required: true },
  distanceKm: { type: Number, default: 10.0 }
});

export default mongoose.model<IRoute>('Route', routeSchema);
