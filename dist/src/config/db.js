"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const conn = await mongoose_1.default.connect(process.env.MONGO_URI);
        console.log(`=========================================`);
        console.log(`✨ MongoDB Connected Successfully!`);
        console.log(`📡 Host: ${conn.connection.host}`);
        console.log(`🗃️ Database Name: ${conn.connection.name}`);
        console.log(`=========================================`);
    }
    catch (error) {
        console.error(`❌ Database Connection Failure: ${error.message}`);
        process.exit(1);
    }
};
exports.default = connectDB;
