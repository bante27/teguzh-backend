import Route from '../models/Route';

export interface FareCalculationResult {
  baseTariff: number;
  surgeMultiplier: number;
  fareAmount: number;
}

export const calculateFare = async (
  startPoint: string,
  dropOffPoint: string,
  timeOfDay: Date = new Date()
): Promise<FareCalculationResult> => {
  const route = await Route.findOne({ startPoint, dropOffPoint });
  const baseTariff = route ? route.baseTariff : 20.0; // Default base tariff if route not found

  const hours = timeOfDay.getHours();
  let surgeMultiplier = 1.0;

  // Peak hours surge pricing (7 AM - 9 AM, 5 PM - 7 PM)
  if ((hours >= 7 && hours <= 9) || (hours >= 17 && hours <= 19)) {
    surgeMultiplier = 1.25;
  }

  const finalFare = Math.round(baseTariff * surgeMultiplier * 100) / 100;
  return {
    baseTariff,
    surgeMultiplier,
    fareAmount: finalFare
  };
};
