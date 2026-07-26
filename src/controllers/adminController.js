const Admin = require('../models/Admin');
const Conductor = require('../models/Conductor');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Ticket = require('../models/Ticket');

exports.dashboard = async (req, res, next) => {
  try {
    const totalTickets = await Ticket.countDocuments();
    const paidTickets = await Ticket.countDocuments({ paymentStatus: 'Paid' });
    const verifiedTickets = await Ticket.countDocuments({ isVerifiedByConductor: true });
    const totalBuses = await Bus.countDocuments();
    const totalConductors = await Conductor.countDocuments();
    const totalRoutes = await Route.countDocuments();

    const revenueResult = await Ticket.aggregate([
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
  } catch (error) {
    next(error);
  }
};

exports.telebirrCallback = async (req, res, next) => {
  try {
    const { outTradeNo, tradeStatus, transactionId } = req.body;
    
    if (!outTradeNo) {
      return res.status(400).json({ success: false, message: 'Invalid callback payload' });
    }

    const ticket = await Ticket.findOne({ ticketToken: outTradeNo });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found for callback' });
    }

    if (tradeStatus === 'Completed' || tradeStatus === 'SUCCESS' || tradeStatus === 'Paid') {
      ticket.paymentStatus = 'Paid';
    } else {
      ticket.paymentStatus = 'Failed';
    }

    await ticket.save();

    return res.status(200).json({ success: true, message: 'Callback processed successfully' });
  } catch (error) {
    next(error);
  }
};
