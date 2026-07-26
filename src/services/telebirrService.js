const crypto = require('crypto');
const axios = require('axios');
const https = require('https');

const agent = new https.Agent({ rejectUnauthorized: false });

const getPrivateKey = () => {
  let key = process.env.TELEBIRR_PRIVATE_KEY || '';
  key = key.replace(/\\n/g, '\n');
  if (!key.includes('BEGIN PRIVATE KEY')) {
    key = `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`;
  }
  return key;
};

const encryptAES = (data, keyStr) => {
  const key = Buffer.from(keyStr || process.env.TELEBIRR_APP_KEY || '', 'utf8');
  const cipher = crypto.createCipheriv('aes-128-cbc', key, Buffer.alloc(16, 0));
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const signPayload = (payload) => {
  const sortedKeys = Object.keys(payload).sort();
  const sortedString = sortedKeys
    .map(key => `${key}=${payload[key]}`)
    .join('&');

  const signer = crypto.createSign('SHA256');
  signer.update(sortedString);
  const signature = signer.sign(getPrivateKey(), 'base64');
  return signature;
};

const fetchFabricToken = async () => {
  const url = 'https://app.telebirr.com/ammapi/payment/service-open/v1/start/fabric-token';
  const response = await axios.post(url, {
    appId: process.env.TELEBIRR_APP_ID
  }, {
    headers: {
      'X-APP-KEY': process.env.TELEBIRR_APP_KEY,
      'Content-Type': 'application/json'
    },
    httpsAgent: agent,
    timeout: 5000
  });

  if (response.data && response.data.code === 0 && response.data.data) {
    return response.data.data.token;
  }
  throw new Error(response.data?.msg || 'Failed to fetch Fabric Token');
};

const createTelebirrOrder = async ({ outTradeNo, subject, totalAmount, returnUrl }) => {
  try {
    const token = await fetchFabricToken();

    const businessData = {
      appId: process.env.TELEBIRR_APP_ID,
      merchentId: process.env.TELEBIRR_MERCHANT_ID,
      merchentOrderId: outTradeNo,
      title: subject,
      totalAmount: totalAmount.toString(),
      transCurrency: 'ETB',
      notifyUrl: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/api/passenger/telebirr-webhook`,
      redirectUrl: returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:5000'}/api/passenger/success`,
      timestamp: Date.now().toString(),
      nonceStr: crypto.randomBytes(16).toString('hex')
    };

    const bizContent = encryptAES(businessData, process.env.TELEBIRR_APP_KEY);
    
    const requestPayload = {
      appId: process.env.TELEBIRR_APP_ID,
      bizContent: bizContent,
      charset: 'UTF-8',
      version: '1.0',
      signType: 'SHA256withRSA',
      timestamp: businessData.timestamp,
      nonceStr: businessData.nonceStr
    };

    requestPayload.sign = signPayload(requestPayload);

    const checkoutUrl = 'https://app.telebirr.com/ammapi/payment/service-open/v1/h5/checkout';
    const response = await axios.post(checkoutUrl, requestPayload, {
      headers: {
        'X-APP-KEY': process.env.TELEBIRR_APP_KEY,
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      httpsAgent: agent,
      timeout: 5000
    });

    if (response.data && response.data.code === 0 && response.data.data) {
      return {
        success: true,
        paymentUrl: response.data.data.toPayUrl || response.data.data.checkoutUrl
      };
    }

    throw new Error(response.data?.msg || 'Telebirr checkout initiation failed');
  } catch (error) {
    console.warn('⚠️ Telebirr live handshake dropped (ECONNRESET/Timeout). Falling back to local simulation page:', error.message);
    // Graceful Fallback as requested
    return {
      success: false,
      paymentUrl: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/api/passenger/payment-simulate-page?token=${outTradeNo}`
    };
  }
};

module.exports = {
  encryptAES,
  signPayload,
  fetchFabricToken,
  createTelebirrOrder,
  agent
};
