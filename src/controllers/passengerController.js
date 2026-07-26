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

exports.passengerBookPage = async (req, res, next) => {
  try {
    const busId = req.query.busId || '';
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Teguzh Smart Bus Booking</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f2f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
              .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); width: 100%; max-width: 420px; }
              h2 { color: #1a73e8; text-align: center; margin-bottom: 5px; }
              p.subtitle { text-align: center; color: #666; font-size: 14px; margin-bottom: 20px; }
              .form-group { margin-bottom: 15px; }
              label { display: block; margin-bottom: 6px; font-weight: 600; font-size: 14px; color: #333; }
              input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
              button { background: #008751; color: white; border: none; padding: 12px; width: 100%; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background 0.3s; margin-top: 10px; }
              button:hover { background: #006c40; }
          </style>
      </head>
      <body>
          <div class="card">
              <h2>Teguzh Bus Ticketing</h2>
              <p class="subtitle">Scan & Book Your Ride Instantly</p>
              <form id="bookingForm">
                  <div class="form-group">
                      <label>Bus ID / QR Code ID</label>
                      <input type="text" id="busId" name="busId" value="${busId}" required placeholder="Enter Bus MongoDB ObjectId" />
                  </div>
                  <div class="form-group">
                      <label>Start Point</label>
                      <input type="text" id="startPoint" name="startPoint" required placeholder="e.g., Bole" />
                  </div>
                  <div class="form-group">
                      <label>Drop-Off Point</label>
                      <input type="text" id="dropOffPoint" name="dropOffPoint" required placeholder="e.g., Piasa" />
                  </div>
                  <div class="form-group">
                      <label>Passenger Phone Number</label>
                      <input type="text" id="passengerPhone" name="passengerPhone" required placeholder="e.g., +251911223344" />
                  </div>
                  <button type="submit">Proceed to Telebirr Payment</button>
              </form>
          </div>
          <script>
              document.getElementById('bookingForm').addEventListener('submit', async (e) => {
                  e.preventDefault();
                  const data = {
                      busId: document.getElementById('busId').value,
                      startPoint: document.getElementById('startPoint').value,
                      dropOffPoint: document.getElementById('dropOffPoint').value,
                      passengerPhone: document.getElementById('passengerPhone').value
                  };
                  try {
                      const res = await fetch('/api/passenger/book', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(data)
                      });
                      const json = await res.json();
                      if (json.success && json.paymentUrl) {
                          window.location.href = json.paymentUrl;
                      } else {
                          alert('Booking failed: ' + (json.message || 'Unknown error'));
                      }
                  } catch (err) {
                      alert('Network error during booking');
                  }
              });
          </script>
      </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    next(error);
  }
};

exports.bookTicket = async (req, res, next) => {
  try {
    const { startPoint, dropOffPoint, passengerPhone, busId } = req.body;

    if (!startPoint || !dropOffPoint || !passengerPhone || !busId) {
      return res.status(400).json({ success: false, message: 'Missing required booking fields' });
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
      returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/api/passenger/success?token=${ticketToken}`
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

exports.successPage = async (req, res, next) => {
  try {
    const { token } = req.query;
    const ticket = await Ticket.findOne({ ticketToken: token });

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Teguzh - Payment Success</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #e6f4ea; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
              .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; max-width: 420px; width: 100%; }
              h2 { color: #137333; margin-bottom: 5px; }
              .clock { font-size: 20px; font-weight: bold; color: #555; margin: 15px 0; background: #f1f3f4; padding: 10px; border-radius: 6px; }
              .token { background: #e8f0fe; color: #1a73e8; padding: 12px; font-family: monospace; font-size: 18px; font-weight: bold; border-radius: 6px; margin: 20px 0; }
              .details { text-align: left; background: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 14px; color: #444; }
          </style>
      </head>
      <body>
          <div class="card">
              <h2>Payment Successful!</h2>
              <p>Telebirr Transaction Confirmed</p>
              <div class="clock" id="liveClock">Loading time...</div>
              <div class="token">${ticket ? ticket.ticketToken : (token || 'N/A')}</div>
              <div class="details">
                  <p><strong>Status:</strong> <span style="color: #137333; font-weight: bold;">PAID</span></p>
                  <p><strong>Route:</strong> ${ticket ? ticket.startPoint + ' ➔ ' + ticket.dropOffPoint : 'N/A'}</p>
                  <p><strong>Amount Paid:</strong> ${ticket ? ticket.fareAmount + ' ETB' : 'N/A'}</p>
                  <p><strong>Transaction Time:</strong> <span id="txnTime">${new Date().toLocaleString()}</span></p>
              </div>
              <p style="margin-top: 20px; font-size: 13px; color: #666;">Show this digital token to the bus conductor upon boarding.</p>
          </div>
          <script>
              function updateClock() {
                  const now = new Date();
                  document.getElementById('liveClock').innerText = now.toLocaleTimeString();
              }
              setInterval(updateClock, 1000);
              updateClock();
          </script>
      </body>
      </html>
    `;
    res.send(html);
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
          <title>Telebirr Secure Checkout Simulation</title>
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
              <h2>Telebirr Checkout Portal</h2>
              <p>Sandbox Simulation Gateway</p>
              <div class="amount">${ticket.fareAmount} ETB</div>
              <div class="details">
                  <p><strong>Token:</strong> ${ticket.ticketToken}</p>
                  <p><strong>Route:</strong> ${ticket.startPoint} ➔ ${ticket.dropOffPoint}</p>
                  <p><strong>Phone:</strong> ${ticket.passengerPhone}</p>
              </div>
              <form action="/api/passenger/verify-simulate" method="POST">
                  <input type="hidden" name="token" value="${ticket.ticketToken}" />
                  <button type="submit">Pay Now & Redirect</button>
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
    ticket.telebirrTransId = 'SIM-TXN-' + Date.now();
    await ticket.save();

    // Redirect to real success page with live time clock
    return res.redirect(`/api/passenger/success?token=${token}`);
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
