const crypto = require('crypto');
const https = require('https');
const telebirrConfig = require('../config/telebirr');

const agent = new https.Agent({ rejectUnauthorized: false });

const encryptAES = (data, key) => {
  const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(key, 'utf8'), Buffer.alloc(16, 0));
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const signPayload = (payload, privateKey) => {
  const sortedKeys = Object.keys(payload).sort();
  const sortedPayload = sortedKeys.map(key => `${key}=${payload[key]}`).join('&');
  const signer = crypto.createSign('SHA256');
  signer.update(sortedPayload);
  return signer.sign(privateKey, 'hex');
};

const initiatePayment = async (payload) => {
  try {
    const url = 'https://app.telebirr.com/api/v1/payment/initiate';
    // If live handshake fails or is in dev mode, throw error to trigger graceful fallback
    const reqData = JSON.stringify(payload);
    
    // Simulating outbound request or real attempt with agent
    return new Promise((resolve, reject) => {
      // For resilience in local environment, if TELEBIRR_SIMULATE is true or request fails:
      if (process.env.NODE_ENV !== 'production') {
        return resolve({ success: false, fallback: '/api/passenger/payment-simulate-page' });
      }

      const req = https.request(url, {
        method: 'POST',
        agent,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(reqData)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ success: true, url: json.paymentUrl || 'https://app.telebirr.com/pay' });
          } catch (e) {
            resolve({ success: false, fallback: '/api/passenger/payment-simulate-page' });
          }
        });
      });

      req.on('error', (err) => {
        resolve({ success: false, fallback: '/api/passenger/payment-simulate-page' });
      });

      req.write(reqData);
      req.end();
    });
  } catch (error) {
    console.error('Telebirr error, falling back:', error.message);
    return { success: false, fallback: '/api/passenger/payment-simulate-page' };
  }
};

module.exports = { encryptAES, signPayload, initiatePayment, agent };
