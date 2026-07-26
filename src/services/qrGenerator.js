const crypto = require('crypto');

const generateQRToken = (ticketToken) => {
  const hash = crypto.createHash('sha256').update(ticketToken + Date.now().toString()).digest('hex');
  return `TEGUZH-TICKET-${hash.substring(0, 16).toUpperCase()}`;
};

module.exports = { generateQRToken };
