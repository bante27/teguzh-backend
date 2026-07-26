const Ticket = require('../models/Ticket');
const Bus = require('../models/Bus');
const dynamicFare = require('../services/dynamicFare');
const qrGenerator = require('../services/qrGenerator');
const telebirrService = require('../services/telebirrService');
const mongoose = require('mongoose');

exports.estimateFare = async (req, res, next) => {
  try {
    const { startPoint, dropOffPoint } = req.body;
    if (!startPoint || !dropOffPoint) {
      return res.status(400).json({ success: false, message: 'startPoint and dropOffPoint are required' });
    }
    const fareData = await dynamicFare.calculateFare(startPoint, dropOffPoint);
    return res.status(200).json({ success: true, ...fareData });
  } catch (error) {
    next(error);
  }
};

exports.bookTicket = async (req, res, next) => {
  try {
    const { startPoint, dropOffPoint, passengerPhone, busId } = req.body;

    if (!startPoint || !dropOffPoint || !passengerPhone || !busId) {
      return res.status(400).json({ success: false, message: 'Missing required booking fields (startPoint, dropOffPoint, passengerPhone, busId)' });
    }

    if (!mongoose.Types.ObjectId.isValid(busId)) {
      return res.status(400).json({ success: false, message: 'Invalid busId format' });
    }

    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    const fareData = await dynamicFare.calculateFare(startPoint, dropOffPoint);
    const ticketToken = `TGZ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const ticket = new Ticket({
      ticketToken,
      busId,
      startPoint,
      dropOffPoint,
      fareAmount: fareData.fareAmount,
      paymentStatus: 'Pending',
      passengerPhone,
      isVerifiedByConductor: false
    });

    await ticket.save();

    const orderResult = await telebirrService.createTelebirrOrder({
      outTradeNo: ticketToken,
      subject: `Bus Ticket: ${startPoint} to ${dropOffPoint}`,
      totalAmount: fareData.fareAmount,
      returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/api/passenger/success`
    });

    return res.status(200).json({
      success: true,
      ticketToken,
      fare: fareData.fareAmount,
      paymentUrl: orderResult.paymentUrl
    });
  } catch (error) {
    next(error);
  }
};

exports.telebirrWebhook = async (req, res, next) => {
  try {
    const { outTradeNo, tradeStatus, transactionId } = req.body;

    if (!outTradeNo) {
      return res.status(400).json({ code: "-1", message: "Invalid webhook payload" });
    }

    const ticket = await Ticket.findOne({ ticketToken: outTradeNo });
    if (!ticket) {
      return res.status(404).json({ code: "-1", message: "Ticket not found" });
    }

    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'Completed' || tradeStatus === 'SUCCESS') {
      ticket.paymentStatus = 'Paid';
      ticket.telebirrTransId = transactionId || 'TXN-' + Date.now();
    } else {
      ticket.paymentStatus = 'Failed';
    }

    await ticket.save();

    // Telebirr requires exact response code 0 for acknowledgment
    return res.status(200).json({ code: "0", message: "success" });
  } catch (error) {
    console.error('Telebirr Webhook Error:', error);
    return res.status(500).json({ code: "-1", message: error.message });
  }
};

exports.getActiveTicket = async (req, res, next) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Passenger phone is required' });
    }

    const ticket = await Ticket.findOne({ passengerPhone: phone, paymentStatus: 'Paid', isVerifiedByConductor: false })
      .sort({ createdAt: -1 })
      .populate('busId');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'No active paid tickets found' });
    }

    const qrCodeString = qrGenerator.generateQRToken(ticket.ticketToken);

    return res.status(200).json({
      success: true,
      ticket: {
        ticketToken: ticket.ticketToken,
        startPoint: ticket.startPoint,
        dropOffPoint: ticket.dropOffPoint,
        fareAmount: ticket.fareAmount,
        bus: ticket.busId,
        qrCodeString,
        createdAt: ticket.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};
