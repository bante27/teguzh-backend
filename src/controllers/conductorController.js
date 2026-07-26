const Ticket = require('../models/Ticket');

exports.verifyTicket = async (req, res, next) => {
  try {
    const { ticketToken } = req.body;

    if (!ticketToken) {
      return res.status(400).json({ success: false, message: 'Ticket token is required' });
    }

    const ticket = await Ticket.findOne({ ticketToken });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Safety Invariant Violation: Ticket does not exist in registry' });
    }

    if (ticket.paymentStatus !== 'Paid') {
      return res.status(400).json({ success: false, message: `Safety Invariant Violation: Ticket payment status is '${ticket.paymentStatus}', must be 'Paid'` });
    }

    if (ticket.isVerifiedByConductor) {
      return res.status(400).json({ success: false, message: 'Safety Invariant Violation: Ticket has already been verified and used' });
    }

    ticket.isVerifiedByConductor = true;
    ticket.verifiedAt = new Date();
    await ticket.save();

    return res.status(200).json({
      success: true,
      message: 'Ticket successfully verified and authorized for boarding',
      ticket: {
        ticketToken: ticket.ticketToken,
        startPoint: ticket.startPoint,
        dropOffPoint: ticket.dropOffPoint,
        fareAmount: ticket.fareAmount,
        verifiedAt: ticket.verifiedAt
      }
    });
  } catch (error) {
    next(error);
  }
};
