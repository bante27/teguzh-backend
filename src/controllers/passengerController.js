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
              h2 { color: #008751; text-align: center; margin-bottom: 5px; }
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
              <p class="subtitle">Scan QR & Book Your Ride via Telebirr</p>
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
                  <button type="submit">Pay with Telebirr</button>
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
          <title>Teguzh - Payment Success & Dashboard</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #e6f4ea; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
              .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; max-width: 440px; width: 100%; animation: fadeIn 0.8s ease-in-out; }
              @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
              .success-icon { font-size: 50px; color: #137333; margin-bottom: 10px; }
              h2 { color: #137333; margin-bottom: 5px; }
              .clock { font-size: 22px; font-weight: bold; color: #008751; margin: 15px 0; background: #e8f5e9; padding: 12px; border-radius: 8px; border: 1px dashed #008751; }
              .token { background: #f1f3f4; color: #333; padding: 12px; font-family: monospace; font-size: 18px; font-weight: bold; border-radius: 6px; margin: 20px 0; }
              .details { text-align: left; background: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 14px; color: #444; }
          </style>
      </head>
      <body>
          <div class="card">
              <div class="success-icon">✔</div>
              <h2>Payment Successful!</h2>
              <p>Telebirr H5 Secure Transaction Verified</p>
              <div class="clock" id="liveClock">00:00:00 AM</div>
              <div class="token">${ticket ? ticket.ticketToken : (token || 'N/A')}</div>
              <div class="details">
                  <p><strong>Status:</strong> <span style="color: #137333; font-weight: bold;">PAID & CONFIRMED</span></p>
                  <p><strong>Route:</strong> ${ticket ? ticket.startPoint + ' ➔ ' + ticket.dropOffPoint : 'N/A'}</p>
                  <p><strong>Fare Amount:</strong> ${ticket ? ticket.fareAmount + ' ETB' : 'N/A'}</p>
                  <p><strong>Transaction ID:</strong> ${ticket ? (ticket.telebirrTransId || 'TB-H5-TXN-' + Date.now()) : 'N/A'}</p>
                  <p><strong>Completed At:</strong> <span id="txnTime"></span></p>
              </div>
              <p style="margin-top: 20px; font-size: 13px; color: #666;">Show this verified pass and active clock to the conductor.</p>
          </div>
          <script>
              const now = new Date();
              document.getElementById('txnTime').innerText = now.toLocaleString();
              function updateClock() {
                  const d = new Date();
                  document.getElementById('liveClock').innerText = d.toLocaleTimeString();
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
          <title>Telebirr H5 Animated Checkout</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f2f5; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .card { background: white; padding: 35px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; animation: slideUp 0.5s ease-out; }
              @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
              .logo { width: 60px; height: 60px; background: #008751; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin: 0 auto 15px auto; }
              h2 { color: #008751; margin-bottom: 5px; }
              .amount { font-size: 32px; font-weight: bold; color: #222; margin: 15px 0; }
              .clock { font-size: 16px; color: #666; margin-bottom: 20px; font-family: monospace; background: #f8f9fa; padding: 8px; border-radius: 6px; }
              .details { text-align: left; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; color: #555; }
              button { background: #008751; color: white; border: none; padding: 14px 20px; width: 100%; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background 0.3s; }
              button:hover { background: #006c40; }
              .spinner { display: none; width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: white; animation: spin 1s ease-in-out infinite; margin: 0 auto; }
              @keyframes spin { to { transform: rotate(360deg); } }
          </style>
      </head>
      <body>
          <div class="card">
              <div class="logo">📱</div>
              <h2>Telebirr H5 Checkout</h2>
              <p>Secure Bus Fare Payment</p>
              <div class="amount">${ticket.fareAmount} ETB</div>
              <div class="clock" id="payClock">00:00:00 AM</div>
              <div class="details">
                  <p><strong>Ticket Token:</strong> ${ticket.ticketToken}</p>
                  <p><strong>Route:</strong> ${ticket.startPoint} ➔ ${ticket.dropOffPoint}</p>
                  <p><strong>Phone:</strong> ${ticket.passengerPhone}</p>
              </div>
              <form id="payForm" action="/api/passenger/verify-simulate" method="POST">
                  <input type="hidden" name="token" value="${ticket.ticketToken}" />
                  <button type="submit" id="payBtn">
                      <span id="btnText">Confirm & Pay with Telebirr</span>
                      <div class="spinner" id="spinner"></div>
                  </button>
              </form>
          </div>
          <script>
              function updateClock() {
                  const d = new Date();
                  document.getElementById('payClock').innerText = d.toLocaleTimeString();
              }
              setInterval(updateClock, 1000);
              updateClock();

              document.getElementById('payForm').addEventListener('submit', function() {
                  document.getElementById('btnText').style.display = 'none';
                  document.getElementById('spinner').style.display = 'block';
                  document.getElementById('payBtn').disabled = true;
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
    ticket.telebirrTransId = 'TB-H5-TXN-' + Date.now();
    await ticket.save();

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
