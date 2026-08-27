"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.telebirrCallback = exports.createConductor = exports.createRoute = exports.createBus = exports.dashboard = void 0;
const Conductor_1 = __importDefault(require("../models/Conductor"));
const Bus_1 = __importDefault(require("../models/Bus"));
const Route_1 = __importDefault(require("../models/Route"));
const Ticket_1 = __importDefault(require("../models/Ticket"));
const mongoose_1 = __importDefault(require("mongoose"));
const dashboard = async (req, res, next) => {
    try {
        const totalTickets = await Ticket_1.default.countDocuments();
        const paidTickets = await Ticket_1.default.countDocuments({ paymentStatus: 'Paid' });
        const verifiedTickets = await Ticket_1.default.countDocuments({ isVerifiedByConductor: true });
        const totalBuses = await Bus_1.default.countDocuments();
        const totalConductors = await Conductor_1.default.countDocuments();
        const totalRoutes = await Route_1.default.countDocuments();
        const revenueResult = await Ticket_1.default.aggregate([
            { $match: { paymentStatus: 'Paid' } },
            { $group: { _id: null, totalRevenue: { $sum: '$fareAmount' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
        return res.status(200).json({
            success: true,
            stats: {
                totalTickets,
                paidTickets,
                verifiedTickets,
                totalBuses,
                totalConductors,
                totalRoutes,
                totalRevenue
            },
            message: 'Admin Dashboard Data Loaded Successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.dashboard = dashboard;
const createBus = async (req, res, next) => {
    try {
        const { plateNumber, driverName, capacity } = req.body;
        if (!plateNumber || !driverName || !capacity) {
            return res.status(400).json({ success: false, message: 'Missing plateNumber, driverName, or capacity' });
        }
        const bus = new Bus_1.default({ plateNumber, driverName, capacity });
        await bus.save();
        return res.status(201).json({ success: true, message: 'Bus created successfully', bus });
    }
    catch (error) {
        next(error);
    }
};
exports.createBus = createBus;
const createRoute = async (req, res, next) => {
    try {
        const { startPoint, dropOffPoint, baseTariff } = req.body;
        if (!startPoint || !dropOffPoint || baseTariff === undefined) {
            return res.status(400).json({ success: false, message: 'Missing startPoint, dropOffPoint, or baseTariff' });
        }
        const route = new Route_1.default({ startPoint, dropOffPoint, baseTariff });
        await route.save();
        return res.status(201).json({ success: true, message: 'Route created successfully', route });
    }
    catch (error) {
        next(error);
    }
};
exports.createRoute = createRoute;
const createConductor = async (req, res, next) => {
    try {
        const { name, phone, password, busId } = req.body;
        if (!name || !phone || !password) {
            return res.status(400).json({ success: false, message: 'Missing name, phone, or password' });
        }
        let validBusId = undefined;
        if (busId && mongoose_1.default.Types.ObjectId.isValid(busId)) {
            validBusId = busId;
        }
        const conductor = new Conductor_1.default({ name, phone, password, busId: validBusId });
        await conductor.save();
        return res.status(201).json({ success: true, message: 'Conductor created successfully', conductor });
    }
    catch (error) {
        next(error);
    }
};
exports.createConductor = createConductor;
const telebirrCallback = async (req, res, next) => {
    try {
        const { outTradeNo, tradeStatus, transactionId } = req.body;
        if (!outTradeNo) {
            return res.status(400).json({ success: false, message: 'Invalid callback payload' });
        }
        const ticket = await Ticket_1.default.findOne({ ticketToken: outTradeNo });
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found for callback' });
        }
        if (tradeStatus === 'Completed' || tradeStatus === 'SUCCESS' || tradeStatus === 'Paid') {
            ticket.paymentStatus = 'Paid';
        }
        else {
            ticket.paymentStatus = 'Failed';
        }
        await ticket.save();
        return res.status(200).json({ success: true, message: 'Callback processed successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.telebirrCallback = telebirrCallback;
