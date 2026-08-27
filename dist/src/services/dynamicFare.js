"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateFare = void 0;
const Route_1 = __importDefault(require("../models/Route"));
const calculateFare = async (startPoint, dropOffPoint, timeOfDay = new Date()) => {
    const route = await Route_1.default.findOne({ startPoint, dropOffPoint });
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
exports.calculateFare = calculateFare;
