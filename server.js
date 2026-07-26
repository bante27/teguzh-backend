const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const security = require('./src/middleware/security');
const errorHandler = require('./src/middleware/errorHandler');

dotenv.config();
const app = express();

// Security and standard headers
app.use(security);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const passengerRoutes = require('./src/routes/passengerRoutes');
const conductorRoutes = require('./src/routes/conductorRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/passenger', passengerRoutes);
app.use('/api/conductor', conductorRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.json({ success: true, message: '🚀 Teguzh Live Production Gateway Active' });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`=========================================`);
        console.log(`🚀 Teguzh Backend Server running on port ${PORT}`);
        console.log(`=========================================`);
    });
});

module.exports = app;
