const Ticket = require('../models/Ticket');
const Bus = require('../models/Bus');
const dynamicFare = require('../services/dynamicFare');
const qrGenerator = require('../services/qrGenerator');
const telebirrService = require('../services/telebirrService');

exports.bookTicket = async (req, res, next) => {
  try {
    const { startPoint, dropOffPoint, passengerPhone, busId } = req.body;

    if (!startPoint || !dropOffPoint || !passengerPhone || !busId) {
      return res.status(400).json({ success: false, message: 'Missing required booking fields' });
    }

    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    const fareData = await dynamicFare.calculateFare(startPoint, dropOffPoint);
    const ticketToken = qrGenerator.generateQRToken(passengerPhone + Date.now());

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

    const paymentPayload = {
      outTradeNo: ticketToken,
      subject: `Bus Ticket from ${startPoint} to ${dropOffPoint}`,
      totalAmount: fareData.fareAmount.toString(),
      returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/api/passenger/payment-simulate-page?token=${ticketToken}`
    };

    const paymentResult = await telebirrService.initiatePayment(paymentPayload);

    if (paymentResult.success) {
      return res.status(200).json({
        success: true,
        ticketToken,
        fare: fareData.fareAmount,
        paymentUrl: paymentResult.url
      });
    } else {
      return res.status(200).json({
        success: true,
        ticketToken,
        fare: fareData.fareAmount,
        message: 'Telebirr live gateway unavailable. Use simulation fallback.',
        fallbackUrl: `/api/passenger/payment-simulate-page?token=${ticketToken}`
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.simulatePaymentPage = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).send('<h3>Error: Missing Ticket Token</h3>');
    }

    const ticket = await Ticket.findOne({ ticketToken: token });
    if (!ticket) {
      return res.status(404).send('<h3>Error: Ticket not found</h3>');
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Telebirr Sandbox Simulation Payment</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f2f5; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; }
              h2 { color: #1a73e8; margin-bottom: 10px; }
              .amount { font-size: 28px; font-weight: bold; color: #333; margin: 20px 0; }
              .details { text-align: left; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; color: #555; }
              button { background: #008751; color: white; border: none; padding: 12px 20px; width: 100%; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background 0.3s; }
              button:hover { background: #006c40; }
          </style>
      </head>
      <body>
          <div class="card">
              <h2>Telebirr Secure Checkout</h2>
              <p>Simulating Payment Gateway</p>
              <div class="amount">${ticket.fareAmount} ETB</div>
              <div class="details">
                  <p><strong>Token:</strong> ${ticket.ticketToken}</p>
                  <p><strong>Route:</strong> ${ticket.startPoint} ➔ ${ticket.dropOffPoint}</p>
                  <p><strong>Phone:</strong> ${ticket.passengerPhone}</p>
              </div>
              <form action="/api/passenger/verify-simulate" method="POST">
                  <input type="hidden" name="token" value="${ticket.ticketToken}" />
                  <button type="submit">Authorize Payment (Sandbox)</button>
              </form>
          </div>
      </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    next(error);
  }
};

exports.verifySimulate = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Missing token' });
    }

    const ticket = await Ticket.findOne({ ticketToken: token });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    ticket.paymentStatus = 'Paid';
    await ticket.save();

    const successHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Payment Successful</title>
          <style>
              body { font-family: sans-serif; background: #e6f4ea; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
              h2 { color: #137333; }
              .token { background: #f1f3f4; padding: 10px; font-family: monospace; font-size: 16px; border-radius: 6px; margin: 20px 0; }
          </style>
      </head>
      <body>
          <div class="card">
              <h2>Payment Successful!</h2>
              <p>Your ticket has been confirmed and paid via Telebirr Sandbox.</p>
              <div class="token">${ticket.ticketToken}</div>
              <p>Show this token or QR code to the conductor upon boarding.</p>
          </div>
      </body>
      </html>
    `;
    res.send(successHtml);
  } catch (error) {
    next(error);
  }
};
