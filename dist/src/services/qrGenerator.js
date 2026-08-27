"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQRToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const generateQRToken = (ticketToken) => {
    const hash = crypto_1.default.createHash('sha256').update(ticketToken + Date.now().toString()).digest('hex');
    return `TEGUZH-TICKET-${hash.substring(0, 16).toUpperCase()}`;
};
exports.generateQRToken = generateQRToken;
